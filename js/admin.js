/**
 * admin.js — Gestión de materiales y categorías
 */

"use strict";

/* ── Materiales ──────────────────────────────────────────── */

async function loadAdminMaterials() {
  try {
    const data = await apiFetch("materials");
    renderAdminMaterials(data);
  } catch (e) {
    showAlert("Error al cargar materiales: " + e.message, "error");
  }
}

function renderAdminMaterials(materials) {
  const el = document.getElementById("adminMatList");
  if (!el) return;
  if (!materials.length) {
    el.innerHTML = '<p style="font-size:12px;color:var(--text-muted);">Sin materiales registrados.</p>';
    return;
  }
  el.innerHTML = materials.map(m => {
    const isInactive = m.active === false || m.active === 0;
    return `
    <div class="admin-item ${isInactive ? 'admin-inactive' : ''}" data-id="${m.id}">
      <div class="admin-item-info">
        <span class="mat-dot" style="background:${m.color};display:inline-block;"></span>
        <strong>${m.name}</strong>
        ${isInactive ? '<span class="badge badge-red" style="font-size:10px;">Inactivo</span>' : ''}
        <small style="color:var(--text-muted)">${m.id} · ${fmtCOP(m.price)}/${m.unit} · ${CATEGORIES[m.cat] || m.cat}</small>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-sm" data-admin-edit-mat="${m.id}" title="Editar">✏️</button>
        ${isInactive
          ? `<button class="btn btn-sm" data-admin-activate-mat="${m.id}" title="Reactivar" style="color:var(--accent);">↩</button>`
          : `<button class="btn btn-sm btn-danger" data-admin-del-mat="${m.id}" title="Inactivar">🗑️</button>`
        }
      </div>
    </div>`;
  }).join("");
}

async function saveAdminMaterial() {
  const name  = document.getElementById("adminMatName").value.trim();
  const cat   = document.getElementById("adminMatCat").value;
  const color = document.getElementById("adminMatColor").value;
  const unit  = document.getElementById("adminMatUnit").value;
  const editId = document.getElementById("adminMatEditId").value;

  if (!name || !cat) {
    showAlert("Nombre y categoría son requeridos.", "error");
    return;
  }

  try {
    if (editId) {
      await apiFetch("materials&id=" + editId, {
        method: "PUT",
        body: JSON.stringify({ name, cat, color, unit }),
      });
      showAlert("Material actualizado.", "success");
    } else {
      await apiFetch("materials", {
        method: "POST",
        body: JSON.stringify({ name, cat, color, unit }),
      });
      showAlert("Material creado.", "success");
    }
    resetAdminMatForm();
    await loadAdminMaterials();
    const data = await apiFetch("state");
    loadMaterialsFromResponse(data);
    refreshInventoryView();
  } catch (e) {
    showAlert("Error: " + e.message, "error");
  }
}

function editAdminMaterial(id) {
  const mat = getMaterial(id);
  if (!mat) return;
  document.getElementById("adminMatName").value = mat.name;
  document.getElementById("adminMatCat").value = mat.cat;
  document.getElementById("adminMatColor").value = mat.color;
  document.getElementById("adminMatUnit").value = mat.unit;
  document.getElementById("adminMatEditId").value = mat.id;
  document.getElementById("adminMatSubmit").textContent = "Actualizar";
}

function resetAdminMatForm() {
  document.getElementById("adminMatForm").reset();
  document.getElementById("adminMatEditId").value = "";
  document.getElementById("adminMatSubmit").textContent = "Agregar";
  document.getElementById("adminMatColor").value = "#6B7280";
}

/* ── Categorías ─────────────────────────────────────────── */

async function loadAdminCategories() {
  try {
    const data = await apiFetch("categories");
    renderAdminCategories(data);
    populateAdminCatSelects();
  } catch (e) {
    showAlert("Error al cargar categorías: " + e.message, "error");
  }
}

function renderAdminCategories(categories) {
  const el = document.getElementById("adminCatList");
  if (!el) return;
  if (!categories.length) {
    el.innerHTML = '<p style="font-size:12px;color:var(--text-muted);">Sin categorías registradas.</p>';
    return;
  }
  el.innerHTML = categories.map(c => {
    const isInactive = c.activo === false || c.activo === 0;
    return `
    <div class="admin-item ${isInactive ? 'admin-inactive' : ''}">
      <div class="admin-item-info">
        <strong>${c.nombre}</strong>
        ${isInactive ? '<span class="badge badge-red" style="font-size:10px;">Inactiva</span>' : ''}
        <small style="color:var(--text-muted)">${c.id}</small>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-sm" data-admin-edit-cat="${c.id}" title="Editar">✏️</button>
        ${isInactive
          ? `<button class="btn btn-sm" data-admin-activate-cat="${c.id}" title="Reactivar" style="color:var(--accent);">↩</button>`
          : `<button class="btn btn-sm btn-danger" data-admin-del-cat="${c.id}" title="Inactivar">🗑️</button>`
        }
      </div>
    </div>`;
  }).join("");
}

