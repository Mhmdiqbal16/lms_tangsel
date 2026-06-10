const dayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long' });
const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const longDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const monthFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
});

export const weekdayLabels = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function parseISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateID(value: string | Date) {
  const date = typeof value === 'string' ? parseISODate(value) : value;
  return longDateFormatter.format(date);
}

export function formatShortDateID(value: string | Date) {
  const date = typeof value === 'string' ? parseISODate(value) : value;
  return shortDateFormatter.format(date);
}

export function formatMonthYear(value: string | Date) {
  const date = typeof value === 'string' ? parseISODate(value) : value;
  return monthFormatter.format(date);
}

export function formatDayName(value: string | Date | number) {
  if (typeof value === 'number') {
    return weekdayLabels[value];
  }
  const date = typeof value === 'string' ? parseISODate(value) : value;
  return dayFormatter.format(date);
}

export function isSameDate(first: string | Date, second: string | Date) {
  const firstDate = typeof first === 'string' ? parseISODate(first) : first;
  const secondDate = typeof second === 'string' ? parseISODate(second) : second;
  return toISODate(firstDate) === toISODate(secondDate);
}

export function differenceInCalendarDays(later: string | Date, earlier: string | Date) {
  const laterDate = typeof later === 'string' ? parseISODate(later) : later;
  const earlierDate = typeof earlier === 'string' ? parseISODate(earlier) : earlier;
  const difference = startOfDay(laterDate).getTime() - startOfDay(earlierDate).getTime();
  return Math.round(difference / (1000 * 60 * 60 * 24));
}

export function getAcademicToday(reference = new Date()) {
  let cursor = startOfDay(reference);
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor = addDays(cursor, -1);
  }
  return cursor;
}

export function getPreviousSchoolDay(date: Date) {
  let cursor = addDays(startOfDay(date), -1);
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor = addDays(cursor, -1);
  }
  return cursor;
}

export function getRecentSchoolDates(count: number, start = getAcademicToday()) {
  const dates: Date[] = [];
  let cursor = startOfDay(start);

  while (dates.length < count) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      dates.push(cursor);
    }
    cursor = addDays(cursor, -1);
  }

  return dates;
}

export function getMonthKey(value: string | Date) {
  const date = typeof value === 'string' ? parseISODate(value) : value;
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
}

export function getNextSchoolDay(date: Date) {
  let cursor = addDays(startOfDay(date), 1);
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}
