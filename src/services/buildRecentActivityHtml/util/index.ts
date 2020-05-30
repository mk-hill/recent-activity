import { Activity } from '../../../models';

export {
  HasDateKey,
  mostRecentDate,
  monthDay,
  monthDayYear,
  hourMinute,
  isSameDay,
  isToday,
  isYesterday,
  groupByDay,
  sortByDate,
} from './date';

export { link, referenceWords } from './html';

export const isGitHubPush = ({ source, type }: Activity): boolean => source === 'github' && type === 'push';
export const isMergeRequest = ({ source, type }: Activity): boolean => source === 'gitlab' && type === 'mergeRequest';
