#!/bin/bash
# PreToolUse Bash: antes de `git commit`, o mesmo que o CI cobra (ruff, pytest, planejador, terraform) e segredos.
source "$(dirname "$0")/lib.sh"
in=$(cat); cmd=$(json_get command)
[[ $cmd =~ (^|[;&|[:space:]])git[[:space:]]+commit([[:space:]]|$) ]] || exit 0
unset GIT_DIR
r=$(raiz); cd "$r" || exit 0

# o commit pode vir no mesmo comando que o `git add`: conta o staged e o que mudou no working tree
mudados=$( { git diff --cached --name-only; git diff HEAD --name-only; git ls-files --others --exclude-standard; } | sort -u)
[ -z "$mudados" ] && exit 0
problemas=""

if grep -qE '\.py$|^requirements' <<<"$mudados"; then
  if command -v ruff >/dev/null; then out=$(ruff check . 2>&1) || problemas+=$'ruff:\n'"$(head -15 <<<"$out")"$'\n'; fi
  out=$("$(py)" -m pytest -q -x 2>&1) || problemas+=$'pytest falhou:\n'"$(grep -E '^(FAILED|ERROR|E )' <<<"$out" | head -15)"$'\n'
fi
if grep -qE '^rota/' <<<"$mudados"; then
  out=$("$(py)" rota/montar.py --verificar 2>&1) || problemas+="$out"$'\n'
  if command -v node >/dev/null; then
    out=$(node --test rota/test/*.test.js 2>&1) || problemas+=$'testes do planejador:\n'"$( (grep -E '^not ok|AssertionError|expected|actual' <<<"$out" || tail -15 <<<"$out") | head -15)"$'\n'
  fi
fi
if grep -qE '^infra/' <<<"$mudados" && command -v terraform >/dev/null; then
  out=$(terraform -chdir=infra fmt -check 2>&1) || problemas+=$'terraform fmt:\n'"$out"$'\n'
fi

# segredos: padrões conhecidos (AWS, GitHub, Anthropic, chaves privadas, URLs com senha). Só linhas e arquivos novos.
novo=$( git diff HEAD | grep -E '^\+[^+]'; git ls-files --others --exclude-standard -z | xargs -0 cat 2>/dev/null )
suspeitos=$(grep -E 'AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|aws_secret_access_key[[:space:]]*=[[:space:]]*[A-Za-z0-9/+]{40}|sk-ant-[A-Za-z0-9_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[0-9A-Za-z]{36}|(postgres(ql)?|mysql)://[^:/[:space:]]+:[^@[:space:]]+@' <<<"$novo" \
  | grep -vE '@(localhost|127\.0\.0\.1)' | head -1)
[ -n "$suspeitos" ] && problemas+=$'Parece haver uma chave ou URL com senha nas alterações.\n'

sensiveis=$(grep -E '(^|/)\.env(\..*)?$|\.tfstate(\..*)?$|terraform\.tfvars$|\.auto\.tfvars$|(^|/)\.terraform/|(^|/)\.venv/' <<<"$mudados")
[ -n "$sensiveis" ] && problemas+=$'Arquivos que não devem ir para o git:\n'"$sensiveis"$'\n'

[ -z "$problemas" ] && exit 0
printf 'Commit bloqueado:\n%s' "$problemas" >&2
exit 2
