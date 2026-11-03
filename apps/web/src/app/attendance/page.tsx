'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtDate, fmtDateTime, fullName } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';
import { LogIn, LogOut, Clock } from 'lucide-react';

export default function AttendancePage() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const isHr = role === 'admin' || role === 'hr';

  const { data: today } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today').then((r) => r.data),
  });
  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => api.get('/attendance', { params: isHr ? {} : { mine: 'true' } }).then((r) => r.data),
  });

  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['attendance'] }); };

  const checkIn = useMutation({ mutationFn: () => api.post('/attendance/check-in'), onSuccess: invalidate });
  const checkOut = useMutation({ mutationFn: () => api.post('/attendance/check-out'), onSuccess: invalidate });

  const canCheckIn = !today?.checkIn;
  const canCheckOut = today?.checkIn && !today?.checkOut;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-[26px] font-semibold text-gray-900 tracking-tight">Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Check in/out and {isHr ? 'team' : 'your'} records.</p>
      </div>

      <Card className="card-premium">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50"><Clock className="h-6 w-6 text-brand-600" /></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Today — {fmtDate(new Date())}</p>
              <p className="text-xs text-gray-500">
                {today?.checkIn ? `Checked in ${fmtDateTime(today.checkIn)}` : 'Not checked in yet'}
                {today?.checkOut ? ` · out ${fmtDateTime(today.checkOut)}` : ''}
                {today?.totalHours ? ` · ${today.totalHours}h` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => checkIn.mutate()} disabled={!canCheckIn || checkIn.isPending} className="gradient-brand-btn text-white border-0 rounded-xl"><LogIn className="h-4 w-4 mr-1.5" />Check in</Button>
            <Button onClick={() => checkOut.mutate()} disabled={!canCheckOut || checkOut.isPending} variant="outline" className="rounded-xl"><LogOut className="h-4 w-4 mr-1.5" />Check out</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-premium">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] stagger-rows">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {isHr && <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Employee</th>}
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Check in</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Check out</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Hours</th>
                  <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {(records ?? []).map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    {isHr && <td className="py-3 px-4 text-sm text-gray-800">{fullName(r.user)} {r.user?.department?.name ? <span className="text-gray-400">· {r.user.department.name}</span> : ''}</td>}
                    <td className="py-3 px-4 text-sm text-gray-700">{fmtDate(r.date)}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{r.totalHours ?? '—'}</td>
                    <td className="py-3 px-4"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${r.status === 'present' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                  </tr>
                ))}
                {!(records ?? []).length && !isLoading && (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-400">No attendance records</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
