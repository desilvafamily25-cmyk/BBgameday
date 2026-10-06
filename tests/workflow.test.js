const { chromium } = require('playwright');
const assert = (c, m) => { if(!c){ console.log('FAIL: '+m); process.exitCode = 1; } else console.log('ok  - '+m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true, isMobile:true });
  const p = await ctx.newPage(); await p.route(/fonts\./, r=>r.abort());
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  const swipe = async (x1,x2,y=450) => { const steps=8;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y}]});
    for(let i=1;i<=steps;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/steps,y:y+i}]}); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(450); };
  const S = () => p.evaluate(() => JSON.parse(localStorage.getItem('u12gameday.v1')));
  const shot = n => p.screenshot({path:require('path').join(require('os').tmpdir(), `gameday-${n}.png`)});
  await p.goto('file://' + require('path').resolve(__dirname, '../index.html')); await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForTimeout(400);

  // 1-2 enter names
  await p.tap('.bn[data-act="more"]'); await p.waitForTimeout(350); await p.tap('#sh-more [data-go="4"]'); await p.waitForTimeout(450);
  const names=['Ava','Mia','Zara','Chloe','Isla','Ruby'];
  for(let i=0;i<6;i++){ await p.fill(`[data-name="${i}"]`, names[i]); }
  await p.waitForTimeout(300);
  assert((await S()).names.join()===names.join(), 'six names saved to localStorage');
  await shot('02-names');

  // swipe navigation 4 -> 5 -> 4
  await swipe(330, 60); assert(await p.evaluate(()=>cur)===4, 'swipe left goes to page 5');
  assert(await p.textContent('#tbNum')==='5 / 20', 'header shows 5 / 20');
  await swipe(60, 330); assert(await p.evaluate(()=>cur)===3, 'swipe right goes back to page 4');
  // vertical drag must not change page
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:600}]});
  for(let i=1;i<=8;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200+i*3,y:600-i*40}]}); }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(400);
  assert(await p.evaluate(()=>cur)===3, 'vertical scroll gesture does not change page');
  await p.keyboard.press('ArrowRight'); assert(await p.evaluate(()=>cur)===4, 'keyboard arrow navigation');

  // 3 start game-day
  await p.tap('.bn-gd'); await p.waitForTimeout(450);
  assert(await p.isVisible('#gd.on'), 'Game-Day Mode opens');
  // 4 starting five
  const on = await p.$$eval('#gd [data-w="lineup"] .oncourt .nm', e=>e.map(x=>x.textContent));
  const rest = await p.textContent('#gd [data-w="lineup"] .benchrow .nm');
  assert(on.join()==='Ava,Mia,Zara,Chloe,Isla' && rest==='Ruby', 'starting five Ava–Isla, Ruby resting');
  assert((await p.textContent('#gd .nextsub')).includes('Ruby') && (await p.textContent('#gd .swap .out')).includes('Zara'), 'next sub: Ruby on for Zara');
  await shot('04-gd-start');
  // 5 three subs
  for(let i=0;i<3;i++){ await p.tap('#gd [data-act="subDone"]'); await p.waitForTimeout(200); }
  let st = await S(); assert(st.block===3, 'three subs completed (block 4 of 6)');
  assert((await p.textContent('#gd [data-w="lineup"] .benchrow .nm'))==='Chloe', 'Chloe now resting');
  await p.tap('#gd [data-act="subUndo"]'); await p.waitForTimeout(250); assert((await S()).block===2, 'undo works'); await p.tap('#gd [data-act="subDone"]');
  await shot('05-gd-subs');
  // 6 timeouts
  await p.tap('#gd [data-act="toUse"][data-h="1"]'); await p.waitForTimeout(400);
  assert(await p.isVisible('#sh-modal.on'), 'timeout script opens'); assert((await S()).to.h1===1, '1st-half timeouts 2 → 1');
  await shot('06-timeout');
  await p.tap('#sh-modal [data-act="closeSheet"]'); await p.waitForTimeout(350);
  // 7 defensive tactic
  await p.tap('#gd .gd-bar [data-t="defence"]'); await p.waitForTimeout(400);
  assert((await p.textContent('#shx-t')).includes('Defence'), 'defence tactic opens over Game Day');
  await p.tap('#sh-modal .dg [data-c="nx"]'); await p.waitForTimeout(1500); await shot('07-defence');
  await p.tap('#sh-modal [data-act="openChapter"]'); await p.waitForTimeout(500);
  assert(await p.evaluate(()=>cur)===9 && !(await p.isVisible('#gd.on')), 'jumped to chapter 10 (Defence)');
  assert(await p.isVisible('#backpill'), '"Back to Game Day" pill shown');
  // 8 back to GD
  await p.tap('#backpill'); await p.waitForTimeout(450); assert(await p.isVisible('#gd.on'), 'returned to Game Day');
  // 9 note
  await p.fill('#gd [data-sec="notes"] textarea', '#11 drives left every time'); await p.tap('#gd [data-sec="notes"] [data-act="addNote"]');
  await p.waitForTimeout(200); assert((await S()).log.length===1, 'quick note saved');
  await p.tap('#gd [data-act="foul"][data-i="1"][data-d="1"]'); await p.tap('#gd [data-act="tired"][data-i="2"]'); await p.waitForTimeout(250);
  st = await S(); assert(st.fouls[1]===1 && st.tired[2]===1, 'foul + fatigue tracked');
  // 10 half-time
  await p.tap('#gd [data-ph="ht"]'); await p.waitForTimeout(300);
  await p.tap('#gd [data-sec="halftime"] [data-act="htGo"]'); await p.waitForTimeout(1300);
  assert(await p.textContent('#gd [data-sec="halftime"] .timer') !== '2:00', 'half-time timer counting');
  await p.fill('#gd [data-sec="halftime"] textarea', '1. BOX every shot\n2. SPREAD'); await p.waitForTimeout(200);
  await shot('10-halftime');
  await p.tap('#gd [data-act="startH2"]'); await p.waitForTimeout(300);
  st = await S(); assert(st.block===6 && st.phase==='h2' && st.notes.adjust.includes('BOX'), 'second half started, plan saved');
  assert((await p.textContent('#gd [data-w="timeouts"] .to-h.cur')).includes('2 left'), '2nd half shows 2 timeouts');
  // 11 diagram review in course
  await p.tap('#gd [data-act="gdClose"]'); await p.waitForTimeout(400);
  await p.evaluate(()=>go(6)); await p.waitForTimeout(400);
  for(let i=0;i<4;i++){ await p.tap('.page[data-p="7"] [data-c="nx"]'); await p.waitForTimeout(1400); }
  assert((await p.textContent('.page[data-p="7"] .dg-cap')).includes('REPLACE'), 'pass-cut-replace stepped to REPLACE');
  await p.evaluate(()=>document.querySelector('.page[data-p="7"]').scrollTop=330); await p.waitForTimeout(200); await shot('11-pcr');
  // 12 dashboard
  await p.tap('.bn[data-act="more"]'); await p.waitForTimeout(350); await p.tap('#sh-more [data-go="20"]'); await p.waitForTimeout(450);
  assert(await p.evaluate(()=>cur)===19, 'dashboard opened from quick access');
  assert((await p.textContent('.page[data-p="20"] [data-w="lineup"] .benchrow .nm'))==='Mia', 'dashboard shows 2nd-half lineup (Mia resting)');
  await shot('12-dashboard');
  await p.tap('.page[data-p="20"] [data-act="subDone"]'); await p.waitForTimeout(200);
  // 13 reload
  await p.reload(); await p.waitForTimeout(600);
  st = await S();
  assert(st.names[0]==='Ava' && st.block===7 && st.to.h1===1 && st.log.length===1 && st.fouls[1]===1 && st.phase==='h2', 'state persists after refresh');
  assert(await p.evaluate(()=>cur)===19, 'returns to last page (dashboard) after refresh');
  assert((await p.inputValue('[data-name="0"]'))==='Ava', 'name input restored');
  await p.tap('.bn-gd'); await p.waitForTimeout(400);
  assert((await p.textContent('#gdOpp'))==='' , 'opponent empty (not set)');
  await p.tap('#gd [data-act="notes"]'); await p.waitForTimeout(350); await p.fill('#n-opponent','Northside Hawks'); await p.waitForTimeout(200);
  assert((await p.textContent('#gdOpp'))==='vs Northside Hawks', 'opponent shows in Game Day header');
  await p.tap('#sh-notes [data-act="closeSheet"]'); await p.waitForTimeout(300);
  await p.tap('#gd [data-ph="close"]'); await p.waitForTimeout(300); await shot('13-close');
  await p.tap('#gd [data-act="fix"]'); await p.waitForTimeout(350); await p.tap('#sh-modal .dq > button'); await p.waitForTimeout(200); await shot('14-fix');
  console.log(errs.length ? 'ERRORS: '+errs.join(' | ') : 'no page errors');
  await b.close();
})();
