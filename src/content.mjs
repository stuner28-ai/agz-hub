export const SITE = {
  name: "UtiliTools",
  domain: "https://www.utilitools.com.ar",
  tagline: "Números claros para decidir mejor",
  description: "Calculadoras verificadas para trabajadores, monotributistas y pequeños negocios de Argentina.",
  analyticsId: "G-2RK3H8JB0P",
  adsensePublisher: "pub-2453279126589038",
  updatedHuman: "23 de agosto de 2026",
  updatedIso: "2026-08-23"
};

const numberField = (name, label, value, options = {}) => ({
  type: "number",
  name,
  label,
  value,
  min: options.min ?? 0,
  max: options.max,
  step: options.step ?? "0.01",
  prefix: options.prefix,
  suffix: options.suffix,
  help: options.help,
  required: options.required ?? true
});

const selectField = (name, label, value, options, help) => ({
  type: "select",
  name,
  label,
  value,
  options,
  help,
  required: true
});

export const TOOLS = [
  {
    slug: "precio-de-venta",
    calculator: "sale-price",
    category: "Negocio",
    icon: "↗",
    accent: "lime",
    title: "Calculadora de precio de venta",
    shortTitle: "Precio de venta",
    description: "Calculá un precio que cubra producto, comisiones, impuestos, publicidad y margen real sin confundir markup con rentabilidad.",
    promise: "Pasá de costos dispersos a un precio defendible en menos de un minuto.",
    fields: [
      numberField("productCost", "Costo del producto o servicio", 10000, { prefix: "$" }),
      numberField("packaging", "Embalaje y preparación", 500, { prefix: "$" }),
      numberField("shipping", "Envío que absorbés", 0, { prefix: "$", required: false }),
      numberField("overhead", "Costos fijos asignados por unidad", 800, { prefix: "$", help: "Ej.: tienda, monotributo, software y administración prorrateados." }),
      numberField("advertising", "Publicidad estimada por venta", 1000, { prefix: "$", help: "Usá tu costo por compra promedio; si todavía no pautás, dejalo en cero.", required: false }),
      numberField("commissionPct", "Comisión de cobro o marketplace", 6.5, { suffix: "%", max: 99 }),
      numberField("taxPct", "Impuestos sobre la venta", 3, { suffix: "%", max: 99, help: "Ingresá solo tributos que efectivamente se calculan sobre el precio." }),
      numberField("marginPct", "Margen neto objetivo", 30, { suffix: "%", max: 99 }),
      selectField("rounding", "Redondear hacia arriba", "100", [
        ["1", "Sin redondeo"], ["10", "A múltiplos de $10"], ["100", "A múltiplos de $100"], ["1000", "A múltiplos de $1.000"]
      ])
    ],
    formula: "Precio = costos por unidad ÷ (1 − comisión − impuestos − margen deseado)",
    formulaNote: "La comisión, los impuestos y el margen se expresan como proporción del precio final. Por eso no alcanza con sumar porcentajes al costo.",
    exampleTitle: "Ejemplo: un producto que parece rentable, pero no lo es",
    example: "Si comprar y preparar un producto cuesta $11.300, captar la venta cuesta $1.000 y entre comisión e impuestos se pierde 9,5% del cobro, venderlo a $18.000 no deja 50% de margen. Esta calculadora descuenta cada componente en el orden correcto y muestra la ganancia neta estimada.",
    sections: [
      {
        title: "Qué costos conviene incluir",
        paragraphs: [
          "Incluí todo lo que cambia por cada venta: mercadería, materia prima, bolsa o caja, etiquetas, traslado que pagás vos y la porción de publicidad necesaria para conseguir un pedido. Si un costo existe aunque no vendas —por ejemplo, la tienda online o el monotributo— repartilo entre una cantidad mensual razonable de unidades.",
          "No dupliques conceptos. Si la comisión de la plataforma ya incluye el procesamiento del pago, no vuelvas a cargarlo como costo adicional. Para impuestos, usá la tasa efectiva que te corresponda y validala con tu contador: la herramienta ordena el cálculo, pero no determina tu situación fiscal."
        ]
      },
      {
        title: "Margen y markup no son lo mismo",
        paragraphs: [
          "Un markup de 100% duplica el costo, pero equivale a un margen bruto de 50% sobre el precio. Esta diferencia explica por qué muchos comercios creen ganar el doble y después descubren que el efectivo no alcanza para reponer stock.",
          "El resultado muestra ambos indicadores. Usá el margen para evaluar cuánto queda de cada peso vendido y el markup para comparar el precio contra el costo invertido."
        ]
      },
      {
        title: "Cómo usar el resultado en la práctica",
        paragraphs: [
          "Tomá el precio sugerido como punto de control, no como una orden. Después comparalo con alternativas del mercado y revisá qué podés mejorar: costo de compra, tasa de conversión publicitaria, packaging o comisión de cobro. Si el mercado no acepta el precio, el problema está en la estructura de costos o en la propuesta de valor, no en la calculadora.",
          "Guardá los valores habituales en este dispositivo. UtiliTools los recuerda localmente y no los envía a un servidor, de modo que podés volver cuando cambie un costo y recalcular en segundos."
        ]
      }
    ],
    faqs: [
      ["¿El margen se calcula sobre el costo o el precio?", "El margen se calcula sobre el precio de venta. El porcentaje sobre el costo se denomina markup."],
      ["¿Debo sumar IVA en impuestos?", "Depende de tu condición fiscal y de si el importe cargado ya lo incluye. Evitá duplicarlo y consultá a un profesional cuando corresponda."],
      ["¿Cómo estimo publicidad por venta?", "Dividí el gasto atribuible de una campaña por las ventas confirmadas que produjo. Usá varias semanas para evitar que un día aislado distorsione el promedio."],
      ["¿Por qué el precio sube tanto al pedir 40% de margen?", "Porque el 40% debe quedar después de absorber costos y porcentajes sobre la venta; no es simplemente sumar 40% al costo."]
    ],
    sources: [
      ["Metodología propia de UtiliTools", "/metodologia", "Modelo algebraico de margen sobre ventas, revisado el 23/08/2026."]
    ],
    related: ["margen-ganancia", "punto-equilibrio", "roi-roas"]
  },
  {
    slug: "monotributo",
    calculator: "monotributo",
    category: "Argentina",
    icon: "AR",
    accent: "sky",
    title: "Calculadora de categoría de Monotributo 2026",
    shortTitle: "Monotributo 2026",
    description: "Estimá tu categoría con los parámetros oficiales de ARCA vigentes desde el 1 de agosto de 2026, no solo por facturación.",
    promise: "Una estimación transparente, con tabla oficial, límites y advertencias visibles.",
    updatedLabel: "Valores ARCA desde 01/08/2026",
    fields: [
      selectField("activity", "Tipo de actividad", "services", [["services", "Locaciones y servicios"], ["goods", "Venta de cosas muebles"]]),
      numberField("income", "Ingresos brutos de los últimos 12 meses", 15000000, { prefix: "$", help: "Usá el total acumulado móvil de 12 meses, no solo el año calendario." }),
      numberField("area", "Superficie afectada", 0, { suffix: "m²", required: false, help: "Dejá cero si el parámetro no corresponde o querés estimar solo por ingresos." }),
      numberField("energy", "Energía consumida en 12 meses", 0, { suffix: "kWh", required: false }),
      numberField("rent", "Alquileres devengados en 12 meses", 0, { prefix: "$", required: false }),
      numberField("maxUnitPrice", "Mayor precio unitario vendido", 0, { prefix: "$", required: false, help: "Se evalúa para venta de cosas muebles." })
    ],
    formula: "Categoría estimada = la primera categoría que admite todos los parámetros informados",
    formulaNote: "ARCA considera ingresos, superficie, energía, alquileres y —en venta de bienes— precio unitario máximo. La cuota puede variar por excepciones previsionales, obra social, adherentes y otros supuestos.",
    exampleTitle: "Por qué mirar solo la facturación puede dar una categoría equivocada",
    example: "Una actividad con ingresos compatibles con B puede quedar alcanzada por una categoría superior si supera la superficie, el consumo eléctrico o los alquileres admitidos para B. La herramienta busca la primera fila oficial que cumple simultáneamente todos los datos cargados.",
    sections: [
      {
        title: "Qué período tenés que revisar",
        paragraphs: [
          "La recategorización evalúa la actividad de los últimos doce meses. Es un período móvil: al calcular en agosto no se mira solamente enero–julio, sino los doce meses completos que correspondan al proceso. Sumá comprobantes y registraciones con el mismo criterio que usa ARCA.",
          "Los parámetros se actualizan periódicamente. Por eso la página muestra fecha de vigencia, enlace a la tabla oficial y un historial editorial. Si ARCA publica nuevos valores, esta herramienta debe actualizarse antes de volver a usarse como referencia."
        ]
      },
      {
        title: "Qué significa la cuota estimada",
        paragraphs: [
          "El total informado combina impuesto integrado, aporte previsional y obra social de acuerdo con la tabla general. No todas las personas pagan exactamente ese total: quienes aportan por otro régimen, determinados jubilados, locadores y otros casos pueden tener componentes diferentes.",
          "La estimación sirve para anticipar orden de magnitud y detectar si conviene revisar la categoría. La confirmación válida es la que surge del portal de ARCA con tu situación registrada."
        ]
      },
      {
        title: "Cuándo pedir ayuda profesional",
        paragraphs: [
          "Consultá a un contador si combinás actividades, tenés ingresos del exterior, vendés bienes con precios cercanos al máximo, superaste un parámetro, necesitás excluir aportes o no sabés qué comprobantes integrar. Una respuesta correcta depende de hechos que una calculadora pública no puede conocer.",
          "UtiliTools no solicita CUIT, clave fiscal ni datos identificatorios. Nunca ingreses credenciales de ARCA en una calculadora externa."
        ]
      }
    ],
    faqs: [
      ["¿Los valores están actualizados?", "Sí. La tabla usada aquí rige desde el 1 de agosto de 2026 y enlaza directamente a ARCA."],
      ["¿La categoría depende solamente de los ingresos?", "No. También pueden intervenir superficie, energía, alquileres y precio unitario máximo, según la actividad."],
      ["¿El resultado reemplaza la recategorización de ARCA?", "No. Es una estimación orientativa; la gestión oficial se realiza en el portal de ARCA."],
      ["¿Por qué mi credencial muestra otro importe?", "Puede haber excepciones previsionales, obra social, adherentes u otras condiciones personales que esta herramienta no conoce."]
    ],
    sources: [
      ["ARCA — Montos y categorías vigentes", "https://www.arca.gob.ar/monotributo/categorias.asp", "Parámetros y cuotas desde el 01/08/2026."],
      ["ARCA — Guía de recategorización", "https://serviciosweb.arca.gob.ar/genericos/guiasPasoPaso/VerGuia.aspx?id=99", "La evaluación se realiza sobre los últimos 12 meses."]
    ],
    related: ["precio-de-venta", "iva", "margen-ganancia"]
  },
  {
    slug: "margen-ganancia",
    calculator: "margin",
    category: "Negocio",
    icon: "%",
    accent: "violet",
    title: "Calculadora de margen y markup",
    shortTitle: "Margen y markup",
    description: "Descubrí cuánto ganás realmente por venta y qué precio necesitás para alcanzar un margen objetivo.",
    promise: "Convertí costo, precio y gastos adicionales en cuatro métricas comparables.",
    fields: [
      numberField("cost", "Costo base", 10000, { prefix: "$" }),
      numberField("extraCosts", "Otros costos por unidad", 1500, { prefix: "$", required: false }),
      numberField("price", "Precio de venta", 20000, { prefix: "$" }),
      numberField("targetMarginPct", "Margen objetivo", 35, { suffix: "%", max: 99 })
    ],
    formula: "Margen = ganancia ÷ precio · Markup = ganancia ÷ costo",
    formulaNote: "Ambos porcentajes describen la misma operación desde bases diferentes. Compararlos evita interpretar un markup alto como si fuera margen neto.",
    exampleTitle: "El clásico 100% que en realidad es 50%",
    example: "Comprar a $10.000 y vender a $20.000 implica una ganancia bruta de $10.000: el markup es 100% sobre el costo, pero el margen es 50% del precio. Si además hay $1.500 de gastos por unidad, el margen baja a 42,5%.",
    sections: [
      { title: "Cuándo usar cada indicador", paragraphs: ["El margen responde qué parte de cada venta queda después del costo. Es útil para presupuestar, comparar líneas de producto y fijar objetivos. El markup muestra cuánto se incrementó el costo para formar el precio y suele ser práctico en listas comerciales.", "No mezcles margen bruto con ganancia final del negocio. Sueldos, alquiler, impuestos, devoluciones y publicidad pueden convertir un buen margen por producto en un resultado mensual insuficiente."] },
      { title: "Cómo comparar productos distintos", paragraphs: ["Usá el mismo perímetro de costos para todos. Si en un producto incluís packaging y en otro no, la comparación pierde valor. Para decisiones de catálogo, observá margen, ganancia en pesos y velocidad de rotación.", "Un margen menor puede ser aceptable si el producto se vende rápido, casi no genera devoluciones o atrae compradores que luego suman artículos rentables."] }
    ],
    faqs: [
      ["¿Puede el margen superar 100%?", "No cuando se calcula sobre un precio positivo: la ganancia no puede superar el ingreso. El markup sí puede superar 100%."],
      ["¿Qué pasa si vendo por debajo del costo?", "El resultado muestra margen y markup negativos, una señal clara de pérdida por unidad."],
      ["¿Incluyo impuestos?", "Incluí los que formen parte real del costo o usá la calculadora de precio de venta para modelar porcentajes sobre el cobro."]
    ],
    sources: [["Metodología UtiliTools", "/metodologia", "Definiciones algebraicas y casos de prueba públicos."]],
    related: ["precio-de-venta", "punto-equilibrio", "descuentos"]
  },
  {
    slug: "iva",
    calculator: "vat",
    category: "Argentina",
    icon: "+",
    accent: "amber",
    title: "Calculadora de IVA: sumar o discriminar",
    shortTitle: "IVA",
    description: "Agregá IVA a un neto o separalo de un precio final usando 21%, 10,5% o 27%, con la fórmula visible.",
    promise: "Tres importes claros: neto gravado, IVA y total.",
    fields: [
      numberField("amount", "Importe", 10000, { prefix: "$" }),
      selectField("rate", "Alícuota", "21", [["21", "21% — tasa general"], ["10.5", "10,5% — tasa reducida"], ["27", "27% — tasa incrementada"]]),
      selectField("mode", "Operación", "add", [["add", "Sumar IVA a un neto"], ["extract", "Discriminar IVA de un total"]])
    ],
    formula: "Sumar: total = neto × (1 + tasa) · Extraer: neto = total ÷ (1 + tasa)",
    formulaNote: "Para extraer 21% de un precio final no se multiplica por 0,79: se divide por 1,21. La diferencia entre total y neto es el impuesto incluido.",
    exampleTitle: "Ejemplo con un total de $12.100",
    example: "Si el precio final incluye IVA general de 21%, el neto es $10.000 y el impuesto es $2.100. Restar 21% directamente habría dado un resultado incorrecto.",
    sections: [
      { title: "Elegir la alícuota correcta", paragraphs: ["La tasa general del IVA argentino es 21%, pero existen operaciones alcanzadas por 10,5%, 27%, exenciones y tratamientos particulares. La calculadora no decide qué tasa corresponde: aplica la que selecciones.", "Verificá la naturaleza de la operación y tu condición fiscal antes de emitir comprobantes. Para casos particulares, usá normativa oficial o asesoramiento profesional."] },
      { title: "Precios con IVA incluido", paragraphs: ["Cuando comunicás un precio final al consumidor, separar el impuesto sirve para control interno y facturación. Al presupuestar entre responsables inscriptos, distinguir neto e IVA evita comparar montos con bases diferentes.", "Esta página no almacena importes. Los cálculos se ejecutan en tu navegador."] }
    ],
    faqs: [
      ["¿Cómo saco el 21% incluido?", "Dividí el total por 1,21 para obtener el neto; el IVA es la diferencia."],
      ["¿Todos los productos pagan 21%?", "No. Hay tasas reducidas, incrementadas, exenciones y tratamientos específicos."],
      ["¿La herramienta emite facturas?", "No. Solo realiza el cálculo matemático."]
    ],
    sources: [["ARCA — Ley de Impuesto al Valor Agregado, artículo 28", "https://biblioteca.arca.gob.ar/cuadroslegislativos/getAdjunto.aspx?i=7833", "Tasa general y cuadro de alícuotas."]],
    related: ["precio-de-venta", "monotributo", "margen-ganancia"]
  },
  {
    slug: "aguinaldo",
    calculator: "aguinaldo",
    category: "Trabajo",
    icon: "½",
    accent: "rose",
    title: "Calculadora de aguinaldo proporcional",
    shortTitle: "Aguinaldo",
    description: "Estimá el medio aguinaldo completo o proporcional a partir de la mayor remuneración mensual del semestre.",
    promise: "Una cuenta breve, una fórmula oficial y las limitaciones explicadas.",
    fields: [
      numberField("salary", "Mayor remuneración mensual del semestre", 1000000, { prefix: "$" }),
      numberField("months", "Meses trabajados en el semestre", 6, { suffix: "meses", min: 0.01, max: 6, step: "0.01" })
    ],
    formula: "Aguinaldo proporcional = mejor remuneración mensual ÷ 12 × meses trabajados",
    formulaNote: "Para seis meses completos, el resultado equivale al 50% de la mayor remuneración mensual devengada en el semestre.",
    exampleTitle: "Ejemplo de semestre completo",
    example: "Con una mejor remuneración mensual de $1.000.000 y seis meses trabajados, el medio aguinaldo bruto estimado es $500.000. Si fueron cuatro meses, la estimación es $333.333,33.",
    sections: [
      { title: "Qué remuneración tomar", paragraphs: ["La referencia es la mayor remuneración mensual devengada por todo concepto dentro del semestre correspondiente. No necesariamente coincide con el último sueldo ni con un promedio de seis meses.", "Conceptos no remunerativos, licencias, variables y convenios pueden requerir un análisis adicional. El resultado de esta herramienta es bruto y orientativo."] },
      { title: "Cuándo corresponde proporcional", paragraphs: ["Si la relación laboral comenzó o terminó durante el semestre, corresponde considerar el tiempo efectivamente trabajado. La fórmula oficial publicada por Argentina.gob.ar divide la remuneración por doce y la multiplica por los meses trabajados.", "Para liquidaciones por días, situaciones irregulares o diferencias salariales, consultá a un profesional laboral."] }
    ],
    faqs: [
      ["¿El aguinaldo es la mitad del último sueldo?", "No necesariamente: se toma la mayor remuneración mensual devengada del semestre."],
      ["¿El resultado es neto?", "No. Es una estimación bruta antes de descuentos que puedan corresponder."],
      ["¿Cuántas cuotas se pagan?", "El Sueldo Anual Complementario se divide en dos medios aguinaldos, uno por cada semestre."]
    ],
    sources: [["Argentina.gob.ar — Aguinaldo", "https://www.argentina.gob.ar/trabajo/casasparticulares/empleador/remuneracionesyrecibos/aguinaldo", "Definición, proporcionalidad y fórmula oficial."]],
    related: ["monotributo", "iva", "interes-compuesto"]
  },
  {
    slug: "punto-equilibrio",
    calculator: "break-even",
    category: "Negocio",
    icon: "=",
    accent: "teal",
    title: "Calculadora de punto de equilibrio",
    shortTitle: "Punto de equilibrio",
    description: "Calculá cuántas unidades necesitás vender para cubrir costos fijos y cuánto resultado dejan tus ventas esperadas.",
    promise: "Transformá gastos mensuales en una meta concreta de unidades e ingresos.",
    fields: [
      numberField("fixedCosts", "Costos fijos mensuales", 300000, { prefix: "$" }),
      numberField("price", "Precio de venta por unidad", 20000, { prefix: "$" }),
      numberField("variableCost", "Costo variable por unidad", 11000, { prefix: "$" }),
      numberField("expectedUnits", "Unidades que esperás vender", 50, { suffix: "unidades", required: false })
    ],
    formula: "Unidades de equilibrio = costos fijos ÷ (precio unitario − costo variable unitario)",
    formulaNote: "La diferencia entre precio y costo variable es el margen de contribución: primero cubre la estructura fija y recién después genera resultado.",
    exampleTitle: "Ejemplo para un pequeño comercio",
    example: "Con $300.000 de costos fijos y $9.000 de contribución por unidad, el equilibrio exacto es 33,33 unidades. Como no se puede vender una fracción, hacen falta 34 unidades para superar el umbral.",
    sections: [
      { title: "Separar costos fijos y variables", paragraphs: ["Son fijos los costos que existen aunque ese mes no haya ventas: alquiler, abonos, administración o una base salarial. Son variables los que crecen con cada unidad: mercadería, embalaje, comisión por operación o insumos.", "Una clasificación inconsistente produce una meta engañosa. Revisala cada vez que cambie el precio, la comisión o el costo de reposición."] },
      { title: "Usar el equilibrio como tablero", paragraphs: ["Convertí el resultado mensual en una meta semanal o diaria y comparala con ventas reales. Si el volumen requerido es imposible, necesitás mejorar contribución, reducir estructura o rediseñar la oferta.", "El punto de equilibrio no reemplaza el flujo de caja: podés ser rentable en el papel y quedarte sin efectivo por plazos de cobro, stock o inversiones."] }
    ],
    faqs: [
      ["¿Por qué se redondea hacia arriba?", "Porque vender menos que el valor exacto todavía deja una parte de los costos fijos sin cubrir."],
      ["¿Incluyo mi sueldo en costos fijos?", "Si el negocio debe remunerar tu trabajo para ser sostenible, conviene incluir una asignación realista."],
      ["¿Sirve para varios productos?", "Sí, pero necesitás un margen de contribución promedio ponderado por la mezcla de ventas."]
    ],
    sources: [["Metodología UtiliTools", "/metodologia", "Modelo de contribución unitario con pruebas reproducibles."]],
    related: ["precio-de-venta", "margen-ganancia", "roi-roas"]
  },
  {
    slug: "roi-roas",
    calculator: "roi",
    category: "Marketing",
    icon: "◎",
    accent: "blue",
    title: "Calculadora de ROI, ROAS y ganancia",
    shortTitle: "ROI y ROAS",
    description: "Medí campañas con ingresos, costo de producto, pauta y otros gastos para no confundir facturación con rentabilidad.",
    promise: "ROAS para publicidad, ROI para la inversión completa y ganancia en pesos.",
    fields: [
      numberField("revenue", "Ingresos atribuidos", 500000, { prefix: "$" }),
      numberField("productCosts", "Costo de productos o prestación", 220000, { prefix: "$" }),
      numberField("adSpend", "Inversión publicitaria", 100000, { prefix: "$" }),
      numberField("otherCosts", "Otros costos atribuibles", 30000, { prefix: "$", required: false })
    ],
    formula: "ROAS = ingresos ÷ pauta · ROI = ganancia ÷ inversión total",
    formulaNote: "Un ROAS de 4 significa cuatro pesos facturados por cada peso de pauta, no cuatro pesos ganados. El ROI incorpora el resto de los costos cargados.",
    exampleTitle: "Por qué un ROAS alto puede perder dinero",
    example: "Facturar $500.000 con $100.000 de publicidad da ROAS 5. Si producir, entregar y administrar esas ventas cuesta otros $400.000, la campaña queda en equilibrio: el ROAS luce bien, pero no hubo ganancia.",
    sections: [
      { title: "Atribución y ventana de análisis", paragraphs: ["Usá ingresos realmente vinculados a la campaña y descontá cancelaciones o devoluciones. Compará períodos equivalentes; una campaña iniciada ayer no debería medirse contra ventas maduras de varias semanas.", "Las plataformas atribuyen conversiones con reglas propias. Contrastá su informe con pagos confirmados y tu sistema de ventas."] },
      { title: "Qué métrica guía cada decisión", paragraphs: ["ROAS sirve para observar eficiencia publicitaria; ROI muestra si el conjunto de la inversión produjo retorno. La ganancia en moneda te dice si el esfuerzo mueve materialmente el negocio.", "Definí un umbral antes de escalar. Más ventas con margen negativo aceleran la pérdida."] }
    ],
    faqs: [
      ["¿ROAS 2 es bueno?", "Depende de tu margen y otros costos. Un negocio con poco margen puede necesitar un ROAS mucho mayor."],
      ["¿Qué incluyo en otros costos?", "Comisiones, logística incremental, creatividades, agencias o cualquier gasto que atribuyas a la campaña."],
      ["¿ROI negativo significa pérdida?", "Sí, para los costos e ingresos cargados y durante el período analizado."]
    ],
    sources: [["Metodología UtiliTools", "/metodologia", "Definiciones financieras explícitas y sin promesas de rendimiento."]],
    related: ["precio-de-venta", "punto-equilibrio", "margen-ganancia"]
  },
  {
    slug: "descuentos",
    calculator: "discounts",
    category: "Negocio",
    icon: "↓",
    accent: "orange",
    title: "Calculadora de descuentos sucesivos",
    shortTitle: "Descuentos",
    description: "Calculá precio final, ahorro efectivo y cuánto habría que aumentar después para volver al precio original.",
    promise: "Dos descuentos, un porcentaje real y cero errores de suma.",
    fields: [
      numberField("originalPrice", "Precio original", 50000, { prefix: "$" }),
      numberField("firstPct", "Primer descuento", 20, { suffix: "%", max: 100 }),
      numberField("secondPct", "Segundo descuento", 10, { suffix: "%", max: 100, required: false })
    ],
    formula: "Precio final = precio original × (1 − descuento 1) × (1 − descuento 2)",
    formulaNote: "Los descuentos sucesivos se aplican sobre bases distintas. 20% y luego 10% equivalen a 28%, no a 30%.",
    exampleTitle: "La promoción 20% + 10%",
    example: "Sobre $50.000, el primer descuento deja $40.000 y el segundo descuenta $4.000. El precio final es $36.000: el ahorro efectivo es 28%.",
    sections: [
      { title: "Descuento y recuperación no son simétricos", paragraphs: ["Después de bajar 20%, necesitás subir 25% sobre el precio rebajado para volver al original. Cuanto mayor es la baja, mayor es el aumento de recuperación.", "Esta métrica es útil para promociones: permite saber cuánto margen comprometés y qué precio quedará como referencia para el cliente."] },
      { title: "Controlar promociones con margen", paragraphs: ["Antes de lanzar una oferta, calculá el costo total por unidad. El ahorro para el cliente no debería ocultar una pérdida para el negocio. Si el descuento se financia con presupuesto publicitario o del proveedor, registralo por separado."] }
    ],
    faqs: [
      ["¿Puedo sumar dos descuentos?", "No si se aplican uno después del otro. Cada porcentaje usa como base el precio ya rebajado."],
      ["¿Qué significa aumento de recuperación?", "Es el porcentaje que debería subir el precio final para regresar al precio original."],
      ["¿Admite un solo descuento?", "Sí. Dejá el segundo en cero."]
    ],
    sources: [["Metodología UtiliTools", "/metodologia", "Composición porcentual reproducible."]],
    related: ["margen-ganancia", "precio-de-venta", "roi-roas"]
  },
  {
    slug: "interes-compuesto",
    calculator: "compound-interest",
    category: "Finanzas",
    icon: "∿",
    accent: "indigo",
    title: "Calculadora de interés compuesto con aportes",
    shortTitle: "Interés compuesto",
    description: "Proyectá capital inicial, aportes mensuales, tasa efectiva anual e inflación estimada sin prometer rendimientos.",
    promise: "Separá lo aportado, el interés matemático y el valor real estimado.",
    fields: [
      numberField("initial", "Capital inicial", 100000, { prefix: "$", required: false }),
      numberField("monthly", "Aporte al final de cada mes", 25000, { prefix: "$", required: false }),
      numberField("annualRatePct", "Tasa efectiva anual estimada", 30, { suffix: "%", max: 1000 }),
      numberField("years", "Plazo", 5, { suffix: "años", min: 0.1, max: 100, step: "0.1" }),
      numberField("inflationPct", "Inflación anual estimada", 20, { suffix: "%", max: 1000, required: false })
    ],
    formula: "Capital futuro = capital inicial capitalizado + valor futuro de aportes mensuales",
    formulaNote: "La TEA se convierte a una tasa mensual equivalente. Se supone una tasa constante y aportes al final de cada mes; la realidad puede ser diferente.",
    exampleTitle: "La diferencia entre aportar y rendir",
    example: "El resultado separa cuánto dinero salió de tu bolsillo y cuánto proviene del supuesto matemático de rendimiento. También descuenta la inflación cargada para expresar un valor real aproximado.",
    sections: [
      { title: "Una proyección no es una promesa", paragraphs: ["Las tasas futuras cambian, los instrumentos tienen costos, impuestos y riesgo, y la inflación real rara vez coincide con una estimación constante. Usá escenarios conservador, medio y exigente en lugar de confiar en un único número.", "La herramienta no recomienda activos ni garantiza resultados. Es un modelo educativo para entender el efecto del tiempo y la constancia."] },
      { title: "Nominal versus real", paragraphs: ["Un monto nominal grande puede comprar menos si los precios crecieron más rápido. El valor real divide el capital proyectado por la inflación compuesta indicada; no representa una cotización futura.", "Para comparar alternativas, usá tasas expresadas en la misma unidad y verificá si son efectivas o nominales."] }
    ],
    faqs: [
      ["¿La tasa es TNA o TEA?", "El campo usa tasa efectiva anual (TEA) y la convierte a una tasa mensual equivalente."],
      ["¿Cuándo se considera el aporte?", "Al final de cada mes."],
      ["¿Incluye impuestos y comisiones?", "No. Podés restarlos de la tasa estimada antes de cargarla si corresponde."]
    ],
    sources: [["Metodología UtiliTools", "/metodologia", "Fórmula de anualidad ordinaria y capitalización mensual equivalente."]],
    related: ["roi-roas", "descuentos", "aguinaldo"]
  },
  {
    slug: "costo-impresion-3d",
    calculator: "3d-print",
    category: "Producción",
    icon: "3D",
    accent: "fuchsia",
    title: "Calculadora de costo y precio de impresión 3D",
    shortTitle: "Costo impresión 3D",
    description: "Sumá filamento, electricidad, desgaste de máquina, trabajo, fallas y margen para cotizar impresiones FDM.",
    promise: "Una cotización completa, no solo gramos multiplicados por el precio del rollo.",
    fields: [
      numberField("grams", "Filamento utilizado", 120, { suffix: "g" }),
      numberField("spoolPrice", "Precio por kilo de filamento", 25000, { prefix: "$" }),
      numberField("hours", "Tiempo de impresión", 8, { suffix: "h" }),
      numberField("printerWatts", "Consumo medio de la impresora", 120, { suffix: "W" }),
      numberField("kwhPrice", "Precio final estimado del kWh", 180, { prefix: "$" }),
      numberField("machinePrice", "Valor de reposición de la impresora", 900000, { prefix: "$" }),
      numberField("lifeHours", "Vida útil usada para amortizar", 5000, { suffix: "h" }),
      numberField("laborMinutes", "Preparación y posprocesado", 35, { suffix: "min" }),
      numberField("laborHourly", "Valor de tu hora", 6000, { prefix: "$" }),
      numberField("otherCosts", "Otros insumos", 500, { prefix: "$", required: false }),
      numberField("failurePct", "Tasa histórica de fallas", 10, { suffix: "%", max: 99 }),
      numberField("marginPct", "Margen objetivo", 35, { suffix: "%", max: 99 })
    ],
    formula: "Costo esperado = (material + energía + desgaste + trabajo + extras) ÷ (1 − tasa de fallas)",
    formulaNote: "El precio sugerido aplica el margen sobre la venta: costo esperado ÷ (1 − margen). Todos los valores son editables para adaptarse a tu máquina y tarifa.",
    exampleTitle: "El costo invisible de una pieza de ocho horas",
    example: "El filamento suele ser solo una parte. Preparar el archivo, retirar soportes, limpiar, embalar y reservar dinero para mantenimiento también consume recursos. Una tasa de fallas del 10% significa que las piezas exitosas deben absorber, en promedio, intentos perdidos.",
    sections: [
      { title: "Cómo estimar energía y desgaste", paragraphs: ["Usá consumo medio, no la potencia máxima de la fuente. Si podés, medilo con un enchufe medidor durante varias impresiones. Para amortización, dividí el valor de reposición por horas útiles razonables y multiplicá por la duración del trabajo.", "La amortización no predice el día exacto de una rotura; crea una reserva gradual para mantenimiento y renovación."] },
      { title: "Cobrar el trabajo humano", paragraphs: ["Preparar, laminar, supervisar el inicio, retirar soportes, lijar y responder al cliente son tareas. Si las dejás en cero, la cotización remunera la máquina pero no a quien opera el negocio.", "Registrá tiempos reales de diez pedidos y usá la mediana para evitar presupuestar por intuición."] },
      { title: "Convertir el cálculo en una cotización", paragraphs: ["Después del precio sugerido, evaluá complejidad, urgencia, licencias del modelo y riesgo de repetición. Detallá qué incluye el servicio y cuánto tiempo será válida la propuesta si los insumos son volátiles."] }
    ],
    faqs: [
      ["¿El consumo en watts es constante?", "No. La cama y el hotend ciclan; por eso conviene usar un promedio medido."],
      ["¿Cómo calculo la tasa de fallas?", "Dividí impresiones fallidas por intentos totales en un período representativo."],
      ["¿Sirve para resina?", "No de forma completa. SLA requiere otros insumos y una estructura de costos distinta."],
      ["¿Incluye licencia comercial del STL?", "No. Sumala en otros costos o como cargo separado cuando corresponda."]
    ],
    sources: [["Metodología UtiliTools", "/metodologia", "Modelo de costo esperado, amortización horaria y margen sobre ventas."]],
    related: ["precio-de-venta", "margen-ganancia", "punto-equilibrio"]
  }
];

