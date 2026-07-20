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

  const active = MATERIALS.filter((m) => (inventory[m.id] || 0) > 0).length;
  const todayMovs = movements.filter((m) => m.date === todayStr()).length;

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
  el.innerHTML = getActiveMaterials().map(
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
    getActiveMaterials().map((m) => `<option value="${m.id}">${m.name}</option>`).join("");
}

/* ── Movimientos ─────────────────────────────────────────── */

/**
 * Renderiza el historial filtrado con opción de reimpresión.
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
  if (!el) return;

  if (!filtered.length) {
    el.innerHTML =
      '<p style="font-size:12px;color:var(--text-muted);padding:1rem 0;">Sin movimientos registrados.</p>';
    return;
  }

  el.innerHTML = filtered.map((m) => {
    const mat  = getMaterial(m.mat);
    const unit = mat?.unit || "kg";
    
    // CORRECCIÓN CLAVE: El botón debe almacenar la propiedad invoiceId si existe o m.id si es individual
    const reprintTarget = m.invoiceId || m.id;
    const tiqueteLabel = m.invoiceNum ? ` · Tiquete: No. ${m.invoiceNum}` : '';

    return `<div class="mov-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 6px; border-radius: 4px; background: var(--bg-card, #fafafa);">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <div class="mov-icon ${m.type === "entrada" ? "mov-in" : "mov-out"}">
          ${m.type === "entrada" ? "+" : "−"}
        </div>
        <div class="mov-info">
          <strong>${mat?.name || m.mat} — ${m.type}</strong>
          <br>
          <span style="font-size: 11px; color: var(--text-muted);">${m.date} ${m.time}${tiqueteLabel}${m.note ? " · " + m.note : ""}</span>
        </div>
      </div>
      <div class="mov-weight" style="text-align: right; margin-right: 10px;">
        <strong>${fmtQty(m.kg, unit)}</strong>
        <br>
        <small style="color: var(--text-muted);">${fmtCOP(m.total)}</small>
      </div>
      <div>
        <button class="btn btn-sm" data-reprint="${reprintTarget}" title="Reimprimir tiquete completo" style="padding: 4px 8px; background: #e0e0e0; border: none; cursor: pointer; border-radius: 4px;">
          🖨️
        </button>
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

/**
 * Configura el escuchador global para los botones de reimpresión en el historial.
 */
/**
 * Configura el escuchador global para los botones de reimpresión en el historial.
 * OPTIMIZADO: Adaptado con la misma compatibilidad móvil y de tiquetera 58mm de la Factura.
 */
