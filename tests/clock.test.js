const { chromium } = require('playwright');
const assert = (c, m) => { console.log((c?'ok  - ':'FAIL: ')+m); if(!c) process.exitCode=1; };
(async () => { const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, isMobile:true});
  const p = await ctx.newPage(); await p.route(/fonts\./, r=>r.abort()); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(() => { window.__beeps = 0; const O = window.AudioContext; window.AudioContext = class extends O { createOscillator(){ window.__beeps++; return super.createOscillator(); } }; });
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  await p.tap('.bn-gd'); await p.waitForTimeout(400);
  assert(await p.isVisible('#gd [data-sec="clock"] .gclock'), 'clock visible at top of Game Day (1st half)');
  assert((await p.textContent('#gd .gclock'))==='20:00', 'starts at 20:00');
  await p.tap('#gd [data-act="clockGo"]'); await p.waitForTimeout(1300);
  const t = await p.textContent('#gd .gclock'); assert(t==='19:59'||t==='19:58', 'counts down: '+t);
  assert((await p.textContent('#gdClk')).includes('19:5'), 'header mini-clock shows time');
  // jump to 18 s before first sub (16:40 => elapsed 200)
  await p.evaluate(()=>{ S.clock.h1.acc = (182 - (Date.now()-S.clock.h1.start)/1000)*1000; });
  await p.waitForTimeout(600);
  assert(await p.isVisible('#gd .clk-banner.warn'), '20-second warning banner');
  const b1 = await p.evaluate(()=>__beeps); assert(b1>=2, 'warning beeped ('+b1+' tones)');
  await p.screenshot({path:require('path').join(require('os').tmpdir(), 'gameday-clk-warn.png')});
  await p.evaluate(()=>{ S.clock.h1.acc = (201 - (Date.now()-S.clock.h1.start)/1000)*1000; }); await p.waitForTimeout(600);
  assert(await p.isVisible('#gd .clk-banner.due'), 'SUB NOW banner'); assert(await p.evaluate(()=>document.querySelector('#gd .nextsub').classList.contains('due')), 'next-sub card pulses');
  assert(await p.evaluate(()=>__beeps) >= b1+4, 'sub-due beeped');
  await p.screenshot({path:require('path').join(require('os').tmpdir(), 'gameday-clk-due.png')});
  await p.tap('#gd .clk-banner [data-act="subDone"]'); await p.waitForTimeout(300);
  assert(!(await p.isVisible('#gd .clk-banner.due')), 'banner clears after Sub done');
  assert((await p.textContent('#gd .clk-next')).includes('13:20'), 'next sub now at 13:20');
  // pause + adjust
  await p.tap('#gd [data-act="clockGo"]'); await p.waitForTimeout(150); const a = await p.textContent('#gd .gclock');
  await p.tap('#gd [data-act="clockAdj"][data-d="10"]'); await p.waitForTimeout(150); const bb = await p.textContent('#gd .gclock');
  assert(a!==bb, `+10s adjusts (${a} → ${bb})`);
  // end of half -> half-time
  await p.tap('#gd [data-act="clockGo"]'); await p.evaluate(()=>{ S.block=5; S.clock.h1.acc = (1199.5 - (Date.now()-S.clock.h1.start)/1000)*1000; }); await p.waitForTimeout(1200);
  assert(await p.evaluate(()=>S.phase)==='ht', 'end of 1st half switches to Half-time');
  await p.tap('#gd [data-act="startH2"]'); await p.waitForTimeout(300);
  assert((await p.textContent('#gd .gclock'))==='20:00' && (await p.textContent('#gd [data-act="clockGo"]')).includes('Start 2nd half'), '2nd half clock ready at 20:00');
  await p.tap('#gd [data-act="clockGo"]'); await p.waitForTimeout(300);
  await p.reload(); await p.waitForTimeout(800);
  assert(await p.evaluate(()=>clockRunning('h2')), 'clock keeps running after a refresh');
  console.log(errs.join('|')||'no page errors'); await b.close(); })();
