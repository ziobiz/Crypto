/** IANA 타임존 기준 달력일·마감(23:59:59.999) 유틸 */

export function zonedYmd(
  date: Date,
  timeZone: string,
): { year: number; month: number; day: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function addCalendarDays(
  y: number,
  m: number,
  d: number,
  days: number,
): { year: number; month: number; day: number } {
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

/** 지정 타임존의 로컬 시각 → UTC Date */
export function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const asUtcComponents = (instant: number) => {
    const parts = Object.fromEntries(
      dtf.formatToParts(new Date(instant)).map((p) => [p.type, p.value]),
    );
    return Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
  };
  const offset1 = asUtcComponents(utcGuess) - utcGuess;
  let corrected = utcGuess - offset1;
  const offset2 = asUtcComponents(corrected) - corrected;
  corrected = utcGuess - offset2;
  return new Date(corrected);
}

/** startedAt의 서비스 TZ 달력일 = D+0 → D+N 당일 23:59:59.999 */
export function calendarDayEndDeadline(
  startedAt: Date,
  calendarDaysFromAnchor: number,
  timeZone: string,
): Date {
  const anchor = zonedYmd(startedAt, timeZone);
  const target = addCalendarDays(
    anchor.year,
    anchor.month,
    anchor.day,
    Math.max(0, Math.floor(calendarDaysFromAnchor)),
  );
  return zonedLocalToUtc(target.year, target.month, target.day, 23, 59, 59, 999, timeZone);
}
