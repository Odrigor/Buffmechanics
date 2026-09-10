/* Shared player card. Preserves existing appearance preferences. */
(function(){
 document.body.insertAdjacentHTML("beforeend","<div class=\"stats-modal\" id=\"stats-modal\" onclick=\"if(event.target===this)closeStatsModal()\">\n    <div class=\"pc-wrap\">\n        <!-- The card itself: this is what html2canvas renders to PNG -->\n        <div id=\"player-card\" data-pattern=\"grid\">\n            <!-- Filled dynamically by renderPlayerCard() -->\n        </div>\n\n        <!-- Customization sidebar -->\n        <aside class=\"pc-controls\" aria-label=\"Customize card\">\n            <div class=\"pc-controls-head\">\n                <span data-i18n=\"pc.customize\">CUSTOMIZE</span>\n                <button class=\"pc-controls-close\" onclick=\"closeStatsModal()\" data-i18n=\"pc.close\">CLOSE</button>\n            </div>\n            <div class=\"pc-controls-body\">\n\n                <!-- Nickname -->\n                <div class=\"pc-group\">\n                    <div class=\"pc-group-head\" data-i18n=\"pc.nick\">YOUR TAG</div>\n                    <input type=\"text\" id=\"pc-nick-in\" class=\"pc-nick-input\" maxlength=\"32\"\n                        placeholder=\"\u2014\" oninput=\"onNickChange()\" autocomplete=\"off\">\n                    <div class=\"pc-nick-count\"><span id=\"pc-nick-count\">0</span> / 32</div>\n                </div>\n\n                <!-- Theme presets -->\n                <div class=\"pc-group\">\n                    <div class=\"pc-group-head\" data-i18n=\"pc.theme\">THEME</div>\n                    <div class=\"pc-swatches\" id=\"pc-themes\"><!-- built in JS --></div>\n                </div>\n\n                <!-- Custom colors -->\n                <div class=\"pc-group\">\n                    <div class=\"pc-group-head\" data-i18n=\"pc.colors\">CUSTOM COLORS</div>\n                    <div class=\"pc-color-row\">\n                        <label data-i18n=\"pc.col.bg\">Background</label>\n                        <input type=\"color\" id=\"pc-col-bg\" oninput=\"onColorChange('bg', this.value)\">\n                    </div>\n                    <div class=\"pc-color-row\">\n                        <label data-i18n=\"pc.col.text\">Text</label>\n                        <input type=\"color\" id=\"pc-col-text\" oninput=\"onColorChange('text', this.value)\">\n                    </div>\n                    <div class=\"pc-color-row\">\n                        <label data-i18n=\"pc.col.accent\">Accent</label>\n                        <input type=\"color\" id=\"pc-col-accent\" oninput=\"onColorChange('accent', this.value)\">\n                    </div>\n                </div>\n\n                <!-- Pattern -->\n                <div class=\"pc-group\">\n                    <div class=\"pc-group-head\" data-i18n=\"pc.pattern\">BACKGROUND PATTERN</div>\n                    <div class=\"pc-pills\" id=\"pc-patterns\">\n                        <button class=\"pc-pill\" data-pattern=\"solid\" onclick=\"onPatternChange('solid')\" data-i18n=\"pc.pat.solid\">Solid</button>\n                        <button class=\"pc-pill on\" data-pattern=\"grid\" onclick=\"onPatternChange('grid')\" data-i18n=\"pc.pat.grid\">Grid</button>\n                        <button class=\"pc-pill\" data-pattern=\"diag\" onclick=\"onPatternChange('diag')\" data-i18n=\"pc.pat.diag\">Lines</button>\n                        <button class=\"pc-pill\" data-pattern=\"noise\" onclick=\"onPatternChange('noise')\" data-i18n=\"pc.pat.noise\">Noise</button>\n                    </div>\n                </div>\n\n                <!-- Typography -->\n                <div class=\"pc-group\">\n                    <div class=\"pc-group-head\" data-i18n=\"pc.font\">TYPOGRAPHY</div>\n                    <div class=\"pc-pills\" id=\"pc-fonts\">\n                        <button class=\"pc-pill on\" data-font=\"tech\" onclick=\"onFontChange('tech')\">Tech</button>\n                        <button class=\"pc-pill\" data-font=\"modern\" onclick=\"onFontChange('modern')\">Modern</button>\n                        <button class=\"pc-pill\" data-font=\"serif\" onclick=\"onFontChange('serif')\">Serif</button>\n                        <button class=\"pc-pill\" data-font=\"pixel\" onclick=\"onFontChange('pixel')\">Pixel</button>\n                    </div>\n                </div>\n\n                <!-- Actions -->\n                <div class=\"pc-actions\">\n                    <button class=\"pc-btn primary\" onclick=\"exportPlayerCard()\" data-i18n=\"pc.export\">EXPORT AS PNG</button>\n                    <button class=\"pc-btn\" onclick=\"resetPlayerCard()\" data-i18n=\"pc.reset\">RESET STYLE</button>\n                </div>\n            </div>\n        </aside>\n    </div>\n</div>\n<div class=\"pc-toast\" id=\"pc-toast\" data-i18n=\"pc.saved\">CARD SAVED TO DOWNLOADS</div>\n\n<!-- Loaded only when the modal opens -->\n<script id=\"h2c-loader-tag\" data-loaded=\"0\"></script>\n\n<!-- Loader -->\n<div class=\"bm-loader\" id=\"loader\">\n    <div class=\"bm-spin\"></div>\n    <div class=\"mono\" style=\"font-size:8px;letter-spacing:.2em;color:var(--t2)\">INITIALIZING PROTOCOL...</div>\n</div>\n\n");
    const PC_METRICS = {
        aim:         { prefix:'hps_',      label:'HPS',     unit:'/s',  decimals:1, lower:false },
        time:        { metric:'avgMs',     label:'AVG',     unit:'ms',  decimals:0, lower:true  },
        tracking:    { prefix:'lock_',     label:'LOCK',    unit:'%',   decimals:1, lower:false },
        clicktime:   { prefix:'perfrate_', label:'PERFECT', unit:'%',   decimals:0, lower:false },
        flicking:    { prefix:'stab_',     label:'STAB',    unit:'ms',  decimals:0, lower:true  },
        apm:         { prefix:'peakbpm_',  label:'PEAK',    unit:'bpm', decimals:0, lower:false },
        typing:      { prefix:'wpm_',      label:'WPM',     unit:'wpm', decimals:0, lower:false },
        attention:   { prefix:'focus_',    label:'FOCUS',   unit:'',    decimals:0, lower:false },
        stroop:      { prefix:'rt_',       label:'RT',      unit:'ms',  decimals:0, lower:true  },
        neurogrid:   { prefix:'hpm_',      label:'HPM',     unit:'/min',decimals:0, lower:false },
        pathpredict: { prefix:'acc_',      label:'ACC',     unit:'%',   decimals:0, lower:false },
        vortex:      { prefix:'acc_',      label:'ACC',     unit:'%',   decimals:0, lower:false },
        slidepuzzle: { prefix:'moves_',    label:'MOVES',   unit:'',    decimals:0, lower:true  }
    };

    // Preset themes. Each is a complete look. Numbers are the order of
    // their swatch in the grid. The accent color is also the main border /
    // section-label color, so it carries the personality.
    const PC_THEMES = [
        { id:'obsidian',  name:'Obsidian',  bg:'#0a0a10', bg2:'#13131a', text:'#edeef2', accent:'#a855f7' },
        { id:'carbon',    name:'Carbon',    bg:'#111111', bg2:'#1a1a1a', text:'#f0f0f0', accent:'#ef4444' },
        { id:'vapor',     name:'Vapor',     bg:'#0d1626', bg2:'#162038', text:'#e8eaf2', accent:'#22d3ee' },
        { id:'solar',     name:'Solar',     bg:'#1a1410', bg2:'#231a14', text:'#fff5e8', accent:'#f59e0b' },
        { id:'forest',    name:'Forest',    bg:'#0a1410', bg2:'#0f1f18', text:'#e8f0ea', accent:'#10b981' },
        { id:'crimson',   name:'Crimson',   bg:'#1a0a0e', bg2:'#251018', text:'#fbe8ec', accent:'#dc2626' },
        { id:'paper',     name:'Paper',     bg:'#f4f1ea', bg2:'#eae5d8', text:'#1a1814', accent:'#1a1814' },
        { id:'mint',      name:'Mint',      bg:'#e8f4ee', bg2:'#d4ebde', text:'#1a2820', accent:'#0d9466' },
        { id:'royal',     name:'Royal',     bg:'#0a0d24', bg2:'#13173a', text:'#e8eaff', accent:'#818cf8' },
        { id:'sunset',    name:'Sunset',    bg:'#1d0a16', bg2:'#2a0e1e', text:'#fde8f0', accent:'#f472b6' },
        { id:'industrial',name:'Industrial',bg:'#1c1c1c', bg2:'#262626', text:'#dcdcdc', accent:'#737373' },
        { id:'cyber',     name:'Cyber',     bg:'#08081a', bg2:'#0f0f24', text:'#d8f8ff', accent:'#00e8ff' }
    ];

    // Font presets — name → CSS variables (display + mono).
    const PC_FONTS = {
        tech:   { display:'Rajdhani, sans-serif',         mono:'Space Mono, monospace' },
        modern: { display:'Inter, sans-serif',            mono:'Inter, sans-serif' },
        serif:  { display:'Cormorant Garamond, serif',    mono:'Space Mono, monospace' },
        pixel:  { display:'Press Start 2P, monospace',    mono:'Press Start 2P, monospace' }
    };

    // ── Customization state — persisted to Store ──
    const PC_DEFAULTS = {
        nick:     '',
        themeId:  'obsidian',
        bg:       '#0a0a10',
        text:     '#edeef2',
        accent:   '#a855f7',
        pattern:  'grid',
        font:     'tech'
    };
    let pcState = Object.assign({}, PC_DEFAULTS, Store.getGlobal('pcState') || {});

    function pcSave(){ Store.setGlobal('pcState', pcState); window.dispatchEvent(new Event('bm-profile-change')); }

    // ── Open / close ──
    window.openStatsModal = function(){
        Snd.launch(440);
        buildPlayerCardUI();
        I18N.apply();
        applyPcState();
        renderPlayerCard();
        document.getElementById('stats-modal').classList.add('on');
    };
    window.closeStatsModal = function(){
        document.getElementById('stats-modal').classList.remove('on');
    };

    // Logo hover ticks
    const bmLogo = document.getElementById('bm-logo');
    if(bmLogo){
        bmLogo.addEventListener('mouseenter', () => Snd.tick(880));
    }

    // ── Build the customization UI that depends on JS data (themes) ──
    let pcUiBuilt = false;
    function buildPlayerCardUI(){
        if(pcUiBuilt) return;
        const sw = document.getElementById('pc-themes');
        PC_THEMES.forEach(t => {
            const b = document.createElement('button');
            b.className = 'pc-swatch';
            b.dataset.theme = t.id;
            b.title = t.name; b.setAttribute('aria-label',t.name);
            b.style.background = 'linear-gradient(135deg, ' + t.bg + ' 0% 50%, ' + t.accent + ' 50% 100%)';
            b.onclick = () => onThemeChange(t.id);
            sw.appendChild(b);
        });
        // Wire nickname input from state
        document.getElementById('pc-nick-in').setAttribute('aria-label',BM.text('Tu nombre de jugador','Your player name')); document.getElementById('pc-nick-in').value = pcState.nick;
        document.getElementById('pc-nick-count').textContent = pcState.nick.length;
        document.querySelectorAll('.pc-color-row').forEach(row=>{row.querySelector('label').htmlFor=row.querySelector('input').id;});
        document.querySelector('.pc-controls').setAttribute('aria-label',BM.text('Personalizar carta','Customize card'));
        pcUiBuilt = true;
    }

    // ── Apply current state to the card DOM + sidebar UI ──
    function applyPcState(){
        const card = document.getElementById('player-card');
        if(!card) return;
        card.style.setProperty('--pc-bg',     pcState.bg);
        card.style.setProperty('--pc-text',   pcState.text);
        card.style.setProperty('--pc-accent', pcState.accent);
        // Border + muted derive from bg/text (good contrast across themes)
        const muted = mixColors(pcState.text, pcState.bg, 0.45);
        const border = mixColors(pcState.text, pcState.bg, 0.85) + '22';   // ~13% opacity
        card.style.setProperty('--pc-muted',  muted);
        card.style.setProperty('--pc-border', border);
        card.dataset.pattern = pcState.pattern;
        const font = PC_FONTS[pcState.font] || PC_FONTS.tech;
        card.style.setProperty('--pc-font-display', font.display);
        card.style.setProperty('--pc-font-mono',    font.mono);

        // Sync sidebar UI
        const setIfExists = (id, prop, val) => {
            const el = document.getElementById(id);
            if(el) el[prop] = val;
        };
        setIfExists('pc-col-bg',     'value', pcState.bg);
        setIfExists('pc-col-text',   'value', pcState.text);
        setIfExists('pc-col-accent', 'value', pcState.accent);
        // Swatches
        document.querySelectorAll('#pc-themes .pc-swatch')
            .forEach(s => s.classList.toggle('on', s.dataset.theme === pcState.themeId));
        // Pattern pills
        document.querySelectorAll('#pc-patterns .pc-pill')
            .forEach(p => p.classList.toggle('on', p.dataset.pattern === pcState.pattern));
        // Font pills
        document.querySelectorAll('#pc-fonts .pc-pill')
            .forEach(p => p.classList.toggle('on', p.dataset.font === pcState.font));
    }

    // ── Mix two hex colors (used for derived border/muted tones) ──
    function mixColors(a, b, t){
        const pa = parseHex(a), pb = parseHex(b);
        const r = Math.round(pa[0]*(1-t) + pb[0]*t);
        const g = Math.round(pa[1]*(1-t) + pb[1]*t);
        const bl= Math.round(pa[2]*(1-t) + pb[2]*t);
        return '#' + [r,g,bl].map(x => x.toString(16).padStart(2,'0')).join('');
    }
    function parseHex(h){
        h = h.replace('#','');
        if(h.length===3) h = h.split('').map(c=>c+c).join('');
        return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    }

    // ── Event handlers from the sidebar ──
    function onNickChange(){
        const v = document.getElementById('pc-nick-in').value.slice(0,32);
        pcState.nick = v;
        document.getElementById('pc-nick-count').textContent = v.length;
        const nick = document.querySelector('#player-card .pc-nick');
        if(nick) nick.textContent = v;
        pcSave();
    }
    function onThemeChange(id){
        const t = PC_THEMES.find(x => x.id === id);
        if(!t) return;
        Snd.tick(880);
        pcState.themeId = id;
        pcState.bg = t.bg; pcState.text = t.text; pcState.accent = t.accent;
        applyPcState();
        pcSave();
    }
    function onColorChange(which, val){
        pcState[which] = val;
        pcState.themeId = 'custom';   // any manual color tweak detaches from preset
        document.querySelectorAll('#pc-themes .pc-swatch')
            .forEach(s => s.classList.remove('on'));
        applyPcState();
        pcSave();
    }
    function onPatternChange(p){
        Snd.tick(660);
        pcState.pattern = p;
        applyPcState();
        pcSave();
    }
    function onFontChange(f){
        Snd.tick(660);
        pcState.font = f;
        applyPcState();
        pcSave();
    }
    function resetPlayerCard(){
        Snd.tick(440);
        pcState = Object.assign({}, PC_DEFAULTS, { nick: pcState.nick });  // keep nick
        document.getElementById('pc-nick-in').setAttribute('aria-label',BM.text('Tu nombre de jugador','Your player name')); document.getElementById('pc-nick-in').value = pcState.nick;
        applyPcState();
        pcSave();
    }
    // Expose handlers (used by inline onclick attributes)
    window.onNickChange   = onNickChange;
    window.onColorChange  = onColorChange;
    window.onPatternChange= onPatternChange;
    window.onFontChange   = onFontChange;
    window.resetPlayerCard= resetPlayerCard;

    // ── Render the card content (data) ──
    function renderPlayerCard(){
        const card = document.getElementById('player-card');
        const modules = (window.BM && BM.MODULES) ? BM.MODULES : [];

        // Aggregate global counters from session logs
        let totalSessions = 0, totalTimeMs = 0;
        const sessionDates = new Set();
        const modulesPlayed = new Set();
        const records = [];   // [{name, label, display, unit}]

        modules.forEach(m => {
            const sessions = Store.getSessions(m.code) || [];
            if(sessions.length > 0){
                modulesPlayed.add(m.code);
                totalSessions += sessions.length;
                sessions.forEach(s => {
                    if(typeof s.durationSec === 'number') totalTimeMs += s.durationSec * 1000;
                    else if(typeof s.timeMs === 'number')  totalTimeMs += s.timeMs;
                    else if(typeof s.elapsedMs === 'number') totalTimeMs += s.elapsedMs;
                    else if(typeof s.duration === 'number') totalTimeMs += s.duration * 1000;
                    if(s.ts){
                        const d = new Date(s.ts);
                        sessionDates.add(d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate());
                    }
                });
            }
            // Eligible best from the latest comparable setup (same as home chip)
            const def = PC_METRICS[m.code];
            if(def){
                let val = null;
                if(def.prefix !== undefined){
                    const found = Store.getBestByPrefix(m.code, def.prefix, def.lower);
                    if(found) val = found.value;
                } else if(def.metric){
                    val = Store.getBest(m.code, def.metric);
                }
                if(val !== null && val !== undefined){
                    const display = def.decimals > 0 ? val.toFixed(def.decimals) : Math.round(val).toString();
                    records.push({
                        name: m.name,
                        label: def.label,
                        display: display,
                        unit: def.unit
                    });
                }
            }
        });

        const streak = computeStreak(sessionDates);
        const totalMin = Math.floor(totalTimeMs / 60000);
        const totalHr = Math.floor(totalMin / 60);
        const remainMin = totalMin % 60;
        const timeStr = totalHr > 0 ? totalHr + 'h ' + remainMin + 'm' : totalMin + 'm';
        const today = new Date();
        const dateStr = today.toISOString().slice(0,10);

        const L = (k) => I18N.t(k);

        if(totalSessions === 0){
            card.innerHTML = `
                <div class="pc-head">
                    <div>
                        <div class="pc-head-mark">${L('pc.head.mark')}</div>
                        <div class="pc-head-title">${L('pc.head.title.empty')}</div>
                        <div class="pc-head-sub">${L('pc.head.sub.empty')}</div>
                    </div>
                </div>
                <div class="pc-empty">
                    ${L('pc.empty.title')}<br><br>
                    <b>${L('pc.empty.cta')}</b>
                </div>
                <div class="pc-foot">
                    <div class="pc-nick">${escapeHtml(pcState.nick)}</div>
                    <div class="pc-watermark">buffmechanics.com</div>
                </div>
            `;
            return;
        }

        const recordsHTML = records.map(r => `
            <div class="pc-record">
                <span class="pc-record-name"><b>${escapeHtml(r.name)}</b>${r.label}</span>
                <span class="pc-record-val">${r.display}${r.unit ? '<small>'+r.unit+'</small>' : ''}</span>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="pc-head">
                <div>
                    <div class="pc-head-mark">${L('pc.head.mark')}</div>
                    <div class="pc-head-title">BUFF<em>MECHANICS</em></div>
                    <div class="pc-head-sub">${L('pc.head.sub')}</div>
                </div>
                <div class="pc-head-id">
                    <b>${dateStr}</b><br>
                    ${L('pc.head.id')}
                </div>
            </div>

            <div class="pc-section">
                <div class="pc-section-label">${L('pc.sec.summary')}</div>
                <div class="pc-stats-row">
                    <div class="pc-stat">
                        <div class="pc-stat-val acc">${totalSessions}</div>
                        <div class="pc-stat-lbl">${L('pc.stat.sessions')}</div>
                    </div>
                    <div class="pc-stat">
                        <div class="pc-stat-val">${timeStr}</div>
                        <div class="pc-stat-lbl">${L('pc.stat.time')}</div>
                    </div>
                    <div class="pc-stat">
                        <div class="pc-stat-val">${modulesPlayed.size}<small style="font-size:14px;opacity:.5"> / ${modules.length}</small></div>
                        <div class="pc-stat-lbl">${L('pc.stat.modules')}</div>
                    </div>
                    <div class="pc-stat">
                        <div class="pc-stat-val${streak>0?' acc':''}">${streak > 0 ? streak : '—'}</div>
                        <div class="pc-stat-lbl">${L('pc.stat.streak')}</div>
                    </div>
                </div>
            </div>

            ${records.length > 0 ? `
            <div class="pc-section">
                <div class="pc-section-label">${L('pc.sec.records')}</div>
                <div class="pc-records">${recordsHTML}</div>
            </div>
            ` : ''}

            <div class="pc-foot">
                <div class="pc-nick">${escapeHtml(pcState.nick)}</div>
                <div class="pc-watermark">buffmechanics.com</div>
            </div>
        `;
    }
    function escapeHtml(s){
        return String(s).replace(/[&<>"']/g, c =>
            ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]
        );
    }

    // Streak (unchanged from before)
    function computeStreak(sessionDates){
        if(sessionDates.size === 0) return 0;
        let streak = 0;
        const cur = new Date(); cur.setHours(0,0,0,0);
        const todayKey = cur.getFullYear()+'-'+(cur.getMonth()+1)+'-'+cur.getDate();
        const yest = new Date(cur); yest.setDate(yest.getDate() - 1);
        const yestKey = yest.getFullYear()+'-'+(yest.getMonth()+1)+'-'+yest.getDate();
        if(!sessionDates.has(todayKey) && !sessionDates.has(yestKey)) return 0;
        const start = sessionDates.has(todayKey) ? cur : yest;
        const probe = new Date(start);
        while(true){
            const k = probe.getFullYear()+'-'+(probe.getMonth()+1)+'-'+probe.getDate();
            if(sessionDates.has(k)){
                streak++;
                probe.setDate(probe.getDate() - 1);
            } else { break; }
        }
        return streak;
    }

    // ── Export the card as a PNG using html2canvas (lazy-loaded) ──
    function loadH2C(){
        const tag = document.getElementById('h2c-loader-tag');
        if(tag.dataset.loaded === '1' || window.html2canvas) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            const timeout=setTimeout(()=>{s.remove();reject(new Error('Renderer unavailable'));},15000);
            s.onload = () => { clearTimeout(timeout);tag.dataset.loaded = '1'; resolve(); };
            s.onerror = () => {clearTimeout(timeout);s.remove();reject(new Error('Renderer unavailable'));};
            document.head.appendChild(s);
        });
    }

    async function exportPlayerCard(){
        const btn = document.querySelector('.pc-btn.primary');
        const card = document.getElementById('player-card');
        if(!card) return;
        document.getElementById('pc-export-note')?.remove();
        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = I18N.t('pc.exporting');
        try{
            await loadH2C();
            // Render at 2x scale for retina-crisp output. backgroundColor=null
            // respects the card's own background so the PNG looks identical.
            const canvas = await html2canvas(card, {
                scale: 2,
                backgroundColor: null,
                logging: false,
                useCORS: true
            });
            const filename = 'buffmechanics-' + (pcState.nick.trim() || 'card').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,32).toLowerCase() + '.png';
            const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Empty image')), 'image/png'));
            {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(a.href), 1000);
                showToast();
            }
        } catch(e){
            console.error('Export failed:', e);
            const note=document.getElementById('pc-export-note')||document.createElement('p');note.id='pc-export-note';note.className='bm-error';note.setAttribute('role','status');note.textContent=BM.text('No se pudo crear la imagen. Comprueba tu conexión y vuelve a intentarlo.','Unable to create the image. Check your connection and try again.');btn.parentElement.append(note);
        } finally {
            btn.disabled = false;
            btn.textContent = original;
        }
    }
    function showToast(){
        const t = document.getElementById('pc-toast');
        t.classList.add('on');
        setTimeout(() => t.classList.remove('on'), 2200);
    }
    window.exportPlayerCard = exportPlayerCard;

    // Re-render card content + sidebar labels when language changes
    window.addEventListener('langchange', () => {
        if(document.getElementById('stats-modal').classList.contains('on')){
            renderPlayerCard();
        }
    });

window.BM.PlayerCard={open:window.openStatsModal,close:window.closeStatsModal};
document.addEventListener("keydown",e=>{if(e.key==="Escape")window.closeStatsModal();});
})();
