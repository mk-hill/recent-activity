import { ScheduledHandler } from 'aws-lambda';
import { createLogger } from '../../logger';
import { publishGroupedActivities } from '../../services';

const logger = createLogger('schedule/publishGroupedActivities');

/**
 * Group past activities on website every night
 */
export const handler: ScheduledHandler = (event, context) => {
  logger.info('Received event', { event, context });

  publishGroupedActivities()
    .then(() => {
      logger.info('Updated website contents');
    })
    .catch((error) => {
      logger.error('Unable to update website contents', { error });
      throw error;
    });
};
