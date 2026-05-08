// main-view.jsx — Faith Church · Leadership Weekly Check-In
// Single focused view: "How did we do this week — vs last week, vs same week last year?"
// Tabs: Overview / Trends / Campuses / Records

const M_THEME = {
  paper: '#f7f1e6',
  card: '#fbf6ec',
  cardAlt: '#f3ede0',
  rule: 'rgba(60,40,25,0.18)',
  ruleLight: 'rgba(60,40,25,0.10)',
  ink: '#231811',
  ink2: 'rgba(35,24,17,0.72)',
  ink3: 'rgba(35,24,17,0.52)',
  wine: '#7d3a35',
  clay: '#b87a4f',
  sage: '#6e8a6c',
  gold: '#a68534',
  rose: '#9c5a6a',
  good: '#5d7a4f',
  bad: '#a23a2e',
  display: '"Spectral", "Times New Roman", serif',
  sans: '"Hanken Grotesk", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", monospace'
};

function MainView({ density = 'comfortable' }) {
  const T = M_THEME;
  const ALL = window.ATTENDANCE;
  const TODAY = new Date();
  const [tab, setTab] = React.useState('overview'); // overview | trends | campuses | records
  const [drawer, setDrawer] = React.useState(null);
  const dens = density === 'compact';

  const k = window.agg.kpis(ALL, TODAY);
  const latest = k.latestWeek;
  const prev = k.prevWeek;

  // Same week last year
  const lastYearTotal = latest ? window.agg.sameWeekLastYear(ALL, latest.weekOf) : null;

  const wow = latest && prev ? (latest.total - prev.total) / prev.total * 100 : null;
  const yoy = latest && lastYearTotal ? (latest.total - lastYearTotal) / lastYearTotal * 100 : null;

  // Per-campus snapshot for latest week
  const latestRows = latest ? ALL.filter((r) => r.weekOf === latest.weekOf) : [];
  const prevRows = prev ? ALL.filter((r) => r.weekOf === prev.weekOf) : [];
  const campusCards = window.CAMPUSES.map((c) => {
    const cur = latestRows.filter((r) => r.campus === c).reduce((s, r) => s + (r.total || 0), 0);
    const prv = prevRows.filter((r) => r.campus === c).reduce((s, r) => s + (r.total || 0), 0);
    const delta = prv ? (cur - prv) / prv * 100 : null;
    return { campus: c, cur, prv, delta };
  }).filter((c) => c.cur > 0 || c.prv > 0);

  return (
    <div style={{
      width: '100%', height: '100%', background: T.paper, color: T.ink,
      fontFamily: T.sans, overflow: 'hidden', display: 'flex', flexDirection: 'column'
    }}>
      {/* Masthead */}
      <Masthead T={T} dens={dens} latest={latest} />

      {/* Tabs */}
      <Tabs T={T} tab={tab} onChange={setTab} />

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'overview' &&
        <OverviewTab T={T} dens={dens} latest={latest} prev={prev} lastYearTotal={lastYearTotal}
        wow={wow} yoy={yoy} k={k} latestRows={latestRows} campusCards={campusCards}
        onOpenRecord={setDrawer} />
        }
        {tab === 'trends' && <TrendsTab T={T} dens={dens} k={k} />}
        {tab === 'campuses' && <CampusesTab T={T} dens={dens} />}
        {tab === 'records' && <RecordsTab T={T} dens={dens} onOpenRecord={setDrawer} />}
      </div>

      {drawer && <Drawer record={drawer} onClose={() => setDrawer(null)} theme={T} />}
    </div>);

}

