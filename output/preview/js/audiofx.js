/* v5.13 — AudioFX 模块（剧情对话游戏音效）
   供 plot-runner.html / game-3d.html 共用
   API: AudioFX.sfx.click/ping/ending/chapter/end, AudioFX.bgm.play(key), AudioFX.ambient.start(key)
*/
(function () {
  if (window.AudioFX) return;

  let acx = null, masterGain = null;
  const ensureCtx = () => {
    if (acx) return acx;
    try {
      acx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = acx.createGain();
      masterGain.gain.value = 0.30;
      masterGain.connect(acx.destination);
    } catch (e) { acx = null; }
    return acx;
  };

  // ====== SFX ======
  function sfxClick() {
    const ctx = ensureCtx(); if (!ctx) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.16, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.connect(g); g.connect(masterGain);
    o.start(); o.stop(ctx.currentTime + 0.13);
  }

  function sfxPing(delta) {
    const ctx = ensureCtx(); if (!ctx) return;
    const dir = delta >= 0 ? 1 : -1;
    const f0 = dir > 0 ? 660 : 220;
    const f1 = dir > 0 ? 880 : 175;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(f1, ctx.currentTime + 0.18);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.30);
    o.connect(g); g.connect(masterGain);
    o.start(); o.stop(ctx.currentTime + 0.32);
  }

  function sfxEnding(rarity) {
    const ctx = ensureCtx(); if (!ctx) return;
    const seq = rarity === 'legendary' ? [523.25, 659.25, 783.99, 1046.5]
              : rarity === 'epic'      ? [440, 554.37, 659.25]
              :                           [349.23, 440];
    seq.forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      g.gain.linearRampToValueAtTime(0.22, ctx.currentTime + i * 0.15 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.55);
      o.connect(g); g.connect(masterGain);
      o.start(ctx.currentTime + i * 0.15);
      o.stop(ctx.currentTime + i * 0.15 + 0.6);
    });
  }

  function sfxChapter() {
    const ctx = ensureCtx(); if (!ctx) return;
    [440, 660].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.18 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.30);
      o.connect(g); g.connect(masterGain);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.32);
    });
  }

  function sfxEnd() {
    return sfxEnding('common');
  }

  // ====== BGM（程序化极简版，跟随剧情节点） ======
  let bgmNodes = [], bgmInterval = null, currentBgmKey = null;
  const SCALES = {
    pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
    palace:     [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46, 783.99],
    noir:       [174.61, 220.00, 261.63, 311.13, 349.23, 415.30, 466.16, 523.25],
    elven:      [392.00, 440.00, 493.88, 587.33, 659.25, 739.99, 830.61, 987.77],
    scifi:      [261.63, 329.63, 392.00, 466.16, 523.25, 622.25, 698.46, 783.99]
  };
  const SCENE_SCALE = {
    pavilion_night: 'pentatonic',
    classroom_sunny: 'pentatonic',
    neon_street: 'pentatonic',
    livingroom_warm: 'pentatonic',
    xianxia_peak: 'pentatonic',
    palace_tang: 'palace',
    study_republic: 'noir',
    elf_forest: 'elven',
    starship_bridge: 'scifi',
    cafe_dusk: 'noir',
    graveyard_night: 'noir',
    battle_field: 'pentatonic',
    magic_academy: 'pentatonic'
  };
  function stopBGM() {
    for (const n of bgmNodes) {
      try { if (n.stop) n.stop(); if (n.disconnect) n.disconnect(); } catch (e) {}
    }
    bgmNodes = [];
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
  }
  function scheduleNote(freq, t0, dur, gain, type = 'sine', vol = 0.10) {
    const ctx = ensureCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(vol, t0 + 0.04);
    env.gain.linearRampToValueAtTime(vol * 0.5, t0 + dur * 0.6);
    env.gain.linearRampToValueAtTime(0, t0 + dur);
    osc.connect(env); env.connect(gain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    bgmNodes.push(osc);
  }
  function switchBGM(sceneKey) {
    ensureCtx(); if (!acx) return;
    if (currentBgmKey === sceneKey) return;
    currentBgmKey = sceneKey;
    stopBGM();
    const scale = SCALES[SCENE_SCALE[sceneKey]] || SCALES.pentatonic;
    const bpm = sceneKey === 'neon_street' ? 112
              : sceneKey === 'elf_forest' ? 78
              : sceneKey === 'starship_bridge' ? 96
              : sceneKey === 'study_republic' ? 70
              : sceneKey === 'pavilion_night' ? 84
              : 86;
    const beat = 60 / bpm;
    let melody = [];
    for (let i = 0; i < 8; i++) melody.push(scale[Math.floor(Math.random() * scale.length)]);
    let bar = 0;
    function scheduleBar() {
      if (!acx) return;
      const tNow = acx.currentTime + 0.05;
      const bGain = acx.createGain();
      bGain.gain.value = 0.08;
      bGain.connect(masterGain);
      for (let i = 0; i < 4; i++) {
        const t = tNow + i * beat;
        const f = melody[(bar * 4 + i) % melody.length];
        scheduleNote(f, t, beat * 0.9, bGain, 'sine', 0.10);
        if (i === 0 || i === 2) scheduleNote(scale[0], t, beat * 1.8, bGain, 'triangle', 0.04);
      }
      bar++;
    }
    scheduleBar();
    bgmInterval = setInterval(scheduleBar, beat * 4 * 1000);
  }

  // ====== Ambient（氛围音） ======
  let ambientNodes = [];
  function startAmbient(sceneKey) {
    ensureCtx(); if (!acx) return;
    stopAmbient();
    if (sceneKey === 'pavilion_night' || sceneKey === 'graveyard_night') {
      // 风声 + 雨声
      const noise = acx.createBufferSource();
      const buf = acx.createBuffer(1, acx.sampleRate * 2, acx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      noise.buffer = buf; noise.loop = true;
      const gain = acx.createGain(); gain.gain.value = 0.05;
      const filter = acx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600;
      noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
      noise.start();
      ambientNodes.push(noise);
    } else if (sceneKey === 'elf_forest') {
      // 鸟鸣
      const o = acx.createOscillator();
      const g = acx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.04, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.5);
      o.connect(g); g.connect(masterGain);
      o.start(); o.stop(ctx.currentTime + 0.6);
      ambientNodes.push(o);
    } else if (sceneKey === 'starship_bridge' || sceneKey === 'magic_academy') {
      // 极低频嗡鸣
      const o = acx.createOscillator();
      const g = acx.createGain();
      o.type = 'sine'; o.frequency.value = 80;
      g.gain.value = 0.04;
      o.connect(g); g.connect(masterGain);
      o.start();
      ambientNodes.push(o);
    }
  }
  function stopAmbient() {
    for (const n of ambientNodes) { try { n.stop(); n.disconnect(); } catch (e) {} }
    ambientNodes = [];
  }

  window.AudioFX = {
    sfx: { click: sfxClick, ping: sfxPing, ending: sfxEnding, chapter: sfxChapter, end: sfxEnd },
    bgm: { play: switchBGM, stop: stopBGM },
    ambient: { start: startAmbient, stop: stopAmbient },
    switchBGM, startAmbient, stopAmbient
  };
  console.log('[v5.13] audiofx 加载完成');
})();