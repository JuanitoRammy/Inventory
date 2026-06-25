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
  // ── Cobre y bronce ──────────────────────────────────────
  { id: "cobre1", name: "Cobre 1", cat: "cobre", color: "#854F0B", price: 41750, unit: "kg" },
  { id: "cobre2", name: "Cobre 2", cat: "cobre", color: "#BA7517", price: 39950, unit: "kg" },
  { id: "bronce", name: "Bronce", cat: "cobre", color: "#633806", price: 26200, unit: "kg" },
  { id: "bronce_b", name: "Bronce tipo B", cat: "cobre", color: "#412402", price: 25600, unit: "kg" },


  // ── Radiadores ───────────────────────────────────────────
  { id: "rad_cobre", name: "Radiador de cobre", cat: "radiador", color: "#E24B4A", price: 26100, unit: "kg" },
  { id: "rad_alum", name: "Radiador de aluminio", cat: "radiador", color: "#185FA5", price: 5800, unit: "kg" },
  { id: "rad_mixto", name: "Radiador mixto", cat: "radiador", color: "#A32D2D", price: 21800, unit: "kg" },

  // ── Aluminio ────────────────────────────────────────────
  { id: "alum_guaya", name: "Aluminio guaya", cat: "aluminio", color: "#378ADD", price: 12200, unit: "kg" },
  { id: "blando", name: "Blando (aluminio)", cat: "aluminio", color: "#85B7EB", price: 6900, unit: "kg" },
  { id: "pote", name: "Pote", cat: "aluminio", color: "#B5D4F4", price: 8300, unit: "kg" },
  { id: "pote_aero", name: "Pote aerosol", cat: "aluminio", color: "#E6F1FB", price: 5800, unit: "kg" },

  // ── Acero / Hierro ───────────────────────────────────────
  { id: "acero", name: "Acero", cat: "acero", color: "#888780", price: 3400, unit: "kg" },
  { id: "acero_dim", name: "Acero dimensionado", cat: "acero", color: "#5F5E5A", price: 2900, unit: "kg" },
  { id: "grueso", name: "Grueso", cat: "acero", color: "#444441", price: 6900, unit: "kg" },
  { id: "grueso_cil", name: "Cilindro grueso", cat: "acero", color: "#2C2C2A", price: 2000, unit: "kg" },
  { id: "olla", name: "Olla", cat: "acero", color: "#B4B2A9", price: 8200, unit: "kg" },
  { id: "perf_sucio", name: "Perfil sucio", cat: "acero", color: "#D3D1C7", price: 8500, unit: "kg" },
  { id: "perf_limpio", name: "Perfil limpio", cat: "acero", color: "#F1EFE8", price: 9500, unit: "kg" },

  // ── Rines ────────────────────────────────────────────────
  { id: "rin_auto", name: "Rines automóvil", cat: "rines", color: "#1D9E75", price: 9000, unit: "kg" },
  { id: "rin_bici", name: "Rines bicicleta", cat: "rines", color: "#5DCAA5", price: 6900, unit: "kg" },
  { id: "rin_camion", name: "Rines camión", cat: "rines", color: "#085041", price: 7600, unit: "kg" },

  // ── Baterías — por UNIDAD ────────────────────────────────
  { id: "b_grupo_1", name: "B. Grupo 1", cat: "baterias", color: "#6D28D9", price: 37400, unit: "und" },
  { id: "b_grupo_2", name: "B. Grupo 2", cat: "baterias", color: "#7C3AED", price: 45000, unit: "und" },
  { id: "b_grupo_3", name: "B. Grupo 3", cat: "baterias", color: "#8B5CF6", price: 56750, unit: "und" },
  { id: "b_grupo_4", name: "B. Grupo 4", cat: "baterias", color: "#A78BFA", price: 87750, unit: "und" },
  { id: "b_grupo_5", name: "B. Grupo 5", cat: "baterias", color: "#C4B5FD", price: 110300, unit: "und" },
  { id: "b_grupo_07", name: "B. Grupo 7", cat: "baterias", color: "#4C1D95", price: 23700, unit: "und" },
  { id: "b_grupo_08", name: "B. Grupo 8", cat: "baterias", color: "#5B21B6", price: 29750, unit: "und" },
  // ── Bajo grado ───────────────────────────────────────────
  { id: "b_grado_marron", name: "Bajo grado marrón", cat: "Bajo grado", color: "#af6715", price: 2170, unit: "kg" },
  { id: "b_grado_verde", name: "Bajo grado verde", cat: "Bajo grado", color: "#186d1f", price: 2270, unit: "kg" },

  // ── Tipos de tarjetas ────────────────────────────────────
  { id: "T_tipo_1", name: "Tarjeta tipo 1 (Motherboard/Servidor)", cat: "Tipos de tarjetas", color: "#969e51", price: 2170, unit: "kg" },
  { id: "T_tipo_2", name: "Tarjeta tipo 2 (PC Común)", cat: "Tipos de tarjetas", color: "#8eb161", price: 2270, unit: "kg" },
  { id: "T_tipo_3", name: "Tarjeta tipo 3 (Periféricos/Modems)", cat: "Tipos de tarjetas", color: "#9e961f", price: 2170, unit: "kg" },
  { id: "T_tipo_4", name: "Tarjeta tipo 4 (Bajo Grado/Fuentes)", cat: "Tipos de tarjetas", color: "#858618", price: 2270, unit: "kg" },

  // ── Lingotes ─────────────────────────────────────────────
  { id: "Lin_dorado", name: "Lingote Dorado", cat: "Lingotes", color: "#ffee00", price: 2170, unit: "kg" },
  { id: "lin_plateado", name: "Lingote Plateado", cat: "Lingotes", color: "#d6d6d6", price: 2270, unit: "kg" },

  // ── Chatarra ─────────────────────────────────────────────
  { id: "chatarra_moto", name: "Chatarra Moto", cat: "Chatarra", color: "#334155", price: 2170, unit: "kg" },
  { id: "chatarra_seco_g", name: "Chatarra Seco Grande", cat: "Chatarra", color: "#475569", price: 2270, unit: "kg" },
  { id: "chatarra_seco_u", name: "Chatarra Seco UPS", cat: "Chatarra", color: "#64748B", price: 2170, unit: "kg" },
  { id: "chatarra_limpio", name: "Chatarra Limpio", cat: "Chatarra", color: "#94A3B8", price: 2270, unit: "kg" },

  // ── Plomo ────────────────────────────────────────────────
  { id: "plomo_retal", name: "Plomo Retal", cat: "plomo", color: "#0F172A", price: 4800, unit: "kg" },
  { id: "plomo_balan", name: "Plomo Balancín", cat: "plomo", color: "#1E293B", price: 4550, unit: "kg" },

  // ── E-Waste (tarjetas — por kg) ──────────────────────────
  { id: "ram", name: "Memoria RAM", cat: "e-waste", color: "#059669", price: 235000, unit: "kg" },
  { id: "cel_mixta", name: "Tarjeta Celular Mixta", cat: "e-waste", color: "#10B981", price: 235000, unit: "kg" },
  { id: "cel_boton", name: "Tarjeta Celular Botón", cat: "e-waste", color: "#34D399", price: 130000, unit: "kg" },
  { id: "cel_china", name: "Tarjeta Celular China", cat: "e-waste", color: "#6EE7B7", price: 70000, unit: "kg" },
  { id: "tarj_disco", name: "Tarjeta Disco Duro", cat: "e-waste", color: "#065F46", price: 120000, unit: "kg" },
  { id: "tarj_tablet", name: "Tarjeta de Tablet", cat: "e-waste", color: "#064E3B", price: 70000, unit: "kg" },
  { id: "mapa_dorada", name: "Central Mapa Dorada", cat: "e-waste", color: "#D4AF37", price: 90000, unit: "kg" },
  { id: "central", name: "Central", cat: "e-waste", color: "#065F46", price: 75000, unit: "kg" },
  { id: "proc_sin_b", name: "Procesador s/ Blindaje", cat: "e-waste", color: "#14B8A6", price: 140000, unit: "kg" },
  { id: "proc_blind", name: "Procesador Blindado", cat: "e-waste", color: "#0D9488", price: 70000, unit: "kg" },

  // ── E-Waste (dispositivos enteros — por UNIDAD) ──────────
  { id: "cel_entero", name: "Celular Entero", cat: "e-waste", color: "#1E293B", price: 32000, unit: "und" },
  { id: "tab_entero", name: "Tablet Entera", cat: "e-waste", color: "#334155", price: 7500, unit: "und" },
  { id: "port_entero", name: "Portátil Entero", cat: "e-waste", color: "#475569", price: 8500, unit: "und" },
  { id: "port_incompleto", name: "Portátil incompleto", cat: "e-waste", color: "#202327", price: 3500, unit: "und" },
  { id: "disco_entero", name: "Disco Duro Entero", cat: "e-waste", color: "#64748B", price: 8000, unit: "und" },
  { id: "fuente_cable", name: "Fuente con Cable", cat: "e-waste", color: "#94A3B8", price: 3700, unit: "und" },

  // ── Especiales ───────────────────────────────────────────
  { id: "radiografia", name: "Radiografía", cat: "especial", color: "#2D3748", price: 6500, unit: "kg" },
  { id: "catalizador", name: "Catalizador Gasolina", cat: "especial", color: "#B45309", price: 125000, unit: "und" },
  { id: "cd_reciclaje", name: "CD", cat: "especial", color: "#A78BFA", price: 1000, unit: "kg" },

  // ── Otros ────────────────────────────────────────────────
  { id: "antimonio", name: "Antimonio", cat: "otro", color: "#7F77DD", price: 7000, unit: "kg" },
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