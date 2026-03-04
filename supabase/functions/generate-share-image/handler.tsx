// @ts-nocheck
import React from 'https://esm.sh/react@18.2.0';
import satori from 'https://esm.sh/satori@0.10.11/wasm';
import initSatori, { init as initSatoriWasm } from 'https://esm.sh/satori@0.10.11/wasm';
import initYoga from 'https://esm.sh/yoga-wasm-web@0.3.3';
import { Resvg, initWasm as initResvgWasm } from 'https://esm.sh/@resvg/resvg-wasm@2.6.2';

let initialized = false;

async function initAll() {
  if (initialized) return;
  // Init yoga
  const yogaWasm = await fetch('https://unpkg.com/yoga-wasm-web@0.3.3/dist/yoga.wasm');
  const yoga = await initYoga(await yogaWasm.arrayBuffer());
  initSatoriWasm(yoga);
  
  // Init resvg
  const resvgWasm = await fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm');
  await initResvgWasm(await resvgWasm.arrayBuffer());
  
  initialized = true;
}

export default async function handler(detection: any, fontData: ArrayBuffer): Promise<Uint8Array> {
  await initAll();
  
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

  const element = {
    type: 'div',
    props: {
      style: {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%)',
        fontFamily: 'Inter', color: 'white',
      },
      children: [
        // Orange accent bar
        { type: 'div', props: { style: { width: '100%', height: 4, background: 'linear-gradient(90deg, #ff6633, #ff8c00)' } } },
        // Header
        {
          type: 'div', props: {
            style: { display: 'flex', justifyContent: 'space-between', padding: '24px 40px 0', alignItems: 'flex-start' },
            children: [
              {
                type: 'div', props: {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    {
                      type: 'div', props: {
                        style: { display: 'flex', alignItems: 'baseline' },
                        children: [
                          { type: 'span', props: { style: { fontSize: 48, fontWeight: 800 }, children: displayInstrument } },
                          { type: 'span', props: { style: { fontSize: 22, color: '#64748b', marginLeft: 12 }, children: tf } },
                        ]
                      }
                    },
                    { type: 'span', props: { style: { fontSize: 20, color: '#94a3b8', marginTop: 4 }, children: displayPattern } },
                  ]
                }
              },
              {
                type: 'div', props: {
                  style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
                  children: [
                    {
                      type: 'div', props: {
                        style: { background: dirColor + '30', borderRadius: 24, padding: '10px 28px', display: 'flex', alignItems: 'center' },
                        children: [
                          { type: 'span', props: { style: { color: dirColor, fontSize: 22, fontWeight: 800 }, children: isBullish ? '▲ BULLISH' : '▼ BEARISH' } }
                        ]
                      }
                    },
                    {
                      type: 'div', props: {
                        style: { display: 'flex', marginTop: 10 },
                        children: [
                          { type: 'div', props: { style: { background: '#3b82f640', borderRadius: 16, padding: '6px 18px', marginRight: 8, display: 'flex' }, children: [{ type: 'span', props: { style: { color: '#60a5fa', fontSize: 16, fontWeight: 700 }, children: grade } }] } },
                          { type: 'div', props: { style: { background: '#8b5cf640', borderRadius: 16, padding: '6px 18px', display: 'flex' }, children: [{ type: 'span', props: { style: { color: '#a78bfa', fontSize: 16, fontWeight: 700 }, children: `R:R ${rr}` } }] } },
                        ]
                      }
                    },
                  ]
                }
              },
            ]
          }
        },
        // Trade levels
        {
          type: 'div', props: {
            style: { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', padding: '0 60px', gap: 20 },
            children: [
              makeLevelRow('TP', formatPrice(tp), '#22c55e'),
              makeLevelRow('ENTRY', formatPrice(entry), '#3b82f6'),
              makeLevelRow('SL', formatPrice(sl), '#ef4444'),
            ]
          }
        },
        // Footer
        {
          type: 'div', props: {
            style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 54, background: 'rgba(10,14,20,0.9)' },
            children: [
              { type: 'div', props: { style: { display: 'flex', alignItems: 'center' }, children: [
                { type: 'span', props: { style: { color: '#ff6633', fontSize: 20, fontWeight: 800 }, children: 'ChartingPath' } },
                { type: 'span', props: { style: { color: '#64748b', fontSize: 14, marginLeft: 16 }, children: 'chartingpath.com' } },
              ] } },
              { type: 'span', props: { style: { color: '#94a3b8', fontSize: 14, fontWeight: 600 }, children: `Entry: ${formatPrice(entry)} | SL: ${formatPrice(sl)} | TP: ${formatPrice(tp)}` } },
            ]
          }
        },
      ]
    }
  };

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fontData, weight: 400, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render();
  return png.asPng();
}

function makeLevelRow(label: string, price: string, color: string) {
  return {
    type: 'div', props: {
      style: { display: 'flex', alignItems: 'center', width: '100%', borderBottom: `2px ${label === 'ENTRY' ? 'solid' : 'dashed'} ${color}`, paddingBottom: 12 },
      children: [
        {
          type: 'div', props: {
            style: { background: color, borderRadius: 6, padding: '10px 24px', display: 'flex', alignItems: 'center' },
            children: [{ type: 'span', props: { style: { color: 'white', fontSize: 20, fontWeight: 700 }, children: `${label} ${price}` } }]
          }
        },
        { type: 'div', props: { style: { flex: 1, height: 2, background: color, opacity: 0.3, marginLeft: 16 } } },
      ]
    }
  };
}
