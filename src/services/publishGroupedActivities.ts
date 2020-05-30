import * as cheerio from 'cheerio';
import { html_beautify as beautify } from 'js-beautify';

import { createLogger } from '../logger';
import { getWebsiteHtml, saveWebsiteHtml } from '../data/websiteBucket';
import { Activities } from '../data';
import { buildRecentActivityHtml } from './buildRecentActivityHtml';

const log = createLogger('services/publishGroupedActivities');

export async function publishGroupedActivities(maxDaysToQuery = 30): Promise<void> {
  try {
    log.info('Updating website');
    const html = await getWebsiteHtml();
    log.info('Retrieved website HTML');

    const $ = cheerio.load(html);
    const activityList = $('#recent-activity');
    log.debug('Found recent activity <ul>', { previousContents: activityList.html() });

    const msInDay = 1000 * 60 * 60 * 24;
    const minDate = new Date(Date.now() - msInDay * maxDaysToQuery).toISOString();

    const recentActivities = await Activities.getRecent({ minDate });
    activityList.html(buildRecentActivityHtml(recentActivities));
    log.debug('Updated recent activity <ul> contents', { newContents: activityList.html() });

    const body = $('body');
    body.html(beautify(body.html(), { preserve_newlines: false, indent_size: 2, indent_char: ' ' }));
    log.debug('Beautified body HTML');

    await saveWebsiteHtml($.html());
    log.info('Updated website HTML');
  } catch (error) {
    log.error('Unable to update Website', { error });
    throw error;
  }
}
