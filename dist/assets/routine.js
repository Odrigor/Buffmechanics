/* Editable five-minute routines. Plans are local preferences; runs reference journal entries. */
(function(){
    'use strict';
    const clone=x=>JSON.parse(JSON.stringify(x));
    const range=(key,es,en,min,max,step=1,unit='')=>({key,label:[es,en],type:'range',min,max,step,unit});
    const select=(key,es,en,choices)=>({key,label:[es,en],type:'select',choices});
    const catalog={
        aim:{defaults:{size:48,speed:900,patterns:['random'],progOn:false,spawnRandom:false,spawnVariance:25},fields:[range('size','Tamaño del objetivo','Target size',20,100,1,'px'),range('speed','Intervalo de aparición','Spawn interval',300,2000,50,'ms'),{key:'patterns',label:['Patrones','Patterns'],type:'multi',choices:[['random','Aleatorio','Random'],['sides','Laterales','Sides'],['circle','Cerca del cursor','Near cursor'],['hv','Movimiento H/V','H/V movement'],['bounce','Rebote','Bounce']]},{key:'progOn',label:['Velocidad progresiva','Progressive speed'],type:'boolean'},{key:'spawnRandom',label:['Ritmo variable','Variable pace'],type:'boolean'},range('spawnVariance','Variación del intervalo','Interval variation',10,50,5,'%')]},
        tracking:{defaults:{diff:'medium',speed:3.5,size:45,chaos:4},fields:[range('speed','Velocidad','Speed',1,8,.5),range('size','Tamaño del objetivo','Target size',20,80,1,'px'),range('chaos','Cambios de dirección','Direction changes',1,10)]},
        flicking:{defaults:{diff:'medium',size:52,thresh:1.5,hold:750,recoilTrain:false},fields:[range('size','Tamaño del objetivo','Target size',30,90,1,'px'),range('thresh','Tolerancia al movimiento','Movement tolerance',.5,4,.25),range('hold','Permanencia requerida','Required hold',300,1500,50,'ms'),{key:'recoilTrain',label:['Entrenamiento de recoil','Recoil Train'],type:'boolean'}]},
        apm:{defaults:{keyset:'medium',customKeys:'QWER',bpm:60,grow:.5},fields:[select('keyset','Teclas','Keys',[['easy','QWER','QWER'],['medium','QWERAS','QWERAS'],['hard','QWERASDF','QWERASDF']]),range('bpm','BPM inicial','Initial BPM',40,150,5),range('grow','Aumento por acierto','Increase per hit',0,2,.1)]},
        typing:{defaults:{},fields:[]},
        attention:{defaults:{diff:'medium',speed:2.2,freq:1100,react:1400},fields:[range('speed','Velocidad','Speed',1,4,.1),range('freq','Intervalo entre señales','Signal interval',600,2000,100,'ms'),range('react','Ventana de respuesta','Response window',800,2500,100,'ms')]},
        stroop:{defaults:{diff:'medium',conflict:85,window:2500},fields:[range('conflict','Palabras en conflicto','Conflicting words',0,100,5,'%'),range('window','Ventana de respuesta','Response window',1000,5000,100,'ms')]},
        neurogrid:{defaults:{diff:'medium',complexity:'mixed',spawn:700,life:2500},fields:[select('complexity','Reglas','Rules',[['simple','Simples','Simple'],['mixed','Mixtas','Mixed'],['advanced','Avanzadas','Advanced']]),select('spawn','Aparición','Spawn interval',[[1000,'1000 ms','1000 ms'],[700,'700 ms','700 ms'],[500,'500 ms','500 ms']]),select('life','Vida del objetivo','Target lifetime',[[3500,'3500 ms','3500 ms'],[2500,'2500 ms','2500 ms'],[1800,'1800 ms','1800 ms']])]},
        vortex:{defaults:{diff:'medium',keys:2,spawn:1500},fields:[select('diff','Dificultad','Difficulty',[['easy','Fácil','Easy'],['medium','Media','Medium'],['hard','Difícil','Hard']]),select('keys','Teclas','Keys',[[1,'Q','Q'],[2,'QW','QW'],[4,'QWER','QWER']]),range('spawn','Intervalo de aparición','Spawn interval',700,2200,100,'ms')]},
        clicktime:{defaults:{mode:'normal'},fields:[select('mode','Trayectoria','Trajectory',[['normal','Normal','Normal'],['pro','Pro','Pro']])]},
        time:{estimated:true,adjustable:true,defaults:{pace:'relaxed',rounds:5},fields:[select('pace','Ritmo','Pace',[['relaxed','Avance manual','Manual advance'],['reflex','Avance automático','Automatic advance']]),select('rounds','Rondas','Rounds',[[5,'5','5'],[10,'10','10'],[20,'20','20']])]},
        pathpredict:{estimated:true,adjustable:true,defaults:{diff:'medium',rounds:10,types:['linear','bounce','curve','zigzag'],pulses:3,radius:55,response:2500},fields:[select('rounds','Rondas','Rounds',[[10,'10','10'],[20,'20','20'],[30,'30','30']]),range('pulses','Pulsos de observación','Observation pulses',3,6),range('radius','Radio de tolerancia','Tolerance radius',25,100,5,'px'),range('response','Ventana de respuesta','Response window',1500,5000,100,'ms'),{key:'types',label:['Trayectorias','Trajectories'],type:'multi',choices:[['linear','Lineal','Linear'],['bounce','Rebote','Bounce'],['curve','Curva','Curve'],['zigzag','Zigzag','Zigzag'],['accel','Aceleración','Acceleration']]}]},
        slidepuzzle:{estimated:true,adjustable:true,defaults:{diff:'easy'},fields:[select('diff','Dificultad','Difficulty',[['easy','Fácil','Easy'],['normal','Normal','Normal'],['hard','Difícil','Hard']])]},
    };
    const PLAN_KEY='routinePlan:v2',RUN_KEY='bm:routine:v1';
    const isAmbient=module=>module==='breathing'||module==='soundscape';
    const T=(es,en)=>BM.text(es,en);
    const round30=seconds=>Math.max(30,Math.ceil(seconds/30)*30);
    // Planning assumptions, not performance targets. Natural endings keep their real duration.
    function estimate(module,settings=catalog[module].defaults){
        if(module==='time')return round30(settings.rounds*((1.2+(settings.pace==='reflex'?3.2:5))/2+.3+.9));
        if(module==='pathpredict')return round30(settings.rounds*(settings.pulses*.45+.4+settings.response/1000+1.4));
        if(module==='slidepuzzle')return {easy:60,normal:120,hard:180}[settings.diff];
        return 60;
    }
    const freshBlock=(module='aim',duration)=>({id:BM.uid(),module,duration:duration??estimate(module),settings:clone(catalog[module].defaults)});
    const isEstimated=module=>!!catalog[module]?.estimated;
    const step=module=>isEstimated(module)?30:catalog[module]?.step||15;
    const format=seconds=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
    function reestimate(block){delete block.estimateOverride;block.duration=estimate(block.module,block.settings);return block;}
    function explanation(block){
        if(block.module==='time')return T('Espera media aleatoria + 0,3 s de respuesta + 0,9 s entre rondas. El avance manual y las salidas anticipadas pueden alargarlo.','Mean random wait + 0.3 s response + 0.9 s between rounds. Manual advance and false starts may take longer.');
        if(block.module==='pathpredict')return T('Incluye los pulsos, la ventana completa de respuesta y 1,4 s de resultado por ronda. Responder antes reduce el tiempo real.','Includes pulses, the full response window and 1.4 s of feedback per round. Earlier responses reduce actual time.');
        if(block.module==='slidepuzzle')return T('Referencia inicial: fácil 1:00, normal 2:00 y difícil 3:00. Ajusta la estimación a tu ritmo; el bloque termina al resolver el tablero.','Initial allowance: easy 1:00, normal 2:00 and hard 3:00. Adjust the estimate to your pace; the block ends when you solve the board.');
        return '';
    }
    const defaults=()=>({version:2,name:'',blocks:['aim','tracking','flicking','aim','tracking'].map(m=>freshBlock(m))});
    function normalize(plan,requireTotal=true){
        if(!plan||plan.version!==2||!Array.isArray(plan.blocks)||plan.blocks.length<1||plan.blocks.length>10)throw Error(T('Elige entre 1 y 10 bloques.','Choose 1 to 10 blocks.'));
        const ids=new Set();
        const blocks=plan.blocks.map(b=>{
            const def=catalog[b.module];if(!def)throw Error(T('Ejercicio no válido.','Invalid exercise.'));
            const settings=clone(def.defaults),input=b.settings||{};
            for(const f of def.fields){
                const v=input[f.key]??settings[f.key];
                if(f.type==='range'&&(!Number.isFinite(v)||v<f.min||v>f.max||Math.abs((v-f.min)/f.step-Math.round((v-f.min)/f.step))>1e-6))throw Error(T('Parámetro fuera de rango: ','Parameter out of range: ')+T(...f.label));
                if(f.type==='select'&&!f.choices.some(c=>c[0]===v))throw Error(T('Selección no válida.','Invalid selection.'));
                if(f.type==='boolean'&&typeof v!=='boolean')throw Error(T('Opción no válida.','Invalid option.'));
                if(f.type==='multi'&&(!Array.isArray(v)||!v.length||new Set(v).size!==v.length||v.some(x=>!f.choices.some(c=>c[0]===x))))throw Error(T('Selecciona al menos un patrón válido.','Select at least one valid pattern.'));
                settings[f.key]=clone(v);
            }
            if('diff' in settings&&!['vortex','slidepuzzle','pathpredict'].includes(b.module))settings.diff=def.fields.every(f=>JSON.stringify(settings[f.key])===JSON.stringify(def.defaults[f.key]))?'medium':'custom';
            if(b.module==='pathpredict')settings.diff=['types','pulses','radius','response'].every(k=>JSON.stringify(settings[k])===JSON.stringify(def.defaults[k]))?'medium':'';
            const override=def.adjustable?b.estimateOverride:undefined,increment=step(b.module);
            if(override!==undefined&&(!Number.isInteger(override)||override<30||override>300||override%30))throw Error(T('La estimación debe ser un múltiplo de 30 s entre 0:30 y 5:00.','Estimates must be multiples of 30 seconds from 0:30 to 5:00.'));
            const duration=def.estimated?(override??estimate(b.module,settings)):b.duration;
            if(!Number.isInteger(duration)||duration<increment||duration>300||duration%increment)throw Error(T('Duración no válida. Usa los intervalos disponibles.','Invalid duration. Use the available intervals.'));
            const id=typeof b.id==='string'&&b.id.length<100&&!ids.has(b.id)?b.id:BM.uid();ids.add(id);
            return {id,module:b.module,duration,settings,...(override===undefined?{}:{estimateOverride:override})};
        });
        const total=blocks.reduce((n,b)=>n+b.duration,0);
        if(requireTotal&&total!==300)throw Error(T('Los tiempos planificados deben sumar 5 minutos.','Planned times must add up to 5 minutes.'));
        return {version:2,name:String(plan.name||'').slice(0,48),blocks};
    }
    function read(){
        try{
            let r=JSON.parse(sessionStorage.getItem(RUN_KEY));
            if(r?.version===1&&r.blocks?.length===5){r={...r,version:2,name:'',blocks:r.blocks.map(b=>({...freshBlock(b.module),sessionId:b.sessionId}))};}
            if(!r||r.version!==2||!Array.isArray(r.blocks)||r.blocks.length<1||r.blocks.length>10||!Number.isInteger(r.index)||r.index<0||r.index>=r.blocks.length)return null;
            if(r.blocks.some(b=>isAmbient(b?.module))){
                // Keep past results; old ambient runs cannot schedule new blocks.
                if(r.blocks.some(b=>!b||!BM.MODULES.some(m=>m.code===b.module)||!Number.isFinite(b.duration)))return null;
                const supported=r.blocks.filter(b=>!isAmbient(b.module));if(supported.length)normalize({...r,blocks:supported},false);
                if(r.status==='active'){r.status='abandoned';r.closedReason='ambient-removed';write(r);}
                return r;
            }
            normalize(r);return r;
        }catch{return null;}
    }
    function write(r){try{sessionStorage.setItem(RUN_KEY,JSON.stringify(r));}catch{throw Error(T('No se pudo conservar esta rutina en la pestaña.','Unable to keep this routine in this tab.'));}}
    const route=()=>location.pathname.includes('/modulos/')?'../':'';
    BM.Routine={
        catalog,defaults,freshBlock,normalize,read,estimate,isEstimated,step,format,reestimate,explanation,
        plan(){try{
            const saved=Store.getGlobal(PLAN_KEY);
            if(saved?.version===2&&Array.isArray(saved.blocks)&&saved.blocks.some(b=>isAmbient(b?.module))){
                const blocks=saved.blocks.filter(b=>!isAmbient(b?.module));
                const clean=blocks.length?normalize({...saved,blocks},false):{...defaults(),name:String(saved.name||'').slice(0,48)};
                this.planAdjusted=true;Store.setGlobal(PLAN_KEY,clean);return clean;
            }
            return normalize(saved,false);
        }catch{return defaults();}},
        savePlan(plan){const clean=normalize(plan,false);if(!Store.setGlobal(PLAN_KEY,clean))throw Error(T('No se pudo guardar tu rutina.','Unable to save your routine.'));return clean;},
        distribute(plan){
            const clean=normalize(plan,false),fixed=clean.blocks.filter(b=>!isEstimated(b.module));
            let remaining=300-clean.blocks.filter(b=>isEstimated(b.module)).reduce((n,b)=>n+b.duration,0);
            if(!fixed.length&&remaining>0)throw Error(T('Solo hay bloques estimados. Ajusta sus rondas o estimaciones hasta sumar 5:00, o añade un bloque temporizado.','Only estimated blocks are present. Adjust rounds or estimates to total 5:00, or add a timed block.'));
            fixed.forEach(b=>{b.duration=step(b.module);remaining-=b.duration;});
            const error=()=>Error(T('No hay espacio para distribuir. Reduce rondas o estimaciones, o quita un bloque.','No room to distribute. Reduce rounds or estimates, or remove a block.'));
            if(remaining<0)throw error();
            while(remaining>0){const b=fixed.filter(b=>step(b.module)<=remaining).sort((a,b)=>a.duration-b.duration)[0];if(!b)throw error();b.duration+=step(b.module);remaining-=step(b.module);}
            plan.blocks=clean.blocks;return plan;
        },
        current(){const r=read();return r?.status==='active'?r:null;},
        context(module){if(!catalog[module])return null;const r=this.current(),p=new URLSearchParams(location.search);return r&&p.get('routine')===r.id&&p.has('block')&&Number(p.get('block'))===r.index&&r.blocks[r.index].module===module&&!r.blocks[r.index].sessionId?r:null;},
        start(plan=this.plan()){if(this.current())throw Error(T('Continúa o cierra primero la rutina en curso.','Continue or end the active routine first.'));const clean=normalize(plan);this.savePlan(clean);const r={...clean,id:BM.uid(),status:'active',index:0,startedAt:Date.now(),blocks:clean.blocks.map(b=>({...b,sessionId:null}))};write(r);return r;},
        go(){const r=this.current();if(r){const m=BM.MODULES.find(m=>m.code===r.blocks[r.index].module);location.href=`${route()}modulos/${m.url}?routine=${encodeURIComponent(r.id)}&block=${r.index}`;}},
        next(){const r=this.current();if(!r||!r.blocks[r.index].sessionId)return;if(r.index===r.blocks.length-1){r.status='completed';write(r);location.href=route()+'routine.html';}else{r.index++;write(r);this.go();}},
        abandon(){const r=read();if(r){r.status='abandoned';write(r);}location.href=route()+'routine.html';},
        mark(record){const r=this.current();if(!r||record.routineId!==r.id||record.routineBlock!==r.index)return null;const b=r.blocks[r.index],d=record.data||{};
            const finished=b.module==='time'?d.rounds===b.settings.rounds&&d.attempts?.length>=b.settings.rounds:b.module==='pathpredict'?d.perfects+d.closes+d.misses>=b.settings.rounds:b.module==='slidepuzzle'?d.moves>0&&d.timeMs>=0:record.activeDurationMs>=b.duration*1000-500;
            if(record.status==='completed'&&finished&&record.moduleId===b.module&&!b.sessionId){b.sessionId=record.sessionId;write(r);}return r;},
        complete(record,host){const r=this.mark(record);if(!r)return;const box=document.createElement('div');box.className='bm-routine-result';const p=document.createElement('p');p.textContent=`${T('Rutina','Routine')} · ${r.index+1}/${r.blocks.length} · `+(r.blocks[r.index].sessionId?T('Bloque completado. Descansa cuando lo necesites.','Block complete. Rest whenever you need.'):T('Repite este bloque para continuar.','Repeat this block to continue.'));box.append(p);if(r.blocks[r.index].sessionId){const b=document.createElement('button');b.className='bm-primary';b.textContent=r.index===r.blocks.length-1?T('Ver resumen','View summary'):T('Siguiente bloque','Next block');b.onclick=()=>this.next();box.append(b);}host.append(box);},
        apply(controller,r=this.context(controller.module)){
            if(!r||!catalog[controller.module])return;const block=r.blocks[r.index],durationKey=controller.module==='typing'?'duration':'time';
            Object.assign(controller.ui,clone(controller.defaults));Object.entries(block.settings||{}).forEach(([key,value])=>{if(key in controller.defaults)controller.ui[key]=clone(value);});if(!isEstimated(block.module))controller.ui[durationKey]=block.duration;if('challenge' in controller.ui)controller.ui.challenge='normal';BM.syncConfigUI(controller.ui);
        },
        mountModule(controller){
            const r=this.context(controller.module),setup=document.getElementById('setup');if(!r||!setup)return;this.apply(controller,r);
            const band=document.createElement('div');band.className='bm-routine-banner';
            const title=document.createElement('strong');title.textContent=`${T('TU RUTINA','YOUR ROUTINE')} · ${r.index+1}/${r.blocks.length}`;
            const block=r.blocks[r.index],sub=document.createElement('span');sub.textContent=`${isEstimated(block.module)?'≈ ':''}${format(block.duration)} · ${isEstimated(block.module)?T('tiempo estimado; completa el ejercicio a tu ritmo','estimated time; finish the exercise at your pace'):T('tiempo activo · configuración guardada','active time · saved setup')}`;
            const button=document.createElement('button');button.className='bm-primary';button.textContent=T('Comenzar bloque','Start block');button.onclick=()=>controller.start();
            const back=document.createElement('a');back.href=route()+'routine.html';back.className='bm-link';back.textContent=T('Volver a mi rutina','Back to my routine');band.append(title,sub);if(explanation(block)){const help=document.createElement('p');help.className='bm-muted';help.textContent=explanation(block);band.append(help);}band.append(button,back);setup.prepend(band);
            setup.classList.add('bm-routine-setup');
            if(controller.module==='clicktime'){const hint=setup.querySelector('[data-i18n="clk.hint"]');if(hint){hint.removeAttribute('data-i18n');hint.textContent=T('Haz clic cuando el objetivo brille en verde en su punto más alto.','Click when the target glows green at the peak of its trajectory.');}}
            if(controller.module==='stroop')sub.textContent+=' · '+T('los errores no descuentan tiempo','errors do not subtract time');
        }
    };
})();
