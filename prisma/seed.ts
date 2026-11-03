import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Epatang seed...');

  // Organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'epatang-agency' },
    update: { name: 'Epatang' },
    create: {
      name: 'Epatang',
      slug: 'epatang-agency',
    },
  });
  console.log('Organization:', organization.name);

  // Roles
  const roles = [
    { name: 'Super Admin', description: 'Full system access' },
    { name: 'Admin', description: 'Company administration' },
    { name: 'Project Manager', description: 'Project management' },
    { name: 'HR Manager', description: 'HR management' },
    { name: 'Employee', description: 'Standard employee' },
    { name: 'Graphic Designer', description: 'Design tasks' },
    { name: 'Video Editor', description: 'Video editing tasks' },
    { name: 'Sales Manager', description: 'Sales management' },
    { name: 'Developer', description: 'Development tasks' },
    { name: 'Client', description: 'Client portal access' },
  ];

  const createdRoles: Record<string, { id: string }> = {};
  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    createdRoles[role.name] = created;
  }
  console.log('Roles seeded');

  // Departments
  const departmentsData = [
    { name: 'IT', code: 'IT', description: 'Developers, website developers, API developers, technical support and bug fixing', color: '#0ea5e9' },
    { name: 'Sales', code: 'SALES', description: 'Leads, follow-ups, sales tasks, client onboarding', color: '#f59e0b' },
    { name: 'SMM', code: 'SMM', description: 'Social media managers, content creators, graphic designers, video editors', color: '#8b5cf6' },
    { name: 'Operations', code: 'OPS', description: 'Internal operations, coordination, quality checks, delivery management', color: '#10b981' },
  ];

  const departments: Record<string, { id: string }> = {};
  for (const dept of departmentsData) {
    const created = await prisma.department.upsert({
      where: { organizationId_name: { organizationId: organization.id, name: dept.name } },
      update: { description: dept.description, color: dept.color },
      create: { ...dept, organizationId: organization.id },
    });
    departments[dept.name] = created;
  }
  console.log('Departments seeded');

  // Users
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecure2024!ERP';
  const defaultPassword = await bcrypt.hash(adminPassword, 10);
  const staffPassword = await bcrypt.hash('Staff@2024', 10);

  const usersData = [
    { email: 'admin@epatang.com', passwordHash: defaultPassword, firstName: 'Admin', lastName: 'User', roles: ['Super Admin'], dept: 'Operations', designation: 'System Administrator', empId: 'DD-001' },
    { email: 'pm@epatang.com', passwordHash: staffPassword, firstName: 'Priya', lastName: 'Sharma', roles: ['Project Manager'], dept: 'Operations', designation: 'Project Manager', empId: 'DD-002' },
    { email: 'hr@epatang.com', passwordHash: staffPassword, firstName: 'Rachel', lastName: 'HR', roles: ['HR Manager'], dept: 'Operations', designation: 'HR Manager', empId: 'DD-003' },
    { email: 'employee@epatang.com', passwordHash: staffPassword, firstName: 'John', lastName: 'Doe', roles: ['Employee', 'Developer'], dept: 'IT', designation: 'Software Developer', empId: 'DD-004' },
    { email: 'designer@epatang.com', passwordHash: staffPassword, firstName: 'Sarah', lastName: 'Design', roles: ['Employee', 'Graphic Designer'], dept: 'SMM', designation: 'Graphic Designer', empId: 'DD-005' },
    { email: 'editor@epatang.com', passwordHash: staffPassword, firstName: 'Mike', lastName: 'Video', roles: ['Employee', 'Video Editor'], dept: 'SMM', designation: 'Video Editor', empId: 'DD-006' },
    { email: 'sales@epatang.com', passwordHash: staffPassword, firstName: 'Sam', lastName: 'Sales', roles: ['Sales Manager'], dept: 'Sales', designation: 'Sales Manager', empId: 'DD-007' },
  ];

  const users: Record<string, { id: string }> = {};
  for (const u of usersData) {
    const { roles: roleNames, dept, designation, empId, ...fields } = u;
    const user = await prisma.user.upsert({
      where: { email: fields.email },
      update: { departmentId: departments[dept].id, passwordHash: fields.passwordHash, isActive: true },
      create: { ...fields, organizationId: organization.id, departmentId: departments[dept].id },
    });
    users[fields.email] = user;

    for (const roleName of roleNames) {
      const role = createdRoles[roleName];
      if (role) {
        const existing = await prisma.userRole.findFirst({ where: { userId: user.id, roleId: role.id } });
        if (!existing) {
          await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
        }
      }
    }

    await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: { designation, employeeId: empId, reportingManager: 'Priya Sharma' },
      create: {
        userId: user.id,
        employeeId: empId,
        designation,
        reportingManager: 'Priya Sharma',
        dateOfJoining: new Date('2025-01-15'),
        employmentStatus: 'active',
        leaveBalance: 20,
      },
    });
    console.log('User:', user.email);
  }

  // Department heads
  await prisma.department.update({ where: { id: departments['IT'].id }, data: { headId: users['pm@epatang.com'].id } });
  await prisma.department.update({ where: { id: departments['SMM'].id }, data: { headId: users['pm@epatang.com'].id } });
  await prisma.department.update({ where: { id: departments['Sales'].id }, data: { headId: users['sales@epatang.com'].id } });
  await prisma.department.update({ where: { id: departments['Operations'].id }, data: { headId: users['admin@epatang.com'].id } });

  // Organization settings
  await prisma.organizationSettings.upsert({
    where: { organizationId: organization.id },
    update: { brandName: 'EPATANG', soundEnabled: true },
    create: { organizationId: organization.id, brandName: 'EPATANG', soundEnabled: true, primaryColor: '#10b981' },
  });

  // Default module registry
  const defaultModules = [
    { key: 'tasks', name: 'Tasks', icon: 'CheckSquare', roles: ['Super Admin', 'Admin', 'Project Manager', 'HR Manager', 'Employee'], menuPosition: 10 },
    { key: 'projects', name: 'Projects', icon: 'FolderKanban', roles: ['Super Admin', 'Admin', 'Project Manager'], menuPosition: 20 },
    { key: 'creative', name: 'Creative Approvals', icon: 'Palette', roles: ['Super Admin', 'Admin', 'Project Manager', 'Graphic Designer', 'Employee'], menuPosition: 30, departmentIds: [departments['SMM'].id] },
    { key: 'video', name: 'Video Approvals', icon: 'Clapperboard', roles: ['Super Admin', 'Admin', 'Project Manager', 'Video Editor', 'Employee'], menuPosition: 40, departmentIds: [departments['SMM'].id] },
    { key: 'departments', name: 'Departments', icon: 'Network', roles: ['Super Admin', 'Admin'], menuPosition: 50 },
    { key: 'employees', name: 'Employees', icon: 'Users', roles: ['Super Admin', 'Admin', 'HR Manager'], menuPosition: 60 },
    { key: 'leave', name: 'Leave', icon: 'CalendarOff', roles: ['Super Admin', 'Admin', 'HR Manager', 'Project Manager', 'Employee'], menuPosition: 70 },
    { key: 'announcements', name: 'Announcements', icon: 'Megaphone', roles: ['Super Admin', 'Admin', 'HR Manager', 'Project Manager', 'Employee'], menuPosition: 80 },
    { key: 'modules', name: 'Modules', icon: 'LayoutGrid', roles: ['Super Admin', 'Admin'], menuPosition: 90 },
    { key: 'audit', name: 'Audit Logs', icon: 'ScrollText', roles: ['Super Admin', 'Admin'], menuPosition: 95 },
  ];
  for (const m of defaultModules) {
    await prisma.moduleConfig.upsert({
      where: { organizationId_key: { organizationId: organization.id, key: m.key } },
      update: { name: m.name, icon: m.icon, roles: m.roles, menuPosition: m.menuPosition, departmentIds: (m as any).departmentIds ?? [] },
      create: { ...m, organizationId: organization.id },
    });
  }
  console.log('Modules seeded');

  // Demo client + project
  const client = await prisma.client.upsert({
    where: { id: 'demo-client-id' },
    update: {},
    create: { id: 'demo-client-id', name: 'Acme Corp', email: 'client@acme.com', status: 'active', organizationId: organization.id },
  });

  const pmUser = users['pm@epatang.com'];
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-id' },
    update: { status: 'active', departmentId: departments['IT'].id, ownerId: pmUser.id },
    create: {
      id: 'demo-project-id',
      name: 'Website Redesign',
      description: 'Complete website redesign for Acme Corp',
      status: 'active',
      priority: 'high',
      startDate: new Date(),
      deadline: new Date(Date.now() + 30 * 86400000),
      budget: 10000,
      progress: 25,
      organizationId: organization.id,
      clientId: client.id,
      ownerId: pmUser.id,
      departmentId: departments['IT'].id,
    },
  });

  // Normalize legacy statuses
  await prisma.task.updateMany({ where: { status: 'ongoing' }, data: { status: 'in_progress' } });
  await prisma.task.updateMany({ where: { status: 'blocked' }, data: { status: 'on_hold' } });
  await prisma.task.updateMany({ where: { status: 'revision_required' }, data: { status: 'changes_requested' } });

  // Demo tasks assigned to employees across departments
  const demoTasks = [
    { title: 'Build login page UI', dept: 'IT', assignee: 'employee@epatang.com', status: 'in_progress', priority: 'high', requiresApproval: true, progress: 40, daysOut: 3, category: 'development' },
    { title: 'Fix API pagination bug', dept: 'IT', assignee: 'employee@epatang.com', status: 'todo', priority: 'urgent', requiresApproval: false, daysOut: 1, category: 'bugfix' },
    { title: 'Design Instagram carousel', dept: 'SMM', assignee: 'designer@epatang.com', status: 'in_review', priority: 'medium', requiresApproval: true, progress: 90, daysOut: 2, category: 'design' },
    { title: 'Edit product promo video', dept: 'SMM', assignee: 'editor@epatang.com', status: 'todo', priority: 'high', requiresApproval: true, daysOut: 5, category: 'video' },
    { title: 'Follow up with Acme Corp', dept: 'Sales', assignee: 'sales@epatang.com', status: 'todo', priority: 'medium', requiresApproval: false, daysOut: 4, category: 'sales' },
    { title: 'Weekly ops sync notes', dept: 'Operations', assignee: 'pm@epatang.com', status: 'completed', priority: 'low', requiresApproval: false, daysOut: -1, category: 'operations' },
  ];

  let seq = 1;
  for (const t of demoTasks) {
    const existing = await prisma.task.findFirst({ where: { title: t.title, project: { organizationId: organization.id } } });
    if (existing) continue;
    const task = await prisma.task.create({
      data: {
        taskNumber: `DD-${String(seq++).padStart(3, '0')}`,
        title: t.title,
        description: `${t.title} — seeded demo task`,
        status: t.status,
        priority: t.priority,
        category: t.category,
        progress: t.progress ?? (t.status === 'completed' ? 100 : 0),
        requiresApproval: t.requiresApproval,
        deadline: new Date(Date.now() + t.daysOut * 86400000),
        completedAt: t.status === 'completed' ? new Date() : null,
        projectId: project.id,
        departmentId: departments[t.dept].id,
        createdById: pmUser.id,
      },
    });
    await prisma.taskAssignee.create({ data: { taskId: task.id, userId: users[t.assignee].id } });
    await prisma.taskStatusHistory.create({ data: { taskId: task.id, fromStatus: 'todo', toStatus: t.status, changedBy: pmUser.id } });
  }
  console.log('Tasks seeded');

  // Demo creative + video requests
  const existingCreative = await prisma.creativeRequest.findFirst({ where: { title: 'Instagram banner set', organizationId: organization.id } });
  if (!existingCreative) {
    const cr = await prisma.creativeRequest.create({
      data: {
        title: 'Instagram banner set',
        brief: '3 carousel banners for product launch, brand colors',
        dimensions: '1080x1080',
        format: 'PNG',
        requirements: 'Follow brand guide v2',
        status: 'in_progress',
        priority: 'high',
        deadline: new Date(Date.now() + 4 * 86400000),
        organizationId: organization.id,
        departmentId: departments['SMM'].id,
        projectId: project.id,
        createdById: pmUser.id,
        assigneeId: users['designer@epatang.com'].id,
        reviewerId: pmUser.id,
      },
    });
    await prisma.creativeVersion.create({
      data: { requestId: cr.id, version: 1, externalUrl: 'https://placehold.co/1080x1080/10b981/ffffff?text=Draft+v1', notes: 'First draft', status: 'submitted', uploadedById: users['designer@epatang.com'].id },
    });
  }

  const existingVideo = await prisma.videoRequest.findFirst({ where: { title: 'Product teaser reel', organizationId: organization.id } });
  if (!existingVideo) {
    await prisma.videoRequest.create({
      data: {
        title: 'Product teaser reel',
        brief: '15-second teaser for social launch',
        requirements: 'Vertical 9:16, captions burned in',
        sourceLink: 'https://example.com/raw-footage',
        status: 'editing',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 86400000),
        organizationId: organization.id,
        departmentId: departments['SMM'].id,
        createdById: pmUser.id,
        assigneeId: users['editor@epatang.com'].id,
        reviewerId: pmUser.id,
      },
    });
  }

  // Announcement + holiday + leave
  const existingAnn = await prisma.announcement.findFirst({ where: { title: 'Welcome to Epatang', organizationId: organization.id } });
  if (!existingAnn) {
    await prisma.announcement.create({
      data: { title: 'Welcome to Epatang', content: 'Our new task & approval system is live. Reach out to Priya with questions.', authorId: users['admin@epatang.com'].id, organizationId: organization.id },
    });
  }

  const holiday = await prisma.holiday.findFirst({ where: { name: 'Diwali', organizationId: organization.id } });
  if (!holiday) {
    await prisma.holiday.create({ data: { name: 'Diwali', date: new Date('2026-11-08'), organizationId: organization.id } });
    await prisma.holiday.create({ data: { name: 'New Year', date: new Date('2027-01-01'), organizationId: organization.id } });
  }

  const existingLeave = await prisma.leaveRequest.findFirst({ where: { userId: users['employee@epatang.com'].id } });
  if (!existingLeave) {
    await prisma.leaveRequest.create({
      data: { userId: users['employee@epatang.com'].id, type: 'casual', startDate: new Date(Date.now() + 10 * 86400000), endDate: new Date(Date.now() + 11 * 86400000), days: 2, reason: 'Family event', status: 'pending' },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