function Masthead({ T, dens, latest }) {
  return (
    <div style={{ padding: `${dens ? 14 : 18}px ${dens ? 20 : 28}px`, borderBottom: `1px solid ${T.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: T.wine, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbf6ec" strokeWidth="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V12h6v9" /></svg>
        </div>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '.18em', color: T.ink3, textTransform: 'uppercase' }}>Faith Church · Leadership Brief</div>
          <h1 style={{ fontFamily: T.display, fontSize: dens ? 22 : 24, fontWeight: 500, margin: '2px 0 0', letterSpacing: '-0.01em' }}>
            Weekly Attendance Check-in
          </h1>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {latest &&
        <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '.16em', color: T.ink3, textTransform: 'uppercase' }}>Most recent week</div>
            <div style={{ fontFamily: T.display, fontSize: 15, fontStyle: 'italic', color: T.ink2, marginTop: 2 }}>Week of {latest.weekOf}</div>
          </div>
        }
        <button style={{ padding: '7px 13px', border: `1px solid ${T.rule}`, background: 'transparent', borderRadius: 4, fontFamily: T.sans, fontSize: 11.5, color: T.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Export
        </button>
      </div>
    </div>);

}

function Tabs({ T, tab, onChange }) {
  const items = [
  { id: 'overview', label: 'Overview', hint: 'this week at a glance' },
  { id: 'trends', label: 'Trends', hint: '52-week patterns' },
  { id: 'campuses', label: 'Campuses', hint: 'side-by-side' },
  { id: 'records', label: 'Records', hint: 'every service' }];

  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${T.rule}`, padding: '0 24px', gap: 0, background: T.paper }}>
      {items.map((it) => {
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => onChange(it.id)} style={{
            padding: '13px 20px 11px', border: 'none', background: 'transparent',
            borderBottom: active ? `2px solid ${T.wine}` : '2px solid transparent',
            marginBottom: -1,
            fontFamily: T.sans, fontSize: 13, fontWeight: active ? 600 : 500,
            color: active ? T.ink : T.ink3, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            {it.label}
            {!active && <span style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 11, color: T.ink3, fontWeight: 400 }}>{it.hint}</span>}
          </button>);

      })}
    </div>);

}

// ============= OVERVIEW (the 5-second answer) =============

