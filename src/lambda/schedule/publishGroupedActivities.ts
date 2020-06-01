import { ScheduledHandler } from 'aws-lambda';
import { createLogger } from '../../logger';
import { publishGroupedActivities } from '../../services';

const logger = createLogger('schedule/publishGroupedActivities');

/**
 * Publish grouped activities to website
 */
export const handler: ScheduledHandler = async (event, context) => {
  logger.info('Received event', { event, context });
  try {
    await publishGroupedActivities();
  } catch (error) {
    logger.error('Unable to update publish grouped activities', { error });
    throw error;
  }
};
