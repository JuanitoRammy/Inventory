<?php
/**
 * GET /api/state
 *
 * Devuelve el estado completo: precios, precios anteriores,
 * inventario y movimientos.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(["error" => "Método no permitido"]);
  exit;
}

// Materiales (catálogo con metadata)
$stmt = $pdo->query("SELECT id, nombre, cat, color, precio_actual, precio_anterior, unidad, activo FROM materiales");
$allMats = $stmt->fetchAll();

$materials = [];
$prices     = [];
$prevPrices = [];

foreach ($allMats as $m) {
  $materials[] = [
    'id'    => $m['id'],
    'name'  => $m['nombre'],
    'cat'   => $m['cat'],
    'color' => $m['color'],
    'price' => (float) $m['precio_actual'],
    'unit'  => $m['unidad'],
    'active'=> (bool) $m['activo'],
  ];
  $prices[$m['id']]     = (float) $m['precio_actual'];
  $prevPrices[$m['id']] = (float) $m['precio_anterior'];
}

// Categorías
$stmt = $pdo->query("SELECT id, nombre FROM categorias");
$categories = [];
foreach ($stmt as $c) {
  $categories[$c['id']] = $c['nombre'];
}

// Inventario
$inventory = [];
$stmt = $pdo->query("SELECT material_id, stock_kg FROM inventario");
foreach ($stmt as $row) {
  $inventory[$row['material_id']] = (float) $row['stock_kg'];
}

// Movimientos
$stmt = $pdo->query("SELECT * FROM movimientos ORDER BY id DESC");
$rows = $stmt->fetchAll();

$movements = array_map(function ($m) {
  return [
    'id'         => (int) $m['id'],
    'invoiceId'  => $m['invoice_id'] !== null ? (float) $m['invoice_id'] : null,
    'invoiceNum' => $m['invoice_num'],
    'type'       => $m['tipo'],
    'mat'        => $m['mat_id'],
    'kg'         => (float) $m['kg'],
    'price'      => (float) $m['precio'],
    'total'      => (float) $m['total'],
    'note'       => $m['nota'],
    'date'       => $m['fecha'],
    'time'       => $m['hora'],
  ];
}, $rows);

echo json_encode([
  "materials"  => $materials,
  "categories" => (object) $categories,
  "prices"     => (object) $prices,
  "prevPrices" => (object) $prevPrices,
  "inventory"  => (object) $inventory,
  "movements"  => $movements,
]);