function OverviewTab({ T, dens, latest, prev, lastYearTotal, wow, yoy, k, latestRows, campusCards, onOpenRecord }) {
  if (!latest) return <div style={{ padding: 40, color: T.ink3 }}>No completed weeks of data.</div>;

  // Hero: This week's total + two delta cards
  return (
    <div style={{ padding: `${dens ? 20 : 28}px ${dens ? 20 : 28}px` }}>
      {/* HERO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: dens ? 16 : 20, marginBottom: dens ? 20 : 28 }}>
        {/* This week */}
        <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 6, padding: dens ? 22 : 30 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3, marginBottom: 8 }}>This week</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: T.display, fontSize: dens ? 56 : 72, fontWeight: 500, lineHeight: .9, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{window.fmtFull(latest.total)}</div>
            <div style={{ fontFamily: T.display, fontSize: 15, fontStyle: 'italic', color: T.ink2 }}>across the network</div>
          </div>
          <div style={{ display: 'flex', gap: 18, fontFamily: T.sans, fontSize: 12.5, color: T.ink2, paddingTop: 10, borderTop: `1px solid ${T.ruleLight}` }}>
            <Bullet T={T} label="Main Service" value={latest.main} color={T.wine} />
            <Bullet T={T} label="FaithKids" value={latest.fk} color={T.clay} />
            <Bullet T={T} label="Mainstream" value={latest.ms} color={T.sage} />
          </div>
        </div>

        {/* vs last week */}
        <DeltaCard T={T} dens={dens} title="vs last week" delta={wow}
        curN={latest.total} prevN={prev?.total} prevLabel={prev ? `Week of ${prev.weekOf}` : '—'} />
        {/* vs same week last year */}
        <DeltaCard T={T} dens={dens} title="vs same week last year" delta={yoy}
        curN={latest.total} prevN={lastYearTotal} prevLabel={lastYearTotal ? `Same week, ${new Date(latest.weekOf).getFullYear() - 1}` : 'No data for that week last year'} />
      </div>

      {/* Sub-row: per-campus snapshot + spark */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: dens ? 16 : 20, marginBottom: dens ? 20 : 28 }}>
        <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 6, padding: dens ? 16 : 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3 }}>By campus · this week</div>
              <h3 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, margin: '2px 0 0' }}>How each location did</h3>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: dens ? 6 : 8 }}>
            {campusCards.sort((a, b) => b.cur - a.cur).map((c) =>
            <CampusRow key={c.campus} T={T} c={c} dens={dens} />
            )}
          </div>
        </div>

        {/* 4-week trailing & average */}
        <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 6, padding: dens ? 16 : 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3 }}>Trailing weeks</div>
              <h3 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, margin: '2px 0 0' }}>Last 8 completed weeks</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{window.fmtFull(trailingAvg(k.completedWeeks, 4))}</div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '.16em', color: T.ink3, textTransform: 'uppercase' }}>Trailing 4-wk avg</div>
            </div>
          </div>
          <window.LineChart
            width={dens ? 580 : 600} height={dens ? 140 : 170}
            series={[{
              name: 'Total', color: T.wine,
              values: k.completedWeeks.slice(-8).map((w) => w.total)
            }]}
            xLabels={k.completedWeeks.slice(-8).map((w) => w.weekOf.slice(5))}
            fill={true}
            colors={[T.wine]}
            padding={{ t: 10, r: 14, b: 24, l: 42 }}
            gridColor={T.ruleLight}
            textColor={T.ink3}
            showDots={true} />
          
          <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingTop: 12, borderTop: `1px solid ${T.ruleLight}`, fontFamily: T.sans, fontSize: 12, color: T.ink2 }}>
            <SmallStat T={T} label="8-wk avg" value={trailingAvg(k.completedWeeks, 8)} />
            <SmallStat T={T} label="YTD avg" value={k.avgWeek} />
            <SmallStat T={T} label="YTD total" value={k.ytdTotal} />
          </div>
        </div>
      </div>

      {/* Services this week */}
      <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 6, padding: dens ? 16 : 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3 }}>Service-by-service · this week</div>
            <h3 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, margin: '2px 0 0' }}>{latestRows.length} services on record</h3>
          </div>
          <div style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 13, color: T.ink2 }}>Click any row for detail</div>
        </div>
        <ServiceTable T={T} dens={dens} rows={latestRows} onOpenRecord={onOpenRecord} />
      </div>
    </div>);

}

function Bullet({ T, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span style={{ color: T.ink3, fontFamily: T.mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: T.display, fontSize: 18, fontWeight: 500, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{value == null ? '—' : window.fmtFull(value)}</span>
    </div>);

}

function DeltaCard({ T, dens, title, delta, curN, prevN, prevLabel }) {
  const has = delta != null && !isNaN(delta);
  const good = has && delta >= 0;
  const tone = !has ? T.ink3 : good ? T.good : T.bad;
  const arrow = !has ? '·' : good ? '↑' : '↓';
  const diff = has ? curN - prevN : null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 6, padding: dens ? 22 : 30, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: has ? tone : 'transparent' }} />
      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <div style={{ fontFamily: T.display, fontSize: dens ? 44 : 54, fontWeight: 500, color: tone, lineHeight: .9, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {arrow} {has ? Math.abs(delta).toFixed(1) + '%' : '—'}
        </div>
      </div>
      <div style={{ fontFamily: T.display, fontSize: 15, fontStyle: 'italic', color: T.ink2, marginBottom: 6 }}>
        {has ? `${good ? '+' : '-'}${window.fmtFull(Math.abs(diff))} ${good ? 'more' : 'fewer'} attended` : 'Not enough data'}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: '.06em', color: T.ink3 }}>{prevLabel}{prevN ? ` · ${window.fmtFull(prevN)}` : ''}</div>
    </div>);

}

