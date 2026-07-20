<?php
/**
 * POST /api/prices
 *
 * Actualiza el precio de un material.
 * Body: { "mat": "cobre1", "price": 42000 }
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(["error" => "Método no permitido"]);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['mat']) || !isset($input['price'])) {
  http_response_code(400);
  echo json_encode(["error" => "Campos requeridos: mat, price"]);
  exit;
}

$matId = $input['mat'];
$price = (float) $input['price'];

// Verificar que el material existe y está activo
$check = $pdo->prepare("SELECT id, activo FROM materiales WHERE id = ?");
$check->execute([$matId]);
$mat = $check->fetch();
if (!$mat) {
  http_response_code(404);
  echo json_encode(["error" => "Material no encontrado"]);
  exit;
}
if (!$mat['activo']) {
  http_response_code(400);
  echo json_encode(["error" => "Material inactivo. No se puede actualizar precio."]);
  exit;
}

$stmt = $pdo->prepare("UPDATE materiales SET precio_anterior = precio_actual, precio_actual = ? WHERE id = ?");
$stmt->execute([$price, $matId]);

echo json_encode(["status" => "success"]);
