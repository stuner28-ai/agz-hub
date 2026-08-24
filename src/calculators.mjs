const asNumber = (value, label = "valor") => {
  const number = typeof value === "string"
    ? Number(value.trim().replace(/\s/g, "").replace(",", "."))
    : Number(value);
  if (!Number.isFinite(number)) throw new Error(`Revisá ${label}: debe ser un número válido.`);
  return number;
};

const nonNegative = (value, label) => {
  const number = asNumber(value ?? 0, label);
  if (number < 0) throw new Error(`${label} no puede ser negativo.`);
  return number;
};

const percentage = (value, label, max = 99.99) => {
  const number = nonNegative(value, label);
  if (number > max) throw new Error(`${label} debe ser menor o igual a ${max}%.`);
  return number;
};

export const MONOTRIBUTO_UPDATED_AT = "2026-08-01";

export const MONOTRIBUTO_CATEGORIES = [
  { category: "A", income: 12009410.45, area: 30, energy: 3330, rent: 2792886.15, maxUnitPrice: 716840.77, serviceTotal: 49527.18, goodsTotal: 49527.18 },
  { category: "B", income: 17595182.74, area: 45, energy: 5000, rent: 2792886.15, maxUnitPrice: 716840.77, serviceTotal: 56379.08, goodsTotal: 56379.08 },
  { category: "C", income: 24670494.31, area: 60, energy: 6700, rent: 3816944.41, maxUnitPrice: 716840.77, serviceTotal: 66020.12, goodsTotal: 64530.58 },
  { category: "D", income: 30628651.43, area: 85, energy: 10000, rent: 3816944.41, maxUnitPrice: 716840.77, serviceTotal: 84612.93, goodsTotal: 82564.81 },
  { category: "E", income: 36028231.33, area: 110, energy: 13000, rent: 4841002.66, maxUnitPrice: 716840.77, serviceTotal: 119811.45, goodsTotal: 108267.51 },
  { category: "F", income: 45151659.41, area: 150, energy: 16500, rent: 4841002.66, maxUnitPrice: 716840.77, serviceTotal: 150784.21, goodsTotal: 129930.65 },
  { category: "G", income: 53995798.87, area: 200, energy: 20000, rent: 5771964.69, maxUnitPrice: 716840.77, serviceTotal: 230312.94, goodsTotal: 158815.05 },
  { category: "H", income: 81924660.37, area: 200, energy: 20000, rent: 8378658.45, maxUnitPrice: 716840.77, serviceTotal: 522706.68, goodsTotal: 317895.01 },
  { category: "I", income: 91699761.90, area: 200, energy: 20000, rent: 8378658.45, maxUnitPrice: 716840.77, serviceTotal: 963747.86, goodsTotal: 474992.78 },
  { category: "J", income: 105012519.20, area: 200, energy: 20000, rent: 8378658.45, maxUnitPrice: 716840.77, serviceTotal: 1167299.76, goodsTotal: 580793.69 },
  { category: "K", income: 126610838.75, area: 200, energy: 20000, rent: 8378658.45, maxUnitPrice: 716840.77, serviceTotal: 1614446.04, goodsTotal: 702103.24 }
];

export function calculateSalePrice(input) {
  const productCost = nonNegative(input.productCost, "el costo del producto");
  const packaging = nonNegative(input.packaging, "el embalaje");
  const shipping = nonNegative(input.shipping, "el envío absorbido");
  const overhead = nonNegative(input.overhead, "los costos generales por unidad");
  const advertising = nonNegative(input.advertising, "la publicidad por venta");
  const commissionPct = percentage(input.commissionPct, "la comisión");
  const taxPct = percentage(input.taxPct, "los impuestos sobre la venta");
  const marginPct = percentage(input.marginPct, "el margen objetivo");
  const baseCost = productCost + packaging + shipping + overhead + advertising;
  if (baseCost <= 0) throw new Error("Ingresá al menos un costo mayor que cero.");
  const retainedRate = 1 - (commissionPct + taxPct + marginPct) / 100;
  if (retainedRate <= 0) throw new Error("Comisión + impuestos + margen deben sumar menos de 100%.");
  const rawPrice = baseCost / retainedRate;
  const rounding = Math.max(1, nonNegative(input.rounding || 1, "el redondeo"));
  const price = Math.ceil(rawPrice / rounding) * rounding;
  const transactionCosts = price * (commissionPct + taxPct) / 100;
  const profit = price - baseCost - transactionCosts;
  return {
    price,
    rawPrice,
    baseCost,
    transactionCosts,
    profit,
    netMarginPct: price ? (profit / price) * 100 : 0,
    markupPct: baseCost ? (profit / baseCost) * 100 : 0,
    minimumRoas: advertising ? price / advertising : null
  };
}

