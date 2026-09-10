/* ============================================================================
   BuffMechanics — i18n (internationalization) base system
   ----------------------------------------------------------------------------
   A tiny, dependency-free translation layer shared across all pages.

   How it works
   ------------
   - Strings live in the I18N.dict object, keyed by a dotted path
     (e.g. "home.support"). Each key maps to { es, en }.
   - HTML elements opt in with data-i18n attributes:
       <span data-i18n="home.support"></span>        → sets textContent
       <input data-i18n-ph="search.placeholder">      → sets placeholder
       <div data-i18n-html="info.intro"></div>        → sets innerHTML
       <a data-i18n-aria="nav.back">                   → sets aria-label
   - Call I18N.apply() to fill the page; call I18N.set('es'|'en') to switch.
   - Language is detected once (localStorage → browser → 'en') and persisted.

   Why a flat dict with {es,en} per key (instead of two separate dicts)?
   - Keeps each phrase's translations side by side, so a missing translation is
     obvious when editing and never silently falls back to the wrong language.

   Adding a new page: include this file, add your keys to the dict, sprinkle
   data-i18n attributes, and call I18N.apply() after DOM load.
   ========================================================================== */

const I18N = {
    // Active language code: 'es' | 'en'
    lang: 'en',

    // Storage key for the user's explicit choice
    _storeKey: 'bm_lang',

    // ---- Dictionary -------------------------------------------------------
    // Add keys here. Every key MUST have both es and en.
    dict: {
        // ── Home: section tags + headers ──
        'home.tagline':        { es: 'Mejora tus habilidades', en: 'Improve your skills' },
        'home.sec.mech':       { es: 'MECÁNICA', en: 'MECHANICAL' },
        'home.sec.cog':        { es: 'COGNITIVO', en: 'COGNITIVE' },
        'home.sec.amb':        { es: 'AMBIENTE',  en: 'AMBIENT' },
        'home.sec.info':       { es: 'INFO',      en: 'INFO' },
        'home.sec.mech.sub':   { es: 'Puntería, timing y control del cursor',
                                 en: 'Aim, timing and cursor control' },
        'home.sec.cog.sub':    { es: 'Atención, inhibición y procesamiento visual',
                                 en: 'Attention, inhibition and visual processing' },
        'home.sec.amb.sub':    { es: 'Utilidades para enfoque y recuperación',
                                 en: 'Utilities for focus and recovery' },
        'home.sec.info.sub':   { es: 'Cómo funciona, la ciencia, y cómo apoyar',
                                 en: 'How it works, the science, and how to support' },

        // Section display names (the longer label next to each tag)
        'home.sec.mech.name':  { es: 'Mecánica de Hardware', en: 'Hardware Mechanics' },
        'home.sec.cog.name':   { es: 'Procesamiento Cognitivo', en: 'Cognitive Processing' },
        'home.sec.amb.name':   { es: 'Entorno Ambiental', en: 'Ambient Environment' },
        'home.sec.info.name':  { es: 'Información y Ciencia', en: 'Information & Science' },

        // ── Home: Info cards ──
        'home.info.howto.title':   { es: 'Cómo funciona', en: 'How it works' },
        'home.info.howto.desc':    { es: 'Qué entrena cada módulo y cómo se nota la mejora',
                                     en: 'What each module trains and how improvement shows up' },
        'home.info.howto.tag':     { es: 'Guía de módulos', en: 'Module guide' },
        'home.info.science.title': { es: 'La ciencia', en: 'The science' },
        'home.info.science.desc':  { es: 'Evidencia real, presentada con honestidad',
                                     en: 'Real evidence, presented honestly' },
        'home.info.science.tag':   { es: 'Basado en evidencia', en: 'Evidence-based' },
        'home.info.support.title': { es: 'Apoyar', en: 'Support' },
        'home.info.support.desc':  { es: 'Cómo sostener el proyecto si te sirve',
                                     en: 'How to keep the project alive if it helps you' },
        'home.info.support.tag':   { es: 'Mantenlo vivo', en: 'Keep it alive' },

        // ── Shared / nav ──
        'nav.back':            { es: '← Volver al menú', en: '← Back to menu' },
        'nav.home':            { es: 'Inicio', en: 'Home' },
        'nav.progress':        { es: 'Mi progreso', en: 'My progress' },
        'common.support':      { es: 'Apoyar el proyecto', en: 'Support this project' },

        // ── Settings overlay ──
        'set.config':          { es: 'CONFIGURACIÓN', en: 'CONFIGURATION' },
        'set.title':           { es: 'Ajustes', en: 'Settings' },
        'set.sound':           { es: 'Sonido', en: 'Sound' },
        'set.sound.hint':      { es: 'Feedback de UI + audio de módulos', en: 'UI feedback + module audio' },
        'set.volume':          { es: 'Volumen', en: 'Volume' },
        'set.volume.hint':     { es: 'Nivel de salida maestro', en: 'Master output level' },
        'set.mouse.game':      { es: 'Perfil de sensibilidad', en: 'Sensitivity profile' },
        'set.mouse.game.hint': { es: 'Se usa globalmente para simular el recoil', en: 'Used globally to simulate recoil' },
        'set.mouse.speed':     { es: 'Sensibilidad del juego', en: 'In-game sensitivity' },
        'set.mouse.speed.hint':{ es: 'Ajusta Recoil Train, no tu ratón', en: 'Adjusts Recoil Train, not your mouse' },
        'set.language':        { es: 'Idioma', en: 'Language' },
        'set.language.hint':   { es: 'Idioma de la interfaz', en: 'Interface language' },
        'set.footer':          { es: 'Más opciones en camino. Los ajustes persisten entre sesiones.',
                                 en: 'More options coming. Settings persist across sessions.' },

        // ── Module cards (home grid) — title / desc / tag per module ──
        'card.aim.title':      { es: 'Aim Protocol', en: 'Aim Protocol' },
        'card.aim.desc':       { es: 'Flicking de precisión y microajustes de memoria muscular.', en: 'Precision flicking and muscle memory micro-adjustments.' },
        'card.aim.tag':        { es: 'Alta intensidad', en: 'High Intensity' },
        'card.time.title':     { es: 'Reaction Time', en: 'Reaction Time' },
        "card.time.desc": {"es": "Responde a una señal visual. Compara tus propias sesiones.", "en": "Respond to a visual cue. Compare your own sessions."},
        'card.time.tag':       { es: 'Velocidad pura', en: 'Pure Speed' },
        'card.tracking.title': { es: 'Smooth Tracking', en: 'Smooth Tracking' },
        'card.tracking.desc':  { es: 'Seguimiento sostenido de objetivos en trayectorias fluidas.', en: 'Sustained target acquisition on fluid trajectories.' },
        'card.tracking.tag':   { es: 'Consistencia', en: 'Consistency' },
        'card.clicktime.title':{ es: 'Click Timing', en: 'Click Timing' },
        'card.clicktime.desc': { es: 'Sincronización del disparo en el instante exacto.', en: 'Fire synchronization at peak trajectory moments.' },
        'card.clicktime.tag':  { es: 'Precisión temporal', en: 'Temporal Precision' },
        'card.flicking.title': { es: 'Anti-Flick Stability', en: 'Anti-Flick Stability' },
        "card.flicking.desc": {"es": "Practica llegar, frenar y mantener el cursor estable.", "en": "Practice arriving, stopping and holding the cursor steady."},
        'card.flicking.tag':   { es: 'Control', en: 'Control' },
        'card.apm.title':      { es: 'APM Burst', en: 'APM Burst' },
        'card.apm.desc':       { es: 'Cadencia y ritmo de teclas bajo BPM creciente.', en: 'Keystroke cadence and rhythm under escalating BPM.' },
        'card.apm.tag':        { es: 'Resistencia', en: 'Stamina' },
        'card.typing.title':   { es: 'Typing Speed', en: 'Typing Speed' },
        'card.typing.desc':    { es: 'Palabras por minuto con vocabulario de mentalidad competitiva.', en: 'Words per minute with a competitive mindset wordlist.' },
        'card.typing.tag':     { es: 'Velocidad de tecleo', en: 'Keystroke Speed' },
        'card.attention.title':{ es: 'Attention Split', en: 'Attention Split' },
        'card.attention.desc': { es: 'Multitarea de doble foco. Sigue y reacciona a la vez.', en: 'Dual-focus multitasking. Track and react simultaneously.' },
        'card.attention.tag':  { es: 'Foco dividido', en: 'Divided Focus' },
        'card.stroop.title':   { es: 'Stroop Test', en: 'Stroop Test' },
        'card.stroop.desc':    { es: 'Control inhibitorio. Procesá información en conflicto bajo presión.', en: 'Inhibitory control. Process conflicting information under pressure.' },
        'card.stroop.tag':     { es: 'Filtrado mental', en: 'Mental Filtering' },
        'card.neurogrid.title':{ es: 'NeuroGrid', en: 'NeuroGrid' },
        'card.neurogrid.desc': { es: 'Escaneo visual por reglas y decisión rápida.', en: 'Rule-based visual scanning and rapid decision making.' },
        'card.neurogrid.tag':  { es: 'Escaneo visual', en: 'Visual Scanning' },
        'card.pathpredict.title':{ es: 'Path Predict', en: 'Path Predict' },
        'card.pathpredict.desc': { es: 'Anticipación de trayectorias. Lee el movimiento, predice el destino.', en: 'Trajectory anticipation. Read movement, predict destination.' },
        'card.pathpredict.tag':  { es: 'Anticipación', en: 'Anticipation' },
        'card.vortex.title':     { es: 'Vortex', en: 'Vortex' },
        'card.vortex.desc':      { es: 'Coordinación apuntar-ejecutar. La dirección del mouse se encuentra con la tecla.', en: 'Aim-and-execute coordination. Mouse direction meets keypress.' },
        'card.vortex.tag':       { es: 'Coordinación', en: 'Coordination' },

        // ── Index record chips — labels show the *real* metric trained ──
        // Each module's chip uses its own metric (HPS, ms, %, bpm, /min, wpm)
        // instead of a generic "score" — so the index reflects what you
        // actually train. Labels are short to fit in mono caps.
        'idx.best.hps':      { es: 'MEJOR HPS',     en: 'BEST HPS' },        // hits/sec — Aim
        'idx.best.avg':      { es: 'MEJOR PROM',    en: 'BEST AVG' },        // avg ms — Time
        'idx.best.lock':     { es: 'MEJOR LOCK',    en: 'BEST LOCK' },       // tracking efficiency %
        'idx.best.perfect':  { es: 'MEJOR PERFECT', en: 'BEST PERFECT' },    // clicktime perfect %
        "idx.best.stab": {"es": "MEJOR TIEMPO", "en": "BEST TARGET TIME"},  // flicking ms
        "idx.best.peak": {"es": "TEMPO SOSTENIDO", "en": "SUSTAINED TEMPO"},       // apm peak bpm
        'idx.best.wpm':      { es: 'MEJOR WPM',     en: 'BEST WPM' },        // typing
        'idx.best.focus':    { es: 'MEJOR FOCO',    en: 'BEST FOCUS' },      // attention focus score
        'idx.best.rt':       { es: 'MEJOR RT',      en: 'BEST RT' },         // stroop reaction time
        'idx.best.hpm':      { es: 'MEJOR HPM',     en: 'BEST HPM' },        // neurogrid hits/min
        'idx.best.accuracy': { es: 'MEJOR PRECISIÓN', en: 'BEST ACCURACY' }, // pathpredict, vortex
        'idx.best.moves':    { es: 'MENOS MOV',     en: 'FEWEST MOVES' },    // slidepuzzle
        'idx.best.none':     { es: 'SIN RÉCORD',    en: 'NO RECORD' },

        // ── Player card (the dossier modal opened from the B logo) ──
        // Sidebar
        'pc.customize':      { es: 'PERSONALIZAR',     en: 'CUSTOMIZE' },
        'pc.close':          { es: 'CERRAR',           en: 'CLOSE' },
        'pc.nick':           { es: 'TU TAG',           en: 'YOUR TAG' },
        'pc.theme':          { es: 'TEMA',             en: 'THEME' },
        'pc.colors':         { es: 'COLORES CUSTOM',   en: 'CUSTOM COLORS' },
        'pc.col.bg':         { es: 'Fondo',            en: 'Background' },
        'pc.col.text':       { es: 'Texto',            en: 'Text' },
        'pc.col.accent':     { es: 'Acento',           en: 'Accent' },
        'pc.pattern':        { es: 'PATRÓN DE FONDO',  en: 'BACKGROUND PATTERN' },
        'pc.pat.solid':      { es: 'Sólido',           en: 'Solid' },
        'pc.pat.grid':       { es: 'Grilla',           en: 'Grid' },
        'pc.pat.diag':       { es: 'Líneas',           en: 'Lines' },
        'pc.pat.noise':      { es: 'Ruido',            en: 'Noise' },
        'pc.font':           { es: 'TIPOGRAFÍA',       en: 'TYPOGRAPHY' },
        'pc.export':         { es: 'EXPORTAR PNG',     en: 'EXPORT AS PNG' },
        'pc.exporting':      { es: 'EXPORTANDO…',      en: 'EXPORTING…' },
        'pc.reset':          { es: 'RESET ESTILO',     en: 'RESET STYLE' },
        'pc.saved':          { es: 'IMAGEN GUARDADA',  en: 'CARD SAVED' },
        // Card itself
        'pc.head.mark':      { es: 'CARTA DE JUGADOR · DOSSIER', en: 'PLAYER CARD · DOSSIER' },
        'pc.head.sub':       { es: 'SUITE DE ENTRENAMIENTO COMPETITIVO',  en: 'COMPETITIVE TRAINING SUITE' },
        'pc.head.id':        { es: 'PERFIL · LOCAL',       en: 'PROFILE · LOCAL' },
        'pc.head.title.empty':{ es:'BUFF MECHANICS',   en: 'BUFF MECHANICS' },
        'pc.head.sub.empty': { es: 'AÚN SIN ENTRENAMIENTO', en: 'NO TRAINING YET' },
        'pc.sec.summary':    { es: 'RESUMEN',          en: 'SUMMARY' },
        'pc.sec.records':    { es: 'MEJORES RÉCORDS',  en: 'BEST RECORDS' },
        'pc.stat.sessions':  { es: 'SESIONES',         en: 'SESSIONS' },
        'pc.stat.time':      { es: 'TIEMPO ENTRENADO', en: 'TIME TRAINED' },
        'pc.stat.modules':   { es: 'MÓDULOS',          en: 'MODULES' },
        'pc.stat.streak':    { es: 'RACHA · DÍAS',     en: 'STREAK · DAYS' },
        'pc.empty.title':    { es: 'AÚN NO HAY SESIONES REGISTRADAS', en: 'NO TRAINING SESSIONS YET' },
        'pc.empty.cta':      { es: 'ENTRENA UN MÓDULO PARA EMPEZAR', en: 'TRAIN A MODULE TO START' },
        'card.slidepuzzle.title':{ es: 'Slide Puzzle', en: 'Slide Puzzle' },
        'card.slidepuzzle.desc': { es: 'Puzzle deslizante 3×3 clásico. Razonamiento espacial y planificación.', en: 'Classic 3×3 sliding puzzle. Spatial reasoning and planning.' },
        'card.slidepuzzle.tag':  { es: 'Planificación', en: 'Planning' },
        'card.soundscape.title': { es: 'Soundscape', en: 'Soundscape' },
        "card.soundscape.desc": {"es": "Cinco ambientes y seis texturas sonoras para acompañar tu práctica.", "en": "Five sound environments and six textures to accompany your practice."},
        'card.soundscape.tag':   { es: 'Utilidad pre-entrenamiento', en: 'Pre-Training Utility' },
        'card.breathing.title':  { es: 'Box Breathing', en: 'Box Breathing' },
        "card.breathing.desc": {"es": "Respiración pautada con cuatro secuencias y señales opcionales.", "en": "Paced breathing with four sequences and optional cues."},
        "card.breathing.tag": {"es": "Respiración guiada", "en": "Guided breathing"},

        // ═══════════════════════════════════════════════════════════════════
        // MODULES — shared UI strings (used across all skill modules)
        // ═══════════════════════════════════════════════════════════════════
        'm.start':         { es: '▶ EMPEZAR', en: '▶ START' },
        'm.start.plain':   { es: 'EMPEZAR', en: 'START' },
        'm.tune':          { es: 'Ajustar', en: 'Tune' },
        'm.back':          { es: '← VOLVER AL MENÚ', en: '← BACK TO MENU' },
        'm.advanced':      { es: 'Avanzado', en: 'Advanced' },
        'm.mode':          { es: 'Modo', en: 'Mode' },
        'm.difficulty':    { es: 'Dificultad', en: 'Difficulty' },
        'm.duration':      { es: 'Duración', en: 'Duration' },
        'm.rounds':        { es: 'Rondas', en: 'Rounds' },
        'm.challenge':     { es: 'Desafío', en: 'Challenge' },
        'm.survival':      { es: 'Supervivencia — 3 vidas', en: 'Survival — 3 lives' },
        'm.normal':        { es: 'Normal', en: 'Normal' },
        // difficulty / size / speed scales
        'm.easy':          { es: 'Fácil', en: 'Easy' },
        'm.medium':        { es: 'Medio', en: 'Medium' },
        'm.hard':          { es: 'Difícil', en: 'Hard' },
        'm.slow':          { es: 'Lento', en: 'Slow' },
        'm.fast':          { es: 'Rápido', en: 'Fast' },
        'm.short':         { es: 'Corto', en: 'Short' },
        'm.long':          { es: 'Largo', en: 'Long' },
        'm.small':         { es: 'Pequeño', en: 'Small' },
        'm.big':           { es: 'Grande', en: 'Big' },
        'm.large':         { es: 'Grande', en: 'Large' },
        'm.low':           { es: 'Bajo', en: 'Low' },
        'm.high':          { es: 'Alto', en: 'High' },
        'm.none':          { es: 'Nada', en: 'None' },
        'm.rare':          { es: 'Raro', en: 'Rare' },
        'm.often':         { es: 'Seguido', en: 'Often' },
        'm.precise':       { es: 'Preciso', en: 'Precise' },
        'm.relaxed':       { es: 'Relajado', en: 'Relaxed' },
        'm.loose':         { es: 'Suelto', en: 'Loose' },
        'm.strict':        { es: 'Estricto', en: 'Strict' },
        'm.lenient':       { es: 'Indulgente', en: 'Lenient' },
        'm.full':          { es: 'Total', en: 'Full' },
        'm.simple':        { es: 'Simple', en: 'Simple' },
        'm.mixed':         { es: 'Mixto', en: 'Mixed' },
        'm.balanced':      { es: 'Equilibrado', en: 'Balanced' },
        'm.custom':        { es: 'Personalizado…', en: 'Custom…' },
        // session controls + results
        'm.exit':          { es: 'SALIR', en: 'EXIT' },
        'm.menu':          { es: 'MENÚ', en: 'MENU' },
        'm.retry':         { es: 'REINTENTAR', en: 'RETRY' },
        'm.complete':      { es: 'SESIÓN COMPLETA', en: 'SESSION COMPLETE' },
        'm.newbest':       { es: 'NUEVO RÉCORD', en: 'NEW BEST' },
        'm.recent':        { es: 'Sesiones recientes', en: 'Recent sessions' },
        'm.accuracy':      { es: 'Precisión', en: 'Accuracy' },
        'm.score':         { es: 'Puntaje', en: 'Score' },
        // common tune labels
        'm.spawnrate':     { es: 'Frecuencia de aparición', en: 'Spawn rate' },
        'm.targetsize':    { es: 'Tamaño del objetivo', en: 'Target size' },
        'm.targetspeed':   { es: 'Velocidad del objetivo', en: 'Target speed' },
        'm.respwindow':    { es: 'Ventana de respuesta', en: 'Response window' },
        'm.endless':       { es: 'Infinito', en: 'Endless' },

        // ── aim ──
        'aim.sub':         { es: 'Haz clic en objetivos rápido y limpio · entrena precisión + reflejo',
                             en: 'Click targets fast and clean · trains precision + reflex' },
        'aim.profile.kicker': { es: 'Inicio rápido', en: 'Quick start' },
        'aim.profile.title': { es: 'Elige cómo quieres entrenar', en: 'Choose your training style' },
        'aim.profile.help': { es: 'Un clic carga el perfil y comienza la sesión.', en: 'One click loads the profile and starts the session.' },
        'aim.profile.shooter': { es: 'Flicks, entradas laterales y microajustes cortos.', en: 'Flicks, side entries and short micro-adjustments.' },
        'aim.profile.moba': { es: 'Trayectorias móviles, rebotes y objetivos cercanos.', en: 'Moving trajectories, rebounds and nearby targets.' },
        'aim.profile.custom': { es: 'Personalizado', en: 'Custom' },
        'aim.profile.custom.empty': { es: 'Crea tu perfil una vez y luego inícialo con un clic.', en: 'Create your own profile once, then start it with one click.' },
        'aim.profile.custom.ready': { es: 'Tu configuración guardada está lista para practicar.', en: 'Your saved setup is ready to practice.' },
        'aim.profile.not.saved': { es: 'Aún no hay un perfil guardado', en: 'No saved profile yet' },
        'aim.profile.start': { es: 'Practicar →', en: 'Practice →' },
        'aim.profile.configure': { es: 'Configurar →', en: 'Configure →' },
        'aim.profile.configure.short': { es: 'Configurar', en: 'Configure' },
        'aim.profile.edit': { es: 'Editar configuración', en: 'Edit setup' },
        'aim.profile.back': { es: 'Volver a perfiles', en: 'Back to profiles' },
        'aim.custom.title': { es: 'Perfil personalizado', en: 'Custom profile' },
        'aim.custom.help': { es: 'Ajústalo una vez. Al guardarlo podrás iniciarlo con un solo clic.', en: 'Set it up once. After saving, you can start it with one click.' },
        'aim.custom.savedlocal': { es: 'Guardado en este navegador', en: 'Saved in this browser' },
        'aim.custom.unsaved': { es: 'Aún sin guardar', en: 'Not saved yet' },
        'aim.custom.saveStart': { es: 'Guardar e iniciar', en: 'Save and start' },
        'aim.patterns':    { es: 'Patrones', en: 'Patterns' },
        'aim.prog':        { es: 'Progresivo — acelera cada 10 objetivos', en: 'Progressive — speed up every 10 targets' },
        'aim.speed.next':  { es: 'Siguiente velocidad', en: 'Next speed' },
        'aim.speed.up':    { es: 'Velocidad aumentada', en: 'Speed increased' },
        'aim.speed.max':   { es: 'Velocidad máxima', en: 'Maximum speed' },
        'aim.speed.max.short': { es: 'MÁX', en: 'MAX' },
        'aim.speed.aria':  { es: 'Objetivos hasta el siguiente aumento de velocidad', en: 'Targets until the next speed increase' },
        'aim.speed.announcement': { es: 'Velocidad aumentada. Nuevo intervalo base: {ms} milisegundos.', en: 'Speed increased. New base interval: {ms} milliseconds.' },
        'aim.spawn.random': { es: 'Ritmo variable — intervalo aleatorio', en: 'Variable pace — random interval' },
        'aim.spawn.variance': { es: 'Variación respecto al intervalo', en: 'Variation from the interval' },
        'aim.spawn.range': { es: 'Rango inicial', en: 'Initial range' },
        'aim.spawn.note':  { es: 'El intervalo elegido es el centro. Progresivo y Supervivencia desplazan el rango sin cambiar su proporción.', en: 'The chosen interval is the center. Progressive and Survival move the range without changing its proportion.' },
        'aim.spawn.variable': { es: 'ritmo variable', en: 'variable pace' },
        'aim.metric':      { es: 'Aciertos por segundo', en: 'Hits per second' },
        'aim.targets':     { es: 'objetivos', en: 'targets' },   // used in "{size} targets · ..."
        'aim.lives3':      { es: '3 vidas', en: '3 lives' },
        'aim.pat.n':       { es: 'patrones', en: 'patterns' },   // "{n} patrones"
        'aim.pat.shooter': { es: 'patrones Shooter', en: 'Shooter patterns' },
        'aim.pat.moba':    { es: 'patrones MOBA', en: 'MOBA patterns' },
        'aim.unit':        { es: '/seg', en: '/sec' },
        'aim.hint.normal': { es: 'Normal: entrena libremente por la duración elegida.', en: 'Normal: train freely for the set duration.' },
        'aim.hint.surv':   { es: 'Supervivencia: 3 vidas. Si fallas o dejas expirar un objetivo, pierdes una. Los objetivos aceleran. Sin límite de tiempo.', en: 'Survival: 3 lives. Miss or let a target expire and you lose one. Targets speed up. No time limit.' },
        'aim.setuphint':   { es: 'Haz clic en objetivos. Destruye todo. No falles.', en: "Click targets. Destroy everything. Don't miss." },

        // ── time (Reaction Time) ──
        'time.sub':        { es: 'Espera el verde, haz clic rápido · mide la latencia de reflejo puro', en: 'Wait for green, click fast · measures pure reflex latency' },
        'time.pace':       { es: 'Ritmo', en: 'Pace' },
        'time.relaxed':    { es: 'Relajado', en: 'Relaxed' },
        'time.reflex':     { es: 'Reflejo puro', en: 'Pure reflex' },
        'time.hint.relaxed': { es: 'Relajado: ves tu tiempo en cada ronda, haz clic para continuar.', en: 'Relaxed: see your time each round, click to continue.' },
        'time.hint.reflex':  { es: 'Reflejo puro: los objetivos se encadenan solos. Si pierdes la ventana, cuenta como fallo.', en: 'Pure reflex: targets auto-cycle. Miss the window and it counts as a miss.' },
        'time.sub.relaxed': { es: 'Relajado · haz clic para avanzar a tu ritmo', en: 'Relaxed · click to advance at your pace' },
        'time.sub.reflex':  { es: 'Reflejo puro · encadenado, sin pausas', en: 'Pure reflex · auto-cycling, no pauses' },
        'time.metric':     { es: 'Tiempo de reacción promedio', en: 'Average reaction time' },
        'time.thissession':{ es: 'Esta sesión', en: 'This session' },
        'time.report':     { es: 'INFORME DE LATENCIA', en: 'LATENCY REPORT' },
        'time.label.relaxed': { es: 'RELAJADO', en: 'RELAXED' },
        'time.label.reflex':  { es: 'REFLEJO PURO', en: 'PURE REFLEX' },
        'time.novalid':    { es: 'Sin reacciones válidas esta ronda', en: 'No valid reactions this round' },
        'time.res.faster': { es: 'más rápido que tu récord', en: 'faster than your record' },
        'time.res.slower': { es: 'más lento que tu récord', en: 'slower than your best' },
        'time.d.worst':    { es: 'peor', en: 'worst' },
        'time.d.misses':   { es: 'fallos', en: 'misses' },
        'time.d.rounds':   { es: 'rondas', en: 'rounds' },
        // game states
        'time.st.begin':   { es: 'Pulsa EMPEZAR para comenzar', en: 'Press START to begin' },
        'time.st.selectmode': { es: 'Elige un modo para comenzar', en: 'Select mode to begin' },
        'time.st.wait':    { es: 'ESPERA...', en: 'WAIT...' },
        'time.st.now':     { es: '¡AHORA!', en: 'NOW!' },
        'time.st.early':   { es: 'DEMASIADO PRONTO', en: 'TOO EARLY' },
        'time.st.retry':   { es: 'haz clic para reintentar', en: 'click to retry' },
        'time.st.paused':  { es: 'PAUSADO', en: 'PAUSED' },
        'time.st.title':   { es: 'TIEMPO DE REACCIÓN', en: 'REACTION TIME' },
        'time.nodata':     { es: 'sin datos', en: 'no data' },
        // classification labels
        'time.cl.elite':   { es: 'élite', en: 'elite' },
        'time.cl.exceptional': { es: 'excepcional', en: 'exceptional' },
        'time.cl.competitive': { es: 'competitivo', en: 'competitive' },
        'time.cl.aboveavg':{ es: 'sobre el promedio', en: 'above average' },
        'time.cl.typical': { es: 'rango típico', en: 'typical range' },
        'time.cl.warming': { es: 'con margen de mejora', en: 'room to improve' },
        'time.cl.top':     { es: 'Top', en: 'Top' },           // "Top 1%"
        'time.cl.average': { es: 'Promedio', en: 'Average' },
        'time.cl.warmup':  { es: 'Calentando', en: 'Warming up' },
        'time.round':      { es: 'RONDA', en: 'ROUND' },

        // ── clicktime (Click Timing) ──
        'clk.sub':         { es: 'Dispara a los objetivos en el pico de su trayectoria', en: 'Shoot targets at peak trajectory' },
        'clk.score':       { es: 'Puntaje', en: 'Score' },
        'clk.accuracy':    { es: 'Precisión', en: 'Accuracy' },
        'clk.hits':        { es: 'Aciertos', en: 'Hits' },
        'clk.perfects':    { es: 'Perfectos', en: 'Perfects' },
        'clk.missed':      { es: 'Fallados', en: 'Missed' },
        'clk.lunar.desc':  { es: 'Gravedad baja. Los objetivos flotan más tiempo en el pico. Buen comienzo.', en: 'Low gravity. Targets float longer at peak. Good start.' },
        'clk.jupiter.desc':{ es: 'Gravedad alta. Arcos rápidos. Timing perfecto requerido.', en: 'Heavy gravity. Fast arcs. Perfect timing required.' },
        'clk.hint':        { es: 'Haz clic en los objetivos cuando brillen en verde en su punto más alto. 60 segundos.', en: 'Click targets when they glow green at peak height. 60 seconds.' },
        'clk.metric':      { es: 'Tasa de timing perfecto', en: 'Perfect timing rate' },
        'clk.nohits':      { es: 'Sin aciertos — apunta al pico verde', en: 'No hits — aim for the green peak' },
        'clk.over':        { es: 'sobre tu récord', en: 'over your record' },
        'clk.below':       { es: 'bajo tu récord', en: 'below your best' },
        'clk.evoempty':    { es: 'Primera sesión de este modo — vuelve para ver tu progreso', en: 'First session of this mode — come back to see your trend' },
        'clk.d.perfects':  { es: 'perfectos', en: 'perfects' },
        'clk.d.accuracy':  { es: 'precisión', en: 'accuracy' },
        'clk.d.bestcombo': { es: 'mejor combo', en: 'best combo' },

        // ── apm (APM Burst) ──
        'apm.sub':         { es: 'Pulsa teclas al ritmo del beat · entrena velocidad + ritmo de tecleo', en: 'Hit keys in time with the beat · trains keystroke speed + rhythm' },
        'apm.score':       { es: 'Puntaje', en: 'Score' },
        'apm.accuracy':    { es: 'Precisión', en: 'Accuracy' },
        'apm.keyset':      { es: 'Conjunto de teclas', en: 'Key set' },
        'apm.keys.label':  { es: 'Teclas', en: 'Keys' },
        'apm.keys.unit':   { es: 'teclas', en: 'keys' },          // "{n} teclas"
        'apm.key.unit':    { es: 'tecla', en: 'key' },            // singular
        'apm.startbpm':    { es: 'BPM inicial', en: 'Starting BPM' },
        'apm.growth':      { es: 'Crecimiento de BPM por acierto', en: 'BPM growth per correct hit' },
        'apm.growth.hint': { es: 'Mayor crecimiento = el beat acelera más rápido a medida que aciertas. La subida es el desafío.', en: 'Higher growth = the beat speeds up faster as you nail hits. The climb is the challenge.' },
        'apm.hint':        { es: 'Pulsa la tecla mostrada al ritmo del beat. Mantén el ritmo.', en: 'Press the displayed key in time with the beat. Stay on rhythm.' },
        'apm.metric':      { es: 'Tempo máximo sostenido', en: 'Peak sustained tempo' },
        'apm.climbs':      { es: 'sube a medida que aciertas', en: 'climbs as you hit' },
        'apm.fixed':       { es: 'tempo fijo', en: 'fixed tempo' },
        'apm.sub.tmpl':    { es: 'empieza en', en: 'starts at' },  // "{n} teclas · empieza en {bpm} BPM · ..."
        'apm.nohits':      { es: 'Sin aciertos esta ronda', en: 'No hits logged this round' },
        'apm.baseline':    { es: 'sesión — tu base', en: 'session — your baseline' }, // "{n}-tecla ..."
        'apm.over':        { es: 'sobre tu récord', en: 'over your record' },
        'apm.below':       { es: 'bajo tu récord', en: 'below your best' },
        'apm.evoempty':    { es: 'Primera sesión con este conjunto de teclas — vuelve para ver tu progreso', en: 'First session with this key set — come back to see your trend' },
        'apm.sesscomplete':{ es: 'SESIÓN COMPLETA', en: 'SESSION COMPLETE' },     // "{n}-KEY SESSION COMPLETE"
        'apm.keysuffix':   { es: 'TECLAS', en: 'KEY' },           // "{n}-TECLAS SESIÓN COMPLETA"
        'apm.d.peak':      { es: 'APM máximo', en: 'peak APM' },
        'apm.d.accuracy':  { es: 'precisión', en: 'accuracy' },
        'apm.d.hits':      { es: 'aciertos', en: 'hits' },
        'apm.d.bestcombo': { es: 'mejor combo', en: 'best combo' },

        // ── tracking (Smooth Tracking) ──
        'trk.sub':         { es: 'Adquisición sostenida del objetivo', en: 'Sustained target acquisition' },
        'trk.efficiency':  { es: 'Eficiencia', en: 'Efficiency' },
        'trk.tot':         { es: 'Tiempo en objetivo', en: 'Time on Target' },
        'trk.targetspeed': { es: 'Velocidad del objetivo', en: 'Target speed' },
        'trk.targetsize':  { es: 'Tamaño del objetivo', en: 'Target size' },
        'trk.chaos':       { es: 'Caos (frecuencia de cambio de dirección)', en: 'Chaos (direction change frequency)' },
        'trk.hint':        { es: 'Mantén el cursor fijo sobre el objetivo en movimiento.', en: 'Keep your cursor locked on the moving target.' },
        'trk.sub.normal':  { es: 'mantén el cursor fijo sobre el objetivo', en: 'keep your cursor locked on the target' },
        'trk.sub.surv':    { es: 'la velocidad sube', en: 'speed climbs' },          // "{diff} inicio · 3 vidas · la velocidad sube"
        'trk.start':       { es: 'inicio', en: 'start' },
        'trk.lives3':      { es: '3 vidas', en: '3 lives' },
        'trk.hint.normal': { es: 'Normal: sigue el objetivo durante la duración elegida.', en: 'Normal: track for the set duration.' },
        'trk.hint.surv':   { es: 'Supervivencia: 3 vidas. Si pierdes contacto con el cursor 2s seguidos, pierdes una. La velocidad sube cada 15s. Sin límite de tiempo.', en: 'Survival: 3 lives. Lose cursor contact for 2s straight and you lose one. Speed climbs every 15s. No time limit.' },
        'trk.nodata':      { es: 'No se capturaron datos de seguimiento', en: 'No tracking data captured' },
        'trk.over':        { es: 'sobre tu récord', en: 'over your record' },
        'trk.below':       { es: 'bajo tu récord', en: 'below your best' },
        'trk.evoempty':    { es: 'Primera sesión de este tipo — vuelve para ver tu progreso', en: 'First session of this type — come back to see your trend' },
        'trk.totalduration': { es: 'Duración total', en: 'Total duration' },
        'trk.maxspeed':    { es: 'Velocidad máx', en: 'Max speed' },
        'trk.avglock':     { es: 'Lock % prom', en: 'Avg lock %' },
        'trk.survover':    { es: 'SUPERVIVENCIA TERMINADA', en: 'SURVIVAL OVER' },

        // ── flicking (Anti-Flick Stability) ──
        'flk.sub':         { es: 'Flickea al objetivo, luego congela · entrena desaceleración + precisión', en: 'Flick to the target, then freeze · trains deceleration + precision' },
        'flk.score':       { es: 'Puntaje', en: 'Score' },
        'flk.targets':     { es: 'Objetivos', en: 'Targets' },
        'flk.targetsize':  { es: 'Tamaño del objetivo', en: 'Target size' },
        'flk.jitter':      { es: 'Umbral de temblor (menor = más difícil)', en: 'Jitter threshold (lower = harder)' },
        'flk.holdtime':    { es: 'Tiempo de mantención requerido', en: 'Hold time required' },
        'flk.recoil':      { es: 'Entrenamiento de recoil', en: 'Recoil Train' },
        'flk.recoil.short':{ es: 'recoil', en: 'recoil' },
        'flk.recoil.desc': { es: 'Mientras mantienes el objetivo, sube y se mueve como el recoil. Compensa con el ratón para conservar el bloqueo.', en: 'While you hold a target, it rises and sways like recoil. Compensate with the mouse to keep the lock.' },
        'flk.sensitivity': { es: 'Sensibilidad del juego', en: 'Game sensitivity' },
        'flk.hint':        { es: 'Flickea al objetivo, luego congela. Entrena tu desaceleración.', en: 'Flick to the target, then freeze. Train your deceleration.' },
        "flk.metric": {"es": "Tiempo total promedio por objetivo", "en": "Mean total time per target"},
        'flk.persession':  { es: 'Esta sesión — por objetivo', en: 'This session — per target' },
        'flk.sub.normal':  { es: 'flickea, frena, mantén firme', en: 'flick, stop, hold still' },
        'flk.sub.surv':    { es: 'todo se ajusta', en: 'everything tightens' },
        'flk.start':       { es: 'inicio', en: 'start' },
        'flk.lives3':      { es: '3 vidas', en: '3 lives' },
        'flk.hint.normal': { es: 'Normal: entrena durante la duración elegida.', en: 'Normal: train for the set duration.' },
        'flk.hint.surv':   { es: 'Supervivencia: 3 vidas. Los objetivos se achican, el umbral se ajusta, el tiempo de mantención crece. Si pierdes el tiempo límite que se acorta, pierdes una vida.', en: 'Survival: 3 lives. Targets shrink, threshold tightens, hold time grows. Miss the shrinking timeout and you lose a life.' },
        'flk.notargets':   { es: 'Ningún objetivo estabilizado esta ronda', en: 'No targets stabilized this round' },
        'flk.faster':      { es: 'más rápido que tu récord', en: 'faster than your record' },
        'flk.slower':      { es: 'más lento que tu récord', en: 'slower than your best' },
        'flk.evoempty':    { es: 'Primera sesión de este tipo — vuelve para ver tu progreso', en: 'First session of this type — come back to see your trend' },
        'flk.survover':    { es: 'SUPERVIVENCIA TERMINADA', en: 'SURVIVAL OVER' },
        'flk.d.completed': { es: 'completados', en: 'completed' },
        'flk.d.worst':     { es: 'peor', en: 'worst' },
        'flk.d.avgjitter': { es: 'temblor prom', en: 'avg jitter' },

        // ── attention (Attention Split) ──
        'att.sub':         { es: 'Sigue la esfera. Reacciona a los números.', en: 'Track the sphere. React to the numbers.' },
        'att.score':       { es: 'Puntaje', en: 'Score' },
        'att.accuracy':    { es: 'Precisión', en: 'Accuracy' },
        'att.spherespeed': { es: 'Velocidad de la esfera', en: 'Sphere speed' },
        'att.nodefreq':    { es: 'Frecuencia de nodos (menor = más nodos)', en: 'Node frequency (lower = more nodes)' },
        'att.respwindow':  { es: 'Ventana de respuesta', en: 'Response window' },
        'att.hint':        { es: 'Mantén el cursor en la esfera Y pulsa el número cuando aparezca.', en: 'Keep cursor on sphere AND press the number when it appears.' },
        'att.metric':      { es: 'Puntaje de foco · precisión × lock', en: 'Focus score · accuracy × lock' },
        'att.reactacc':    { es: 'Precisión de reacción', en: 'Reaction accuracy' },
        'att.lockrate':    { es: 'Tasa de lock en esfera', en: 'Sphere lock rate' },
        'att.sub.normal':  { es: 'sigue la esfera, reacciona a los números', en: 'track the sphere, react to numbers' },
        'att.sub.surv':    { es: 'todo sube', en: 'everything climbs' },
        'att.start':       { es: 'inicio', en: 'start' },
        'att.lives3':      { es: '3 vidas', en: '3 lives' },
        'att.hint.normal': { es: 'Normal: entrena durante la duración elegida.', en: 'Normal: train for the set duration.' },
        'att.hint.surv':   { es: 'Supervivencia: 3 vidas. La velocidad de la esfera y la frecuencia de nodos suben. Si fallas un nodo o pulsas una tecla equivocada, pierdes una. Recuperas cada 30 correctos.', en: 'Survival: 3 lives. Sphere speed & node frequency climb. Miss a node or hit a wrong key and you lose one. Recover every 30 correct.' },
        'att.nonodes':     { es: 'No se respondió a ningún nodo esta ronda', en: 'No nodes responded to this round' },
        'att.over':        { es: 'sobre tu récord', en: 'over your record' },
        'att.below':       { es: 'bajo tu récord', en: 'below your best' },
        'att.evoempty':    { es: 'Primera sesión de este tipo — vuelve para ver tu progreso', en: 'First session of this type — come back to see your trend' },
        'att.survover':    { es: 'SUPERVIVENCIA TERMINADA', en: 'SURVIVAL OVER' },
        'att.d.correct':   { es: 'correctos', en: 'correct' },
        'att.d.avgreact':  { es: 'reacción prom', en: 'avg reaction' },
        'att.d.beststreak':{ es: 'mejor racha', en: 'best streak' },

        // ── stroop (Stroop Test) ──
        // Color words shown as the stimulus AND on the answer buttons.
        'stroop.color.red':    { es: 'ROJO', en: 'RED' },
        'stroop.color.blue':   { es: 'AZUL', en: 'BLUE' },
        'stroop.color.green':  { es: 'VERDE', en: 'GREEN' },
        'stroop.color.yellow': { es: 'AMARILLO', en: 'YELLOW' },
        'stroop.sub':      { es: 'Interferencia cognitiva — control inhibitorio', en: 'Cognitive interference — inhibitory control' },
        'stroop.score':    { es: 'Puntaje', en: 'Score' },
        'stroop.accuracy': { es: 'Precisión', en: 'Accuracy' },
        'stroop.wordhint': { es: 'IGNORA EL TEXTO — ELIGE EL COLOR', en: 'IGNORE TEXT — CHOOSE THE COLOR' },
        'stroop.rule':     { es: 'REGLA', en: 'RULE' },
        'stroop.ruletext': { es: 'Tu cerebro lee las palabras automáticamente. <em>Combate ese instinto.</em> Elige el <em>color de la tinta</em>, no la palabra. Usa el mouse o las teclas <strong>Q W E R</strong>.', en: 'Your brain reads words automatically. <em>Fight that instinct.</em> Select the <em>color of the ink</em>, not the word. Use mouse or keys <strong>Q W E R</strong>.' },
        'stroop.interflevel': { es: 'Nivel de interferencia', en: 'Interference level' },
        'stroop.interfhint':  { es: 'Mayor = más palabras cuyo color choca con su significado, y menos tiempo para responder.', en: 'Higher = more words whose color conflicts with their meaning, and less time to respond.' },
        'stroop.gameduration':{ es: 'Duración del juego', en: 'Game duration' },
        'stroop.timeperword': { es: 'Tiempo por palabra', en: 'Time per word' },
        'stroop.timehint':    { es: 'Cuánto tiempo permanece cada palabra antes de expirar. Menor = ritmo más rápido y más presión.', en: 'How long each word stays before it times out. Shorter = faster pace and more pressure.' },
        'stroop.conflictrate':{ es: 'Tasa de conflicto', en: 'Conflict rate' },
        'stroop.conflicthint':{ es: 'Probabilidad de que la palabra no coincida con su color. 0% = lectura pura, 100% = interferencia máxima.', en: 'Probability the word disagrees with its color. 0% = pure reading, 100% = maximum interference.' },
        'stroop.hint':     { es: 'Concéntrate en el color, no en la palabra.', en: 'Focus on the color, not the word.' },
        'stroop.metric':   { es: 'Respuesta promedio bajo interferencia', en: 'Avg response under interference' },
        'stroop.fastest':  { es: 'Más rápida correcta', en: 'Fastest correct' },
        'stroop.interference':{ es: 'interferencia', en: 'interference' },  // "Medio interferencia"
        'stroop.windowshrinks':{ es: 'la ventana se reduce', en: 'window shrinks' },
        'stroop.lives3':   { es: '3 vidas', en: '3 lives' },
        'stroop.perword':  { es: 'por palabra', en: 'per word' },           // "2.5s por palabra"
        'stroop.hint.normal':{ es: 'Normal: responde al ritmo elegido durante la duración seleccionada.', en: 'Normal: respond at the set pace for the chosen duration.' },
        'stroop.hint.surv':{ es: 'Supervivencia: 3 vidas. La ventana se reduce 50ms cada 5 correctas. Una respuesta incorrecta o un tiempo agotado cuesta una vida. Recuperas cada 25 correctas.', en: 'Survival: 3 lives. The window shrinks 50ms every 5 correct. Wrong answer or timeout loses a life. Recover every 25 correct.' },
        'stroop.noresp':   { es: 'No se registraron respuestas esta ronda', en: 'No responses logged this round' },
        'stroop.acclow':   { es: 'Precisión muy baja para registrar — concéntrate en el color, no en la velocidad', en: 'Accuracy too low to log — focus on the color, not speed' },
        'stroop.faster':   { es: 'más rápido que tu récord', en: 'faster than your record' },
        'stroop.slower':   { es: 'más lento que tu récord', en: 'slower than your best' },
        'stroop.evoempty': { es: 'Sin sesiones que califiquen aún — mantén la precisión ≥ 80%', en: 'No accuracy-qualified sessions yet — keep accuracy ≥ 80%' },
        'stroop.survover': { es: 'SUPERVIVENCIA TERMINADA', en: 'SURVIVAL OVER' },
        'stroop.d.correct':{ es: 'correctas', en: 'correct' },
        'stroop.d.beststreak':{ es: 'mejor racha', en: 'best streak' },
        'stroop.d.score':  { es: 'puntaje', en: 'score' },

        // ── neurogrid (NeuroGrid) ──
        // Colors and shapes used in the dynamic rule banner + targets.
        'ng.color.red':    { es: 'ROJO', en: 'RED' },
        'ng.color.blue':   { es: 'AZUL', en: 'BLUE' },
        'ng.color.green':  { es: 'VERDE', en: 'GREEN' },
        'ng.color.yellow': { es: 'AMARILLO', en: 'YELLOW' },
        'ng.shape.circle': { es: 'CÍRCULOS', en: 'CIRCLES' },
        'ng.shape.square': { es: 'CUADRADOS', en: 'SQUARES' },
        'ng.shape.triangle':{ es: 'TRIÁNGULOS', en: 'TRIANGLES' },
        'ng.shape.diamond':{ es: 'ROMBOS', en: 'DIAMONDS' },
        // Rule verbs / connectors
        'ng.rule.shoot':   { es: 'DISPARA A', en: 'SHOOT' },
        'ng.rule.avoid':   { es: 'EVITA', en: 'AVOID' },
        'ng.rule.or':      { es: 'O', en: 'OR' },
        'ng.sub':          { es: 'Escaneo visual — disparo por reglas', en: 'Visual scanning — rule-based shooting' },
        'ng.score':        { es: 'Puntaje', en: 'Score' },
        'ng.accuracy':     { es: 'Precisión', en: 'Accuracy' },
        'ng.activerule':   { es: 'REGLA ACTIVA', en: 'ACTIVE RULE' },
        'ng.howtitle':     { es: 'CÓMO FUNCIONA', en: 'HOW IT WORKS' },
        'ng.howdesc':      { es: 'Los objetivos aparecen con <b>color</b> y <b>forma</b> aleatorios. Una <b>regla</b> arriba te dice a qué disparar. Haz clic solo en los objetivos válidos. La regla cambia cada pocos segundos. Tanto los clics incorrectos como dejar pasar objetivos válidos cuentan en tu contra.', en: 'Targets spawn with random <b>color</b> and <b>shape</b>. A <b>rule</b> at the top tells you what to shoot. Click only valid targets. The rule changes every few seconds. Wrong clicks and missed valid targets both count against you.' },
        'ng.rulecomplexity':{ es: 'Complejidad de reglas', en: 'Rule complexity' },
        'ng.rulecomphint': { es: 'Simple = un solo atributo ("dispara a ROJO"). Avanzado = reglas combinadas / negadas ("NO triángulos azules").', en: 'Simple = single attribute ("shoot RED"). Advanced = combined / negated rules ("NOT blue triangles").' },
        'ng.advanced':     { es: 'Avanzado', en: 'Advanced' },
        'ng.spawnrate':    { es: 'Frecuencia de aparición', en: 'Spawn rate' },
        'ng.targetlife':   { es: 'Vida del objetivo', en: 'Target lifetime' },
        'ng.hint':         { es: 'Lee la regla. Dispara solo a los objetivos que coinciden. Adáptate cuando cambie.', en: 'Read the rule. Shoot only matching targets. Adapt when it changes.' },
        'ng.metric':       { es: 'Objetivos válidos procesados por minuto', en: 'Valid targets processed per minute' },
        'ng.avgreact':     { es: 'Reacción prom', en: 'Avg reaction' },
        'ng.sub.normal':   { es: 'escanea, sigue la regla, adáptate', en: 'scan, match the rule, adapt' },
        'ng.sub.surv':     { es: 'todo acelera', en: 'everything speeds up' },
        'ng.start':        { es: 'inicio', en: 'start' },
        'ng.lives3':       { es: '3 vidas', en: '3 lives' },
        'ng.hint.normal':  { es: 'Normal: escanea durante la duración elegida.', en: 'Normal: scan for the set duration.' },
        'ng.hint.surv':    { es: 'Supervivencia: 3 vidas. La frecuencia de aparición y la complejidad aumentan. Un disparo incorrecto o un objetivo válido perdido cuesta una vida. 3 errores seguidos cuestan extra. Recuperas cada 40 aciertos.', en: 'Survival: 3 lives. Spawn rate & complexity climb. Wrong shot or missed valid target loses a life. 3 wrong in a row costs extra. Recover every 40 correct.' },
        'ng.noshots':      { es: 'No se registraron disparos esta ronda', en: 'No shots logged this round' },
        'ng.acclow':       { es: 'Precisión muy baja para registrar — lee la regla antes de disparar', en: 'Accuracy too low to log — read the rule before shooting' },
        'ng.over':         { es: 'sobre tu récord', en: 'over your record' },
        'ng.below':        { es: 'bajo tu récord', en: 'below your best' },
        'ng.evoempty':     { es: 'Sin sesiones que califiquen aún — mantén la precisión ≥ 70%', en: 'No accuracy-qualified sessions yet — keep accuracy ≥ 70%' },
        'ng.survover':     { es: 'SUPERVIVENCIA TERMINADA', en: 'SURVIVAL OVER' },
        'ng.d.correct':    { es: 'correctos', en: 'correct' },
        'ng.d.wrong':      { es: 'errados', en: 'wrong' },
        'ng.d.missed':     { es: 'perdidos', en: 'missed' },
        'ng.d.beststreak': { es: 'mejor racha', en: 'best streak' },

        // ── pathpredict (Path Predict) ──
        // Trajectory types: name + description (shown in the Tune checkboxes).
        'pp.traj.linear.name': { es: 'Lineal', en: 'Linear' },
        'pp.traj.linear.desc': { es: 'Línea recta a velocidad constante', en: 'Constant velocity straight line' },
        'pp.traj.bounce.name': { es: 'Rebote', en: 'Bounce' },
        'pp.traj.bounce.desc': { es: 'Rebota en los bordes de la arena', en: 'Reflects off arena edges' },
        'pp.traj.curve.name':  { es: 'Curva', en: 'Curve' },
        'pp.traj.curve.desc':  { es: 'Arco continuo', en: 'Continuous arc' },
        'pp.traj.zigzag.name': { es: 'Zigzag', en: 'Zigzag' },
        'pp.traj.zigzag.desc': { es: 'Pasos diagonales alternados', en: 'Alternating diagonal steps' },
        'pp.traj.accel.name':  { es: 'Aceleración', en: 'Accel' },
        'pp.traj.accel.desc':  { es: 'La velocidad crece en cada pulso', en: 'Speed grows each pulse' },
        'pp.sub':          { es: 'Entrenamiento de anticipación de trayectorias', en: 'Trajectory anticipation training' },
        'pp.score':        { es: 'Puntaje', en: 'Score' },
        'pp.accuracy':     { es: 'Precisión', en: 'Accuracy' },
        'pp.round':        { es: 'Ronda', en: 'Round' },
        'pp.howtitle':     { es: 'CÓMO FUNCIONA', en: 'HOW IT WORKS' },
        'pp.howdesc':      { es: 'Un objetivo pulsa a través de varias posiciones revelando su <b>trayectoria</b>. Cuando desaparece, <b>haz clic donde aparecerá a continuación</b>. Mientras más cerca tu clic, mayor tu puntaje. Entrena tu cerebro para leer y extrapolar el movimiento.', en: 'A target pulses across several positions revealing its <b>trajectory</b>. After it vanishes, <b>click where it will appear next</b>. The closer your click, the higher your score. Train your brain to read and extrapolate movement.' },
        'pp.diffhint':     { es: 'Mayor dificultad agrega tipos de trayectoria más difíciles, menos pulsos de pista y una tolerancia más ajustada.', en: 'Higher difficulty adds harder trajectory types, fewer hint pulses, and a tighter tolerance.' },
        'pp.trajtypes':    { es: 'Tipos de trayectoria (selecciona una o más)', en: 'Trajectory types (select one or more)' },
        'pp.pulses':       { es: 'Pulsos (puntos mostrados antes de predecir)', en: 'Pulses (points shown before predict)' },
        'pp.tolerance':    { es: 'Radio de tolerancia', en: 'Tolerance radius' },
        'pp.respwindow':   { es: 'Ventana de respuesta', en: 'Response window' },
        'pp.hint':         { es: 'Lee el movimiento. Predice el destino. Haz clic con precisión.', en: 'Read the movement. Predict the destination. Click precisely.' },
        'pp.metric':       { es: 'Precisión de predicción', en: 'Prediction accuracy' },
        'pp.perfecthits':  { es: 'Aciertos perfectos', en: 'Perfect hits' },
        'pp.avgmiss':      { es: 'Distancia de error prom', en: 'Avg miss distance' },
        'pp.sub.normal':   { es: 'lee la trayectoria, predice dónde cae', en: 'read the path, predict where it lands' },
        'pp.sub.surv':     { es: 'las trayectorias se complican', en: 'paths get harder' },
        'pp.start':        { es: 'inicio', en: 'start' },
        'pp.lives3':       { es: '3 vidas', en: '3 lives' },
        'pp.hint.normal':  { es: 'Normal: predice durante el número de rondas elegido.', en: 'Normal: predict for the set number of rounds.' },
        'pp.hint.surv':    { es: 'Supervivencia: 3 vidas. Empieza con trayectorias lineales; rebotes, curvas y zigzags se desbloquean con el tiempo. La tolerancia se reduce. Si fallas por completo, pierdes una vida.', en: 'Survival: 3 lives. Starts with linear paths; bounces, curves, zigzags unlock over time. Tolerance shrinks. Miss completely and you lose a life.' },
        'pp.nopred':       { es: 'No se registraron predicciones esta ronda', en: 'No predictions logged this round' },
        'pp.toofew':       { es: 'Muy pocas rondas para registrar — juega al menos 5', en: 'Too few rounds to log — play at least 5' },
        'pp.over':         { es: 'sobre tu récord', en: 'over your record' },
        'pp.below':        { es: 'bajo tu récord', en: 'below your best' },
        'pp.evoempty':     { es: 'Primera sesión de este tipo — vuelve para ver tu progreso', en: 'First session of this type — come back to see your trend' },
        'pp.survover':     { es: 'SUPERVIVENCIA TERMINADA', en: 'SURVIVAL OVER' },
        'pp.d.perfect':    { es: 'perfectos', en: 'perfect' },
        'pp.d.close':      { es: 'cercanos', en: 'close' },
        'pp.d.missed':     { es: 'fallados', en: 'missed' },
        'pp.d.beststreak': { es: 'mejor racha', en: 'best streak' },

        // ── slidepuzzle (Slide Puzzle) ──
        'sp.sub':          { es: 'Razonamiento espacial · memoria de trabajo', en: 'Spatial reasoning · working memory' },
        'sp.moves':        { es: 'Movimientos', en: 'Moves' },
        'sp.difficulty':   { es: 'Dificultad', en: 'Difficulty' },
        'sp.easy':         { es: 'FÁCIL', en: 'EASY' },
        'sp.normal':       { es: 'NORMAL', en: 'NORMAL' },
        'sp.hard':         { es: 'DIFÍCIL', en: 'HARD' },
        'sp.easy.desc':    { es: '20 mezclas<br>Calentamiento', en: '20 shuffles<br>Warm-up' },
        'sp.normal.desc':  { es: '60 mezclas<br>Equilibrado', en: '60 shuffles<br>Balanced' },
        'sp.hard.desc':    { es: '150 mezclas<br>Prueba de estrés', en: '150 shuffles<br>Stress test' },
        'sp.boardhint':    { es: 'Haz clic en una ficha adyacente · o usa', en: 'Click an adjacent tile · or use' },
        'sp.hint':         { es: 'Ordena las fichas del 1 al 8. El espacio vacío abajo a la derecha.', en: 'Arrange tiles 1 through 8 in order. Empty slot bottom-right.' },
        'sp.solved':       { es: 'RESUELTO', en: 'SOLVED' },               // "{diff} — RESUELTO"
        'sp.totalmoves':   { es: 'MOVIMIENTOS TOTALES', en: 'TOTAL MOVES' },
        'sp.time':         { es: 'Tiempo', en: 'Time' },
        'sp.movesmin':     { es: 'Movimientos / min', en: 'Moves / min' },

        // ── typing (Typing Speed) ──
        // Note: the words you type stay in English (standard for typing trainers).
        'ty.sub':          { es: 'Mentalidad competitiva · palabras por minuto', en: 'Competitive mindset · words per minute' },
        'ty.wpm':          { es: 'WPM', en: 'WPM' },
        'ty.accuracy':     { es: 'Precisión', en: 'Accuracy' },
        'ty.seconds':      { es: 'Segundos', en: 'Seconds' },
        'ty.sprint':       { es: 'SPRINT', en: 'SPRINT' },
        'ty.standard':     { es: 'ESTÁNDAR', en: 'STANDARD' },
        'ty.endurance':    { es: 'RESISTENCIA', en: 'ENDURANCE' },
        'ty.sprint.desc':  { es: '15 segundos<br>Velocidad explosiva', en: '15 seconds<br>Burst speed' },
        'ty.standard.desc':{ es: '30 segundos<br>Equilibrado', en: '30 seconds<br>Balanced' },
        'ty.endurance.desc':{ es: '60 segundos<br>Foco sostenido', en: '60 seconds<br>Sustained focus' },
        'ty.hint':         { es: 'Escribe cada palabra, el espacio la confirma. Las letras incorrectas se marcan en rojo. No mires tus manos.', en: "Type each word, space commits. Wrong letters highlight red. Don't look at your hands." },
        'ty.netwpm':       { es: 'PALABRAS POR MINUTO (NETO)', en: 'WORDS PER MINUTE (NET)' },
        'ty.wpmovertime':  { es: 'WPM en el tiempo', en: 'WPM over time' },
        'ty.peak':         { es: 'máx', en: 'peak' },               // "máx 95" / "peak 95"
        'ty.peakdash':     { es: 'máx —', en: 'peak —' },
        'ty.rawwpm':       { es: 'WPM bruto', en: 'Raw WPM' },
        'ty.consistency':  { es: 'Consistencia', en: 'Consistency' },
        'ty.words':        { es: 'Palabras', en: 'Words' },
        'ty.typetobegin':  { es: 'Escribe para empezar', en: 'Type to begin' },
        'ty.live':         { es: 'En vivo', en: 'Live' },
        'ty.seconds.word': { es: 'SEGUNDOS', en: 'SECONDS' },

        // ── vortex (Vortex) ──
        'vx.sub':          { es: 'Apunta a la cuña. Revienta la letra.', en: 'Aim the wedge. Pop the letter.' },
        'vx.score':        { es: 'Puntaje', en: 'Score' },
        'vx.accuracy':     { es: 'Precisión', en: 'Accuracy' },
        'vx.keycount':     { es: 'Conjunto de teclas', en: 'Key set' },
        'vx.keyhint':      { es: 'Cuántas letras distintas pueden aparecer. Menos = más fácil de reaccionar.', en: 'How many different letters can appear. Fewer = easier to react.' },
        'vx.spawnlabel':   { es: 'Frecuencia de aparición inicial', en: 'Starting spawn rate' },
        'vx.spawnhint':    { es: 'La aparición acelera a medida que juegas — esto es solo el ritmo inicial.', en: 'Spawn rate quickens as you play — this is just the starting pace.' },
        'vx.hint':         { es: 'Apunta el mouse a una cuña para armar sus esferas, luego presiona la tecla de la esfera para reventarla.', en: "Point the mouse at a wedge to arm its orbs, then press the orb's key to pop it." },
        'vx.hint.normal':  { es: 'Normal: juega durante la duración elegida.', en: 'Normal: play for the set duration.' },
        'vx.hint.surv':    { es: 'Supervivencia: 3 vidas. Si una esfera llega al centro o revientas mal, pierdes una. Recuperas cada 25 reventadas.', en: 'Survival: 3 lives. If an orb reaches the center or you pop wrong, you lose one. Recover every 25 pops.' },
        'vx.aimlost':      { es: 'SIN APUNTAR', en: 'AIM LOST' },
        'vx.aimed':        { es: 'APUNTANDO', en: 'AIMED' },
        'vx.key':          { es: 'tecla', en: 'key' },
        'vx.keysu':        { es: 'teclas', en: 'keys' },
        'vx.lives3':       { es: '3 vidas', en: '3 lives' },
        'vx.zonemode':     { es: 'revienta en la zona', en: 'pop in the zone' },
        'vx.anywhere':     { es: 'revienta en cualquier lado', en: 'pop anywhere' },
        'vx.metric':       { es: 'Precisión de reventado', en: 'Pop accuracy' },
        'vx.pops':         { es: 'Esferas reventadas', en: 'Orbs popped' },
        'vx.avgreact':     { es: 'Reacción prom', en: 'Avg reaction' },
        'vx.nopops':       { es: 'No se reventó ninguna esfera esta ronda', en: 'No orbs popped this round' },
        'vx.over':         { es: 'sobre tu récord', en: 'over your record' },
        'vx.below':        { es: 'bajo tu récord', en: 'below your best' },
        'vx.evoempty':     { es: 'Primera sesión de este tipo — vuelve para ver tu progreso', en: 'First session of this type — come back to see your trend' },
        'vx.survover':     { es: 'SUPERVIVENCIA TERMINADA', en: 'SURVIVAL OVER' },
        'vx.d.score':      { es: 'puntaje', en: 'score' },
        'vx.d.missed':     { es: 'falladas', en: 'missed' },
        'vx.d.beststreak': { es: 'mejor racha', en: 'best streak' },        // "30 SEGUNDOS — SESIÓN COMPLETA"
        'm.res.baseline':  { es: '★ Primera sesión — esta es tu base', en: '★ First session — this is your baseline' },
        'm.res.newbest':   { es: 'NUEVO RÉCORD', en: 'NEW BEST' },
        'm.res.matched':   { es: 'Igualaste tu récord', en: 'Matched your best' },
        'm.res.over':      { es: 'sobre tu récord', en: 'over your record' },
        'm.res.below':     { es: 'bajo tu récord', en: 'below your best' },
        'm.res.evoempty':  { es: 'Primera sesión de este tipo — vuelve para ver tu progreso',
                             en: 'First session of this type — come back to see your trend' },
        'm.res.survover':  { es: 'SUPERVIVENCIA TERMINADA', en: 'SURVIVAL OVER' },
        'm.res.best':      { es: 'mejor', en: 'best' },           // evolution "best X"
        'm.d.accuracy':    { es: 'precisión', en: 'accuracy' },
        'm.d.beststreak':  { es: 'mejor racha', en: 'best streak' },
        'm.d.totalhits':   { es: 'aciertos totales', en: 'total hits' },
        'm.d.session':     { es: 'sesión', en: 'session' },        // "{dur}s session"
        'm.d.correct':     { es: 'correctos', en: 'correct' },
        'm.d.missed':      { es: 'fallados', en: 'missed' },
        'm.d.wrong':       { es: 'errados', en: 'wrong' },

        // ── Info page: tabs + intro (content filled in later steps) ──
        'info.title':          { es: 'Información', en: 'Information' },
        'info.tab.modules':    { es: 'Cómo funciona', en: 'How it works' },
        'info.tab.science':    { es: 'La ciencia',     en: 'The science' },
        'info.tab.support':    { es: 'Apoyar',         en: 'Support' },
        'info.lang.label':     { es: 'Idioma', en: 'Language' },

        // ── Info: How it works tab ──
        'info.modules.intro':  { es: 'Cada módulo entrena una habilidad concreta. Aquí tienes qué entrena cada uno, cómo se nota la mejora en el juego, y qué métrica mirar para ver tu progreso.',
                                 en: 'Each module trains a specific skill. Here\'s what each one trains, how the improvement shows up in-game, and which metric to watch to track your progress.' },
        'info.modules.col.trains':   { es: 'Qué entrena', en: 'What it trains' },
        'info.modules.col.ingame':   { es: 'Cómo se nota en el juego', en: 'How it shows up in-game' },
        'info.modules.col.measure':  { es: 'Cómo medir tu progreso', en: 'How to track progress' },

        // ── Info: Science tab ──
        'info.science.eyebrow':{ es: 'BIBLIOTECA', en: 'LIBRARY' },
        'info.science.intro':  { es: 'Estudios revisados por pares sobre el entrenamiento que hay detrás de cada módulo. Cada entrada resume qué se encontró, cómo se relaciona con lo que entrenas, y dónde están los límites de la evidencia.',
                                 en: 'Peer-reviewed studies on the training behind each module. Each entry summarizes what was found, how it relates to what you train, and where the limits of the evidence are.' },
        'info.science.count.one':  { es: '1 entrada', en: '1 entry' },
        'info.science.count.many': { es: 'entradas', en: 'entries' },   // "{n} entradas"
        'info.science.read':       { es: 'Leer', en: 'Read' },
        'info.science.close':      { es: 'Cerrar', en: 'Close' },
        'info.science.level.solid':    { es: 'Sólido', en: 'Solid' },
        'info.science.level.bounded':  { es: 'Sólido pero acotado', en: 'Solid but bounded' },
        'info.science.level.debated':  { es: 'Discutido / no probado', en: 'Debated / unproven' },
        'info.science.label.found':    { es: 'Lo que encontraron', en: 'What they found' },
        'info.science.label.relates':  { es: 'Cómo se relaciona con lo que entrenas aquí', en: 'How it relates to what you train here' },
        'info.science.label.notsay':   { es: 'Lo que esto NO dice', en: 'What this does NOT say' },
        'info.science.label.source':   { es: 'Ver fuente', en: 'View source' },
        'info.science.more':           { es: 'Más estudios en camino. Los agregamos de a uno, revisando cada uno con cuidado.',
                                         en: 'More studies on the way. We add them one at a time, vetting each one carefully.' },

        // ── Info: Support tab ──
        'info.support.about':    { es: 'SOBRE ESTE PROYECTO', en: 'ABOUT THIS PROJECT' },
        'info.support.head':     { es: 'Construyendo el futuro del entrenamiento competitivo',
                                   en: 'Building the future of competitive training' },
        "info.support.p1": {"es": "Buffmechanics reúne tareas breves de precisión, coordinación y atención. Los resultados describen tu ejecución dentro de cada ejercicio; esta beta no mide si esa práctica mejora tu rendimiento en otros juegos.", "en": "Buffmechanics combines short precision, coordination and attention tasks. Results describe your performance within each exercise; this beta does not measure whether practice improves your performance in other games."},
        'info.support.p2':       { es: 'Es un proyecto en etapa temprana con un plan claro: más módulos, analíticas de rendimiento detalladas, y un centro de conocimiento basado en ciencia. La plataforma es gratis y va a seguir siéndolo.',
                                   en: 'This is an early-stage project with a clear roadmap: more training modules, detailed performance analytics, and a science-based knowledge hub. The platform is free and will remain free.' },
        'info.support.callout':  { es: 'Mantener este proyecto vivo — servidores, tiempo de desarrollo, investigación — cuesta dinero. Si BuffMechanics te ayuda en tu juego, considera apoyar su desarrollo. Cada aporte va directo a mantener y mejorar la plataforma.',
                                   en: 'Keeping this project alive — servers, development time, research — costs money. If BuffMechanics helps your game, consider supporting its development. Every contribution goes directly into maintaining and improving the platform.' },
        'info.support.options':  { es: 'OPCIONES DE APOYO', en: 'SUPPORT OPTIONS' },
        'info.support.paypal.sub': { es: 'Apoyo único o recurrente', en: 'One-time or recurring support' },
        'info.support.crypto.sub': { es: 'Click para copiar la dirección', en: 'Click to copy address' },
        'info.support.footer':   { es: 'Hecho con foco. Respaldado por ciencia. Impulsado por la comunidad.',
                                   en: 'Built with focus. Backed by science. Powered by the community.' },
    },

    // ---- Core API ---------------------------------------------------------

    // Translate a key. Falls back to the key itself if missing (visible bug,
    // by design — better than a silent blank).
    t(key) {
        const entry = this.dict[key];
        if (!entry) return key;
        return entry[this.lang] || entry.en || key;
    },

    // Detect the starting language: explicit stored choice → browser → 'en'.
    detect() {
        let stored = null;
        try { stored = localStorage.getItem(this._storeKey); } catch (e) {}
        if (stored === 'es' || stored === 'en') return stored;
        const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
        return nav.startsWith('es') ? 'es' : 'en';
    },

    // Initialize: detect language, set <html lang>, apply translations.
    init() {
        this.lang = this.detect();
        this._reflectHtmlLang();
        this.apply();
        return this.lang;
    },

    // Switch language, persist the choice, re-apply. Fires a 'langchange' event
    // so pages can re-render dynamic content (e.g. lists built in JS).
    set(lang) {
        if (lang !== 'es' && lang !== 'en') return;
        this.lang = lang;
        try { localStorage.setItem(this._storeKey, lang); } catch (e) {}
        this._reflectHtmlLang();
        this.apply();
        window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    },

    toggle() { this.set(this.lang === 'es' ? 'en' : 'es'); },

    _reflectHtmlLang() {
        if (document.documentElement) document.documentElement.setAttribute('lang', this.lang);
    },

    // Walk the DOM and fill every data-i18n* element.
    apply(root) {
        const scope = root || document;
        scope.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = this.t(el.getAttribute('data-i18n'));
        });
        scope.querySelectorAll('[data-i18n-html]').forEach(el => {
            el.innerHTML = this.t(el.getAttribute('data-i18n-html'));
        });
        scope.querySelectorAll('[data-i18n-ph]').forEach(el => {
            el.setAttribute('placeholder', this.t(el.getAttribute('data-i18n-ph')));
        });
        scope.querySelectorAll('[data-i18n-aria]').forEach(el => {
            el.setAttribute('aria-label', this.t(el.getAttribute('data-i18n-aria')));
        });
        scope.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.setAttribute('title', this.t(el.getAttribute('data-i18n-title')));
        });
    },

    // Merge additional keys into the dict (lets a page add its own strings
    // without editing this file). Existing keys are NOT overwritten.
    extend(extra) {
        for (const k in extra) {
            if (!this.dict[k]) this.dict[k] = extra[k];
        }
    }
};

// Resolve language before module setup scripts render dynamic text.
I18N.lang=I18N.detect();
I18N._reflectHtmlLang();
// Auto-init as soon as the script runs if the DOM is ready; otherwise wait.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18N.init());
} else {
    I18N.init();
}
