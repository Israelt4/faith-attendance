// aggregate.jsx — derive views from window.ATTENDANCE
// Exposes window.agg with pre-computed slices.

(function(){
  const ROWS = window.ATTENDANCE;
  const CAMPUSES = window.CAMPUSES;
  const SERVICE_CATS = window.SERVICE_CATS;

  // Filter helper
  function applyFilter(rows, filter) {
    if (!filter) return rows;
    return rows.filter(r => {
      if (filter.campuses && filter.campuses.length && !filter.campuses.includes(r.campus)) return false;
      if (filter.cats && filter.cats.length && !filter.cats.includes(r.cat)) return false;
      if (filter.years && filter.years.length && !filter.years.includes(r.year)) return false;
      if (filter.from && r.date < filter.from) return false;
      if (filter.to && r.date > filter.to) return false;
      return true;
    });
  }

  // Group by week (Wed→Sun). The CSV's "Week Of" column is the Wednesday of
  // each week, so weekOf is already the right bucket. A week is *complete*
  // once today is at least the Sunday of that bucket (5 days after Wed).
  function isCompleteWeek(weekOf, today=new Date()) {
    const wed = new Date(weekOf + 'T00:00:00');
    const sun = new Date(wed); sun.setDate(sun.getDate() + 4);
    return today >= sun;
  }

  function byWeek(rows) {
    const map = new Map();
    rows.forEach(r => {
      if (!map.has(r.weekOf)) map.set(r.weekOf, { weekOf: r.weekOf, total:0, fk:0, main:0, ms:0, n:0 });
      const e = map.get(r.weekOf);
      e.total += r.total || 0;
      e.fk += r.fk || 0;
      e.main += r.main || 0;
      e.ms += r.ms || 0;
      e.n += 1;
    });
    return [...map.values()].sort((a,b) => a.weekOf < b.weekOf ? -1 : 1);
  }

  function byMonth(rows) {
    const map = new Map();
    rows.forEach(r => {
      const key = r.year + '-' + String(r.month).padStart(2,'0');
      if (!map.has(key)) map.set(key, { key, year:r.year, month:r.month, total:0, fk:0, main:0, ms:0, n:0 });
      const e = map.get(key);
      e.total += r.total || 0;
      e.fk += r.fk || 0;
      e.main += r.main || 0;
      e.ms += r.ms || 0;
      e.n += 1;
    });
    return [...map.values()].sort((a,b) => a.key < b.key ? -1 : 1);
  }

  function byCampus(rows) {
    const map = new Map();
    CAMPUSES.forEach(c => map.set(c, { campus:c, total:0, fk:0, main:0, ms:0, n:0 }));
    rows.forEach(r => {
      const e = map.get(r.campus);
      if (!e) return;
      e.total += r.total || 0;
      e.fk += r.fk || 0;
      e.main += r.main || 0;
      e.ms += r.ms || 0;
      e.n += 1;
    });
    return [...map.values()];
  }

  function byCat(rows) {
    const map = new Map();
    SERVICE_CATS.forEach(c => map.set(c, { cat:c, total:0, n:0 }));
    rows.forEach(r => {
      const e = map.get(r.cat);
      if (!e) return;
      e.total += r.total || 0;
      e.n += 1;
    });
    return [...map.values()];
  }

  // Heatmap: campus rows × month cols (avg per service)
  function heatmap(rows) {
    const months = [];
    const seen = new Set();
    rows.forEach(r => {
      const k = r.year + '-' + String(r.month).padStart(2,'0');
      if (!seen.has(k)) { seen.add(k); months.push({key:k, year:r.year, month:r.month}); }
    });
    months.sort((a,b) => a.key < b.key ? -1 : 1);
    const data = CAMPUSES.map(c => months.map(m => {
      const matched = rows.filter(r => r.campus===c && r.year===m.year && r.month===m.month);
      if (!matched.length) return null;
      return matched.reduce((s,r) => s + (r.total||0), 0);
    }));
    return { campuses: CAMPUSES, months: months.map(m => m.month + '/' + String(m.year).slice(2)), data };
  }

  // KPI: latest completed week vs prior completed week (Wed→Sun definition).
  // avgWeek divides by COMPLETED week count, not service count.
  function kpis(rows, today=new Date()) {
    const allWeeks = byWeek(rows);
    const completedWeeks = allWeeks.filter(w => isCompleteWeek(w.weekOf, today));
    const latest = completedWeeks[completedWeeks.length-1];
    const prev = completedWeeks[completedWeeks.length-2];
    const ytd = rows.filter(r => r.year === Math.max(...rows.map(x=>x.year))).reduce((s,r)=> s+(r.total||0), 0);
    const totalAll = rows.reduce((s,r)=> s+(r.total||0), 0);
    const completedTotal = completedWeeks.reduce((s,w)=> s+w.total, 0);
    const avgWeek = completedWeeks.length ? Math.round(completedTotal / completedWeeks.length) : 0;
    const totalFK = rows.reduce((s,r)=> s+(r.fk||0), 0);
    const totalMS = rows.reduce((s,r)=> s+(r.ms||0), 0);
    const totalMain = rows.reduce((s,r)=> s+(r.main||0), 0);
    return {
      latestWeek: latest,
      prevWeek: prev,
      ytdTotal: ytd,
      allTimeTotal: totalAll,
      avgWeek,
      mainServiceTotal: totalMain,
      faithKidsTotal: totalFK,
      mainstreamTotal: totalMS,
      weekCount: completedWeeks.length,
      serviceCount: rows.length,
      completedWeeks,
      allWeeks,
    };
  }

  // Match a current week to the same week last year by ISO-week index.
  function isoWeek(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const onejan = new Date(d.getFullYear(),0,1);
    return Math.ceil((((d - onejan)/86400000) + onejan.getDay()+1)/7);
  }

  function sameWeekLastYear(rows, weekOf) {
    const target = new Date(weekOf + 'T00:00:00');
    target.setDate(target.getDate() - 7*52); // ~1 yr earlier
    const tgtIso = isoWeek(weekOf);
    const tgtYear = new Date(weekOf + 'T00:00:00').getFullYear() - 1;
    // find weekOf in last year with same ISO week
    const candidates = rows.filter(r => r.year === tgtYear && isoWeek(r.weekOf) === tgtIso);
    if (!candidates.length) return null;
    return candidates.reduce((s,r)=> s+(r.total||0), 0);
  }

  window.agg = { applyFilter, byWeek, byMonth, byCampus, byCat, heatmap, kpis, isCompleteWeek, isoWeek, sameWeekLastYear };
})();