export function calculateMargin(input) {
  const cost = nonNegative(input.cost, "el costo base");
  const extraCosts = nonNegative(input.extraCosts, "los costos adicionales");
  const price = nonNegative(input.price, "el precio de venta");
  const targetMarginPct = percentage(input.targetMarginPct ?? 30, "el margen objetivo");
  const totalCost = cost + extraCosts;
  if (totalCost <= 0 || price <= 0) throw new Error("Costo total y precio deben ser mayores que cero.");
  const profit = price - totalCost;
  return {
    totalCost,
    profit,
    marginPct: (profit / price) * 100,
    markupPct: (profit / totalCost) * 100,
    priceForTarget: totalCost / (1 - targetMarginPct / 100)
  };
}

export function calculateVat(input) {
  const amount = nonNegative(input.amount, "el importe");
  const rate = percentage(input.rate, "la alícuota", 100);
  if (amount <= 0) throw new Error("El importe debe ser mayor que cero.");
  if (input.mode === "extract") {
    const net = amount / (1 + rate / 100);
    return { net, tax: amount - net, total: amount, rate, mode: "extract" };
  }
  const tax = amount * rate / 100;
  return { net: amount, tax, total: amount + tax, rate, mode: "add" };
}

export function calculateAguinaldo(input) {
  const salary = nonNegative(input.salary, "la mejor remuneración mensual");
  const months = nonNegative(input.months, "los meses trabajados");
  if (salary <= 0) throw new Error("La remuneración debe ser mayor que cero.");
  if (months <= 0 || months > 6) throw new Error("Los meses trabajados deben estar entre 0 y 6.");
  return {
    amount: (salary / 12) * months,
    salary,
    months,
    isFullSemester: months === 6
  };
}

export function calculateBreakEven(input) {
  const fixedCosts = nonNegative(input.fixedCosts, "los costos fijos");
  const price = nonNegative(input.price, "el precio unitario");
  const variableCost = nonNegative(input.variableCost, "el costo variable unitario");
  const expectedUnits = nonNegative(input.expectedUnits || 0, "las unidades esperadas");
  const contribution = price - variableCost;
  if (fixedCosts <= 0 || price <= 0) throw new Error("Costos fijos y precio deben ser mayores que cero.");
  if (contribution <= 0) throw new Error("El precio debe ser mayor que el costo variable unitario.");
  const exactUnits = fixedCosts / contribution;
  const units = Math.ceil(exactUnits);
  return {
    contribution,
    contributionMarginPct: (contribution / price) * 100,
    exactUnits,
    units,
    revenue: units * price,
    expectedProfit: expectedUnits ? expectedUnits * contribution - fixedCosts : null,
    safetyUnits: expectedUnits ? expectedUnits - exactUnits : null
  };
}

export function calculateRoi(input) {
  const revenue = nonNegative(input.revenue, "los ingresos");
  const productCosts = nonNegative(input.productCosts, "el costo de productos o servicios");
  const adSpend = nonNegative(input.adSpend, "la inversión publicitaria");
  const otherCosts = nonNegative(input.otherCosts, "otros costos");
  const totalCosts = productCosts + adSpend + otherCosts;
  if (totalCosts <= 0) throw new Error("Ingresá al menos un costo mayor que cero.");
  const profit = revenue - totalCosts;
  return {
    revenue,
    totalCosts,
    profit,
    roiPct: (profit / totalCosts) * 100,
    roas: adSpend ? revenue / adSpend : null,
    breakEvenRevenue: totalCosts,
    breakEvenRoas: adSpend ? totalCosts / adSpend : null
  };
}

export function calculateDiscounts(input) {
  const originalPrice = nonNegative(input.originalPrice, "el precio original");
  const firstPct = percentage(input.firstPct, "el primer descuento", 100);
  const secondPct = percentage(input.secondPct || 0, "el segundo descuento", 100);
  if (originalPrice <= 0) throw new Error("El precio original debe ser mayor que cero.");
  const finalPrice = originalPrice * (1 - firstPct / 100) * (1 - secondPct / 100);
  const saved = originalPrice - finalPrice;
  return {
    originalPrice,
    finalPrice,
    saved,
    effectiveDiscountPct: (saved / originalPrice) * 100,
    recoveryIncreasePct: finalPrice ? (originalPrice / finalPrice - 1) * 100 : Infinity
  };
}

