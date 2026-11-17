const machines = {
  k1: ['Creality K1 + CFS', 'Creality Print / OrcaSlicer · Kit CFS', 90, 'Usá el perfil de máquina de la K1 con el kit CFS cuando imprimas desde el alimentador.'],
  k1c: ['Creality K1C', 'Creality Print / OrcaSlicer', 90, 'Seleccioná el preset de K1C y verificá tu configuración de alimentación.'],
  ke: ['Creality Ender-3 V3 KE', 'Creality Print / OrcaSlicer', 75, 'Seleccioná el preset de V3 KE y verificá la adhesión con una muestra.'],
  a1: ['Bambu Lab A1', 'Bambu Studio / OrcaSlicer', 80, 'Seleccioná el preset A1. Para piezas altas y delgadas, probá una velocidad menor si la cama en movimiento genera vibración.'],
  p2s: ['Bambu Lab P2S','Bambu Studio',90,'Activá el preset de la P2S con tu boquilla en el laminador.'],
  x2d: ['Bambu Lab X2D','Bambu Studio',90,'Partí del preset de la X2D. Confirmá la boquilla y el extrusor activo antes de laminar.'],
  core: ['Prusa CORE One+','PrusaSlicer',90,'Activá el perfil CORE One+ en el asistente de configuración de PrusaSlicer.'],
  centauri: ['Elegoo Centauri Carbon 2','Preset del fabricante / OrcaSlicer si está disponible',90,'Confirmá el perfil de Carbon 2 para tu versión del laminador.'],
  qidi: ['QIDI Q2','QIDI Studio / OrcaSlicer si está disponible',90,'Usá el preset de Q2 y conservá la configuración térmica de fábrica.'],
  kobra: ['Anycubic Kobra S1 Combo','Anycubic Slicer Next',90,'Activá Kobra S1 y verificá tu configuración ACE antes de laminar.'],
  u1: ['Snapmaker U1','Snapmaker Orca',90,'Usá la configuración de la U1 y seleccioná la herramienta correcta.'],
  k2: ['Creality K2 Plus','Creality Print / OrcaSlicer si está disponible',90,'Usá el preset K2 Plus y revisá el alimentador que tengas conectado.'],
  h2d: ['Bambu Lab H2D','Bambu Studio',90,'Usá el preset H2D y verificá las boquillas activas.'],
  p1s: ['Bambu Lab P1S', 'Bambu Studio / OrcaSlicer', 90, 'Seleccioná el preset P1S y conservá los ajustes de ventilación recomendados para tu placa y filamento.']
};
const genericMachine=['Sin impresora seleccionada','Perfil orientativo',80,'Elegí una impresora para consultar sus recomendaciones.'];
const machineFor=key=>machines[key]??genericMachine;
const categories = {
  decor:['Decoración','◈'], play:['Juegos y fidgets','◎'],
  home:['Hogar y escritorio','▥'], shop:['Taller y repuestos','⌑'],
  gifts:['Regalos y productos para vender','◇'], hobby:['Maquetas y hobbies','▱']
};
// Nombre, categoría, materiales, capa, paredes, relleno, pared exterior, variantes y opción especial.
const profiles = [
 ['Macetas','decor','pla petg matte plaplus petght asa',.20,3,12,45,'Para interior, probá PLA. Si usás plato, imprimilo aparte y revisá el drenaje. En modelos de autorriego, elegí un material apto para el depósito y probá pérdidas antes de usarlo.'],
 ['Floreros','decor','pla petg matte silk',.20,3,12,40,'Imprimí de pie y ubicá la costura atrás. Para flores frescas, un tubo de vidrio removible puede contener el agua. Para flores secas, la pieza impresa puede usarse sola.'],
 ['Pantallas para lámparas','decor','petg petght',.20,2,0,35,'Probá difusión y temperatura con la luz LED prevista. Verificá el encastre y los requisitos aplicables si vas a vender la luminaria completa.','open-shell'],
 ['Bases para lámparas','decor','pla petg matte abs',.20,4,20,45,'Probá la estabilidad y el ajuste con la pantalla y el módulo reales. Este perfil corresponde a la base impresa.'],
 ['Portavelas LED','decor','pla petg',.16,3,12,35,'Para luces LED sin llama. Medí el diámetro y verificá el acceso al interruptor.'],
 ['Decoración de pared','decor','pla hyper matte silk',.20,3,10,50,'Para relieves, placas y paneles. Imprimí el relieve hacia arriba cuando sea posible y verificá la fijación.'],
 ['Porta sahumerios','decor','pla petg',.20,3,15,45,'Usá la impresión como carcasa para un inserto apropiado. Mantené el calor y las brasas alejados del plástico.'],
 ['Fidgets articulados','play','pla hyper plaplus',.16,3,15,40,'Para cubos infinitos, aros giratorios y animales articulados. Probá 0,30, 0,35 y 0,40 mm entre caras en XY. Dejá enfriar la pieza y comprobá el movimiento completo.','articulated'],
 ['Engranajes','play','pla hyper petg abs pa placf',.16,4,20,40,'Imprimí planos. Para un eje impreso de 5,00 mm, probá un agujero de 5,40 mm y ajustá según el resultado.'],
 ['Mecanismos deslizantes','play','pla hyper petg petght pa',.20,4,20,45,'Para sliders, correderas y guías móviles. Probá 0,20–0,30 mm de holgura por lado y ubicá la costura fuera de las caras de contacto.'],
 ['Clickers y fidgets flexibles','play','petg tpu pp',.20,4,20,35,'Orientá el clip para que la flexión principal ocurra en el plano de las capas. Probá el retorno y revisá si aparecen grietas.'],
 ['Rompecabezas','play','pla hyper plaplus matte',.16,3,15,40,'Probá dos piezas vecinas antes de imprimir el juego completo. Un chaflán inferior puede facilitar el encastre.'],
 ['Accesorios para juegos de mesa','play','pla hyper matte',.20,3,15,45,'Para bandejas, fichas, torres de dados y organizadores. Si diseñás una torre, usá rampas autoportantes o dividila para retirar soportes.'],
 ['Soportes de escritorio y pared','home','pla hyper petg abs asa placf',.20,4,22,45,'Para celulares, controles y auriculares. Probá el peso real y el acceso a cables o botones. Si va a la pared, verificá la fijación.'],
 ['Organizadores y bandejas','home','pla hyper petg matte petght silk',.24,3,12,50,'Para cajones, escritorio y vaciabolsillos. Medí el espacio disponible y probá un módulo antes de imprimir un conjunto.'],
 ['Organización de cables','home','petg tpu pp',.20,4,20,40,'Para clips, guías y pasacables. Medí el diámetro y probá apertura, retención y retorno.'],
 ['Soportes para taller y equipos','shop','petg petght asa petgcf abs',.20,5,25,45,'Para baterías, herramientas o routers. Probá el peso, el encastre y la fijación con el equipo real. Dejá ventilación y acceso a conectores cuando corresponda.'],
 ['Adaptadores y acoples','shop','petg petght abs hips pet',.20,4,20,40,'Medí diámetros interiores y exteriores. Probá un tramo corto para verificar ajuste y sellado antes de imprimir el adaptador completo.'],
 ['Repuestos y encastres','shop','petg pla abs asa pa pc hips',.16,4,22,35,'Para tapas, perillas y piezas similares. Copiá el encastre con calibre y limitá la aplicación a repuestos sin función de seguridad.'],
 ['Guías y plantillas','shop','pla hyper petg placf petgcf',.20,4,20,45,'Comprobá distancias con calibre. Para plantillas repetidas, imprimí una muestra y verificá la alineación antes de fabricar la tanda.'],
 ['Cajas y carcasas','shop','petg abs asa pp pc petgcf hips',.20,4,20,40,'Probá el cierre, las pestañas y los tornillos en una sección. Aplicá el perfil a carcasas sin funciones de seguridad.'],
 ['Topes y patas flexibles','shop','tpu',.20,3,20,28,'Probá la compresión con la carga prevista y revisá la orientación de las capas.'],
 ['Piezas para exterior','shop','asa petght',.20,4,20,45,'Para soportes livianos y accesorios expuestos al sol. Verificá el montaje, la carga y el comportamiento del material con una muestra.'],
 ['Bisagras flexibles','shop','pp',.20,3,20,35,'Para una bisagra viva, probá una sección y evaluá flexión y fatiga antes de fabricar la pieza completa.'],
 ['Llaveros','gifts','pla hyper petg plaplus matte silk',.16,4,20,35,'Para llaveros lisos, con logo o bicolor. Concentrá los cambios de color en capas superiores cuando se pueda y probá la resistencia del ojal.'],
 ['Carteles y exhibidores','gifts','pla hyper petg matte silk',.20,3,15,45,'Para carteles de nombre, exhibidores de tarjetas y códigos QR. Verificá la estabilidad y probá que el texto o código se lea al tamaño final.'],
 ['Imanes decorativos','gifts','pla hyper',.16,3,15,40,'Medí el alojamiento del imán y verificá su retención. Mantené los imanes pequeños fuera del alcance infantil.'],
 ['Posavasos','gifts','petg petght tpu',.20,4,20,45,'Probá la estabilidad y la condensación con el vaso real. Podés sumar una base de corcho.'],
 ['Figuras y miniaturas','hobby','pla hyper matte silk',.12,3,12,32,'Para figuras decorativas, miniaturas y peanas. Orientá las caras visibles lejos de los soportes. Para detalles finos, evaluá una boquilla de 0,2 mm con su propio preset.','painted-supports'],
 ['Maquetas y escenografía','hobby','pla hyper matte hips',.20,3,12,42,'Para terreno de rol y maquetas arquitectónicas. Separá piezas difíciles y verificá paredes finas, texturas y encastres en la vista previa.'],
 ['Organizadores de cartas','hobby','pla hyper petg',.20,3,15,50,'Medí las cartas con funda. Agregá acceso para el dedo y probá el ancho con el mazo real.']
];
const byId = id => document.getElementById(id);
const el = {printer:byId('printer'),material:byId('material'),category:byId('category'),search:byId('search'),list:byId('list'),detail:byId('detail')};
let selected = 0;
function addOptions(select, entries) {
  for (const [key,label] of entries) select.add(new Option(label,key));
}
addOptions(el.printer,[['all','Elegí una impresora'],...Object.entries(machines).map(([key,value])=>[key,value[0]])]);
addOptions(el.material,[['all','Todos los filamentos'],...Object.entries(materials).filter(([,value])=>value[1]!==null).map(([key,value])=>[key,value[0]])]);
addOptions(el.category,[['all','Todas las categorías'],...Object.entries(categories).map(([key,value])=>[key,value[0]])]);
el.printer.value = 'all';
const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const mm = value => value.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
function getSettings(row, printer, material) {
  const [,nozzle,bed,fan,materialSpeed] = materials[material];
  const [, ,machineSpeed] = machineFor(printer);
  const [, , ,layer,walls,infill,outer,,mode] = row;
  const inside = Math.min(outer + 30,machineSpeed,materialSpeed);
  const shell = Math.max(4,Math.ceil(.64/layer));
  const first = layer === .24 ? .24 : .20;
  return [
    ['Boquilla',nozzle+' °C'],['Cama',bed+' °C'],['Ventilador de pieza',fan],
    ['Altura de capa',mm(layer)+' mm'],['Primera capa',mm(first)+' mm'],['Línea exterior','0,42 mm'],
    ['Paredes',String(walls)],['Capas arriba / abajo',mode === 'open-shell' ? '0 / 0*' : shell+' / '+shell],['Relleno',infill ? infill+'% gyroid' : '0%'],
    ['Pared externa',Math.min(outer,materialSpeed)+' mm/s'],['Pared interna',inside+' mm/s'],['Primera capa · velocidad','25 mm/s'],
    ['Pie de elefante',mode === 'articulated' ? '0,15 mm' : '0,10 mm'],['Soportes',mode === 'painted-supports' ? 'Pintados si hacen falta' : 'Apagados de inicio'],['Perímetros chicos',Math.min(outer,materialSpeed,mode === 'articulated' ? 30 : 35)+' mm/s']
  ];
}
function showDetail(index) {
  if (index === undefined) {
    el.detail.innerHTML = '<div class="detail-head"><h2>Sin perfiles para esos filtros</h2><p>Probá con otra búsqueda, categoría o material.</p></div>';
    return;
  }
  const row = profiles[index];
  const [name,group,recommended,,,,,note,mode] = row;
  const printer = el.printer.value;
  const material = el.material.value === 'all' ? recommended.split(' ')[0] : el.material.value;
  const settings = getSettings(row,printer,material);
  const supportGap = materials[material][5].startsWith('PETG') ? '0,28–0,32' : '0,24';
  const extra = mode === 'articulated'
    ? 'En capa de 0,16 mm, probá separaciones Z de 0,32 y 0,48 mm si hay piezas superpuestas. Revisá los puentes en la vista previa.'
    : 'Si agregás soportes, probá 2 capas de interfaz y una separación Z superior de '+supportGap+' mm. Confirmá el espacio efectivo en la vista previa.';
  const materialNote=materialNotes[material]?' '+materialNotes[material]:'';
  const shape = mode === 'open-shell' ? ' *Cero capas sólidas para una pantalla modelada como pared abierta. Confirmá que el aro de montaje se imprime completo; ajustá capas sólidas si el modelo las requiere.' : '';
  el.detail.innerHTML = '<div class="detail-head"><span class="mono">'+categories[group][0]+' · '+materials[material][0]+'</span><h2>'+name+'</h2><p>'+note+'</p></div><dl class="data">'+settings.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl><div class="notes"><p>'+extra+shape+materialNote+'</p><button class="copy" type="button">Copiar parámetros</button><span class="status" role="status"></span></div>';
  attachExport(el.detail.querySelector('.notes'), {row, printer, material});
  el.detail.querySelector('.copy').onclick = async () => {
    const output = [name+' · '+machineFor(printer)[0]+' · '+materials[material][0]+' · Boquilla 0,4 mm',...settings.map(pair=>pair.join(': ')),note,extra+shape+materialNote].join('\n');
    const status = el.detail.querySelector('.status');
    try { await navigator.clipboard.writeText(output); status.textContent = 'Copiado'; }
    catch {
      let box = el.detail.querySelector('textarea');
      if (!box) { box = document.createElement('textarea'); box.className = 'copybox'; box.readOnly = true; box.rows = 6; box.setAttribute('aria-label','Parámetros para copiar'); status.after(box); }
      box.value = output; box.focus(); box.select(); status.textContent = 'Copiá el texto seleccionado';
    }
  };
}
function render(focusProfile = false) {
  const printer = el.printer.value;
  byId('context').textContent = machineFor(printer)[3]+' Parámetros iniciales para boquilla de 0,4 mm.';
  const previousScroll=el.list.scrollTop;
  const query = normalize(el.search.value.trim()).split(/\s+/);
  const results = profiles.map((row,index)=>({row,index})).filter(({row})=>
    (el.category.value === 'all' || row[1] === el.category.value) &&
    (el.material.value === 'all' || row[2].split(' ').includes(el.material.value)) &&
    query.every(word=>normalize(row[0]+' '+categories[row[1]][0]+' '+row[7]+' '+row[2].split(' ').map(key=>materials[key][0]).join(' ')).includes(word))
  );
  if (!results.some(entry=>entry.index === selected)) selected = results[0]?.index;
  byId('count').textContent = results.length+' / '+profiles.length;
  el.list.replaceChildren(...results.map(({row,index})=>{
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'item';
    button.dataset.profile = index;
    button.setAttribute('aria-pressed',String(index === selected));
    button.innerHTML = '<span class="icon" aria-hidden="true">'+categories[row[1]][1]+'</span><span><strong>'+row[0]+'</strong><small>'+row[2].split(' ').map(key=>materials[key][0]).join(' · ')+'</small></span><span class="arrow" aria-hidden="true">›</span>';
    button.onclick = () => { selected = index; render(true); };
    return button;
  }));
  el.list.scrollTop=focusProfile?previousScroll:0;
  showDetail(selected);
  if (focusProfile) {
    if (matchMedia('(max-width: 750px)').matches) el.detail.focus();
    else el.list.querySelector('[data-profile="'+selected+'"]')?.focus({preventScroll:true});
  }
}
byId('clearFilters').onclick = () => {
  el.printer.value='all'; el.material.value='all'; el.category.value='all'; el.search.value='';
  selected=0; render(); el.search.focus();
};
for (const control of [el.printer,el.material,el.category,el.search]) control.addEventListener('input',()=>render());
render();
const materialCatalog=byId('materialCatalog');
for(const group of materialGroups) {
  const section=document.createElement('section');
  section.className='material-group';
  const entries=Object.entries(materials).filter(([,value])=>value[6]===group);
  section.innerHTML='<h3>'+group+'</h3><div class="guide-grid">'+entries.map(([key,[name,nozzle,bed,, , , ,description]])=>
    '<article><h4>'+name+'</h4><p>'+description+'</p>'+(nozzle===null?'<small>Consultá la ficha de la bobina.</small>':'<small>'+nozzle+' °C boquilla · '+bed+' °C cama</small><button class="quiet" type="button" data-material="'+key+'">Ver perfiles</button>')+'</article>').join('')+'</div>';
  materialCatalog.append(section);
}
materialCatalog.addEventListener('click',event=>{
  const key=event.target.closest('[data-material]')?.dataset.material;
  if(!key) return;
  el.material.value=key; el.category.value='all'; el.search.value=''; render();
  location.hash='perfiles'; el.material.focus({preventScroll:true});
});

