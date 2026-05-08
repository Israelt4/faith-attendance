// direction-b.jsx — Operations Console
// Split-pane SaaS dashboard. Persistent facet rail + live charts grid + table.

const B_THEME = {
  bg: '#f3efe8',
  panel: '#ffffff',
  panelAlt: '#faf6ee',
  border: 'rgba(60,40,25,0.14)',
  borderStrong: 'rgba(60,40,25,0.22)',
  ink: '#1d1612',
  ink2: 'rgba(29,22,18,0.72)',
  ink3: 'rgba(29,22,18,0.50)',
  primary: '#7d3a35', // wine
  primaryLight: '#a4574e',
  accent: '#6e8a6c',  // sage
  warn: '#b87a4f',    // clay
  cool: '#4f6b8a',
  sans: '"Hanken Grotesk", -apple-system, system-ui, sans-serif',
  display: '"Spectral", "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", monospace',
};

function DirectionB({ density='comfortable', layout='hybrid' }) {
  const T = B_THEME;
  const ALL = window.ATTENDANCE;
  const [campuses, setCampuses] = React.useState([]);
  const [cats, setCats] = React.useState([]);
  const [years, setYears] = React.useState([2025, 2026]);
  const [granularity, setGranularity] = React.useState('week'); // week | month
  const [breakdown, setBreakdown] = React.useState('campus'); // campus | gen
  const [drawer, setDrawer] = React.useState(null);
  const [sort, setSort] = React.useState({ key:'date', dir:'desc' });

  const filtered = React.useMemo(() => window.agg.applyFilter(ALL, {
    campuses: campuses.length ? campuses : null,
    cats: cats.length ? cats : null,
    years: years.length ? years : null,
  }), [campuses, cats, years]);

  const k = window.agg.kpis(filtered);
  const allYears = [...new Set(ALL.map(r=>r.year))].sort();

  const dens = density === 'compact';
  const cellPad = dens ? '6px 12px' : '10px 14px';

  // Time series
  const timeData = granularity === 'week' ? window.agg.byWeek(filtered) : window.agg.byMonth(filtered);
  const timeLabels = granularity === 'week'
    ? timeData.map(t => t.weekOf.slice(5))
    : timeData.map(t => `${String(t.month).padStart(2,'0')}/${String(t.year).slice(2)}`);

  // Series for trend by breakdown
  let trendSeries;
  if (breakdown === 'gen') {
    trendSeries = [
      { name:'Mainstream', values: timeData.map(t => t.main), color: T.primary },
      { name:'FaithKids',  values: timeData.map(t => t.fk),   color: T.warn },
      { name:'MidStream',  values: timeData.map(t => t.ms),   color: T.accent },
    ];
  } else {
    const activeCampuses = (campuses.length ? campuses : window.CAMPUSES).slice(0, 6);
    trendSeries = activeCampuses.map((c, i) => {
      const cRows = filtered.filter(r => r.campus === c);
      const cByTime = granularity === 'week' ? window.agg.byWeek(cRows) : window.agg.byMonth(cRows);
      const map = new Map(cByTime.map(t => [granularity==='week' ? t.weekOf : t.key, t.total]));
      const palette = [T.primary, T.warn, T.accent, T.cool, '#a68534', '#9c5a8a'];
      return {
        name: c,
        color: palette[i % palette.length],
        values: timeData.map(t => map.get(granularity==='week'?t.weekOf:t.key) ?? null),
      };
    });
  }

  // Heatmap
  const hm = window.agg.heatmap(filtered);
  const hmMax = Math.max(...hm.data.flat().filter(v=>v!=null), 1);

  // Campus breakdown
  const campusAgg = window.agg.byCampus(filtered).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  // Sortable table data
  const sortedRows = React.useMemo(() => {
    const rows = [...filtered];
    rows.sort((a,b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1; if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [filtered, sort]);

  const Chip = ({ active, onClick, children, color }) => (
    <button onClick={onClick} style={{
      padding: dens?'4px 10px':'5px 11px', borderRadius:6,
      border:`1px solid ${active?(color||T.primary):T.border}`,
      background: active ? (color||T.primary) : T.panel,
      color: active ? '#fff' : T.ink2,
      fontFamily:T.sans, fontSize:12, fontWeight:500, cursor:'pointer',
      display:'flex', alignItems:'center', gap:6, transition:'all .12s'
    }}>{children}</button>
  );

  const FacetGroup = ({ title, count, children }) => (
    <div style={{padding:`${dens?12:16}px 16px`, borderBottom:`1px solid ${T.border}`}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
        <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.18em', textTransform:'uppercase', color:T.ink3, fontWeight:600}}>{title}</div>
        {count > 0 && <div style={{fontSize:10, color:T.ink3}}>{count} active</div>}
      </div>
      {children}
    </div>
  );

  const sortIcon = (key) => {
    if (sort.key !== key) return <span style={{color:T.ink3, fontSize:9}}>↕</span>;
    return <span style={{color:T.primary, fontSize:10}}>{sort.dir==='asc'?'↑':'↓'}</span>;
  };

  return (
    <div style={{width:'100%', height:'100%', background:T.bg, fontFamily:T.sans, color:T.ink, display:'flex', overflow:'hidden'}}>
      {/* Filter rail */}
      <div style={{width:240, height:'100%', background:T.panel, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', overflow:'auto'}}>
        <div style={{padding:`16px 16px 14px`, borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:10}}>
          <div style={{width:28, height:28, borderRadius:6, background:T.primary, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/></svg>
          </div>
          <div>
            <div style={{fontFamily:T.display, fontWeight:500, fontSize:15, letterSpacing:'-0.01em'}}>Faith Console</div>
            <div style={{fontSize:10, color:T.ink3, fontFamily:T.mono, letterSpacing:'.05em'}}>ATTENDANCE / v3</div>
          </div>
        </div>

        <FacetGroup title="Year" count={years.length}>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {allYears.filter(y=>y>=2024).map(y => (
              <Chip key={y} active={years.includes(y)} onClick={()=>{
                setYears(prev => prev.includes(y) ? prev.filter(x=>x!==y) : [...prev, y]);
              }}>{y}</Chip>
            ))}
          </div>
        </FacetGroup>

        <FacetGroup title="Campus" count={campuses.length}>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {window.CAMPUSES.map(c => (
              <Chip key={c} active={campuses.includes(c)} onClick={()=>{
                setCampuses(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c]);
              }}>{c}</Chip>
            ))}
          </div>
          {campuses.length > 0 && (
            <button onClick={()=>setCampuses([])} style={{marginTop:8, fontSize:11, color:T.ink3, background:'transparent', border:'none', cursor:'pointer', padding:0, fontFamily:T.sans}}>Clear all</button>
          )}
        </FacetGroup>

        <FacetGroup title="Service Format" count={cats.length}>
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            {window.SERVICE_CATS.map(c => (
              <label key={c} style={{display:'flex', alignItems:'center', gap:8, fontSize:12.5, color:T.ink2, cursor:'pointer'}}>
                <input type="checkbox" checked={cats.includes(c)} onChange={()=>{
                  setCats(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c]);
                }} style={{accentColor:T.primary}}/>
                {c}
              </label>
            ))}
          </div>
        </FacetGroup>

        <FacetGroup title="View Options" count={0}>
          <div style={{fontSize:11, color:T.ink3, marginBottom:6}}>Granularity</div>
          <div style={{display:'flex', gap:4, marginBottom:14}}>
            {['week','month'].map(g => (
              <button key={g} onClick={()=>setGranularity(g)} style={{
                flex:1, padding:'5px 8px', fontSize:11, textTransform:'capitalize',
                background: granularity===g ? T.ink : 'transparent',
                color: granularity===g ? '#fff' : T.ink2,
                border:`1px solid ${T.border}`, borderRadius:4, cursor:'pointer', fontFamily:T.sans
              }}>{g}</button>
            ))}
          </div>
          <div style={{fontSize:11, color:T.ink3, marginBottom:6}}>Breakdown</div>
          <div style={{display:'flex', gap:4}}>
            {[['campus','By Campus'],['gen','By Generation']].map(([v,l]) => (
              <button key={v} onClick={()=>setBreakdown(v)} style={{
                flex:1, padding:'5px 8px', fontSize:11,
                background: breakdown===v ? T.ink : 'transparent',
                color: breakdown===v ? '#fff' : T.ink2,
                border:`1px solid ${T.border}`, borderRadius:4, cursor:'pointer', fontFamily:T.sans
              }}>{l}</button>
            ))}
          </div>
        </FacetGroup>

        <div style={{marginTop:'auto', padding:16, fontSize:10, color:T.ink3, fontFamily:T.mono, letterSpacing:'.04em'}}>
          {filtered.length.toLocaleString()} services<br/>
          {window.fmtFull(k.allTimeTotal)} total seats
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1, height:'100%', overflow:'auto'}}>
        {/* Top bar */}
        <div style={{height: dens?52:60, padding:'0 24px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:T.panel, position:'sticky', top:0, zIndex:5}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <h1 style={{fontFamily:T.display, fontSize: dens?20:22, fontWeight:500, margin:0, letterSpacing:'-0.01em'}}>Attendance overview</h1>
            <div style={{padding:'3px 8px', background:T.bg, border:`1px solid ${T.border}`, borderRadius:4, fontSize:11, color:T.ink2, fontFamily:T.mono}}>
              {filtered.length.toLocaleString()} services
            </div>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button style={{display:'flex', alignItems:'center', gap:6, padding:'6px 12px', fontSize:12, background:'transparent', border:`1px solid ${T.border}`, borderRadius:6, color:T.ink2, cursor:'pointer', fontFamily:T.sans}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              CSV
            </button>
            <button style={{display:'flex', alignItems:'center', gap:6, padding:'6px 12px', fontSize:12, background:T.primary, border:`1px solid ${T.primary}`, borderRadius:6, color:'#fff', cursor:'pointer', fontFamily:T.sans, fontWeight:500}}>
              Save view
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:1, background:T.border, borderBottom:`1px solid ${T.border}`}}>
          {[
            { l:'Total in window', v: window.fmtFull(filtered.reduce((s,r)=>s+(r.total||0),0)), spark: timeData.slice(-12).map(t=>t.total) },
            { l:'Avg / week', v: window.fmtFull(k.avgWeek), spark: timeData.slice(-12).map(t=>t.total) },
            { l:'FaithKids total', v: window.fmtFull(k.faithKidsTotal), spark: timeData.slice(-12).map(t=>t.fk), c: T.warn },
            { l:'Last service', v: k.latestWeek?window.fmtFull(k.latestWeek.total):'—', sub: k.latestWeek?.weekOf, spark: timeData.slice(-12).map(t=>t.total) },
          ].map((it, i) => (
            <div key={i} style={{background:T.panel, padding:`${dens?14:18}px 20px`, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:11, color:T.ink3, fontWeight:500, marginBottom:6, fontFamily:T.mono, letterSpacing:'.06em', textTransform:'uppercase'}}>{it.l}</div>
                <div style={{fontFamily:T.display, fontSize: dens?26:30, fontWeight:500, fontVariantNumeric:'tabular-nums', letterSpacing:'-0.01em'}}>{it.v}</div>
                {it.sub && <div style={{fontSize:11, color:T.ink3, marginTop:4, fontFamily:T.mono}}>{it.sub}</div>}
              </div>
              <window.Sparkline width={64} height={32} values={it.spark} color={it.c||T.primary}/>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{padding:20, display:'grid', gridTemplateColumns:'2fr 1fr', gap:16}}>
          <div style={{background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, padding:`${dens?14:18}px ${dens?16:20}px`}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
              <div>
                <div style={{fontSize:11, color:T.ink3, fontFamily:T.mono, letterSpacing:'.12em', textTransform:'uppercase', fontWeight:600}}>Trend</div>
                <h3 style={{fontFamily:T.display, fontSize:18, fontWeight:500, margin:'2px 0 0', letterSpacing:'-0.01em'}}>
                  {breakdown==='gen' ? 'By generation' : 'By campus'} · {granularity === 'week' ? 'weekly' : 'monthly'}
                </h3>
              </div>
              <div style={{display:'flex', gap:14, fontSize:11, flexWrap:'wrap', maxWidth:380, justifyContent:'flex-end'}}>
                {trendSeries.slice(0,6).map(s => (
                  <div key={s.name} style={{display:'flex', alignItems:'center', gap:5, color:T.ink2}}>
                    <span style={{width:8, height:8, background:s.color, borderRadius:2, display:'inline-block'}}/>
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
            <window.LineChart
              width={840} height={dens?220:260}
              series={trendSeries}
              xLabels={timeLabels}
              fill={trendSeries.length===1}
              padding={{t:8,r:16,b:24,l:42}}
              gridColor="rgba(0,0,0,.05)"
              textColor={T.ink3}
              showDots={timeData.length<24}
            />
          </div>
          <div style={{background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, padding:`${dens?14:18}px ${dens?16:20}px`}}>
            <div style={{fontSize:11, color:T.ink3, fontFamily:T.mono, letterSpacing:'.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4}}>Composition</div>
            <h3 style={{fontFamily:T.display, fontSize:18, fontWeight:500, margin:'0 0 14px', letterSpacing:'-0.01em'}}>Campus share</h3>
            <window.HorizBar
              width={400} height={dens?220:260}
              data={campusAgg.map((c,i) => ({
                label: c.campus, value: c.total,
                color: [T.primary, T.primaryLight, T.warn, T.accent, T.cool, '#a68534'][i % 6]
              }))}
              barTrack={T.bg}
              textColor={T.ink}
              subColor={T.ink3}
              fontFamily={T.sans}
            />
          </div>
        </div>

        {/* Heatmap */}
        <div style={{padding:'0 20px 20px'}}>
          <div style={{background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, padding:`${dens?14:18}px ${dens?16:20}px`}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
              <div>
                <div style={{fontSize:11, color:T.ink3, fontFamily:T.mono, letterSpacing:'.12em', textTransform:'uppercase', fontWeight:600}}>Heatmap</div>
                <h3 style={{fontFamily:T.display, fontSize:18, fontWeight:500, margin:'2px 0 0', letterSpacing:'-0.01em'}}>Attendance density · campus × month</h3>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8, fontSize:11, color:T.ink3}}>
                <span>Lower</span>
                <div style={{display:'flex', gap:1}}>
                  {[0.15, 0.3, 0.5, 0.7, 0.9].map(o => (
                    <div key={o} style={{width:14, height:12, background:T.primary + Math.round(o*255).toString(16).padStart(2,'0')}}/>
                  ))}
                </div>
                <span>Higher</span>
              </div>
            </div>
            <window.Heatmap
              width={1240} height={dens?160:200}
              rows={hm.campuses}
              cols={hm.months}
              values={hm.data}
              color={T.primary}
              maxV={hmMax}
              padding={{t:8,r:8,b:24,l:54}}
              textColor={T.ink3}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{padding:'0 20px 20px'}}>
          <div style={{background:T.panel, border:`1px solid ${T.border}`, borderRadius:8, overflow:'hidden'}}>
            <div style={{padding:`${dens?12:16}px 20px`, display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${T.border}`}}>
              <div>
                <div style={{fontSize:11, color:T.ink3, fontFamily:T.mono, letterSpacing:'.12em', textTransform:'uppercase', fontWeight:600}}>Records</div>
                <h3 style={{fontFamily:T.display, fontSize:17, fontWeight:500, margin:'2px 0 0'}}>All services in current view</h3>
              </div>
              <div style={{fontSize:11, color:T.ink3, fontFamily:T.mono}}>showing 1–{Math.min(20, sortedRows.length)} of {sortedRows.length.toLocaleString()}</div>
            </div>
            <table style={{width:'100%', borderCollapse:'collapse', fontFamily:T.sans, fontSize:dens?12:13}}>
              <thead>
                <tr style={{background:T.panelAlt, color:T.ink2}}>
                  {[
                    ['date','Date','left'],
                    ['campus','Campus','left'],
                    ['cat','Service','left'],
                    ['fk','FaithKids','right'],
                    ['main','Mainstream','right'],
                    ['ms','MidStream','right'],
                    ['total','Total','right'],
                  ].map(([key, label, align]) => (
                    <th key={key} onClick={()=>setSort(s => ({key, dir: s.key===key && s.dir==='desc'?'asc':'desc'}))} style={{
                      textAlign:align, padding:cellPad, fontWeight:600, fontFamily:T.mono, fontSize:10, letterSpacing:'.1em',
                      textTransform:'uppercase', color:T.ink3, cursor:'pointer', userSelect:'none', borderBottom:`1px solid ${T.border}`,
                    }}>
                      <span style={{display:'inline-flex', alignItems:'center', gap:5}}>{label}{sortIcon(key)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.slice(0, dens?28:20).map((r, i) => (
                  <tr key={i} onClick={()=>setDrawer(r)} style={{borderBottom:`1px solid ${T.border}`, cursor:'pointer', background:i%2?T.panelAlt:'transparent'}}>
                    <td style={{padding:cellPad, fontFamily:T.mono, fontSize:11.5, color:T.ink2}}>{r.date}</td>
                    <td style={{padding:cellPad}}>
                      <span style={{display:'inline-block', padding:'2px 7px', background:T.bg, borderRadius:3, fontSize:11, fontWeight:600, color:T.primary}}>{r.campus}</span>
                    </td>
                    <td style={{padding:cellPad, color:T.ink2}}>{r.cat}</td>
                    <td style={{padding:cellPad, textAlign:'right', fontVariantNumeric:'tabular-nums', color: r.fk?T.ink:T.ink3}}>{r.fk ?? '—'}</td>
                    <td style={{padding:cellPad, textAlign:'right', fontVariantNumeric:'tabular-nums', color: r.main?T.ink:T.ink3}}>{r.main ?? '—'}</td>
                    <td style={{padding:cellPad, textAlign:'right', fontVariantNumeric:'tabular-nums', color: r.ms?T.ink:T.ink3}}>{r.ms ?? '—'}</td>
                    <td style={{padding:cellPad, textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight:600, color:T.ink}}>{window.fmtFull(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawer && <BDrawer record={drawer} onClose={()=>setDrawer(null)} theme={T}/>}
    </div>
  );
}

function BDrawer({ record, onClose, theme }) {
  const T = theme;
  const sibs = window.ATTENDANCE.filter(r => r.date === record.date);
  const series = window.ATTENDANCE
    .filter(r => r.campus === record.campus && r.cat === record.cat)
    .sort((a,b) => a.date<b.date?-1:1);
  const campusSeries = window.agg.byWeek(window.ATTENDANCE.filter(r=>r.campus===record.campus));
  return (
    <div style={{position:'absolute', inset:0, background:'rgba(29,22,18,.45)', zIndex:20, display:'flex', justifyContent:'flex-end'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:520, height:'100%', background:T.panel, padding:0, overflow:'auto',
        boxShadow:'-12px 0 40px rgba(0,0,0,.18)', fontFamily:T.sans
      }}>
        <div style={{padding:'20px 24px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
          <div>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
              <span style={{padding:'3px 8px', background:T.primary, color:'#fff', borderRadius:3, fontSize:11, fontWeight:600, fontFamily:T.mono}}>{record.campus}</span>
              <span style={{fontFamily:T.mono, fontSize:11, color:T.ink3}}>{record.date}</span>
            </div>
            <h3 style={{fontFamily:T.display, fontSize:24, fontWeight:500, margin:0, letterSpacing:'-0.01em'}}>{record.cat}</h3>
          </div>
          <button onClick={onClose} style={{background:T.bg, border:`1px solid ${T.border}`, width:30, height:30, borderRadius:6, cursor:'pointer', color:T.ink2}}>✕</button>
        </div>

        <div style={{padding:24}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:24}}>
            {[
              { l:'Total', v: record.total, c: T.ink },
              { l:'FaithKids', v: record.fk, c: T.warn },
              { l:'Mainstream', v: record.main, c: T.primary },
              { l:'MidStream', v: record.ms, c: T.accent },
            ].map((it, i) => (
              <div key={i} style={{padding:12, border:`1px solid ${T.border}`, borderRadius:6, background:T.panelAlt}}>
                <div style={{fontSize:10, color:T.ink3, fontFamily:T.mono, letterSpacing:'.1em', textTransform:'uppercase'}}>{it.l}</div>
                <div style={{fontFamily:T.display, fontSize:24, fontWeight:500, marginTop:4, color:it.c, fontVariantNumeric:'tabular-nums'}}>{it.v == null ? '—' : window.fmtFull(it.v)}</div>
              </div>
            ))}
          </div>

          <div style={{marginBottom:24}}>
            <div style={{fontSize:11, color:T.ink3, fontFamily:T.mono, letterSpacing:'.1em', textTransform:'uppercase', fontWeight:600, marginBottom:10}}>This service over time</div>
            <window.LineChart
              width={460} height={150}
              series={[{ name:record.cat, values: series.map(s=>s.total), color:T.primary }]}
              xLabels={series.map(s => s.date.slice(5))}
              fill={true}
              padding={{t:10,r:8,b:24,l:36}}
              gridColor="rgba(0,0,0,.05)" textColor={T.ink3}
            />
          </div>

          <div style={{marginBottom:24}}>
            <div style={{fontSize:11, color:T.ink3, fontFamily:T.mono, letterSpacing:'.1em', textTransform:'uppercase', fontWeight:600, marginBottom:10}}>{record.campus} all-services trend</div>
            <window.LineChart
              width={460} height={120}
              series={[{ name:record.campus, values: campusSeries.map(s=>s.total), color:T.accent }]}
              xLabels={campusSeries.map(s=>s.weekOf.slice(5))}
              fill={true}
              padding={{t:10,r:8,b:24,l:36}}
              gridColor="rgba(0,0,0,.05)" textColor={T.ink3}
            />
          </div>

          <div>
            <div style={{fontSize:11, color:T.ink3, fontFamily:T.mono, letterSpacing:'.1em', textTransform:'uppercase', fontWeight:600, marginBottom:10}}>Same date · {sibs.length} services</div>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:12.5}}>
              {sibs.map((s,i) => {
                const isMe = s===record;
                return (
                  <tr key={i} style={{borderBottom:`1px solid ${T.border}`, background: isMe?T.panelAlt:'transparent'}}>
                    <td style={{padding:'8px 6px', color: isMe?T.primary:T.ink2, fontWeight: isMe?600:400}}>{s.campus}</td>
                    <td style={{padding:'8px 6px', color:T.ink2}}>{s.cat}</td>
                    <td style={{padding:'8px 6px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight: isMe?600:400, color: isMe?T.primary:T.ink}}>{window.fmtFull(s.total)}</td>
                  </tr>
                );
              })}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DirectionB = DirectionB;
