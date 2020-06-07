import { Activity } from '../../../models';

export const link = (textContent: string, href: string, focusable = true): string =>
  `<a href="${href}" target="blank"${!focusable ? ' tabindex="-1"' : ''}>${textContent}</a>`;

export const referenceWords = (
  repos: number,
  commits = 0,
  mergeRequests = 0,
  numMerged = 0
): Record<'repo' | 'commit' | 'mr', ReferenceWords> => ({
  repo: referencesForWord('repository', repos),
  commit: referencesForWord('commit', commits),
  mr: referencesForWord('merge request', mergeRequests, numMerged),
});

/**
 * Replace first occurrence with link
 */
export function titleWithLinks(activity: Activity): string {
  if (!activity?.links?.title) return activity.title;
  const { title, links } = activity;
  return Object.entries(links.title).reduce(
    (titleText, [linkContent, linkUrl]) => titleText.replace(linkContent, link(linkContent, linkUrl)),
    title
  );
}

/**
 * Replace first occurrence with link
 */
export function descriptionWithLinks(activity: Activity): string {
  if (!activity?.links?.description) return activity.description;
  const { description, links } = activity;
  return Object.entries(links.description).reduce(
    (descriptionText, [linkContent, linkUrl]) => descriptionText.replace(linkContent, link(linkContent, linkUrl, false)),
    description
  );
}

interface ReferenceWords {
  word: string;
  num: 'a' | number;
  were: 'was' | 'were';
  matching: 'it' | 'both' | 'all' | number;
}

const plural = (word: string) => (word.endsWith('y') ? `${word.slice(0, word.length - 1)}ies` : `${word}s`);

function referencesForWord(word: string, number: number, compareTo = 0): ReferenceWords {
  let modifiedWord;
  let num;
  const were = compareTo > 1 ? 'were' : 'was';
  let matching;

  if (number === 1) {
    modifiedWord = word;
    num = 'a';
    matching = number === compareTo ? 'it' : 0;
  } else {
    modifiedWord = plural(word);
    num = number;
    if (number === 2 && number === compareTo) {
      matching = 'both';
    } else {
      matching = number === compareTo ? 'all' : compareTo;
    }
  }

  return {
    word: modifiedWord,
    num,
    were,
    matching,
  };
}
