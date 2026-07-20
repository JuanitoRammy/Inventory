<?php
/**
 * POST /api/import
 *
 * Importa un backup JSON completo y sobreescribe la base de datos.
 * Body: JSON con { prices, prevPrices, inventory, movements }
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(["error" => "Método no permitido"]);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['prices']) || !isset($input['inventory']) || !isset($input['movements'])) {
  http_response_code(400);
  echo json_encode(["error" => "JSON inválido. Se requieren: prices, inventory, movements"]);
  exit;
}

$pdo->beginTransaction();

try {
  // Actualizar precios
  $stmtPrice = $pdo->prepare("UPDATE materiales SET precio_anterior = precio_actual, precio_actual = ? WHERE id = ?");
  foreach ($input['prices'] as $id => $price) {
    $stmtPrice->execute([(float) $price, $id]);
  }

  // Actualizar precios anteriores
  if (isset($input['prevPrices'])) {
    $stmtPrev = $pdo->prepare("UPDATE materiales SET precio_anterior = ? WHERE id = ?");
    foreach ($input['prevPrices'] as $id => $price) {
      $stmtPrev->execute([(float) $price, $id]);
    }
  }

  // Actualizar inventario
  $stmtInv = $pdo->prepare("UPDATE inventario SET stock_kg = ? WHERE material_id = ?");
  foreach ($input['inventory'] as $id => $kg) {
    $stmtInv->execute([(float) $kg, $id]);
  }

  // Reemplazar movimientos
  $pdo->exec("DELETE FROM movimientos");
  if (!empty($input['movements'])) {
    $stmtMov = $pdo->prepare("INSERT INTO movimientos (id, invoice_id, invoice_num, tipo, mat_id, kg, precio, total, nota, fecha, hora, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
    foreach ($input['movements'] as $m) {
      $stmtMov->execute([
        $m['id'],
        $m['invoiceId'] ?? null,
        $m['invoiceNum'] ?? null,
        $m['type'],
        $m['mat'],
        (float) $m['kg'],
        (float) $m['price'],
        (float) $m['total'],
        $m['note'] ?? '',
        $m['date'] ?? '',
        $m['time'] ?? '',
      ]);
    }
  }

  $pdo->commit();
  echo json_encode(["status" => "success", "message" => "Datos importados correctamente"]);
} catch (Exception $e) {
  $pdo->rollBack();
  http_response_code(500);
  echo json_encode(["error" => $e->getMessage()]);
}
