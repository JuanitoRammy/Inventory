/**
 * data.js — Catálogo de materiales y categorías
 */

"use strict";

const CATEGORIES = {
  cobre: "Cobre y bronce",
  aluminio: "Aluminio",
  acero: "Acero / Hierro",
  radiador: "Radiadores",
  rines: "Rines",
  baterias: "Baterías",
  chatarra: "Chatarra / Scrap",
  e_waste: "Electrónica",
  especial: "Especiales",
  otro: "Otros metales",
};

/**
 * @typedef {Object} Material
 * @property {string} id
 * @property {string} name
 * @property {string} cat
 * @property {string} color
 * @property {number} price
 * @property {'kg'|'und'} unit
 */


/** @type {Material[]} */
const MATERIALS = [
  // ── Materiales Generales (Metales) ─────────────────────────
  { id: "acero", name: "Acero", cat: "acero", color: "#888780", price: 2000, unit: "kg" },
  { id: "aluminio", name: "Aluminio", cat: "aluminio", color: "#85B7EB", price: 6000, unit: "kg" },
  { id: "pote_lata", name: "Aluminio Pote-Lata", cat: "aluminio", color: "#B5D4F4", price: 6300, unit: "kg" },
  { id: "antimonio", name: "Antimonio", cat: "otro", color: "#7F77DD", price: 3000, unit: "kg" },
  { id: "bronce", name: "Bronce", cat: "cobre", color: "#633806", price: 19000, unit: "kg" },
  { id: "cobre_limpio", name: "Cobre limpio", cat: "cobre", color: "#854F0B", price: 33000, unit: "kg" },
  { id: "cobre_sucio", name: "Cobre Sucio", cat: "cobre", color: "#BA7517", price: 31000, unit: "kg" },
  { id: "hierro", name: "Hierro", cat: "acero", color: "#4b4a46", price: 650, unit: "kg" },

  // ── Baterías ─────────────────────────────────────────────
  { id: "b_grande", name: "Batería grande", cat: "baterias", color: "#3B0764", price: 20000, unit: "kg" },

  // ── Plásticos y Derivados ─────────────────────────────────
  { id: "botella_aceite", name: "Botella de Aceite", cat: "plastico", color: "#047857", price: 200, unit: "kg" },
  { id: "botella_pony", name: "Botella Pony", cat: "plastico", color: "#065f46", price: 200, unit: "kg" },
  { id: "canasta", name: "Canasta", cat: "plastico", color: "#0284c7", price: 1300, unit: "kg" },
  { id: "pasta", name: "Pasta", cat: "plastico", color: "#0369a1", price: 1000, unit: "kg" },
  { id: "pet", name: "PET", cat: "plastico", color: "#0e7490", price: 1200, unit: "kg" },
  { id: "plastico", name: "Plástico", cat: "plastico", color: "#155e75", price: 600, unit: "kg" },
  { id: "silla_grande", name: "Silla grande", cat: "plastico", color: "#1e40af", price: 3000, unit: "kg" },

  // ── Papel, Cartón y Vidrio ───────────────────────────────
  { id: "archivo", name: "Archivo", cat: "papel", color: "#4b5563", price: 600, unit: "kg" },
  { id: "carton", name: "Cartón", cat: "papel", color: "#78350f", price: 280, unit: "kg" },
  { id: "vidrio", name: "Vidrio", cat: "vidrio", color: "#475569", price: 100, unit: "kg" },

  // ── Componentes Electrónicos (E-Waste por kg) ────────────
  
  { id: "celular_kg", name: "Celular", cat: "e-waste", color: "#1E293B", price: 1000, unit: "kg" },
  { id: "tarjeta_general", name: "Tarjeta (TV, Celular, monitores)", cat: "e-waste", color: "#064E3B", price: 1500, unit: "kg" },
  
  // ── Dispositivos Enteros y Especiales ─────────────────────
  { id: "cd", name: "CD", cat: "especial", color: "#A78BFA", price: 1000, unit: "kg" },
];

function getMaterial(id) {
  return MATERIALS.find((m) => m.id === id);
}

function getMaterialsByCategory() {
  return MATERIALS.reduce((acc, m) => {
    if (!acc[m.cat]) acc[m.cat] = [];
    acc[m.cat].push(m);
    return acc;
  }, {});
}