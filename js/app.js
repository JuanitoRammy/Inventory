/**
 * app.js — Controlador principal
 */

"use strict";

/* ══════════════════════════════════════════════════════════
   ESTADO GLOBAL EN MEMORIA
   ══════════════════════════════════════════════════════════ */

let state = {
  prices:    {},        // {[matId]: number}
  prevPrices:{},        // {[matId]: number}
  inventory: {},        // {[matId]: number}
  movements: [],        // Movement[]
  currentMT: "entrada", // "entrada" | "salida"
  invItems:  [],        // ítems de la factura en construcción
};

/* ══════════════════════════════════════════════════════════
   INICIALIZACIÓN
   ══════════════════════════════════════════════════════════ */

function init() {
  state.prices     = loadPrices();
  state.inventory  = loadInventory();
  state.movements  = loadMovements();
  state.prevPrices = loadPrevPrices();

  state.invItems = [{ mat: MATERIALS[0].id, kg: 0, price: 0 }];

  renderDateBadge();
  refreshInventoryView();
  populateSelect("movMat");
  populateSelect("updMat");
  renderInvoiceItems(state.invItems, state.prices);

  bindEvents();
}

/* ══════════════════════════════════════════════════════════
   EVENTOS
   ══════════════════════════════════════════════════════════ */

function bindEvents() {
  // Tabs
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Búsqueda
  document.getElementById("searchBox").addEventListener("input", (e) => {
    renderInventoryTable(state.inventory, state.prices, e.target.value);
  });

  // Toggle entrada / salida
  document.getElementById("mtIn") .addEventListener("click", () => selectMT("entrada"));
  document.getElementById("mtOut").addEventListener("click", () => selectMT("salida"));

  // Cálculo en tiempo real
  document.getElementById("movKg")   .addEventListener("input",  calcMovTotal);
  document.getElementById("movPrice").addEventListener("input",  calcMovTotal);
  document.getElementById("movMat")  .addEventListener("change", calcMovTotal);

  // Registrar movimiento
  document.getElementById("btnRegister").addEventListener("click", registerMovement);
  document.getElementById("btnClearMov").addEventListener("click", clearMovForm);

  // Filtros de movimientos
  document.getElementById("fMat")        .addEventListener("change", refreshMovementsView);
  document.getElementById("fType")       .addEventListener("change", refreshMovementsView);
  document.getElementById("btnClearMovs").addEventListener("click",  clearAllMovements);

  // Actualizar precio
  document.getElementById("btnUpdatePrice").addEventListener("click", updatePrice);

  // Factura
  document.getElementById("invItems").addEventListener("change", handleInvItemChange);
  document.getElementById("invItems").addEventListener("input",  handleInvItemChange);
  document.getElementById("invItems").addEventListener("click",  handleInvItemClick);

  document.getElementById("btnAddItem")  .addEventListener("click", addInvItem);
  document.getElementById("btnGenInvoice").addEventListener("click", genInvoice);
  document.getElementById("btnClearInv") .addEventListener("click", clearInvoice);
  document.getElementById("btnPrint")    .addEventListener("click", printInvoice);
}

/* ══════════════════════════════════════════════════════════
   NAVEGACIÓN POR TABS
   ══════════════════════════════════════════════════════════ */

function switchTab(tab) {
  document.querySelectorAll(".tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");

  if (tab === "inventario")  refreshInventoryView();
  if (tab === "movimientos") { populateFilterSelect(); refreshMovementsView(); }
  if (tab === "precios")     { populateSelect("updMat"); renderPriceChips(state.prices, state.prevPrices); }
  if (tab === "factura")     renderInvoiceItems(state.invItems, state.prices);
}

/* ══════════════════════════════════════════════════════════
   INVENTARIO
   ══════════════════════════════════════════════════════════ */

function refreshInventoryView() {
  renderStats(state.inventory, state.prices, state.movements);
  const q = document.getElementById("searchBox")?.value || "";
  renderInventoryTable(state.inventory, state.prices, q);
}