function CampusRow({ T, c, dens }) {
  const has = c.delta != null && !isNaN(c.delta);
  const good = has && c.delta >= 0;
  const tone = !has ? T.ink3 : good ? T.good : T.bad;
  const fullName = window.CAMPUS_LABEL && window.CAMPUS_LABEL[c.campus] || c.campus;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px', gap: 8, alignItems: 'center', padding: `${dens ? 6 : 8}px 10px`, borderRadius: 4, background: T.cardAlt }}>
      <div>
        <div style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600 }}>{fullName}</div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink3, letterSpacing: '.06em', marginTop: 1 }}>{c.campus}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{window.fmtFull(c.cur)}</div>
        <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.ink3, letterSpacing: '.06em' }}>this wk</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {has ?
        <>
            <div style={{ fontFamily: T.display, fontSize: 14, color: tone, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{good ? '↑' : '↓'} {Math.abs(c.delta).toFixed(0)}%</div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.ink3, letterSpacing: '.06em' }}>vs last wk</div>
          </> :

        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.ink3 }}>—</div>
        }
      </div>
    </div>);

}

function SmallStat({ T, label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase', color: T.ink3 }}>{label}</div>
      <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{window.fmtFull(value)}</div>
    </div>);

}

function trailingAvg(weeks, n) {
  const arr = weeks.slice(-n);
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, w) => s + w.total, 0) / arr.length);
}

