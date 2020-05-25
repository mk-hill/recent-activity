import { v4 as uuid } from 'uuid';

import { createLogger } from '../logger';
import { Activities } from '../data';
import { GitLabActivity, Activity } from '../models';
import { buildActivityResponse } from './buildActivityResponse';

const log = createLogger('services/createGitLabActivity');

interface GitLabActivityData {
  activityId: string;
  repoName: string;
  title: string;
  description: string;
  state: string;
  squash: boolean;
  performedAt: string;
  mergedAt: string;
  closedAt: string;
  mergedBy: string;
  closedBy: string;
  targetBranch: string;
  sourceBranch: string;
  approvals: number;
}

export async function createGitLabActivity({ performedAt, mergedAt, closedAt, ...data }: GitLabActivityData): Promise<Activity> {
  log.info('Creating GitLab activity', { data });
  try {
    const activity: GitLabActivity = {
      ...data,
      publicId: uuid(),
      isPrivate: true,
      partition: process.env.PARTITION,
      performedAt: new Date(performedAt).toISOString(),
      mergedAt: mergedAt ? new Date(mergedAt).toISOString() : null,
      closedAt: closedAt ? new Date(closedAt).toISOString() : null,
      source: 'gitlab',
      type: 'mergeRequest',
    };
    log.info('Saving GitLab activity', { activity });
    return Activities.create(activity).then(buildActivityResponse);
  } catch (error) {
    log.error('Unable to create GitLab activity', { error });
    throw error;
  }
}
