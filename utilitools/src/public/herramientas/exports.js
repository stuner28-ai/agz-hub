const slicerNames = {
  creality:'Creality Print 6/7',
  orca:'OrcaSlicer 2.x',
  bambu:'Bambu Studio 2.x',
  prusa:'PrusaSlicer',
  cura:'UltiMaker Cura'
};
const jsonPresetVersions = {creality:'6.0.0.0',orca:'2.0.0.0',bambu:'2.0.0.0'};
function standaloneJsonBase(target,type,v) {
  const preset={type,name:v.name,version:jsonPresetVersions[target],inherits:'',compatible_printers:[]};
  if(type==='filament') {
    preset.filament_type=[v.polymer];
    preset.filament_vendor=['Generic'];
  }
  return preset;
}
function exportValues({row,printer,material}) {
  const [name,,,layer,walls,infill,outer,,mode] = row;
  const [label,nozzle,bed,fan,limit] = materials[material];
  return {
    name:'Utilitools 3D - '+name+' - '+label,
    layer,walls,infill,outer:Math.min(outer,limit),
    inner:Math.min(outer+30,limit,machineFor(printer)[2]),
    first:layer===.24?.24:.20,
    shells:mode==='open-shell'?0:Math.max(4,Math.ceil(.64/layer)),
    elephant:mode==='articulated'?.15:.10,
    gap:materials[material][5].startsWith('PETG')?.32:.24,
    nozzle,bed,polymer:materials[material][5],materialName:label,fan:fan.replaceAll('%','').split('–').map(Number)
  };
}
function makeJsonPreset(base,v) {
  if (!base || base.type !== 'process' || typeof base.name !== 'string' || !base.name.trim()) {
    throw new Error('Elegí el JSON de un preset de proceso, guardado desde tu laminador.');
  }
  if (base.from === 'system') throw new Error('Guardá primero una copia del proceso como preset de usuario.');
  const values = {
    layer_height:v.layer,initial_layer_print_height:v.first,outer_wall_line_width:.42,
    wall_loops:v.walls,top_shell_layers:v.shells,bottom_shell_layers:v.shells,
    sparse_infill_density:v.infill+'%',sparse_infill_pattern:'gyroid',
    outer_wall_speed:v.outer,inner_wall_speed:v.inner,initial_layer_speed:25,
    elefant_foot_compensation:v.elephant,enable_support:0,
    support_top_z_distance:v.gap,support_interface_top_layers:2
  };
  if (v.shells===0) { values.top_shell_thickness=0; values.bottom_shell_thickness=0; }
  const preset={...base,...Object.fromEntries(Object.entries(values).map(([key,value])=>[key,String(value)])),name:v.name,print_settings_id:v.name,from:'User'};
  for (const key of ['setting_id','sync_info','user_id','preset_id']) delete preset[key];
  return JSON.stringify(preset,null,2)+'\n';
}
function makePrusaBundle(v,kind) {
  const print = {
    layer_height:v.layer,first_layer_height:v.first,external_perimeter_extrusion_width:.42,
    perimeters:v.walls,top_solid_layers:v.shells,bottom_solid_layers:v.shells,
    fill_density:v.infill+'%',fill_pattern:'gyroid',external_perimeter_speed:v.outer,
    perimeter_speed:v.inner,first_layer_speed:25,elefant_foot_compensation:v.elephant,
    support_material:0,support_material_contact_distance:v.gap,support_material_interface_layers:2
  };
  if(v.shells===0) { print.top_solid_min_thickness=0; print.bottom_solid_min_thickness=0; }
  const filament = {
    filament_type:v.polymer,temperature:v.nozzle,first_layer_temperature:v.nozzle,bed_temperature:v.bed,
    first_layer_bed_temperature:v.bed,min_fan_speed:v.fan[0],max_fan_speed:v.fan[1],
    cooling:1,disable_fan_first_layers:2
  };
  const section=(type,settings)=>'['+type+':'+v.name+']\n'+Object.entries(settings).map(pair=>pair.join(' = ')).join('\n');
  return section(kind==='filament'?'filament':'print',kind==='filament'?filament:print)+'\n';
}
function downloadPreset(name,body,mime) {
  const url=URL.createObjectURL(new Blob([body],{type:mime}));
  const link=document.createElement('a');
  link.href=url; link.download=name; document.body.append(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const privateKeys=/^(print_?host|host_(type|url|apikey|cafile|password|user|username|access_code)|printhost_.*|access_code|api_key|password|device_id|auth_token)$/i;
function stripPrivateKeys(object) {
  for (const key of Object.keys(object)) {
    if (privateKeys.test(key)) delete object[key];
    else if (object[key] && typeof object[key]==='object') stripPrivateKeys(object[key]);
  }
  return object;
}
function makeTypedJson(base,v,kind,plate,model) {
  if(!base || base.type!==kind || typeof base.name!=='string' || !base.name.trim() || base.from==='system') {
    throw new Error('Adjuntá un preset de usuario del tipo elegido, exportado desde ese laminador.');
  }
  const name='Utilitools 3D - '+(kind==='machine'?model+' - 0.4 mm':v.materialName+' - '+v.nozzle+' C');
  const preset=stripPrivateKeys(structuredClone(base));
  for(const key of ['setting_id','sync_info','user_id','preset_id']) delete preset[key];
  Object.assign(preset,{name,from:'User'});
  if(kind==='machine') {
    if(Array.isArray(base.nozzle_diameter) && base.nozzle_diameter.some(d=>Number(d)!==.4)) throw new Error('Usá una base de máquina con boquilla de 0,4 mm.');
    preset.printer_settings_id=name;
  } else {
    if(Array.isArray(base.filament_type) && base.filament_type.some(type=>type!==v.polymer)) throw new Error('El filamento base debe ser del mismo polímero: '+v.polymer+'.');
    Object.assign(preset,{
      filament_settings_id:[name],filament_type:[v.polymer],
      nozzle_temperature:[String(v.nozzle)],nozzle_temperature_initial_layer:[String(v.nozzle)],
      fan_min_speed:[String(v.fan[0])],fan_max_speed:[String(v.fan[1])]
    });
    if(plate!=='keep') {
      preset[plate+'_temp']=[String(v.bed)];
      preset[plate+'_temp_initial_layer']=[String(v.bed)];
    }
  }
  return JSON.stringify(preset,null,2)+'\n';
}
function makePrusaMachine(base,model) {
  const sections=base.replace(/\r\n/g,'\n').split(/(?=^\[[^\]\n]+\]\s*$)/m);
  const printers=sections.filter(section=>/^\[printer:[^\]\n]+\]/.test(section));
  if(printers.length!==1) throw new Error('Adjuntá un INI de paquete que contenga exactamente un preset de impresora.');
  const lines=printers[0].split('\n');
  const nozzle=lines.find(line=>/^nozzle_diameter\s*=/.test(line));
  if(nozzle && nozzle.split('=')[1].split(',').some(value=>Number(value)!==.4)) throw new Error('Usá una base con boquilla de 0,4 mm.');
  return ['[printer:Utilitools 3D - '+model+' - 0.4 mm]',...lines.slice(1).filter(line=>!privateKeys.test(line.split('=')[0].trim()))].join('\n');
}
function makeCuraMaterial(base,v) {
  if(/<!DOCTYPE|<!ENTITY/i.test(base)) throw new Error('El XML del material contiene declaraciones no admitidas.');
  const doc=new DOMParser().parseFromString(base,'application/xml');
  const root=doc.documentElement;
  if(root.localName!=='fdmmaterial') throw new Error('Adjuntá un material XML exportado desde Cura.');
  const direct=(element,key)=>[...element.children].find(node=>node.localName===key);
  const meta=direct(root,'metadata'), settings=direct(root,'settings');
  const name=meta&&direct(meta,'name'), guid=meta&&direct(meta,'GUID');
  if(!name || !guid || !settings) throw new Error('Faltan los datos básicos del material Cura.');
  const material=direct(name,'material');
  if(material && !material.textContent.trim().toUpperCase().startsWith(v.polymer)) throw new Error('El material base debe ser del mismo polímero: '+v.polymer+'.');
  guid.textContent=crypto.randomUUID();
  const label=direct(name,'label');
  if(label) label.textContent='Utilitools 3D '+v.polymer;
  for(const [key,value] of Object.entries({'print temperature':v.nozzle,'heated bed temperature':v.bed,'print cooling':v.fan[1]})) {
    const existing=[...settings.children].find(node=>node.localName==='setting' && node.getAttribute('key')===key);
    const node=existing??doc.createElementNS(root.namespaceURI,'setting');
    node.setAttribute('key',key);
    node.textContent=String(value);
    if(!existing) settings.insertBefore(node,settings.firstElementChild);
  }
  return new XMLSerializer().serializeToString(doc);
}
function attachExport(parent,selection) {
  const panel=document.createElement('details');
  panel.className='export';
  panel.innerHTML='<summary>Exportar para laminador</summary><label>Laminador<select class="slicer">'+Object.entries(slicerNames).map(([id,name])=>'<option value="'+id+'">'+name+'</option>').join('')+'</select></label><label>Tipo de perfil<select class="kind"><option value="process">Proceso de impresión</option><option value="filament">Filamento</option><option value="machine">Impresora / máquina</option></select></label><p class="instructions"></p><label class="plate" hidden>Placa para temperatura de cama<select><option value="keep">Conservar temperaturas del preset</option><option value="textured_plate">PEI texturizado</option><option value="hot_plate">Placa de alta temperatura / PEI liso</option></select></label><label class="template"><span>Archivo base</span> <input type="file"></label><button class="copy" type="button">Descargar perfil</button><small class="error" role="status"></small>';
  parent.append(panel);
  const select=panel.querySelector('.slicer'), kind=panel.querySelector('.kind'), file=panel.querySelector('input');
  const plate=panel.querySelector('.plate'), status=panel.querySelector('[role=status]');
  const model=machineFor(selection.printer)[0];
  function explain() {
    const target=select.value, type=kind.value;
    const template=panel.querySelector('.template');
    const prusa=target==='prusa', cura=target==='cura';
    const optionalBase=Object.hasOwn(jsonPresetVersions,target)&&type!=='machine';
    template.hidden=prusa&&type!=='machine';
    template.querySelector('span').textContent=optionalBase?'Preset base opcional':'Archivo base del laminador';
    plate.hidden=prusa||cura||type!=='filament';
    file.accept=prusa?'.ini':!cura?'.json,application/json':({process:'.curaprofile',filament:'.fdm_material,.xml',machine:'.json'})[type];
    const instructions=prusa?{
      process:'Importá el INI como paquete de configuración y seleccioná el nuevo proceso.',
      filament:'Importá el INI como paquete de configuración y seleccioná el nuevo filamento.',
      machine:'Adjuntá un paquete INI de PrusaSlicer con un solo preset de impresora. Importá la descarga como paquete de configuración.'
    }:cura?{
      process:'Adjuntá un .curaprofile exportado de Cura para tu máquina. Importá la descarga en Preferencias → Perfiles.',
      filament:'Adjuntá un .xml.fdm_material del mismo polímero. Importá la descarga desde Materiales. Los ajustes específicos de máquina del archivo base pueden tener prioridad.',
      machine:'Adjuntá la definición .def.json de tu impresora. La descarga conserva el nombre de archivo para usarla como respaldo e instalarla con sus definiciones de extrusor, según la guía de Cura.'
    }:{
      process:'Descargá el JSON directamente. En el laminador, seleccioná tu impresora y boquilla antes de importar el proceso. Si querés conservar ajustes propios, podés adjuntar un preset base.',
      filament:'Descargá el JSON directamente y verificá la placa y las temperaturas en el laminador. Si querés conservar ajustes propios, podés adjuntar un preset del mismo polímero.',
      machine:'Adjuntá un JSON de máquina de usuario de este laminador, para '+model+' y boquilla de 0,4 mm. Se conservan geometría, firmware y G-code de la base. Importá el JSON generado y verificá esos datos antes de imprimir.'
    };
    panel.querySelector('.instructions').textContent=instructions[type];
    file.value='';
    plate.querySelector('select').value=optionalBase&&type==='filament'?'textured_plate':'keep';
    status.textContent='';
  }
  file.onchange=()=>{
    if(!plate.hidden) plate.querySelector('select').value=file.files.length?'keep':'textured_plate';
  };
  select.onchange=explain;
  kind.onchange=explain;
  panel.querySelector('button').onclick=async()=>{
    status.textContent='';
    try {
      const v=exportValues(selection);
      const type=kind.value, target=select.value, base=file.files[0];
      const slug=normalize(type==='process'?v.name:type==='machine'?model:'utilitools-'+v.polymer+'-'+v.nozzle).replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
      if(type==='machine'&&selection.printer==='all') throw new Error('Seleccioná una impresora arriba para exportar su configuración de máquina.');
      const needsBase=type==='machine'||target==='cura';
      if(needsBase&&!base) throw new Error(type==='machine'?'Para exportar la máquina, elegí su preset base. Así se conservan las dimensiones, el firmware y el G-code.':'Cura necesita su archivo base para vincular el perfil con tu configuración. También podés usar Copiar parámetros.');
      if(base&&base.size>2000000) throw new Error('El archivo base supera los 2 MB.');
      if(target==='prusa') {
        const preset=type==='machine'?makePrusaMachine(await base.text(),model):makePrusaBundle(v,type);
        downloadPreset(slug+'-'+type+'.ini',preset,'text/plain');
      } else if(target==='cura'&&type==='process') {
        downloadPreset(slug+'.curaprofile',await makeCuraPreset(await base.arrayBuffer(),v),'application/zip');
      } else if(target==='cura'&&type==='filament') {
        downloadPreset(slug+'.xml.fdm_material',makeCuraMaterial(await base.text(),v),'application/xml');
      } else if(target==='cura') {
        const definition=JSON.parse(await base.text());
        if(!base.name.endsWith('.def.json') || !definition?.name || !definition?.inherits || definition.metadata?.type==='extruder') throw new Error('Elegí la definición .def.json de la máquina.');
        downloadPreset(base.name,JSON.stringify(stripPrivateKeys(definition),null,2)+'\n','application/json');
      } else {
        const parsed=base?JSON.parse(await base.text()):standaloneJsonBase(target,type,v);
        const plateKey=plate.querySelector('select').value;
        const preset=type==='process'?makeJsonPreset(parsed,v):makeTypedJson(parsed,v,type,plateKey,model);
        downloadPreset(slug+'-'+target+'-'+type+'.json',preset,'application/json');
      }
      status.textContent='Archivo generado. Verificá la importación y laminá una muestra.';
    } catch(error) {
      status.textContent=error instanceof SyntaxError?'El archivo no contiene JSON válido.':error.message;
    }
  };
  explain();
}

