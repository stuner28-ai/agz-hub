const materials = {
  pla: ['PLA',210,55,'80–100%',90,'PLA','Uso general','Figuras, prototipos y fidgets. Probá el encastre con la bobina que vas a usar.'],
  hyper: ['Hyper PLA',215,55,'80–100%',90,'PLA','Uso general','Para tandas rápidas. Calibrá el caudal volumétrico antes de subir velocidad.'],
  plaplus: ['PLA+',215,55,'70–100%',80,'PLA','Uso general','Las formulaciones varían por marca. Ajustá la temperatura con la ficha de tu bobina.'],
  matte: ['PLA mate',210,55,'70–100%',65,'PLA','Acabados','Para macetas y decoración. Probá adhesión entre capas en piezas finas.'],
  silk: ['PLA silk',220,55,'65–90%',45,'PLA','Acabados','Para acabados brillantes. Mantené pareja la velocidad de la pared exterior.'],
  petg: ['PETG',240,75,'30–50%',65,'PETG','Uso general','Para repuestos y piezas funcionales. Si aparecen hilos, comprobá humedad y temperatura.'],
  petght: ['PETG HT',255,80,'20–40%',50,'PETG','Técnicos','PETG de mayor resistencia térmica según formulación. Verificá temperatura y ventilación con el fabricante.'],
  abs: ['ABS',250,95,'0–20%',60,'ABS','Técnicos','Para carcasas y piezas interiores. Usá cámara adecuada y ventilación o extracción según tu equipo.'],
  asa: ['ASA',255,95,'0–20%',55,'ASA','Técnicos','Para piezas expuestas al sol. Usá cámara adecuada y ventilación o extracción según tu equipo.'],
  tpu: ['TPU 95A',225,45,'30–60%',30,'TPU','Flexibles','Para topes, clips y fundas. En el CFS original usá alimentación externa compatible.'],
  tpe: ['TPE / TPU blando',null,null,null,null,null,'Flexibles','Seguí la ficha de dureza y temperatura. Requiere una ruta de extrusión apta para flexibles.'],
  pa: ['PA / nylon',265,75,'0–20%',40,'PA','Técnicos','El nylon absorbe humedad. Secá e imprimí desde un contenedor seco según la ficha de la bobina.'],
  pc: ['PC / policarbonato',270,105,'0–20%',40,'PC','Técnicos','Verificá los límites reales de boquilla, cama y placa. La formulación define si necesita cámara calefaccionada.'],
  pp: ['PP / polipropileno',235,85,'0–20%',40,'PP','Técnicos','Requiere una superficie compatible con PP. Probá adherencia y contracción en una muestra pequeña.'],
  hips: ['HIPS',235,95,'0–20%',45,'HIPS','Técnicos','Usalo según la ficha de la bobina y con ventilación adecuada. También existe como soporte separable para ABS.'],
  pet: ['PET',255,80,'20–45%',45,'PET','Técnicos','Confirmá la ficha técnica de la formulación antes de aplicar el punto de partida.'],
  placf: ['PLA-CF',220,55,'50–80%',55,'PLA-CF','Compuestos','Usá una boquilla resistente a la abrasión. Confirmá el diámetro mínimo que pide la bobina.'],
  petgcf: ['PETG-CF',255,80,'20–45%',50,'PETG-CF','Compuestos','Para piezas rígidas y acabado mate. Verificá boquilla, alimentador y secado.'],
  pacf: ['PA-CF / PA-GF',null,null,null,null,null,'Compuestos','Las variantes de nylon difieren mucho en temperatura y secado. Requieren boquilla resistente a la abrasión.'],
  wood: ['PLA madera / cargas decorativas',null,null,null,null,null,'Acabados','La proporción de carga cambia la impresión. Elegí boquilla y temperatura según la bobina.'],
  pva: ['PVA / BVOH',null,null,null,null,null,'Soportes','Para interfaces solubles en agua. Verificá compatibilidad térmica con el material principal y mantené la bobina seca.'],
  breakaway: ['Soporte desprendible',null,null,null,null,null,'Soportes','Elegí una interfaz diseñada para el polímero principal y probá separación y acabado.'],
  industrial: ['PEEK / PEI / PPS / PPA',null,null,null,null,null,'Industriales','Consultá la ficha exacta. Algunas formulaciones requieren equipo industrial o cámara calefaccionada.']
};
const materialGroups = ['Uso general','Acabados','Flexibles','Técnicos','Compuestos','Soportes','Industriales'];
const materialNotes = {tpu:'Para la K1 con CFS original, usá la ruta externa apta para TPU.', abs:'Comprobá cámara y ventilación.', asa:'Comprobá cámara y ventilación.', pc:'Verificá los límites de cama y hotend.', placf:'Requiere boquilla resistente a abrasión.', petgcf:'Requiere boquilla resistente a abrasión.'};