export const GUIDES = [
  {
    slug: "como-calcular-precio-de-venta",
    title: "Cómo calcular un precio de venta sin comerte el margen",
    description: "Un método práctico para reunir costos, comisiones, impuestos y publicidad antes de fijar precios.",
    category: "Gestión de negocio",
    readingTime: "8 min",
    tool: "precio-de-venta",
    intro: "Poner precio parece sencillo hasta que la caja no coincide con la ganancia imaginada. El error habitual no está en sumar mal, sino en dejar costos afuera o aplicar porcentajes sobre una base incorrecta.",
    sections: [
      ["1. Construí el costo por unidad", ["Empezá por el costo directo del producto o del tiempo de prestación. Sumá embalaje, etiquetas, traslado que absorbés, insumos y una parte razonable de los gastos mensuales. Esa asignación no tiene que ser perfecta para ser útil: debe ser explícita y consistente.", "Si pagás $21.000 mensuales de plataforma y estimás 70 ventas, el costo asignado es $300 por operación. Repetí el criterio con software, administración y otros abonos. Cuando el volumen cambie, recalculá."]],
      ["2. Separá importes de porcentajes", ["Comisiones de cobro, retenciones e impuestos sobre la venta dependen del precio final. Si primero elegís un precio y después los restás, el margen puede desaparecer. La ecuación correcta despeja el precio necesario para que, después de esos descuentos, todavía queden costos cubiertos y ganancia.", "No cargues un tributo porque lo viste en un ejemplo ajeno. La condición fiscal cambia entre negocios; documentá qué incluye cada porcentaje y validalo con un profesional."]],
      ["3. Incorporá el costo de conseguir la venta", ["La publicidad no es un gasto abstracto si podés vincularla a pedidos. Dividí la inversión atribuible por compras confirmadas y obtené un costo por adquisición. Usá un período suficientemente largo para incluir días buenos y malos.", "Si aún no tenés historial, prepará tres escenarios. El conservador te muestra cuánto margen resistiría la oferta si captar clientes resulta más caro de lo esperado."]],
      ["4. Probá el precio contra el mercado", ["La matemática define sostenibilidad; el mercado define aceptación. Si el precio viable queda muy arriba de alternativas comparables, revisá costos, diferenciación, presentación o público. Bajar sin diagnóstico suele trasladar el problema a la caja.", "Antes de una promoción, calculá el margen con el descuento aplicado y el volumen adicional necesario para compensarlo."]]
    ],
    checklist: ["Costo directo actualizado", "Packaging y logística", "Costos fijos por unidad", "Comisiones sobre el cobro", "Impuestos aplicables", "Publicidad por venta", "Margen objetivo", "Comparación con alternativas reales"]
  },
  {
    slug: "monotributo-agosto-2026",
    title: "Monotributo desde agosto de 2026: cómo leer la tabla de ARCA",
    description: "Qué significan los parámetros, por qué la facturación no es el único límite y cómo usar una estimación sin reemplazar el trámite oficial.",
    category: "Argentina",
    readingTime: "7 min",
    tool: "monotributo",
    intro: "Desde el 1 de agosto de 2026 rigen nuevos importes. Una lectura apurada de la columna de ingresos puede inducir a error porque la categoría se asigna considerando varios parámetros de la actividad.",
    sections: [
      ["Ingresos de los últimos doce meses", ["El límite no se analiza mirando un mes aislado ni únicamente el año calendario. En recategorización se evalúa la actividad acumulada del período móvil de doce meses. Prepará un registro mensual para detectar con anticipación cuándo te acercás al tope.", "La categoría A admite hasta $12.009.410,45 y la K hasta $126.610.838,75 según la tabla oficial vigente desde el 1/08/2026."]],
      ["Los otros parámetros", ["Superficie afectada, energía consumida y alquileres devengados pueden empujar la estimación a una categoría superior. Para venta de cosas muebles también existe un precio unitario máximo de $716.840,77 en la tabla publicada.", "Algunos parámetros tienen excepciones. Por ejemplo, ARCA aclara que la superficie no se considera en determinadas ciudades de menos de 40.000 habitantes. Leé las notas de la fuente oficial antes de concluir."]],
      ["Por qué la cuota puede no coincidir", ["Los totales generales combinan impuesto integrado, SIPA y obra social. Aportes por otro régimen, jubilación, locación de inmuebles, adherentes y otras situaciones cambian componentes. Una calculadora pública no conoce tu historia previsional.", "Usá el estimador para hacer presupuesto y detectar alertas. Confirmá categoría e importe dentro del portal de ARCA."]],
      ["Buenas prácticas de seguridad", ["No ingreses CUIT, clave fiscal ni credenciales en una calculadora. UtiliTools trabaja solo con números generales en tu navegador y no necesita identificarte.", "Guardá comprobantes y consultá a un contador cuando combinás actividades, operás con moneda extranjera o superás un parámetro."]]
    ],
    checklist: ["Ingresos brutos de 12 meses", "Actividad principal", "Superficie si corresponde", "Consumo eléctrico anual", "Alquileres devengados", "Precio unitario máximo", "Excepciones previsionales y de obra social"]
  },
  {
    slug: "margen-vs-markup",
    title: "Margen vs. markup: la diferencia que cambia tus precios",
    description: "Dos porcentajes parecidos que responden preguntas distintas, explicados con ejemplos de comercio real.",
    category: "Gestión de negocio",
    readingTime: "6 min",
    tool: "margen-ganancia",
    intro: "Cuando alguien dice «le agrego 100% y gano 100%», suele estar hablando de markup. Sobre el precio final, ese mismo caso deja 50% de margen antes de otros gastos.",
    sections: [
      ["La base de cada porcentaje", ["El markup divide la ganancia por el costo. El margen divide la ganancia por el precio de venta. Con costo $10.000 y precio $15.000, la ganancia es $5.000: markup 50%, margen 33,33%.", "Ninguno es mejor por sí mismo. El problema aparece cuando se fija un objetivo en una métrica y se interpreta como la otra."]],
      ["Del margen objetivo al precio", ["Para lograr 30% de margen, no sumes 30% al costo. Dividí el costo total por 0,70. Si cuesta $10.000, el precio matemático es $14.285,71.", "Este despeje se vuelve todavía más importante cuando comisiones e impuestos también se calculan sobre el precio."]],
      ["Qué costos entran", ["Definí si hablás de margen bruto de producto o margen después de costos comerciales. Nombrar la métrica evita discusiones: dos personas pueden obtener porcentajes distintos porque incluyeron componentes diferentes.", "Para catálogo, conviene registrar al menos costo de reposición, costo variable de preparación y comisión por venta."]],
      ["Más margen no siempre significa mejor negocio", ["Rotación, devoluciones, capital inmovilizado y ventas complementarias importan. Un artículo de margen moderado que rota cada semana puede aportar más dinero que uno de margen alto que permanece meses en stock.", "Compará porcentaje y ganancia en pesos dentro del mismo período."]]
    ],
    checklist: ["Definir costo total", "Calcular ganancia en pesos", "Dividir por precio para margen", "Dividir por costo para markup", "Comparar rotación", "Revisar comisiones y devoluciones"]
  }
];

