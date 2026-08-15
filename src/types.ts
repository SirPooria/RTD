export type ItemType = 'movie' | 'series' | 'special';

export interface MCUItem {
  id: string;
  chronoOrder: number;
  titleFa: string;
  titleEn: string;
  releaseYear: number;
  inUniverseYear: string; // e.g. "~۱۹۴۳ - ۱۹۴۵" or "۲۰۲۳"
  runtimeMinutes: number;
  runtimeOrEpsDisplay?: string; // e.g. "۲ ساعت و ۴ دقیقه" or "۱۸ قسمت + ۵ فیلم کوتاه"
  type: ItemType;
  rtScore: number; // Rotten Tomatoes score (e.g. 90)
  isEssential: boolean; // true = Green (Doomsday Road), false = Grey (Optional)
  eraId: string;
  watchFor: string; // "چرا باید دید؟"
  tiesIn: string; // "ارتباط با داستان اصلی" (Doomsday Tie-in)
  posterUrl: string;
  timelineNote?: string; // e.g. "⏱ صحنه پس از تیتراژ..."
  phase?: number;
  directorOrCreator?: string;
  keyCharacters?: string[];
  trailerUrl?: string;
}

export interface Era {
  id: string;
  titleFa: string;
  titleEn: string;
  periodFa: string; // e.g. "۱۹۴۳ - ۱۹۹۵"
  descriptionFa: string;
}

export type FilterStatus = 'all' | 'essential' | 'optional' | 'unwatched' | 'watched';

export interface VisitorStats {
  date: string;
  visitors: number;
  checks: number;
}

export interface MovieCheckStat {
  title: string;
  checkCount: number;
  isEssential: boolean;
}

export interface RegisteredUser {
  id: string;
  username: string;
  password: string;
  registeredAt: string;
  lastLoginAt: string;
  watchedCount?: number;
  watchedIds?: string[];
}