const costForm=byId('costForm');
const modelParams=new URLSearchParams(location.search);
const costModel=byId('costModel');
const modelTitle=modelParams.get('modelo')?.trim().slice(0,200);
if(costModel && modelTitle) {
  costModel.hidden=false;
  costModel.querySelector('span').textContent='Modelo: '+modelTitle;
  const modelLink=costModel.querySelector('a');
  const ficha=modelParams.get('ficha') ?? '';
  if(/^https:\/\/(www\.printables\.com|cults3d\.com|www\.thingiverse\.com|shapekit\.cc)\//.test(ficha)) modelLink.href=ficha;
  else modelLink.hidden=true;
  for(const name of ['grams','hours']) {
    const input=costForm.elements.namedItem(name);
    input.value='';
    input.placeholder='Dato del laminador';
  }
}
function makerCost({grams,spool,extraGrams,extraSpool,hours,hour,watts,kwh,laborMinutes,laborRate,packing,fixed,fee,margin,units,failure}) {
  const filament=(grams*spool+extraGrams*extraSpool)/1000;
  const energy=hours*watts*kwh/1000;
  const labor=laborMinutes*laborRate/60;
  const machine=hours*hour;
  const batch=(filament+energy+machine+labor)/(1-failure/100);
  const unit=batch/units+packing;
  const order=unit*units+fixed;
  const available=1-(fee+margin)/100;
  return {filament,energy,labor,machine,batch,unit,order,floor:order/(1-fee/100),price:available>0?Math.ceil(order/available):null};
}
function calculateCost() {
  const output=byId('costResult');
  if(!costForm.checkValidity()) {
    const invalid=[...costForm.elements].find(element=>element.willValidate && !element.checkValidity());
    const label=invalid?.closest('label')?.firstChild?.textContent?.trim();
    output.textContent=label ? 'Completá o corregí «'+label+'» para ver el precio.' : 'Revisá los importes, unidades y porcentajes.';
    return;
  }
  const input=Object.fromEntries([...new FormData(costForm)].map(([key,value])=>[key,Number(value)]));
  const cost=makerCost(input);
  const pesos=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0});
  const money=value=>pesos.format(value);
  const rows=[
    ['Filamento por intento',cost.filament],['Energía por intento',cost.energy],['Desgaste por intento',cost.machine],['Mano de obra por intento',cost.labor],
    ['Producción con fallos estimados',cost.batch],['Costo unitario con embalaje',cost.unit],['Punto de equilibrio por pedido',Math.ceil(cost.floor)]
  ];
  const perPiece=cost.price===null?null:cost.price/input.units;
  const summary=document.createElement('div');
  summary.className='price-summary';
  if(cost.price===null) {
    summary.innerHTML='<p class="price-error"></p>';
    summary.querySelector('p').textContent='La comisión y el margen deben sumar menos de 100%.';
  } else {
    summary.innerHTML='<div><span>Precio sugerido por pedido</span><strong></strong><small></small></div><div><span>Por pieza</span><strong></strong><small></small></div>';
    const [order,piece]=summary.querySelectorAll('div');
    order.querySelector('strong').textContent=money(cost.price);
    order.querySelector('small').textContent=input.units+(input.units===1?' unidad':' unidades')+' · '+input.margin+' % de margen';
    piece.querySelector('strong').textContent=money(perPiece);
    piece.querySelector('small').textContent='Costo unitario '+money(cost.unit);
  }
  const breakdown=document.createElement('dl');
  breakdown.className='cost-breakdown';
  breakdown.innerHTML=rows.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+money(value)+'</dd></div>').join('');
  const detail=document.createElement('p');
  detail.className='visually-hidden';
  detail.textContent=cost.price===null?'':'Precio sugerido por pedido de '+input.units+' unidad(es): '+money(cost.price)+' · Equivale a '+money(perPiece)+' por pieza.';
  output.replaceChildren(summary,breakdown,detail);
}
costForm.addEventListener('input',calculateCost);
costForm.addEventListener('submit',event=>event.preventDefault());
calculateCost();

