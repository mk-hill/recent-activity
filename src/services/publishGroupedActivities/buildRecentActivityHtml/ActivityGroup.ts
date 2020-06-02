import { createLogger } from '../../../logger';
import { Activity, GitHubPush, MergeRequest, Commit, Repo, GitActivity } from '../../../models';
import { categorizeActivities } from './categorizeActivities';
import { ActivityDetail, createDetail } from './ActivityDetail';
import { GroupBy } from './groupActivities';
import {
  referenceWords,
  link,
  monthDay,
  isToday,
  isYesterday,
  isSameDay,
  fullDate,
  mostRecentDate,
  timeZone,
  sortByDate,
  titleWithLinks,
  descriptionWithLinks,
} from '../util';

const log = createLogger('buildActivityHtml/ActivityGroup');

export class ActivityGroup {
  private allActivities: (Activity | GitHubPush | MergeRequest)[];
  private pushes: GitHubPush[];
  private mergeRequests: MergeRequest[];
  private otherActivities: Activity[];

  private repos: Repo[] = [];
  private newRepos: Repo[] = [];
  private sources: Set<string> = new Set();
  private types: Set<string> = new Set();
  private commits: Commit[] = [];
  private hasPrivateActivity: boolean;
  private groupBy: GroupBy;
  private maxDetailItemsToRender: number;

  public static toHtml(activities: Activity[], groupBy = GroupBy.DAY, maxDetailItems = 20): string {
    ActivityGroup.validateInput(activities, groupBy);
    return new ActivityGroup(activities, groupBy, maxDetailItems).html;
  }

  private static validateInput(activities: Activity[], groupBy: GroupBy) {
    log.debug(`Validating ActivityGroup input`, { activities });
    if (!activities.length) throw new Error('Cannot create empty ActivityGroup');
    if (!activities.every((activity) => activity.date)) throw new Error('Missing activity dates');

    if (groupBy === GroupBy.DAY && activities.length > 1 && !activities.every(({ date }) => isSameDay(date, activities[0].date))) {
      throw new Error('All activities not on same day');
    }

    if (groupBy === GroupBy.REPO && activities.length > 1) {
      const gitActivities = activities as GitActivity[];
      if (!gitActivities.every(({ repoName }) => repoName === gitActivities[0].repoName)) {
        throw new Error('All activities not in same repo');
      }
    }
  }

  private constructor(activities: Activity[], groupBy: GroupBy, maxDetailItems: number) {
    log.info('Creating activity group');
    this.allActivities = activities;
    this.groupBy = groupBy;
    this.maxDetailItemsToRender = maxDetailItems;

    Object.entries(categorizeActivities(activities)).forEach(([key, value]) => {
      this[key] = value;
    });

    this.newRepos = this.repos.filter((repo) => repo.creationActivity);

    log.info('Created activity group', {
      groupSize: this.allActivities.length,
      gitHubPushes: this.pushes.length,
      gitLabMergeRequests: this.mergeRequests.length,
      commits: Object.keys(this.commits).length,
      repos: this.repos.length,
      activityTime: this.activityDate,
    });
  }

  get html(): string {
    return `
            <li class="${this.listItemClass}">
              <div class="activity-main">
                <div class="activity-left">
                  <svg class="activity-icon" xmlns="http://www.w3.org/2000/svg" viewBox="${this.iconViewBox}">
                    <use href="#path-${this.iconName}"></use>
                  </svg>
                  <svg class="activity-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                    <use href="#path-chevron"></use>
                  </svg>
                  <span class="activity-title">${this.titleHtml}</span>
                </div>
                ${this.activityDateHtml}
              </div>
              ${this.detailHtml}
            </li>`;
  }

  get listItemClass(): string {
    return `activity-item ${this.hasDetail ? 'has-detail collapsed' : ''}`;
  }

  get iconName(): string {
    const { sources } = this;
    if (sources.has('github') && sources.size === 1) return 'github';
    if (sources.has('gitlab') && sources.size === 1) return 'gitlab';
    if (sources.has('github') && sources.has('gitlab')) return 'git';
    return 'info';
  }

