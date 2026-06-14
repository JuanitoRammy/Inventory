---
tags:
  - proyecto
  - desarrollo
  - inventario
  - javascript
estado: activo
tipo: proyecto-software
tecnologias:
  - HTML
  - CSS
  - JavaScript
cliente: chatarrería
ciudad: Barranquilla
created: 2025-06-15
updated: 2026-03-18
---

# MetalStock Pro

Sistema de gestión de inventario para chatarrerías, desarrollado en **HTML/CSS/JS puro** (sin frameworks) para máxima portabilidad y facilidad de despliegue.

> [!info] Tecnología
> Sin dependencias externas. Se abre con doble clic en `index.html` o se sirve desde cualquier servidor estático.

---

## Tabla de contenidos

1. [[#Estructura del proyecto]]
2. [[#Arquitectura del sistema]]
3. [[#Módulos JavaScript]]
4. [[#Funcionalidades]]
5. [[#Persistencia actual (localStorage)]]
6. [[#Escalabilidad — bases de datos recomendadas]]
7. [[#Hoja de ruta de escalabilidad]]
8. [[#Cómo agregar un material nuevo]]
9. [[#Despliegue]]

---

## Estructura del proyecto

```
inv/
├── index.html      ← Estructura HTML y punto de entrada
├── styles.css      ← Estilos, variables CSS, modo oscuro
├── data.js         ← Catálogo de materiales (fuente de verdad)
├── storage.js      ← Capa de persistencia (localStorage hoy, DB mañana)
├── ui.js           ← Funciones de renderizado DOM
└── app.js          ← Controlador: estado, eventos, lógica de negocio
```

El orden de carga en `index.html` es importante:

```html
<script src="data.js"></script>     <!-- constantes globales primero -->
<script src="storage.js"></script>  <!-- depende de data.js -->
<script src="ui.js"></script>       <!-- depende de data.js -->
<script src="app.js"></script>      <!-- orquesta todo -->
```

---

## Arquitectura del sistema

```
┌─────────────────────────────────────────────┐
│                  index.html                  │
│          (estructura semántica HTML)         │
└────────────────────┬────────────────────────┘
                     │ carga
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    data.js      storage.js     ui.js
  (catálogo)   (persistencia)  (render)
        └────────────┬────────────┘
                     │ importados por
                     ▼
                  app.js
          (estado + eventos + negocio)
```

**Principio de separación de responsabilidades:**

| Archivo | Responsabilidad | Conoce a |
|---|---|---|
| `data.js` | Definición de materiales y categorías | Nadie |
| `storage.js` | Leer/escribir datos persistentes | `data.js` |
| `ui.js` | Construir HTML dinámico | `data.js` |
| `app.js` | Estado global, eventos, flujo | Todos |

---

## Módulos JavaScript

### `data.js` — Catálogo de materiales

Define dos constantes globales:

```js
const CATEGORIES = { cobre: "Cobre y bronce", aluminio: "Aluminio", ... }

const MATERIALS = [
  { id: "cobre1", name: "Cobre 1", cat: "cobre", color: "#854F0B", price: 41750 },
  // ...
]
```

**22 materiales** agrupados en 6 categorías: Cobre y bronce, Aluminio, Acero/Hierro, Radiadores, Rines, Otros.

| Función | Descripción |
|---|---|
| `getMaterial(id)` | Devuelve el objeto Material por su id |
| `getMaterialsByCategory()` | Agrupa `MATERIALS` en un objeto `{cat: Material[]}` |

---

### `storage.js` — Capa de persistencia

Actúa como **interfaz abstracta** entre la lógica de negocio y el mecanismo de almacenamiento.

> [!tip] Punto de migración
> Al migrar a una base de datos, **solo este archivo cambia**. El resto del código no necesita modificarse.

**Claves en localStorage:**

| Clave | Tipo | Contenido |
|---|---|---|
| `ms_prices` | `{[id]: number}` | Precio vigente COP/kg por material |
| `ms_inventory` | `{[id]: number}` | Kilogramos en bodega por material |
| `ms_movements` | `Movement[]` | Historial completo de entradas y salidas |

**Estructura de un `Movement`:**

```js
{
  id:    1718000000000,   // timestamp ms (id único)
  type:  "entrada",       // "entrada" | "salida"
  mat:   "cobre1",        // id del material
  kg:    250.5,           // peso
  price: 41750,           // precio/kg aplicado
  total: 10458975,        // kg × price
  note:  "camión ABC-123",
  date:  "15/06/2025",
  time:  "14:35"
}
```

| Función | Descripción |
|---|---|
| `loadPrices()` | Lee precios; si no existen, usa defaults de `data.js` |
| `savePrices(prices)` | Persiste el mapa de precios |
| `loadInventory()` | Lee inventario; inicia en 0 por material |
| `saveInventory(inventory)` | Persiste el stock |
| `loadMovements()` | Lee historial (array) |
| `saveMovements(movements)` | Persiste historial |
| `addMovement(mov, arr)` | Inserta al inicio y persiste |
| `exportData(...)` | Descarga JSON de respaldo |
| `importData(json)` | Restaura desde JSON |

---

### `ui.js` — Renderizado

Contiene **solo funciones de presentación**. No toca el estado ni el storage directamente.

| Función | Qué renderiza |
|---|---|
| `renderDateBadge()` | Fecha actual en el header |
| `renderStats(inv, prices, movs)` | 4 tarjetas de resumen |
| `renderInventoryTable(inv, prices, query)` | Tabla de stock con filtro |
| `populateSelect(id)` | `<select>` con todos los materiales |
| `populateFilterSelect()` | `<select>` de filtro con opción "Todos" |
| `renderMovements(movs, mat, type)` | Lista del historial filtrado |
| `renderPriceChips(prices, prev)` | Grid de chips con variación % |
| `renderInvoiceItems(items, prices)` | Líneas del formulario de factura |
| `buildInvoiceHTML(opts)` | HTML del tiquete listo para imprimir |
| `showAlert(msg, type)` | Alerta temporal success/error |
| `fmtKg(v)` | Formatea kg/toneladas |
| `fmtCOP(v)` | Formatea en pesos colombianos |

---

### `app.js` — Controlador

Gestiona el **estado global en memoria**, vincula eventos y orquesta las llamadas a `storage.js` y `ui.js`.

**Estado global:**

```js
let state = {
  prices:     {},   // precios vigentes
  prevPrices: {},   // precios anteriores (para mostrar % cambio)
  inventory:  {},   // kg en bodega
  movements:  [],   // historial
  currentMT:  "entrada",  // tipo de movimiento activo
  invItems:   [],   // ítems de la factura en construcción
};
```

**Flujo de un movimiento:**

```
Usuario llena formulario
        ↓
registerMovement() valida kg y stock disponible
        ↓
Muta state.inventory
        ↓
addMovement() → actualiza state.movements + saveMovements()
        ↓
saveInventory() persiste nuevo stock
        ↓
refreshInventoryView() re-renderiza stats + tabla
```

---

## Funcionalidades

### 1. Inventario en tiempo real

- Muestra kg en bodega por cada uno de los 22 materiales.
- Calcula valor estimado total (kg × precio del día).
- Semáforo de estado: **ok** (≥ 100 kg) / **bajo** (< 100 kg) / **sin stock**.
- Búsqueda por nombre de material.

### 2. Registro de entradas y salidas

- Toggle entrada/salida con validación de stock suficiente.
- Precio automático desde la lista del día (editable por movimiento).
- Cálculo en tiempo real del total estimado antes de confirmar.
- Campo de nota libre (número de placa, proveedor, etc.).

### 3. Precios del día

- Lista completa agrupada por categoría.
- Indicador de variación (▲/▼ %) respecto al precio anterior.
- Actualización individual por material.
- **Extensible:** conectar una API de precios de mercado para actualización automática.

### 4. Historial de movimientos

- Registro cronológico con fecha, hora, material, peso y total.
- Filtros por material y tipo (entrada/salida).
- Limpiar historial con confirmación.

### 5. Generación de tiquetes

- Múltiples líneas por tiquete (varios materiales en una sola operación).
- Precio editable por línea o tomado automáticamente del día.
- Vista previa antes de imprimir.
- Impresión optimizada para impresoras térmicas (ancho ≈ 300 px).

---

## Persistencia actual (localStorage)

La versión actual usa `localStorage` del navegador. Apropiada para un solo dispositivo sin necesidad de sincronización.

> [!warning] Limitaciones de localStorage
> | Limitación | Descripción |
> |---|---|
> | ~5 MB de espacio | Suficiente para meses de historial, pero no ilimitado |
> | Sin sincronización | Cada navegador/dispositivo tiene sus propios datos |
> | Sin acceso remoto | El dueño no puede consultar desde el celular |
> | Sin respaldo automático | Si se borra el navegador, se pierden los datos |

**Mitigación actual:** funciones `exportData()` / `importData()` en `storage.js` para respaldos manuales en JSON.

---

## Escalabilidad — bases de datos recomendadas

La arquitectura está diseñada para migrar sin reescribir la lógica de negocio: **solo `storage.js` debe cambiar**.

---

### Nivel 1 — Un local, un equipo, sin internet constante

**Recomendación: SQLite + Electron**

Convierte la app web en una aplicación de escritorio nativa para Windows/macOS/Linux.

```
┌──────────────────────────────────────┐
│           Aplicación Electron        │
│  ┌─────────────────────────────────┐ │
│  │   index.html + css + js         │ │
│  └──────────────┬──────────────────┘ │
│                 │ IPC                │
│  ┌──────────────▼──────────────────┐ │
│  │      main.js (proceso Node)     │ │
│  │      SQLite con better-sqlite3  │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Esquema SQLite sugerido:**

```sql
CREATE TABLE materials (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  cat       TEXT NOT NULL,
  color     TEXT,
  price_today INTEGER NOT NULL,
  price_prev  INTEGER
);

CREATE TABLE inventory (
  material_id TEXT PRIMARY KEY REFERENCES materials(id),
  stock_kg    REAL NOT NULL DEFAULT 0,
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE movements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT NOT NULL CHECK(type IN ('entrada','salida')),
  material_id TEXT NOT NULL REFERENCES materials(id),
  kg          REAL NOT NULL,
  price_kg    INTEGER NOT NULL,
  total       INTEGER NOT NULL,
  note        TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE price_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL REFERENCES materials(id),
  price       INTEGER NOT NULL,
  recorded_at TEXT DEFAULT (datetime('now'))
);
```

> [!tip] Ventaja principal
> Sin internet, rápido, datos locales. Respaldo fácil copiando el archivo `.db`.

---

### Nivel 2 — Un local, acceso desde celular y computador

**Recomendación: Supabase (PostgreSQL gestionado) + API REST**

```
┌──────────────┐     HTTPS      ┌───────────────────────┐
│  Celular     │ ◄────────────► │                       │
│  (navegador) │                │   Supabase (Postgres) │
└──────────────┘                │   - materials         │
┌──────────────┐     HTTPS      │   - inventory         │
│  Computador  │ ◄────────────► │   - movements         │
│  del local   │                │   - price_history     │
└──────────────┘                └───────────────────────┘
```

**Cambios en `storage.js`:** reemplazar `localStorage.getItem/setItem` por llamadas `fetch` a la API REST de Supabase:

```js
// Antes (localStorage)
function loadInventory() {
  return JSON.parse(localStorage.getItem("ms_inventory")) || {};
}

// Después (Supabase REST)
async function loadInventory() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const rows = await res.json();
  return Object.fromEntries(rows.map(r => [r.material_id, r.stock_kg]));
}
```

**Funciones adicionales que habilita Supabase:**

| Función | Descripción |
|---|---|
| `supabase.auth` | Login con email/contraseña para proteger el sistema |
| `supabase.realtime` | El celular ve el cambio de stock al instante |
| `supabase.storage` | Guardar fotos de camiones o comprobantes |
| Row Level Security | Control de quién puede ver/editar cada dato |

---

### Nivel 3 — Múltiples locales, reportes avanzados, facturación electrónica

**Recomendación: PostgreSQL propio + Node.js + Express**

```
┌───────────────────────────────────────────────────────┐
│                    Servidor Node.js                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  /api/inv   │  │  /api/movs  │  │ /api/invoice │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  │
│         └────────────────┼────────────────┘          │
│              ┌───────────▼──────────┐                 │
│              │     PostgreSQL        │                 │
│              │  (múltiples locales)  │                 │
│              └──────────────────────┘                 │
└───────────────────────────────────────────────────────┘
        ▲              ▲               ▲
   Local 1          Local 2        App móvil
```

**Esquema extendido (nuevas tablas):**

```sql
CREATE TABLE locations (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  city  TEXT
);

CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,    -- hash bcrypt
  role        TEXT CHECK(role IN ('admin','operator','viewer')),
  location_id INTEGER REFERENCES locations(id)
);

CREATE TABLE invoices (
  id          SERIAL PRIMARY KEY,
  number      TEXT UNIQUE NOT NULL,
  type        TEXT CHECK(type IN ('compra','venta')),
  client_name TEXT,
  client_id   TEXT,   -- cédula / NIT
  total       INTEGER,
  created_at  TIMESTAMPTZ DEFAULT now(),
  location_id INTEGER REFERENCES locations(id),
  dian_cufe   TEXT    -- código de validación DIAN
);

CREATE TABLE invoice_lines (
  id          SERIAL PRIMARY KEY,
  invoice_id  INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  material_id TEXT REFERENCES materials(id),
  kg          REAL,
  price_kg    INTEGER,
  subtotal    INTEGER
);
```

---

### Tabla comparativa de opciones

| Criterio | localStorage | SQLite + Electron | Supabase | PostgreSQL propio |
|---|---|---|---|---|
| **Costo** | Gratis | Gratis | Gratis / $25 USD/mes | ~$20-50 USD/mes |
| **Sincronización** | No | No | Sí, tiempo real | Sí |
| **Acceso móvil** | No | No | Sí | Sí |
| **Múltiples sedes** | No | No | Sí | Sí |
| **Sin internet** | Sí | Sí | No | No |
| **Respaldo automático** | Manual | Manual | Automático | Configurar pg_dump |
| **Dificultad migración** | — | Baja | Media | Alta |
| **Facturación DIAN** | No | No | Con integración | Con integración |

---

## Hoja de ruta de escalabilidad

```
FASE 1 (hoy)          FASE 2 (próximos meses)     FASE 3 (crecimiento)
─────────────         ─────────────────────────    ─────────────────────
localStorage          Supabase gratuito             PostgreSQL + Node.js
Un equipo             Celular + computador          Múltiples sedes
Manual                Login con contraseña          Roles (admin/operador)
Backup JSON           Backup automático             Factura electrónica DIAN
                      Exportar Excel                Reportes avanzados
                                                    API para básculas digitales
```

> [!note] Migración Fase 1 → Fase 2
> 1. Crear proyecto en Supabase (gratis).
> 2. Ejecutar el SQL del Nivel 2 en el editor de Supabase.
> 3. Reemplazar las 5 funciones de `storage.js` por versiones `async` con `fetch`.
> 4. Subir los archivos a cualquier hosting estático (Netlify, Vercel, GitHub Pages).
> 5. El resto del código (`data.js`, `ui.js`, `app.js`, `index.html`, `styles.css`) **no cambia**.

---

## Cómo agregar un material nuevo

Solo editar `data.js`:

```js
// Agregar al array MATERIALS:
{ id: "zinc", name: "Zinc", cat: "otro", color: "#9FE1CB", price: 5200 },
```

El sistema lo incorporará automáticamente en:
- Tabla de inventario
- Formulario de movimientos
- Lista de precios
- Formulario de factura
- Filtros de historial

Si la categoría no existe, agregarla en `CATEGORIES`:

```js
const CATEGORIES = {
  // ...existentes...
  especial: "Metales especiales",
};
```

---

## Despliegue

### Opción A — Archivo local (sin internet)

Abrir `index.html` directamente en el navegador. Los datos se guardan en el navegador del equipo. Funciona sin conexión.

### Opción B — Servidor local en red interna (LAN)

```bash
# Con Python (instalado en la mayoría de sistemas)
python -m http.server 8080

# Acceder desde celular (en la misma red):
# http://192.168.1.X:8080
```

> [!warning] Nota sobre LAN
> Los datos seguirán siendo locales a cada dispositivo hasta migrar a Supabase.

### Opción C — Hosting gratuito en la nube

```bash
# Con Netlify CLI
npm install -g netlify-cli
netlify deploy --dir=./

# Con Vercel CLI
npm install -g vercel
vercel ./
```

---

*MetalStock Pro — Desarrollado para la gestión de chatarrerías en Colombia.*
*Licencia: uso libre para fines comerciales y personales.*
