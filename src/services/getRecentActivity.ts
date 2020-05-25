import { createLogger } from '../logger';
import { Activities } from '../data';
import { Activity } from '../model';

const log = createLogger('services/createCustomActivity');

const removePartitionInfo = (activities: Activity[]): Activity[] => activities.map(({ partition, ...activityProps }) => activityProps);

export function getRecentActivity(limit: string): Promise<Activity[]> {
  const numActivities = parseInt(limit) || 20;
  log.info(`Retrieving most recent ${numActivities} activities`);
  return Activities.getRecent(numActivities).then(removePartitionInfo);
}
