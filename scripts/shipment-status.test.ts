// node --test scripts/*.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { nextOrderStatus } from "../src/lib/shipment-status.ts";

test("postado com rastreio = enviado; sem rastreio fica como está", () => {
  assert.equal(nextOrderStatus("processing", { status: "posted", tracking: "AB123BR" }), "shipped");
  assert.equal(nextOrderStatus("paid", { status: "posted", tracking: null }), "paid");
});

test("entregue fecha o pedido, inclusive direto da preparação", () => {
  assert.equal(nextOrderStatus("shipped", { status: "delivered", tracking: "X" }), "delivered");
  assert.equal(nextOrderStatus("processing", { status: "delivered", tracking: "X" }), "delivered");
});

test("nunca volta atrás nem mexe em cancelado ou aguardando pagamento", () => {
  assert.equal(nextOrderStatus("delivered", { status: "posted", tracking: "X" }), "delivered");
  assert.equal(nextOrderStatus("cancelled", { status: "delivered", tracking: "X" }), "cancelled");
  assert.equal(nextOrderStatus("pending_payment", { status: "posted", tracking: "X" }), "pending_payment");
  assert.equal(nextOrderStatus("shipped", { status: "released", tracking: "X" }), "shipped");
});
