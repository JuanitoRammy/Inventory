<?php
/**
 * config.php — Conexión MySQL vía PDO
 *
 * Las credenciales se leen de variables de entorno o valores fijos.
 * La clave API_KEY se comparte con el frontend para evitar acceso directo.
 */

$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_NAME = getenv('DB_NAME') ?: 'chaterri_pipa';
$DB_USER = getenv('DB_USER') ?: 'chaterri_juan';
$DB_PASS = getenv('DB_PASS') ?: 'rLi(ulW*zheI';

define('API_KEY', getenv('API_KEY') ?: 'pipa2024metalstock');

try {
  $pdo = new PDO(
    "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
    $DB_USER,
    $DB_PASS,
    [
      PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES   => false,
    ]
  );
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(["error" => "Error de conexión a la base de datos"]);
  exit;
}