const PROMOTIONS = new Set(["none", "two-for-one", "three-for-two", "percent", "second-unit"]);

function promotionProfile(type, discountValue, optionLabel) {
  const promotion = PROMOTIONS.has(type) ? type : "none";
  const discountPct = percentage(discountValue || 0, `el descuento de la opción ${optionLabel}`, 100);
  if ((promotion === "percent" || promotion === "second-unit") && discountPct <= 0) {
    throw new Error(`Ingresá el porcentaje de descuento de la opción ${optionLabel}.`);
  }
  if (promotion === "two-for-one") return { received: 2, paidFactor: 1, effectiveDiscountPct: 50 };
  if (promotion === "three-for-two") return { received: 3, paidFactor: 2, effectiveDiscountPct: 100 / 3 };
  if (promotion === "percent") return { received: 1, paidFactor: 1 - discountPct / 100, effectiveDiscountPct: discountPct };
  if (promotion === "second-unit") return { received: 2, paidFactor: 2 - discountPct / 100, effectiveDiscountPct: discountPct / 2 };
  return { received: 1, paidFactor: 1, effectiveDiscountPct: 0 };
}

function smartBuyOption({ price, content, promotion, discountPct, referenceAmount, optionLabel }) {
  const profile = promotionProfile(promotion, discountPct, optionLabel);
  const bundleListPrice = price * profile.received;
  const bundlePrice = price * profile.paidFactor;
  const totalContent = content * profile.received;
  return {
    price,
    content,
    received: profile.received,
    bundlePrice,
    totalContent,
    averagePackPrice: bundlePrice / profile.received,
    referencePrice: (bundlePrice / totalContent) * referenceAmount,
    saved: bundleListPrice - bundlePrice,
    effectiveDiscountPct: profile.effectiveDiscountPct
  };
}

export function calculateSmartBuy(input) {
  const priceA = nonNegative(input.priceA, "el precio de la opción A");
  const contentA = nonNegative(input.contentA, "el contenido de la opción A");
  const priceB = nonNegative(input.priceB, "el precio de la opción B");
  const contentB = nonNegative(input.contentB, "el contenido de la opción B");
  if (priceA <= 0 || contentA <= 0 || priceB <= 0 || contentB <= 0) {
    throw new Error("Precios y contenidos de ambas opciones deben ser mayores que cero.");
  }

  const unitKind = ["g", "ml", "kg", "l", "unit"].includes(input.unitKind) ? input.unitKind : "unit";
  const referenceAmount = unitKind === "g" || unitKind === "ml" ? 100 : 1;
  const referenceLabel = unitKind === "g"
    ? "cada 100 g"
    : unitKind === "ml"
      ? "cada 100 ml"
      : unitKind === "kg"
        ? "por kg"
        : unitKind === "l"
          ? "por litro"
          : "por unidad";

  const optionA = smartBuyOption({ price: priceA, content: contentA, promotion: input.promoA, discountPct: input.discountA, referenceAmount, optionLabel: "A" });
  const optionB = smartBuyOption({ price: priceB, content: contentB, promotion: input.promoB, discountPct: input.discountB, referenceAmount, optionLabel: "B" });
  const difference = Math.abs(optionA.referencePrice - optionB.referencePrice);
  const comparisonBase = Math.max(optionA.referencePrice, optionB.referencePrice);
  const savingsPct = comparisonBase ? (difference / comparisonBase) * 100 : 0;
  const epsilon = 0.005;
  const winner = difference < epsilon ? "tie" : optionA.referencePrice < optionB.referencePrice ? "A" : "B";

  return {
    optionA,
    optionB,
    winner,
    difference,
    savingsPct,
    referenceAmount,
    referenceLabel,
    unitKind
  };
}

