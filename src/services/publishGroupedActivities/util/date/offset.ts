import { timeZone } from '.';

interface DateValues {
  month: number;
  day: number;
  year: number;
  hour: number;
}

const today = new Date();
let localOffset: number;
let lastMidnight: Date;

export function dateValues(date = today, local = false): DateValues {
  const [month, day, year, hour] = date
    .toLocaleString('en-US', {
      timeZone: local ? undefined : timeZone,
      hour: 'numeric',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour12: false,
    })
    .match(/(\d+)/g)
    .map((s) => parseInt(s));

  return {
    year,
    month,
    day,
    hour,
  };
}

/**
 * Absolutely not correct, but should be enough for before/after comparison
 */
function sumDateForComparison({ year, month, day, hour }: DateValues) {
  const monthsInYr = 12;
  const maxDaysInMonth = 31;
  const hrsInDay = 24;

  const dayVal = day * hrsInDay;
  const monthVal = month * hrsInDay * maxDaysInMonth;
  const yearVal = year * hrsInDay * maxDaysInMonth * monthsInYr;

  return yearVal + monthVal + dayVal + hour;
}

/**
 * @returns server local time offset from desired time zone
 */
function getLocalOffset() {
  if (localOffset) return localOffset;
  const local = dateValues(today, true);
  const correct = dateValues(today);

  const lSum = sumDateForComparison(local);
  const cSum = sumDateForComparison(correct);

  if (lSum === cSum) localOffset = 0;
  if (lSum > cSum) localOffset = 24 - correct.hour + local.hour;
  if (lSum < cSum) localOffset = -(24 - local.hour + correct.hour);

  console.log('getLocalOffset -> localOffset', localOffset);
  return localOffset;
}

/**
 * @returns last midnight if 0
 */
export function midnightNDaysAgo(daysAgo = 0): Date {
  const msInHr = 60 * 60 * 1000;
  const offset = getLocalOffset();

  if (!lastMidnight) {
    const d = new Date();
    if (offset > 0) {
      const { day, month, year } = dateValues(d);
      d.setFullYear(year);
      d.setMonth(month - 1);
      d.setDate(day);
    }
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    d.setHours(0);
    lastMidnight = new Date(d.getTime() + msInHr * offset);
  }

  return new Date(lastMidnight.getTime() - msInHr * 24 * daysAgo);
}
