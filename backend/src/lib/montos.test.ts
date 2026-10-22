import assert from "node:assert/strict";
import { test } from "node:test";
import { esquemaImporte } from "./montos";

function importe(valor: unknown) {
  return esquemaImporte.parse(valor).toFixed(2);
}

test("esquemaImporte: formatos argentinos", () => {
  assert.equal(importe("25.000"), "25000.00");
  assert.equal(importe("1.500.000"), "1500000.00");
  assert.equal(importe("25.000,50"), "25000.50");
  assert.equal(importe("25000,5"), "25000.50");
  assert.equal(importe("$ 25.000"), "25000.00");
});

test("esquemaImporte: punto decimal y números", () => {
  assert.equal(importe("25000.50"), "25000.50");
  assert.equal(importe("1.5"), "1.50"); // no son grupos de 3: es decimal
  assert.equal(importe(18000), "18000.00");
});

test("esquemaImporte: rechaza vacíos, negativos, cero y texto", () => {
  for (const valor of ["", "0", "-100", "abc", 0, null]) {
    assert.equal(esquemaImporte.safeParse(valor).success, false, `debería rechazar ${JSON.stringify(valor)}`);
  }
});