function setupHistoryReprint() {
  const el = document.getElementById("movList");
  if (!el) return;

  // Clonamos el elemento para remover listeners previos y evitar ejecuciones duplicadas
  const oldEl = el;
  const newEl = oldEl.cloneNode(true);
  oldEl.parentNode.replaceChild(newEl, oldEl);

  newEl.addEventListener("click", (e) => {
    const button = e.target.closest("[data-reprint]");
    if (!button) return;

    const targetId = parseFloat(button.getAttribute("data-reprint"));
    
    if (typeof state === "undefined" || !state.movements) {
      showAlert("No se pudo acceder al historial.", "danger");
      return;
    }

    // Buscamos todos los movimientos vinculados al identificador numérico
    const associatedMovs = state.movements.filter(m => m.invoiceId === targetId || m.id === targetId);

    if (!associatedMovs.length) {
      showAlert("No se encontraron registros para este tiquete.", "danger");
      return;
    }

    const baseMov = associatedMovs[0];
    
    let clientName = "Cliente General";
    if (baseMov.note && baseMov.note.includes("): ")) {
      clientName = baseMov.note.split("): ")[1];
    } else if (baseMov.note && baseMov.note.includes(": ")) {
      clientName = baseMov.note.split(": ")[1];
    }

    const reconstructedItems = associatedMovs.map(m => ({
      mat: m.mat,
      kg: m.kg,
      price: m.price
    }));

    const invoiceData = {
      client: clientName,
      type: baseMov.type === "entrada" ? "COMPRA" : "VENTA",
      prices: state.prices,
      items: reconstructedItems
    };

    const htmlTicket = buildInvoiceHTML(invoiceData);

    if (!htmlTicket) {
      showAlert("Error al reconstruir el tiquete.", "amber");
      return;
    }

    let finalHtml = htmlTicket;
    if (baseMov.invoiceNum) {
      finalHtml = htmlTicket.replace(/No\.\s\d+/, `No. ${baseMov.invoiceNum}`);
    }

    // SOLUCIÓN AL ERROR DE COMPATIBILIDAD MÓVIL:
    // Se usa la misma configuración de apertura (width=900) que sí acepta el spooler de Android/iOS
    const win = window.open("", "_blank", "width=900,height=600");
    if (!win) {
      alert("Por favor permite las ventanas emergentes para poder imprimir el tiquete.");
      return;
    }
    
    // Inyección de estructura HTML idéntica al flujo exitoso de Factura
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Copia Tiquete — No. ${baseMov.invoiceNum || "REIMP"}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          @page {
            size: 58mm auto;
            margin: 0 !important;
          }
          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff;
            }
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: #fff;">
     
        ${finalHtml}
        <div style="height: 10mm;"></div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { win.close(); }, 500);
          };
        <\/script>
      </body>
      </html>
    `);
    
    win.document.close();
  });
}

/* ── Factura con buscador rápido integrado a state.invItems ─────────────────────────── */

/**
 * Renderiza las líneas de ítems agregados y mantiene el buscador superior sin perder foco.
 * @param {{ mat:string, kg:number, price:number }[]} items
 * @param {Record<string,number>} prices
 */
function renderInvoiceItems(items, prices) {
  const el = document.getElementById("invItems");
  if (!el) return;

  if (!document.getElementById("invSearchInput")) {
    el.innerHTML = `
      <div class="invoice-search-container" style="position:relative; margin-bottom:15px; width:100%;">
        <label style="font-weight:bold; font-size:12px; display:block; margin-bottom:4px;">Escribe para buscar y añadir material:</label>
        <input type="text" id="invSearchInput" autocomplete="off" placeholder="Ej: Cobre, Chatarra, Batería..." style="width:100%; padding:8px; box-sizing:border-box;" />
        <div id="invSearchResults" style="position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #ccc; z-index:100; max-height:200px; overflow-y:auto; display:none; box-shadow:0 4px 6px rgba(0,0,0,0.1);"></div>
      </div>
      <div id="invRowsContainer"></div>
    `;
    setupInvoiceSearch(prices);
  }

  const rowsContainer = document.getElementById("invRowsContainer");
  if (!rowsContainer) return;

  if (!items || !items.length) {
    rowsContainer.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:0.5rem 0;text-align:center;">Busca un material arriba para comenzar.</p>';
    return;
  }

  rowsContainer.innerHTML = items.map((it, i) => {
    const mat  = getMaterial(it.mat);
    const unit = mat?.unit || "kg";

    return `
    <div class="form-row" style="align-items:flex-end; margin-bottom:8px; background:var(--bg-card, #fafafa); padding:6px; border-radius:4px;">
      <div class="form-group" style="flex:2;">
        <label style="font-size:11px; color:var(--text-muted);">Material</label>
        <div style="font-weight:bold; font-size:13px; padding:6px 0;">${mat?.name || it.mat}</div>
        <input type="hidden" data-inv-mat="${i}" value="${it.mat}" />
      </div>
      <div class="form-group" style="flex:1;">
        <label>Cant. (${unit})</label>
        <input type="number" data-inv-kg="${i}" value="${it.kg || ""}"
               placeholder="0" min="0" step="${unit === "und" ? "1" : "0.1"}" style="width:100%;" />
      </div>
      <div class="form-group" style="flex:1.2;">
        <label>Precio/${unit}</label>
        <input type="number" data-inv-price="${i}" value="${it.price || prices[it.mat] || ""}"
               placeholder="auto" min="0" step="50" style="width:100%;" />
      </div>
      <div class="form-group" style="flex:0;">
        <button class="btn btn-sm btn-danger" data-inv-remove="${i}" style="margin-bottom:4px;">✕</button>
      </div>
    </div>`;
  }).join("");
}

/**
 * Inicializa los escuchadores de eventos para el motor de búsqueda de materiales en factura.
 * @param {Record<string,number>} prices
 */
function setupInvoiceSearch(prices) {
  const input = document.getElementById("invSearchInput");
  const results = document.getElementById("invSearchResults");
  if (!input || !results) return;

  input.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      results.style.display = "none";
      return;
    }

    const matches = getActiveMaterials().filter(m => m.name.toLowerCase().includes(q));

    if (!matches.length) {
      results.innerHTML = `<div style="padding:8px; font-size:12px; color:#999;">No se encontraron materiales</div>`;
    } else {
      results.innerHTML = matches.map((m) => {
        const price = prices[m.id] || 0;
        const unit = m.unit || "kg";
        return `
          <div class="search-suggest-item" data-id="${m.id}" style="padding:8px; cursor:pointer; border-bottom:1px solid #eee; display:flex; justify-content:space-between; font-size:13px;">
            <span><strong>${m.name}</strong></span>
            <span style="color:var(--primary, #007bff); font-weight:bold;">${fmtCOP(price)}/${unit}</span>
          </div>`;
      }).join("");
    }
    results.style.display = "block";
  });

  results.addEventListener("click", (e) => {
    const item = e.target.closest(".search-suggest-item");
    if (!item) return;
    triggerAddMaterialToInvoice(item.getAttribute("data-id"), prices);
    input.value = "";
    results.style.display = "none";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const firstItem = results.querySelector(".search-suggest-item");
      if (firstItem) {
        triggerAddMaterialToInvoice(firstItem.getAttribute("data-id"), prices);
        input.value = "";
        results.style.display = "none";
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.style.display = "none";
    }
  });
}

/**
 * Modifica directamente la memoria reactiva del estado central (state.invItems)
 * @param {string} matId
 * @param {Record<string,number>} prices
 */
function triggerAddMaterialToInvoice(matId, prices) {
  if (typeof state === 'undefined' || !state.invItems) return;

  if (state.invItems.length === 1 && state.invItems[0].kg == 0) {
    state.invItems[0] = {
      mat: matId,
      kg: 0,
      price: prices[matId] || 0
    };
  } else {
    state.invItems.push({
      mat: matId,
      kg: 0,
      price: prices[matId] || 0
    });
  }

  renderInvoiceItems(state.invItems, state.prices);

  setTimeout(() => {
    const targetIdx = state.invItems.length - 1;
    const inputKg = document.querySelector(`[data-inv-kg="${targetIdx}"]`);
    if (inputKg) inputKg.focus();
  }, 50);
}

/* ── Factura HTML para impresión ─────────────────────────── */

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
      @page {
        size: 58mm auto;
        margin: 0 !important;
      }
      .ticket-body {
        width: 48mm !important;
        max-width: 48mm !important;
        box-sizing: border-box;
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

function showAlert(msg, type) {
  const el = document.getElementById("alertMsg");
  if (!el) return;
  el.textContent = msg;
  el.className = "alert alert-" + type;
  el.style.display = "block";
  if (_alertTimer) clearTimeout(_alertTimer);
  _alertTimer = setTimeout(() => (el.style.display = "none"), 3500);
}