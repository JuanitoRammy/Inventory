/**
 * app.js — Controlador principal (con API PHP)
 */

"use strict";

let state = {
  prices:     {},
  prevPrices: {},
  inventory:  {},
  movements:  [],
  currentMT:  "entrada",
  invItems:   [],
};

async function init() {
  try {
    const data = await apiFetch("state");
    loadMaterialsFromResponse(data);
    state.prices     = data.prices     || {};
    state.prevPrices = data.prevPrices || {};
    state.inventory  = data.inventory  || {};
    state.movements  = data.movements  || [];
    state.useApi     = true;
  } catch (e) {
    console.warn("API no disponible, usando localStorage como fallback:", e.message);
    await loadMaterials();
    state.prices     = window._lsLoadPrices ? window._lsLoadPrices() : {};
    state.inventory  = window._lsLoadInventory ? window._lsLoadInventory() : {};
    state.movements  = window._lsLoadMovements ? window._lsLoadMovements() : [];
    state.prevPrices = window._lsLoadPrevPrices ? window._lsLoadPrevPrices() : {};
    state.useApi     = false;
  }

  state.invItems = [{ mat: firstMaterialId(), kg: 0, price: 0 }];

  renderDateBadge();
  refreshInventoryView();
  populateSelect("movMat");
  populateSelect("updMat");
  renderInvoiceItems(state.invItems, state.prices);

  bindEvents();

  if (typeof setupHistoryReprint === "function") {
    setupHistoryReprint();
  }
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.getElementById("searchBox").addEventListener("input", (e) => {
    renderInventoryTable(state.inventory, state.prices, e.target.value);
  });

  document.getElementById("mtIn") .addEventListener("click", () => selectMT("entrada"));
  document.getElementById("mtOut").addEventListener("click", () => selectMT("salida"));

  document.getElementById("movKg")   .addEventListener("input",  calcMovTotal);
  document.getElementById("movPrice").addEventListener("input",  calcMovTotal);
  document.getElementById("movMat")  .addEventListener("change", calcMovTotal);

  document.getElementById("btnRegister").addEventListener("click", registerMovement);
  document.getElementById("btnClearMov").addEventListener("click", clearMovForm);

  document.getElementById("fMat")        .addEventListener("change", refreshMovementsView);
  document.getElementById("fType")       .addEventListener("change", refreshMovementsView);
  document.getElementById("btnClearMovs").addEventListener("click",  clearAllMovements);

  document.getElementById("btnUpdatePrice").addEventListener("click", updatePrice);

  document.getElementById("invItems").addEventListener("change", handleInvItemChange);
  document.getElementById("invItems").addEventListener("input",  handleInvItemChange);
  document.getElementById("invItems").addEventListener("click",  handleInvItemClick);

  document.getElementById("btnGenInvoice").addEventListener("click", genInvoice);
  document.getElementById("btnClearInv") .addEventListener("click", clearInvoice);
  document.getElementById("btnPrint")    .addEventListener("click", printInvoice);

  const adminBtn = document.getElementById("btnAdmin");
  if (adminBtn) adminBtn.addEventListener("click", () => switchTab("admin"));
}

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
  if (tab === "admin")       { populateAdminCatSelects(); loadAdminMaterials(); loadAdminCategories(); }
}

function refreshInventoryView() {
  renderStats(state.inventory, state.prices, state.movements);
  const q = document.getElementById("searchBox")?.value || "";
  renderInventoryTable(state.inventory, state.prices, q);
}

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

async function registerMovement() {
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

  if (state.useApi) {
    try {
      await addMovement(movement, state.movements);
    } catch (e) {
      showAlert("Error al guardar en la base de datos: " + e.message, "error");
      return;
    }
  } else {
    addMovement(movement, state.movements);
    saveInventory(state.inventory);
  }

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

function refreshMovementsView() {
  const mat  = document.getElementById("fMat") ?.value || "";
  const type = document.getElementById("fType")?.value || "";
  const movementsInverted = [...state.movements].reverse();
  renderMovements(movementsInverted, mat, type);
}

async function clearAllMovements() {
  if (!confirm("¿Limpiar todo el historial de movimientos?")) return;
  state.movements = [];
  if (state.useApi) {
    await saveMovements(state.movements);
  } else {
    saveMovements(state.movements);
  }
  refreshMovementsView();
}

async function updatePrice() {
  const mat = document.getElementById("updMat").value;
  const val = parseFloat(document.getElementById("updPrice").value);
  if (!val || val <= 0) return;

  state.prevPrices[mat] = state.prices[mat];
  state.prices[mat] = val;

  if (state.useApi) {
    try {
      await apiFetch("prices", {
        method: "POST",
        body: JSON.stringify({ mat, price: val }),
      });
    } catch (e) {
      showAlert("Error al guardar precio: " + e.message, "error");
      return;
    }
  } else {
    savePrevPrices(state.prevPrices);
    savePrices(state.prices);
  }

  document.getElementById("updPrice").value = "";
  renderPriceChips(state.prices, state.prevPrices);
  refreshInventoryView();
}

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
    mat:   firstMaterialId(),
    kg:    0,
    price: state.prices[firstMaterialId()] || 0,
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

  const validItems = state.invItems.filter(item => item.kg > 0);
  if (validItems.length === 0) {
    alert("Agrega al menos un material con peso mayor a 0.");
    return;
  }

  const html = buildInvoiceHTML({ client, type, items: state.invItems, prices: state.prices });
  if (!html) {
    alert("Error al construir el diseño de la factura.");
    return;
  }

  document.getElementById("invContent").innerHTML = html;
  document.getElementById("invPreviewCard").style.display = "block";
}