function populateAdminCatSelects() {
  const el = document.getElementById("adminMatCat");
  if (!el) return;
  const current = el.value;
  const activeCats = Object.entries(CATEGORIES).filter(([k]) => {
    const cat = MATERIALS.find(m => m.cat === k);
    return true;
  });
  el.innerHTML = '<option value="">Seleccionar categoría</option>' +
    Object.entries(CATEGORIES).map(([k, v]) =>
      `<option value="${k}">${v}</option>`
    ).join("");
  if (current) el.value = current;
}

async function saveAdminCategory() {
  const name = document.getElementById("adminCatName").value.trim();
  const editId = document.getElementById("adminCatEditId").value;

  if (!name) {
    showAlert("Nombre de categoría requerido.", "error");
    return;
  }

  try {
    if (editId) {
      await apiFetch("categories&id=" + editId, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      showAlert("Categoría actualizada.", "success");
    } else {
      await apiFetch("categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      showAlert("Categoría creada.", "success");
    }
    resetAdminCatForm();
    await loadAdminCategories();
    const data = await apiFetch("state");
    loadMaterialsFromResponse(data);
    refreshInventoryView();
  } catch (e) {
    showAlert("Error: " + e.message, "error");
  }
}

function editAdminCategory(id) {
  const catName = CATEGORIES[id] || "";
  document.getElementById("adminCatName").value = catName;
  document.getElementById("adminCatEditId").value = id;
  document.getElementById("adminCatSubmit").textContent = "Actualizar";
}

function resetAdminCatForm() {
  document.getElementById("adminCatForm").reset();
  document.getElementById("adminCatEditId").value = "";
  document.getElementById("adminCatSubmit").textContent = "Agregar";
}

/* ── Events ─────────────────────────────────────────────── */

function bindAdminEvents() {
  document.addEventListener("click", async e => {

    // Inactivar material
    const delMat = e.target.closest("[data-admin-del-mat]");
    if (delMat && confirm("¿Inactivar este material? No aparecerá en selects ni se podrá usar en nuevos movimientos.")) {
      const id = delMat.dataset.adminDelMat;
      try {
        await apiFetch("materials&id=" + id, { method: "DELETE" });
        showAlert("Material inactivado.", "success");
        const data = await apiFetch("state");
        loadMaterialsFromResponse(data);
        await loadAdminMaterials();
        refreshInventoryView();
      } catch (err) { showAlert("Error: " + err.message, "error"); }
      return;
    }

    // Reactivar material
    const activateMat = e.target.closest("[data-admin-activate-mat]");
    if (activateMat) {
      const id = activateMat.dataset.adminActivateMat;
      try {
        await apiFetch("materials&id=" + id, {
          method: "PUT",
          body: JSON.stringify({ active: true }),
        });
        showAlert("Material reactivado.", "success");
        const data = await apiFetch("state");
        loadMaterialsFromResponse(data);
        await loadAdminMaterials();
        refreshInventoryView();
      } catch (err) { showAlert("Error: " + err.message, "error"); }
      return;
    }

    // Editar material
    const editMat = e.target.closest("[data-admin-edit-mat]");
    if (editMat) {
      editAdminMaterial(editMat.dataset.adminEditMat);
      return;
    }

    // Inactivar categoría
    const delCat = e.target.closest("[data-admin-del-cat]");
    if (delCat && confirm("¿Inactivar esta categoría? Los materiales que la usan no se afectan.")) {
      const id = delCat.dataset.adminDelCat;
      try {
        await apiFetch("categories&id=" + id, { method: "DELETE" });
        showAlert("Categoría inactivada.", "success");
        const data = await apiFetch("state");
        loadMaterialsFromResponse(data);
        await loadAdminCategories();
        refreshInventoryView();
      } catch (err) { showAlert("Error: " + err.message, "error"); }
      return;
    }

    // Reactivar categoría
    const activateCat = e.target.closest("[data-admin-activate-cat]");
    if (activateCat) {
      const id = activateCat.dataset.adminActivateCat;
      try {
        await apiFetch("categories&id=" + id, {
          method: "PUT",
          body: JSON.stringify({ activo: true }),
        });
        showAlert("Categoría reactivada.", "success");
        const data = await apiFetch("state");
        loadMaterialsFromResponse(data);
        await loadAdminCategories();
        refreshInventoryView();
      } catch (err) { showAlert("Error: " + err.message, "error"); }
      return;
    }

    // Editar categoría
    const editCat = e.target.closest("[data-admin-edit-cat]");
    if (editCat) {
      editAdminCategory(editCat.dataset.adminEditCat);
      return;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindAdminEvents();
});
