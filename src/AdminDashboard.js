import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// ── helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

  // eslint-disable-next-line no-unused-vars
  function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function topN(arr, key, n = 5) {
  const map = {};
  for (const item of arr) {
    const k = item[key] || 'unknown';
    map[k] = (map[k] || 0) + 1;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
}

const PERIOD_OPTIONS = [
  { label: '24h',     days: 1  },
  { label: '7 dias',  days: 7  },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
];

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, loading }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: '#141414',
      border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 8,
      padding: '20px 20px 16px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: 'clamp(2rem,3.5vw,2.6rem)', fontWeight: 700, color: '#e5c97e', lineHeight: 1 }}>
        {loading ? '—' : value}
      </div>
      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '.58rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)' }}>
        {label}
      </div>
    </div>
  );
}

// ── gráfico de linha ──────────────────────────────────────────────────────────

function LineChart({ data, maxY }) {
  const W = 960, H = 110, PAD = { top: 16, right: 8, bottom: 24, left: 28 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const hours = Array.from({ length: 24 }, (_, i) => data[i] || 0);
  const yMax = Math.max(maxY || 1, ...hours, 1);

  const xScale = (i) => PAD.left + (i / 23) * innerW;
  const yScale = (v) => PAD.top + innerH - (v / yMax) * innerH;

  const points = hours.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ');
  const areaPoints = `${xScale(0)},${PAD.top + innerH} ${points} ${xScale(23)},${PAD.top + innerH}`;

  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  function handleMouseMove(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((x - PAD.left) / innerW) * 23);
    const clamped = Math.max(0, Math.min(23, i));
    setTooltip({ h: clamped, count: hours[clamped], x: xScale(clamped), y: yScale(hours[clamped]) });
  }

  return (
    <div style={{ position: 'relative' }}>
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: `${(tooltip.x / W) * 100}%`,
          top: `${((tooltip.y - 10) / H) * 100}%`,
          transform: 'translate(-50%, -100%)',
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,.15)',
          borderRadius: 6,
          padding: '4px 10px',
          fontFamily: 'Inter,sans-serif',
          fontSize: '.7rem',
          color: '#fff',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          {String(tooltip.h).padStart(2,'0')}h — {tooltip.count} pageview{tooltip.count !== 1 ? 's' : ''}
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e5c97e" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#e5c97e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD.top + innerH * (1 - t);
          const val = Math.round(yMax * t);
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
              {val > 0 && (
                <text x={PAD.left - 4} y={y + 4} textAnchor="end" fill="rgba(255,255,255,.25)" fontSize="9" fontFamily="Inter,sans-serif">
                  {val}
                </text>
              )}
            </g>
          );
        })}

        {/* eixo x — linha base */}
        <line
          x1={PAD.left} y1={PAD.top + innerH}
          x2={W - PAD.right} y2={PAD.top + innerH}
          stroke="rgba(255,255,255,.15)" strokeWidth="1"
        />

        {/* área */}
        <polygon points={areaPoints} fill="url(#area-grad)" />

        {/* linha */}
        <polyline points={points} fill="none" stroke="#e5c97e" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* pontos */}
        {hours.map((v, i) => (
          <circle
            key={i}
            cx={xScale(i)} cy={yScale(v)} r={tooltip?.h === i ? 4 : 2.5}
            fill={tooltip?.h === i ? '#fff' : '#e5c97e'}
            stroke="#141414" strokeWidth="1.5"
          />
        ))}

        {/* labels eixo x — dentro do padding bottom, abaixo da linha base */}
        {[0, 3, 6, 9, 12, 15, 18, 21, 23].map((h) => (
          <text
            key={h}
            x={xScale(h)}
            y={PAD.top + innerH + 16}
            textAnchor="middle"
            fill="rgba(255,255,255,.25)"
            fontSize="9"
            fontFamily="Inter,sans-serif"
          >
            {String(h).padStart(2,'0')}h
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── stat row com barra ────────────────────────────────────────────────────────

const BAR_COLORS = ['#e5c97e', '#4ade80', '#a78bfa', '#f87171', '#38bdf8'];

function StatList({ title, data, loading, color = '#e5c97e' }) {
  const max = data[0]?.[1] || 1;
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: '#141414',
      border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 8,
      padding: '14px 16px',
    }}>
      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '.58rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginBottom: 10 }}>
        {title}
      </div>
      {loading ? (
        <div style={{ color: 'rgba(255,255,255,.2)', fontSize: '.75rem' }}>Carregando…</div>
      ) : data.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,.2)', fontSize: '.75rem' }}>Sem dados.</div>
      ) : (
        data.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
            <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '.75rem', color: 'rgba(255,255,255,.55)', minWidth: 70, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</span>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((v / max) * 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s' }} />
            </div>
            <span style={{ fontFamily: 'Oswald,sans-serif', fontSize: '.78rem', color: '#fff', minWidth: 18, textAlign: 'right' }}>{v}</span>
          </div>
        ))
      )}
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [periodIdx, setPeriodIdx] = useState(0);
  const [pageviews, setPageviews] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // data selecionada para o gráfico (padrão = hoje)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [chartDate, setChartDate] = useState(todayStr);

  const period = PERIOD_OPTIONS[periodIdx];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const since = Timestamp.fromDate(daysAgo(period.days));
        const [pvSnap, clSnap] = await Promise.all([
          getDocs(query(collection(db, 'analytics_pageviews'), where('ts', '>=', since))),
          getDocs(query(collection(db, 'analytics_clicks'),   where('ts', '>=', since))),
        ]);
        if (cancelled) return;
        setPageviews(pvSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setClicks(clSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        if (!cancelled) setError(e.message || 'Erro ao carregar analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [period.days]);

  // KPIs
  const sessions   = useMemo(() => new Set(pageviews.map((p) => p.sessionId)).size, [pageviews]);
  const pages      = useMemo(() => new Set(pageviews.map((p) => p.page)).size, [pageviews]);
  const countries  = useMemo(() => new Set(pageviews.map((p) => p.country)).size, [pageviews]);

  // gráfico por hora — filtra pela data selecionada
  const hourData = useMemo(() => {
    const map = {};
    const selected = new Date(chartDate + 'T00:00:00');
    const nextDay  = new Date(chartDate + 'T00:00:00');
    nextDay.setDate(nextDay.getDate() + 1);
    for (const pv of pageviews) {
      const ts = pv.ts?.toDate?.();
      if (!ts || ts < selected || ts >= nextDay) continue;
      const h = ts.getHours();
      map[h] = (map[h] || 0) + 1;
    }
    return map;
  }, [pageviews, chartDate]);

  // top listas
  const topPages     = useMemo(() => topN(pageviews, 'page'),     [pageviews]);
  const topDevices   = useMemo(() => topN(pageviews, 'device'),   [pageviews]);
  const topBrowsers  = useMemo(() => topN(pageviews, 'browser'),  [pageviews]);
  const topOS        = useMemo(() => topN(pageviews, 'os'),       [pageviews]);
  const topCountries = useMemo(() => topN(pageviews, 'country'),  [pageviews]);
  const topReferrers = useMemo(() => topN(pageviews, 'referrer'), [pageviews]);
  const topClicks    = useMemo(() => topN(clicks,    'label', 10),[clicks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* período */}
      <div style={{ display: 'flex', gap: 8 }}>
        {PERIOD_OPTIONS.map((opt, i) => (
          <button key={opt.label} type="button" onClick={() => setPeriodIdx(i)} style={{
            padding: '5px 14px',
            fontFamily: 'Oswald,sans-serif', fontSize: '.75rem', letterSpacing: '.06em', textTransform: 'uppercase',
            border: '1px solid',
            borderColor: periodIdx === i ? 'rgba(229,201,126,.6)' : 'rgba(255,255,255,.1)',
            background: periodIdx === i ? 'rgba(229,201,126,.12)' : 'transparent',
            color: periodIdx === i ? '#e5c97e' : 'rgba(255,255,255,.4)',
            borderRadius: 5, cursor: 'pointer', transition: 'all .15s',
          }}>
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(139,0,0,.15)', border: '1px solid rgba(139,0,0,.4)', borderRadius: 8, padding: '10px 16px', fontFamily: 'Inter,sans-serif', fontSize: '.78rem', color: '#ffb3b3' }}>
          ⚠ {error}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Pageviews"       value={pageviews.length} loading={loading} />
        <KpiCard label="Sessões únicas"  value={sessions}         loading={loading} />
        <KpiCard label="Páginas distintas" value={pages}          loading={loading} />
        <KpiCard label="Países"          value={countries}        loading={loading} />
      </div>

      {/* gráfico */}
      <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '.58rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)' }}>
            Pageviews — {period.days === 1 ? (chartDate === todayStr ? 'hoje' : chartDate) : `últimos ${period.days} dias`} (por hora)
          </div>
          {period.days === 1 && (
            <input
              type="date"
              value={chartDate}
              max={todayStr}
              onChange={(e) => setChartDate(e.target.value)}
              style={{
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 5,
                color: '#fff',
                fontFamily: 'Inter,sans-serif',
                fontSize: '.72rem',
                padding: '4px 8px',
                colorScheme: 'dark',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
          )}
        </div>
        <LineChart data={hourData} maxY={Math.max(...Object.values(hourData), 1)} />
      </div>

      {/* 4 colunas: páginas, dispositivo, browser, OS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatList title="Páginas"           data={topPages}    loading={loading} color={BAR_COLORS[0]} />
        <StatList title="Dispositivo"       data={topDevices}  loading={loading} color={BAR_COLORS[1]} />
        <StatList title="Browser"           data={topBrowsers} loading={loading} color={BAR_COLORS[2]} />
        <StatList title="Sistema Operacional" data={topOS}     loading={loading} color={BAR_COLORS[3]} />
      </div>

      {/* cliques + países + referrer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* cliques */}
        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '.58rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)' }}>
              Cliques
            </div>
            <span style={{ fontFamily: 'Oswald,sans-serif', fontSize: '.7rem', background: 'rgba(229,201,126,.12)', color: '#e5c97e', border: '1px solid rgba(229,201,126,.25)', borderRadius: 4, padding: '1px 7px' }}>
              {clicks.length} total
            </span>
          </div>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,.2)', fontSize: '.75rem' }}>Carregando…</div>
          ) : topClicks.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,.2)', fontSize: '.75rem' }}>Sem dados de cliques no período.</div>
          ) : (
            topClicks.map(([k, v]) => {
              const max = topClicks[0][1];
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '.72rem', color: 'rgba(255,255,255,.5)', minWidth: 80, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k}</span>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((v / max) * 100)}%`, height: '100%', background: BAR_COLORS[0], borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: 'Oswald,sans-serif', fontSize: '.78rem', color: '#fff', minWidth: 18, textAlign: 'right' }}>{v}</span>
                </div>
              );
            })
          )}
        </div>

        <StatList title="Países"                    data={topCountries} loading={loading} color={BAR_COLORS[4]} />
        <StatList title="Origem do tráfego (referrer)" data={topReferrers} loading={loading} color={BAR_COLORS[1]} />
      </div>

    </div>
  );
}