/* ══════════════════════════════════════════════════════════
   MOVIMIENTOS — REGISTRO
   ══════════════════════════════════════════════════════════ */

function selectMT(type) {
  state.currentMT = type;
  document.getElementById("mtIn") .className = "mt-btn" + (type === "entrada" ? " sel-in"  : "");
  document.getElementById("mtOut").className = "mt-btn" + (type === "salida"  ? " sel-out" : "");
  calcMovTotal();
}

function calcMovTotal() {
  const mat = document.getElementById("movMat").value;
  const kg  = parseFloat(document.getElementById("movKg").value)    || 0;
  const p   = parseFloat(document.getElementById("movPrice").value) || state.prices[mat] || 0;
  const res = document.getElementById("calcRes");
  if (kg > 0) {
    res.style.display = "block";
    document.getElementById("calcVal").textContent = fmtCOP(kg * p);
  } else {
    res.style.display = "none";
  }
}

function registerMovement() {
  const mat  = document.getElementById("movMat").value;
  const kg   = parseFloat(document.getElementById("movKg").value);
  const p    = parseFloat(document.getElementById("movPrice").value) || state.prices[mat];
  const note = document.getElementById("movNote").value.trim();
  const unit = getMaterial(mat)?.unit || "kg";

  if (!kg || kg <= 0) {
    showAlert("Ingresa un peso válido.", "error");
    return;
  }

  if (state.currentMT === "salida" && kg > (state.inventory[mat] || 0)) {
    showAlert(
      `Stock insuficiente de ${getMaterial(mat)?.name}. Disponible: ${fmtQty(state.inventory[mat] || 0, unit)}`,
      "error",
    );
    return;
  }

  // Actualizar inventario
  if (state.currentMT === "entrada") {
    state.inventory[mat] = (state.inventory[mat] || 0) + kg;
  } else {
    state.inventory[mat] = (state.inventory[mat] || 0) - kg;
  }

  const movement = {
    id:    Date.now(),
    type:  state.currentMT,
    mat,
    kg,
    price: p,
    total: kg * p,
    note,
    date:  todayStr(),
    time:  new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
  };

  addMovement(movement, state.movements);
  saveInventory(state.inventory);

  showAlert(
    `${state.currentMT === "entrada" ? "Entrada" : "Salida"} de ${fmtQty(kg, unit)} de ${getMaterial(mat)?.name} registrada.`,
    "success",
  );
  clearMovForm();
  refreshInventoryView();
}

function clearMovForm() {
  document.getElementById("movKg")   .value = "";
  document.getElementById("movPrice").value = "";
  document.getElementById("movNote") .value = "";
  document.getElementById("calcRes") .style.display = "none";
}

/* ══════════════════════════════════════════════════════════
   MOVIMIENTOS — HISTORIAL
   ══════════════════════════════════════════════════════════ */

function refreshMovementsView() {
  const mat  = document.getElementById("fMat") ?.value || "";
  const type = document.getElementById("fType")?.value || "";
  renderMovements(state.movements, mat, type);
}

function clearAllMovements() {
  if (!confirm("¿Limpiar todo el historial de movimientos?")) return;
  state.movements = [];
  saveMovements(state.movements);
  refreshMovementsView();
}

/* ══════════════════════════════════════════════════════════
   PRECIOS
   ══════════════════════════════════════════════════════════ */

function updatePrice() {
  const mat = document.getElementById("updMat").value;
  const val = parseFloat(document.getElementById("updPrice").value);
  if (!val || val <= 0) return;

  state.prevPrices[mat] = state.prices[mat];
  savePrevPrices(state.prevPrices);
  state.prices[mat] = val;
  savePrices(state.prices);

  document.getElementById("updPrice").value = "";
  renderPriceChips(state.prices, state.prevPrices);
  refreshInventoryView();
}

/* ══════════════════════════════════════════════════════════
   FACTURA
   ══════════════════════════════════════════════════════════ */