export const LEGACY_REDIRECTS = {
  "/index.html": "/",
  "/monotributo.html": "/herramientas/monotributo",
  "/calculadora-monotributo.html": "/herramientas/monotributo",
  "/articulo-monotributo-2026.html": "/guias/monotributo-agosto-2026",
  "/margen.html": "/herramientas/margen-ganancia",
  "/calculadora-margen-ganancia.html": "/herramientas/margen-ganancia",
  "/iva.html": "/herramientas/iva",
  "/calculadora-iva.html": "/herramientas/iva",
  "/aguinaldo.html": "/herramientas/aguinaldo",
  "/calculadora-aguinaldo.html": "/herramientas/aguinaldo",
  "/equilibrio.html": "/herramientas/punto-equilibrio",
  "/calculadora-punto-equilibrio.html": "/herramientas/punto-equilibrio",
  "/roi.html": "/herramientas/roi-roas",
  "/calculadora-roi.html": "/herramientas/roi-roas",
  "/descuentos.html": "/herramientas/descuentos",
  "/calculadora-descuentos.html": "/herramientas/descuentos",
  "/interes.html": "/herramientas/interes-compuesto",
  "/calculadora-interes-compuesto.html": "/herramientas/interes-compuesto",
  "/articulo-interes-compuesto.html": "/herramientas/interes-compuesto",
  "/impresion3d.html": "/herramientas/costo-impresion-3d",
  "/calculadora-impresion-3d.html": "/herramientas/costo-impresion-3d",
  "/articulo-impresion-3d.html": "/herramientas/costo-impresion-3d",
  "/quienes-somos.html": "/equipo",
  "/sobre-nosotros.html": "/equipo",
  "/politica-privacidad.html": "/privacidad",
  "/contacto.html": "/contacto",
  "/guias.html": "/guias",
  "/blog.html": "/guias",
  "/novedades.html": "/guias"
};

export const toolBySlug = Object.fromEntries(TOOLS.map(tool => [tool.slug, tool]));
