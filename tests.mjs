import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSalePrice,
  calculateMargin,
  calculateVat,
  calculateAguinaldo,
  calculateBreakEven,
  calculateRoi,
  calculateDiscounts,
  calculateCompoundInterest,
  calculate3dPrint,
  calculateMonotributo,
  MONOTRIBUTO_CATEGORIES
} from "./src/calculators.mjs";

const closeTo = (actual, expected, epsilon = 0.01) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} no está dentro de ${epsilon} de ${expected}`);

test("precio de venta despeja tasas sobre el precio", () => {
  const result = calculateSalePrice({ productCost: 10000, packaging: 500, shipping: 0, overhead: 500, advertising: 1000, commissionPct: 7, taxPct: 3, marginPct: 30, rounding: 100 });
  assert.equal(result.price, 20000);
  closeTo(result.profit, 6000);
  closeTo(result.netMarginPct, 30);
});

test("precio de venta rechaza porcentajes incompatibles", () => {
  assert.throws(() => calculateSalePrice({ productCost: 100, commissionPct: 40, taxPct: 20, marginPct: 40 }), /menos de 100/);
});

test("margen y markup usan bases diferentes", () => {
  const result = calculateMargin({ cost: 10000, extraCosts: 0, price: 20000, targetMarginPct: 30 });
  closeTo(result.marginPct, 50);
  closeTo(result.markupPct, 100);
  closeTo(result.priceForTarget, 14285.714285, 0.001);
});

test("IVA extrae correctamente 21% incluido", () => {
  const result = calculateVat({ amount: 12100, rate: 21, mode: "extract" });
  closeTo(result.net, 10000);
  closeTo(result.tax, 2100);
});

test("aguinaldo completo es la mitad de la mejor remuneración", () => {
  const result = calculateAguinaldo({ salary: 1000000, months: 6 });
  assert.equal(result.amount, 500000);
  assert.equal(result.isFullSemester, true);
});

test("punto de equilibrio redondea unidades hacia arriba", () => {
  const result = calculateBreakEven({ fixedCosts: 300000, price: 20000, variableCost: 11000, expectedUnits: 50 });
  assert.equal(result.units, 34);
  closeTo(result.exactUnits, 33.333333, 0.001);
  assert.equal(result.expectedProfit, 150000);
});

test("ROI y ROAS no confunden facturación con ganancia", () => {
  const result = calculateRoi({ revenue: 500000, productCosts: 220000, adSpend: 100000, otherCosts: 30000 });
  assert.equal(result.profit, 150000);
  closeTo(result.roiPct, 42.857142, 0.001);
  assert.equal(result.roas, 5);
});

test("descuentos sucesivos 20% y 10% equivalen a 28%", () => {
  const result = calculateDiscounts({ originalPrice: 50000, firstPct: 20, secondPct: 10 });
  assert.equal(result.finalPrice, 36000);
  closeTo(result.effectiveDiscountPct, 28);
});

test("interés compuesto con tasa cero conserva aportes", () => {
  const result = calculateCompoundInterest({ initial: 100000, monthly: 10000, annualRatePct: 0, years: 1, inflationPct: 0 });
  assert.equal(result.finalAmount, 220000);
  assert.equal(result.interest, 0);
});

test("impresión 3D incluye material, energía, desgaste y fallas", () => {
  const result = calculate3dPrint({ grams: 100, spoolPrice: 20000, hours: 10, printerWatts: 100, kwhPrice: 100, machinePrice: 500000, lifeHours: 5000, laborMinutes: 60, laborHourly: 5000, otherCosts: 0, failurePct: 10, marginPct: 20 });
  assert.equal(result.material, 2000);
  assert.equal(result.electricity, 100);
  assert.equal(result.depreciation, 1000);
  assert.equal(result.labor, 5000);
  closeTo(result.costWithFailures, 9000);
  closeTo(result.suggestedPrice, 11250);
});

test("Monotributo usa valores ARCA desde agosto de 2026", () => {
  assert.equal(MONOTRIBUTO_CATEGORIES.length, 11);
  const result = calculateMonotributo({ activity: "services", income: 15000000, area: 0, energy: 0, rent: 0 });
  assert.equal(result.category, "B");
  assert.equal(result.monthlyTotal, 56379.08);
  assert.equal(result.annualCap, 17595182.74);
});

test("Monotributo eleva categoría cuando otro parámetro lo exige", () => {
  const result = calculateMonotributo({ activity: "services", income: 10000000, area: 80, energy: 0, rent: 0 });
  assert.equal(result.category, "D");
});

test("Monotributo detecta parámetros fuera del régimen", () => {
  const result = calculateMonotributo({ activity: "goods", income: 130000000, area: 0, energy: 0, rent: 0, maxUnitPrice: 0 });
  assert.equal(result.eligible, false);
});
