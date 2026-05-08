// direction-a.jsx — Editorial Brief
// A magazine-style report. Warm paper, serif display, clear hierarchy.

const A_THEME = {
  paper: '#f7f1e6',
  card: '#fbf6ec',
  rule: 'rgba(60,40,25,0.18)',
  ruleLight: 'rgba(60,40,25,0.10)',
  ink: '#231811',
  ink2: 'rgba(35,24,17,0.72)',
  ink3: 'rgba(35,24,17,0.52)',
  wine: '#7d3a35',
  clay: '#b87a4f',
  sage: '#6e8a6c',
  gold: '#a68534',
  display: '"Spectral", "Times New Roman", serif',
  sans: '"Hanken Grotesk", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", monospace',
};

function DirectionA({ density='comfortable', layout='hybrid' }) {
  const T = A_THEME;
  const ALL = window.ATTENDANCE;
  const [year, setYear] = React.useState(2025);
  const [campusFilter, setCampusFilter] = React.useState([]);
  const [drawer, setDrawer] = React.useState(null);

  const filtered = React.useMemo(() => {
    return window.agg.applyFilter(ALL, {
      years: [year],
      campuses: campusFilter.length ? campusFilter : null,
    });
  }, [year, campusFilter]);

  const k = window.agg.kpis(filtered);
  const monthly = window.agg.byMonth(filtered);
  const weekly = window.agg.byWeek(filtered);
  const campusAgg = window.agg.byCampus(filtered);
  const catAgg = window.agg.byCat(filtered);
  const dens = density === 'compact';
  const pad = dens ? 16 : 24;
  const gap = dens ? 16 : 24;

  // Trend line (weekly totals)
  const weeklyLabels = weekly.map(w => {
    const [, m, d] = w.weekOf.split('-');
    return `${m}/${d}`;
  });
  const trendSeries = [
    { name: 'Total weekly attendance', values: weekly.map(w => w.total), color: T.wine, stroke: 2.25 },
  ];

  // Year-over-year overlay
  const allYears = [...new Set(ALL.map(r=>r.year))].sort();
  const weeksByYear = year && allYears.includes(year-1) ? (() => {
    const prevRows = window.agg.applyFilter(ALL, { years:[year-1], campuses: campusFilter.length?campusFilter:null });
    const w = window.agg.byWeek(prevRows);
    // align by week-of-year
    const map = new Map();
    w.forEach(x => {
      const dt = new Date(x.weekOf);
      const onejan = new Date(dt.getFullYear(),0,1);
      const week = Math.ceil((((dt - onejan)/86400000) + onejan.getDay()+1)/7);
      map.set(week, x.total);
    });
    return weekly.map((cur,i) => {
      const dt = new Date(cur.weekOf);
      const onejan = new Date(dt.getFullYear(),0,1);
      const week = Math.ceil((((dt - onejan)/86400000) + onejan.getDay()+1)/7);
      return map.get(week) ?? null;
    });
  })() : null;

  if (weeksByYear) trendSeries.push({ name: `${year-1} (same week)`, values: weeksByYear, color: T.ink3, stroke: 1.25, dash: '4 4' });

  const wow = k.latestWeek && k.prevWeek ? ((k.latestWeek.total - k.prevWeek.total) / k.prevWeek.total * 100) : null;

  const Pill = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      padding:'6px 12px', borderRadius:999, border:`1px solid ${active?T.wine:T.rule}`,
      background: active?T.wine:'transparent', color: active?'#fbf6ec':T.ink2,
      fontFamily:T.sans, fontSize:12, fontWeight:500, letterSpacing:'.01em', cursor:'pointer',
      transition:'all .15s'
    }}>{children}</button>
  );

  return (
    <div style={{
      width:'100%', height:'100%', background:T.paper, color:T.ink,
      fontFamily:T.sans, overflow:'auto', position:'relative',
    }}>
      {/* Masthead */}
      <div style={{borderBottom:`1px solid ${T.rule}`, padding:`${pad}px ${pad+8}px`, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:24}}>
        <div>
          <div style={{fontFamily:T.mono, fontSize:10, letterSpacing:'.18em', color:T.ink3, textTransform:'uppercase', marginBottom:6}}>Faith Church · Leadership Brief · Vol. {year}</div>
          <h1 style={{fontFamily:T.display, fontSize: dens?42:54, fontWeight:500, lineHeight:.95, letterSpacing:'-0.02em', margin:0, color:T.ink}}>
            <em style={{color:T.wine, fontStyle:'italic'}}>Attendance,</em> at a glance.
          </h1>
          <div style={{fontFamily:T.display, fontSize: dens?14:16, fontStyle:'italic', color:T.ink2, marginTop:8, fontWeight:400}}>
            A weekly view across {campusAgg.filter(c=>c.total>0).length} campuses, {catAgg.filter(c=>c.total>0).length} service formats, and {k.weekCount.toLocaleString()} services of record.
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10}}>
          <div style={{display:'flex', gap:6}}>
            {allYears.filter(y=>y>=2024).map(y => (
              <Pill key={y} active={year===y} onClick={()=>setYear(y)}>{y}</Pill>
            ))}
          </div>
          <button style={{padding:'6px 12px', border:`1px solid ${T.rule}`, background:'transparent', borderRadius:4, fontFamily:T.sans, fontSize:11, color:T.ink2, cursor:'pointer', display:'flex', alignItems:'center', gap:6}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI ribbon */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', borderBottom:`1px solid ${T.rule}`}}>
        {[
          { label:'Last week', val: window.fmtFull(k.latestWeek?.total || 0), sub: k.latestWeek ? `Week of ${k.latestWeek.weekOf}` : '—', delta: wow },
          { label:`${year} year-to-date`, val: window.fmtFull(k.ytdTotal), sub: `${k.weekCount} weeks of services`, delta: null },
          { label:'Average weekly', val: window.fmtFull(k.avgWeek), sub:'Sum of all services', delta: null },
          { label:'FaithKids share', val: ((k.faithKidsTotal/(k.allTimeTotal||1))*100).toFixed(1)+'%', sub: window.fmtFull(k.faithKidsTotal)+' kids attended', delta: null },
        ].map((it, i) => (
          <div key={i} style={{padding:`${dens?16:22}px ${pad+8}px`, borderRight: i<3?`1px solid ${T.rule}`:'none'}}>
            <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.2em', textTransform:'uppercase', color:T.ink3, marginBottom:8}}>{it.label}</div>
            <div style={{fontFamily:T.display, fontSize: dens?34:40, fontWeight:500, color:T.ink, lineHeight:1, letterSpacing:'-0.02em', display:'flex', alignItems:'baseline', gap:10}}>
              {it.val}
              {it.delta != null && (
                <span style={{fontFamily:T.sans, fontSize:13, fontWeight:600, color: it.delta>=0 ? T.sage : T.wine, letterSpacing:0}}>
                  {it.delta>=0?'+':''}{it.delta.toFixed(1)}%
                </span>
              )}
            </div>
            <div style={{fontFamily:T.display, fontStyle:'italic', fontSize:13, color:T.ink2, marginTop:8}}>{it.sub}</div>
          </div>
        ))}
      </div>

      {/* Hero trend */}
      <div style={{padding:`${pad+8}px ${pad+8}px ${pad}px`, borderBottom:`1px solid ${T.rule}`}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
          <div>
            <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.2em', textTransform:'uppercase', color:T.ink3}}>The Year in Pews</div>
            <h2 style={{fontFamily:T.display, fontSize: dens?22:28, fontWeight:500, margin:'4px 0 0', letterSpacing:'-0.01em'}}>Weekly attendance, {year}</h2>
          </div>
          <div style={{display:'flex', gap:14, fontFamily:T.sans, fontSize:11}}>
            {trendSeries.map(s => (
              <div key={s.name} style={{display:'flex', alignItems:'center', gap:6, color:T.ink2}}>
                <span style={{display:'inline-block', width:18, height:0, borderTop:`2px ${s.dash?'dashed':'solid'} ${s.color}`}}/>
                {s.name}
              </div>
            ))}
          </div>
        </div>
        <window.LineChart
          width={1376} height={dens?200:250}
          series={trendSeries}
          xLabels={weeklyLabels}
          padding={{t:12,r:24,b:28,l:48}}
          gridColor={T.ruleLight}
          textColor={T.ink3}
          fill={true}
          colors={[T.wine]}
        />
      </div>

      {/* Campus + Service strip */}
      <div style={{display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', borderBottom:`1px solid ${T.rule}`}}>
        <div style={{padding:`${pad}px ${pad+8}px`, borderRight:`1px solid ${T.rule}`}}>
          <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.2em', textTransform:'uppercase', color:T.ink3, marginBottom:14}}>By Campus</div>
          <window.HorizBar
            width={460} height={dens?160:190}
            data={campusAgg.filter(c=>c.total>0).sort((a,b)=>b.total-a.total).map((c,i) => ({
              label:c.campus, value:c.total, color: i===0?T.wine: i===1?T.clay : T.sage
            }))}
            barTrack={T.ruleLight}
            textColor={T.ink}
            subColor={T.ink3}
            fontFamily={T.sans}
          />
        </div>
        <div style={{padding:`${pad}px ${pad+8}px`, borderRight:`1px solid ${T.rule}`}}>
          <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.2em', textTransform:'uppercase', color:T.ink3, marginBottom:14}}>By Service Format</div>
          <window.HorizBar
            width={420} height={dens?160:190}
            data={catAgg.filter(c=>c.total>0).sort((a,b)=>b.total-a.total).map((c,i) => ({
              label:c.cat.replace(' Service','').replace('Wednesday','Wed').replace('Thursday','Thu'),
              value:c.total, color: T.wine
            }))}
            barTrack={T.ruleLight}
            textColor={T.ink}
            subColor={T.ink3}
            fontFamily={T.sans}
          />
        </div>
        <div style={{padding:`${pad}px ${pad+8}px`}}>
          <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.2em', textTransform:'uppercase', color:T.ink3, marginBottom:14}}>Generations</div>
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            {[
              { label:'Mainstream', val: filtered.reduce((s,r)=>s+(r.main||0),0), color:T.wine },
              { label:'FaithKids',  val: filtered.reduce((s,r)=>s+(r.fk||0),0),   color:T.clay },
              { label:'MidStream',  val: filtered.reduce((s,r)=>s+(r.ms||0),0),   color:T.sage },
            ].map((r, i) => {
              const total = filtered.reduce((s,r)=>s+(r.fk||0)+(r.main||0)+(r.ms||0),0) || 1;
              const pct = (r.val/total)*100;
              return (
                <div key={i}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', fontFamily:T.sans, fontSize:13, marginBottom:6}}>
                    <span style={{fontWeight:500}}>{r.label}</span>
                    <span style={{fontFamily:T.display, fontSize:18, fontWeight:500, fontVariantNumeric:'tabular-nums'}}>{window.fmtFull(r.val)}</span>
                  </div>
                  <div style={{height:8, background:T.ruleLight, borderRadius:2, overflow:'hidden'}}>
                    <div style={{height:'100%', width:pct+'%', background:r.color}}/>
                  </div>
                  <div style={{fontFamily:T.mono, fontSize:10, color:T.ink3, marginTop:4}}>{pct.toFixed(1)}% of attendance</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div style={{padding:`${pad}px ${pad+8}px`}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
          <div>
            <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.2em', textTransform:'uppercase', color:T.ink3}}>The Ledger</div>
            <h2 style={{fontFamily:T.display, fontSize: dens?20:24, fontWeight:500, margin:'4px 0 0', letterSpacing:'-0.01em'}}>Recent services</h2>
          </div>
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <span style={{fontFamily:T.sans, fontSize:11, color:T.ink3}}>Filter campus:</span>
            {window.CAMPUSES.map(c => (
              <Pill key={c} active={campusFilter.includes(c)} onClick={()=>{
                setCampusFilter(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c]);
              }}>{c}</Pill>
            ))}
          </div>
        </div>
        <table style={{width:'100%', borderCollapse:'collapse', fontFamily:T.sans, fontSize: dens?12:13}}>
          <thead>
            <tr style={{borderBottom:`1.5px solid ${T.ink}`, color:T.ink2}}>
              {['Date','Campus','Service','FaithKids','Mainstream','MidStream','Total'].map((h,i) => (
                <th key={h} style={{textAlign: i<3?'left':'right', padding:`${dens?6:8}px 12px`, fontWeight:500, fontFamily:T.mono, fontSize:9.5, letterSpacing:'.18em', textTransform:'uppercase', color:T.ink3}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice().sort((a,b)=> a.date<b.date?1:-1).slice(0, dens?22:16).map((r, i) => (
              <tr key={i} onClick={()=>setDrawer(r)} style={{borderBottom:`1px solid ${T.ruleLight}`, cursor:'pointer'}}>
                <td style={{padding:`${dens?6:9}px 12px`, fontFamily:T.mono, fontSize:11.5, color:T.ink2}}>{r.date}</td>
                <td style={{padding:`${dens?6:9}px 12px`, fontWeight:500}}>{r.campus}</td>
                <td style={{padding:`${dens?6:9}px 12px`, fontStyle:'italic', fontFamily:T.display, fontSize:14, color:T.ink2}}>{r.cat}</td>
                <td style={{padding:`${dens?6:9}px 12px`, textAlign:'right', fontVariantNumeric:'tabular-nums', color: r.fk?T.ink:T.ink3}}>{r.fk ?? '—'}</td>
                <td style={{padding:`${dens?6:9}px 12px`, textAlign:'right', fontVariantNumeric:'tabular-nums', color: r.main?T.ink:T.ink3}}>{r.main ?? '—'}</td>
                <td style={{padding:`${dens?6:9}px 12px`, textAlign:'right', fontVariantNumeric:'tabular-nums', color: r.ms?T.ink:T.ink3}}>{r.ms ?? '—'}</td>
                <td style={{padding:`${dens?6:9}px 12px`, textAlign:'right', fontFamily:T.display, fontSize:15, fontWeight:600, fontVariantNumeric:'tabular-nums'}}>{window.fmtFull(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawer && <Drawer record={drawer} onClose={()=>setDrawer(null)} theme={T}/>}
    </div>
  );
}

function Drawer({ record, onClose, theme }) {
  const T = theme;
  // Find sibling rows (same date)
  const sibs = window.ATTENDANCE.filter(r => r.date === record.date);
  const total = sibs.reduce((s,r)=>s+(r.total||0),0);
  // Trend for this campus+cat
  const series = window.ATTENDANCE
    .filter(r => r.campus === record.campus && r.cat === record.cat)
    .sort((a,b) => a.date<b.date?-1:1);
  return (
    <div style={{position:'absolute', inset:0, background:'rgba(35,24,17,.4)', zIndex:10, display:'flex', justifyContent:'flex-end'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:480, height:'100%', background:T.paper, padding:32, overflow:'auto', borderLeft:`1px solid ${T.rule}`,
        boxShadow:'-12px 0 40px rgba(0,0,0,.18)'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24}}>
          <div>
            <div style={{fontFamily:T.mono, fontSize:10, letterSpacing:'.18em', color:T.ink3, textTransform:'uppercase'}}>Service Detail</div>
            <h3 style={{fontFamily:T.display, fontSize:30, margin:'8px 0 0', fontWeight:500, letterSpacing:'-0.01em'}}>{record.cat}</h3>
            <div style={{fontFamily:T.display, fontStyle:'italic', fontSize:16, color:T.ink2, marginTop:4}}>{record.campus} · {record.date}</div>
          </div>
          <button onClick={onClose} style={{background:'transparent', border:`1px solid ${T.rule}`, width:32, height:32, borderRadius:'50%', cursor:'pointer', color:T.ink2, fontSize:14}}>✕</button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:28}}>
          {[
            { l:'Total', v: record.total, big:true },
            { l:'FaithKids', v: record.fk },
            { l:'Mainstream', v: record.main },
            { l:'MidStream', v: record.ms },
          ].map((it,i) => (
            <div key={i} style={{padding:14, border:`1px solid ${T.rule}`, background:T.card, borderRadius:4}}>
              <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.2em', textTransform:'uppercase', color:T.ink3}}>{it.l}</div>
              <div style={{fontFamily:T.display, fontSize: it.big?38:24, fontWeight:500, marginTop:6, fontVariantNumeric:'tabular-nums'}}>{it.v == null ? '—' : window.fmtFull(it.v)}</div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:24}}>
          <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.2em', textTransform:'uppercase', color:T.ink3, marginBottom:10}}>Trend · {record.cat} at {record.campus}</div>
          <window.LineChart
            width={416} height={130}
            series={[{ name:record.cat, values: series.map(s=>s.total), color:T.wine }]}
            xLabels={series.map(s=>s.date.slice(5))}
            fill={true} colors={[T.wine]}
            padding={{t:10,r:8,b:24,l:36}}
            gridColor={T.ruleLight} textColor={T.ink3}
          />
        </div>

        <div style={{marginBottom:24}}>
          <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.2em', textTransform:'uppercase', color:T.ink3, marginBottom:10}}>Same date · all services</div>
          <table style={{width:'100%', borderCollapse:'collapse', fontFamily:T.sans, fontSize:12}}>
            {sibs.map((s,i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.ruleLight}`}}>
                <td style={{padding:'8px 0', color: s===record?T.wine:T.ink2}}>{s.campus}</td>
                <td style={{padding:'8px 0', fontStyle:'italic', fontFamily:T.display, color: s===record?T.wine:T.ink2}}>{s.cat}</td>
                <td style={{padding:'8px 0', textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight: s===record?600:400, color: s===record?T.wine:T.ink}}>{window.fmtFull(s.total)}</td>
              </tr>
            ))}
            <tr style={{borderTop:`2px solid ${T.ink}`, fontWeight:600}}>
              <td colSpan="2" style={{padding:'10px 0'}}>All campuses</td>
              <td style={{padding:'10px 0', textAlign:'right', fontFamily:T.display, fontSize:18, fontWeight:600}}>{window.fmtFull(total)}</td>
            </tr>
          </table>
        </div>

        {record.notes && (
          <div style={{padding:14, background:T.card, border:`1px solid ${T.rule}`, borderRadius:4}}>
            <div style={{fontFamily:T.mono, fontSize:9.5, letterSpacing:'.2em', textTransform:'uppercase', color:T.ink3, marginBottom:6}}>Notes</div>
            <div style={{fontFamily:T.display, fontStyle:'italic', fontSize:14, color:T.ink2}}>{record.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

window.DirectionA = DirectionA;
