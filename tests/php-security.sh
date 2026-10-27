#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
PRIVATE="$TMP/private"
mkdir -p "$PRIVATE"
cleanup() { kill "${SERVER_A:-}" "${SERVER_B:-}" 2>/dev/null || true; rm -rf "$TMP"; }
trap cleanup EXIT

php -l "$ROOT/save.php"
GALLERY_STORAGE_DIR="$PRIVATE" php -S 127.0.0.1:8765 -t "$ROOT" >"$TMP/server-a.log" 2>&1 &
SERVER_A=$!
env -u GALLERY_STORAGE_DIR php -S 127.0.0.1:8766 -t "$ROOT" >"$TMP/server-b.log" 2>&1 &
SERVER_B=$!

for x in $(seq 1 30); do
  if curl -s -o /dev/null http://127.0.0.1:8765/images.json && curl -s -o /dev/null http://127.0.0.1:8766/images.json; then break; fi
  sleep 0.2
done
request() {
  local expected="$1"; shift
  local status
  status=$(curl -sS -o "$TMP/response.json" -w '%{http_code}' "$@")
  if [ "$status" != "$expected" ]; then
    echo "HTTP esperado $expected; recebido $status. Corpo:"
    cat "$TMP/response.json"
    exit 1
  fi
}
request 405 http://127.0.0.1:8765/save.php
request 503 -X POST -F 'nome=Pessoa Teste' -F 'selected[]=foto-1' http://127.0.0.1:8766/save.php
request 201 -X POST -F 'nome=Maria Teste' -F 'selected[]=foto-1' -F 'selected[]=foto-3' http://127.0.0.1:8765/save.php
php -r '
$files = glob($argv[1] . "/*.json");
if (count($files) !== 1) { fwrite(STDERR, "Registro privado ausente.\n"); exit(1); }
$data = json_decode(file_get_contents($files[0]), true);
if ($data["name"] !== "Maria Teste" || $data["selected"] !== ["foto-1", "foto-3"]) { fwrite(STDERR, "Registro inválido.\n"); exit(1); }
if (!preg_match("/^[0-9a-f]{32}\.json$/", basename($files[0]))) { fwrite(STDERR, "Nome inseguro.\n"); exit(1); }
' "$PRIVATE"
request 422 -X POST -F 'nome=../../site' -F 'selected[]=foto-1' http://127.0.0.1:8765/save.php
request 422 -X POST -F 'nome=Pessoa Teste' -F 'selected[]=foto-999' http://127.0.0.1:8765/save.php
request 422 -X POST -F 'nome=Pessoa Teste' -F 'selected[]=foto-1' -F 'selected[]=foto-1' http://127.0.0.1:8765/save.php
request 403 -X POST -H 'Origin: https://evil.example' -F 'nome=Pessoa Teste' -F 'selected[]=foto-1' http://127.0.0.1:8765/save.php
request 415 -X POST -H 'Content-Type: application/json' --data '{"nome":"Pessoa Teste"}' http://127.0.0.1:8765/save.php
request 413 -X POST --data-urlencode "nome=$(printf '%09000d' 0)" http://127.0.0.1:8765/save.php
count=$(find "$PRIVATE" -maxdepth 1 -name '*.json' | wc -l | tr -d ' ')
[ "$count" = 1 ] || { echo "Testes inválidos gravaram arquivos!"; exit 1; }
echo "PASS: endpoint privado, validação, método, origem, tamanho e catálogo"
