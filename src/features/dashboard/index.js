import { state } from '../../core/store.js';
import { sum, productName, isExpense } from '../../core/selectors.js';
import { rs, esc, today, dayOffset } from '../../utils/format.js';
import { kpi, table } from '../../components/ui.js';
import morningBanner from '../../assest/Morning.png';
import afternoonBanner from '../../assest/Afternoon.png';
import eveningBanner from '../../assest/Evening.png';
import nightBanner from '../../assest/Night.png';

const COLORS = ['#16a34a', '#f59e0b', '#0ea5e9', '#a855f7', '#ef4444', '#14b8a6'];
const sriLankaClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Colombo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const banners = {
  morning: { image: morningBanner, alt: 'Good Morning, Suranga! Here is today’s business summary.' },
  afternoon: { image: afternoonBanner, alt: 'Good Afternoon, Suranga! Here is today’s business summary.' },
  evening: { image: eveningBanner, alt: 'Good Evening, Suranga! Here is today’s business summary.' },
  night: { image: nightBanner, alt: 'Good Night, Suranga! Here is today’s business summary.' },
};
let bannerTimer;

function getSriLankaTime(date = new Date()) {
  return Object.fromEntries(
    sriLankaClock.formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)])
  );
}

export function getGreetingBanner(hour) {
  if (hour >= 5 && hour < 12) return { period: 'morning', ...banners.morning };
  if (hour >= 12 && hour < 17) return { period: 'afternoon', ...banners.afternoon };
  if (hour >= 17 && hour < 20) return { period: 'evening', ...banners.evening };
  return { period: 'night', ...banners.night };
}

function scheduleBannerUpdate() {
  const now = new Date();
  const { hour, minute, second } = getSriLankaTime(now);
  const currentMinute = hour * 60 + minute;
  const nextBoundary = [300, 720, 1020, 1200, 1440].find((boundary) => boundary > currentMinute);
  const delay = (nextBoundary - currentMinute) * 60_000 - second * 1000 - now.getMilliseconds();
  bannerTimer = setTimeout(updateGreetingBanner, Math.max(1, delay));
}

function updateGreetingBanner() {
  const image = document.querySelector('#dashboard-greeting-image');
  if (!image) return;

  const banner = getGreetingBanner(getSriLankaTime().hour);
  if (image.dataset.period !== banner.period) {
    image.src = banner.image;
    image.alt = banner.alt;
    image.dataset.period = banner.period;
  }

  scheduleBannerUpdate();
}

export const dashboard = {
  id: 'dashboard', title: 'Home', icon: 'home',
  render() {
    const d = state.data, t0 = today();
    const banner = getGreetingBanner(getSriLankaTime().hour);
    const dayTotals = (day) => ({
      s: sum((x) => x.t === 'sale' && x.d === day, (x) => x.a),
      c: sum((x) => x.t === 'sale' && x.d === day, (x) => x.cg),
    });
    const t = dayTotals(t0);
    const purchases = sum((x) => x.t === 'purchase' && x.d === t0, (x) => x.a);
    const expenses = sum((x) => isExpense(x) && x.d === t0, (x) => x.a);
    const days = [6, 5, 4, 3, 2, 1, 0].map((i) => ({ l: dayOffset(i).slice(5), ...dayTotals(dayOffset(i)) }));
    const max = Math.max(1, ...days.map((x) => x.s));
    const byProduct = d.prod.map((p) => ({ n: p.n, v: sum((x) => x.t === 'sale' && x.pid === p.id, (x) => x.a) })).filter((x) => x.v);
    const total = byProduct.reduce((a, x) => a + x.v, 0) || 1;
    let acc = 0;
    const gradient = byProduct.map((x, i) => { const s = acc; acc += (x.v / total) * 100; return `${COLORS[i % 6]} ${s}% ${acc}%`; }).join(',');
    return `<div class="hero-banner"><img id="dashboard-greeting-image" data-period="${banner.period}" src="${banner.image}" alt="${banner.alt}"></div>
    <div class="kp">${kpi('Today’s sales', rs(t.s), 'c1')}${kpi('Gross profit (est.)', rs(t.s - t.c), 'c2')}${kpi('Purchases', rs(purchases), 'c3')}${kpi('Expenses', rs(expenses), 'c4')}</div>
    <div class="card"><h3>Quick actions</h3><div class="qa"><a href="#purchases">＋ Add purchase</a><a href="#sales">＋ Record sale</a><a href="#processing">＋ Add production</a><a href="#money">＋ Record expense</a></div></div>
    <div class="cols">
      <div class="card"><h3>Sales vs gross profit (7 days)</h3><div class="bars">${days.map((x) => `<div><span style="height:${(x.s / max) * 130}px;background:var(--chart-sales)"></span><span style="height:${(Math.max(0, x.s - x.c) / max) * 130}px;background:var(--chart-profit)"></span><br>${x.l}</div>`).join('')}</div><p class="lg"><i style="background:var(--chart-sales)"></i>Sales<i style="background:var(--chart-profit)"></i>Gross profit</p></div>
      <div class="card"><h3>Stock at a glance</h3>${table(['Product', 'Available'], d.prod.slice(0, 5).map((p) => [esc(p.n), Math.round(d.stock[p.id] || 0) + ' kg']))}</div>
      <div class="card"><h3>Sales by product</h3><div class="donut" style="background:conic-gradient(${gradient || 'var(--border) 0 100%'})"></div><p class="lg">${byProduct.map((x, i) => `<i style="background:${COLORS[i % 6]}"></i>${esc(x.n)} ${((x.v / total) * 100).toFixed(0)}%`).join('')}</p></div>
    </div>
    <div class="card"><h3>Recent transactions</h3>${table(['Date', 'Type', 'Product', 'Party', 'Qty', 'Amount'],
      d.tx.filter((x) => x.pid).slice().sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 8)
        .map((x) => [x.d, x.t, esc(productName(x.pid)), esc(x.who || 'Processing'), x.q + ' kg', rs(x.a)]))}</div>`;
  },
  mount() {
    clearTimeout(bannerTimer);
    updateGreetingBanner();
  },
  unmount() {
    clearTimeout(bannerTimer);
    bannerTimer = undefined;
  },
};
