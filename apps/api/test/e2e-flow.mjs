const BASE = 'http://localhost:3001/api/v1';
const results = [];
const check = (name, ok, extra = '') => { results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };
const login = async (email, password) => {
  const r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const d = await r.json();
  return { token: d.token, user: d.user, status: r.status };
};
const api = async (token, method, path, body) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data; try { data = await r.json(); } catch { data = null; }
  return { status: r.status, data };
};

// 1. Logins for all 4 roles
const admin = await login('admin@epatang.com', 'AdminSecure2024!ERP');
const pm = await login('pm@epatang.com', 'Staff@2024');
const hr = await login('hr@epatang.com', 'Staff@2024');
const emp = await login('employee@epatang.com', 'Staff@2024');
check('Admin login', admin.status === 200 && admin.user?.primaryRole === 'Super Admin');
check('PM login', pm.status === 200 && pm.user?.primaryRole === 'Project Manager');
check('HR login', hr.status === 200 && hr.user?.primaryRole === 'HR Manager');
check('Employee login', emp.status === 200 && emp.user?.primaryRole === 'Employee');

// 2. Unauthorized access checks
const noAuth = await api(null, 'GET', '/tasks');
check('No-token rejected', noAuth.status === 401, `got ${noAuth.status}`);
const empUsers = await api(emp.token, 'GET', '/users');
check('Employee blocked from /users', empUsers.status === 403, `got ${empUsers.status}`);
const empAudit = await api(emp.token, 'GET', '/audit-logs');
check('Employee blocked from /audit-logs', empAudit.status === 403, `got ${empAudit.status}`);
const empModules = await api(emp.token, 'POST', '/modules', { name: 'hack' });
check('Employee blocked from creating modules', empModules.status === 403, `got ${empModules.status}`);

const hrUsers = await api(hr.token, 'GET', '/users');
check('HR can list users', hrUsers.status === 200 && hrUsers.data.length > 0);

// 3. Full task workflow
const depts = await api(admin.token, 'GET', '/departments');
const itDept = depts.data.find((d) => d.name === 'IT');
const empId = emp.user.id;
const taskRes = await api(admin.token, 'POST', '/tasks', {
  title: 'E2E Test Task', description: 'workflow verification', priority: 'high',
  departmentId: itDept?.id, requiresApproval: true, assigneeIds: [empId],
  deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
});
check('Admin creates task', taskRes.status < 300, JSON.stringify(taskRes.data?.id || taskRes.data));
const taskId = taskRes.data.id;

const myTasks = await api(emp.token, 'GET', '/tasks/my');
check('Employee sees assigned task', myTasks.status === 200 && myTasks.data.tasks.some((t) => t.id === taskId));

const empNotifs = await api(emp.token, 'GET', '/notifications');
check('Employee got assignment notification', empNotifs.data.some((n) => n.title === 'New task assigned'));

const start = await api(emp.token, 'POST', `/tasks/${taskId}/start`);
check('Employee starts task', start.status < 300 && start.data.status === 'in_progress', String(start.data?.status || start.status));

const prog = await api(emp.token, 'POST', `/tasks/${taskId}/progress`, { progress: 60 });
check('Progress update to 60', prog.status < 300 && prog.data.progress === 60);

const sneak = await api(emp.token, 'POST', `/tasks/${taskId}/status`, { status: 'completed' });
check('Employee cannot bypass approval', sneak.status === 403, `got ${sneak.status}`);

const submit = await api(emp.token, 'POST', `/tasks/${taskId}/submit`, { note: 'ready for review' });
check('Submit → in_review', submit.data?.task?.status === 'in_review' && submit.data.completed === false);

const pmNotifs = await api(pm.token, 'GET', '/notifications');
check('PM got submission notification', pmNotifs.data.some((n) => n.title === 'Work submitted for review'));

const changes = await api(pm.token, 'POST', `/tasks/${taskId}/review`, { action: 'changes', feedback: 'needs polish' });
check('PM requests changes', changes.data?.task?.status === 'changes_requested');

await api(emp.token, 'POST', `/tasks/${taskId}/start`);
const resub = await api(emp.token, 'POST', `/tasks/${taskId}/submit`, { note: 'fixed' });
check('Resubmit after changes', resub.data?.task?.status === 'in_review');

const approve = await api(pm.token, 'POST', `/tasks/${taskId}/review`, { action: 'approve', feedback: 'looks good' });
check('Approve → completed', approve.data?.task?.status === 'completed' && approve.data.completed === true);
const final = await api(emp.token, 'GET', `/tasks/${taskId}`);
check('Task persisted completed + completedAt', final.data.status === 'completed' && !!final.data.completedAt);
check('Status history recorded', final.data.statusHistory.length >= 4, `${final.data.statusHistory.length} entries`);

