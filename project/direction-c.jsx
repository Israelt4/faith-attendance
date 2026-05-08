// direction-c.jsx — Data Explorer
// Table-first power-user view. Inline sparklines, small multiples, dense.

const C_THEME = {
  bg: '#1c1612',
  panel: '#231b16',
  panelAlt: '#2a201a',
  border: 'rgba(245,230,210,0.10)',
  borderStrong: 'rgba(245,230,210,0.20)',
  ink: '#f3ead8',
  ink2: 'rgba(243,234,216,0.78)',
  ink3: 'rgba(243,234,216,0.50)',
  primary: '#d97757',  // warm clay
  primaryDim: '#a4574e',
  accent: '#9bb38e',   // sage
  warn: '#e6b56a',     // gold
  cool: '#7da0c4',
  rose: '#cf7d8e',
  sans: '"Hanken Grotesk", -apple-system, system-ui, sans-serif',
  display: '"Spectral", "Times New Roman", serif',
  mono: '"JetBrains Mono", "SF Mono", monospace',
};

function DirectionC({ density='compact', layout='hybrid' }) {
  const T = C_THEME;
  const ALL = window.ATTENDANCE;
  const [pivot, setPivot] = React.useState('campus'); // campus | cat | week
  const [year, setYear] = React.useState(2025);
  const [search, setSearch] = React.useState('');
  const [drawer, setDrawer] = React.useState(null);
  const [sort, setSort] = React.useState({ key:'total', dir:'desc' });

  const filtered = React.useMemo(() => {
    let r = ALL.filter(x => x.year === year);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => x.date.includes(q) || x.campus.toLowerCase().includes(q) || x.cat.toLowerCase().includes(q));
    }
    return r;
  }, [year, search]);

  const dens = density === 'compact';
  const allYears = [...new Set(ALL.map(r=>r.year))].sort();

  // Pivot table
  const pivotRows = React.useMemo(() => {
    const map = new Map();
    filtered.forEach(r => {
      const key = pivot === 'campus' ? r.campus
                : pivot === 'cat' ? r.cat
                : r.weekOf;
      if (!map.has(key)) map.set(key, { key, total:0, fk:0, main:0, ms:0, n:0, dates: [] });
      const e = map.get(key);
      e.total += r.total || 0;
      e.fk += r.fk || 0;
      e.main += r.main || 0;
      e.ms += r.ms || 0;
      e.n += 1;
      e.dates.push({ date: r.date, total: r.total });
    });
    return [...map.values()].map(r => ({ ...r, dates: r.dates.sort((a,b)=>a.date<b.date?-1:1), spark: r.dates.sort((a,b)=>a.date<b.date?-1:1).map(d=>d.total) }));
  }, [filtered, pivot]);

  const sortedPivot = React.useMemo(() => {
    const r = [...pivotRows];
    r.sort((a,b) => {
      const av = a[sort.key], bv = b[sort.key];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [pivotRows, sort]);

  // Small multiples per campus
  const campusTrends = window.CAMPUSES.map(c => {
    const rows = filtered.filter(r => r.campus === c);
    const wk = window.agg.byWeek(rows);
    return { campus: c, weeks: wk, total: rows.reduce((s,r)=>s+(r.total||0),0) };
  }).filter(c => c.total > 0);

  const allTotal = filtered.reduce((s,r)=>s+(r.total||0),0);
  const allWeeks = window.agg.byWeek(filtered);

  const sortIcon = (key) => {
    if (sort.key !== key) return <span style={{color:T.ink3, fontSize:9, marginLeft:4}}>↕</span>;
    return <span style={{color:T.primary, fontSize:10, marginLeft:4}}>{sort.dir==='asc'?'↑':'↓'}</span>;
  };

  return (
    <div style={{
      width:'100%', height:'100%', background:T.bg, color:T.ink, fontFamily:T.sans,
      display:'flex', flexDirection:'column', overflow:'hidden'
    }}>
      {/* Top bar */}
      <div style={{padding:'14px 20px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:14, background:T.panel}}>
        <div style={{fontFamily:T.mono, fontSize:11, color:T.primary, fontWeight:600, letterSpacing:'.08em'}}>FAITH/EXPLORER</div>
        <div style={{height:14, width:1, background:T.border}}/>
        <div style={{display:'flex', gap:4, fontFamily:T.mono, fontSize:11}}>
          {allYears.filter(y=>y>=2024).map(y => (
            <button key={y} onClick={()=>setYear(y)} style={{
              padding:'4px 10px', background: year===y?T.primary:'transparent',
              color: year===y?'#fff':T.ink2, border:`1px solid ${year===y?T.primary:T.border}`,
              borderRadius:3, cursor:'pointer', fontFamily:T.mono
            }}>{y}</button>
          ))}
        </div>
        <div style={{height:14, width:1, background:T.border}}/>
        <div style={{display:'flex', gap:4, fontFamily:T.mono, fontSize:11}}>
          <span style={{color:T.ink3, padding:'4px 0'}}>pivot:</span>
          {[['campus','campus'],['cat','service'],['week','week']].map(([k,l]) => (
            <button key={k} onClick={()=>setPivot(k)} style={{
              padding:'4px 10px', background: pivot===k?T.borderStrong:'transparent',
              color: pivot===k?T.ink:T.ink2, border:`1px solid ${T.border}`,
              borderRadius:3, cursor:'pointer', fontFamily:T.mono
            }}>{l}</button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <div style={{position:'relative'}}>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="search date · campus · service…"
            style={{
              padding:'6px 12px 6px 28px', background:T.bg, border:`1px solid ${T.border}`,
              borderRadius:4, color:T.ink, fontFamily:T.mono, fontSize:11.5, width:260, outline:'none'
            }}
          />
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.ink3} strokeWidth="2" style={{position:'absolute', left:10, top:8}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <button style={{padding:'6px 12px', fontSize:11, background:'transparent', border:`1px solid ${T.border}`, color:T.ink2, borderRadius:4, cursor:'pointer', fontFamily:T.mono, display:'flex', alignItems:'center', gap:6}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          export.csv
        </button>
      </div>

      <div style={{flex:1, display:'flex', overflow:'hidden'}}>
        {/* Pivot table */}
        <div style={{flex:'1 1 60%', overflow:'auto', borderRight:`1px solid ${T.border}`}}>
          <div style={{padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:T.bg, zIndex:2, borderBottom:`1px solid ${T.border}`}}>
            <div>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.ink3, letterSpacing:'.1em', textTransform:'uppercase'}}>Pivot · {pivot}</div>
              <div style={{fontFamily:T.display, fontSize:18, fontWeight:500, marginTop:2}}>{pivotRows.length} groups · {filtered.length.toLocaleString()} records · {window.fmtFull(allTotal)} seats</div>
            </div>
          </div>
          <table style={{width:'100%', borderCollapse:'collapse', fontFamily:T.mono, fontSize:11.5}}>
            <thead>
              <tr style={{background:T.panel}}>
                {[
                  ['key', pivot, 'left'],
                  ['n', 'svc', 'right'],
                  ['fk', 'kids', 'right'],
                  ['main', 'main', 'right'],
                  ['ms', 'mid', 'right'],
                  ['total', 'total', 'right'],
                  ['spark', 'trend', 'left'],
                ].map(([k,l,a]) => (
                  <th key={k} onClick={()=> k!=='spark' && setSort(s => ({key:k, dir: s.key===k && s.dir==='desc'?'asc':'desc'}))} style={{
                    textAlign:a, padding:'8px 14px', fontWeight:600, fontSize:9.5, letterSpacing:'.14em',
                    textTransform:'uppercase', color:T.ink3, cursor: k==='spark'?'default':'pointer',
                    userSelect:'none', borderBottom:`1px solid ${T.border}`, position:'sticky', top:0, background:T.panel
                  }}>
                    {l}{k!=='spark' && sortIcon(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPivot.map((r, i) => {
                const pct = (r.total / (allTotal||1)) * 100;
                return (
                  <tr key={r.key} onClick={()=>setDrawer(r)} style={{borderBottom:`1px solid ${T.border}`, cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.panelAlt}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'7px 14px', color:T.ink, fontWeight:500, position:'relative'}}>
                      <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`, background:T.primary, opacity:.08}}/>
                      <span style={{position:'relative'}}>{r.key}</span>
                    </td>
                    <td style={{padding:'7px 14px', textAlign:'right', color:T.ink3, fontVariantNumeric:'tabular-nums'}}>{r.n}</td>
                    <td style={{padding:'7px 14px', textAlign:'right', color:T.warn, fontVariantNumeric:'tabular-nums'}}>{r.fk ? window.fmt(r.fk) : '·'}</td>
                    <td style={{padding:'7px 14px', textAlign:'right', color:T.ink2, fontVariantNumeric:'tabular-nums'}}>{r.main ? window.fmt(r.main) : '·'}</td>
                    <td style={{padding:'7px 14px', textAlign:'right', color:T.accent, fontVariantNumeric:'tabular-nums'}}>{r.ms ? window.fmt(r.ms) : '·'}</td>
                    <td style={{padding:'7px 14px', textAlign:'right', color:T.ink, fontWeight:600, fontVariantNumeric:'tabular-nums'}}>{window.fmtFull(r.total)}</td>
                    <td style={{padding:'4px 14px', width:120}}>
                      <window.Sparkline width={100} height={20} values={r.spark} color={T.primary}/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right rail: small multiples + summary */}
        <div style={{flex:'1 1 40%', overflow:'auto', padding:'14px 20px'}}>
          <div style={{fontFamily:T.mono, fontSize:10, color:T.ink3, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8}}>Year trace · weekly</div>
          <div style={{background:T.panel, border:`1px solid ${T.border}`, borderRadius:4, padding:'10px 12px', marginBottom:18}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6}}>
              <div style={{fontFamily:T.display, fontSize:24, fontWeight:500, fontVariantNumeric:'tabular-nums'}}>{window.fmtFull(allTotal)}</div>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.ink3}}>{allWeeks.length} weeks · avg {window.fmtFull(Math.round(allTotal/(allWeeks.length||1)))}/wk</div>
            </div>
            <window.LineChart
              width={460} height={120}
              series={[{ name:'Total', values: allWeeks.map(w=>w.total), color: T.primary }]}
              xLabels={allWeeks.map(w => w.weekOf.slice(5))}
              fill={true}
              padding={{t:6,r:6,b:20,l:32}}
              gridColor={T.border} textColor={T.ink3}
            />
          </div>

          <div style={{fontFamily:T.mono, fontSize:10, color:T.ink3, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8}}>Small multiples · by campus</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            {campusTrends.map(c => (
              <div key={c.campus} style={{background:T.panel, border:`1px solid ${T.border}`, borderRadius:4, padding:'8px 10px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4}}>
                  <div style={{fontFamily:T.mono, fontSize:11, color:T.primary, fontWeight:600}}>{c.campus}</div>
                  <div style={{fontFamily:T.mono, fontSize:10, color:T.ink3, fontVariantNumeric:'tabular-nums'}}>{window.fmtFull(c.total)}</div>
                </div>
                <window.Sparkline width={210} height={36} values={c.weeks.map(w=>w.total)} color={T.primary}/>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:2, fontFamily:T.mono, fontSize:9, color:T.ink3}}>
                  <span>{c.weeks[0]?.weekOf.slice(5)}</span>
                  <span>{c.weeks.length} wks</span>
                  <span>{c.weeks[c.weeks.length-1]?.weekOf.slice(5)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:18, fontFamily:T.mono, fontSize:10, color:T.ink3, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8}}>Generation split</div>
          <div style={{background:T.panel, border:`1px solid ${T.border}`, borderRadius:4, padding:'12px 14px'}}>
            {[
              { l:'Mainstream', v:filtered.reduce((s,r)=>s+(r.main||0),0), c:T.primary },
              { l:'FaithKids',  v:filtered.reduce((s,r)=>s+(r.fk||0),0),   c:T.warn },
              { l:'MidStream',  v:filtered.reduce((s,r)=>s+(r.ms||0),0),   c:T.accent },
            ].map((r,i) => {
              const total = filtered.reduce((s,r)=>s+(r.fk||0)+(r.main||0)+(r.ms||0),0)||1;
              const pct = (r.v/total)*100;
              return (
                <div key={i} style={{marginBottom:i<2?10:0}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontFamily:T.mono, fontSize:11, marginBottom:4}}>
                    <span style={{color:r.c}}>{r.l}</span>
                    <span style={{color:T.ink, fontWeight:600, fontVariantNumeric:'tabular-nums'}}>{window.fmtFull(r.v)} <span style={{color:T.ink3, fontWeight:400}}>· {pct.toFixed(1)}%</span></span>
                  </div>
                  <div style={{height:4, background:T.border, borderRadius:1, overflow:'hidden'}}>
                    <div style={{height:'100%', width:pct+'%', background:r.c}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {drawer && <CDrawer record={drawer} pivot={pivot} onClose={()=>setDrawer(null)} theme={T} year={year}/>}
    </div>
  );
}

function CDrawer({ record, pivot, onClose, theme, year }) {
  const T = theme;
  // Find underlying records
  const matches = window.ATTENDANCE.filter(r => {
    if (r.year !== year) return false;
    if (pivot==='campus') return r.campus === record.key;
    if (pivot==='cat') return r.cat === record.key;
    return r.weekOf === record.key;
  }).sort((a,b)=>a.date<b.date?1:-1);

  return (
    <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,.65)', zIndex:20, display:'flex', justifyContent:'flex-end'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:560, height:'100%', background:T.panel, padding:0, overflow:'auto',
        borderLeft:`1px solid ${T.borderStrong}`, fontFamily:T.sans
      }}>
        <div style={{padding:'16px 20px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontFamily:T.mono, fontSize:10, color:T.ink3, letterSpacing:'.12em', textTransform:'uppercase'}}>{pivot} · group</div>
            <div style={{fontFamily:T.display, fontSize:24, fontWeight:500, color:T.ink, marginTop:2}}>{record.key}</div>
          </div>
          <button onClick={onClose} style={{background:'transparent', border:`1px solid ${T.border}`, width:30, height:30, borderRadius:4, cursor:'pointer', color:T.ink2, fontFamily:T.mono}}>✕</button>
        </div>

        <div style={{padding:20}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:18}}>
            {[
              { l:'total', v:record.total, c:T.primary },
              { l:'svc', v:record.n, c:T.ink },
              { l:'kids', v:record.fk, c:T.warn },
              { l:'mid', v:record.ms, c:T.accent },
            ].map((it,i) => (
              <div key={i} style={{padding:10, background:T.bg, border:`1px solid ${T.border}`, borderRadius:3}}>
                <div style={{fontFamily:T.mono, fontSize:9, color:T.ink3, letterSpacing:'.1em', textTransform:'uppercase'}}>{it.l}</div>
                <div style={{fontFamily:T.display, fontSize:20, color:it.c, fontWeight:500, fontVariantNumeric:'tabular-nums', marginTop:4}}>{window.fmt(it.v)}</div>
              </div>
            ))}
          </div>

          <div style={{fontFamily:T.mono, fontSize:10, color:T.ink3, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8}}>Records · {matches.length}</div>
          <table style={{width:'100%', borderCollapse:'collapse', fontFamily:T.mono, fontSize:11}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${T.border}`, color:T.ink3}}>
                <th style={{textAlign:'left', padding:'6px 8px', fontSize:9, letterSpacing:'.1em', fontWeight:600}}>DATE</th>
                {pivot!=='campus' && <th style={{textAlign:'left', padding:'6px 8px', fontSize:9, letterSpacing:'.1em', fontWeight:600}}>CAMPUS</th>}
                {pivot!=='cat' && <th style={{textAlign:'left', padding:'6px 8px', fontSize:9, letterSpacing:'.1em', fontWeight:600}}>SERVICE</th>}
                <th style={{textAlign:'right', padding:'6px 8px', fontSize:9, letterSpacing:'.1em', fontWeight:600}}>KIDS</th>
                <th style={{textAlign:'right', padding:'6px 8px', fontSize:9, letterSpacing:'.1em', fontWeight:600}}>MAIN</th>
                <th style={{textAlign:'right', padding:'6px 8px', fontSize:9, letterSpacing:'.1em', fontWeight:600}}>MID</th>
                <th style={{textAlign:'right', padding:'6px 8px', fontSize:9, letterSpacing:'.1em', fontWeight:600}}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {matches.slice(0, 30).map((r, i) => (
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'5px 8px', color:T.ink2}}>{r.date}</td>
                  {pivot!=='campus' && <td style={{padding:'5px 8px', color:T.primary}}>{r.campus}</td>}
                  {pivot!=='cat' && <td style={{padding:'5px 8px', color:T.ink2}}>{r.cat}</td>}
                  <td style={{padding:'5px 8px', textAlign:'right', color: r.fk?T.warn:T.ink3, fontVariantNumeric:'tabular-nums'}}>{r.fk ?? '·'}</td>
                  <td style={{padding:'5px 8px', textAlign:'right', color: r.main?T.ink2:T.ink3, fontVariantNumeric:'tabular-nums'}}>{r.main ?? '·'}</td>
                  <td style={{padding:'5px 8px', textAlign:'right', color: r.ms?T.accent:T.ink3, fontVariantNumeric:'tabular-nums'}}>{r.ms ?? '·'}</td>
                  <td style={{padding:'5px 8px', textAlign:'right', color:T.ink, fontWeight:600, fontVariantNumeric:'tabular-nums'}}>{window.fmtFull(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {matches.length > 30 && <div style={{padding:'10px 8px', fontFamily:T.mono, fontSize:10, color:T.ink3}}>+ {matches.length-30} more rows</div>}
        </div>
      </div>
    </div>
  );
}

window.DirectionC = DirectionC;
