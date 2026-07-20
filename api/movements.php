<?php
/**
 * POST /api/movements
 *
 * Registra uno o varios movimientos (entrada/salida).
 * Body: JSON array de movimientos.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(["error" => "Método no permitido"]);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !is_array($input)) {
  http_response_code(400);
  echo json_encode(["error" => "Body inválido. Se espera un array de movimientos."]);
  exit;
}

$now = new DateTime();
$dateStr = $now->format('d/m/Y');
$timeStr = $now->format('H:i');

$pdo->beginTransaction();

try {
  $stmtMat = $pdo->prepare("SELECT m.id, m.nombre, m.activo, i.stock_kg FROM materiales m JOIN inventario i ON i.material_id = m.id WHERE m.id = ?");
  $stmtUpd = $pdo->prepare("UPDATE inventario SET stock_kg = ? WHERE material_id = ?");
  $stmtIns = $pdo->prepare("INSERT INTO movimientos (id, invoice_id, invoice_num, tipo, mat_id, kg, precio, total, nota, fecha, hora, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");

  foreach ($input as $mov) {
    $matId = $mov['mat'];

    $stmtMat->execute([$matId]);
    $mat = $stmtMat->fetch();

    if (!$mat) {
      http_response_code(404);
      echo json_encode(["error" => "Material $matId no encontrado"]);
      exit;
    }

    if (!$mat['activo']) {
      http_response_code(400);
      echo json_encode(["error" => "El material '{$mat['nombre']}' está inactivo. No se pueden registrar movimientos."]);
      exit;
    }

    $stockActual = (float) $mat['stock_kg'];
    $kg = (float) $mov['kg'];
    $tipo = $mov['type'];

    if ($tipo === 'salida' && $kg > $stockActual) {
      http_response_code(400);
      echo json_encode(["error" => "Stock insuficiente para {$mat['nombre']}"]);
      exit;
    }

    $nuevoStock = $tipo === 'entrada' ? $stockActual + $kg : $stockActual - $kg;

    $stmtUpd->execute([$nuevoStock, $matId]);

    $stmtIns->execute([
      $mov['id'] ?? round(microtime(true) * 1000),
      $mov['invoiceId'] ?? null,
      $mov['invoiceNum'] ?? null,
      $tipo,
      $matId,
      $kg,
      (float) ($mov['price'] ?? 0),
      $kg * (float) ($mov['price'] ?? 0),
      $mov['note'] ?? '',
      $mov['date'] ?? $dateStr,
      $mov['time'] ?? $timeStr,
    ]);
  }

  $pdo->commit();
  echo json_encode(["status" => "success"]);
} catch (Exception $e) {
  $pdo->rollBack();
  http_response_code(500);
  echo json_encode(["error" => $e->getMessage()]);
}
