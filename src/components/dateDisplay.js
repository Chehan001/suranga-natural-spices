import { icon } from './icons.js';
import { $ } from '../utils/dom.js';

const timeZone = 'Asia/Colombo';
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
let timer;

function updateDate() {
  const now = new Date();
  const timeParts = Object.fromEntries(
    timeFormatter.formatToParts(now)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)])
  );
  const dateParts = Object.fromEntries(
    dateFormatter.formatToParts(now)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value])
  );
  const date = $('#today-value');
  if (date) {
    date.textContent = dateFormatter.format(now);
    date.dateTime = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  }

  const currentMinute = timeParts.hour * 60 + timeParts.minute;
  const delay = (1440 - currentMinute) * 60_000 -
    timeParts.second * 1000 - now.getMilliseconds();
  timer = setTimeout(updateDate, Math.max(1, delay));
}

export function startDateDisplay() {
  const iconContainer = $('.date-icon');
  if (iconContainer) iconContainer.innerHTML = icon('calendar', 20);

  function refreshWhenVisible() {
    if (document.visibilityState === 'visible') {
      clearTimeout(timer);
      updateDate();
    }
  }

  updateDate();
  document.addEventListener('visibilitychange', refreshWhenVisible);

  return () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', refreshWhenVisible);
  };
}
