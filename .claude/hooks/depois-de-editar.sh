#!/bin/bash
# PostToolUse Edit|Write: checagem rápida só do que mudou. Calado quando está tudo bem; erros voltam ao Claude.
source "$(dirname "$0")/lib.sh"
in=$(cat); f=$(json_get file_path)
r=$(raiz)
case "$f" in
  *.py)
    out=$("$(py)" -m py_compile "$f" 2>&1) || bloquear "$(tail -8 <<<"$out")"
    if command -v ruff >/dev/null; then out=$(cd "$r" && ruff check "$f" 2>&1) || bloquear "ruff:
$(head -20 <<<"$out")"; fi ;;
  */rota/src/*)
    if [[ $f == *.js ]]; then out=$(node --check "$f" 2>&1) || bloquear "$(head -10 <<<"$out")"; fi
    # o artefato é um arquivo só: remonta para o index.html nunca ficar para trás
    out=$("$(py)" "$r/rota/montar.py" 2>&1) || bloquear "montar.py: $out" ;;
  */infra/*.tf)
    if command -v terraform >/dev/null; then out=$(terraform -chdir="$r/infra" fmt -check -diff 2>&1) || bloquear "terraform fmt (rode terraform -chdir=infra fmt):
$(head -20 <<<"$out")"; fi ;;
esac
exit 0
