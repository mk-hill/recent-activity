import { GitHubPush, Activity } from '../../../models';
import { isGitHubPush } from '.';

const today = new Date();
const epoch = new Date(0);

export const timeZone = process.env.TIME_ZONE ?? 'America/Chicago';

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

export const fullDate = (date: Date): string =>
  date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'America/Chicago',
  });

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

const compareDates = (d1: Date, d2: Date, desc: boolean) => (desc ? d2.getTime() - d1.getTime() : d1.getTime() - d2.getTime());

export const sortByDate = <T extends HasDateKey>(ar: T[], desc = false): T[] =>
  (ar as T[]).sort(({ date: d1 }, { date: d2 }) => compareDates(d1, d2, desc)) as T[];

/**
 * Sort all sub arrays by date, sort top level by most recent date in each sub array
 */
export const sortAllByDate = <T extends HasDateKey>(ar: T[][], desc = false): T[][] =>
  ar.map((subArray) => sortByDate(subArray, desc) as T[]).sort((ar1, ar2) => compareDates(mostRecentDate(ar1), mostRecentDate(ar2), desc));

/**
 * Populate dates in place
 */
export function populateDates(activity: Activity): Activity {
  const { performedAt } = activity;
  activity.date = new Date(performedAt);
  if (isGitHubPush(activity)) {
    (activity as GitHubPush).commits.forEach((commit) => {
      commit.date = new Date(commit.timestamp);
    });
  }
  return activity;
}

let localOffset;

/**
 * @returns server local time offset from desired time zone
 */
function getLocalOffset() {
  if (localOffset) return localOffset;
  const localDate = today.getDate();
  const localHours = today.getHours();

  const [correctDate, correctHours] = today
    .toLocaleString('en-US', { timeZone, hour: 'numeric', day: 'numeric', hour12: false })
    .split(',')
    .map((s) => parseInt(s));

  if (localDate === correctDate) return correctHours - localHours;
  if (localDate > correctDate) return 24 - correctHours + localHours;
  if (localDate < correctDate) return -(24 - localHours + correctHours);
}

/**
 * @returns last midnight if 0
 */
export function midnightNDaysAgo(daysAgo = 0): Date {
  const msInDay = 24 * 60 * 60 * 1000;
  const d = new Date(today.getTime() - msInDay * daysAgo);
  const offset = getLocalOffset();
  let hours;

  if (localOffset >= 0) {
    hours = 0 + offset;
  } else {
    d.setDate(d.getDate() - 1);
    hours = 24 + offset;
  }

  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  d.setHours(hours);

  return d;
}
