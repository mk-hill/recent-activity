import { HasDateKey, mostRecentDate, hourMinute } from './util';

export interface ActivityDetail {
  html: string;
  time: string;
  isTimeGrouped: boolean;
}

export function createDetail(html: string, timeSource: Date | HasDateKey[]): ActivityDetail {
  let time;
  let isTimeGrouped;
  if (!Array.isArray(timeSource)) {
    time = hourMinute(timeSource);
    isTimeGrouped = false;
  } else {
    time = hourMinute(mostRecentDate(timeSource)); // Only take most recent time when grouping
    isTimeGrouped = timeSource.length > 1;
  }
  return {
    html,
    time,
    isTimeGrouped,
  };
}