  get iconViewBox(): string {
    switch (this.iconName) {
      case 'github':
        return '0 0 496 512';
      case 'git':
        return '0 0 384 512';
      default:
        return '0 0 512 512';
    }
  }

  get titleHtml(): string {
    if (this.allActivities.length === 1 && this.otherActivities.length) return titleWithLinks(this.allActivities[0]);

    const numCommits = this.commits.length;
    const numMergeRequests = this.mergeRequests.length;
    const numRepos = this.repos.length;
    const { repo, commit, mr } = referenceWords(numRepos, numCommits, numMergeRequests);

    const numCreated = this.newRepos.length;
    const { repo: created } = referenceWords(numCreated);

    if (numRepos && numRepos === numCreated) {
      const { num, word } = created;
      if (numCreated === 1) {
        const { isPrivate, name, url } = this.repos[0];
        return `Created a new repository${!isPrivate ? `: ${link(name, url)}` : ''}`;
      } else {
        return `Created ${num} new ${word}${numCommits > numCreated ? ` and ${commit.num} ${commit.word}` : ''}`; // Initial commit redundant
      }
    }

    if (numCommits && !numMergeRequests) {
      // Only github pushes
      if (numRepos === 1) {
        // Only commits in single repo
        const { name, url, isPrivate } = this.repos[0];
        if (isPrivate) return `Created ${commit.num} ${commit.word} in a private repository`;
        if (numCommits === 1) {
          const { message, url: commitUrl } = this.commits[0];
          return `${link(name, url)}: ${link(message, commitUrl)}`;
        }
        return `Created ${commit.num} ${commit.word} in ${link(name, url)}`;
      }
      return numCreated
        ? `Created ${created.num} ${created.word} and ${commit.num} ${commit.word}`
        : `Created ${commit.num} ${commit.word} in ${numRepos} repositories`;
    }

    if (numMergeRequests && !numCommits) {
      // Only (private) merge request(s)
      return `Opened ${mr.num} ${mr.word} in ${repo.num} private ${repo.word}`;
    }

    if (numCommits && numMergeRequests) {
      return numCreated
        ? `Created ${created.num} ${created.word}, ${commit.num} ${commit.word}, and ${mr.num} ${mr.word}`
        : `Created ${commit.num} ${commit.word} and ${mr.num} ${mr.word} in ${repo.num} ${repo.word}`;
    }

    return 'Multiple activities';
  }

  get activityDateHtml(): string {
    // Add full date to title if times there aren't any detail items in which to show time
    const dateTime = this.hasDetail ? '' : `${fullDate(mostRecentDate(this.allActivities))}, `;
    const mostRecentLabel = !this.hasDetail && this.allActivities.length > 1 ? 'Most recent activity: ' : '';
    return `<span class="activity-time" title="${mostRecentLabel}${dateTime}Time zone: ${timeZone}">${this.activityDate}</span>`;
  }

  get detailHtml(): string {
    if (!this.hasDetail) return '';
    const { details } = this;
    return `
            <ul class="activity-detail" style="--detail-items: ${details.length};">
              ${details.map(this.toDetailItemHtml).join('\n')}
            </ul>`;
  }

  private toDetailItemHtml({ html: text, time, isTimeGrouped }: ActivityDetail): string {
    const mostRecentLabel = isTimeGrouped ? 'Most recent activity, ' : '';
    return `
            <li class="activity-detail-item">
              <span class="activity-detail-item-text">${text}</span>
              <span class="activity-detail-item-time" title="${mostRecentLabel}Time zone: ${timeZone}">${time}</span>
            </li>`;
  }

  get activityDate(): string {
    const firstActivityDate = this.allActivities[0].date;

    if (isToday(firstActivityDate)) return 'Today';

    if (isYesterday(firstActivityDate)) return 'Yesterday';

    return monthDay(firstActivityDate);
  }

  private _hasDetail: boolean;