(function () {
  const form = document.getElementById('costForm');
  if (!form) return;
  const panel = document.getElementById('quote-tools');
  const input = document.getElementById('slicer-file');
  const fileName = document.getElementById('slicer-file-name');
  input?.addEventListener('change', () => { if (fileName) fileName.textContent = input.files?.[0]?.name ?? 'Ningún archivo seleccionado'; });
  // Arrastrar y soltar el G-code sobre el recuadro de importación.
  const dropZone = input?.closest('.quote-box');
  if (dropZone && 'DataTransfer' in window) {
    dropZone.classList.add('drop-zone');
    const hasFile = event => [...(event.dataTransfer?.types ?? [])].includes('Files');
    for (const type of ['dragenter', 'dragover']) dropZone.addEventListener(type, event => {
      if (!hasFile(event)) return;
      event.preventDefault(); dropZone.classList.add('dragging');
    });
    dropZone.addEventListener('dragleave', event => { if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('dragging'); });
    dropZone.addEventListener('drop', event => {
      if (!hasFile(event)) return;
      event.preventDefault(); dropZone.classList.remove('dragging');
      const file = event.dataTransfer.files[0];
      if (!file) return;
      const transfer = new DataTransfer(); transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  const status = document.getElementById('import-status');
  const plate = document.getElementById('slicer-plate');
  const settingsStatus = document.getElementById('settings-status');
  const field = name => form.elements.namedItem(name);
  const costFields = ['spool','extraSpool','hour','watts','kwh','laborRate','packing','fee','margin','failure'];
  const presetKey = 'utilitools-cost-settings-v1';
  let selections = [];
  let generation = 0;

  function duration(value) {
    if (/^\d+(?:\.\d+)?$/.test(value)) return Number(value);
    const clock = /^(\d+):(\d{2}):(\d{2})$/.exec(value);
    if (clock) return Number(clock[1])*3600+Number(clock[2])*60+Number(clock[3]);
    if (!/^(?:\d+(?:[.,]\d+)?\s*[dhms]\s*)+$/i.test(value)) return 0;
    const scale = {d:86400,h:3600,m:60,s:1};
    return [...value.matchAll(/(\d+(?:[.,]\d+)?)\s*([dhms])/gi)]
      .reduce((sum,match)=>sum+Number(match[1].replace(',','.'))*scale[match[2].toLowerCase()],0);
  }

  function metadata(text) {
    const lines = new Map();
    for (const match of text.matchAll(/^\s*;\s*([^=:\r\n]+?)\s*[:=]\s*([^\r\n]+)/gm)) {
      const key=match[1].trim().toLowerCase();
      if(!lines.has(key)) lines.set(key,match[2].trim());
    }
    function masses(key, vector) {
      const raw = lines.get(key);
      if (!raw) return [];
      const values = vector ? raw.split(/\s*[,;]\s*/) : [raw.replace(',','.')];
      if(!values.every(value=>/^\d+(?:\.\d+)?(?:\s*g)?$/i.test(value))) return [];
      return values.map(value=>Number(value.replace(/\s*g$/i,''))).filter(value=>value>0 && Number.isFinite(value));
    }
    let weights = masses('filament used [g]',true);
    if(!weights.length) weights=masses('filament weight [g]',true);
    const total = ['total filament weight [g]','total filament used [g]','filament weight','filament used'].flatMap(key=>{
      if(key.endsWith('[g]')) return masses(key,false);
      return /g$/i.test(lines.get(key) ?? '') ? masses(key,false) : [];
    })[0];
    if (!weights.length && total) weights=[total];
    if (weights.length===1 && total) weights=[total];
    // Use the declared total only when it can be reconciled with per-material figures.
    const sum=weights.reduce((a,b)=>a+b,0);
    const mixedTotal=weights.length>1 && total && Math.abs(total-sum)>0.1 ? total : null;
    const seconds = ['total estimated time','estimated total printing time','estimated printing time (normal mode)','estimated printing time','print time','print_time','model printing time','time']
      .map(key=>duration(lines.get(key) ?? '')).find(value=>value>0 && Number.isFinite(value)) ?? 0;
    const slicer=/bambustudio|bambu studio/i.test(text)?'bambu':
      /orcaslicer|orca slicer/i.test(text)?'orca':/creality[_ ]?print/i.test(text)?'creality':'unknown';
    return {weights, seconds, mixedTotal, slicer};
  }

  const maxDecoded=160*1024*1024;
  const decoder=new TextDecoder();
  async function zipPlates(file) {
    const tail=await file.slice(Math.max(0,file.size-65557)).arrayBuffer();
    const end=new DataView(tail);
    let offset=end.byteLength-22;
    while(offset>=0 && !(end.getUint32(offset,true)===0x06054b50 && offset+22+end.getUint16(offset+20,true)===end.byteLength)) offset--;
    if(offset<0 || end.getUint16(offset+4,true) || end.getUint16(offset+6,true)) throw Error('No se pudo leer el archivo comprimido.');
    const count=end.getUint16(offset+10,true);
    const size=end.getUint32(offset+12,true);
    const start=end.getUint32(offset+16,true);
    if(count>1500 || size>2_000_000 || start+size>file.size) throw Error('El archivo comprimido es demasiado grande.');
    const directory=new DataView(await file.slice(start,start+size).arrayBuffer());
    const entries=[];
    for(let i=0, cursor=0;i<count;i++) {
      if(cursor+46>size || directory.getUint32(cursor,true)!==0x02014b50) throw Error('El índice del archivo está incompleto.');
      const nameLength=directory.getUint16(cursor+28,true);
      const next=cursor+46+nameLength+directory.getUint16(cursor+30,true)+directory.getUint16(cursor+32,true);
      if(next>size) throw Error('El índice del archivo está incompleto.');
      const name=decoder.decode(new Uint8Array(directory.buffer,cursor+46,nameLength));
      if(/^Metadata\/plate[_-]?\d+\.gcode$/i.test(name)) {
        const method=directory.getUint16(cursor+10,true);
        const bytes=directory.getUint32(cursor+20,true);
        const unpacked=directory.getUint32(cursor+24,true);
        const header=directory.getUint32(cursor+42,true);
        if(unpacked>maxDecoded || bytes>maxDecoded || (directory.getUint16(cursor+8,true)&1) || ![0,8].includes(method)) throw Error('La placa comprimida supera el límite o usa un formato incompatible.');
        entries.push({name,method,bytes,unpacked,header});
      }
      cursor=next;
    }
    if(!entries.length) throw Error('Este 3MF no contiene G-code de una placa. Laminá y exportá la placa desde Bambu Studio.');
    return entries.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).map(entry=>({
      name:entry.name.split('/').pop(),format:'3mf',
      read:async()=>{
        const local=new DataView(await file.slice(entry.header,entry.header+30).arrayBuffer());
        if(local.byteLength!==30 || local.getUint32(0,true)!==0x04034b50) throw Error('No se pudo abrir la placa.');
        const start=entry.header+30+local.getUint16(26,true)+local.getUint16(28,true);
        if(start+entry.bytes>file.size) throw Error('Los datos de la placa están incompletos.');
        let stream=file.slice(start,start+entry.bytes).stream();
        if(entry.method===8) {
          try { stream=stream.pipeThrough(new DecompressionStream('deflate-raw')); }
          catch { throw Error('Este navegador no puede abrir la placa comprimida. Exportá un archivo .gcode.'); }
        }
        return readEdges(stream,entry.unpacked);
      }
    }));
  }

  async function readEdges(stream, declared) {
    const reader=stream.getReader();
    const cap=1024*1024;
    const first=new Uint8Array(cap), last=new Uint8Array(cap);
    let total=0;
    try {
      for(;;) {
        const {done,value}=await reader.read();
        if(done) break;
        if(total+value.length>Math.min(maxDecoded,declared)) throw Error('La placa excede el tamaño declarado.');
        if(total<cap) first.set(value.subarray(0,cap-total),total);
        if(value.length>=cap) last.set(value.subarray(value.length-cap));
        else {last.copyWithin(0,value.length);last.set(value,cap-value.length);}
        total+=value.length;
      }
    } finally { await reader.cancel(); }
    if(total!==declared) throw Error('La placa está incompleta.');
    return decoder.decode(first.subarray(0,Math.min(cap,total)))+
      (total>cap?'\n'+decoder.decode(last):'');
  }

  function commit(data) {
    const {weights,seconds,mixedTotal}=data;
    const usable = weights.length<=2 && !mixedTotal;
    field('grams').value=usable && weights.length ? weights[0] : '';
    field('extraGrams').value=usable ? weights[1] ?? 0 : '';
    field('hours').value=seconds ? Number((seconds/3600).toFixed(5)) : '';
    field('units').value='';
    const message=[];
    if(!usable) message.push('El archivo informa varios consumos que la calculadora no puede separar. Revisá los precios y cargá un costo equivalente o los pesos manualmente.');
    else if(!weights.length) message.push('No encontré el peso en gramos. Ingresalo desde el laminador.');
    else message.push('Filamento: '+weights.join(' g + ')+' g.' + (weights.length===1?' Si la placa usa varios materiales, verificá cómo se reparte ese total.':''));
    if(seconds) message.push('Tiempo: '+Math.floor(seconds/3600)+' h '+Math.floor((seconds%3600)/60)+' min '+Math.round(seconds%60)+' s.');
    else message.push('No encontré el tiempo. Ingresalo manualmente.');
    if(weights.length===2 && usable) message.push('Revisá el precio por kilo de ambos materiales.');
    message.push('Ingresá la cantidad de piezas que contiene la placa.');
    status.textContent=message.join(' ');
    calculateCost();
  }

  async function readSelection(entry) {
    if (!entry) return;
    const request=++generation;
    status.textContent='Leyendo la placa…';
    try {
      const result=metadata(await entry.read());
      if(request===generation) {
        commit(result);
        window.utilitoolsTrack?.('slicer_import',{slicer:result.slicer,format:entry.format ?? 'gcode',
          result:result.seconds && result.weights.length && result.weights.length<=2 && !result.mixedTotal ? 'complete':'partial'});
      }
    } catch(error) {
      if(request===generation) {
        status.textContent=error.message;
        window.utilitoolsTrack?.('slicer_import',{result:'error',format:entry.format ?? 'gcode'});
      }
    }
  }

  input.addEventListener('change',async()=>{
    const request=++generation;
    const file=input.files[0];
    selections=[]; plate.replaceChildren(); plate.parentElement.hidden=true;
    if(!file) return;
    status.textContent='Leyendo el archivo…';
    try {
      if(file.size>maxDecoded) throw Error('El archivo supera el límite de 160 MB.');
      let loaded;
      if(/\.3mf$/i.test(file.name)) loaded=await zipPlates(file);
      else if(/\.gcode$/i.test(file.name)) {
        loaded=[{name:file.name,read:async()=>{
          const cap=1024*1024;
          if(file.size<=2*cap) return file.text();
          const [start,end]=await Promise.all([file.slice(0,cap).text(),file.slice(-cap).text()]);
          return start+'\n'+end;
        }}];
      } else throw Error('Elegí un archivo .gcode o un .gcode.3mf laminado.');
      if(request!==generation) return;
      selections=loaded;
      selections.forEach((entry,index)=>plate.add(new Option(entry.name,String(index))));
      plate.parentElement.hidden=selections.length<2;
      await readSelection(selections[0]);
    } catch(error) { if(request===generation) status.textContent=error.message; }
  });
  plate.addEventListener('change',()=>readSelection(selections[Number(plate.value)]));

  try {
    const saved=JSON.parse(localStorage.getItem(presetKey) ?? 'null');
    if(saved) for(const name of costFields) {
      if(typeof saved[name]!=='number' || !Number.isFinite(saved[name])) continue;
      const control=field(name), previous=control.value;
      control.value=saved[name];
      if(!control.validity.valid) control.value=previous;
    }
  } catch {}
  calculateCost();

  document.getElementById('save-costs').addEventListener('click',()=>{
    if(!costFields.every(name=>field(name).validity.valid)) {
      settingsStatus.textContent='Revisá los valores de costos antes de guardarlos.';return;
    }
    try {
      localStorage.setItem(presetKey,JSON.stringify(Object.fromEntries(costFields.map(name=>[name,field(name).valueAsNumber]))));
      settingsStatus.textContent='Costos guardados en este navegador.';
    } catch {settingsStatus.textContent='El navegador no permitió guardar los costos.';}
  });
  function quote() {
    if(!form.reportValidity()) return '';
    const data=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,Number(value)]));
    const calculated=makerCost(data);
    if(calculated.price===null || !Number.isFinite(calculated.price)) {
      settingsStatus.textContent='Revisá el margen, la comisión y los costos para generar la cotización.';return '';
    }
    const label=document.getElementById('quote-name').value.trim() || modelTitle || 'Impresión 3D';
    const ars=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'});
    const perUnit=Number((calculated.price/data.units).toFixed(2));
    const text=['Presupuesto · '+label,'Cantidad: '+data.units,
      'Precio '+(perUnit*data.units===calculated.price?'':'promedio ')+'por unidad: '+ars.format(perUnit),
      'Total: '+ars.format(calculated.price)].join('\n');
    document.getElementById('quote-text').value=text;
    document.getElementById('quote-text').parentElement.hidden=false;
    return text;
  }
  document.getElementById('copy-quote').addEventListener('click',async()=>{
    const text=quote();
    if(!text) return;
    try {await navigator.clipboard.writeText(text);window.utilitoolsTrack?.('quote_exported',{method:'clipboard'});settingsStatus.textContent='Presupuesto copiado para WhatsApp.';}
    catch {document.getElementById('quote-text').select();settingsStatus.textContent='Copiá el texto seleccionado.';}
  });
  document.getElementById('download-quote').addEventListener('click',()=>{
    const text=quote();
    if(!text) return;
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='presupuesto-utilitools.txt';a.click();window.utilitoolsTrack?.('quote_exported',{method:'text_file'});
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    settingsStatus.textContent='Presupuesto descargado.';
  });
  panel.hidden=false;
}());
