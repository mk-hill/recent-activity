import { HasDateKey, mostRecentDate, hourMinute, referenceWords, isSameDay, link } from '../util';
import { Repo } from '../../../models';

export interface ActivityDetail {
  html: string;
  time: string;
  isTimeGrouped: boolean;
  date: Date;
}

export function createDetail(html: string, dateSource: Date | HasDateKey[]): ActivityDetail {
  let time;
  let isTimeGrouped;
  let date;

  if (!Array.isArray(dateSource)) {
    date = dateSource;
    time = hourMinute(date);
    isTimeGrouped = false;
  } else {
    date = mostRecentDate(dateSource); // Only take most recent time when grouping
    time = hourMinute(date);
    isTimeGrouped = dateSource.length > 1;
  }
  return {
    html,
    time,
    isTimeGrouped,
    date,
  };
}

interface CreateRepoDetailsOptions {
  numDetails: number;
  numRepos: number;
  groupCommits: boolean;
}

export function createRepoDetails(repo: Repo, { numDetails, numRepos, groupCommits }: CreateRepoDetailsOptions): ActivityDetail[] {
  const { isPrivate, name, commits, mergeRequests, url, creationActivity } = repo;

  const details: ActivityDetail[] = [];

  const hasMultipleDetails = numDetails > 1;
  const hasMultipleRepos = numRepos > 1;
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
      if (!groupCommits) {
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
    if (hasMultipleDetails || mergeRequests[0].state === 'merged') {
      let displayDate = mostRecentDate(mergeRequests);
      let openText = `Opened ${num} ${word} in a private repository`;
      let mergedText = matching ? `${matching} ${were} merged` : '';
      const delim = ', ';

      if (!hasMultipleDetails && matching) {
        // Single merged request
        openText = ''; // Don't repeat title
        const mergeDate = new Date(mergeRequests[0].mergedAt);
        if (isSameDay(mergeDate, displayDate)) displayDate = mergeDate; // Display merge date instead since opening mr isn't mentioned
        mergedText = `${mergedText[0].toUpperCase()}${mergedText.slice(1)}`;
      }

      details.push(createDetail(`${openText}${openText && mergedText ? delim : ''}${mergedText}`, displayDate));
    }
  }

  return details;
}
