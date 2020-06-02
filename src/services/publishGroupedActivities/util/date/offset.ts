import { timeZone as correctTimeZone } from '.';

const today = new Date();
const msInMin = 60 * 1000;
const minsInDay = 24 * 60;

let correctDateUtcMidnight: Date;
let currentUtcOffset: number;
let lastMidnight: Date;

const padZero = (val: string | number, desiredLength: number) => `${val}`.padStart(desiredLength, '0');

interface DateValues {
  month: string;
  day: string;
  year: string;
  hour: string;
  minute: string;
  second: string;
}

/**
 * @returns 0 padded strings for each value based on time zone, uses local time if no time zone given
 */
function dateValuesForTimeZone(date = today, timeZone?: string): DateValues {
  const [month, day, year, hour, minute, second] = date
    .toLocaleString('en-US', {
      timeZone,
      hour12: false,
    })
    .match(/(\d+)/g)
    .map((val) => padZero(val, 2));

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
  };
}

/**
 * @returns ISO string format with time zone values retained as though it were UTC, uses local time if no time zone given
 */
function toFakeIso(date: Date, timeZone?: string) {
  const { year, month, day, hour, minute, second } = dateValuesForTimeZone(date, timeZone);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${padZero(date.getMilliseconds(), 3)}Z`;
}

/**
 * @returns UTC offset in minutes for given time zone, uses local time if no time zone given
 */
const currentUtcOffsetForTimeZone = (timeZone?: string) => (today.getTime() - new Date(toFakeIso(today, timeZone)).getTime()) / msInMin;

function utcMidnightForCurrentDate() {
  const d = new Date(toFakeIso(today, correctTimeZone));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * @returns midnight for correct time zone given number of days ago. last midnight if 0 or none given
 */
export function midnightNDaysAgo(daysAgo = 0): Date {
  if (!lastMidnight) {
    correctDateUtcMidnight = utcMidnightForCurrentDate();
    currentUtcOffset = currentUtcOffsetForTimeZone(correctTimeZone);
    lastMidnight = new Date(correctDateUtcMidnight.getTime() + currentUtcOffset * msInMin);
  }

  if (daysAgo === 0) return lastMidnight;

  return new Date(lastMidnight.getTime() - msInMin * minsInDay * daysAgo);
}
