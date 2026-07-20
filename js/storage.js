/**
 * storage.js — Capa de persistencia (localStorage)
 *
 * Centraliza todas las lecturas y escrituras del estado de la
 * aplicación. Al migrar a una base de datos real, solo este archivo
 * debe modificarse: el resto del código llama a estas funciones
 * sin conocer el mecanismo de almacenamiento.
 *
 * Claves en localStorage:
 *   ms_prices    → {[materialId]: number}   precios vigentes
 *   ms_inventory → {[materialId]: number}   kg en bodega
 *   ms_movements → Movement[]               historial
 */

"use strict";

const KEYS = {
  prices: "ms_prices",
  inventory: "ms_inventory",
  movements: "ms_movements",
};

/* ── Helpers ─────────────────────────────────────────────── */

function _read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function _write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Storage write error:", e);
    return false;
  }
}

/* ── Precios ─────────────────────────────────────────────── */

/**
 * Carga los precios guardados. Si no existen, usa los precios
 * por defecto definidos en MATERIALS (data.js).
 * @returns {Record<string,number>}
 */
function loadPrices() {
  const saved = _read(KEYS.prices);
  if (saved) return saved;
  // Primer arranque: construir desde catálogo
  const defaults = Object.fromEntries(MATERIALS.map((m) => [m.id, m.price]));
  _write(KEYS.prices, defaults);
  return defaults;
}

/**
 * Persiste el mapa de precios completo.
 * @param {Record<string,number>} prices
 */
function savePrices(prices) {
  _write(KEYS.prices, prices);
}

/* ── Inventario ──────────────────────────────────────────── */

/**
 * Carga el stock actual. Inicia en 0 kg por material si no hay datos.
 * @returns {Record<string,number>}
 */
function loadInventory() {
  const saved = _read(KEYS.inventory);
  if (saved) return saved;
  const defaults = Object.fromEntries(MATERIALS.map((m) => [m.id, 0]));
  _write(KEYS.inventory, defaults);
  return defaults;
}

/**
 * Persiste el inventario completo.
 * @param {Record<string,number>} inventory
 */
function saveInventory(inventory) {
  _write(KEYS.inventory, inventory);
}

/* ── Movimientos ─────────────────────────────────────────── */

/**
 * @typedef {Object} Movement
 * @property {number}  id     - Timestamp Unix (ms) usado como id único
 * @property {string}  type   - "entrada" | "salida"
 * @property {string}  mat    - id del material (ver MATERIALS)
 * @property {number}  kg     - Peso en kilogramos
 * @property {number}  price  - Precio unitario COP/kg aplicado
 * @property {number}  total  - kg × price
 * @property {string}  note   - Observación libre
 * @property {string}  date   - Fecha local "DD/MM/AAAA"
 * @property {string}  time   - Hora local "HH:MM"
 */

/**
 * Carga el historial completo de movimientos.
 * @returns {Movement[]}
 */
function loadMovements() {
  return _read(KEYS.movements) || [];
}

/**
 * Persiste el historial completo.
 * @param {Movement[]} movements
 */
function saveMovements(movements) {
  _write(KEYS.movements, movements);
}

/**
 * Inserta un movimiento al inicio del historial.
 * @param {Movement} movement
 * @param {Movement[]} movements - Array actual (se modifica in-place)
 */
function addMovement(movement, movements) {
  movements.unshift(movement);
  saveMovements(movements);
}

/* ── Utilidades de exportación ───────────────────────────── */

/**
 * Exporta todo el estado como JSON descargable.
 * Útil para respaldo manual o migración.
 */
function exportData(prices, inventory, movements) {
  const payload = JSON.stringify({ prices, inventory, movements }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `metalstock-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Importa un backup JSON y sobreescribe el estado local.
 * @param {string} jsonText
 * @returns {{ prices, inventory, movements } | null}
 */
function importData(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed.prices || !parsed.inventory || !parsed.movements) {
      console.error("Backup inválido: faltan campos requeridos.");
      return null;
    }
    savePrices(parsed.prices);
    saveInventory(parsed.inventory);
    saveMovements(parsed.movements);
    return parsed;
  } catch (e) {
    console.error("Import failed:", e);
    return null;
  }
}
function loadPrevPrices() {
  return _read("ms_prev_prices") || {};
}
function savePrevPrices(prev) {
  _write("ms_prev_prices", prev);
}

/* ── Materiales / Categorías (fallback local) ────────────── */

function loadMaterialsFromLocal() {
  return _read("ms_materials");
}
function saveMaterialsToLocal(materials) {
  _write("ms_materials", materials);
}
function loadCategoriesFromLocal() {
  return _read("ms_categories");
}
function saveCategoriesToLocal(categories) {
  _write("ms_categories", categories);
}

/* ── Alias para fallback desde app.js / data.js ─────────── */
window._lsLoadPrices       = loadPrices;
window._lsLoadInventory    = loadInventory;
window._lsLoadMovements    = loadMovements;
window._lsLoadPrevPrices   = loadPrevPrices;
window._lsLoadMaterials    = loadMaterialsFromLocal;
window._lsSaveMaterials    = saveMaterialsToLocal;
window._lsLoadCategories   = loadCategoriesFromLocal;
window._lsSaveCategories   = saveCategoriesToLocal;
