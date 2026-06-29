// CreatorFlow — KST 날짜 유틸리티
import { format, formatDistanceToNow, isToday, isYesterday, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

const KST_OFFSET = 9 * 60; // UTC+9 in minutes

/**
 * 현재 KST 시간
 */
export function nowKST() {
  return new Date();
}

/**
 * date-fns 포맷 (한국어 로케일)
 */
export function formatKST(date, formatStr = 'yyyy.MM.dd') {
  return format(new Date(date), formatStr, { locale: ko });
}

/**
 * 상대 시간 (한국어)
 */
export function timeAgoKST(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
}

/**
 * 오늘인지 확인
 */
export function isTodayKST(date) {
  return isToday(new Date(date));
}

/**
 * 어제인지 확인
 */
export function isYesterdayKST(date) {
  return isYesterday(new Date(date));
}

/**
 * 스마트 날짜 표시
 * 오늘: "오후 3:24"
 * 어제: "어제"
 * 올해: "3월 15일"
 * 다른 해: "2024.03.15"
 */
export function smartDate(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'a h:mm', { locale: ko });
  if (isYesterday(d)) return '어제';
  if (d.getFullYear() === new Date().getFullYear()) {
    return format(d, 'M월 d일', { locale: ko });
  }
  return format(d, 'yyyy.MM.dd');
}

/**
 * 캘린더용 — 해당 월의 날짜 배열
 */
export function getMonthDays(year, month) {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const weekStart = startOfWeek(start, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(end, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

/**
 * 해당 주의 날짜 배열
 */
export function getWeekDays(date) {
  const start = startOfWeek(new Date(date), { weekStartsOn: 0 });
  const end = endOfWeek(new Date(date), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

/**
 * 같은 날인지 확인
 */
export function isSameDayCheck(date1, date2) {
  return isSameDay(new Date(date1), new Date(date2));
}

/**
 * 날짜 이동
 */
export { addDays, addWeeks, addMonths, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, parseISO };
