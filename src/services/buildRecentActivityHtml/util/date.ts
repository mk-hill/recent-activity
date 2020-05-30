const timeZone = process.env.TIME_ZONE ?? 'America/Chicago';
const today = new Date();
const epoch = new Date(0);

export interface HasDateKey {
  date?: Date;
}

export const mostRecentDate = (ar: HasDateKey[]): Date =>
  ar.reduce((mostRecent, { date: current }) => (current.getTime() > mostRecent.getTime() ? current : mostRecent), epoch);

export const monthDay = (date: Date): string =>
  date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone,
  });

export const monthDayYear = (date: Date): string =>
  date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone });

export const hourMinute = (date: Date): string => date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', timeZone });

// Compare after localeString conversion to take timeZone into account
export const isSameDay = (d1: Date, d2: Date): boolean => monthDayYear(d1) === monthDayYear(d2);

export const isToday = (date: Date): boolean => isSameDay(date, today);

const monthYear = (date: Date): string => date.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone });

const dayOfMonth = (date: Date): number => parseInt(date.toLocaleString('en-US', { day: 'numeric', timeZone }));

export const isYesterday = (date: Date): boolean => monthYear(today) === monthYear(date) && dayOfMonth(today) - dayOfMonth(date) === 1;

export const groupByDay = <T extends HasDateKey>(ar: T[], initialMap: Record<string, T[]> = {}): Record<string, T[]> =>
  ar.reduce((dateToItem, item) => {
    const { date } = item;
    const key = monthDayYear(date);
    if (!dateToItem[key]) dateToItem[key] = [];
    dateToItem[key].push(item);
    return dateToItem;
  }, initialMap);

export const sortByDate = <T extends HasDateKey>(ar: T[], desc = false): T[] =>
  ar.sort((x, y) => (desc ? y.date.getTime() - x.date.getTime() : x.date.getTime() - y.date.getTime()));
