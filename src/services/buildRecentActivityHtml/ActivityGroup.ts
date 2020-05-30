import { createLogger } from '../../logger';
import { Activity, GitHubPush, MergeRequest, Commit, Repo } from '../../models';
import { referenceWords, link, monthDay, isToday, isYesterday, isSameDay } from './util';
import { categorizeActivities } from './categorizeActivities';
import { ActivityDetail, createDetail } from './ActivityDetail';

const log = createLogger('buildActivityHtml/ActivityGroup');

enum GroupBy {
  DAY = 'DAY',
}

export class ActivityGroup {
  private allActivities: (Activity | GitHubPush | MergeRequest)[];
  private pushes: GitHubPush[];
  private mergeRequests: MergeRequest[];
  private otherActivities: Activity[];

  private repos: Repo[] = [];
  private sources: Set<string> = new Set();
  private types: Set<string> = new Set();
  private commits: Commit[] = [];
  private hasPrivateActivity: boolean;
  private groupBy: GroupBy;
  private maxDetailItemsToRender: number;

  public static toHtml(activities: Activity[], groupBy = GroupBy.DAY, maxDetailItems = 5): string {
    ActivityGroup.validateInput(activities, groupBy);
    return new ActivityGroup(activities, groupBy, maxDetailItems).html;
  }

  private constructor(activities: Activity[], groupBy: GroupBy, maxDetailItems: number) {
    log.info('Creating activity group');
    this.allActivities = activities;
    this.groupBy = groupBy;
    this.maxDetailItemsToRender = maxDetailItems;

    Object.entries(categorizeActivities(activities)).forEach(([key, value]) => {
      this[key] = value;
    });

    log.info('Created activity group', {
      groupSize: this.allActivities.length,
      gitHubPushes: this.pushes.length,
      gitLabMergeRequests: this.mergeRequests.length,
      commits: Object.keys(this.commits).length,
      repos: [...this.repos],
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
                <span class="activity-time" title="CT">${this.activityDate}</span>
              </div>
              ${this.detailHtml}
            </li>`;
  }

  get detailHtml(): string {
    return !this.hasDetail
      ? ''
      : `
        <ul class="activity-detail">
          ${this.details.map(this.toDetailItemHtml).join('\n')}
        </ul>`;
  }

  private toDetailItemHtml({ html: text, time, isTimeGrouped }: ActivityDetail): string {
    return `
            <li class="activity-detail-item">
              <span class="activity-detail-item-text">${text}</span>
              <span class="activity-detail-item-time" title="${isTimeGrouped ? 'Most recent activity in CT' : 'CT'}">${time}</span>
            </li>`;
  }

  private static validateInput(activities: Activity[], groupBy: GroupBy) {
    log.debug(`Validating ActivityGroup input`, { activities });
    if (!activities.length) throw new Error('Cannot create empty ActivityGroup');
    if (groupBy !== GroupBy.DAY) throw new Error('Groupings except by day not implemented');
    if (!activities.every((activity) => activity.date)) throw new Error('Missing activity dates');

    if (activities.length > 1 && !activities.every(({ date }) => isSameDay(date, activities[0].date))) {
      throw new Error('All activities not on same day');
    }
  }

  get activityDate(): string {
    const firstActivityDate = this.allActivities[0].date;

    if (isToday(firstActivityDate)) return 'Today';

    if (isYesterday(firstActivityDate)) return 'Yesterday';

    return monthDay(firstActivityDate);
  }

  get hasDetail(): boolean {
    return this.allActivities.length > 1 || !!this.allActivities[0].description;
  }

  get listItemClass(): string {
    return `activity-item ${this.hasDetail ? 'has-detail collapsed' : ''}`;
  }

  get iconName(): string {
    if (this.sources.has('github') && this.sources.size === 1) return 'github';
    if (this.sources.has('gitlab') && this.sources.size === 1) return 'gitlab';
    if (this.sources.has('github') && this.sources.has('gitlab')) return 'git';
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
    if (this.allActivities.length === 1 && !this.hasPrivateActivity) return this.allActivities[0].title;
    const numCommits = this.commits.length;
    const numMergeRequests = this.mergeRequests.length;
    const numRepos = this.repos.length;
    const { repo, commit, mr } = referenceWords(numRepos, numCommits, numMergeRequests);

    if (numCommits && !numMergeRequests) {
      // Only github pushes
      if (numRepos === 1) {
        // Only commits in single repo
        const { name, url, isPrivate } = this.repos[0];
        if (isPrivate) return `Created ${commit.num} ${commit.word} in a private repository`;
        return `Created ${commit.num} ${commit.word} in ${link(name, url)}`;
      }
      return `Created ${commit.num} ${commit.word} in ${numRepos} repositories`;
    }

    if (numMergeRequests && !numCommits) {
      // Only (private) merge request(s)
      return `Opened ${mr.num} ${mr.word} in ${repo.num} private ${repo.word}`;
    }

    if (numCommits && numMergeRequests) {
      return `Created ${commit.num} ${commit.word} and ${mr.num} ${mr.word} in ${repo.num} ${repo.word}`;
    }

    return 'Multiple activities';
  }

  get numberOfDetailsWhichCanBeRendered(): number {
    let n = this.otherActivities.length;
    this.repos.forEach(({ isPrivate, commits, mergeRequests }) => {
      n += isPrivate ? 1 : commits.length + mergeRequests.length; // Group private repo details
    });
    return n;
  }

  get details(): ActivityDetail[] {
    if (this.allActivities.length === 1 && this.otherActivities.length) {
      const { description, date } = this.allActivities[0];
      return [createDetail(description, date)];
    }

    const numDetails = this.numberOfDetailsWhichCanBeRendered;
    const canRenderAll = numDetails <= this.maxDetailItemsToRender;
    const details: ActivityDetail[] = [];

    this.otherActivities.forEach(({ title, date }) => {
      details.push(createDetail(title, date));
    });

    this.repos.forEach(({ isPrivate, name, commits, mergeRequests, url }) => {
      const numCommits = commits.length;
      const numMrs = mergeRequests.length;
      const numMerged = mergeRequests.filter((mr) => mr.state === 'merged').length;
      const { commit, mr } = referenceWords(1, numCommits, numMrs, numMerged);
      if (numCommits) {
        // GitHub pushes
        const { num, word } = commit;
        if (isPrivate) {
          details.push(createDetail(`Created ${num} ${word} in a private repository`, commits));
        } else {
          if (canRenderAll) {
            commits.forEach(({ message, url: commitUrl, date }) => {
              details.push(createDetail(`${link(name, url)}: ${link(message, commitUrl)}`, date));
            });
          } else {
            details.push(createDetail(`Created ${num} ${word} in ${link(name, url)}`, commits));
          }
        }
      } else {
        // GitLab merge requests - assumed private
        const { num, word, matching, were } = mr;
        // No detail to create if single open request
        const hasMultipleDetails = numDetails > 1;
        if (hasMultipleDetails || this.mergeRequests[0].state === 'merged') {
          // Don't repeat title if only one merge request
          const openText = hasMultipleDetails ? `Opened ${num} ${word} in a private repository` : '';
          const mergedText = matching ? `${matching} ${were} merged` : '';
          const delim = ', ';
          details.push(createDetail(`${openText}${openText && mergedText ? delim : ''}${mergedText}`, mergeRequests));
        }
      }
    });

    return details.slice(0, this.maxDetailItemsToRender);
  }
}