  get hasDetail(): boolean {
    if (this._hasDetail !== undefined) return this._hasDetail;

    const hasMultipleRepos = this.repos.length > 1;
    const hasMergedMr = this.mergeRequests.some((mr) => mr.state === 'merged');
    const hasMultipleOtherActivities = this.otherActivities.length > 1;
    const hasSingleActivityWithDescription = this.allActivities.length === 1 && !!this.allActivities[0].description;
    const hasMultiplePublicCommits = this.repos.reduce((t, { isPrivate, commits }) => (isPrivate ? t : t + commits.length), 0) > 1;
    const hasNewRepoAndCommit = this.newRepos.length && this.repos.some((repo) => repo.commits.length);

    this._hasDetail =
      hasMultipleRepos ||
      hasMergedMr ||
      hasMultipleOtherActivities ||
      hasSingleActivityWithDescription ||
      hasMultiplePublicCommits ||
      hasNewRepoAndCommit;

    log.debug(`This group ${this._hasDetail ? 'has' : 'does not have any'} details`, {
      hasMultipleRepos,
      hasMergedMr,
      hasMultipleOtherActivities,
      hasSingleActivityWithDescription,
      hasMultiplePublicCommits,
    });

    return this._hasDetail;
  }

  get numberOfDetailsWhichCanBeRendered(): number {
    let n = this.otherActivities.length;
    this.repos.forEach(({ isPrivate, commits, mergeRequests, creationActivity }) => {
      n += isPrivate ? 1 : commits.length + mergeRequests.length; // Group private repo details
      if (creationActivity) n++;
    });
    return n;
  }

  get details(): ActivityDetail[] {
    if (!this.hasDetail) return;

    if (this.allActivities.length === 1 && this.otherActivities.length && !this.hasPrivateActivity) {
      const activity = this.allActivities[0];
      return [createDetail(descriptionWithLinks(activity), activity.date)];
    }

    const numDetails = this.numberOfDetailsWhichCanBeRendered;
    const canRenderAll = numDetails <= this.maxDetailItemsToRender;
    const hasMultipleRepos = this.repos.length > 1;
    const hasMultipleDetails = numDetails > 1;
    const details: ActivityDetail[] = [];

    this.otherActivities.forEach((activity) => {
      details.push(createDetail(titleWithLinks(activity), activity.date));
    });

    this.repos.forEach(({ isPrivate, name, commits, mergeRequests, url, creationActivity }) => {
      const numCommits = commits.length;
      const numMrs = mergeRequests.length;
      const numMerged = mergeRequests.filter((mr) => mr.state === 'merged').length;
      const { commit, mr } = referenceWords(1, numCommits, numMrs, numMerged);
      if (numCommits) {
        // GitHub pushes
        const { num, word } = commit;
        if (isPrivate) {
          // Don't duplicate title for single private repo activity
          if (hasMultipleDetails) details.push(createDetail(`Created ${num} ${word} in a private repository`, commits));
        } else {
          if (hasMultipleRepos && creationActivity) {
            details.push(createDetail(`Created a new repository: ${link(name, url)}`, creationActivity.date));
          }
          if (canRenderAll) {
            commits.forEach(({ message, url: commitUrl, date }) => {
              const repoLink = hasMultipleRepos ? `${link(name, url)}: ` : ''; // Don't add redundant repo name
              details.push(createDetail(`${repoLink}${link(message, commitUrl)}`, date));
            });
          } else {
            details.push(createDetail(`Created ${num} ${word} in ${link(name, url)}`, commits));
          }
        }
      } else {
        // GitLab merge requests - assumed private
        const { num, word, matching, were } = mr;
        // No detail to create if single open request
        if (hasMultipleDetails || this.mergeRequests[0].state === 'merged') {
          let displayDate = mostRecentDate(mergeRequests);
          let openText = `Opened ${num} ${word} in a private repository`;
          let mergedText = matching ? `${matching} ${were} merged` : '';
          const delim = ', ';

          if (!hasMultipleDetails && matching) {
            // Single merged request
            openText = ''; // Don't repeat title
            const mergeDate = new Date(this.mergeRequests[0].mergedAt);
            if (isSameDay(mergeDate, displayDate)) displayDate = mergeDate; // Display merge date instead since opening mr isn't mentioned
            mergedText = `${mergedText[0].toUpperCase()}${mergedText.slice(1)}`;
          }

          details.push(createDetail(`${openText}${openText && mergedText ? delim : ''}${mergedText}`, displayDate));
        }
      }
    });

    return sortByDate(details).slice(0, this.maxDetailItemsToRender);
  }
}
