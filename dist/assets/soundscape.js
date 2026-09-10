/* BuffMechanics · Soundscape 2.0
   Guided first-run experience + bounded procedural Web Audio engine.
   Audio is scheduled against AudioContext.currentTime, and every live node
   belongs to a disposable scene so repeated switches do not accumulate work. */
(function(global){
    'use strict';

    const MODULE = 'soundscape';
    const PREVIEW_MS = 8000;
    const PREF_KEY = 'soundscape:v2';

    const MODES = [
        {
            id:'activate', symbol:'↗', color:'#8b6cff', rgb:'139,108,255', frequency:'120 BPM', bpm:120,
            name:{es:'Activarme',en:'Activate'}, title:{es:'ACTIVACIÓN',en:'ACTIVATE'},
            short:{es:'Antes de entrenar o cuando te falta energía.',en:'Before training or whenever your energy feels low.'},
            copy:{es:'Un pulso claro y dinámico para acompañar el calentamiento sin exigir tu atención.',en:'A clear, dynamic pulse for warming up without demanding your attention.'},
            recommended:['lofi','tribal','reggae'], headphones:false
        },
        {
            id:'flow', symbol:'∿', color:'#df7055', rgb:'223,112,85', frequency:'80 BPM', bpm:80,
            name:{es:'Entrar en ritmo',en:'Find my rhythm'}, title:{es:'FLUJO',en:'FLOW'},
            short:{es:'Para acompañar una práctica mecánica sostenida.',en:'For sustained mechanical practice.'},
            copy:{es:'Un tempo estable que sostiene la cadencia sin competir con lo que estás practicando.',en:'A steady tempo that supports cadence without competing with your practice.'},
            recommended:['lofi','jazz','reggae'], headphones:false
        },
        {
            id:'deep', symbol:'◉', color:'#35b8a8', rgb:'53,184,168', frequency:'60 BPM', bpm:60,
            name:{es:'Concentrarme',en:'Focus deeply'}, title:{es:'CONCENTRACIÓN',en:'DEEP FOCUS'},
            short:{es:'Cuando necesitas trabajar con calma y continuidad.',en:'When you need calm, continuous work.'},
            copy:{es:'Capas lentas y poco invasivas que dejan espacio para pensar durante sesiones largas.',en:'Slow, unobtrusive layers that leave room to think during longer sessions.'},
            recommended:['natural','cinematic','lofi'], headphones:false
        },
        {
            id:'precision', symbol:'◇', color:'#eab308', rgb:'234,179,8', frequency:'Δ 40 Hz', bpm:56, binaural:40, baseFreq:200,
            name:{es:'Afinar mi atención',en:'Sharpen attention'}, title:{es:'PRECISIÓN',en:'PRECISION'},
            short:{es:'Un perfil más fino para tareas de detalle.',en:'A finer profile for detail-oriented work.'},
            copy:{es:'Dos tonos laterales con 40 Hz de diferencia, acompañados por una textura discreta.',en:'Two lateral tones with a 40 Hz difference, accompanied by a restrained texture.'},
            recommended:['cinematic','natural','lofi'], headphones:true
        },
        {
            id:'recover', symbol:'⌁', color:'#7888cc', rgb:'120,136,204', frequency:'Δ 10 Hz', bpm:50, binaural:10, baseFreq:180,
            name:{es:'Bajar revoluciones',en:'Wind down'}, title:{es:'RECUPERACIÓN',en:'RECOVER'},
            short:{es:'Entre bloques o al terminar una sesión intensa.',en:'Between blocks or after an intense session.'},
            copy:{es:'Movimiento sonoro amplio y pausado, con dos tonos laterales separados por 10 Hz.',en:'Wide, slow-moving sound with two lateral tones separated by 10 Hz.'},
            recommended:['natural','cinematic','jazz'], headphones:true
        }
    ];

    const STYLES = [
        {id:'natural',code:'ENV-01',name:{es:'Natural',en:'Natural'},desc:{es:'Lluvia suave, viento y llamadas lejanas.',en:'Soft rain, wind and distant calls.'}},
        {id:'lofi',code:'ENV-02',name:{es:'Lo-fi',en:'Lo-fi'},desc:{es:'Batería cálida, acordes velados y cinta.',en:'Warm drums, veiled chords and tape.'}},
        {id:'cinematic',code:'ENV-03',name:{es:'Cinemático',en:'Cinematic'},desc:{es:'Drones profundos y capas que evolucionan.',en:'Deep drones and evolving layers.'}},
        {id:'jazz',code:'ENV-04',name:{es:'Jazz nocturno',en:'Night jazz'},desc:{es:'Escobillas, bajo suave y frases breves.',en:'Brushes, soft bass and short phrases.'}},
        {id:'tribal',code:'ENV-05',name:{es:'Pulso orgánico',en:'Organic pulse'},desc:{es:'Tambores profundos y percusión espaciada.',en:'Deep drums and spacious percussion.'}},
        {id:'reggae',code:'ENV-06',name:{es:'Dub ligero',en:'Light dub'},desc:{es:'Contratiempos, bajo redondo y aire.',en:'Offbeats, round bass and open space.'}}
    ];

    const TEXT = {
        es:{
            brandSub:'Sonido ambiental · a tu ritmo',back:'← Volver al menú',restart:'Reiniciar guía',
            chooserKicker:'Soundscape · selección guiada',chooserStep:'Paso 01 / 02',chooserTitle:'¿Qué necesitas ahora?',
            chooserCopy:'Elige una intención. Soundscape preparará una combinación para que puedas escucharla antes de comenzar.',
            chooserNote:'Soundscape acompaña tu sesión; no mide ni garantiza cambios cognitivos o fisiológicos.',
            lastEyebrow:'Tu último ambiente',lastAction:'Continuar →',
            recommendKicker:'Recomendación personalizada',recommendStep:'Paso 02 / 02',recommendBack:'← Cambiar intención',
            recommendLabel:'Texturas sugeridas',headphones:'Para percibir la separación entre canales, utiliza audífonos a un volumen cómodo.',
            showAll:'Ver las seis texturas',showLess:'Mostrar solo sugerencias',previewReady:'Muestra de 8 segundos lista',
            previewPlaying:'Escuchando muestra',previewReplay:'Escuchar otra vez',previewStart:'Escuchar muestra',previewStop:'Detener muestra',
            start:'Usar este sonido',live:'Ambiente activo',playerKicker:'Ahora reproduciendo',volume:'Volumen global',
            intensity:'Intensidad',brightness:'Brillo',change:'Cambiar ambiente',stop:'Detener',pause:'Pausar',resume:'Reanudar',
            low:'Suave',medium:'Medio',high:'Alto',dark:'Cálido',clear:'Claro',
            stopped:'El ambiente se detuvo y liberó sus recursos.',audioError:'No fue posible iniciar el audio en este navegador.',
            playerNote:'El volumen se comparte con los ajustes generales. Para sesiones largas, mantenlo en un nivel cómodo.',
            recommended:'Recomendado',styleSelected:'Textura seleccionada'
        },
        en:{
            brandSub:'Ambient sound · your own pace',back:'← Back to menu',restart:'Restart guide',
            chooserKicker:'Soundscape · guided selection',chooserStep:'Step 01 / 02',chooserTitle:'What do you need right now?',
            chooserCopy:'Choose an intention. Soundscape will prepare a combination you can hear before you begin.',
            chooserNote:'Soundscape accompanies your session; it does not measure or guarantee cognitive or physiological changes.',
            lastEyebrow:'Your last environment',lastAction:'Continue →',
            recommendKicker:'Personal recommendation',recommendStep:'Step 02 / 02',recommendBack:'← Change intention',
            recommendLabel:'Suggested textures',headphones:'Use headphones at a comfortable volume to perceive the channel separation.',
            showAll:'View all six textures',showLess:'Show suggestions only',previewReady:'8-second preview ready',
            previewPlaying:'Playing preview',previewReplay:'Listen again',previewStart:'Play preview',previewStop:'Stop preview',
            start:'Use this sound',live:'Environment active',playerKicker:'Now playing',volume:'Global volume',
            intensity:'Intensity',brightness:'Brightness',change:'Change environment',stop:'Stop',pause:'Pause',resume:'Resume',
            low:'Soft',medium:'Medium',high:'High',dark:'Warm',clear:'Clear',
            stopped:'The environment stopped and released its resources.',audioError:'Audio could not start in this browser.',
            playerNote:'Volume is shared with general settings. Keep it comfortable during long sessions.',
            recommended:'Recommended',styleSelected:'Selected texture'
        }
    };

    function lang(){ return global.I18N && I18N.lang === 'en' ? 'en' : 'es'; }
    function t(key){ return TEXT[lang()][key] || key; }
    function local(value){ return value[lang()] || value.es; }
    function byId(id){ return document.getElementById(id); }
    function modeById(id){ return MODES.find(mode => mode.id === id) || MODES[2]; }
    function styleById(id){ return STYLES.find(style => style.id === id) || STYLES[0]; }
    function clamp(value,min,max){ return Math.min(max,Math.max(min,value)); }

    function seededRandom(seed){
        let value = seed >>> 0;
        return function(){
            value += 0x6D2B79F5;
            let out = value;
            out = Math.imul(out ^ out >>> 15,out | 1);
            out ^= out + Math.imul(out ^ out >>> 7,out | 61);
            return ((out ^ out >>> 14) >>> 0) / 4294967296;
        };
    }

    const SoundscapeEngine = {
        ctx:null, output:null, analyser:null, sceneBus:null, dryGain:null, brightnessFilter:null,
        energyGain:null, scheduler:null, generation:0, nextBeatTime:0, beat:0,
        playing:false, paused:false, modeId:null, styleId:null, intensity:.55, brightness:.5,
        persistent:new Set(), transients:new Set(), buffers:new Map(), random:seededRandom(1),
        releaseTimer:null, warming:false,

        init(){
            if(!global.AudioContext && !global.webkitAudioContext) throw new Error('Web Audio unavailable');
            Snd.init();
            if(!Snd.ctx || !Snd.masterGain) throw new Error('Audio context unavailable');
            this.ctx = Snd.ctx;
            this.output = Snd.masterGain;
            if(this.ctx.state === 'suspended') this.ctx.resume();
        },

        warm(){
            try{ this.init(); }catch(error){ return; }
            clearTimeout(this.releaseTimer);this.releaseTimer=null;
            if(this.warming)return;
            this.warming=true;
            const tasks=[()=>this._noiseBuffer('white'),()=>this._noiseBuffer('pink'),()=>this._noiseBuffer('brown'),()=>this._impulseBuffer()];
            const run=()=>{
                if(!tasks.length||!this.ctx){this.warming=false;return;}
                tasks.shift()();
                const idle=global.requestIdleCallback||((callback)=>setTimeout(callback,24));idle(run,{timeout:180});
            };
            const idle=global.requestIdleCallback||((callback)=>setTimeout(callback,24));idle(run,{timeout:180});
        },

        _remember(){
            for(const node of arguments) if(node) this.persistent.add(node);
            return arguments[0];
        },

        _rememberTransient(sources,nodes){
            const all = Array.from(new Set(nodes.filter(Boolean)));
            all.forEach(node => this.transients.add(node));
            let remaining = sources.length;
            const release = () => {
                remaining--;
                if(remaining > 0) return;
                all.forEach(node => {
                    try{ node.disconnect(); }catch(error){}
                    this.transients.delete(node);
                });
            };
            sources.forEach(source => { source.onended = release; });
        },

        _disconnect(nodes){
            nodes.forEach(node => {
                try{ if(typeof node.stop === 'function') node.stop(); }catch(error){}
                try{ node.disconnect(); }catch(error){}
            });
        },

        _noiseBuffer(color){
            const key = color + '@' + this.ctx.sampleRate;
            if(this.buffers.has(key)) return this.buffers.get(key);
            const seconds = color === 'white' ? 1 : 4;
            const buffer = this.ctx.createBuffer(1,Math.floor(this.ctx.sampleRate * seconds),this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            if(color === 'pink'){
                let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
                for(let i=0;i<data.length;i++){
                    const white=Math.random()*2-1;
                    b0=.99886*b0+white*.0555179;b1=.99332*b1+white*.0750759;b2=.969*b2+white*.153852;
                    b3=.8665*b3+white*.3104856;b4=.55*b4+white*.5329522;b5=-.7616*b5-white*.016898;
                    data[i]=(b0+b1+b2+b3+b4+b5+b6+white*.5362)*.11;b6=white*.115926;
                }
            }else if(color === 'brown'){
                let last=0;
                for(let i=0;i<data.length;i++){const white=Math.random()*2-1;data[i]=(last+.024*white)/1.024;last=data[i];data[i]*=3.1;}
            }else{
                for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
            }
            this.buffers.set(key,buffer);
            return buffer;
        },

        _impulseBuffer(){
            const key = 'impulse@' + this.ctx.sampleRate;
            if(this.buffers.has(key)) return this.buffers.get(key);
            const length = Math.floor(this.ctx.sampleRate * 1.45);
            const buffer = this.ctx.createBuffer(2,length,this.ctx.sampleRate);
            for(let channel=0;channel<2;channel++){
                const data=buffer.getChannelData(channel);
                for(let i=0;i<length;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/length,2.9);
            }
            this.buffers.set(key,buffer);
            return buffer;
        },

        _buildGraph(){
            const ctx=this.ctx;
            const scene=ctx.createGain(),dry=ctx.createGain(),wetSend=ctx.createGain(),convolver=ctx.createConvolver();
            const wet=ctx.createGain(),highpass=ctx.createBiquadFilter(),brightness=ctx.createBiquadFilter();
            const energy=ctx.createGain(),compressor=ctx.createDynamicsCompressor(),analyser=ctx.createAnalyser();
            scene.gain.value=0;
            dry.gain.value=.88;wetSend.gain.value=.22;wet.gain.value=.3;
            convolver.buffer=this._impulseBuffer();
            highpass.type='highpass';highpass.frequency.value=32;highpass.Q.value=.35;
            brightness.type='lowpass';brightness.Q.value=.25;
            energy.gain.value=.92;
            compressor.threshold.value=-18;compressor.knee.value=16;compressor.ratio.value=3.2;compressor.attack.value=.018;compressor.release.value=.32;
            analyser.fftSize=128;analyser.smoothingTimeConstant=.83;
            scene.connect(dry);dry.connect(highpass);
            scene.connect(wetSend);wetSend.connect(convolver);convolver.connect(wet);wet.connect(highpass);
            highpass.connect(brightness);brightness.connect(energy);energy.connect(compressor);compressor.connect(analyser);analyser.connect(this.output);
            this._remember(scene,dry,wetSend,convolver,wet,highpass,brightness,energy,compressor,analyser);
            this.sceneBus=scene;this.dryGain=dry;this.brightnessFilter=brightness;this.energyGain=energy;this.analyser=analyser;
            this.setIntensity(this.intensity,true);this.setBrightness(this.brightness,true);
        },

        start(modeId,styleId){
            this.init();
            clearTimeout(this.releaseTimer);this.releaseTimer=null;
            this.stop(false);
            clearTimeout(this.releaseTimer);this.releaseTimer=null;
            this._buildGraph();
            this.modeId=modeId;this.styleId=styleId;this.playing=true;this.paused=false;
            this.random=seededRandom((Date.now() ^ (modeId.length<<12) ^ (styleId.length<<4))>>>0);
            const mode=modeById(modeId);
            this._compose(styleId,mode.bpm);
            if(mode.binaural) this._addBinaural(mode);
            this.beat=0;this.nextBeatTime=this.ctx.currentTime+.07;
            const now=this.ctx.currentTime;
            this.sceneBus.gain.cancelScheduledValues(now);this.sceneBus.gain.setValueAtTime(0,now);this.sceneBus.gain.linearRampToValueAtTime(.72,now+.42);
            const generation=++this.generation;
            this._scheduleLoop(generation,mode.bpm);
        },

        stop(immediate){
            this.generation++;
            if(this.scheduler){ clearTimeout(this.scheduler);this.scheduler=null; }
            const nodes=[...this.persistent,...this.transients];
            this.persistent.clear();this.transients.clear();
            const gain=this.sceneBus,ctx=this.ctx;
            const clean=()=>this._disconnect(nodes);
            if(!immediate && gain && ctx){
                const now=ctx.currentTime;
                try{gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(0,now+.09);}catch(error){}
                setTimeout(clean,120);
            }else clean();
            this.playing=false;this.paused=false;this.modeId=null;this.styleId=null;
            this.sceneBus=null;this.dryGain=null;this.brightnessFilter=null;this.energyGain=null;this.analyser=null;
            clearTimeout(this.releaseTimer);
            this.releaseTimer=setTimeout(()=>{if(!this.playing)this.buffers.clear();},120000);
        },

        destroy(){
            this.stop(true);
            clearTimeout(this.releaseTimer);this.releaseTimer=null;
            this.buffers.clear();
            if(this.ctx && this.ctx.state !== 'closed'){
                try{ this.ctx.close(); }catch(error){}
            }
            this.ctx=null;this.output=null;
        },

        toggle(){
            if(!this.playing || !this.sceneBus) return false;
            const now=this.ctx.currentTime;
            if(this.paused){
                this.paused=false;this.nextBeatTime=now+.06;
                this.sceneBus.gain.cancelScheduledValues(now);this.sceneBus.gain.setValueAtTime(this.sceneBus.gain.value,now);this.sceneBus.gain.linearRampToValueAtTime(.72,now+.2);
                const generation=++this.generation;this._scheduleLoop(generation,modeById(this.modeId).bpm);
                return true;
            }
            this.paused=true;this.generation++;
            if(this.scheduler){clearTimeout(this.scheduler);this.scheduler=null;}
            this.sceneBus.gain.cancelScheduledValues(now);this.sceneBus.gain.setValueAtTime(this.sceneBus.gain.value,now);this.sceneBus.gain.linearRampToValueAtTime(0,now+.12);
            return false;
        },

        setVolume(value){ Snd.setVolume(clamp(value,0,1)); },
        setIntensity(value,immediate){
            this.intensity=clamp(value,0,1);
            if(!this.energyGain || !this.ctx) return;
            const target=.78+this.intensity*.3,now=this.ctx.currentTime;
            this.energyGain.gain.cancelScheduledValues(now);
            if(immediate)this.energyGain.gain.setValueAtTime(target,now);else this.energyGain.gain.linearRampToValueAtTime(target,now+.12);
        },
        setBrightness(value,immediate){
            this.brightness=clamp(value,0,1);
            if(!this.brightnessFilter || !this.ctx) return;
            const target=900+Math.pow(this.brightness,1.55)*9300,now=this.ctx.currentTime;
            this.brightnessFilter.frequency.cancelScheduledValues(now);
            if(immediate)this.brightnessFilter.frequency.setValueAtTime(target,now);else this.brightnessFilter.frequency.exponentialRampToValueAtTime(target,now+.16);
        },

        _scheduleLoop(generation,bpm){
            if(generation!==this.generation || !this.playing || this.paused) return;
            const now=this.ctx.currentTime;
            if(this.nextBeatTime<now-.2)this.nextBeatTime=now+.04;
            const background=document.hidden;
            const horizon=now+(background?1.2:.14),beatLength=60/bpm;
            while(this.nextBeatTime<horizon){
                this._scheduleBeat(this.nextBeatTime,this.beat++);
                this.nextBeatTime+=beatLength;
            }
            this.scheduler=setTimeout(()=>this._scheduleLoop(generation,bpm),background?480:30);
        },

        _cleanGroup(sources,nodes){ this._rememberTransient(sources,nodes); },

        _gainEnvelope(gain,t,peak,attack,hold,release){
            const end=t+attack+hold+release;
            gain.gain.setValueAtTime(.0001,t);
            gain.gain.linearRampToValueAtTime(Math.max(.0001,peak),t+attack);
            gain.gain.setValueAtTime(Math.max(.0001,peak),t+attack+hold);
            gain.gain.exponentialRampToValueAtTime(.0001,end);
            return end;
        },

        _noiseHit(t,dst,options){
            const ctx=this.ctx,o=Object.assign({duration:.08,volume:.04,type:'highpass',frequency:5000,q:.7},options||{});
            const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
            source.buffer=this._noiseBuffer('white');
            filter.type=o.type;filter.frequency.value=o.frequency;filter.Q.value=o.q;
            const end=this._gainEnvelope(gain,t,o.volume,.002,0,Math.max(.015,o.duration-.002));
            source.connect(filter);filter.connect(gain);gain.connect(dst);
            const maxOffset=Math.max(0,source.buffer.duration-o.duration-.01);source.start(t,this.random()*maxOffset,o.duration);source.stop(end+.02);
            this._cleanGroup([source],[source,filter,gain]);
        },

        _kick(t,dst,volume,freq){
            const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
            osc.type='sine';osc.frequency.setValueAtTime(freq||95,t);osc.frequency.exponentialRampToValueAtTime(38,t+.15);
            filter.type='lowpass';filter.frequency.value=820;
            const end=this._gainEnvelope(gain,t,volume||.22,.004,.015,.26);
            osc.connect(filter);filter.connect(gain);gain.connect(dst);osc.start(t);osc.stop(end+.03);
            this._cleanGroup([osc],[osc,filter,gain]);
        },

        _tom(t,dst,volume,freq,panValue){
            const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain(),pan=ctx.createStereoPanner();
            osc.type='sine';osc.frequency.setValueAtTime(freq||90,t);osc.frequency.exponentialRampToValueAtTime((freq||90)*.58,t+.24);
            pan.pan.value=panValue||0;const end=this._gainEnvelope(gain,t,volume||.18,.006,.02,.37);
            osc.connect(gain);gain.connect(pan);pan.connect(dst);osc.start(t);osc.stop(end+.03);
            this._cleanGroup([osc],[osc,gain,pan]);
        },

        _hat(t,dst,volume,open){
            this._noiseHit(t,dst,{duration:open?.18:.055,volume:volume||.025,type:'highpass',frequency:open?5600:6900,q:.45});
        },

        _snare(t,dst,volume){
            const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain();
            osc.type='triangle';osc.frequency.setValueAtTime(190,t);osc.frequency.exponentialRampToValueAtTime(125,t+.075);
            const end=this._gainEnvelope(gain,t,(volume||.07)*.55,.002,.005,.105);
            osc.connect(gain);gain.connect(dst);osc.start(t);osc.stop(end+.02);
            this._cleanGroup([osc],[osc,gain]);
            this._noiseHit(t,dst,{duration:.12,volume:volume||.07,type:'bandpass',frequency:1850,q:.8});
        },

        _bass(t,dst,frequency,duration,volume){
            const ctx=this.ctx,osc=ctx.createOscillator(),upper=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
            osc.type='sine';upper.type='triangle';osc.frequency.value=frequency;upper.frequency.value=frequency*2;upper.detune.value=-4;
            filter.type='lowpass';filter.frequency.value=520;filter.Q.value=.7;
            const end=this._gainEnvelope(gain,t,volume||.07,.018,Math.max(.01,duration*.63),Math.max(.08,duration*.32));
            osc.connect(filter);upper.connect(filter);filter.connect(gain);gain.connect(dst);osc.start(t);upper.start(t);osc.stop(end+.03);upper.stop(end+.03);
            this._cleanGroup([osc,upper],[osc,upper,filter,gain]);
        },

        _tone(t,dst,frequency,duration,volume,type,panValue){
            const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain(),pan=ctx.createStereoPanner();
            osc.type=type||'triangle';osc.frequency.value=frequency;pan.pan.value=panValue||0;
            const end=this._gainEnvelope(gain,t,volume||.025,.025,Math.max(.01,duration*.4),Math.max(.06,duration*.5));
            osc.connect(gain);gain.connect(pan);pan.connect(dst);osc.start(t);osc.stop(end+.03);
            this._cleanGroup([osc],[osc,gain,pan]);
        },

        _pad(t,dst,frequencies,duration,volume){
            const ctx=this.ctx,filter=ctx.createBiquadFilter(),gain=ctx.createGain(),sources=[],voices=[];
            filter.type='lowpass';filter.frequency.value=1050+this.brightness*1100;filter.Q.value=.45;
            const end=this._gainEnvelope(gain,t,volume||.045,.42,Math.max(.1,duration-.9),.48);
            filter.connect(gain);gain.connect(dst);
            frequencies.forEach((frequency,index)=>{
                const osc=ctx.createOscillator();osc.type=index%2?'triangle':'sawtooth';osc.frequency.value=frequency;osc.detune.value=(index-1)*3;
                const voice=ctx.createGain();voice.gain.value=1/frequencies.length;osc.connect(voice);voice.connect(filter);osc.start(t);osc.stop(end+.05);
                sources.push(osc);voices.push(voice);
            });
            this._cleanGroup(sources,[...sources,...voices,filter,gain]);
        },

        _chordStab(t,dst,frequencies,volume){
            const ctx=this.ctx,filter=ctx.createBiquadFilter(),gain=ctx.createGain(),sources=[],voices=[];
            filter.type='bandpass';filter.frequency.value=1450;filter.Q.value=.8;
            const end=this._gainEnvelope(gain,t,volume||.045,.005,.012,.11);filter.connect(gain);gain.connect(dst);
            frequencies.forEach(frequency=>{const osc=ctx.createOscillator(),voice=ctx.createGain();osc.type='triangle';osc.frequency.value=frequency;voice.gain.value=1/frequencies.length;osc.connect(voice);voice.connect(filter);osc.start(t);osc.stop(end+.02);sources.push(osc);voices.push(voice);});
            this._cleanGroup(sources,[...sources,...voices,filter,gain]);
        },

        _loopNoise(color,dst,volume,filterType,frequency,q){
            const ctx=this.ctx,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
            source.buffer=this._noiseBuffer(color);source.loop=true;filter.type=filterType||'lowpass';filter.frequency.value=frequency||1800;filter.Q.value=q||.4;gain.gain.value=volume;
            source.connect(filter);filter.connect(gain);gain.connect(dst);source.start();this._remember(source,filter,gain);return {source,filter,gain};
        },

        _drone(dst,frequency,volume){
            const ctx=this.ctx,filter=ctx.createBiquadFilter(),gain=ctx.createGain(),lfo=ctx.createOscillator(),lfoGain=ctx.createGain();
            const a=ctx.createOscillator(),b=ctx.createOscillator();a.type='sine';b.type='triangle';a.frequency.value=frequency;b.frequency.value=frequency*1.502;b.detune.value=-6;
            filter.type='lowpass';filter.frequency.value=620;filter.Q.value=.55;gain.gain.value=volume;
            lfo.type='sine';lfo.frequency.value=.065;lfoGain.gain.value=110;lfo.connect(lfoGain);lfoGain.connect(filter.frequency);
            a.connect(filter);b.connect(filter);filter.connect(gain);gain.connect(dst);a.start();b.start();lfo.start();this._remember(a,b,filter,gain,lfo,lfoGain);
        },

        _bird(t,dst){
            const base=[1850,2360,3020][Math.floor(this.random()*3)],ctx=this.ctx,osc=ctx.createOscillator(),mod=ctx.createOscillator();
            const modGain=ctx.createGain(),gain=ctx.createGain(),pan=ctx.createStereoPanner();
            osc.type='sine';osc.frequency.setValueAtTime(base,t);osc.frequency.exponentialRampToValueAtTime(base*(1.12+this.random()*.15),t+.18);
            mod.frequency.value=7+this.random()*5;modGain.gain.value=65+this.random()*90;mod.connect(modGain);modGain.connect(osc.frequency);
            pan.pan.value=this.random()*1.4-.7;const end=this._gainEnvelope(gain,t,.014+this.intensity*.014,.012,.025,.18);
            osc.connect(gain);gain.connect(pan);pan.connect(dst);osc.start(t);mod.start(t);osc.stop(end+.02);mod.stop(end+.02);
            this._cleanGroup([osc,mod],[osc,mod,modGain,gain,pan]);
        },

        _addBinaural(mode){
            const ctx=this.ctx,merger=ctx.createChannelMerger(2),gain=ctx.createGain(),left=ctx.createOscillator(),right=ctx.createOscillator();
            const gainL=ctx.createGain(),gainR=ctx.createGain();left.type='sine';right.type='sine';left.frequency.value=mode.baseFreq;right.frequency.value=mode.baseFreq+mode.binaural;
            gain.gain.value=.42;gainL.gain.value=.033;gainR.gain.value=.033;
            left.connect(gainL);right.connect(gainR);gainL.connect(merger,0,0);gainR.connect(merger,0,1);merger.connect(gain);gain.connect(this.dryGain);
            left.start();right.start();this._remember(merger,gain,left,right,gainL,gainR);
        },

        _compose(styleId,bpm){
            const dst=this.sceneBus;
            this.scene={id:styleId,bpm,dst,beat:()=>{}};
            const beatLength=60/bpm;
            if(styleId==='natural'){
                const rain=this._loopNoise('pink',dst,.065,'bandpass',1450,.35);
                const wind=this._loopNoise('brown',dst,.045,'lowpass',520,.7);
                const lfo=this.ctx.createOscillator(),lfoGain=this.ctx.createGain();lfo.frequency.value=.075;lfoGain.gain.value=170;lfo.connect(lfoGain);lfoGain.connect(wind.filter.frequency);lfo.start();this._remember(lfo,lfoGain);
                this.scene.beat=(t,beat)=>{if(beat>2&&beat%4===0&&this.random()<.12+this.intensity*.11){this._bird(t+this.random()*.35,dst);if(this.random()<.3)this._bird(t+.22+this.random()*.2,dst);}};
            }else if(styleId==='lofi'){
                this._loopNoise('white',dst,.0055,'bandpass',4100,.32);
                const chords=[[130.81,155.56,196],[116.54,146.83,174.61],[103.83,130.81,155.56],[98,123.47,146.83]];
                this.scene.beat=(t,beat)=>{const pos=beat%16,bar=Math.floor(beat/4),drop=Math.floor(beat/16)%4===3;
                    if(beat%8===0)this._pad(t,dst,chords[Math.floor(beat/8)%chords.length],beatLength*7.2,.027);
                    if(pos%4===0&&!drop)this._kick(t,dst,.18+.06*this.intensity,78);
                    if(pos%4===2)this._snare(t,dst,.045+.035*this.intensity);
                    if(this.intensity>.2)this._hat(t,dst,.012+.016*this.intensity,false);
                    if(this.intensity>.48&&pos%2===0)this._hat(t+beatLength*.5,dst,.01+.01*this.intensity,false);
                    if((pos===3||pos===11)&&this.random()<.55)this._tone(t+beatLength*.45,dst,[261.63,311.13,392][bar%3],beatLength*.8,.012,'sine',this.random()*.5-.25);
                };
            }else if(styleId==='cinematic'){
                this._drone(dst,55,.032);this._drone(dst,73.42,.018);
                const chords=[[110,146.83,220],[98,130.81,196],[87.31,130.81,174.61],[82.41,123.47,164.81]];
                this.scene.beat=(t,beat)=>{if(beat%16===0)this._pad(t,dst,chords[(beat/16)%4],beatLength*15,.032+.015*this.intensity);
                    if(beat>0&&beat%32===0&&this.random()<.62*this.intensity){this._kick(t,dst,.26,56);this._noiseHit(t,dst,{duration:.7,volume:.055,type:'lowpass',frequency:850,q:.35});}
                    if(beat%8===6&&this.random()<.35)this._tone(t,dst,440*(beat%16?1:1.125),beatLength*2.5,.009,'sine',this.random()*.8-.4);
                };
            }else if(styleId==='jazz'){
                const roots=[65.41,87.31,98,73.42],scale=[261.63,293.66,311.13,349.23,392,440,466.16];
                this.scene.beat=(t,beat)=>{const pos=beat%16,inBar=beat%4,root=roots[Math.floor(beat/4)%4];
                    if(inBar===0)this._kick(t,dst,.12+.05*this.intensity,88);
                    if(inBar===1||inBar===3)this._noiseHit(t,dst,{duration:.11,volume:.018+.012*this.intensity,type:'highpass',frequency:4800,q:.25});
                    this._bass(t,dst,root*(inBar===3?1.122:1),beatLength*.84,.048+.025*this.intensity);
                    if(inBar===0&&beat%8===0)this._chordStab(t+beatLength*.08,dst,[root*2,root*2.378,root*2.997],.026);
                    if(this.intensity>.36&&(pos===6||pos===13)){const note=scale[(Math.floor(beat/4)+pos)%scale.length];this._tone(t+beatLength*.18,dst,note,beatLength*1.35,.016,'triangle',this.random()*.6-.3);}
                };
            }else if(styleId==='tribal'){
                const patterns=[[1,0,0,1,0,1,0,0,1,0,1,0,0,1,0,1],[1,0,1,0,0,1,0,1,1,0,0,1,0,1,1,0]];
                this.scene.beat=(t,beat)=>{const pos=beat%16,pattern=patterns[Math.floor(beat/16)%2];
                    if(pattern[pos])this._tom(t,dst,.13+.11*this.intensity,[64,82,104][pos%3],pos%2?.32:-.32);
                    if(this.intensity>.25)this._noiseHit(t,dst,{duration:.065,volume:.012+.014*this.intensity,type:'bandpass',frequency:6900,q:1.2});
                    if(this.intensity>.6&&pos%4===1)this._tom(t+beatLength*.5,dst,.09,126,.45);
                    if(pos===15&&this.random()<.48)this._noiseHit(t+beatLength*.7,dst,{duration:.16,volume:.024,type:'highpass',frequency:4200,q:.5});
                };
            }else{
                const chords=[[130.81,155.56,196],[174.61,207.65,261.63],[146.83,174.61,220],[130.81,155.56,196]],roots=[65.41,87.31,73.42,65.41];
                this.scene.beat=(t,beat)=>{const pos=beat%16,inBar=beat%4,index=Math.floor(beat/4)%4,drop=Math.floor(beat/16)%4===2;
                    if((inBar===1||inBar===3)&&!drop)this._chordStab(t+beatLength*.46,dst,chords[index],.028+.018*this.intensity);
                    if(inBar===2){this._kick(t,dst,.15+.05*this.intensity,82);this._bass(t,dst,roots[index],beatLength*1.45,.065+.02*this.intensity);}
                    if(this.intensity>.38&&(inBar===0||inBar===2))this._hat(t,dst,.018,false);
                    if(pos===15&&this.random()<.3)this._noiseHit(t+beatLength*.5,dst,{duration:.22,volume:.018,type:'highpass',frequency:3200,q:.5});
                };
            }
        },

        _scheduleBeat(time,beat){ if(this.scene && this.scene.beat)this.scene.beat(time,beat); }
    };

    global.SoundscapeEngine=SoundscapeEngine;

    const saved=Store.getPrefs(MODULE)||{};
    const state={
        modeId:MODES.some(mode=>mode.id===saved.modeId)?saved.modeId:'deep',
        styleId:STYLES.some(style=>style.id===saved.styleId)?saved.styleId:'natural',
        seen:Boolean(saved.seen),showAll:false,previewing:false,previewRaf:0,previewStarted:0,
        playing:false,paused:false,elapsed:0,runStarted:0,visualRaf:0,toastTimer:0,
        intensity:clamp(Number.isFinite(saved.intensity)?saved.intensity:.55,0,1),
        brightness:clamp(Number.isFinite(saved.brightness)?saved.brightness:.5,0,1)
    };

    function savePrefs(){
        Store.savePrefs(MODULE,{version:2,seen:state.seen,modeId:state.modeId,styleId:state.styleId,intensity:state.intensity,brightness:state.brightness});
    }

    function setAccent(mode){
        document.documentElement.style.setProperty('--accent',mode.color);
        document.documentElement.style.setProperty('--accent-rgb',mode.rgb);
    }

    function showView(name){
        ['chooser','recommendation','player'].forEach(id=>{
            const element=byId(id),active=id===name;element.hidden=!active;element.classList.toggle('is-active',active);
        });
        byId('restart-guide').hidden=!state.seen||name==='chooser';
        requestAnimationFrame(()=>{const heading=name==='chooser'?byId('chooser-title'):name==='recommendation'?byId('recommend-title'):byId('player-mode');heading?.focus?.({preventScroll:true});});
    }

    function renderStaticCopy(){
        document.documentElement.lang=lang();
        byId('brand-sub').textContent=t('brandSub');byId('back-home').textContent=t('back');byId('restart-guide').textContent=t('restart');
        byId('chooser-kicker').textContent=t('chooserKicker');byId('chooser-step').textContent=t('chooserStep');byId('chooser-title').textContent=t('chooserTitle');
        byId('chooser-copy').textContent=t('chooserCopy');byId('chooser-note').textContent=t('chooserNote');
        byId('recommend-kicker').textContent=t('recommendKicker');byId('recommend-step').textContent=t('recommendStep');byId('recommend-back').textContent=t('recommendBack');
        byId('recommend-label').textContent=t('recommendLabel');byId('headphone-copy').textContent=t('headphones');
        byId('live-label').textContent=state.paused?t('resume'):t('live');byId('player-kicker').textContent=t('playerKicker');
        byId('volume-label').textContent=t('volume');byId('intensity-label').textContent=t('intensity');byId('brightness-label').textContent=t('brightness');
        byId('change-button').textContent=t('change');byId('stop-button').textContent=t('stop');byId('player-note').textContent=t('playerNote');
        renderIntents();renderReturning();renderRecommendation();renderPlayerCopy();updateRanges();updatePauseButton();
    }

    function renderIntents(){
        const grid=byId('intent-grid');grid.replaceChildren();
        MODES.forEach((mode,index)=>{
            const button=document.createElement('button');button.type='button';button.className='intent-card';button.setAttribute('role','listitem');
            button.style.setProperty('--card-accent',mode.color);
            button.innerHTML=`<span class="intent-index">0${index+1}</span><span class="intent-symbol" aria-hidden="true">${mode.symbol}</span><strong>${local(mode.name)}</strong><p>${local(mode.short)}</p><span class="intent-frequency">${mode.frequency}</span>`;
            button.addEventListener('mouseenter',()=>Snd.tick(720+index*72));button.addEventListener('click',()=>selectMode(mode.id));grid.appendChild(button);
        });
    }

    function renderReturning(){
        const button=byId('last-session');button.hidden=!state.seen;
        if(!state.seen)return;
        const mode=modeById(state.modeId),style=styleById(state.styleId);
        byId('last-eyebrow').textContent=t('lastEyebrow');byId('last-name').textContent=`${local(mode.title)} · ${local(style.name)}`;byId('last-action').textContent=t('lastAction');
        button.style.setProperty('--accent',mode.color);
    }

    function selectMode(modeId){
        stopPreview();state.modeId=modeId;state.styleId=modeById(modeId).recommended[0];state.showAll=false;setAccent(modeById(modeId));renderRecommendation();showView('recommendation');SoundscapeEngine.warm();Snd.tick(980);
    }

    function orderedStyles(mode){
        return [...mode.recommended,...STYLES.map(style=>style.id).filter(id=>!mode.recommended.includes(id))].map(styleById);
    }

    function renderRecommendation(){
        const mode=modeById(state.modeId),style=styleById(state.styleId);setAccent(mode);
        byId('recommend-sigil').textContent=mode.symbol;byId('recommend-frequency').textContent=mode.frequency;byId('recommend-title').textContent=local(mode.title);byId('recommend-copy').textContent=local(mode.copy);
        byId('headphone-note').hidden=!mode.headphones;
        const grid=byId('style-grid');grid.replaceChildren();grid.classList.toggle('show-all',state.showAll);
        orderedStyles(mode).forEach((item,index)=>{
            const button=document.createElement('button');button.type='button';button.className='style-card'+(index>=3?' is-extra':'');button.dataset.style=item.id;
            button.setAttribute('role','radio');button.setAttribute('aria-checked',String(item.id===style.id));button.setAttribute('aria-label',`${local(item.name)}. ${local(item.desc)}`);
            button.innerHTML=`<span class="style-code">${index===0?t('recommended'):item.code}</span><strong>${local(item.name)}</strong><p>${local(item.desc)}</p>`;
            button.addEventListener('mouseenter',()=>Snd.tick(860+index*35));button.addEventListener('click',()=>selectStyle(item.id));grid.appendChild(button);
        });
        byId('all-styles-button').textContent=state.showAll?t('showLess'):t('showAll');
        if(!state.previewing){byId('preview-label').textContent=t('previewReady');byId('preview-button').textContent=t('previewStart');byId('preview-progress').style.width='0%';}
        byId('start-button').textContent=t('start');
    }

    function selectStyle(styleId){
        stopPreview();state.styleId=styleId;renderRecommendation();Snd.tick(1050);
    }

    function startPreview(){
        if(state.previewing){stopPreview();return;}
        try{
            SoundscapeEngine.intensity=state.intensity;SoundscapeEngine.brightness=state.brightness;SoundscapeEngine.start(state.modeId,state.styleId);
        }catch(error){showToast(t('audioError'));return;}
        state.previewing=true;state.previewStarted=performance.now();byId('preview-button').textContent=t('previewStop');byId('preview-label').textContent=t('previewPlaying');
        const tick=now=>{
            if(!state.previewing)return;
            const progress=clamp((now-state.previewStarted)/PREVIEW_MS,0,1);byId('preview-progress').style.width=(progress*100).toFixed(1)+'%';
            if(progress>=1){stopPreview(true);return;}state.previewRaf=requestAnimationFrame(tick);
        };
        state.previewRaf=requestAnimationFrame(tick);
    }

    function stopPreview(finished){
        if(state.previewRaf)cancelAnimationFrame(state.previewRaf);state.previewRaf=0;
        if(state.previewing)SoundscapeEngine.stop(false);state.previewing=false;
        const button=byId('preview-button'),label=byId('preview-label'),progress=byId('preview-progress');
        if(button)button.textContent=finished?t('previewReplay'):t('previewStart');if(label)label.textContent=finished?t('previewReady'):t('previewReady');if(progress)progress.style.width=finished?'100%':'0%';
    }

    function startPlayer(){
        stopPreview();
        try{
            SoundscapeEngine.intensity=state.intensity;SoundscapeEngine.brightness=state.brightness;SoundscapeEngine.start(state.modeId,state.styleId);
        }catch(error){showToast(t('audioError'));return;}
        state.seen=true;state.playing=true;state.paused=false;state.elapsed=0;state.runStarted=performance.now();savePrefs();
        renderReturning();renderPlayerCopy();updateRanges();updatePauseButton();showView('player');startVisualizer();
    }

    function renderPlayerCopy(){
        const mode=modeById(state.modeId),style=styleById(state.styleId);setAccent(mode);
        byId('player-frequency').textContent=mode.frequency;byId('player-style').textContent=local(style.name);byId('player-mode').textContent=local(mode.title);byId('player-description').textContent=local(mode.copy);
    }

    function elapsedMs(){return state.elapsed+(state.playing&&!state.paused?performance.now()-state.runStarted:0);}
    function formatTime(milliseconds){const seconds=Math.floor(milliseconds/1000),minutes=Math.floor(seconds/60);return String(minutes).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}

    function updatePauseButton(){
        const button=byId('pause-button');if(!button)return;
        button.setAttribute('aria-label',state.paused?t('resume'):t('pause'));
        button.innerHTML=state.paused?'<svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M2 1l15 9-15 9V1z" fill="currentColor"/></svg>':'<svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><rect x="1" y="1" width="5" height="18" fill="currentColor"/><rect x="12" y="1" width="5" height="18" fill="currentColor"/></svg>';
        byId('player').classList.toggle('is-paused',state.paused);byId('live-label').textContent=state.paused?t('resume'):t('live');
    }

    function togglePause(){
        const now=performance.now();
        if(state.paused){state.runStarted=now;SoundscapeEngine.toggle();state.paused=false;}else{state.elapsed+=now-state.runStarted;SoundscapeEngine.toggle();state.paused=true;}
        updatePauseButton();startVisualizer();
    }

    function stopPlayer(showMessage){
        if(state.playing&&!state.paused)state.elapsed+=performance.now()-state.runStarted;
        state.playing=false;state.paused=false;SoundscapeEngine.stop(false);stopVisualizer();
        byId('elapsed').textContent='00:00';renderReturning();showView('chooser');if(showMessage)showToast(t('stopped'));
    }

    function changeEnvironment(){
        if(state.playing&&!state.paused)state.elapsed+=performance.now()-state.runStarted;
        state.playing=false;state.paused=false;SoundscapeEngine.stop(false);stopVisualizer();renderRecommendation();showView('recommendation');
    }

    function levelWord(value,kind){
        if(kind==='brightness')return value<.34?t('dark'):value<.67?t('medium'):t('clear');
        return value<.34?t('low'):value<.67?t('medium'):t('high');
    }

    function updateRanges(){
        const volume=Math.round(Snd.getVolume()*100);byId('volume-range').value=volume;byId('volume-output').textContent=volume+'%';
        byId('intensity-range').value=Math.round(state.intensity*100);byId('intensity-output').textContent=levelWord(state.intensity,'intensity');
        byId('brightness-range').value=Math.round(state.brightness*100);byId('brightness-output').textContent=levelWord(state.brightness,'brightness');
    }

    function startVisualizer(){
        stopVisualizer();if(!state.playing||document.hidden)return;
        const canvas=byId('visualizer'),context=canvas.getContext('2d'),data=new Uint8Array(64);
        const frame=()=>{
            if(!state.playing||document.hidden)return;
            const rect=canvas.getBoundingClientRect(),ratio=Math.min(global.devicePixelRatio||1,1.5),width=Math.max(1,Math.floor(rect.width*ratio)),height=Math.max(1,Math.floor(rect.height*ratio));
            if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
            context.clearRect(0,0,width,height);context.save();context.translate(width/2,height/2);
            if(SoundscapeEngine.analyser&&!state.paused)SoundscapeEngine.analyser.getByteFrequencyData(data);else data.fill(8);
            const radius=Math.min(width,height)*.205,scale=Math.min(width,height)*.12;
            context.strokeStyle=modeById(state.modeId).color;context.lineWidth=Math.max(1,ratio);context.globalAlpha=state.paused?.18:.62;context.beginPath();
            for(let i=0;i<48;i++){
                const angle=(i/48)*Math.PI*2-Math.PI/2,amp=(data[i]/255)*scale*(.45+state.intensity*.75),inner=radius+4*ratio,outer=inner+8*ratio+amp;
                context.moveTo(Math.cos(angle)*inner,Math.sin(angle)*inner);context.lineTo(Math.cos(angle)*outer,Math.sin(angle)*outer);
            }
            context.stroke();context.restore();byId('elapsed').textContent=formatTime(elapsedMs());state.visualRaf=requestAnimationFrame(frame);
        };
        state.visualRaf=requestAnimationFrame(frame);
    }

    function stopVisualizer(){if(state.visualRaf)cancelAnimationFrame(state.visualRaf);state.visualRaf=0;}
    function showToast(message){const toast=byId('ss-toast');toast.textContent=message;toast.classList.add('on');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>toast.classList.remove('on'),2600);}

    byId('back-home').addEventListener('mouseenter',()=>Snd.tick(660));
    byId('back-home').addEventListener('click',()=>{SoundscapeEngine.stop(true);BM.backToHome();});
    byId('restart-guide').addEventListener('click',()=>{stopPreview();if(state.playing)stopPlayer(false);showView('chooser');});
    byId('last-session').addEventListener('click',()=>{setAccent(modeById(state.modeId));startPlayer();});
    byId('recommend-back').addEventListener('click',()=>{stopPreview();showView('chooser');});
    byId('all-styles-button').addEventListener('click',()=>{state.showAll=!state.showAll;renderRecommendation();});
    byId('preview-button').addEventListener('click',startPreview);byId('start-button').addEventListener('click',startPlayer);
    byId('pause-button').addEventListener('click',togglePause);byId('change-button').addEventListener('click',changeEnvironment);byId('stop-button').addEventListener('click',()=>stopPlayer(true));
    byId('volume-range').addEventListener('input',event=>{const value=Number(event.target.value)/100;SoundscapeEngine.setVolume(value);byId('volume-output').textContent=Math.round(value*100)+'%';});
    byId('intensity-range').addEventListener('input',event=>{state.intensity=Number(event.target.value)/100;SoundscapeEngine.setIntensity(state.intensity);byId('intensity-output').textContent=levelWord(state.intensity,'intensity');savePrefs();});
    byId('brightness-range').addEventListener('input',event=>{state.brightness=Number(event.target.value)/100;SoundscapeEngine.setBrightness(state.brightness);byId('brightness-output').textContent=levelWord(state.brightness,'brightness');savePrefs();});
    global.addEventListener('langchange',renderStaticCopy);
    global.addEventListener('resize',()=>{if(state.playing)startVisualizer();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVisualizer();else if(state.playing)startVisualizer();});
    global.addEventListener('pagehide',()=>SoundscapeEngine.destroy(),{once:true});

    const Game={
        qs:null,
        exit(){stopPreview();SoundscapeEngine.destroy();}
    };
    Game.qs=BM.mountQuickSwitcher({current:MODULE,onPause:()=>{},onResume:()=>{},onExit:()=>Game.exit()});
    Game.qs.btn.classList.add('on');

    setAccent(modeById(state.modeId));renderStaticCopy();showView('chooser');
})(window);
