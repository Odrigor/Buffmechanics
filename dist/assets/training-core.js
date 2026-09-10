/* Shared active clock and cancellable schedulers. No runtime dependencies. */
(function () {
    'use strict';
    const native = { timeout: window.setTimeout.bind(window), clear: window.clearTimeout.bind(window), frame: window.requestAnimationFrame.bind(window), cancelFrame: window.cancelAnimationFrame.bind(window) };
    class ActiveClock {
        constructor(source = () => performance.now()) { this.source = source; this.reset(); }
        reset() { this.origin = this.source(); this.pausedAt = null; this.stoppedAt = null; this.accumulated = 0; this.pauseCount = 0; this.unstable = false; this.frames = new Map(); }
        now() { return Math.max(0, (this.stoppedAt ?? this.pausedAt ?? this.source()) - this.origin - this.accumulated); }
        pause() { if (this.pausedAt !== null || this.stoppedAt !== null) return; this.pausedAt = this.source(); this.pauseCount++; }
        resume() { if (this.pausedAt === null || this.stoppedAt !== null) return; this.accumulated += this.source() - this.pausedAt; this.pausedAt = null; }
        stop() { if (this.stoppedAt !== null) return; if (this.pausedAt !== null) { this.accumulated += this.source() - this.pausedAt; this.pausedAt = null; } this.stoppedAt = this.source(); }
        pauseMs() { return this.accumulated + (this.pausedAt !== null ? this.source() - this.pausedAt : 0); }
        step(channel = 'main') {
            const now = this.now(), before = this.frames.get(channel) ?? 0;
            this.frames.set(channel, now);
            const ms = Math.max(0, now - before);
            if (ms > 250) this.unstable = true;
            return Math.min(ms, 100) / 1000;
        }
    }
    class Scheduler {
        constructor(clock, api = native) { this.clock = clock; this.api = api; this.jobs = new Map(); this.serial = 0; this.paused = false; }
        add(fn, ms, repeat = false, raf = false) {
            const id = ++this.serial;
            const job = { id, fn, interval: repeat ? Math.max(1, ms) : 0, raf, due: this.clock.now() + Math.max(0, ms || 0), token: null };
            this.jobs.set(id, job); if (!this.paused) this.arm(job); return id;
        }
        arm(job) {
            const run = stamp => {
                if (!this.jobs.has(job.id) || this.paused) return;
                if (!job.interval) this.jobs.delete(job.id);
                job.token = null;
                if (job.interval) job.due = this.clock.now() + job.interval;
                job.fn(stamp);
                if (job.interval && this.jobs.has(job.id) && !this.paused) this.arm(job);
            };
            job.token = job.raf ? this.api.frame(run) : this.api.timeout(run, Math.max(0, job.due - this.clock.now()));
        }
        setTimeout(fn, ms) { return this.add(fn, ms); }
        setInterval(fn, ms) { return this.add(fn, ms, true); }
        requestAnimationFrame(fn) { return this.add(fn, 0, false, true); }
        clear(id) {
            const job = this.jobs.get(id); if (!job) return;
            if (job.token !== null) (job.raf ? this.api.cancelFrame : this.api.clear)(job.token);
            this.jobs.delete(id);
        }
        clearAll() { [...this.jobs.keys()].forEach(id => this.clear(id)); this.paused = false; }
        pause() {
            if (this.paused) return; this.paused = true;
            this.jobs.forEach(j => { if (j.token !== null) (j.raf ? this.api.cancelFrame : this.api.clear)(j.token); j.token = null; });
        }
        resume() { if (!this.paused) return; this.paused = false; this.jobs.forEach(j => this.arm(j)); }
    }
    BM.ActiveClock = ActiveClock; BM.Scheduler = Scheduler;
    BM.text = (es, en) => typeof I18N !== 'undefined' && I18N.lang === 'en' ? en : es;
    BM.mean = values => values.length ? Math.round(values.reduce((a,b)=>a+b,0)/values.length) : 0;
    BM.uid = () => window.crypto?.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    BM.configSnapshot = ui => {
        const ignored = ['tuneOpen', 'activeGenre'];
        const out = {};
        Object.keys(ui || {}).sort().forEach(k => {
            const value = ui[k];
            if (k[0] !== '_' && !ignored.includes(k) && typeof value !== 'function') out[k] = BM.History.clean(value);
        });
        return out;
    };
    BM.syncConfigUI = function (ui) {
        const controls = { setTime: 'time', setRounds: 'rounds', setSize: 'size', setPace: 'pace', setDiff: 'diff', setChallenge: 'challenge', setKeyset: 'keyset', setPulses: 'pulses', setKeys: 'keys', setComplexity: 'complexity', setSpawn: 'spawn', setLife: 'life' };
        document.querySelectorAll('button[onclick]').forEach(b => {
            const m = b.getAttribute('onclick').match(/UI\.(\w+)\(\s*('([^']*)'|"([^"]*)"|[\d.]+)/);
            if (!m) return;
            const key = controls[m[1]], value = m[3] ?? m[4] ?? Number(m[2]);
            if (key) b.classList.toggle('on', ui[key] === value);
        });
        const sliders = { 'sl-speed': 'speed', 'sl-size': 'size', 'sl-chaos': 'chaos', 'sl-freq': 'freq', 'sl-react': 'react', 'sl-thresh': 'thresh', 'sl-hold': 'hold', 'sl-radius': 'radius', 'sl-resp': 'response', 'sl-window': 'window', 'sl-win':'window', 'sl-spawn':'spawn', 'sl-spawn-variance':'spawnVariance', 'sl-conf': 'conflict', 'sl-bpm': 'bpm', 'sl-grow': 'grow' };
        for (const [id, key] of Object.entries(sliders)) {
            const el = document.getElementById(id); if (!el || ui[key] === undefined) continue;
            el.value = ui[key]; el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (ui.pick) ui.pick(ui.duration ?? ui.diff ?? ui.mode);
        if (ui.buildPatternChecks) ui.buildPatternChecks();
        if (ui.buildTrajChecks) ui.buildTrajChecks();
        if (ui.syncGenreHighlight) ui.syncGenreHighlight();
        if (ui.buildSetup && !document.querySelector('#proto-row .pcard')) ui.buildSetup();
        if (ui.pickProto) { ui.pickProto(ui.protoId); ui.pickDur(ui.durId); ui.setCue(ui.cue); }
        if (ui.refreshSummary) ui.refreshSummary();
        if (ui.syncRecoilToggle) ui.syncRecoilToggle();
        if (ui.syncSpawnRandomToggle) ui.syncSpawnRandomToggle();
        const custom = document.getElementById('cst-keys'); if (custom) custom.value = ui.customKeys || 'QWER';
        if (ui.syncProgToggle) ui.syncProgToggle();
        else { const prog = document.getElementById('prog-toggle'); if (prog) prog.classList.toggle('on', !!ui.progOn); }
    };
    BM.attachTraining = function ({ module, game, ui, start, finish = 'end', onPause, onResume }) {
        const clock = new ActiveClock(), scheduler = new Scheduler(clock);
        game.clock = clock; game.scheduler = scheduler;
        const defaults = BM.configSnapshot(ui), saved = Store.getPrefs(module);
        if (saved && typeof saved === 'object') {
            for (const [key, value] of Object.entries(saved)) {
                if (!(key in defaults) || typeof value !== typeof defaults[key]) continue;
                if (typeof value === 'number' && (!Number.isFinite(value) || value < 0 || value > 100000)) continue;
                if (Array.isArray(value) && (value.length > 30 || value.some(v => typeof v !== 'string'))) continue;
                ui[key] = value;
            }
        }
        const active = () => BM.session?.module === module && BM.session.clock === clock && !BM.session.finished;
        const originalStart = game[start], originalFinish = game[finish];
        game[start] = function (...args) {
            if (active()) { if (game.paused) return; finishAbandoned(); }
            const routine=BM.Routine?.context(module);
            if(routine)BM.Routine.apply({module,game,ui,defaults},routine);
            scheduler.clearAll(); clock.reset(); game.paused = false; game.timePenalty=0;game._hudAt=0;
            game.falseStarts=0;game.anticipations=0;
            document.body.classList.remove('bm-paused');
            const settings = BM.configSnapshot(ui);
            if(module==='flicking'&&BM.MouseSettings)Object.assign(settings,BM.MouseSettings.get());
            if(!routine)Store.savePrefs(module, settings);
            if(routine&&module==='stroop')settings.fixedDuration=true;
            const config = { module, scoringVersion: 2, settings, arena: ['breathing','soundscape'].includes(module) ? null : { width: innerWidth, height: innerHeight, input: 'desktop' } };
            BM.session = { module, game, clock, scheduler, id: BM.uid(), startedAt: Date.now(), config, defaults, finished: false, record: null, routineId: routine?.id || null, routineBlock: routine?.index ?? null };
            const result = originalStart.apply(this, args);
            game.sessionDuration=game.timeLeft || game.duration || 0;
            if(routine&&!BM.Routine.isEstimated(module)){game.sessionDuration=routine.blocks[routine.index].duration;game.timeLeft=game.sessionDuration;if(game.updateHUD)game.updateHUD();const timer=document.getElementById('h-tm');if(timer)timer.textContent=game.timeLeft;}
            if(game.sessionDuration>0 && !['typing','slidepuzzle','breathing','time','pathpredict'].includes(module))scheduler.setTimeout(()=>game[finish](),game.sessionDuration*1000);
            return result;
        };
        function finishAbandoned() {
            if (!active()) return;
            clock.stop(); scheduler.clearAll();
            BM.History.save(BM.session, {}, 'abandoned'); BM.session.finished = true;
        }
        game[finish] = function (...args) {
            if (!active()) return;
            clock.stop(); scheduler.clearAll();
            if(module!=='vortex' && typeof game.elapsed==='number')game.elapsed=clock.now()/1000;
            BM.session.finished = true;
            document.body.classList.remove('bm-paused');
            BM.session.status = ['breathing','soundscape'].includes(module) && args[0] === true ? 'stopped' : 'completed';
            const result = originalFinish.apply(this, args);
            if (!BM.session.record) BM.History.save(BM.session, {}, BM.session.status);
            BM.showSessionResult?.(BM.session);
            return result;
        };
        const originalExit = game.exit || game.exitForNav || (() => {});
        game.exit = function () {
            finishAbandoned(); scheduler.clearAll(); game.active = false; game.running = false; game.paused = false;
            document.body.classList.remove('bm-paused');
            if (onPause) onPause();
            return originalExit.call(this);
        };
        game.exitForNav = game.exit;
        game.pause = function () {
            if (!active() || game.paused) return;
            clock.pause(); scheduler.pause(); game.paused = true;
            game._cursorBeforePause = document.body.style.cursor;
            document.body.style.cursor = 'default'; document.body.classList.add('bm-paused');
            if (onPause) onPause();
        };
        game.resume = function () {
            if (!active() || !game.paused) return;
            clock.resume(); game.paused = false; document.body.classList.remove('bm-paused');
            document.body.style.cursor = game._cursorBeforePause || '';
            if (onResume) onResume(); scheduler.resume();
        };
        if (module === 'breathing') {
            game.pauseFromSwitcher = game.pause; game.resumeFromSwitcher = game.resume;
            game.togglePause = () => game.qs?.isOpen ? game.qs.close() : game.qs?.open();
        }
        if (module === 'time') game.retry = () => game.launch();
        if (module === 'slidepuzzle') {
            const win = game.win;
            game.win = function () { if (!active()) return; clock.stop(); return win.call(this); };
        }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && active() && !game.paused) {
                if (game.qs) game.qs.open(); else game.pause();
            }
        });
        window.addEventListener('pagehide', () => { finishAbandoned(); scheduler.clearAll(); });
        window.addEventListener('pageshow', e => { if(e.persisted) location.reload(); });
        window.addEventListener('resize', () => {
            if (active() && !['breathing','soundscape'].includes(module)) clock.unstable = true;
        });
        const setup = document.getElementById('setup');
        if (setup && ui) {
            const note = document.createElement('div'); note.className = 'bm-session-notice';
            note.innerHTML = '<span></span><button type="button"></button>';
            const refresh = () => {
                note.firstElementChild.textContent = module==='breathing'?BM.text('Tu configuración se guarda. Esta práctica registra tiempo y ciclos, sin récord competitivo.','Your setup is saved. This practice records time and cycles without competitive records.'):BM.text('Tu configuración se guarda. Los récords comparan sesiones equivalentes sin pausas.', 'Your setup is saved. Records compare equivalent, uninterrupted sessions.');
                note.lastElementChild.textContent = BM.text('Restablecer configuración', 'Reset setup');
            };
            note.lastElementChild.onclick = () => { Object.assign(ui, JSON.parse(JSON.stringify(defaults))); BM.syncConfigUI(ui); Store.savePrefs(module, BM.configSnapshot(ui)); };
            setup.appendChild(note); refresh(); window.addEventListener('langchange', refresh);
            document.addEventListener('DOMContentLoaded',()=>{refresh();if(ui.refreshSummary)ui.refreshSummary();});
        }
        try { BM.syncConfigUI(ui); } catch(error) { Object.assign(ui, defaults); BM.syncConfigUI(ui); }
        BM.moduleController = { module, game, ui, defaults, start: () => game[start]() };
        BM.Routine?.mountModule(BM.moduleController);
        return BM.moduleController;
    };
})();