async function readCuraZip(buffer) {
  const bytes=new Uint8Array(buffer);
  const view=new DataView(buffer);
  const decoder=new TextDecoder();
  let end=bytes.length-22;
  while(end>=Math.max(0,bytes.length-65557) && view.getUint32(end,true)!==0x06054b50) end--;
  if(end<Math.max(0,bytes.length-65557)) throw new Error('El archivo no es un perfil exportado por Cura.');
  const count=view.getUint16(end+10,true);
  if(!count || count>16) throw new Error('El archivo no tiene la estructura de un perfil de Cura.');
  let offset=view.getUint32(end+16,true);
  const entries=[];
  for(let i=0;i<count;i++) {
    if(view.getUint32(offset,true)!==0x02014b50) throw new Error('El índice del perfil está dañado.');
    const method=view.getUint16(offset+10,true);
    const size=view.getUint32(offset+20,true);
    const expanded=view.getUint32(offset+24,true);
    const length=view.getUint16(offset+28,true);
    const name=decoder.decode(bytes.subarray(offset+46,offset+46+length));
    const local=view.getUint32(offset+42,true);
    if(expanded>250000 || ![0,8].includes(method) || view.getUint32(local,true)!==0x04034b50) throw new Error('Entrada de perfil no compatible.');
    const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
    const payload=bytes.subarray(start,start+size);
    let content=payload;
    if(method===8) {
      const reader=new Blob([payload]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      const chunks=[];
      let total=0;
      while(true) {
        const {done,value}=await reader.read();
        if(done) break;
        total+=value.length;
        if(total>250000){await reader.cancel();throw new Error('Entrada de perfil demasiado grande.');}
        chunks.push(value);
      }
      content=new Uint8Array(await new Blob(chunks).arrayBuffer());
    }
    if(content.length!==expanded) throw new Error('El tamaño de la entrada del perfil es incorrecto.');
    entries.push([name,decoder.decode(content)]);
    offset+=46+length+view.getUint16(offset+30,true)+view.getUint16(offset+32,true);
  }
  return entries;
}
function writeCuraZip(entries) {
  const encode=new TextEncoder();
  const chunks=[], directory=[];
  let offset=0, directorySize=0;
  for(const [name,text] of entries) {
    const path=encode.encode(name), data=encode.encode(text);
    let checksum=0xffffffff;
    for(const byte of data) {
      checksum^=byte;
      for(let i=0;i<8;i++) checksum=(checksum>>>1)^((checksum&1)?0xedb88320:0);
    }
    checksum^=0xffffffff;
    const header=new DataView(new ArrayBuffer(30));
    const record=new DataView(new ArrayBuffer(46));
    for(const [view,signature,start] of [[header,0x04034b50,0],[record,0x02014b50,2]]) {
      view.setUint32(0,signature,true);
      view.setUint16(4+start,20,true);
      view.setUint16(6+start,0x800,true);
      view.setUint32(14+start,checksum,true);
      view.setUint32(18+start,data.length,true);
      view.setUint32(22+start,data.length,true);
      view.setUint16(26+start,path.length,true);
    }
    record.setUint16(4,20,true);
    record.setUint32(42,offset,true);
    chunks.push(header.buffer,path,data);
    directory.push(record.buffer,path);
    offset+=30+path.length+data.length;
    directorySize+=46+path.length;
  }
  const end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);
  end.setUint16(8,entries.length,true);
  end.setUint16(10,entries.length,true);
  end.setUint32(12,directorySize,true);
  end.setUint32(16,offset,true);
  return new Blob([...chunks,...directory,end.buffer]);
}
async function makeCuraPreset(buffer,v) {
  const entries=await readCuraZip(buffer);
  const globals={layer_height:v.layer,layer_height_0:v.first,support_enable:'False',xy_offset_layer_0:-v.elephant};
  const extrusion={
    wall_line_width_0:.42,wall_line_count:v.walls,top_layers:v.shells,bottom_layers:v.shells,
    infill_sparse_density:v.infill,infill_pattern:'gyroid',speed_wall_0:v.outer,speed_wall_x:v.inner,
    speed_print_layer_0:25,support_top_distance:v.gap
  };
  const updated=entries.map(([name,text])=>{
    const lines=text.replace(/\r\n/g,'\n').trimEnd();
    if(!/^type\s*=\s*quality_changes\s*$/m.test(lines) || !/^\[values\]\s*$/m.test(lines)) throw new Error('Exportá un perfil personalizado desde Cura y volvé a adjuntarlo.');
    const single=entries.length===1;
    const isExtruder=/^position\s*=\s*\d+\s*$/m.test(lines);
    const patch=single?{...globals,...extrusion}:isExtruder?extrusion:globals;
    const keys={...globals,...extrusion};
    const renamed=lines.replace(/^name\s*=.*$/m,'name = '+v.name);
    const clean=renamed.split('\n').filter(line=>!Object.hasOwn(keys,line.split('=')[0].trim())).join('\n');
    return [name,clean+'\n'+Object.entries(patch).map(pair=>pair.join(' = ')).join('\n')+'\n'];
  });
  return writeCuraZip(updated);
}
