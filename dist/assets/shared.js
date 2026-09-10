/* ═══════════════════════════════════════════════════════════
   BuffMechanics · shared.js
   Common runtime utilities: audio, persistent storage, UI helpers.
   Exposes globals: Snd, Store, BM.
   ═══════════════════════════════════════════════════════════ */
(function(global){
    'use strict';

    /* ── 1 · Snd · unified Web Audio sound module ──────────── */
    const Snd = {
        on: true,
        ctx: null,
        masterGain: null,

        init(){
            if(!this.ctx){
                try{
                    this.ctx = new (global.AudioContext || global.webkitAudioContext)();
                    this.masterGain = this.ctx.createGain();
                    const v = global.Store ? Store.getGlobal('vol') : null;
                    this.masterGain.gain.value = (typeof v === 'number') ? v : .7;
                    // masterGain → ctx.destination. This is the ONLY connection
                    // for masterGain. Everyone else feeds into masterGain via
                    // _out(). If this connection ever breaks (it shouldn't,
                    // AudioNode connections are permanent until disconnect),
                    // the whole audio system goes silent.
                    this.masterGain.connect(this.ctx.destination);
                    // Sanity check at init time — masterGain MUST have exactly
                    // one output (to destination). If not, log loudly so we
                    // can debug. Production browsers will print this once
                    // per page load; it's worth it for diagnosing silent fails.
                    if(this.masterGain.numberOfOutputs !== 1){
                        console.warn('[Snd] masterGain.numberOfOutputs is',
                                     this.masterGain.numberOfOutputs,
                                     '— expected 1. Audio may be silent.');
                    }
                }catch(e){
                    console.warn('[Snd] Audio init failed:', e.message);
                    return;
                }
            }
            if(this.ctx.state === 'suspended') this.ctx.resume();
        },

        // Always resume before playing — handles bfcache returns, tab
        // backgrounding, and other states where the ctx was suspended.
        _wake(){
            if(!this.ctx) return false;
            if(this.ctx.state === 'suspended') this.ctx.resume();
            return true;
        },

        // Where all oscillators connect (master gain or fallback to destination)
        _out(){ return this.masterGain || (this.ctx && this.ctx.destination); },

        // Set master volume (0..1). Persisted globally.
        setVolume(v){
            v = Math.max(0, Math.min(1, v));
            if(this.masterGain && this.ctx){
                this.masterGain.gain.linearRampToValueAtTime(v, this.ctx.currentTime + .04);
            }
            if(global.Store) Store.setGlobal('vol', v);
        },

        getVolume(){
            const v = global.Store ? Store.getGlobal('vol') : null;
            return (typeof v === 'number') ? v : .7;
        },

        // Has the audio context been successfully created? Used by the home
        // to decide whether to show the "click to enable audio" hint.
        ready(){ return !!this.ctx; },

        toggle(btnEl){
            this.on = !this.on;
            const btn = btnEl || document.getElementById('snd-btn');
            if(btn) btn.textContent = this.on ? '♪ ON' : '♪ OFF';
            // Persist so preference survives reloads and module switches
            if(global.Store) Store.setGlobal('snd', this.on);
        },

        // internal helper
        _play(type, freq1, freq2, dur, gain){
            if(!this.on || !this.ctx) return;
            this._wake();
            const t = this.ctx.currentTime;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq1, t);
            if(freq2 !== null){
                if(type === 'sine') o.frequency.exponentialRampToValueAtTime(freq2, t + dur);
                else o.frequency.linearRampToValueAtTime(freq2, t + dur);
            }
            g.gain.setValueAtTime(gain, t);
            if(type === 'sine') g.gain.exponentialRampToValueAtTime(.001, t + dur);
            else g.gain.linearRampToValueAtTime(0, t + dur);
            o.connect(g); g.connect(this._out());
            o.start(); o.stop(t + dur + .01);
        },

        // Success / hit — pitch 0..N raises frequency (streak combo)
        hit(pitch = 0){ this._play('sine', 700 + pitch * 35, 1200 + pitch * 35, .07, .07); },

        // Error / miss
        miss(){ this._play('sawtooth', 140, 80, .1, .05); },

        // Countdown / warning
        warn(){ this._play('sine', 440, 440, .08, .04); },

        // Reward / life gained — 3-note arpeggio
        life(){
            if(!this.on || !this.ctx) return;
            this._wake();
            const t = this.ctx.currentTime;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(523, t);
            o.frequency.setValueAtTime(659, t + .1);
            o.frequency.setValueAtTime(784, t + .2);
            g.gain.setValueAtTime(.06, t);
            g.gain.linearRampToValueAtTime(0, t + .3);
            o.connect(g); g.connect(this._out());
            o.start(); o.stop(t + .32);
        },

        // Reaction-time GO signal (high, short)
        go(){ this._play('sine', 880, 880, .12, .08); },

        // Reaction-time fail (low sawtooth)
        fail(){ this._play('sawtooth', 160, 80, .2, .06); },

        // Element appear (neutral click)
        appear(){ this._play('sine', 440, 660, .06, .04); },

        // Perfect / special (high pitch, longer)
        perfect(){ this._play('sine', 1000, 1600, .12, .07); },

        // ── UI feedback sounds (used on home + nav elements) ──
        //
        // Both `tick` and `launch` synthesize a wood-block impact:
        //   · sine body with quick downsweep (the "hollow" pitch)
        //   · triangle harmonic ~3x for the woody timbre
        //   · short bandpassed noise burst for the strike attack
        // Pass an optional `freq` to give each surface its own tone —
        // e.g. one frequency per module card on the home grid.

        // Light hover tap. ~70ms total. Default freq used when no tone given.
        // NOTE: hover events are NOT valid user gestures for creating an
        // AudioContext in any browser. So if ctx hasn't been created yet
        // (no click/keydown happened on this page), we silently no-op.
        // The home shows a hint badge until the user makes a real gesture.
        tick(freq){
            if(!this.on || !this.ctx) return;
            this._wake();
            const f = (freq || 1400) * (1 + (Math.random() - .5) * .015);
            const t = this.ctx.currentTime;
            const ctx = this.ctx;

            // Body — sine fundamental with pitch droop
            const o1 = ctx.createOscillator();
            const g1 = ctx.createGain();
            o1.type = 'sine';
            o1.frequency.setValueAtTime(f, t);
            o1.frequency.exponentialRampToValueAtTime(f * .88, t + .04);
            g1.gain.setValueAtTime(0, t);
            g1.gain.linearRampToValueAtTime(.06, t + .002);
            g1.gain.exponentialRampToValueAtTime(.001, t + .06);
            o1.connect(g1); g1.connect(this._out());
            o1.start(t); o1.stop(t + .08);

            // Harmonic — triangle at ~3f for the woody character
            const o2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            o2.type = 'triangle';
            o2.frequency.setValueAtTime(f * 2.97, t);
            o2.frequency.exponentialRampToValueAtTime(f * 2.5, t + .03);
            g2.gain.setValueAtTime(0, t);
            g2.gain.linearRampToValueAtTime(.02, t + .002);
            g2.gain.exponentialRampToValueAtTime(.001, t + .04);
            o2.connect(g2); g2.connect(this._out());
            o2.start(t); o2.stop(t + .05);

            // Attack — short filtered noise burst (the "strike").
            // Tuned conservatively: low gain, short duration, narrow bandpass.
            // Gives just enough percussive bite without the "white noise hiss"
            // that hover-driven repeats can amplify. Adjust `ng.gain` (.018)
            // to taste — lower = more like a musical tone, higher = more like
            // a percussion hit.
            const bufSize = Math.floor(ctx.sampleRate * .005);
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for(let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass'; bp.frequency.value = f * 3.5; bp.Q.value = 3.5;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(.018, t);
            ng.gain.exponentialRampToValueAtTime(.001, t + .008);
            noise.connect(bp); bp.connect(ng); ng.connect(this._out());
            noise.start(t); noise.stop(t + .01);
        },

        // Heavier wood strike — same instrument as tick but harder hit,
        // one octave lower. ~200ms total ring-out.
        // Safe to self-init here because `launch` is only called from click
        // handlers, which are valid user gestures.
        launch(freq){
            if(!this.on) return;
            if(!this.ctx) this.init();
            if(!this.ctx) return;
            this._wake();
            const fLow = (freq || 440) * .5;
            const t = this.ctx.currentTime;
            const ctx = this.ctx;

            // Low body — the thump
            const o1 = ctx.createOscillator();
            const g1 = ctx.createGain();
            o1.type = 'sine';
            o1.frequency.setValueAtTime(fLow, t);
            o1.frequency.exponentialRampToValueAtTime(fLow * .8, t + .12);
            g1.gain.setValueAtTime(0, t);
            g1.gain.linearRampToValueAtTime(.11, t + .002);
            g1.gain.exponentialRampToValueAtTime(.001, t + .18);
            o1.connect(g1); g1.connect(this._out());
            o1.start(t); o1.stop(t + .2);

            // Mid harmonic — body fullness
            const o2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            o2.type = 'triangle';
            o2.frequency.setValueAtTime(fLow * 2.8, t);
            o2.frequency.exponentialRampToValueAtTime(fLow * 2.3, t + .08);
            g2.gain.setValueAtTime(0, t);
            g2.gain.linearRampToValueAtTime(.04, t + .002);
            g2.gain.exponentialRampToValueAtTime(.001, t + .12);
            o2.connect(g2); g2.connect(this._out());
            o2.start(t); o2.stop(t + .14);

            // Attack — noise burst proportionally heavier than tick (commit
            // sound needs more weight), but tightened to avoid hiss.
            const bufSize = Math.floor(ctx.sampleRate * .008);
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for(let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass'; bp.frequency.value = fLow * 5; bp.Q.value = 3;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(.035, t);
            ng.gain.exponentialRampToValueAtTime(.001, t + .015);
            noise.connect(bp); bp.connect(ng); ng.connect(this._out());
            noise.start(t); noise.stop(t + .018);
        },

        // Dry gunshot — three-layer synthesis:
        //   1. Click   — very fast high-Q noise burst (1-2ms, the percussor strike)
        //   2. Body    — bandpass noise with exponential decay (~25ms, the report)
        //   3. Tail    — brief residual click (~8ms, the bullet snap)
        //
        // Lower freq value → bigger gun (rifle/shotgun), higher → smaller (pistol).
        // Default 500 Hz sits in "compact pistol" range.
        //
        // Not used automatically anywhere. Modules opt in by calling Snd.snap()
        // where it fits thematically (aim, flicking, typing, etc).
        snap(freq){
            if(!this.on) return;
            if(!this.ctx) this.init();
            if(!this.ctx) return;
            this._wake();
            const ctx = this.ctx;
            const t = ctx.currentTime + .001;
            const f = freq || 500;

            // ── 1. Click (initial transient) ──
            const clickLen = Math.floor(ctx.sampleRate * .002);
            const clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate);
            const cd = clickBuf.getChannelData(0);
            for(let i = 0; i < clickLen; i++) cd[i] = Math.random() * 2 - 1;
            const click = ctx.createBufferSource();
            click.buffer = clickBuf;
            const clickHp = ctx.createBiquadFilter();
            clickHp.type = 'highpass'; clickHp.frequency.value = 4000;
            const clickG = ctx.createGain();
            clickG.gain.setValueAtTime(.08, t);
            clickG.gain.exponentialRampToValueAtTime(.001, t + .003);
            click.connect(clickHp); clickHp.connect(clickG); clickG.connect(this._out());
            click.start(t); click.stop(t + .004);

            // ── 2. Body (the actual report) ──
            const bodyLen = Math.floor(ctx.sampleRate * .03);
            const bodyBuf = ctx.createBuffer(1, bodyLen, ctx.sampleRate);
            const bd = bodyBuf.getChannelData(0);
            for(let i = 0; i < bodyLen; i++) bd[i] = Math.random() * 2 - 1;
            const body = ctx.createBufferSource();
            body.buffer = bodyBuf;
            // Bandpass around the gun's "character" frequency
            const bodyBp = ctx.createBiquadFilter();
            bodyBp.type = 'bandpass';
            bodyBp.frequency.value = f;
            bodyBp.Q.value = 1.8;
            // Lowpass shelf — cuts above 3000Hz to keep it punchy not screechy
            const bodyLp = ctx.createBiquadFilter();
            bodyLp.type = 'lowpass';
            bodyLp.frequency.value = 3000;
            const bodyG = ctx.createGain();
            bodyG.gain.setValueAtTime(.18, t + .001);
            bodyG.gain.exponentialRampToValueAtTime(.001, t + .028);
            body.connect(bodyBp); bodyBp.connect(bodyLp); bodyLp.connect(bodyG);
            bodyG.connect(this._out());
            body.start(t + .001); body.stop(t + .032);

            // ── 3. Tail (residual snap) ──
            const tailLen = Math.floor(ctx.sampleRate * .008);
            const tailBuf = ctx.createBuffer(1, tailLen, ctx.sampleRate);
            const td = tailBuf.getChannelData(0);
            for(let i = 0; i < tailLen; i++) td[i] = Math.random() * 2 - 1;
            const tail = ctx.createBufferSource();
            tail.buffer = tailBuf;
            const tailHp = ctx.createBiquadFilter();
            tailHp.type = 'highpass'; tailHp.frequency.value = 2000;
            const tailG = ctx.createGain();
            tailG.gain.setValueAtTime(.04, t + .005);
            tailG.gain.exponentialRampToValueAtTime(.001, t + .012);
            tail.connect(tailHp); tailHp.connect(tailG); tailG.connect(this._out());
            tail.start(t + .005); tail.stop(t + .014);
        }
    };

    /* ── 2 · Store · persistent storage with graceful fallback ─ */
    const _memCache = {};
    const _available = (function(){
        try{
            const k = '__bm_test__';
            global.localStorage.setItem(k, '1');
            global.localStorage.removeItem(k);
            return true;
        }catch(e){ return false; }
    })();

    const Store = {
        _k(key){ return 'bm:' + key; },

        get(key){
            try{
                const raw = _available
                    ? global.localStorage.getItem(this._k(key))
                    : (_memCache[this._k(key)] || null);
                return raw === null ? null : JSON.parse(raw);
            }catch(e){ return null; }
        },

        set(key, value){
            try{
                const str = JSON.stringify(value);
                if(_available) global.localStorage.setItem(this._k(key), str);
                else _memCache[this._k(key)] = str;
                return true;
            }catch(e){ return false; }
        },

        get persistent(){return _available;},
        del(key){
            try{
                if(_available) global.localStorage.removeItem(this._k(key));
                else delete _memCache[this._k(key)];
            }catch(e){}
        },

        /* Per-module session log.
           Keeps the last N sessions under "sessions:<module>". */
        saveSession(moduleCode, data, maxKeep = 50){
            const k = 'sessions:' + moduleCode;
            const arr = this.get(k) || [];
            arr.push(Object.assign({ ts: Date.now() }, data));
            if(arr.length > maxKeep) arr.splice(0, arr.length - maxKeep);
            this.set(k, arr);
            return arr.length;
        },

        getSessions(moduleCode){
            return this.get('sessions:' + moduleCode) || [];
        },

        /* Per-module best value.
           Returns { value, isNew } where isNew is true if the incoming
           value beats the previous best. */
        saveBest(moduleCode, metric, value, higherIsBetter = true){
            const k = 'best:' + moduleCode + ':' + metric;
            const prev = this.get(k);
            const beats = prev === null
                ? true
                : higherIsBetter ? value > prev : value < prev;
            if(beats) this.set(k, value);
            return { value: beats ? value : prev, isNew: beats && prev !== null };
        },

        getBest(moduleCode, metric){
            return this.get('best:' + moduleCode + ':' + metric);
        },

        /* Best record across every difficulty bucket for a given metric.
           Each module stores its per-difficulty bests under keys like
           "best:aim:hps_60", "best:aim:hps_30", "best:aim:hps_surv", etc.
           This walks every key matching the prefix and returns the best
           (highest, or lowest if lowerIsBetter), or null if none exist.

           Returns { value, bucket } so the card can show "BEST HPS · 4.2"
           and optionally label which difficulty achieved it. */
        getBestByPrefix(moduleCode, prefix, lowerIsBetter = false){
            const base = this._k('best:' + moduleCode + ':' + prefix);
            let best = null, bestBucket = null;
            try{
                if(_available){
                    for(let i = 0; i < global.localStorage.length; i++){
                        const k = global.localStorage.key(i);
                        if(!k || k.indexOf(base) !== 0) continue;
                        const raw = global.localStorage.getItem(k);
                        if(raw === null) continue;
                        const v = JSON.parse(raw);
                        if(typeof v !== 'number') continue;
                        if(best === null
                            || (lowerIsBetter ? v < best : v > best)){
                            best = v;
                            bestBucket = k.slice(base.length);   // the bucket suffix
                        }
                    }
                } else {
                    for(const k in _memCache){
                        if(k.indexOf(base) !== 0) continue;
                        const v = JSON.parse(_memCache[k]);
                        if(typeof v !== 'number') continue;
                        if(best === null
                            || (lowerIsBetter ? v < best : v > best)){
                            best = v;
                            bestBucket = k.slice(base.length);
                        }
                    }
                }
            }catch(e){}
            return best === null ? null : { value: best, bucket: bestBucket };
        },

        /* Per-module setup preferences (last used).
           Allows setups to restore the previous config. */
        savePrefs(moduleCode, prefs){ this.set('prefs:' + moduleCode, prefs); },
        getPrefs(moduleCode){ return this.get('prefs:' + moduleCode); },

        /* Global preferences (sound on/off, language…). */
        getGlobal(key){ return this.get('global:' + key); },
        setGlobal(key, value){ return this.set('global:' + key, value); }
    };

    /* ── 3 · BM · common UI helpers ────────────────────────── */
    const BM = {
        /* ── Global mouse profile ─────────────────────────────
           This represents the numeric sensitivity used by Anti-Flick's
           recoil simulation. It deliberately does not try to change the
           browser, OS, DPI, or a game's real input settings. */
        MouseSettings: {
            profiles: {
                valorant:{label:'VALORANT',min:.01,max:10,step:.01,default:.35,decimals:2},
                cs2:{label:'COUNTER-STRIKE 2',min:.1,max:10,step:.1,default:2.5,decimals:1},
                league:{label:'LEAGUE OF LEGENDS',min:0,max:100,step:1,default:50,decimals:0}
            },
            key:'mouseSettings:v1',
            normalize(input){
                const profile=this.profiles[input?.mouseProfile]||this.profiles.valorant;
                let sensitivity=Number(input?.mouseSensitivity);
                if(!Number.isFinite(sensitivity))sensitivity=profile.default;
                sensitivity=Math.min(profile.max,Math.max(profile.min,sensitivity));
                sensitivity=Math.round(sensitivity/profile.step)*profile.step;
                return {mouseProfile:this.profiles[input?.mouseProfile]?input.mouseProfile:'valorant',mouseSensitivity:Number(sensitivity.toFixed(profile.decimals))};
            },
            get(){return this.normalize(Store.getGlobal(this.key));},
            set(next){const value=this.normalize(next);Store.setGlobal(this.key,value);return value;},
            setProfile(profile){const p=this.profiles[profile]||this.profiles.valorant;return this.set({mouseProfile:this.profiles[profile]?profile:'valorant',mouseSensitivity:p.default});},
            setSensitivity(sensitivity){const current=this.get();return this.set({...current,mouseSensitivity:sensitivity});}
        },

        /* Streak pips
           buildPips('#stbar', 30) · updatePips('#stbar', streakCount, '#stval') */
        buildPips(containerSel, count = 30){
            const el = typeof containerSel === 'string'
                ? document.querySelector(containerSel) : containerSel;
            if(!el) return;
            el.innerHTML = '';
            for(let i = 0; i < count; i++){
                const p = document.createElement('div');
                p.className = 'spip';
                el.appendChild(p);
            }
        },
        updatePips(containerSel, streak, labelSel){
            const el = typeof containerSel === 'string'
                ? document.querySelector(containerSel) : containerSel;
            if(el){
                el.querySelectorAll('.spip').forEach((p, i) => {
                    p.classList.remove('a', 'f');
                    if(i < streak) p.classList.add(streak >= 20 ? 'f' : 'a');
                });
            }
            if(labelSel){
                const l = typeof labelSel === 'string'
                    ? document.querySelector(labelSel) : labelSel;
                if(l){
                    l.textContent = '×' + streak;
                    l.style.color = streak >= 20 ? 'var(--warn)'
                                   : streak >= 10 ? 'var(--accent)'
                                   : 'var(--t2)';
                }
            }
        },

        /* Lives (hearts) */
        drawLives(containerSel, current, max, size = ''){
            const el = typeof containerSel === 'string'
                ? document.querySelector(containerSel) : containerSel;
            if(!el) return;
            el.innerHTML = '';
            for(let i = 0; i < max; i++){
                const h = document.createElement('div');
                h.className = 'heart' + (size ? ' ' + size : '') + (i >= current ? ' dead' : '');
                el.appendChild(h);
            }
        },

        /* Tab switch · call with (tabButtons, panels, activeIndex) */
        switchTab(tabs, panels, idx){
            tabs.forEach((t, i) => t.classList.toggle('on', i === idx));
            panels.forEach((p, i) => p.classList.toggle('on', i === idx));
        },

        /* Pbtn-row single-select helper */
        selectPb(btn){
            if(!btn || !btn.parentNode) return;
            btn.parentNode.querySelectorAll('.pb').forEach(b => b.classList.remove('on'));
            btn.classList.add('on');
        },

        /* Crosshair tracker — call once; handles mousemove globally */
        mountCrosshair(selector = '#xhair'){
            const el = document.querySelector(selector);
            if(!el) return;
            global.addEventListener('mousemove', e => {
                el.style.left = e.clientX + 'px';
                el.style.top = e.clientY + 'px';
            });
        },

        /* Quick FX helpers */
        fxHit(parent, x, y){
            const b = document.createElement('div');
            b.className = 'fx-hit';
            b.style.left = x + 'px'; b.style.top = y + 'px';
            parent.appendChild(b);
            setTimeout(() => b.remove(), 250);
        },
        fxScore(parent, x, y, text, color){
            const s = document.createElement('div');
            s.className = 'fx-score';
            s.style.left = x + 'px'; s.style.top = (y - 10) + 'px';
            s.textContent = text;
            if(color) s.style.color = color;
            parent.appendChild(s);
            setTimeout(() => s.remove(), 500);
        },
        fxMiss(parent, x, y){
            const m = document.createElement('div');
            m.className = 'fx-miss';
            m.textContent = '✕';
            m.style.left = x + 'px'; m.style.top = y + 'px';
            parent.appendChild(m);
            setTimeout(() => m.remove(), 350);
        },

        /* Clipboard copy with UI feedback */
        copyToClipboard(text, el, originalLabel){
            const done = () => {
                if(!el) return;
                el.classList.add('copied');
                const hint = el.querySelector('.addr-hint');
                if(hint){
                    hint.textContent = '✓ COPIED';
                    setTimeout(() => {
                        el.classList.remove('copied');
                        hint.textContent = originalLabel || 'COPY';
                    }, 2000);
                }
            };
            if(global.navigator && navigator.clipboard){
                navigator.clipboard.writeText(text).then(done).catch(() => {});
            }else{
                // Legacy fallback
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.select();
                try{ document.execCommand('copy'); done(); }catch(e){}
                document.body.removeChild(ta);
            }
        },

        /* Standard back-to-home navigation, used by setup screens of
           every module. Plays a neutral low-launch sound (A4) to signal
           backward navigation, then routes to the home page. */
        backToHome(){
            Snd.launch(440);
            setTimeout(() => { global.location.href = '../index.html'; }, 320);
        },

        /* ── Module catalog (single source of truth) ──
           Keep in sync with index.html cards. Each entry has:
             code     short identifier ("aim", "time"...)
             name     display name
             icon     character/glyph used on home + switcher
             tone     hover/launch wood-block frequency in Hz
             accent   CSS color for tinting in switcher tiles
             url      relative path from /modulos/ to the module HTML */
        MODULES: [
            {code:'aim',         name:'Aim Room',        icon:'◎', tone:622, accent:'#ef4444', url:'aim_v2.html',         category:'mech'},
            {code:'time',        name:'Reaction Time',   icon:'⚡', tone:554, accent:'#f97316', url:'time_v3.html',        category:'mech'},
            {code:'tracking',    name:'Smooth Tracking', icon:'◉', tone:494, accent:'#f97316', url:'tracking_v2.html',    category:'mech'},
            {code:'clicktime',   name:'Click Timing',    icon:'⊕', tone:466, accent:'#f59e0b', url:'clicktime_v2.html',   category:'mech'},
            {code:'flicking',    name:'Anti-Flick',      icon:'✋', tone:415, accent:'#ef4444', url:'flicking_v2.html',    category:'mech'},
            {code:'apm',         name:'APM Burst',       icon:'⌨', tone:370, accent:'#ef4444', url:'apm_v2.html',         category:'mech'},
            {code:'typing',      name:'Typing Speed',    icon:'Aa', tone:330, accent:'#dc2626', url:'typing_v1.html',      category:'mech'},
            {code:'attention',   name:'Attention Split', icon:'◈', tone:698, accent:'#3b82f6', url:'attention_v2.html',   category:'cog'},
            {code:'stroop',      name:'Stroop Test',     icon:'🧠', tone:784, accent:'#a855f7', url:'stroop_v2.html',      category:'cog'},
            {code:'slidepuzzle', name:'Slide Puzzle',    icon:'▣', tone:840, accent:'#a855f7', url:'slidepuzzle_v1.html', category:'cog'},
            {code:'neurogrid',   name:'NeuroGrid',       icon:'▦', tone:880, accent:'#3b82f6', url:'neurogrid_v2.html',   category:'cog'},
            {code:'pathpredict', name:'Path Predict',    icon:'⟿', tone:988, accent:'#a855f7', url:'pathpredict_v2.html', category:'cog'},
            {code:'vortex',      name:'Vortex',          icon:'⊗', tone:1100, accent:'#a855f7', url:'vortex_v1.html',     category:'cog'},
            {code:'soundscape',  name:'Soundscape',      icon:'∿', tone:1047, accent:'#0ea5e9', url:'soundscape_v1.html', category:'amb'},
            {code:'breathing',   name:'Box Breathing',   icon:'□', tone:1175, accent:'#22d3ee', url:'breathing_v1.html', category:'amb'}
        ],

        /* ── Quick Switcher ──
           Mounts a floating pause button + overlay with module icons.
           Each in-game module calls this once during init.

           Options:
             current   module code currently running (highlighted in grid)
             onPause   () => void   called when user opens the switcher
             onResume  () => void   called when user closes it via Resume / Esc
             onExit    () => void   optional cleanup before navigating away

           Returns { open, close, isOpen, btn, overlay } for manual control. */
        mountQuickSwitcher(opts){
            opts = opts || {};
            const current = opts.current || '';

            // Build button
            const btn = document.createElement('button');
            btn.className = 'qs-btn';
            const pauseLabel=()=>{btn.setAttribute('aria-label',typeof I18N!=='undefined'&&I18N.lang==='es'?'Pausar y cambiar ejercicio':'Pause and switch module');};pauseLabel();global.addEventListener('langchange',pauseLabel);
            btn.title = 'Pause / Switch module  (Esc)';
            document.body.appendChild(btn);

            // Build overlay
            const overlay = document.createElement('div');
            overlay.className = 'qs-overlay';
            overlay.innerHTML =
                '<div class="qs-panel">' +
                    '<div class="qs-head">' +
                        '<div class="qs-tag">PAUSED</div>' +
                        '<div class="qs-title">SWITCH MODULE</div>' +
                        '<div class="qs-sub">Pick another · resume · or exit</div>' +
                    '</div>' +
                    '<div class="qs-grid" id="qs-grid"></div>' +
                    '<div class="qs-actions">' +
                        '<button class="qs-action" data-act="exit">EXIT TO HOME</button>' +
                        '<button class="qs-action primary" data-act="resume">RESUME</button>' +
                    '</div>' +
                    '<div class="qs-hint">Press ESC to resume</div>' +
                '</div>';
            document.body.appendChild(overlay);

            // Populate module grid
            const grid = overlay.querySelector('#qs-grid');
            this.MODULES.forEach(m => {
                const tile = document.createElement('div');
                tile.className = 'qs-tile' + (m.code === current ? ' current' : '');
                tile.style.setProperty('--tile-accent', m.accent);
                tile.innerHTML =
                    '<div class="qs-tile-icon">' + m.icon + '</div>' +
                    '<div class="qs-tile-name">' + m.name + '</div>' +
                    '<div class="qs-tile-code">' + m.code.toUpperCase() + '</div>';
                tile.addEventListener('mouseenter', () => Snd.tick(m.tone));
                tile.addEventListener('click', () => {
                    if(m.code === current) return;     // already here
                    Snd.launch(m.tone);
                    if(typeof opts.onExit === 'function') opts.onExit();
                    document.body.classList.add('qs-leaving');
                    setTimeout(() => { global.location.href = m.url; }, 400);
                });
                grid.appendChild(tile);
            });

            // Open / close
            let isOpen = false;
            const open = () => {
                if(isOpen) return;
                isOpen = true;
                overlay.classList.add('on');
                if(typeof opts.onPause === 'function') opts.onPause();
            };
            const close = () => {
                if(!isOpen) return;
                isOpen = false;
                overlay.classList.remove('on');
                if(typeof opts.onResume === 'function') opts.onResume();
            };

            // Wire up button + actions
            global.addEventListener('pageshow', e => { if(e.persisted && isOpen) close(); });
            btn.addEventListener('click', () => { Snd.tick(1100); open(); });
            btn.addEventListener('mouseenter', () => Snd.tick(1100));
            overlay.querySelector('[data-act=resume]').addEventListener('click', () => {
                Snd.tick(1320); close();
            });
            overlay.querySelector('[data-act=exit]').addEventListener('click', () => {
                Snd.launch(1175);
                if(typeof opts.onExit === 'function') opts.onExit();
                setTimeout(() => { global.location.href = '../index.html'; }, 350);
            });

            // Escape toggles (only when overlay is the topmost layer)
            document.addEventListener('keydown', (e) => {
                if(e.key !== 'Escape') return;
                if(isOpen){ close(); }
                else if(btn.classList.contains('on')){ open(); }
            });

            return { open, close, btn, overlay, get isOpen(){ return isOpen; } };
        }
    };

    /* ── 4 · Expose ────────────────────────────────────────── */
    global.Snd = Snd;
    global.Store = Store;
    global.BM = BM;

    /* Restore global sound preference on load */
    const savedSnd = Store.getGlobal('snd');
    if(savedSnd === false) Snd.on = false;

    /* Audio context lifecycle:
       - Browsers block AudioContext until a *valid* user gesture. Valid
         gestures are: click, keydown, pointerdown, mousedown, touchend.
         Hover events (mouseenter, pointermove) are NOT valid — there is no
         way around this. Until the user clicks/types/taps once, audio is
         unavailable.
       - Browsers also suspend the ctx when navigating away (and may keep it
         suspended when returning via back-button / bfcache).
       So we (a) call Snd.init() on every valid gesture — init() is idempotent
       and also resumes a suspended context, and (b) listen for `pageshow`
       to resume immediately on bfcache restore AND to clean up any UI
       state that the bfcache rehydrated in its previous "navigating away"
       form. The home page checks Snd.ready() and shows a hint until ready. */
    if(typeof document !== 'undefined'){
        const _ensureAudio = () => {
            Snd.init();
            // Notify the page that audio is now available (home uses this
            // to dismiss the "click to enable sound" hint).
            if(Snd.ctx) global.dispatchEvent(new Event('bm-audio-ready'));
        };
        document.addEventListener('pointerdown', _ensureAudio);
        document.addEventListener('keydown', _ensureAudio);
        document.addEventListener('touchend', _ensureAudio);
        global.addEventListener('pageshow', (e) => {
            // Resume audio context (no-op if not present yet)
            if(Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume();
            // Clear any UI element that was left "active" before navigating away
            const loader = document.querySelector('.bm-loader.active');
            if(loader) loader.classList.remove('active');
            const qsOverlay = document.querySelector('.qs-overlay.on');
            if(qsOverlay && !e.persisted) qsOverlay.classList.remove('on');
            // Cleanup body classes used during transitions
            document.body.classList.remove('qs-leaving');
            document.body.style.overflow = '';
        });
    }

})(window);
