#!/bin/bash
# Funções usadas pelos hooks. Uso: source lib.sh; in=$(cat); f=$(json_get file_path)
json_get() {
  if command -v jq >/dev/null; then jq -r ".tool_input.$1 // empty" <<<"$in"
  else python3 -c 'import sys,json;v=json.load(sys.stdin).get("tool_input",{}).get(sys.argv[1]);print("" if v is None else str(v).lower() if isinstance(v,bool) else v)' "$1" <<<"$in"; fi
}
raiz() { echo "${CLAUDE_PROJECT_DIR:-$PWD}"; }
bloquear() { echo "$1" >&2; exit 2; }
# Python do projeto: o .venv se existir (é o que o CI instala), senão o do sistema
py() { local r; r=$(raiz); if [ -x "$r/.venv/bin/python" ]; then echo "$r/.venv/bin/python"; else echo python3; fi; }
