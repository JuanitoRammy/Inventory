/**
 * data.js — Catálogo de materiales y categorías (desde DB)
 */

"use strict";

/** @type {Material[]} */
let MATERIALS = [];

/** @type {Record<string,string>} */
let CATEGORIES = {};

/**
 * @typedef {Object} Material
 * @property {string} id
 * @property {string} name
 * @property {string} cat
 * @property {string} color
 * @property {number} price
 * @property {'kg'|'und'} unit
 */

const FALLBACK_MATERIALS = [
  { id: "acero", name: "Acero", cat: "acero", color: "#888780", price: 2000, unit: "kg" },
  { id: "aluminio", name: "Aluminio", cat: "aluminio", color: "#85B7EB", price: 6000, unit: "kg" },
  { id: "cobre_limpio", name: "Cobre limpio", cat: "cobre", color: "#854F0B", price: 33000, unit: "kg" },
  { id: "bronce", name: "Bronce", cat: "cobre", color: "#633806", price: 19000, unit: "kg" },
  { id: "hierro", name: "Hierro", cat: "acero", color: "#4b4a46", price: 650, unit: "kg" },
];

const FALLBACK_CATEGORIES = {
  cobre: "Cobre y bronce",
  aluminio: "Aluminio",
  acero: "Acero / Hierro",
  baterias: "Baterías",
  plastico: "Plásticos y Derivados",
  papel: "Papel y Cartón",
  vidrio: "Vidrio",
  e_waste: "Electrónica",
  especial: "Especiales",
  otro: "Otros metales",
};

function loadMaterialsFromResponse(data) {
  if (!data.materials || !data.materials.length) return false;
  MATERIALS = data.materials;
  CATEGORIES = data.categories || {};
  MATERIALS.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  if (typeof window._lsSaveMaterials === "function") window._lsSaveMaterials(MATERIALS);
  if (typeof window._lsSaveCategories === "function") window._lsSaveCategories(CATEGORIES);
  return true;
}

async function loadMaterials() {
  if (typeof window._lsLoadMaterials === "function") {
    const local = window._lsLoadMaterials();
    if (local && local.length) {
      MATERIALS = local;
    }
    const localCat = window._lsLoadCategories();
    if (localCat) CATEGORIES = localCat;
  }

  if (!MATERIALS.length) {
    MATERIALS = FALLBACK_MATERIALS;
    CATEGORIES = FALLBACK_CATEGORIES;
    MATERIALS.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }
}

function getMaterial(id) {
  return MATERIALS.find((m) => m.id === id);
}

function isActiveMaterial(id) {
  const m = getMaterial(id);
  return m ? m.active !== false : false;
}

function getActiveMaterials() {
  return MATERIALS.filter(m => m.active !== false);
}

function firstMaterialId() {
  const active = getActiveMaterials();
  return (active.length ? active[0] : MATERIALS[0]).id;
}

function getMaterialsByCategory() {
  return getActiveMaterials().reduce((acc, m) => {
    if (!acc[m.cat]) acc[m.cat] = [];
    acc[m.cat].push(m);
    return acc;
  }, {});
}