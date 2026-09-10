/* Buffmechanics beta 2026.09.3 — local, versioned training journal. */
(function () {
    'use strict';
    const KEY = 'training:v2', SCORING = 2;
    const legacy = {
        getSessions: Store.getSessions.bind(Store), getBest: Store.getBest.bind(Store),
        getBestByPrefix: Store.getBestByPrefix.bind(Store)
    };
    const modules = BM.MODULES.map(m => m.code);
    const clone = value => JSON.parse(JSON.stringify(value));
    const clean = value => {
        if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        if (Array.isArray(value)) return value.map(clean);
        if (value && typeof value === 'object') {
            const out = {};
            Object.keys(value).sort().forEach(k => {
                if (!['__proto__', 'constructor', 'prototype'].includes(k) && typeof value[k] !== 'function') out[k] = clean(value[k]);
            });
            return out;
        }
        return null;
    };
    const signature = config => JSON.stringify(clean(config));
    const empty = () => ({ schemaVersion: 2, scoringVersion: SCORING, sessions: [], totals: { sessions: 0, activeDurationMs: 0 }, createdAt: Date.now() });
    let state = Store.get(KEY) || empty();
    if (state.schemaVersion !== 2 || !Array.isArray(state.sessions)) state = empty();
    let writeError = false;
    function totals(sessions) {
        return { sessions: sessions.length, activeDurationMs: sessions.reduce((n, s) => n + s.activeDurationMs, 0) };
    }
    function commit(next, strict = false) {
        next.totals = totals(next.sessions);
        const ok = Store.set(KEY, next);
        if (!ok && strict) throw new Error('No hay espacio para guardar. Exporta un respaldo antes de continuar.');
        state = next;
        writeError = !ok;
        window.dispatchEvent(new Event('bm-history-change'));
        return ok;
    }
    const metricDefs = {
        aim: ['hps', '/s', false, 2], time: ['avgMs', 'ms', true, 0],
        tracking: ['lockPct', '%', false, 1], clicktime: ['perfRate', '%', false, 0],
        flicking: ['avgStab', 'ms', true, 0], apm: ['peakBpm', 'BPM', false, 0],
        typing: ['wpm', 'WPM', false, 0], attention: ['focusScore', '', false, 0],
        stroop: ['avgRt', 'ms', true, 0], neurogrid: ['hitsPerMin', '/min', false, 0],
        pathpredict: ['accuracy', '%', false, 0], vortex: ['metric', '%', false, 0],
        slidepuzzle: ['moves', '', true, 0]
    };
    function quality(mod, data, ms) {
        switch (mod) {
            case 'aim': return data.hits >= 10 && data.acc >= 70 && ms >= 10000;
            case 'time': return data.validCount >= 5 && data.avgMs >= 100;
            case 'tracking': return ms >= 15000 && data.trackedMs >= 1000;
            case 'clicktime': return data.hits >= 10 && data.coverage >= 50 && data.acc >= 70;
            case 'flicking': return data.completed >= 3;
            case 'apm': return data.hits >= 10 && data.acc >= 90 && data.peakBpm > 0;
            case 'typing': return data.words >= 5 && data.wpm > 0;
            case 'attention': return data.hits >= 5 && ms >= 15000;
            case 'stroop': return data.correct >= 5 && data.acc >= 80;
            case 'neurogrid': return data.hits >= 3 && data.acc >= 70;
            case 'pathpredict': return data.perfects + data.closes + data.misses >= 5;
            case 'vortex': return data.pops >= 10;
            case 'slidepuzzle': return data.moves > 0 && data.timeMs > 0;
            default: return false;
        }
    }
    function validate(input) {
        if (!input || input.schemaVersion !== 2 || !Array.isArray(input.sessions) || input.sessions.length > 20000) throw new Error('Respaldo no compatible o demasiado grande.');
        const ids = new Set();
        input.sessions.forEach(s => {
            if (!s || typeof s.sessionId !== 'string' || s.sessionId.length > 100 || ids.has(s.sessionId) || !modules.includes(s.moduleId)) throw new Error('Sesiones inválidas o duplicadas en el respaldo.');
            ids.add(s.sessionId);
            if (!Number.isFinite(s.activeDurationMs) || s.activeDurationMs < 0 || s.activeDurationMs > 86400000 || !Number.isFinite(s.startedAt) || s.startedAt < 0 || s.startedAt > 8640000000000000 || !Number.isFinite(s.pauseDurationMs) || s.pauseDurationMs < 0 || typeof s.unstable !== 'boolean') throw new Error('Duración o fecha inválida.');
            if (s.schemaVersion !== 2 || s.scoringVersion !== SCORING || !s.config || typeof s.config !== 'object' || !s.data || typeof s.data !== 'object') throw new Error('Versión de sesión no compatible.');
            if (s.configSignature !== signature(s.config)) throw new Error('La configuración del respaldo no coincide con su firma.');
            if(s.config.module!==s.moduleId || s.config.scoringVersion!==SCORING || !s.config.settings || Array.isArray(s.config.settings)) throw new Error('Contexto de sesión inválido.');
            if (!['completed', 'abandoned', 'stopped'].includes(s.status) || typeof s.recordEligible !== 'boolean' || !Number.isInteger(s.pauseCount) || s.pauseCount < 0) throw new Error('Estado de sesión inválido.');
            const def = metricDefs[s.moduleId];
            if(def && s.data[def[0]]!==undefined && (!Number.isFinite(s.data[def[0]]) || s.data[def[0]]<0)) throw new Error('Métrica inválida.');
            if (def && s.recordEligible && (!Number.isFinite(s.data[def[0]]) || !quality(s.moduleId, s.data, s.activeDurationMs) || s.pauseCount || s.status !== 'completed' || s.unstable)) throw new Error('Marca incompatible con las reglas de esta versión.');
        });
        return clean(input);
    }
    BM.History = {
        SCORING, legacy, metricDefs, clean, signature,
        all: () => state.sessions.slice(),
        get writeError() { return writeError || !Store.persistent; },
        summary: () => ({ ...state.totals }),
        sessions(mod, sig) { return state.sessions.filter(s => (!mod || s.moduleId === mod) && (!sig || s.configSignature === sig)); },
        best(mod, sig, key) {
            const def = metricDefs[mod]; if (!def) return null;
            const field = key === 'score' ? 'score' : def[0];
            const list = this.sessions(mod, sig).filter(s => s.recordEligible && Number.isFinite(s.data[field]));
            if (!list.length) return null;
            const lower = field === 'score' ? false : def[2];
            return list.reduce((a, b) => (lower ? b.data[field] < a.data[field] : b.data[field] > a.data[field]) ? b : a);
        },
        save(session, data, status = 'completed') {
            const existing = state.sessions.find(s => s.sessionId === session.id);
            if (existing) return existing;
            const ms = Math.max(0, Math.round(session.clock.now()));
            const record = {
                schemaVersion: 2, scoringVersion: SCORING, sessionId: session.id,
                moduleId: session.module, startedAt: session.startedAt,
                activeDurationMs: ms, pauseDurationMs: Math.round(session.clock.pauseMs()),
                pauseCount: session.clock.pauseCount, unstable: session.clock.unstable,
                status, config: clone(session.config), configSignature: signature(session.config),
                routineId: session.routineId || null, routineBlock: session.routineBlock ?? null,
                data: clean(data), recordEligible: false
            };
            const def=metricDefs[session.module];
            record.recordEligible = status === 'completed' && !record.pauseCount && !record.unstable && !!def && Number.isFinite(record.data[def[0]]) && record.data[def[0]]>=0 && quality(session.module, record.data, ms);
            commit({ ...state, sessions: [...state.sessions, record] });
            session.record = record;
            return record;
        },
        export() {
            const old = {}; modules.forEach(m => { const rows = legacy.getSessions(m); if (rows.length) old[m] = rows; });
            return { ...clone(state), exportedAt: Date.now(), legacy: old };
        },
        inspectImport(input) {
            const incoming = validate(input);
            const present = new Set(state.sessions.map(s => s.sessionId));
            return { incoming, additions: incoming.sessions.filter(s => !present.has(s.sessionId)).length };
        },
        import(input) {
            const { incoming } = this.inspectImport(input);
            const present = new Set(state.sessions.map(s => s.sessionId));
            const additions = incoming.sessions.filter(s => !present.has(s.sessionId));
            if (state.sessions.length + additions.length > 20000) throw new Error('El respaldo excede el límite de sesiones.');
            if (!Store.set('training:before-import', state)) throw new Error('No se pudo crear la copia anterior a la importación.');
            const merged = [...state.sessions, ...additions].sort((a, b) => a.startedAt - b.startedAt);
            commit({ ...state, sessions: merged }, true);
            if (incoming.legacy && typeof incoming.legacy === 'object') {
                modules.forEach(m => {
                    const rows = incoming.legacy[m]; if (!Array.isArray(rows)) return;
                    const old = legacy.getSessions(m), known = new Set(old.map(signature));
                    const more = rows.filter(r => {if(!r || typeof r!=='object' || !Number.isFinite(r.ts))return false;const sig=signature(r);if(known.has(sig))return false;known.add(sig);return true;}).slice(0, 2000);
                    if (more.length) Store.set('sessions:' + m, [...old, ...more]);
                });
            }
            return additions.length;
        },
        restoreBeforeImport() {
            const previous = Store.get('training:before-import'); validate(previous); commit(previous, true);
        },
        format(record) {
            const d = metricDefs[record.moduleId]; if (!d) return '';
            const value = record.data[d[0]];
            return Number.isFinite(value) && (!d[2] || value>0) ? value.toFixed(d[3]) + (d[1] ? ' ' + d[1] : '') : '—';
        }
    };
    // Compatibility bridge: old result panels now read only the current protocol.
    Store.getSessions = function (mod) {
        const current = BM.session;
        const sig = current && current.module === mod ? signature(current.config) : undefined;
        return BM.History.sessions(mod, sig).map(s => ({ ...s.data, ts: s.startedAt, durationSec: s.activeDurationMs / 1000, sessionId: s.sessionId, recordEligible: s.recordEligible }));
    };
    Store.saveSession = function (mod, data) {
        const current = BM.session;
        if (!current || current.module !== mod) return 0;
        current.clock.stop();
        const r = BM.History.save(current, data, current.status || 'completed');
        return r ? BM.History.sessions(mod).length : 0;
    };
    Store.getBest = function (mod, key) {
        const current = BM.session;
        const recent=BM.History.sessions(mod).filter(s=>s.recordEligible).at(-1);
        const sig = current && current.module === mod ? signature(current.config) : recent?.configSignature;
        const r = BM.History.best(mod, sig, key), def = metricDefs[mod];
        return r && def ? r.data[key === 'score' ? 'score' : def[0]] : null;
    };
    Store.saveBest = function (mod, key, value, higher) {
        const current = BM.session, best = Store.getBest(mod, key);
        const eligible = !!current?.record?.recordEligible;
        const field = key === 'score' ? 'score' : metricDefs[mod]?.[0];
        const others = current ? BM.History.sessions(mod, signature(current.config)).filter(s => s.recordEligible && s.sessionId !== current.id && Number.isFinite(s.data[field])) : [];
        const isNew = eligible && others.length > 0 && others.every(s => higher ? value > s.data[field] : value < s.data[field]);
        return { value: best, isNew };
    };
    Store.getBestByPrefix = function (mod) {
        const def = metricDefs[mod]; if (!def) return null;
        const recent = BM.History.sessions(mod).filter(s => s.recordEligible).at(-1);
        const r = recent ? BM.History.best(mod, recent.configSignature) : null;
        return r ? { value: r.data[def[0]], bucket: r.configSignature } : null;
    };
})();
