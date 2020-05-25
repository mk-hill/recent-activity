import { v4 as uuid } from 'uuid';

import { createLogger } from '../logger';
import { Activities } from '../data';
import { Activity } from '../model';
import { CreateCustomActivityRequest } from '../requests/CreateCustomActivityRequest';

const log = createLogger('services/createCustomActivity');

export async function createCustomActivity({
  title,
  description,
  id = uuid(),
  date = new Date().toISOString(),
  source = 'custom',
  type = 'other',
}: CreateCustomActivityRequest): Promise<Activity> {
  const activity: Activity = {
    activityId: id,
    partition: process.env.PARTITION,
    performedAt: date,
    title,
    description,
    source,
    type,
  };
  log.info('Creating activity', { activity });
  return Activities.create(activity);
}
