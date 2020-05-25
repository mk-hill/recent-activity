import 'source-map-support/register';

import { createLogger } from '../../logger';
import { getRecentActivity } from '../../services';
import { createHttpHandler } from '../util';

const logger = createLogger('http/getRecentActivity');

async function eventHandler(event) {
  const recentActivity = await getRecentActivity(event.queryStringParameters?.limit);
  return {
    body: recentActivity,
    logMessage: 'Responding with recent activity',
  };
}

export const handler = createHttpHandler({
  eventHandler,
  logger,
  errorMessage: 'Unable to retrieve recent activity',
});
