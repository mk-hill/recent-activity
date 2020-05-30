import { DocumentClient } from '../aws';
import { createLogger } from '../logger';
import { Activity } from '../models';

const TableName = process.env.ACTIVITIES_TABLE;
const IndexName = process.env.TIME_INDEX;
const partition = process.env.PARTITION;

const db = new DocumentClient();
const log = createLogger('data/activitiesTable');

const query = (params) => db.query({ TableName, ...params }).promise();

/**
 * Limit by number of items and/or minimum date
 */
async function getRecentActivity({ limit: Limit, minDate }: { limit?: number; minDate?: string }) {
  try {
    log.info(`Getting most recent activities`, { Limit, minDate });

    const data = await query({
      IndexName,
      KeyConditionExpression: `#partition = :partition${minDate ? ' and performedAt > :minDate' : ''}`,
      ExpressionAttributeValues: {
        ':partition': partition,
        ':minDate': minDate,
      },
      ExpressionAttributeNames: {
        '#partition': 'partition',
      },
      ScanIndexForward: false,
      Limit,
    });

    if (!data.Items.length) {
      throw new Error(`Could not find any matching activities`);
    }

    log.debug(`Retrieved data`, { data });
    return data.Items as Activity[];
  } catch (error) {
    log.error('Unable to retrieve recent activity', { error });
  }
}

async function createActivity(activity: Activity) {
  log.debug(`Saving activity`, { activity });
  try {
    activity.savedAt = new Date().toISOString();
    const result = await db.put({ TableName, Item: activity }).promise();
    log.info(`Put complete`, { result });
    return activity;
  } catch (error) {
    log.error('Unable to save activity', { error });
    throw error;
  }
}

export const Activities = {
  getRecent: getRecentActivity,
  create: createActivity,
};