function handleInvItemChange(e) {
  const el     = e.target;
  const iMat   = el.dataset.invMat;
  const iKg    = el.dataset.invKg;
  const iPrice = el.dataset.invPrice;

  if (iMat !== undefined) {
    state.invItems[+iMat].mat   = el.value;
    state.invItems[+iMat].price = state.prices[el.value] || 0;
    renderInvoiceItems(state.invItems, state.prices);
  }
  if (iKg    !== undefined) state.invItems[+iKg]   .kg    = parseFloat(el.value) || 0;
  if (iPrice !== undefined) state.invItems[+iPrice].price = parseFloat(el.value) || 0;
}

function handleInvItemClick(e) {
  const idx = e.target.dataset.invRemove;
  if (idx !== undefined) removeInvItem(+idx);
}

function addInvItem() {
  state.invItems.push({
    mat:   MATERIALS[0].id,
    kg:    0,
    price: state.prices[MATERIALS[0].id] || 0,
  });
  renderInvoiceItems(state.invItems, state.prices);
}

function removeInvItem(i) {
  if (state.invItems.length > 1) {
    state.invItems.splice(i, 1);
    renderInvoiceItems(state.invItems, state.prices);
  }
}

function genInvoice() {
  const client = document.getElementById("invClient").value;
  const type   = document.getElementById("invType").value;

  document.querySelectorAll("[data-inv-kg]").forEach((el) => {
    state.invItems[+el.dataset.invKg].kg = parseFloat(el.value) || 0;
  });
  document.querySelectorAll("[data-inv-price]").forEach((el) => {
    state.invItems[+el.dataset.invPrice].price = parseFloat(el.value) || 0;
  });

  const html = buildInvoiceHTML({ client, type, items: state.invItems, prices: state.prices });
  if (!html) {
    alert("Agrega al menos un material con peso mayor a 0.");
    return;
  }

  document.getElementById("invContent").innerHTML = html;
  document.getElementById("invPreviewCard").style.display = "block";
}

function clearInvoice() {
  state.invItems = [{ mat: MATERIALS[0].id, kg: 0, price: 0 }];
  document.getElementById("invClient").value = "";
  document.getElementById("invPreviewCard").style.display = "none";
  renderInvoiceItems(state.invItems, state.prices);
}

function printInvoice() {
  const content = document.getElementById("invContent").innerHTML;
  const w = window.open("", "_blank");
  
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tiquete MetalStock</title>
      <style>
        /* Configuración de página para tiqueteras de 58mm */
        @page { 
          margin: 0; 
        }
        body { 
          font-family: 'Courier New', Courier, monospace; 
          font-size: 11px; 
          line-height: 1.3;
          padding: 4px; 
          width: 275px; 
          max-width: 275px; 
          color: #000; 
          margin: 0;
          background-color: #fff;
        }
        h3 { 
          text-align: center; 
          font-size: 12px; 
          font-weight: bold;
          margin: 5px 0;
          text-transform: uppercase;
        }
        .inv-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start;
          width: 100%;
          word-break: break-all;
        }
        .sep { 
          border-top: 1px dashed #000; 
          margin: 6px 0; 
          width: 100%;
        }
        .inv-footer { 
          text-align: center; 
          font-size: 10px; 
          color: #444; 
          margin-top: 8px;
        }
        /* Espacio físico al final del papel para que avance hasta la cuchilla */
        .cut-space {
          height: 35px;
          display: block;
        }
      </style>
    </head>
    <body>
      ${content}
      <div class="cut-space"></div>
    </body>
    </html>
  `);
  
  w.document.close();
  
  // Pequeño delay para asegurar que el HTML y estilos carguen en la ventana flotante antes de imprimir
  setTimeout(() => {
    w.print();
    w.close(); // Cierra la pestaña automáticamente después de mandar a imprimir o cancelar
  }, 250);
}

/* ══════════════════════════════════════════════════════════
   ARRANQUE
   ══════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", init);