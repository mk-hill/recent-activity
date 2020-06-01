import { Activity, GitHubPush } from '../../../../models';
import { createLogger } from '../../../../logger';
import { isSameDay, isGitHubPush, groupByDay, mostRecentDate, sortAllByDate } from '../../util';

const log = createLogger('groupActivities/byDay');

export function groupActivitiesByDay(activities: Activity[], maxDays = 10): Activity[][] {
  try {
    log.info(`Grouping ${activities.length} activities by day`);

    const pushes = activities.filter(isGitHubPush).map(splitIfHasCommitsInMultipleDays).flat();

    const otherActivities = activities.filter((activity) => !isGitHubPush(activity));

    const activitiesByDay = splitByDate([...otherActivities, ...pushes]).slice(0, maxDays);

    log.info(`Grouped activities into ${activitiesByDay.length} days, using most recent ${Math.min(activitiesByDay.length, maxDays)}`, {
      activitiesByDay,
    });

    return activitiesByDay;
  } catch (error) {
    log.error('Unable to group activities', { error });
    throw error;
  }
}

/**
 * @returns Array of activity arrays split and sorted by date
 */
function splitByDate(activities: Activity[]): Activity[][] {
  const dayToActivities = groupByDay(activities);
  log.debug('Grouped activities by day', { dayToActivities });
  return sortAllByDate(Object.values(dayToActivities), true);
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
