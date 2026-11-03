import { keepPreviousData, useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';

export type ChartPeriod = 'week' | 'month' | 'year';

export interface TrendPoint {
  date: string;
  created: number;
  completed: number;
}

/** Org-wide dashboard stats. Keyed under ['dashboard'] so task/approval mutations refresh it. */
export function useDashboardStats(period?: ChartPeriod) {
  return useQuery({
    queryKey: ['dashboard', 'stats', period ?? 'all'],
    queryFn: () => api.get('/dashboard/stats', { params: period ? { period } : {} }).then((r) => r.data),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  });
}

/** Percentage change of the last 7 days vs the 7 days before (null when no baseline). */
export function weekOverWeek(trend: TrendPoint[] | undefined, key: 'created' | 'completed') {
  if (!trend || trend.length < 14) return null;
  const sum = (arr: TrendPoint[]) => arr.reduce((s, t) => s + t[key], 0);
  const prev = sum(trend.slice(0, 7));
  const curr = sum(trend.slice(7));
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}
