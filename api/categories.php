<?php
/**
 * CRUD /api/categories
 *
 * GET          — listar todas
 * POST         — crear   { name }
 * PUT   ?id=    — actualizar { name }
 * DELETE ?id=   — eliminar (solo si sin materiales)
 */

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

  case 'GET':
    $stmt = $pdo->query("SELECT id, nombre, activo FROM categorias ORDER BY nombre");
    $rows = $stmt->fetchAll();
    echo json_encode(array_map(fn($r) => [
      'id'     => $r['id'],
      'nombre' => $r['nombre'],
      'activo' => (bool) $r['activo'],
    ], $rows));
    break;

  case 'POST':
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['name'])) {
      http_response_code(400);
      echo json_encode(["error" => "Campo requerido: name"]);
      exit;
    }

    $id = $input['id'] ?? strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '_', $input['name']), '_'));
    if (!$id) {
      http_response_code(400);
      echo json_encode(["error" => "ID inválido"]);
      exit;
    }

    $check = $pdo->prepare("SELECT id FROM categorias WHERE id = ?");
    $check->execute([$id]);
    if ($check->fetch()) {
      http_response_code(409);
      echo json_encode(["error" => "La categoría '$id' ya existe"]);
      exit;
    }

    $stmt = $pdo->prepare("INSERT INTO categorias (id, nombre, activo) VALUES (?, ?, 1)");
    $stmt->execute([$id, $input['name']]);
    echo json_encode(["status" => "success", "category" => ["id" => $id, "name" => $input['name']]]);
    break;

  case 'PUT':
    $id = $_GET['id'] ?? '';
    if (!$id) {
      http_response_code(400);
      echo json_encode(["error" => "Se requiere ?id="]);
      exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
      http_response_code(400);
      echo json_encode(["error" => "Body inválido"]);
      exit;
    }

    $fields = [];
    $params = [];
    if (isset($input['name']))   { $fields[] = "nombre = ?"; $params[] = $input['name']; }
    if (isset($input['activo'])) { $fields[] = "activo = ?"; $params[] = $input['activo'] ? 1 : 0; }

    if (empty($fields)) {
      echo json_encode(["status" => "success", "message" => "Sin cambios"]);
      exit;
    }

    $params[] = $id;
    $stmt = $pdo->prepare("UPDATE categorias SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
      http_response_code(404);
      echo json_encode(["error" => "Categoría no encontrada"]);
      exit;
    }
    echo json_encode(["status" => "success"]);
    break;

  case 'DELETE':
    $id = $_GET['id'] ?? '';
    if (!$id) {
      http_response_code(400);
      echo json_encode(["error" => "Se requiere ?id="]);
      exit;
    }

    // Verificar materiales activos asociados
    $checkMat = $pdo->prepare("SELECT COUNT(*) AS cnt FROM materiales WHERE cat = ? AND activo = 1");
    $checkMat->execute([$id]);
    $matCount = (int) $checkMat->fetch()['cnt'];
    if ($matCount > 0) {
      http_response_code(409);
      echo json_encode(["error" => "No se puede inactivar: $matCount material(es) activos usan esta categoría. Inactívalos primero."]);
      exit;
    }

    $stmt = $pdo->prepare("UPDATE categorias SET activo = 0 WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
      http_response_code(404);
      echo json_encode(["error" => "Categoría no encontrada"]);
      exit;
    }
    echo json_encode(["status" => "success", "message" => "Categoría inactivada"]);
    break;

  default:
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
}
