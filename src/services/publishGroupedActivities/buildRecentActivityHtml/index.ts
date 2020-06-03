import { Activity } from '../../../models';
import { createLogger } from '../../../logger';
import { ActivityGroup } from './ActivityGroup';
import { populateDates, sortAllByDate } from '../util';
import { GroupBy, groupActivities } from './groupActivities';

const log = createLogger('services/buildActivityHtml');

/**
 * @returns array of HTML strings for each <li>, with the list items and their details sorted by date
 */
export function buildRecentActivityHtml(activities: Activity[], groupBy?: GroupBy): string[] {
  try {
    log.info(`Building HTML for ${activities.length} activities, grouping by ${groupBy?.toLowerCase() ?? 'default'}`);

    activities.forEach(populateDates);

    return sortAllByDate(groupActivities(activities, groupBy), true)
      .map((activitiesInSingleGroup) => {
        try {
          return ActivityGroup.toHtml(activitiesInSingleGroup, groupBy);
        } catch (error) {
          log.error('Skipping group', { activitiesInSingleGroup, error });
        }
      })
      .filter(Boolean);
  } catch (error) {
    log.error('Unable to build recent activity HTML', { error });
    throw error;
  }
}
