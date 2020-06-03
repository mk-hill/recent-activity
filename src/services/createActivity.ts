import { v4 as uuid } from 'uuid';

import { createLogger } from '../logger';
import { Activities } from '../data';
import { Activity } from '../models';
import { CreateCustomActivityRequest } from '../requests/CreateCustomActivityRequest';
import { buildActivityResponse } from './buildActivityResponse';

const log = createLogger('services/createCustomActivity');

export async function createActivity({
  title,
  id = uuid(),
  date = new Date().toISOString(),
  source = 'other',
  type = 'other',
  ...rest
}: CreateCustomActivityRequest): Promise<Activity> {
  if (!title) throw new Error('Cannot create activity without title');

  const activity: Activity = {
    title,
    activityId: id,
    partition: process.env.PARTITION,
    performedAt: date,
    source,
    type,
    ...rest,
  };
  log.info('Creating activity', { activity });
  return Activities.create(activity).then(buildActivityResponse);
}
