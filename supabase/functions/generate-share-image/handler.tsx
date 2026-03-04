// @ts-nocheck
import React from 'https://esm.sh/react@18.2.0';
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts';

export default function handler(detection: any) {
  const entry = detection.entry_price;
  const sl = detection.stop_loss_price;
  const tp = detection.take_profit_price;
  const isBullish = detection.direction === 'long' || detection.direction?.toLowerCase() === 'bullish';
  const dirColor = isBullish ? '#22c55e' : '#ef4444';
  const displayInstrument = detection.instrument.replace('-USD', '').replace('=X', '').replace('=F', '');
  const displayPattern = detection.pattern_name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const grade = detection.quality_score?.toUpperCase() ?? '?';
  const rr = Number(detection.risk_reward_ratio).toFixed(1);
  const tf = detection.timeframe?.toUpperCase() ?? '';

  const formatPrice = (p: number) => p >= 1000 ? p.toFixed(2) : p >= 1 ? p.toPrecision(5) : p.toPrecision(4);

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%)',
        fontFamily: 'sans-serif', color: 'white', position: 'relative',
      }}>
        {/* Orange accent bar */}
        <div style={{ width: '100%', height: '4px', background: 'linear-gradient(90deg, #ff6633, #ff8c00)' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 40px 0', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1px' }}>{displayInstrument}</span>
              <span style={{ fontSize: 22, color: '#64748b', marginLeft: 12 }}>{tf}</span>
            </div>
            <span style={{ fontSize: 18, color: '#94a3b8', marginTop: 4 }}>{displayPattern}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{
              background: dirColor + '30', borderRadius: 24, padding: '10px 28px',
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ color: dirColor, fontSize: 20, fontWeight: 800 }}>
                {isBullish ? '▲ BULLISH' : '▼ BEARISH'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: 8 }}>
              <div style={{ background: '#3b82f640', borderRadius: 16, padding: '6px 18px' }}>
                <span style={{ color: '#60a5fa', fontSize: 16, fontWeight: 700 }}>{grade}</span>
              </div>
              <div style={{ background: '#8b5cf640', borderRadius: 16, padding: '6px 18px' }}>
                <span style={{ color: '#a78bfa', fontSize: 16, fontWeight: 700 }}>R:R {rr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade levels - large center display */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', flex: 1, gap: '16px', padding: '0 60px',
        }}>
          {/* TP */}
          <div style={{
            display: 'flex', alignItems: 'center', width: '100%',
            borderBottom: '2px dashed #22c55e',
            paddingBottom: 12,
          }}>
            <div style={{
              background: '#22c55e', borderRadius: 6, padding: '8px 20px',
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>TP {formatPrice(tp)}</span>
            </div>
            <div style={{ flex: 1, height: '2px', background: '#22c55e', opacity: 0.3, marginLeft: 16 }} />
          </div>

          {/* Entry */}
          <div style={{
            display: 'flex', alignItems: 'center', width: '100%',
            borderBottom: '2px solid #3b82f6',
            paddingBottom: 12,
          }}>
            <div style={{
              background: '#3b82f6', borderRadius: 6, padding: '8px 20px',
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>ENTRY {formatPrice(entry)}</span>
            </div>
            <div style={{ flex: 1, height: '2px', background: '#3b82f6', opacity: 0.3, marginLeft: 16 }} />
          </div>

          {/* SL */}
          <div style={{
            display: 'flex', alignItems: 'center', width: '100%',
            borderBottom: '2px dashed #ef4444',
            paddingBottom: 12,
          }}>
            <div style={{
              background: '#ef4444', borderRadius: 6, padding: '8px 20px',
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>SL {formatPrice(sl)}</span>
            </div>
            <div style={{ flex: 1, height: '2px', background: '#ef4444', opacity: 0.3, marginLeft: 16 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px', height: 54, background: 'rgba(10,14,20,0.9)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#ff6633', fontSize: 20, fontWeight: 800 }}>ChartingPath</span>
            <span style={{ color: '#64748b', fontSize: 14 }}>chartingpath.com · Live Pattern Detection</span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>
            Entry: {formatPrice(entry)} | SL: {formatPrice(sl)} | TP: {formatPrice(tp)}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
