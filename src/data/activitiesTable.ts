import { DocumentClient } from '../aws';
import { createLogger } from '../util';
import { Activity } from '../model';

const TableName = process.env.ACTIVITIES_TABLE;
const partition = process.env.PARTITION;

const db = new DocumentClient();
const log = createLogger('data/activitiesTable');

const query = (params) => db.query({ TableName, ...params }).promise();

async function getRecentActivity(limit: number) {
  log.debug(`Getting most recent ${limit} activities`);

  const data = await query({
    KeyConditionExpression: '#partition = :partition',
    ExpressionAttributeValues: {
      ':partition': partition,
    },
    ExpressionAttributeNames: {
      '#partition': 'partition',
    },
    ScanIndexForward: false,
    Limit: limit,
  });

  if (!data.Items.length) {
    throw new Error(`Could not find any matching activities`);
  }

  log.info(`Retrieved data`, { data });
  return data.Items as Activity[];
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
