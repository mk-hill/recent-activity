import { Activity, GitActivity } from '../../../../models';
import { createLogger } from '../../../../logger';
import { isGitActivity, sortAllByDate, splitMatching } from '../../util';

const log = createLogger('groupActivities/byRepo');

const groupGitActivitiesByRepo = (gitActivities: GitActivity[], groupAllPrivate: boolean): GitActivity[][] =>
  Object.values(
    gitActivities.reduce((repoNameToActivities, activity) => {
      const { repoName, isPrivate } = activity;
      const key = groupAllPrivate && isPrivate ? 'private' : repoName;
      if (!repoNameToActivities[key]) repoNameToActivities[key] = [];
      repoNameToActivities[key].push(activity);
      return repoNameToActivities;
    }, {})
  );

/**
 * Group git activities by repo, create separate group for each activity without repo
 */
export function groupActivitiesByRepo(activities: Activity[], groupAllPrivate = true): Activity[][] {
  try {
    log.info(`Grouping ${activities.length} activities by repo`);

    const { matching, rest: otherActivities } = splitMatching(isGitActivity, activities);

    const gitActivities = matching as GitActivity[];

    const activitiesByRepo = sortAllByDate([
      ...otherActivities.map((activity) => [activity]),
      ...groupGitActivitiesByRepo(gitActivities, groupAllPrivate),
    ]);

    log.info(
      `Returning activities in ${activitiesByRepo.length} groups, including ${otherActivities.length} without repo in their own groups.`,
      {
        activitiesByRepo,
      }
    );

    return activitiesByRepo;
  } catch (error) {
    log.error('Unable to group activities', { error });
    throw error;
  }
}
