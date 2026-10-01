import type { StatusHistory } from '@/lib/api';

export type ScheduleDelayEntry = {
  id: string;
  delayHours: number;
  reason: string;
  createdAt: string;
  createdBy?: { id: string; name: string; email: string };
};

export type TicketTimelineEntry = {
  id: string;
  toStatus: string;
  note?: string | null;
  createdAt: string;
  changedBy: { name: string };
};

/** 상태 이력·비고에 보이는 [SANDBOX] 표식 제거 (관리자·가맹점 공통). */
export function stripSandboxMarker(note?: string | null): string | null {
  if (note == null) return null;
  const cleaned = note
    .replace(/\[SANDBOX\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned || null;
}

/** 상태 이력 + 일정 지연을 시간순으로 합칩니다. 지연은 scheduleDelays를 기준으로 표시합니다. */
export function buildTicketStatusTimeline(input: {
  statusHistory: StatusHistory[];
  scheduleDelays?: ScheduleDelayEntry[] | null;
  showHqDelayMeta?: boolean;
}): TicketTimelineEntry[] {
  const delays = input.scheduleDelays ?? [];
  const showHq = input.showHqDelayMeta === true;

  const base: TicketTimelineEntry[] = (
    delays.length > 0
      ? input.statusHistory.filter((h) => h.toStatus !== 'SCHEDULE_DELAYED')
      : input.statusHistory
  ).map((h) => ({
    id: h.id,
    toStatus: h.toStatus,
    note: stripSandboxMarker(h.note),
    createdAt: h.createdAt,
    changedBy: { name: h.changedBy?.name ?? '—' },
  }));

  const delayRows: TicketTimelineEntry[] = delays.map((d) => ({
    id: `schedule-delay-${d.id}`,
    toStatus: 'SCHEDULE_DELAYED',
    note: showHq ? `+${d.delayHours}h · ${d.reason}` : d.reason,
    createdAt: d.createdAt,
    // 가맹점에는 지연 등록자(총본사 등)를 노출하지 않음
    changedBy: { name: showHq ? (d.createdBy?.name ?? '—') : '' },
  }));

  return [...base, ...delayRows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}