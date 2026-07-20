<?php
/**
 * index.php — Router principal de la API
 *
 * Uso: index.php?route=state&key=...
 *      index.php?route=movements&key=...
 *      index.php?route=prices&key=...
 *      index.php?route=export&key=...
 *      index.php?route=import&key=...
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

require_once __DIR__ . '/config.php';

// Validar clave API
$key = $_GET['key'] ?? '';
if ($key !== API_KEY) {
  http_response_code(403);
  echo json_encode(["error" => "Acceso denegado"]);
  exit;
}

$route = $_GET['route'] ?? '';
$route = rtrim($route, '/');

switch ($route) {
  case 'state':
    require __DIR__ . '/state.php';
    break;
  case 'movements':
    require __DIR__ . '/movements.php';
    break;
  case 'prices':
    require __DIR__ . '/prices.php';
    break;
  case 'export':
    require __DIR__ . '/export.php';
    break;
  case 'import':
    require __DIR__ . '/import.php';
    break;
  case 'materials':
    require __DIR__ . '/materials.php';
    break;
  case 'categories':
    require __DIR__ . '/categories.php';
    break;
  default:
    http_response_code(404);
    echo json_encode(["error" => "Endpoint no encontrado"]);
}