async function confirmAndRegisterInvoice() {
  const client = document.getElementById("invClient").value || "Cliente General";
  const type = document.getElementById("invType").value.trim();

  const validItems = state.invItems.filter(item => item.kg > 0);
  if (validItems.length === 0) return false;

  const typeLower = type.toLowerCase();
  const isSalida = (typeLower === "salida" || typeLower === "venta");

  if (isSalida) {
    const totalsByMaterial = {};
    validItems.forEach((item) => {
      if (!totalsByMaterial[item.mat]) totalsByMaterial[item.mat] = 0;
      totalsByMaterial[item.mat] += parseFloat(item.kg);
    });

    for (const matId in totalsByMaterial) {
      const currentStock = parseFloat(state.inventory[matId]) || 0;
      const totalRequested = totalsByMaterial[matId];
      if (totalRequested > currentStock) {
        const matName = getMaterial(matId)?.name || matId;
        alert(`Stock insuficiente para ${matName}.\nDisponible total: ${currentStock} kg.\nSolicitado en factura: ${totalRequested} kg.`);
        return false;
      }
    }
  }

  const invoiceId = Date.now();
  const invoiceNum = invoiceId.toString().slice(-6);
  const movementsToSave = [];

  validItems.forEach((item) => {
    const currentStock = parseFloat(state.inventory[item.mat]) || 0;
    const kgOperacion = parseFloat(item.kg);

    if (isSalida) {
      state.inventory[item.mat] = currentStock - kgOperacion;
    } else {
      state.inventory[item.mat] = currentStock + kgOperacion;
    }

    const movement = {
      id:         Date.now() + Math.random(),
      invoiceId:  invoiceId,
      invoiceNum: invoiceNum,
      type:       isSalida ? "salida" : "entrada",
      mat:        item.mat,
      kg:         kgOperacion,
      price:      parseFloat(item.price) || 0,
      total:      kgOperacion * (parseFloat(item.price) || 0),
      note:       `Factura (${type}): ${client}`,
      date:       todayStr(),
      time:       new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    };
    state.movements.push(movement);
    movementsToSave.push(movement);
  });

  if (state.useApi) {
    try {
      await apiFetch("movements", {
        method: "POST",
        body: JSON.stringify(movementsToSave),
      });
    } catch (e) {
      showAlert("Error al guardar factura: " + e.message, "error");
      return false;
    }
  } else {
    saveMovements(state.movements);
  }

  refreshInventoryView();
  return true;
}

function clearInvoice() {
  state.invItems = [{ mat: firstMaterialId(), kg: 0, price: 0 }];
  document.getElementById("invClient").value = "";
  document.getElementById("invPreviewCard").style.display = "none";
  renderInvoiceItems(state.invItems, state.prices);
}

async function printInvoice() {
  const procesadoExitoso = await confirmAndRegisterInvoice();
  if (!procesadoExitoso) return;

  const client = document.getElementById("invClient").value;
  const type   = document.getElementById("invType").value;

  const ticketHTML = buildInvoiceHTML({ client, type, items: state.invItems, prices: state.prices });
  if (!ticketHTML) return;

  const w = window.open("", "_blank", "width=900,height=600");

  if (!w) {
    alert("Por favor, permite las ventanas emergentes (pop-ups) para poder imprimir desde el celular.");
    return;
  }

  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tiquete Impresion</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #fff;">
      ${ticketHTML}
      <div style="height: 10mm;"></div> <script>
        window.onload = function() {
          window.print();
          setTimeout(() => { w.close(); }, 500);
        };
      <\/script>
    </body>
    </html>
  `);

  w.document.close();
  clearInvoice();
}

document.addEventListener("DOMContentLoaded", () => {
  init();
});
