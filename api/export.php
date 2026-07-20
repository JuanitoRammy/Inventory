<?php
/**
 * GET /api/export
 *
 * Exporta toda la base de datos como JSON descargable.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(["error" => "Método no permitido"]);
  exit;
}

// Precios
$stmt = $pdo->query("SELECT id, precio_actual, precio_anterior FROM materiales");
$prices = [];
$prevPrices = [];
foreach ($stmt as $m) {
  $prices[$m['id']]     = (float) $m['precio_actual'];
  $prevPrices[$m['id']] = (float) $m['precio_anterior'];
}

// Inventario
$stmt = $pdo->query("SELECT material_id, stock_kg FROM inventario");
$inventory = [];
foreach ($stmt as $m) {
  $inventory[$m['material_id']] = (float) $m['stock_kg'];
}

// Movimientos
$stmt = $pdo->query("SELECT * FROM movimientos ORDER BY id DESC");
$movements = $stmt->fetchAll();

$payload = json_encode([
  "prices"     => (object) $prices,
  "prevPrices" => (object) $prevPrices,
  "inventory"  => (object) $inventory,
  "movements"  => $movements,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

header('Content-Type: application/json');
header('Content-Disposition: attachment; filename="metalstock-backup-' . date('Y-m-d') . '.json"');
echo $payload;
