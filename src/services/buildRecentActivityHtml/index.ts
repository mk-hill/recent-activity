import { Activity, GitHubPush } from '../../models';
import { createLogger } from '../../logger';
import { ActivityGroup } from './ActivityGroup';
import { isSameDay, isGitHubPush, groupByDay, mostRecentDate } from './util';

const log = createLogger('services/buildActivityHtml');

export function buildRecentActivityHtml(activities: Activity[], maxDays = 10): string {
  try {
    log.info(`Building HTML for ${activities.length} activities`);

    activities.forEach(populateDates);

    const pushes = activities.filter(isGitHubPush).map(splitIfHasCommitsInMultipleDays).flat();

    const otherActivities = activities.filter((activity) => !isGitHubPush(activity));

    const activitiesByDay = splitByDate([...otherActivities, ...pushes]).slice(0, maxDays);

    log.info(`Grouped activities into ${activitiesByDay.length} days, using most recent ${Math.min(activitiesByDay.length, maxDays)}`, {
      activitiesByDay,
    });

    return activitiesByDay.map((activitiesInSingleDay) => ActivityGroup.toHtml(activitiesInSingleDay)).join('\n');
  } catch (error) {
    log.error('Unable to build recent activities HTML', { error });
    throw error;
  }
}

/**
 * @returns Array of activity arrays split and sorted by date
 */
function splitByDate(activities: Activity[]): Activity[][] {
  const dayToActivities = groupByDay(activities);
  log.debug('Grouped activities by day', { dayToActivities });
  return Object.entries(dayToActivities)
    .sort(([dateKey1], [dateKey2]) => new Date(dateKey2).getTime() - new Date(dateKey1).getTime())
    .map(([_, activities]) => activities);
}

/**
 * @returns commits grouped under separate activities if single push
 * included commits from multiple days, single activity otherwise
 */
function splitIfHasCommitsInMultipleDays(activity: Activity): Activity[] | Activity {
  if (!isGitHubPush(activity)) return activity;
  const push = activity as GitHubPush;
  const { commits } = push;

  if (commits.every(({ date }) => isSameDay(date, commits[0].date))) return push;

  const dayToCommits = groupByDay(commits);
  log.debug('Grouped commits by day', { commitsByDay: dayToCommits });
  return Object.values(dayToCommits).map((commits) => {
    const date = mostRecentDate(commits);
    return {
      ...push,
      title: `Created ${commits.length} commits in ${push.repoName}`,
      commits,
      date,
      performedAt: date.toISOString(),
    };
  });
}

/**
 * Populate dates in place
 */
function populateDates(activity: Activity) {
  const { performedAt } = activity;
  activity.date = new Date(performedAt);
  if (isGitHubPush(activity)) {
    (activity as GitHubPush).commits.forEach((commit) => {
      commit.date = new Date(commit.timestamp);
    });
  }
  return activity;
}
