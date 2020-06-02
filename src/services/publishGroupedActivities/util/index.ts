import { Activity } from '../../../models';

export {
  timeZone,
  HasDateKey,
  mostRecentDate,
  monthDay,
  monthDayYear,
  hourMinute,
  fullDate,
  isSameDay,
  isToday,
  isYesterday,
  groupByDay,
  sortByDate,
  sortAllByDate,
  populateDates,
  midnightNDaysAgo,
} from './date';
export { link, referenceWords, titleWithLinks, descriptionWithLinks } from './string';

export const isGitHubPush = ({ source, type }: Activity): boolean => source === 'github' && type === 'push';
export const isMergeRequest = ({ source, type }: Activity): boolean => source === 'gitlab' && type === 'mergeRequest';
export const isGitActivity = ({ source }: Activity): boolean => source === 'github' || source === 'gitlab';
export const isRepoCreation = ({ source, type }: Activity): boolean => source === 'github' && type === 'create';

export const splitMatching = <T>(predicate: (T) => boolean, ar: T[]): { matching: T[]; rest: T[] } =>
  ar.reduce(
    (map, item) => {
      if (predicate(item)) {
        map.matching.push(item);
      } else {
        map.rest.push(item);
      }
      return map;
    },
    { matching: [], rest: [] }
  );
