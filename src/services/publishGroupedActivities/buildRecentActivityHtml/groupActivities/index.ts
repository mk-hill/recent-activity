import { Activity } from '../../../../models';
import { groupActivitiesByDay } from './byDay';
import { groupActivitiesByRepo } from './byRepo';
import { splitMatching, isToday } from '../../util';

export enum GroupBy {
  DAY = 'DAY',
  REPO = 'REPO',
}

/**
 * @returns Array of grouped activity arrays. By default, groups today's activities by repo and rest by day.
 *
 * @param activities - array of activities to group
 * @param groupBy - Override default behavior and group all activities as specified.
 * When grouping by repo, private repos are grouped together. Activities without repos are returned in a group
 * of their own.
 */
export function groupActivities(activities: Activity[], groupBy: GroupBy): Activity[][] {
  switch (groupBy) {
    case GroupBy.DAY:
      return groupActivitiesByDay(activities);
    case GroupBy.REPO:
      return groupActivitiesByRepo(activities);
    default: {
      const { matching: today, rest } = splitMatching(({ date }) => isToday(date), activities);
      return [...groupActivitiesByRepo(today), ...groupActivitiesByDay(rest)];
    }
  }
}
