import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, Post, Put, Query, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles, MANAGER_ROLES, hasAnyRole } from '../common/roles';
import { NotificationsService } from '../notifications/notifications.service';

const uploadStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
});

export const CREATIVE_STATUSES = ['brief', 'in_progress', 'internal_review', 'changes_requested', 'client_review', 'approved', 'delivered', 'cancelled'];

@Injectable()
export class CreativesService {
  constructor(
    protected prisma: PrismaService,
    protected notifications: NotificationsService,
  ) {}

  protected model(): any { return this.prisma.creativeRequest; }
  protected versionModel(): any { return this.prisma.creativeVersion; }
  protected notifPrefix() { return 'creative'; }

  isManager(user: any) { return hasAnyRole(user, MANAGER_ROLES); }

  async list(organizationId: string, query: any, user: any) {
    const { status, departmentId, assigneeId, search, page = 1, limit = 50 } = query;
    const where: any = { organizationId };
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { brief: { contains: search, mode: 'insensitive' } }];
    // Non-managers only see items they created or are assigned to
    if (!this.isManager(user)) {
      where.AND = [{ OR: [{ assigneeId: user.id }, { createdById: user.id }] }];
    }
    const [items, total] = await Promise.all([
      this.model().findMany({
        where,
        include: { department: { select: { id: true, name: true, color: true } }, versions: { orderBy: { version: 'desc' }, take: 1 }, _count: { select: { versions: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      this.model().count({ where }),
    ]);
    return { items, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) } };
  }

  async detail(id: string, organizationId: string) {
    const item = await this.model().findFirst({
      where: { id, organizationId },
      include: { department: true, versions: { orderBy: { version: 'desc' } } },
    });
    if (!item) throw new NotFoundException('Request not found');
    return item;
  }

  async create(data: any, user: any) {
    const item = await this.model().create({
      data: {
        title: data.title,
        brief: data.brief,
        dimensions: data.dimensions,
        format: data.format,
        requirements: data.requirements,
        sourceLink: data.sourceLink,
        priority: data.priority || 'medium',
        deadline: data.deadline ? new Date(data.deadline) : null,
        projectId: data.projectId || null,
        departmentId: data.departmentId || null,
        taskId: data.taskId || null,
        assigneeId: data.assigneeId || null,
        reviewerId: data.reviewerId || null,
        referenceLinks: data.referenceLinks,
        status: data.assigneeId ? 'in_progress' : 'brief',
        organizationId: user.organizationId,
        createdById: user.id,
      },
    });
    if (data.assigneeId && data.assigneeId !== user.id) {
      await this.notifications.notify(data.assigneeId, `${this.notifPrefix()}_assigned`, 'New creative request', `"${item.title}" was assigned to you`, `/${this.notifPrefix()}`);
    }
    return this.detail(item.id, user.organizationId);
  }

  async update(id: string, data: any, user: any) {
    const item = await this.detail(id, user.organizationId);
    if (!this.isManager(user) && item.createdById !== user.id && item.assigneeId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    const updated = await this.model().update({
      where: { id },
      data: {
        title: data.title, brief: data.brief, dimensions: data.dimensions, format: data.format,
        requirements: data.requirements, sourceLink: data.sourceLink, priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        assigneeId: data.assigneeId, reviewerId: data.reviewerId, departmentId: data.departmentId,
        projectId: data.projectId, status: data.status,
      },
    });
    if (data.assigneeId && data.assigneeId !== item.assigneeId) {
      await this.notifications.notify(data.assigneeId, `${this.notifPrefix()}_assigned`, 'Assigned to you', `"${item.title}"`, `/${this.notifPrefix()}`);
    }
    return updated;
  }

  async uploadVersion(id: string, file: { fileUrl?: string; externalUrl?: string; fileName?: string; mimeType?: string; size?: number; notes?: string; duration?: number }, user: any) {
    const item = await this.detail(id, user.organizationId);
    if (!this.isManager(user) && item.assigneeId !== user.id) throw new ForbiddenException('Only the assignee can upload versions');
    const lastVersion = item.versions[0]?.version ?? 0;
    const version = await this.versionModel().create({
      data: {
        requestId: id,
        version: lastVersion + 1,
        fileUrl: file.fileUrl,
        externalUrl: file.externalUrl,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
        notes: file.notes,
        duration: file.duration,
        status: 'submitted',
        uploadedById: user.id,
      },
    });
    await this.model().update({ where: { id }, data: { status: 'internal_review' } });
    // Notify reviewers
    const reviewers = [item.reviewerId, item.createdById].filter(Boolean) as string[];
    const managers = await this.notifications.userIdsWithRoles(user.organizationId, MANAGER_ROLES);
    await this.notifications.notifyMany(
      [...new Set([...reviewers, ...managers])].filter((r) => r !== user.id),
      `${this.notifPrefix()}_submitted`,
      'Work submitted for approval',
      `Version ${version.version} of "${item.title}" is ready for review`,
      `/${this.notifPrefix()}`,
    );
    return version;
  }

  async reviewVersion(requestId: string, versionId: string, action: 'approve' | 'reject' | 'changes', feedback: string | undefined, user: any) {
    if (!this.isManager(user)) throw new ForbiddenException('Only managers can review');
    const item = await this.detail(requestId, user.organizationId);
    const version = await this.versionModel().findFirst({ where: { id: versionId, requestId } });
    if (!version) throw new NotFoundException('Version not found');
    if (action === 'changes' && !feedback?.trim()) throw new BadRequestException('Feedback is required when requesting changes');

    const versionStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes_requested';
    await this.versionModel().update({
      where: { id: versionId },
      data: { status: versionStatus, feedback, reviewedById: user.id, reviewedAt: new Date() },
    });

    const requestStatus = action === 'approve' ? 'approved' : 'changes_requested';
    await this.model().update({
      where: { id: requestId },
      data: { status: requestStatus, ...(action === 'approve' ? { finalVersionId: versionId } : {}) },
    });

    const targets = [item.assigneeId, item.createdById].filter((u): u is string => !!u && u !== user.id);
    const verb = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes requested on';
    await this.notifications.notifyMany(
      targets,
      `${this.notifPrefix()}_${action === 'changes' ? 'changes' : action + 'd'}`,
      `Submission ${verb}`,
      `"${item.title}" v${version.version} — ${verb}${feedback ? `: ${feedback}` : ''}`,
      `/${this.notifPrefix()}`,
    );
    return { status: requestStatus };
  }

  async markDelivered(id: string, user: any) {
    if (!this.isManager(user)) throw new ForbiddenException('Only managers can mark delivered');
    const item = await this.detail(id, user.organizationId);
    if (item.status !== 'approved') throw new BadRequestException('Only approved work can be delivered');
    return this.model().update({ where: { id }, data: { status: 'delivered' } });
  }

  async remove(id: string, user: any) {
    if (!this.isManager(user)) throw new ForbiddenException('Only managers can delete requests');
    await this.detail(id, user.organizationId);
    await this.model().delete({ where: { id } });
    return { message: 'Deleted' };
  }
}

@Controller('creatives')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreativesController {
  constructor(private readonly creatives: CreativesService) {}

  @Get()
  list(@Request() req: any, @Query() query: any) {
    return this.creatives.list(req.user.organizationId, query, req.user);
  }

  @Get(':id')
  detail(@Param('id') id: string, @Request() req: any) {
    return this.creatives.detail(id, req.user.organizationId);
  }

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.creatives.create(body, req.user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.creatives.update(id, body, req.user);
  }

  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage, limits: { fileSize: 500 * 1024 * 1024 } }))
  uploadVersion(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() body: { notes?: string; externalUrl?: string },
    @Request() req: any,
  ) {
    return this.creatives.uploadVersion(
      id,
      file
        ? { fileUrl: `/uploads/${file.filename}`, fileName: file.originalname, mimeType: file.mimetype, size: file.size, notes: body.notes }
        : { externalUrl: body.externalUrl, notes: body.notes },
      req.user,
    );
  }

  @Post(':id/versions/:versionId/review')
  @Roles(...MANAGER_ROLES)
  reviewVersion(@Param('id') id: string, @Param('versionId') versionId: string, @Body() body: { action: 'approve' | 'reject' | 'changes'; feedback?: string }, @Request() req: any) {
    return this.creatives.reviewVersion(id, versionId, body.action, body.feedback, req.user);
  }

  @Post(':id/deliver')
  @Roles(...MANAGER_ROLES)
  deliver(@Param('id') id: string, @Request() req: any) {
    return this.creatives.markDelivered(id, req.user);
  }

  @Delete(':id')
  @Roles(...MANAGER_ROLES)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.creatives.remove(id, req.user);
  }
}

@Module({
  controllers: [CreativesController],
  providers: [CreativesService],
})
export class CreativesModule {}
