<?php
/**
 * CRUD /api/materials
 *
 * GET    ?id=      — listar (todos o uno)
 * POST            — crear   { name, cat, color?, unit }
 * PUT    ?id=      — actualizar { name?, cat?, color?, unit? }
 * DELETE ?id=      — eliminar
 */

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

  /* ── LISTAR ─────────────────────────────────────────────── */
  case 'GET':
    if (!empty($_GET['id'])) {
      $stmt = $pdo->prepare("SELECT id, nombre AS name, cat, color, precio_actual AS price, unidad AS `unit`, activo AS `active` FROM materiales WHERE id = ?");
      $stmt->execute([$_GET['id']]);
      $mat = $stmt->fetch();
      if (!$mat) {
        http_response_code(404);
        echo json_encode(["error" => "Material no encontrado"]);
        exit;
      }
      $mat['price']  = (float) $mat['price'];
      $mat['active'] = (bool) $mat['active'];
      echo json_encode($mat);
    } else {
      $stmt = $pdo->query("SELECT id, nombre AS name, cat, color, precio_actual AS price, unidad AS `unit`, activo AS `active` FROM materiales ORDER BY nombre");
      $rows = $stmt->fetchAll();
      echo json_encode(array_map(fn($r) => [
        'id'    => $r['id'],
        'name'  => $r['name'],
        'cat'   => $r['cat'],
        'color' => $r['color'],
        'price' => (float) $r['price'],
        'unit'  => $r['unit'],
        'active'=> (bool) $r['active'],
      ], $rows));
    }
    break;

  /* ── CREAR ──────────────────────────────────────────────── */
  case 'POST':
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['name']) || empty($input['cat'])) {
      http_response_code(400);
      echo json_encode(["error" => "Campos requeridos: name, cat"]);
      exit;
    }

    $id = $input['id'] ?? strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '_', $input['name']), '_'));
    $color = $input['color'] ?? '#6B7280';
    $unit  = ($input['unit'] ?? 'kg') === 'und' ? 'und' : 'kg';

    // Validar categoría
    $checkCat = $pdo->prepare("SELECT id FROM categorias WHERE id = ?");
    $checkCat->execute([$input['cat']]);
    if (!$checkCat->fetch()) {
      http_response_code(400);
      echo json_encode(["error" => "Categoría no existe"]);
      exit;
    }

    // Verificar id único
    $checkId = $pdo->prepare("SELECT id FROM materiales WHERE id = ?");
    $checkId->execute([$id]);
    if ($checkId->fetch()) {
      http_response_code(409);
      echo json_encode(["error" => "El ID '$id' ya existe. Especifica un id distinto."]);
      exit;
    }

    $pdo->beginTransaction();
    try {
      $stmt = $pdo->prepare("INSERT INTO materiales (id, nombre, cat, color, precio_actual, precio_anterior, unidad, activo) VALUES (?, ?, ?, ?, 0, 0, ?, 1)");
      $stmt->execute([$id, $input['name'], $input['cat'], $color, $unit]);

      $stmtInv = $pdo->prepare("INSERT INTO inventario (material_id, stock_kg) VALUES (?, 0)");
      $stmtInv->execute([$id]);

      $pdo->commit();
      echo json_encode(["status" => "success", "material" => [
        'id'    => $id,
        'name'  => $input['name'],
        'cat'   => $input['cat'],
        'color' => $color,
        'price' => 0,
        'unit'  => $unit,
      ]]);
    } catch (Exception $e) {
      $pdo->rollBack();
      http_response_code(500);
      echo json_encode(["error" => $e->getMessage()]);
    }
    break;

  /* ── ACTUALIZAR ─────────────────────────────────────────── */
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

    // Construir SET dinámico
    $fields = [];
    $params = [];
    if (isset($input['name']))   { $fields[] = "nombre = ?";  $params[] = $input['name']; }
    if (isset($input['cat']))    { $fields[] = "cat = ?";     $params[] = $input['cat']; }
    if (isset($input['color']))  { $fields[] = "color = ?";   $params[] = $input['color']; }
    if (isset($input['unit']))   { $fields[] = "unidad = ?";  $params[] = $input['unit'] === 'und' ? 'und' : 'kg'; }
    if (isset($input['active'])) { $fields[] = "activo = ?";  $params[] = $input['active'] ? 1 : 0; }

    if (empty($fields)) {
      echo json_encode(["status" => "success", "message" => "Sin cambios"]);
      exit;
    }

    $params[] = $id;
    $stmt = $pdo->prepare("UPDATE materiales SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
      http_response_code(404);
      echo json_encode(["error" => "Material no encontrado"]);
      exit;
    }

    echo json_encode(["status" => "success"]);
    break;

  /* ── INACTIVAR (soft delete) ────────────────────────────── */
  case 'DELETE':
    $id = $_GET['id'] ?? '';
    if (!$id) {
      http_response_code(400);
      echo json_encode(["error" => "Se requiere ?id="]);
      exit;
    }

    // Verificar stock — rechazar si tiene inventario positivo
    $checkStock = $pdo->prepare("SELECT stock_kg FROM inventario WHERE material_id = ?");
    $checkStock->execute([$id]);
    $stockRow = $checkStock->fetch();
    if ($stockRow && (float) $stockRow['stock_kg'] > 0) {
      http_response_code(409);
      echo json_encode(["error" => "No se puede inactivar: el material tiene {$stockRow['stock_kg']} kg en inventario. Ajusta el stock a 0 primero."]);
      exit;
    }

    // Soft delete: marcar como inactivo
    $stmt = $pdo->prepare("UPDATE materiales SET activo = 0 WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
      http_response_code(404);
      echo json_encode(["error" => "Material no encontrado"]);
      exit;
    }

    echo json_encode(["status" => "success", "message" => "Material inactivado"]);
    break;

  default:
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido"]);
}
