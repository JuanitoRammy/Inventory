/**
 * ui.js — Funciones de renderizado y manipulación del DOM
 */

"use strict";

/* ── Formateadores ───────────────────────────────────────── */

/**
 * Formatea una cantidad con su unidad.
 * - kg  → muestra toneladas si ≥ 1000
 * - und → entero sin decimales
 * @param {number} v
 * @param {'kg'|'und'} unit
 * @returns {string}
 */
function fmtQty(v, unit) {
  const u = unit || "kg";
  if (v === 0) return `0 ${u}`;
  if (u === "und") return Math.round(v) + " und";
  return v >= 1000 ? (v / 1000).toFixed(2) + " t" : v.toFixed(1) + " kg";
}

/**
 * Formatea valor en pesos colombianos.
 * @param {number} v
 * @returns {string}
 */
function fmtCOP(v) {
  if (isNaN(v) || v === null || v === undefined) return "$0";
  return "$" + Math.round(v).toLocaleString("es-CO");
}

/**
 * Fecha local en formato "DD/MM/AAAA".
 * @returns {string}
 */
function todayStr() {
  return new Date().toLocaleDateString("es-CO");
}

/* ── Header ──────────────────────────────────────────────── */

function renderDateBadge() {
  const el = document.getElementById("dateBadge");
  if (el) {
    el.textContent = new Date().toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

/* ── Stats ───────────────────────────────────────────────── */

/**
 * Renderiza el bloque de resumen.
 * Mantiene únicamente los contadores de materiales activos y movimientos diarios.
 * @param {Record<string,number>} inventory
 * @param {Record<string,number>} prices
 * @param {import('./storage').Movement[]} movements
 */
function renderStats(inventory, prices, movements) {
  const el = document.getElementById("statsGrid");
  if (!el) return;

  // Calculamos los dos indicadores solicitados
  const active = MATERIALS.filter((m) => (inventory[m.id] || 0) > 0).length;
  const todayMovs = movements.filter((m) => m.date === todayStr()).length;

  // Renderizamos solo las 2 tarjetas deseadas
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Materiales</div>
      <div class="stat-val">${active}</div>
      <div class="stat-sub">con stock</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Movimientos hoy</div>
      <div class="stat-val">${todayMovs}</div>
      <div class="stat-sub">registrados</div>
    </div>`;
}

/* ── Tabla de inventario ─────────────────────────────────── */

/**
 * Renderiza la tabla de stock filtrando por texto.
 * @param {Record<string,number>} inventory
 * @param {Record<string,number>} prices
 * @param {string} query
 */
function renderInventoryTable(inventory, prices, query = "") {
  const el = document.getElementById("inventoryTable");
  if (!el) return;

  const q = query.toLowerCase();
  const rows = MATERIALS.filter((m) => !q || m.name.toLowerCase().includes(q));

  el.innerHTML = rows.map((m) => {
    const qty   = inventory[m.id] || 0;
    const price = prices[m.id]    || 0;
    const unit  = m.unit          || "kg";
    const val   = qty * price;
    const st    = qty === 0 ? "sin stock" : qty < 100 ? "bajo" : "ok";
    const bc    = { ok: "badge-green", bajo: "badge-amber", "sin stock": "badge-red" }[st];
    const catLabel = CATEGORIES[m.cat] || m.cat;

    return `<tr>
      <td>
        <span class="mat-dot" style="background:${m.color};display:inline-block;"></span>
        ${m.name}
      </td>
      <td><span class="badge badge-blue">${catLabel}</span></td>
      <td>${fmtQty(qty, unit)}</td>
      <td>${fmtCOP(price)}/${unit}</td>
      <td>${qty > 0 ? fmtCOP(val) : "—"}</td>
      <td><span class="badge ${bc}">${st}</span></td>
    </tr>`;
  }).join("");
}

/* ── Select helpers ──────────────────────────────────────── */

/**
 * Llena un <select> con todos los materiales.
 * @param {string} selectId
 */
function populateSelect(selectId) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = MATERIALS.map(
    (m) => `<option value="${m.id}">${m.name} (${m.unit || "kg"})</option>`,
  ).join("");
}

/**
 * Llena el select de filtro en Movimientos (con opción "Todos").
 */
function populateFilterSelect() {
  const el = document.getElementById("fMat");
  if (!el) return;
  el.innerHTML =
    '<option value="">Todos</option>' +
    MATERIALS.map((m) => `<option value="${m.id}">${m.name}</option>`).join("");
}

/* ── Movimientos ─────────────────────────────────────────── */

/**
 * Renderiza el historial filtrado.
 * @param {import('./storage').Movement[]} movements
 * @param {string} matFilter
 * @param {string} typeFilter
 */
function renderMovements(movements, matFilter, typeFilter) {
  const filtered = movements.filter(
    (m) =>
      (!matFilter || m.mat === matFilter) &&
      (!typeFilter || m.type === typeFilter),
  );

  const el = document.getElementById("movList");
  if (!filtered.length) {
    el.innerHTML =
      '<p style="font-size:12px;color:var(--text-muted);padding:1rem 0;">Sin movimientos registrados.</p>';
    return;
  }

  el.innerHTML = filtered.map((m) => {
    const mat  = getMaterial(m.mat);
    const unit = mat?.unit || "kg";
    return `<div class="mov-item">
      <div class="mov-icon ${m.type === "entrada" ? "mov-in" : "mov-out"}">
        ${m.type === "entrada" ? "+" : "−"}
      </div>
      <div class="mov-info">
        <strong>${mat?.name || m.mat} — ${m.type}</strong>
        <span>${m.date} ${m.time}${m.note ? " · " + m.note : ""}</span>
      </div>
      <div class="mov-weight">
        ${fmtQty(m.kg, unit)}
        <small>${fmtCOP(m.total)}</small>
      </div>
    </div>`;
  }).join("");
}

/* ── Precios ─────────────────────────────────────────────── */

/**
 * Renderiza la cuadrícula de chips de precios agrupados por categoría.
 * @param {Record<string,number>} prices
 * @param {Record<string,number>} prevPrices
 */
function renderPriceChips(prices, prevPrices) {
  const el = document.getElementById("priceChips");
  if (!el) return;

  const bycat = getMaterialsByCategory();
  let html = "";

  Object.entries(bycat).forEach(([cat, mats]) => {
    html += `<div class="cat-label">${CATEGORIES[cat] || cat}</div><div class="price-grid">`;
    html += mats.map((m) => {
      const curr = prices[m.id]     || 0;
      const prev = prevPrices[m.id] || curr;
      const unit = m.unit           || "kg";
      const diff = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      const arrow = diff > 0.3 ? "▲" : diff < -0.3 ? "▼" : "—";
      const cls   = diff > 0.3 ? "up" : diff < -0.3 ? "down" : "";

      return `<div class="price-chip">
        <div class="price-chip-name">
          <div class="pcdot" style="background:${m.color};"></div>
          ${m.name}
        </div>
        <div class="price-chip-right">
          <div class="price-chip-val">${fmtCOP(curr)}/${unit}</div>
          <div class="price-chip-change ${cls}">${arrow} ${Math.abs(diff).toFixed(1)}%</div>
        </div>
      </div>`;
    }).join("");
    html += "</div>";
  });

  el.innerHTML = html;
}

/* ── Factura ─────────────────────────────────────────────── */

/**
 * Renderiza las líneas de ítems en el formulario de factura.
 * @param {{ mat:string, kg:number, price:number }[]} items
 * @param {Record<string,number>} prices
 */
function renderInvoiceItems(items, prices) {
  const el = document.getElementById("invItems");
  if (!el) return;

  el.innerHTML = items.map((it, i) => {
    const mat  = getMaterial(it.mat);
    const unit = mat?.unit || "kg";

    return `
    <div class="form-row" style="align-items:flex-end;margin-bottom:8px;">
      <div class="form-group">
        <label>Material</label>
        <select data-inv-mat="${i}">
          ${MATERIALS.map(
            (m) => `<option value="${m.id}"${m.id === it.mat ? " selected" : ""}>${m.name}</option>`,
          ).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>Cant. (${unit})</label>
        <input type="number" data-inv-kg="${i}" value="${it.kg || ""}"
               placeholder="0" min="0" step="${unit === "und" ? "1" : "0.1"}" />
      </div>
      <div class="form-group">
        <label>Precio/${unit}</label>
        <input type="number" data-inv-price="${i}" value="${it.price || prices[it.mat] || ""}"
               placeholder="auto" min="0" step="50" />
      </div>
      <div class="form-group" style="flex:0;">
        <label>&nbsp;</label>
        <button class="btn btn-sm btn-danger" data-inv-remove="${i}">✕</button>
      </div>
    </div>`;
  }).join("");
}

/**
 * Genera el HTML de la factura optimizado estrictamente para tiqueteras de 58mm (384dots/line).
 * OPTIMIZACIÓN: Remoción de selectores intrusivos para compatibilidad móvil total y color sólido #000.
 * @param {{ client:string, type:string, items:object[], prices:Record<string,number> }} opts
 * @returns {string}
 */
/**
 * Genera el HTML de la factura optimizado estrictamente para tiqueteras de 58mm (384dots/line).
 * AJUSTE: Centrado físico mediante padding interno controlado para evitar errores en móviles.
 * @param {{ client:string, type:string, items:object[], prices:Record<string,number> }} opts
 * @returns {string}
 */
function buildInvoiceHTML({ client, type, items, prices }) {
  const now = new Date();
  const num = Date.now().toString().slice(-6);

  const rows = items
    .filter((it) => it.kg > 0)
    .map((it) => {
      const p    = it.price || prices[it.mat] || 0;
      const mat  = getMaterial(it.mat);
      const unit = mat?.unit || "kg";
      return {
        ...it,
        unitPrice: p,
        total:     it.kg * p,
        matName:   mat?.name || it.mat,
        unit,
      };
    });

  if (!rows.length) return "";

  const grand = rows.reduce((a, r) => a + r.total, 0);
  
  const lines = rows.map((r) => `
    <div style="font-weight: bold; font-size: 12px; margin-top: 4px; text-transform: uppercase; color: #000 !important;">
      ${r.matName}
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; font-family: monospace; font-weight: bold; padding-left: 2px; color: #000 !important;">
      <span>${r.kg.toFixed(1)}${r.unit} x ${Math.round(r.unitPrice)}</span>
      <span>${fmtCOP(r.total)}</span>
    </div>`).join("");

  return `
    <style>
      /* Configuración nativa del rollo de 58mm */
      @page {
        size: 58mm auto;
        margin: 0 !important;
      }
      
      /* Contenedor principal del tiquete */
      .ticket-body {
        width: 48mm !important;
        max-width: 48mm !important;
        box-sizing: border-box;
        
        /* ── EL TRUCO DEL CENTRADO AQUÍ ── */
        /* Si notas que aún le falta ir a la derecha, sube el 3mm a 4mm o 5mm */
        padding: 0 1mm 0 3mm !important; 
        margin: 0 !important;
        
        font-family: 'Courier New', Courier, monospace;
        color: #000 !important;
        line-height: 1.2;
        background: #fff;
      }
      .t-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        font-size: 11px;
        font-weight: bold;
        margin-bottom: 3px;
        color: #000 !important;
      }
      .t-sep {
        border-bottom: 1px dashed #000 !important;
        margin: 5px 0;
        width: 100%;
      }
    </style>

    <div class="ticket-body">
      <h3 style="text-align: center; font-size: 13px; font-weight: bold; margin: 0 0 1px 0; text-transform: uppercase; color: #000 !important;">
        CHATARRERÍA PIPA
      </h3>
      <div style="text-align: center; font-size: 11px; font-weight: bold; margin-bottom: 5px; color: #000 !important;">
        TIQUETE DE ${type === "COMPRA" ? "COMPRA" : "VENTA"}
      </div>
      
      <div class="t-sep"></div>
      
      <div class="t-row">
        <span>No. ${num}</span>
        <span>${now.toLocaleDateString("es-CO")}</span>
      </div>
      <div class="t-row">
        <span>${type === "COMPRA" ? "Prov" : "Client"}:</span>
        <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: bold;">
          ${client || "Sin nombre"}
        </span>
      </div>
      
      <div class="t-sep"></div>
      
      ${lines}
      
      <div class="t-sep"></div>
      
      <div class="t-row" style="font-weight: bold; font-size: 13px; margin-top: 4px; color: #000 !important;">
        <span>TOTAL</span>
        <span>${fmtCOP(grand)}</span>
      </div>
      
      <div class="t-sep"></div>
      
      <div style="text-align: center; font-size: 10px; font-weight: bold; margin-top: 5px; text-transform: uppercase; color: #000 !important; line-height: 1.3;">
        Soledad<br>Gracias por su negocio
      </div>
    </div>`;
}

/* ── Alert ───────────────────────────────────────────────── */

let _alertTimer = null;

/**
 * Muestra un mensaje de alerta temporario.
 * @param {string} msg
 * @param {"success"|"error"} type
 */
function showAlert(msg, type) {
  const el = document.getElementById("alertMsg");
  if (!el) return;
  el.textContent = msg;
  el.className = "alert alert-" + type;
  el.style.display = "block";
  if (_alertTimer) clearTimeout(_alertTimer);
  _alertTimer = setTimeout(() => (el.style.display = "none"), 3500);
}