// 4. Non-approval task completes immediately with sound flag
const t2 = await api(admin.token, 'POST', '/tasks', { title: 'Quick task', requiresApproval: false, assigneeIds: [empId] });
await api(emp.token, 'POST', `/tasks/${t2.data.id}/start`);
const sub2 = await api(emp.token, 'POST', `/tasks/${t2.data.id}/submit`, {});
check('No-approval task completes + plays sound', sub2.data?.completed === true && sub2.data?.playCompletionSound === true);

// 5. Creative + video workflow
const designer = await login('designer@epatang.com', 'Staff@2024');
const cr = await api(pm.token, 'POST', '/creatives', { title: 'E2E Banner', brief: 'test banner', dimensions: '1080x1080', assigneeId: designer.user.id });
check('Create creative request', cr.status < 300, JSON.stringify(cr.data?.id || cr.data));
const v = await api(designer.token, 'POST', `/creatives/${cr.data.id}/versions`, { externalUrl: 'https://example.com/v1.png', notes: 'first draft' });
check('Designer uploads version', v.status < 300, JSON.stringify(v.data?.id || v.data));
const crv = await api(admin.token, 'POST', `/creatives/${cr.data.id}/versions/${v.data.id}/review`, { action: 'approve', feedback: 'approved!' });
check('Admin approves creative', crv.data?.status === 'approved');

const vid = await api(admin.token, 'POST', '/videos', { title: 'E2E Video', brief: 'test video', assigneeId: empId });
const vv = await api(emp.token, 'POST', `/videos/${vid.data.id}/versions`, { externalUrl: 'https://example.com/v1.mp4', notes: 'rough cut' });
const vchg = await api(pm.token, 'POST', `/videos/${vid.data.id}/versions/${vv.data.id}/review`, { action: 'changes', feedback: 'fix intro' });
check('Video changes requested', vchg.data?.status === 'changes_requested');

// 6. Leave workflow
const leave = await api(emp.token, 'POST', '/leave', { type: 'sick', startDate: '2026-10-20', endDate: '2026-10-21', reason: 'flu' });
check('Employee applies leave', leave.status < 300);
const decide = await api(hr.token, 'POST', `/leave/${leave.data.id}/decide`, { action: 'approve' });
check('HR approves leave', decide.data?.status === 'approved');
const empLeaveBlock = await api(emp.token, 'POST', `/leave/${leave.data.id}/decide`, { action: 'reject' });
check('Employee cannot decide leave', empLeaveBlock.status === 403, `got ${empLeaveBlock.status}`);

// 7. Preferences + modules
const pref = await api(emp.token, 'PUT', '/preferences', { soundVolume: 40, soundEnabled: true });
check('Save sound prefs', pref.status < 300 && pref.data.soundVolume === 40);
const prefBack = await api(emp.token, 'GET', '/preferences');
check('Prefs persist', prefBack.data.soundVolume === 40);
const mod = await api(admin.token, 'POST', '/modules', { name: 'SEO Audit', key: 'seo-audit-e2e', description: 'test', roles: ['Admin', 'Project Manager'], departmentIds: [] });
check('Admin creates module', mod.status < 300, JSON.stringify(mod.data?.id || mod.data));

// 8. Attendance + announcements + audit
const ci = await api(emp.token, 'POST', '/attendance/check-in');
check('Check-in works', ci.status < 300, String(ci.data?.status || ci.data?.message));
const ann = await api(admin.token, 'POST', '/announcements', { title: 'E2E Announce', content: 'test' });
check('Create announcement', ann.status < 300);
const audit = await api(admin.token, 'GET', '/audit-logs');
check('Audit logs have entries', audit.status === 200 && audit.data.logs.length > 0, `${audit.data?.pagination?.total} total`);

// 9. File upload (task attachment)
const taskForFile = t2.data.id;
const formData = new FormData();
formData.append('file', new Blob(['hello world'], { type: 'text/plain' }), 'test.txt');
const up = await fetch(`${BASE}/tasks/${taskForFile}/attachments`, {
  method: 'POST', headers: { Authorization: `Bearer ${emp.token}` }, body: formData,
});
const upData = await up.json().catch(() => null);
check('File upload works', up.status < 300 && upData?.url?.startsWith('/uploads/'), upData?.url || String(up.status));

console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL'));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
process.exit(fails.length ? 1 : 0);