function ServiceTable({ T, dens, rows, onOpenRecord }) {
  const sorted = rows.slice().sort((a, b) => {
    if (a.campus !== b.campus) return a.campus < b.campus ? -1 : 1;
    return a.date < b.date ? -1 : 1;
  });
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.sans, fontSize: dens ? 12 : 13 }}>
      <thead>
        <tr style={{ borderBottom: `1.5px solid ${T.ink}`, color: T.ink3 }}>
          {[['Date', 'left'], ['Campus', 'left'], ['Service', 'left'], ['Main', 'right'], ['FaithKids', 'right'], ['Mainstream', 'right'], ['Total', 'right']].map(([h, a]) =>
          <th key={h} style={{ textAlign: a, padding: `${dens ? 6 : 8}px 12px`, fontFamily: T.mono, fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
          )}
        </tr>
      </thead>
      <tbody>
        {sorted.map((r, i) =>
        <tr key={i} onClick={() => onOpenRecord(r)} style={{ borderBottom: `1px solid ${T.ruleLight}`, cursor: 'pointer' }}>
            <td style={{ padding: `${dens ? 6 : 9}px 12px`, fontFamily: T.mono, fontSize: 11.5, color: T.ink2 }}>{r.date}</td>
            <td style={{ padding: `${dens ? 6 : 9}px 12px`, fontWeight: 600 }}>{r.campus}</td>
            <td style={{ padding: `${dens ? 6 : 9}px 12px`, fontStyle: 'italic', fontFamily: T.display, fontSize: 14, color: T.ink2 }}>{r.cat}</td>
            <td style={{ padding: `${dens ? 6 : 9}px 12px`, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.main ? T.ink : T.ink3 }}>{r.main ?? '—'}</td>
            <td style={{ padding: `${dens ? 6 : 9}px 12px`, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.fk ? T.ink : T.ink3 }}>{r.fk ?? '—'}</td>
            <td style={{ padding: `${dens ? 6 : 9}px 12px`, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.ms ? T.ink : T.ink3 }}>{r.ms ?? '—'}</td>
            <td style={{ padding: `${dens ? 6 : 9}px 12px`, textAlign: 'right', fontFamily: T.display, fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{window.fmtFull(r.total)}</td>
          </tr>
        )}
      </tbody>
    </table>);

}

// ============= TRENDS =============

function TrendsTab({ T, dens, k }) {
  const [range, setRange] = React.useState(52); // weeks
  const [overlayLY, setOverlayLY] = React.useState(true);
  const ALL = window.ATTENDANCE;

  const recent = k.completedWeeks.slice(-range);
  const labels = recent.map((w) => w.weekOf.slice(5));
  const series = [
  { name: 'Weekly total', color: T.wine, stroke: 2.5, values: recent.map((w) => w.total) }];

  if (overlayLY) {
    const map = new Map();
    k.completedWeeks.forEach((w) => {
      map.set(window.agg.isoWeek(w.weekOf) + '-' + new Date(w.weekOf).getFullYear(), w.total);
    });
    const lyValues = recent.map((w) => {
      const dt = new Date(w.weekOf);
      const key = window.agg.isoWeek(w.weekOf) + '-' + (dt.getFullYear() - 1);
      return map.get(key) ?? null;
    });
    series.push({ name: 'Same week, prior year', color: T.ink3, dash: '4 4', stroke: 1.5, values: lyValues });
  }

  // Trailing 4-wk MA
  const ma = recent.map((_, i) => {
    const sl = recent.slice(Math.max(0, i - 3), i + 1);
    return Math.round(sl.reduce((s, w) => s + w.total, 0) / sl.length);
  });
  series.push({ name: '4-week trailing avg', color: T.gold, stroke: 1.5, values: ma });

  // Generation breakdown
  const genSeries = [
  { name: 'Main Service', color: T.wine, values: recent.map((w) => w.main) },
  { name: 'FaithKids', color: T.clay, values: recent.map((w) => w.fk) },
  { name: 'Mainstream', color: T.sage, values: recent.map((w) => w.ms) }];


  return (
    <div style={{ padding: dens ? 20 : 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3 }}>Trends</div>
          <h2 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 500, margin: '2px 0 0', letterSpacing: '-0.01em' }}>How are we trending?</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, color: T.ink3, fontFamily: T.sans }}>Range:</span>
          {[[12, '12 wk'], [26, '26 wk'], [52, '52 wk'], [999, 'All']].map(([n, l]) =>
          <button key={l} onClick={() => setRange(n)} style={{
            padding: '5px 12px', borderRadius: 4, border: `1px solid ${range === n ? T.wine : T.rule}`,
            background: range === n ? T.wine : 'transparent', color: range === n ? '#fbf6ec' : T.ink2,
            fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, cursor: 'pointer'
          }}>{l}</button>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 14, fontSize: 12, color: T.ink2, cursor: 'pointer' }}>
            <input type="checkbox" checked={overlayLY} onChange={() => setOverlayLY((v) => !v)} style={{ accentColor: T.wine }} />
            Overlay last year
          </label>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 6, padding: dens ? 16 : 20, marginBottom: dens ? 16 : 20, width: "100px" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h3 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, margin: 0 }}>Network total · weekly</h3>
          <div style={{ display: 'flex', gap: 14, fontFamily: T.sans, fontSize: 11.5 }}>
            {series.map((s) =>
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.ink2 }}>
                <span style={{ display: 'inline-block', width: 18, height: 0, borderTop: `2px ${s.dash ? 'dashed' : 'solid'} ${s.color}` }} />
                {s.name}
              </div>
            )}
          </div>
        </div>
        <window.LineChart
          width={1340} height={dens ? 240 : 280}
          series={series}
          xLabels={labels}
          fill={false}
          padding={{ t: 14, r: 24, b: 30, l: 50 }}
          gridColor={T.ruleLight}
          textColor={T.ink3}
          showDots={recent.length <= 20} />
        
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 6, padding: dens ? 16 : 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h3 style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, margin: 0 }}>By generation · weekly</h3>
          <div style={{ display: 'flex', gap: 14, fontFamily: T.sans, fontSize: 11.5 }}>
            {genSeries.map((s) =>
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.ink2 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, background: s.color, borderRadius: 2 }} />
                {s.name}
              </div>
            )}
          </div>
        </div>
        <window.LineChart
          width={1340} height={dens ? 200 : 230}
          series={genSeries}
          xLabels={labels}
          fill={false}
          padding={{ t: 14, r: 24, b: 30, l: 50 }}
          gridColor={T.ruleLight}
          textColor={T.ink3} />
        
      </div>
    </div>);

}

// ============= CAMPUSES (side-by-side) =============

