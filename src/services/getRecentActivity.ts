import { createLogger } from '../logger';
import { Activities } from '../data';
import { Activity } from '../models';
import { buildActivityResponse } from './buildActivityResponse';

const log = createLogger('services/createCustomActivity');

const mapToResponseData = (activities: Activity[]): Activity[] => activities.map(buildActivityResponse);

export function getRecentActivity(limit: string): Promise<Activity[]> {
  const numActivities = parseInt(limit) || 20;
  log.info(`Retrieving most recent ${numActivities} activities`);
  return Activities.getRecent({ limit: numActivities }).then(mapToResponseData);
}
