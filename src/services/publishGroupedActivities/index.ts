import * as cheerio from 'cheerio';
import { html_beautify as beautify } from 'js-beautify';

import { createLogger } from '../../logger';
import { getWebsiteHtml, saveWebsiteHtml } from '../../data/websiteBucket';
import { Activities } from '../../data';
import { buildRecentActivityHtml } from './buildRecentActivityHtml';
import { splitMatching, isGitActivity, midnightNDaysAgo } from './util';
import { Activity, GitActivity } from '../../models';

const log = createLogger('services/publishGroupedActivities');

/**
 * @param maxDays - number of days back from today to query for activities
 * @param maxDisplayItems - max number of <li> elements to display
 */
export async function publishGroupedActivities(maxDays = 30, maxDisplayItems = 10): Promise<void> {
  try {
    log.info('Updating website', { maxDays, maxDisplayItems });
    const html = await getWebsiteHtml();
    log.info('Retrieved website HTML');

    const $ = cheerio.load(html);
    const activityList = $('#recent-activity');
    log.debug('Found recent activity <ul>', { previousContents: activityList.html() });

    const minDate = midnightNDaysAgo(maxDays).toISOString();

    const recentActivities = await Activities.getRecent({ minDate });
    const listItems = buildRecentActivityHtml(retroactivelyPublicizeRepos(recentActivities)).slice(0, maxDisplayItems);

    activityList.html(listItems.join('\n'));

    log.debug('Updated recent activity <ul> contents', { newContents: activityList.html() });

    const body = $('body');
    body.html(beautify(body.html(), { preserve_newlines: false, indent_size: 2, indent_char: ' ' }));
    log.info('Beautified body HTML');

    await saveWebsiteHtml($.html());
    log.info('Updated website HTML');
  } catch (error) {
    log.error('Unable to update Website', { error });
    throw error;
  }
}

/**
 * Make previous private activities in repo public if the repo was made public in a later activity
 */
function retroactivelyPublicizeRepos(activities: Activity[]) {
  const { matching, rest } = splitMatching(isGitActivity, activities);
  const gitActivities = matching as GitActivity[];
  const repoToIsPublic = gitActivities.reduce((nameToIsPublic, { repoName, isPrivate }) => {
    // Set if repoName wasn't set, overwrite if previously set to private
    if (!nameToIsPublic[repoName]) nameToIsPublic[repoName] = !isPrivate;
    return nameToIsPublic;
  }, {});

  gitActivities
    .filter(({ repoName }) => repoName)
    .forEach((activity) => {
      activity.isPrivate = !repoToIsPublic[activity.repoName];
    });

  return [...gitActivities, ...rest];
}