export function calculateCompoundInterest(input) {
  const initial = nonNegative(input.initial, "el capital inicial");
  const monthly = nonNegative(input.monthly, "el aporte mensual");
  const annualRatePct = percentage(input.annualRatePct, "la tasa efectiva anual", 1000);
  const years = nonNegative(input.years, "los años");
  const inflationPct = percentage(input.inflationPct || 0, "la inflación estimada", 1000);
  if (years <= 0 || years > 100) throw new Error("El plazo debe estar entre 0 y 100 años.");
  if (initial + monthly <= 0) throw new Error("Ingresá capital inicial o un aporte mensual.");
  const periods = Math.round(years * 12);
  const monthlyRate = Math.pow(1 + annualRatePct / 100, 1 / 12) - 1;
  const initialFuture = initial * Math.pow(1 + monthlyRate, periods);
  const contributionsFuture = monthlyRate === 0
    ? monthly * periods
    : monthly * ((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate);
  const finalAmount = initialFuture + contributionsFuture;
  const contributed = initial + monthly * periods;
  const realValue = finalAmount / Math.pow(1 + inflationPct / 100, years);
  return {
    finalAmount,
    contributed,
    interest: finalAmount - contributed,
    realValue,
    periods,
    monthlyRatePct: monthlyRate * 100
  };
}

export function calculate3dPrint(input) {
  const grams = nonNegative(input.grams, "los gramos de filamento");
  const spoolPrice = nonNegative(input.spoolPrice, "el precio por kilo");
  const hours = nonNegative(input.hours, "las horas de impresión");
  const printerWatts = nonNegative(input.printerWatts, "la potencia de la impresora");
  const kwhPrice = nonNegative(input.kwhPrice, "el precio del kWh");
  const machinePrice = nonNegative(input.machinePrice, "el valor de la impresora");
  const lifeHours = nonNegative(input.lifeHours, "la vida útil estimada");
  const laborMinutes = nonNegative(input.laborMinutes, "los minutos de trabajo");
  const laborHourly = nonNegative(input.laborHourly, "el valor de tu hora");
  const otherCosts = nonNegative(input.otherCosts, "otros costos");
  const failurePct = percentage(input.failurePct || 0, "la tasa de fallas");
  const marginPct = percentage(input.marginPct ?? 35, "el margen objetivo");
  if (grams <= 0 || spoolPrice <= 0) throw new Error("Gramos y precio del filamento deben ser mayores que cero.");
  if (machinePrice > 0 && lifeHours <= 0) throw new Error("Ingresá una vida útil mayor que cero para amortizar la impresora.");
  const material = (grams / 1000) * spoolPrice;
  const electricity = hours * (printerWatts / 1000) * kwhPrice;
  const depreciation = machinePrice ? (machinePrice / lifeHours) * hours : 0;
  const labor = (laborMinutes / 60) * laborHourly;
  const subtotal = material + electricity + depreciation + labor + otherCosts;
  const costWithFailures = subtotal / (1 - failurePct / 100);
  const suggestedPrice = costWithFailures / (1 - marginPct / 100);
  return {
    material,
    electricity,
    depreciation,
    labor,
    otherCosts,
    subtotal,
    costWithFailures,
    suggestedPrice,
    profit: suggestedPrice - costWithFailures
  };
}

export function calculateMonotributo(input) {
  const activity = input.activity === "goods" ? "goods" : "services";
  const income = nonNegative(input.income, "la facturación de los últimos 12 meses");
  const area = nonNegative(input.area || 0, "la superficie afectada");
  const energy = nonNegative(input.energy || 0, "la energía anual");
  const rent = nonNegative(input.rent || 0, "los alquileres anuales");
  const maxUnitPrice = nonNegative(input.maxUnitPrice || 0, "el precio unitario máximo");
  if (income <= 0) throw new Error("La facturación anual debe ser mayor que cero.");
  const match = MONOTRIBUTO_CATEGORIES.find(row =>
    income <= row.income &&
    (!area || area <= row.area) &&
    (!energy || energy <= row.energy) &&
    (!rent || rent <= row.rent) &&
    (activity !== "goods" || !maxUnitPrice || maxUnitPrice <= row.maxUnitPrice)
  );
  if (!match) {
    return {
      eligible: false,
      activity,
      income,
      maximumIncome: MONOTRIBUTO_CATEGORIES.at(-1).income
    };
  }
  return {
    eligible: true,
    activity,
    income,
    category: match.category,
    annualCap: match.income,
    monthlyAverageCap: match.income / 12,
    headroom: match.income - income,
    monthlyTotal: activity === "goods" ? match.goodsTotal : match.serviceTotal,
    thresholds: match
  };
}
