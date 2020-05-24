import { createLogger } from '../util';
import { Activities } from '../data';
import { Activity } from '../model';

const log = createLogger('services/createCustomActivity');

const removePartitionInfo = (activities: Activity[]) => activities.map(({ partition, ...activityProps }) => activityProps);

export function getRecentActivity(limit = 20) {
  log.info(`Retrieving most recent ${limit} activities`);
  return Activities.getRecent(limit).then(removePartitionInfo);
}
