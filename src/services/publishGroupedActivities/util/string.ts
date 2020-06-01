export const link = (textContent: string, href: string): string => `<a href="${href}" target="blank">${textContent}</a>`;

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