function CampusesTab({ T, dens }) {
  const ALL = window.ATTENDANCE;
  const TODAY = new Date();
  const cards = window.CAMPUSES.map((c) => {
    const rows = ALL.filter((r) => r.campus === c);
    if (!rows.length) return null;
    const ck = window.agg.kpis(rows, TODAY);
    return { campus: c, k: ck };
  }).filter(Boolean).filter((x) => x.k.completedWeeks.length > 0).sort((a, b) => b.k.allTimeTotal - a.k.allTimeTotal);

  return (
    <div style={{ padding: dens ? 20 : 28 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3 }}>Campuses</div>
        <h2 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 500, margin: '2px 0 0', letterSpacing: '-0.01em' }}>Side-by-side</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: dens ? 14 : 18 }}>
        {cards.map((card) => <CampusCard key={card.campus} T={T} dens={dens} c={card.campus} k={card.k} />)}
      </div>
    </div>);

}

function CampusCard({ T, dens, c, k }) {
  const fullName = window.CAMPUS_LABEL && window.CAMPUS_LABEL[c] || c;
  const sub = window.CAMPUS_SUB && window.CAMPUS_SUB[c] || '';
  const latest = k.latestWeek;
  const prev = k.prevWeek;
  const wow = latest && prev ? (latest.total - prev.total) / prev.total * 100 : null;
  const lastYearTotal = latest ? window.agg.sameWeekLastYear(window.ATTENDANCE.filter((r) => r.campus === c), latest.weekOf) : null;
  const yoy = latest && lastYearTotal ? (latest.total - lastYearTotal) / lastYearTotal * 100 : null;
  const recent = k.completedWeeks.slice(-26);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 6, padding: dens ? 16 : 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${T.ruleLight}` }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.wine, letterSpacing: '.1em', fontWeight: 600 }}>{c}</div>
          <h3 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 500, margin: '2px 0 0', letterSpacing: '-0.01em' }}>{fullName}</h3>
          {sub && <div style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 12, color: T.ink3, marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.display, fontSize: 30, fontWeight: 500, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{window.fmtFull(latest?.total || 0)}</div>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.ink3, letterSpacing: '.16em', textTransform: 'uppercase', marginTop: 4 }}>This week</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <MiniDelta T={T} label="vs last wk" delta={wow} />
        <MiniDelta T={T} label="vs last yr" delta={yoy} />
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.ink3, letterSpacing: '.16em', textTransform: 'uppercase' }}>Avg / wk</div>
          <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{window.fmtFull(k.avgWeek)}</div>
        </div>
      </div>

      <window.LineChart
        width={dens ? 620 : 660} height={90}
        series={[{ name: 'Total', color: T.wine, values: recent.map((w) => w.total) }]}
        xLabels={recent.map((w) => w.weekOf.slice(5))}
        fill={true}
        colors={[T.wine]}
        padding={{ t: 6, r: 6, b: 18, l: 32 }}
        gridColor={T.ruleLight}
        textColor={T.ink3} />
      
    </div>);

}

function MiniDelta({ T, label, delta }) {
  const has = delta != null && !isNaN(delta);
  const good = has && delta >= 0;
  const tone = !has ? T.ink3 : good ? T.good : T.bad;
  return (
    <div>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.ink3, letterSpacing: '.16em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 600, color: tone, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
        {!has ? '—' : (good ? '↑' : '↓') + ' ' + Math.abs(delta).toFixed(1) + '%'}
      </div>
    </div>);

}

// ============= RECORDS =============

function RecordsTab({ T, dens, onOpenRecord }) {
  const ALL = window.ATTENDANCE;
  const [campuses, setCampuses] = React.useState([]);
  const [cats, setCats] = React.useState([]);
  const [sort, setSort] = React.useState({ key: 'date', dir: 'desc' });
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    let r = ALL;
    if (campuses.length) r = r.filter((x) => campuses.includes(x.campus));
    if (cats.length) r = r.filter((x) => cats.includes(x.cat));
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.date.includes(q) || x.cat.toLowerCase().includes(q) || x.campus.toLowerCase().includes(q));
    }
    return r.slice().sort((a, b) => {
      const av = a[sort.key],bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [campuses, cats, sort, search]);

  const sortIcon = (key) => {
    if (sort.key !== key) return <span style={{ color: T.ink3, fontSize: 9, marginLeft: 4 }}>↕</span>;
    return <span style={{ color: T.wine, fontSize: 10, marginLeft: 4 }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const Pill = ({ active, onClick, children }) =>
  <button onClick={onClick} style={{
    padding: '4px 10px', borderRadius: 999, border: `1px solid ${active ? T.wine : T.rule}`,
    background: active ? T.wine : 'transparent', color: active ? '#fbf6ec' : T.ink2,
    fontFamily: T.sans, fontSize: 11.5, fontWeight: 500, cursor: 'pointer'
  }}>{children}</button>;


  return (
    <div style={{ padding: dens ? 20 : 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3 }}>Records</div>
          <h2 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 500, margin: '2px 0 0', letterSpacing: '-0.01em' }}>Every service</h2>
        </div>
        <div style={{ position: 'relative' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search…"
          style={{ padding: '6px 12px 6px 28px', background: T.card, border: `1px solid ${T.rule}`, borderRadius: 4, color: T.ink, fontFamily: T.sans, fontSize: 12.5, width: 220, outline: 'none' }} />
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.ink3} strokeWidth="2" style={{ position: 'absolute', left: 10, top: 9 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.ink3, letterSpacing: '.1em', textTransform: 'uppercase', marginRight: 4 }}>Campus</span>
        {window.CAMPUSES.map((c) =>
        <Pill key={c} active={campuses.includes(c)} onClick={() => setCampuses((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])}>{c}</Pill>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.ink3, letterSpacing: '.1em', textTransform: 'uppercase', marginRight: 4 }}>Service</span>
        {window.SERVICE_CATS.map((c) =>
        <Pill key={c} active={cats.includes(c)} onClick={() => setCats((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])}>{c}</Pill>
        )}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.ruleLight}`, fontFamily: T.mono, fontSize: 11, color: T.ink3 }}>
          {filtered.length.toLocaleString()} services · showing first {Math.min(40, filtered.length)}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.sans, fontSize: dens ? 12 : 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.rule}`, color: T.ink3, background: T.cardAlt }}>
              {[
              ['date', 'Date', 'left'],
              ['campus', 'Campus', 'left'],
              ['cat', 'Service', 'left'],
              ['main', 'Main', 'right'],
              ['fk', 'FaithKids', 'right'],
              ['ms', 'Mainstream', 'right'],
              ['total', 'Total', 'right']].
              map(([key, label, a]) =>
              <th key={key} onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))} style={{
                textAlign: a, padding: `${dens ? 8 : 10}px 12px`, fontFamily: T.mono, fontSize: 9.5, letterSpacing: '.18em',
                textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', userSelect: 'none'
              }}>{label}{sortIcon(key)}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 40).map((r, i) =>
            <tr key={i} onClick={() => onOpenRecord(r)} style={{ borderBottom: `1px solid ${T.ruleLight}`, cursor: 'pointer' }}>
                <td style={{ padding: `${dens ? 6 : 9}px 12px`, fontFamily: T.mono, fontSize: 11.5, color: T.ink2 }}>{r.date}</td>
                <td style={{ padding: `${dens ? 6 : 9}px 12px`, fontWeight: 600 }}>{r.campus}</td>
                <td style={{ padding: `${dens ? 6 : 9}px 12px`, fontStyle: 'italic', fontFamily: T.display, fontSize: 14, color: T.ink2 }}>{r.cat}</td>
                <td style={{ padding: `${dens ? 6 : 9}px 12px`, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.main ? T.ink : T.ink3 }}>{r.main ?? '—'}</td>
                <td style={{ padding: `${dens ? 6 : 9}px 12px`, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.fk ? T.ink : T.ink3 }}>{r.fk ?? '—'}</td>
                <td style={{ padding: `${dens ? 6 : 9}px 12px`, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.ms ? T.ink : T.ink3 }}>{r.ms ?? '—'}</td>
                <td style={{ padding: `${dens ? 6 : 9}px 12px`, textAlign: 'right', fontFamily: T.display, fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{window.fmtFull(r.total)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>);

}

// ============= DRAWER =============

function Drawer({ record, onClose, theme }) {
  const T = theme;
  const sibs = window.ATTENDANCE.filter((r) => r.date === record.date).sort((a, b) => a.campus < b.campus ? -1 : 1);
  const total = sibs.reduce((s, r) => s + (r.total || 0), 0);
  const series = window.ATTENDANCE.
  filter((r) => r.campus === record.campus && r.cat === record.cat).
  sort((a, b) => a.date < b.date ? -1 : 1);
  const fullName = window.CAMPUS_LABEL && window.CAMPUS_LABEL[record.campus] || record.campus;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(35,24,17,.4)', zIndex: 10, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 480, height: '100%', background: T.paper, padding: 32, overflow: 'auto', borderLeft: `1px solid ${T.rule}`,
        boxShadow: '-12px 0 40px rgba(0,0,0,.18)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '.18em', color: T.ink3, textTransform: 'uppercase' }}>Service detail</div>
            <h3 style={{ fontFamily: T.display, fontSize: 30, margin: '8px 0 0', fontWeight: 500, letterSpacing: '-0.01em' }}>{record.cat}</h3>
            <div style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 16, color: T.ink2, marginTop: 4 }}>{fullName} · {record.date}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.rule}`, width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: T.ink2, fontSize: 14 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 24 }}>
          {[
          { l: 'Total', v: record.total, big: true },
          { l: 'Main Service', v: record.main },
          { l: 'FaithKids', v: record.fk },
          { l: 'Mainstream', v: record.ms }].
          map((it, i) =>
          <div key={i} style={{ padding: 14, border: `1px solid ${T.rule}`, background: T.card, borderRadius: 4 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3 }}>{it.l}</div>
              <div style={{ fontFamily: T.display, fontSize: it.big ? 32 : 22, fontWeight: 500, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{it.v == null ? '—' : window.fmtFull(it.v)}</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3, marginBottom: 10 }}>Trend · {record.cat} at {record.campus}</div>
          <window.LineChart
            width={416} height={130}
            series={[{ name: record.cat, values: series.map((s) => s.total), color: T.wine }]}
            xLabels={series.map((s) => s.date.slice(5))}
            fill={true} colors={[T.wine]}
            padding={{ t: 10, r: 8, b: 24, l: 36 }}
            gridColor={T.ruleLight} textColor={T.ink3} />
          
        </div>

        <div>
          <div style={{ fontFamily: T.mono, fontSize: 9.5, letterSpacing: '.2em', textTransform: 'uppercase', color: T.ink3, marginBottom: 10 }}>Same date · all services</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.sans, fontSize: 12 }}>
            <tbody>
            {sibs.map((s, i) =>
              <tr key={i} style={{ borderBottom: `1px solid ${T.ruleLight}` }}>
                <td style={{ padding: '8px 0', color: s === record ? T.wine : T.ink2 }}>{s.campus}</td>
                <td style={{ padding: '8px 0', fontStyle: 'italic', fontFamily: T.display, color: s === record ? T.wine : T.ink2 }}>{s.cat}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: s === record ? 600 : 400, color: s === record ? T.wine : T.ink }}>{window.fmtFull(s.total)}</td>
              </tr>
              )}
            <tr style={{ borderTop: `2px solid ${T.ink}`, fontWeight: 600 }}>
              <td colSpan="2" style={{ padding: '10px 0' }}>All campuses</td>
              <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: T.display, fontSize: 18, fontWeight: 600 }}>{window.fmtFull(total)}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}

window.MainView = MainView;