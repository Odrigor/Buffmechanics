/* Results, progress and the editable routine share the same session journal. */
(function () {
    'use strict';
    const H=BM.History, T=(es,en)=>BM.text(es,en);
    const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
    const moduleInfo=id=>BM.MODULES.find(m=>m.code===id);
    const base=()=>location.pathname.includes('/modulos/')?'../':'';
    const fmtTime=ms=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;
    const labels={
        aim:['Aciertos por segundo','Hits per second'], time:['Respuesta media','Mean response'],
        tracking:['Tiempo sobre el objetivo','Time on target'],clicktime:['Timing perfecto entre aciertos','Perfect timing among hits'],
        flicking:['Tiempo total por objetivo','Total time per target'],apm:['Tempo sostenido durante 10 aciertos','Tempo sustained over 10 hits'],
        typing:['Palabras netas por minuto','Net words per minute'],attention:['Puntuación de atención','Attention score'],
        stroop:['Respuesta correcta media','Mean correct response'],neurogrid:['Aciertos por minuto','Hits per minute'],
        pathpredict:['Precisión de predicción','Prediction accuracy'],vortex:['Precisión de respuesta','Response accuracy'],
        slidepuzzle:['Movimientos en el tablero de referencia','Moves on the reference board'],breathing:['Tiempo de respiración','Breathing time'],soundscape:['Tiempo de audio','Audio time']
    };
    const requirements={
        aim:['10 aciertos, 70% de precisión y 10 s activos','10 hits, 70% accuracy and 10 active seconds'],
        time:['5 respuestas de al menos 100 ms','5 responses of at least 100 ms'],
        tracking:['15 segundos activos y 1 segundo sobre el objetivo','15 active seconds and 1 second on target'],
        clicktime:['10 aciertos, 50% de cobertura y 70% de precisión','10 hits, 50% coverage and 70% accuracy'],
        flicking:['3 objetivos completados','3 completed targets'],
        apm:['10 aciertos consecutivos y 90% de precisión global','10 consecutive hits and 90% overall accuracy'],
        typing:['5 palabras enviadas y texto correcto retenido','5 submitted words and retained correct text'],
        attention:['5 aciertos y 15 segundos activos','5 hits and 15 active seconds'],
        stroop:['5 respuestas correctas y 80% de precisión','5 correct responses and 80% accuracy'],
        neurogrid:['3 aciertos y 70% de precisión','3 hits and 70% accuracy'],
        pathpredict:['5 predicciones','5 predictions'],vortex:['10 objetivos completados','10 completed targets'],
        slidepuzzle:['Resolver el tablero de referencia','Solve the reference board']
    };
    function status(r){
        if(r.status==='abandoned')return T('Interrumpida','Interrupted');
        if(r.status==='stopped')return T('Finalizada antes de tiempo','Stopped early');
        if(r.pauseCount)return T('Práctica con pausas','Practice with pauses');
        if(r.unstable)return T('Práctica con interrupción técnica','Practice with a timing interruption');
        if(r.moduleId==='breathing')return T('Sesión de respiración','Breathing session');
        if(r.moduleId==='soundscape')return T('Sesión de audio','Audio session');
        return r.recordEligible?T('Válida para récord','Eligible for a record'):T('Práctica · muestra insuficiente','Practice · insufficient sample');
    }
    const settingNames={style:['Estilo de audio','Audio style'],volume:['Volumen (%)','Volume (%)'],fixedDuration:['Duración fija sin penalización de tiempo','Fixed duration without time penalties'],time:['Duración','Duration'],duration:['Duración','Duration'],diff:['Dificultad','Difficulty'],challenge:['Modalidad','Mode'],mode:['Modo','Mode'],size:['Tamaño','Size'],speed:['Velocidad / intervalo','Speed / interval'],patterns:['Patrones','Patterns'],progOn:['Progresivo','Progressive'],pace:['Ritmo','Pace'],rounds:['Rondas','Rounds'],chaos:['Cambios de dirección','Direction changes'],thresh:['Umbral','Threshold'],hold:['Permanencia (ms)','Hold (ms)'],bpm:['BPM inicial','Initial BPM'],grow:['Aumento de BPM','BPM growth'],keyset:['Conjunto de teclas','Key set'],customKeys:['Teclas','Keys'],keys:['Teclas','Keys'],spawn:['Aparición (ms)','Spawn (ms)'],life:['Vida del objetivo (ms)','Target lifetime (ms)'],complexity:['Reglas','Rules'],pulses:['Pulsos','Pulses'],radius:['Radio','Radius'],response:['Ventana de respuesta (ms)','Response window (ms)'],conflict:['Conflicto (%)','Conflict (%)'],window:['Ventana (ms)','Window (ms)'],freq:['Frecuencia (ms)','Frequency (ms)'],react:['Respuesta (ms)','Response (ms)'],types:['Trayectorias','Trajectories'],protoId:['Protocolo','Protocol'],durId:['Ciclos','Cycles'],cue:['Sonido','Sound']};
    const values={normal:['Estándar','Standard'],custom:['Personalizada','Custom'],survival:['Supervivencia','Survival'],easy:['Fácil','Easy'],medium:['Media','Medium'],hard:['Difícil','Hard'],relaxed:['Pausado','Relaxed'],reflex:['Rápido','Reflex'],random:['Aleatorio','Random'],moving:['Móvil','Moving'],linear:['Lineal','Linear'],bounce:['Rebote','Bounce'],curve:['Curva','Curve'],zigzag:['Zigzag','Zigzag'],tones:['Tonos','Tones'],silent:['Silencio','Silent'],mixed:['Mixtas','Mixed']};
    const valueText=v=>Array.isArray(v)?v.map(valueText).join(', '):typeof v==='boolean'?(v?T('Sí','Yes'):T('No','No')):values[v]?T(...values[v]):String(v);
    function configSummary(r){const c=r.config.settings||{};return [valueText(c.diff||c.mode||c.pace||c.challenge||''),c.time||c.duration?`${c.time||c.duration} s`:c.rounds?`${c.rounds} ${T('rondas','rounds')}`:'',r.config.arena?`${r.config.arena.width} × ${r.config.arena.height}`:''].filter(Boolean).join(' · ');}
    function configDetails(r){
        const d=el('details','bm-config'),s=el('summary','',T('Ver configuración completa','View full setup'));d.append(s);
        const dl=el('dl');Object.entries(r.config.settings||{}).forEach(([k,v])=>{dl.append(el('dt','',settingNames[k]?T(...settingNames[k]):k),el('dd','',valueText(v)));});
        if(r.config.arena)dl.append(el('dt','',T('Área de pantalla','Screen area')),el('dd','',`${r.config.arena.width} × ${r.config.arena.height} px`));
        d.append(dl);return d;
    }
    BM.showSessionResult=function(session){
        const r=session.record;if(!r)return;
        document.querySelectorAll('.bm-result').forEach(e=>e.remove());
        const host=document.querySelector('#res .rcard, #res .result-card')||document.getElementById('res')||document.getElementById('end');
        if(!host)return;
        if(r.moduleId!=='time')host.querySelectorAll('.res-evo').forEach(e=>e.hidden=true);
        const box=el('section','bm-result');box.setAttribute('aria-label',T('Resumen de sesión','Session summary'));
        const badge=el('p','bm-status',status(r));badge.dataset.eligible=String(r.recordEligible);box.append(badge);
        box.append(el('p','',`${T('Tiempo activo','Active time')}: ${fmtTime(r.activeDurationMs)} · ${T('Pausas','Pauses')}: ${r.pauseCount} (${fmtTime(r.pauseDurationMs)})`));
        const def=H.metricDefs[r.moduleId];
        if(def?.[2] && !(r.data[def[0]]>0))host.querySelectorAll('#r-primary,#r-avg').forEach(e=>e.textContent='—');
        const prior=H.sessions(r.moduleId,r.configSignature).filter(s=>s.recordEligible&&s.sessionId!==r.sessionId);
        let comparison=T('Esta sesión se conserva en tu progreso.','This session is kept in your progress.');
        if(r.recordEligible&&def){
            if(!prior.length)comparison=T('Primera marca válida para esta configuración.','First eligible result for this setup.');
            else {
                const previous=prior.reduce((a,b)=>(def[2]?b.data[def[0]]<a.data[def[0]]:b.data[def[0]]>a.data[def[0]])?b:a);
                const delta=r.data[def[0]]-previous.data[def[0]];
                comparison=(delta===0?T('Igualaste tu récord','You matched your record'):(def[2]?delta<0:delta>0)?T('Nuevo récord personal','New personal record'):T('Récord comparable','Comparable record'))+': '+H.format(previous)+` · ${prior.length} ${T('sesiones previas válidas','previous eligible sessions')}`;
            }
        }else if(requirements[r.moduleId]&&!r.pauseCount&&!r.unstable){comparison=T('Para registrar una marca: ','Record requirements: ')+T(...requirements[r.moduleId])+'.';}
        document.querySelectorAll('#r-compare').forEach(e=>{e.className='res-compare';e.textContent=comparison;});
        box.append(el('p','',comparison));
        if(r.pauseCount&&def)box.append(el('p','',T('El récord exige una ejecución continua. La pausa conserva los estímulos y el tiempo restante.','Records require an uninterrupted run. Pausing preserves stimuli and remaining time.')));
        if(r.unstable)box.append(el('p','',T('Se detectó un salto de tiempo o un cambio de tamaño de pantalla. Repite la sesión para obtener una marca comparable.','A timing gap or screen resize was detected. Repeat the session for a comparable record.')));
        const extra=[];
        if(r.moduleId==='clicktime')extra.push(`${T('Cobertura','Coverage')}: ${r.data.coverage||0}% (${r.data.hits||0}/${r.data.spawned||0})`,`${T('Precisión de clic','Click accuracy')}: ${r.data.acc||0}%`);
        if(r.moduleId==='time')extra.push(`${T('Válidas','Valid')}: ${r.data.validCount||0}`,`${T('Salidas anticipadas','False starts')}: ${r.data.falseStarts||0}`,`${T('Respuestas <100 ms excluidas','Responses <100 ms excluded')}: ${r.data.anticipations||0}`);
        if(r.moduleId==='flicking' && r.data.completed>0)extra.push(`${T('Llegada','Arrival')}: ${r.data.avgArrival||0} ms`,`${T('Ajuste posterior','Subsequent adjustment')}: ${r.data.avgSettle||0} ms`,`${T('Permanencia exigida','Required hold')}: ${r.data.avgHold||0} ms`);
        if(extra.length)box.append(el('p','bm-secondary',extra.join(' · ')));
        box.append(el('p','bm-muted',configSummary(r)),configDetails(r));
        const link=el('a','bm-link',T('Abrir Mi progreso →','Open My progress →'));link.href=`${base()}progress.html?module=${r.moduleId}`;box.append(link);
        if(H.writeError)box.append(el('p','bm-error',T('No se pudo guardar en este navegador. Exporta tu progreso antes de cerrar esta pestaña.','Unable to save in this browser. Export your progress before closing this tab.')));
        host.append(box);BM.Routine.complete(r,box);
    };

    function buildProgress(){BM.Workspace?.progress({status,configDetails,configSummary,labels,appendBackups});}
    function appendBackups(root){
        const old=el('details','bm-legacy');old.append(el('summary','',T('Historial anterior a esta beta','History from before this beta')),el('p','',T('Estos antecedentes no compiten con los nuevos récords. La configuración y las duraciones ausentes siguen siendo desconocidas.','These past results do not compete with new records. Missing setup and duration remain unknown.')));
        const oldRows=BM.MODULES.flatMap(m=>H.legacy.getSessions(m.code).map(r=>({m,r}))).sort((a,b)=>(b.r.ts||0)-(a.r.ts||0));
        old.append(el('p','',`${oldRows.length} ${T('registros anteriores disponibles','available past records')}`));
        oldRows.slice(0,50).forEach(({m,r})=>{const line=el('details');line.append(el('summary','',`${m.name} · ${r.ts?new Date(r.ts).toLocaleDateString(I18N.lang):T('Fecha desconocida','Unknown date')}`),el('pre','',JSON.stringify(r,null,2)));old.append(line);});root.append(old);
        root.append(el('h2','',T('Respaldo de tu progreso','Back up your progress')),el('p','',T('Los datos pertenecen a este navegador. Exporta una copia para conservarlos o llevarlos a otro equipo.','Data belongs to this browser. Export a copy to keep it or move it to another computer.')));
        const actions=el('div','bm-actions'),exportBtn=el('button','bm-primary',T('Exportar respaldo','Export backup')),importBtn=el('button','bm-button',T('Importar respaldo','Import backup')),file=el('input'),notice=el('p','bm-feedback');notice.setAttribute('role','status');file.type='file';file.accept='.json,application/json';file.hidden=true;
        exportBtn.onclick=()=>{const a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(H.export(),null,2)],{type:'application/json'}));a.download=`buffmechanics-progreso-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};importBtn.onclick=()=>file.click();
        file.onchange=async()=>{try{const f=file.files[0];if(!f)return;if(f.size>20*1024*1024)throw Error(T('El archivo supera 20 MB.','File exceeds 20 MB.'));const data=JSON.parse(await f.text()),preview=H.inspectImport(data);notice.replaceChildren(el('span','',`${preview.additions} ${T('sesiones nuevas. Se conservará una copia del estado actual.','new sessions. A copy of the current state will be kept.')}`));const confirm=el('button','bm-primary',T('Confirmar importación','Confirm import'));confirm.onclick=()=>{try{H.import(data);buildProgress();}catch(e){notice.textContent=e.message;}};notice.append(confirm);}catch(e){notice.textContent=T('No se importó el archivo: ','File was not imported: ')+e.message;}};
        const restore=el('button','bm-button',T('Restaurar copia previa a la importación','Restore the pre-import copy'));restore.onclick=()=>{notice.replaceChildren(el('span','',T('Se reemplazarán las sesiones nuevas por la copia anterior. Exporta primero si deseas conservar el estado actual.','New sessions will be replaced by the earlier copy. Export first if you want to keep the current state.')));const yes=el('button','bm-button',T('Restaurar ahora','Restore now'));yes.onclick=()=>{try{H.restoreBeforeImport();buildProgress();}catch(e){notice.textContent=e.message;}};notice.append(yes);};
        actions.append(exportBtn,importBtn);if(Store.get('training:before-import'))actions.append(restore);root.append(actions,file,notice,el('p','bm-muted',T('Los acumulados completos comienzan con esta beta. Los ejercicios describen tu ejecución aquí; no miden transferencia a otro juego.','Complete totals start with this beta. Exercises describe your performance here; they do not measure transfer to another game.')));
    }
    function buildRoutine(){BM.Workspace?.routine({status,configDetails,configSummary});}

    const extraDictionary={
        'Score':'Puntuación','Accuracy':'Precisión','Random':'Aleatorio','Sides':'Laterales','Cursor Circle':'Cerca del cursor','Moving H/V':'Movimiento H/V','Bounce':'Rebote','Appear anywhere — trains flicks':'Aparecen por toda la pantalla','Enter from screen edges — trains peeks':'Entran desde los bordes','Spawn near cursor — trains microadjust':'Aparecen cerca del cursor','Move in a line — trains linear skillshots':'Se desplazan en línea recta','Move and bounce — trains erratic tracking':'Se desplazan y rebotan','← BACK':'← VOLVER','Play or pause':'Reproducir o pausar','PROTOCOL':'AMBIENTE','MODE':'MODO','NO RECORD':'SIN MARCA','LAUNCH →':'INICIAR →','OPEN →':'ABRIR →','SEARCHING':'BUSCANDO','Click anywhere to enable sound':'Haz clic para activar el sonido',
        'Ambient sound · your own pace':'Sonido ambiental · a tu ritmo',
        'Choose a sound environment and a texture. Keep this page in a dedicated tab for background audio; leaving the page stops playback. No cognitive effect is measured.':'Elige un ambiente y una textura. Mantén esta página en una pestaña dedicada para escuchar de fondo; el audio se detiene al salir. No se mide ningún efecto cognitivo.',
        'A rhythmic environment at 120 BPM.':'Un ambiente rítmico a 120 BPM.','A steady rhythm at 80 BPM.':'Un ritmo constante a 80 BPM.','A slow environment at 60 BPM.':'Un ambiente pausado a 60 BPM.',
        'Two tones with a 40 Hz difference. Use headphones.':'Dos tonos con una diferencia de 40 Hz. Usa auriculares.','Two tones with a 10 Hz difference. Use headphones.':'Dos tonos con una diferencia de 10 Hz. Usa auriculares.',
        'Paced breathing guide':'Guía de respiración pautada','Breathing session complete':'Sesión de respiración completada',
        'Four equal phases, four seconds each.':'Cuatro fases iguales, de cuatro segundos.','Inhale 4 s, hold 7 s, exhale 8 s.':'Inhala 4 s, mantén 7 s, exhala 8 s.','Inhale and exhale for six seconds.':'Inhala y exhala durante seis segundos.','Short holds of two seconds.':'Pausas breves de dos segundos.',
        '3 CYCLES':'3 CICLOS','5 CYCLES':'5 CICLOS','10 CYCLES':'10 CICLOS','OPEN':'LIBRE','COHERENCE':'CONTINUA','QUICK':'BREVE','▷ headphones':'▷ auriculares','✕ stop':'✕ detener','Now playing':'Reproduciendo',
        'PHASE 1 · BREATHE IN':'FASE 1 · INHALA','PHASE 3 · BREATHE OUT':'FASE 3 · EXHALA','PHASE 1 · INHALE':'FASE 1 · INHALA','PHASE 2 · HOLD':'FASE 2 · MANTÉN','PHASE 3 · EXHALE':'FASE 3 · EXHALA','PHASE 4 · HOLD':'FASE 4 · MANTÉN','CYCLE':'CICLO','PAUSED':'EN PAUSA','SWITCH MODULE':'CAMBIAR EJERCICIO','Pick another · resume · or exit':'Elige otro · reanuda · o sal',
        'EXIT TO HOME':'SALIR AL INICIO','RESUME':'REANUDAR','Press ESC to resume':'Pulsa ESC para reanudar',
        'BEGIN':'COMENZAR','STOP':'DETENER','PAUSE':'PAUSA','READY':'LISTO','STOPPED':'DETENIDA','AGAIN':'REPETIR','EXIT':'SALIR','MENU':'MENÚ',
        'Sound cues':'Señales sonoras','Tones':'Tonos','Silent':'Silencio','Cycles':'Ciclos','Duration':'Duración','Protocol':'Protocolo',
        'INHALE':'INHALA','EXHALE':'EXHALA','HOLD':'MANTÉN','Inhale':'Inhala','Exhale':'Exhala','Hold':'Mantén',
        'SESSION COMPLETE':'SESIÓN COMPLETADA','SESSION STOPPED':'SESIÓN DETENIDA','← BACK TO MENU':'← VOLVER AL MENÚ','← back':'← volver',
        'Sit upright. Loosen jaw. Breathe through the nose if possible.':'Siéntate erguido. Relaja la mandíbula. Respira por la nariz si te resulta cómodo.',
        'Try again when ready':'Repite cuando quieras','Choose the sonic vehicle':'Elige una textura sonora',
        'Pre-session':'Antes de la sesión','During mechanical training':'Durante la práctica','Cognitive modules':'Ejercicios cognitivos','Fine attention':'Atención al detalle','Between rounds':'Entre rondas',
        'All modules':'Todos los ejercicios','Mechanical':'Mecánica','Cognitive':'Cognitivo','Headphones required':'Requiere auriculares','HEADPHONES':'AURICULARES',
        'ACTIVATE':'ACTIVACIÓN','DEEP WORK':'TRABAJO PAUSADO','PRECISION':'PRECISIÓN','RECOVER':'DESCANSO','CINEMATIC':'CINEMÁTICO',
        'warm':'cálido','walking bass':'bajo caminante','brush hat':'escobillas','rain':'lluvia','wind':'viento','birds':'aves','vinyl':'vinilo','mellow':'suave','tape':'cinta','toms':'tambores','shakers':'maracas','polyrhythm':'polirritmo','drone':'tono continuo','sub bass':'subgrave','pad':'colchón sonoro',
        'Click for next round':'Haz clic para la siguiente ronda','Click to see results':'Haz clic para ver los resultados',"don't click yet":'No hagas clic todavía','click only when green':'Haz clic solo cuando esté verde',
        'PERFECT':'PERFECTO','GREAT':'MUY BIEN','GOOD':'BIEN','LATE':'TARDE','MISS':'FALLO'
    };
    const translatedNodes=new WeakMap();
    function extras(root){
        const audioLabel='[aria-label="Play or pause"],[aria-label="Reproducir o pausar"]';
        const audioButtons=[...(root.querySelectorAll?.(audioLabel)||[])];if(root.matches?.(audioLabel))audioButtons.push(root);
        audioButtons.forEach(e=>e.setAttribute('aria-label',T('Reproducir o pausar','Play or pause')));
        const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
        while((node=walk.nextNode())){
            if(node.parentElement?.closest('script,style,pre,code,[data-i18n],[data-i18n-html]'))continue;
            let text=node.nodeValue.trim(),entry=translatedNodes.get(node);
            if(entry&&text!==entry.en&&text!==entry.es)entry=null;
            if(!entry){const translated=extraDictionary[text]||text.split(' · ').map(part=>extraDictionary[part]||part).join(' · ');if(translated!==text){entry={en:text,es:translated};translatedNodes.set(node,entry);}}
            if(entry){const value=T(entry.es,entry.en);if(text!==value)node.nodeValue=node.nodeValue.replace(text,value);}
        }
    }
    function accessible(root=document){
        root.querySelectorAll('[onclick],.qs-tile,.card[data-url],.mcard .mc-body,.scard,.proto-row .pcard,.dur-row .pcard,.style-card,.mode-card,.proto-btn,.dur-btn,.pat-check').forEach(e=>{
            if(!/^(BUTTON|A|INPUT|SELECT|OPTION)$/.test(e.tagName)&&!e.querySelector('button,input,select,a[href]')&&!e.parentElement?.closest('[role="button"]')){e.setAttribute('role','button');e.tabIndex=0;}
        });
        root.querySelectorAll('input[type="range"]').forEach(e=>{if(!e.getAttribute('aria-label'))e.setAttribute('aria-label',e.closest('.tune-row,.sl-row,.slider-group,.tune-group')?.textContent.trim().slice(0,100)||e.id);});
    }
    const focusState=new WeakMap();
    function dialogs(){document.querySelectorAll('.qs-overlay,.stats-modal,.set-overlay,#modal').forEach(d=>{const open=d.classList.contains('on')||d.classList.contains('open');d.inert=!open;if(open&&!focusState.has(d)){focusState.set(d,document.activeElement);d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label',d.querySelector('.qs-title,.modal-name')?.textContent||T('Mi tarjeta','My card'));setTimeout(()=>{if(focusState.has(d))(d.querySelector('.qs-action[data-act=resume]')||d.querySelector('button,[tabindex="0"],a[href]'))?.focus();},350);}else if(!open&&focusState.has(d)){const old=focusState.get(d);focusState.delete(d);d.removeAttribute('aria-modal');old?.focus();}});}
    document.addEventListener('keydown',e=>{
        if((e.key==='Enter'||e.key===' ')&&e.target.getAttribute('role')==='button'){e.preventDefault();e.target.click();}
        if(e.key!=='Tab')return;const dialog=[...document.querySelectorAll('[aria-modal="true"]')].find(d=>focusState.has(d));if(!dialog)return;
        const items=[...dialog.querySelectorAll('button:not([disabled]),a[href],[tabindex="0"],input,select')].filter(e=>e.getClientRects().length);if(!items.length)return;
        if(!dialog.contains(document.activeElement)){e.preventDefault();items[0].focus();return;}
        if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus();}
    });
    function init(){
        const title=document.querySelector('.setup h1,.setup-title,.stitle,.ss-title');if(!document.querySelector('h1')&&title){const h=el('h1','bm-sr-only',document.title);document.body.prepend(h);}
        document.querySelectorAll('#setup').forEach(s=>{if(/typing/.test(location.pathname))s.append(el('p','bm-session-notice',T('El vocabulario de esta prueba está en inglés. El reloj comienza con la primera letra.','This test uses English vocabulary. The clock starts with the first letter.')));if(/slidepuzzle/.test(location.pathname))s.append(el('p','bm-session-notice',T('Cada dificultad repite un tablero de referencia para comparar movimientos.','Each difficulty repeats a reference board to compare moves.')));});
        buildProgress();buildRoutine();BM.Workspace?.home();accessible();extras(document.body);dialogs();
        window.addEventListener('langchange',()=>{buildProgress();buildRoutine();BM.Workspace?.home();if(BM.session?.finished)BM.showSessionResult(BM.session);extras(document.body);});
        new MutationObserver(mutations=>{for(const m of mutations){if(m.type==='childList'){m.addedNodes.forEach(n=>{if(n.nodeType===1){accessible(n);extras(n);}else if(n.nodeType===3&&n.parentElement)extras(n.parentElement);});}else if(m.type==='characterData'&&m.target.parentElement)extras(m.target.parentElement);}dialogs();}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
