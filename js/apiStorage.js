/**
 * apiStorage.js — Capa de persistencia vía API PHP
 *
 * Usa query params (?route=...&key=...) para evitar rewrite rules.
 * La clave API_KEY evita acceso directo a los endpoints.
 */

"use strict";

const API_BASE = (function () {
  const scripts = document.getElementsByTagName("script");
  const src = scripts[scripts.length - 1].src;
  const base = src.substring(0, src.lastIndexOf("/js/"));
  return base + "/api/index.php";
})();

const API_KEY = "pipa2024metalstock";

async function apiFetch(endpoint, options = {}) {
  const url = API_BASE + "?route=" + endpoint + "&key=" + API_KEY;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error de red" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function loadPrices() {
  const data = await apiFetch("state");
  return data.prices || {};
}

async function savePrices(prices) {
  for (const [mat, price] of Object.entries(prices)) {
    await apiFetch("prices", {
      method: "POST",
      body: JSON.stringify({ mat, price }),
    });
  }
}

async function loadInventory() {
  const data = await apiFetch("state");
  return data.inventory || {};
}

async function saveInventory(inventory) {
  // El inventario se actualiza automáticamente al registrar movimientos
}

async function loadMovements() {
  const data = await apiFetch("state");
  return data.movements || [];
}

async function saveMovements(movements) {
  // No se necesita: los movimientos se guardan uno a uno al registrarse
}

async function addMovement(movement, movements) {
  await apiFetch("movements", {
    method: "POST",
    body: JSON.stringify([movement]),
  });
  movements.unshift(movement);
}

async function loadPrevPrices() {
  const data = await apiFetch("state");
  return data.prevPrices || {};
}

async function savePrevPrices(prev) {
  for (const [mat, price] of Object.entries(prev)) {
    await apiFetch("prices", {
      method: "POST",
      body: JSON.stringify({ mat, price }),
    });
  }
}

async function exportData(prices, inventory, movements) {
  const payload = JSON.stringify({ prices, inventory, movements }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `metalstock-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importData(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed.prices || !parsed.inventory || !parsed.movements) {
      console.error("Backup inválido: faltan campos requeridos.");
      return null;
    }
    await apiFetch("import", {
      method: "POST",
      body: JSON.stringify(parsed),
    });
    return parsed;
  } catch (e) {
    console.error("Import failed:", e);
    return null;
  }
}
