// charts.jsx — lightweight SVG chart primitives for the dashboards
// Exposes: LineChart, AreaTrend, StackedBar, GroupedBar, Sparkline, Heatmap, DonutKpi
// All accept { width, height, data, ...opts }

const fmt = (n) => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1000) return (n/1000).toFixed(n>=10000?0:1) + 'k';
  return Math.round(n).toLocaleString();
};
const fmtFull = (n) => n == null ? '—' : Math.round(n).toLocaleString();

// ---------- LineChart ----------
function LineChart({ width=600, height=220, series=[], xLabels=[], colors=['#7a2e2e'], stroke=2, fill=false, padding={t:16,r:16,b:28,l:36}, gridColor='rgba(0,0,0,.07)', textColor='rgba(40,30,20,.55)', font='inherit', yTickCount=4, showDots=false, onHover }) {
  const [hover, setHover] = React.useState(null);
  const P = padding;
  const W = width - P.l - P.r;
  const H = height - P.t - P.b;
  const allVals = series.flatMap(s => s.values).filter(v => v != null && !isNaN(v));
  const maxV = allVals.length ? Math.max(...allVals) : 1;
  const niceMax = Math.ceil(maxV * 1.08 / 100) * 100 || 1;
  const n = xLabels.length || (series[0]?.values.length ?? 0);
  const x = (i) => P.l + (n<=1 ? W/2 : (i / (n-1)) * W);
  const y = (v) => P.t + H - (v / niceMax) * H;
  const ticks = Array.from({length: yTickCount+1}, (_,i) => Math.round(niceMax * i / yTickCount));

  const buildPath = (values) => {
    let d = '';
    let started = false;
    values.forEach((v, i) => {
      if (v == null || isNaN(v)) { started = false; return; }
      d += (started ? ' L' : 'M') + x(i) + ',' + y(v);
      started = true;
    });
    return d;
  };
  const buildArea = (values) => {
    let segs = [];
    let cur = [];
    values.forEach((v, i) => {
      if (v == null || isNaN(v)) {
        if (cur.length) segs.push(cur);
        cur = [];
      } else {
        cur.push([i, v]);
      }
    });
    if (cur.length) segs.push(cur);
    return segs.map(seg => {
      let d = 'M' + x(seg[0][0]) + ',' + (P.t+H);
      seg.forEach(([i,v]) => { d += ' L' + x(i) + ',' + y(v); });
      d += ' L' + x(seg[seg.length-1][0]) + ',' + (P.t+H) + ' Z';
      return d;
    }).join(' ');
  };

  return (
    <svg width={width} height={height} style={{font, display:'block', overflow:'visible'}} onMouseLeave={()=>{setHover(null); onHover && onHover(null);}}>
      {ticks.map((t,i) => (
        <g key={i}>
          <line x1={P.l} x2={width-P.r} y1={y(t)} y2={y(t)} stroke={gridColor} strokeWidth="1"/>
          <text x={P.l-8} y={y(t)+3} fontSize="10" fill={textColor} textAnchor="end">{fmt(t)}</text>
        </g>
      ))}
      {xLabels.map((lab, i) => {
        const step = Math.ceil(n / 8);
        if (i % step !== 0 && i !== n-1) return null;
        return <text key={i} x={x(i)} y={height-P.b+14} fontSize="10" fill={textColor} textAnchor="middle">{lab}</text>;
      })}
      {series.map((s, si) => {
        const c = s.color || colors[si % colors.length];
        return (
          <g key={si}>
            {fill && <path d={buildArea(s.values)} fill={c} fillOpacity={s.fillOpacity ?? 0.12}/>}
            <path d={buildPath(s.values)} fill="none" stroke={c} strokeWidth={s.stroke ?? stroke} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dash}/>
            {showDots && s.values.map((v,i) => v == null ? null : (
              <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill={c}/>
            ))}
          </g>
        );
      })}
      {/* hover bands */}
      {xLabels.map((lab, i) => (
        <rect key={i} x={x(i) - W/n/2} y={P.t} width={W/n} height={H} fill="transparent"
          onMouseEnter={() => { setHover(i); onHover && onHover({i, lab}); }}/>
      ))}
      {hover != null && (
        <g pointerEvents="none">
          <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={P.t+H} stroke="rgba(0,0,0,.25)" strokeDasharray="3 3"/>
          {series.map((s, si) => {
            const v = s.values[hover];
            if (v == null) return null;
            return <circle key={si} cx={x(hover)} cy={y(v)} r="4" fill="#fff" stroke={s.color || colors[si%colors.length]} strokeWidth="2"/>;
          })}
          <g transform={`translate(${Math.min(x(hover)+10, width-P.r-120)}, ${P.t+8})`}>
            <rect x="0" y="0" width="120" height={20 + series.length*16} fill="#fff" stroke="rgba(0,0,0,.15)" rx="4"/>
            <text x="8" y="14" fontSize="10" fill="rgba(40,30,20,.6)">{xLabels[hover]}</text>
            {series.map((s, si) => (
              <g key={si}>
                <circle cx="12" cy={28+si*16} r="3.5" fill={s.color || colors[si%colors.length]}/>
                <text x="22" y={31+si*16} fontSize="11" fill="rgba(40,30,20,.85)">{s.name}</text>
                <text x="112" y={31+si*16} fontSize="11" fontWeight="600" fill="rgba(40,30,20,.85)" textAnchor="end">{fmtFull(s.values[hover])}</text>
              </g>
            ))}
          </g>
        </g>
      )}
    </svg>
  );
}

