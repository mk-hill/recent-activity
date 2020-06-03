import { createLogger } from '../logger';
import { publishGroupedActivities } from '../services';
import { createHttpHandler } from './util';

const logger = createLogger('schedule/publishGroupedActivities');

/**
 * Publish grouped activities to website
 */
function eventHandler(event, context) {
  logger.info('Received event', { event, context });

  return publishGroupedActivities().then(() => ({
    body: 'Published grouped activities',
  }));
}

export const handler = createHttpHandler({
  eventHandler,
  logger,
  errorMessage: 'Unable to update publish grouped activities',
});
