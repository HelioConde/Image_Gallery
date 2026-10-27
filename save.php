<?php
declare(strict_types=1);

/**
 * Image Gallery: receives selection metadata only, never uploads image bytes.
 * Configure GALLERY_STORAGE_DIR to an existing, writable directory OUTSIDE webroot.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $status, string $message, array $extra = []): never {
    http_response_code($status);
    echo json_encode(array_merge(['message' => $message], $extra), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function outside(string $dir, string $base): bool {
    $base = rtrim($base, DIRECTORY_SEPARATOR);
    return $dir !== $base && !str_starts_with($dir . DIRECTORY_SEPARATOR, $base . DIRECTORY_SEPARATOR);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, 'Método não permitido.');
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) {
    reply(413, 'Requisição muito grande.');
}
$type = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($type !== 'application/x-www-form-urlencoded' && $type !== 'multipart/form-data') {
    reply(415, 'Formato de solicitação não suportado.');
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $host = parse_url($origin, PHP_URL_HOST);
    $requestHost = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
    if (!$host || strcasecmp($host, $requestHost) !== 0) {
        reply(403, 'Origem não permitida.');
    }
}
if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
    reply(403, 'Origem não permitida.');
}

$storageOption = getenv('GALLERY_STORAGE_DIR');
$storage = is_string($storageOption) && $storageOption !== '' ? realpath($storageOption) : false;
$publicRoot = realpath(__DIR__);
$documentRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? __DIR__);
if ($storage === false || !is_dir($storage) || !is_writable($storage)
    || !outside($storage, $publicRoot)
    || ($documentRoot !== false && !outside($storage, $documentRoot))) {
    reply(503, 'Registro indisponível. Configure um diretório privado fora do site.');
}
$rawName = $_POST['nome'] ?? null;
$rawSelection = $_POST['selected'] ?? null;
if (!is_string($rawName) || !is_array($rawSelection)) {
    reply(422, 'Informe seu nome e escolha pelo menos uma fotografia.');
}
$name = trim(preg_replace('/\s+/u', ' ', $rawName) ?? '');
if (strlen($name) > 240 || !preg_match("/\A[\p{L}\p{M}\p{N} .'\-]{2,80}\z/u", $name)) {
    reply(422, 'Nome inválido. Use entre 2 e 80 caracteres.');
}
if (count($rawSelection) < 1 || count($rawSelection) > 50) {
    reply(422, 'Selecione entre 1 e 50 imagens.');
}
$catalogJson = @file_get_contents(__DIR__ . '/images.json');
$catalog = is_string($catalogJson) ? json_decode($catalogJson, true) : null;
if (!is_array($catalog)) {
    reply(503, 'Catálogo indisponível.');
}
$allowed = [];
foreach ($catalog as $photo) {
    if (is_array($photo) && isset($photo['id']) && is_string($photo['id'])) {
        $allowed[$photo['id']] = true;
    }
}
$selected = [];
foreach ($rawSelection as $id) {
    if (!is_string($id) || !isset($allowed[$id]) || isset($selected[$id])) {
        reply(422, 'Seleção inválida ou duplicada.');
    }
    $selected[$id] = true;
}
$record = [
    'id' => bin2hex(random_bytes(16)),
    'name' => $name,
    'selected' => array_keys($selected),
    'created_at' => gmdate('c')
];
$json = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if (!is_string($json)) {
    reply(500, 'Falha ao preparar o registro.');
}
$path = $storage . DIRECTORY_SEPARATOR . $record['id'] . '.json';
$file = @fopen($path, 'x');
if ($file === false) {
    reply(500, 'Não foi possível registrar sua seleção.');
}
$written = fwrite($file, $json . "\n");
fclose($file);
if ($written !== strlen($json) + 1) {
    @unlink($path);
    reply(500, 'Não foi possível registrar sua seleção.');
}
reply(201, 'Seleção registrada com sucesso.', ['id' => $record['id'], 'count' => count($selected)]);