// ---------- StackedBar (vertical) ----------
function StackedBar({ width=600, height=220, data=[], keys=[], colors=[], xLabels=[], padding={t:12,r:8,b:24,l:32}, gridColor='rgba(0,0,0,.07)', textColor='rgba(40,30,20,.55)', barGap=0.3 }) {
  const P = padding;
  const W = width - P.l - P.r;
  const H = height - P.t - P.b;
  const totals = data.map(d => keys.reduce((a,k)=> a + (d[k]||0), 0));
  const maxV = Math.max(...totals, 1);
  const niceMax = Math.ceil(maxV * 1.05 / 100) * 100;
  const n = data.length;
  const bw = (W / n) * (1 - barGap);
  const step = W / n;
  const y = (v) => P.t + H - (v / niceMax) * H;
  const ticks = [0, niceMax/2, niceMax];
  return (
    <svg width={width} height={height} style={{display:'block', overflow:'visible'}}>
      {ticks.map((t,i) => (
        <g key={i}>
          <line x1={P.l} x2={width-P.r} y1={y(t)} y2={y(t)} stroke={gridColor}/>
          <text x={P.l-6} y={y(t)+3} fontSize="10" fill={textColor} textAnchor="end">{fmt(t)}</text>
        </g>
      ))}
      {data.map((d, di) => {
        let acc = 0;
        const cx = P.l + step*di + step/2;
        return (
          <g key={di}>
            {keys.map((k, ki) => {
              const v = d[k] || 0;
              const yTop = y(acc + v);
              const yBot = y(acc);
              acc += v;
              return <rect key={ki} x={cx - bw/2} y={yTop} width={bw} height={Math.max(0, yBot-yTop)} fill={colors[ki]}/>;
            })}
            <text x={cx} y={height-P.b+13} fontSize="10" fill={textColor} textAnchor="middle">{xLabels[di] || ''}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------- HorizBar ----------
function HorizBar({ width=300, height=200, data=[], color='#7a2e2e', textColor='rgba(40,30,20,.85)', subColor='rgba(40,30,20,.5)', fontFamily='inherit', barTrack='rgba(0,0,0,.06)', maxV }) {
  const max = maxV ?? Math.max(...data.map(d=>d.value), 1);
  const rowH = height / data.length;
  const labelW = 64;
  const valW = 56;
  const trackW = width - labelW - valW - 16;
  return (
    <svg width={width} height={height} style={{display:'block', fontFamily}}>
      {data.map((d, i) => {
        const w = (d.value / max) * trackW;
        const cy = rowH * i + rowH/2;
        return (
          <g key={i}>
            <text x={0} y={cy+4} fontSize="12" fill={textColor} fontWeight="500">{d.label}</text>
            <rect x={labelW} y={cy-7} width={trackW} height="14" fill={barTrack} rx="2"/>
            <rect x={labelW} y={cy-7} width={w} height="14" fill={d.color || color} rx="2"/>
            <text x={labelW+trackW+8} y={cy+4} fontSize="11" fill={subColor} style={{fontVariantNumeric:'tabular-nums'}}>{fmtFull(d.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------- Sparkline ----------
function Sparkline({ width=80, height=22, values=[], color='#7a2e2e', strokeWidth=1.5, fill=true }) {
  const vals = values.filter(v => v != null);
  if (!vals.length) return <svg width={width} height={height}/>;
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const x = (i) => (i / (values.length-1 || 1)) * width;
  const y = (v) => height - ((v - min) / range) * (height - 4) - 2;
  let d = '';
  let started = false;
  values.forEach((v,i) => {
    if (v == null) { started = false; return; }
    d += (started?' L':'M') + x(i) + ',' + y(v);
    started = true;
  });
  const areaD = d + ` L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{display:'block'}}>
      {fill && <path d={areaD} fill={color} fillOpacity="0.14"/>}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ---------- Heatmap (campus x month) ----------
function Heatmap({ width=600, height=240, rows=[], cols=[], values=[], color='#7a2e2e', maxV, cellGap=2, padding={t:8,r:8,b:24,l:60}, textColor='rgba(40,30,20,.6)' }) {
  const P = padding;
  const W = width - P.l - P.r;
  const H = height - P.t - P.b;
  const cw = W / cols.length - cellGap;
  const ch = H / rows.length - cellGap;
  const max = maxV ?? Math.max(...values.flat().filter(v=>v!=null), 1);
  const cellColor = (v) => {
    if (v == null) return 'rgba(0,0,0,0.04)';
    const t = Math.max(0.05, Math.min(1, v / max));
    return color + Math.round(t*255).toString(16).padStart(2,'0');
  };
  return (
    <svg width={width} height={height} style={{display:'block', overflow:'visible'}}>
      {rows.map((r, ri) => (
        <text key={ri} x={P.l-8} y={P.t + ch*(ri+0.5) + 4 + cellGap*ri} fontSize="11" fill={textColor} textAnchor="end" fontWeight="500">{r}</text>
      ))}
      {cols.map((c, ci) => {
        if (ci % 2 !== 0 && cols.length > 12) return null;
        return <text key={ci} x={P.l + cw*(ci+0.5) + cellGap*ci} y={height-P.b+12} fontSize="10" fill={textColor} textAnchor="middle">{c}</text>;
      })}
      {rows.map((r, ri) => values[ri].map((v, ci) => (
        <g key={`${ri}-${ci}`}>
          <rect x={P.l + ci*(cw+cellGap)} y={P.t + ri*(ch+cellGap)} width={cw} height={ch} fill={cellColor(v)} rx="2"/>
        </g>
      )))}
    </svg>
  );
}

window.LineChart = LineChart;
window.StackedBar = StackedBar;
window.HorizBar = HorizBar;
window.Sparkline = Sparkline;
window.Heatmap = Heatmap;
window.fmt = fmt;
window.fmtFull = fmtFull;
