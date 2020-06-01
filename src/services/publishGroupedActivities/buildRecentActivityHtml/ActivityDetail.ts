import { HasDateKey, mostRecentDate, hourMinute } from '../util';

export interface ActivityDetail {
  html: string;
  time: string;
  isTimeGrouped: boolean;
  date: Date;
}

export function createDetail(html: string, dateSource: Date | HasDateKey[]): ActivityDetail {
  let time;
  let isTimeGrouped;
  let date;

  if (!Array.isArray(dateSource)) {
    date = dateSource;
    time = hourMinute(date);
    isTimeGrouped = false;
  } else {
    date = mostRecentDate(dateSource); // Only take most recent time when grouping
    time = hourMinute(date);
    isTimeGrouped = dateSource.length > 1;
  }
  return {
    html,
    time,
    isTimeGrouped,
    date,
  };
}
