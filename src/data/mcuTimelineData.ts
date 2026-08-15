import { Era, MCUItem } from '../types';
import timelineJsonData from './mcuTimelineData.json';

export const INITIAL_ERAS: Era[] = timelineJsonData.eras as Era[];
export const INITIAL_MCU_ITEMS: MCUItem[] = timelineJsonData.items as MCUItem[];

export const MOCK_VISITOR_STATS = [
  { date: 'شنبه', visitors: 142 },
  { date: 'یکشنبه', visitors: 185 },
  { date: 'دوشنبه', visitors: 210 },
  { date: 'سه‌شنبه', visitors: 195 },
  { date: 'چهارشنبه', visitors: 260 },
  { date: 'پنج‌شنبه', visitors: 340 },
  { date: 'جمعه', visitors: 410 }
];
