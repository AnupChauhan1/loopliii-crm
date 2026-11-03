import { BadRequestException, Controller, Get, Injectable, Module, Post, Query, Request, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles, HR_ROLES, PRIVILEGED_ROLES } from '../common/roles';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async today(userId: string) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    return this.prisma.attendanceRecord.findUnique({ where: { userId_date: { userId, date: day } } });
  }

  async checkIn(userId: string) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const existing = await this.today(userId);
    if (existing?.checkIn) throw new BadRequestException('Already checked in today');
    return this.prisma.attendanceRecord.upsert({
      where: { userId_date: { userId, date: day } },
      update: { checkIn: new Date(), status: 'present' },
      create: { userId, date: day, checkIn: new Date(), status: 'present' },
    });
  }

  async checkOut(userId: string) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const existing = await this.today(userId);
    if (!existing?.checkIn) throw new BadRequestException('Check in first');
    if (existing.checkOut) throw new BadRequestException('Already checked out');
    const hours = (new Date().getTime() - existing.checkIn.getTime()) / 3600000;
    return this.prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut: new Date(), totalHours: Math.round(hours * 100) / 100 },
    });
  }

  list(user: any, query: any) {
    const isHr = ['Super Admin', 'Admin', 'HR Manager'].some((r) =>
      (user.roles || []).some((ur: any) => ur.role?.name === r),
    );
    const where: any = { user: { organizationId: user.organizationId } };
    if (!isHr || query.mine === 'true') where.userId = user.id;
    else if (query.userId) where.userId = query.userId;
    if (query.date) {
      const day = new Date(query.date);
      day.setHours(0, 0, 0, 0);
      where.date = day;
    }
    return this.prisma.attendanceRecord.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
      take: 60,
    });
  }
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, query: any) {
    const { resource, userId, search, page = 1, limit = 50 } = query;
    const where: any = { organizationId };
    if (resource) where.resource = resource;
    if (userId) where.userId = userId;
    if (search) where.OR = [{ action: { contains: search, mode: 'insensitive' } }, { resource: { contains: search, mode: 'insensitive' } }];
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: parseInt(limit) }),
      this.prisma.auditLog.count({ where }),
    ]);
    // Resolve user names
    const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[];
    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true, email: true } });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    return {
      logs: logs.map((l) => ({ ...l, user: l.userId ? userMap[l.userId] : null })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
    };
  }
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MiscController {
  constructor(
    private readonly attendance: AttendanceService,
    private readonly audit: AuditService,
  ) {}

  @Get('attendance/today')
  today(@Request() req: any) {
    return this.attendance.today(req.user.id);
  }

  @Post('attendance/check-in')
  checkIn(@Request() req: any) {
    return this.attendance.checkIn(req.user.id);
  }

  @Post('attendance/check-out')
  checkOut(@Request() req: any) {
    return this.attendance.checkOut(req.user.id);
  }

  @Get('attendance')
  attendanceList(@Request() req: any, @Query() query: any) {
    return this.attendance.list(req.user, query);
  }

  @Get('audit-logs')
  @Roles(...PRIVILEGED_ROLES)
  auditLogs(@Request() req: any, @Query() query: any) {
    return this.audit.list(req.user.organizationId, query);
  }
}

@Module({
  controllers: [MiscController],
  providers: [AttendanceService, AuditService],
})
export class MiscModule {}
