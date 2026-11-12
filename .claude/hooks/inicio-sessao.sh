#!/bin/bash
# SessionStart: o estado do projeto em poucas linhas, para não gastar comandos descobrindo.
cd "${CLAUDE_PROJECT_DIR:-$PWD}" || exit 0
unset GIT_DIR
echo "## Estado do Gestor de Estudos"
ramo=$(git branch --show-current)
echo "- Branch: $ramo · último commit: $(git log -1 --format='%h %s' | cut -c1-90)"
[ "$ramo" = "main" ] && echo "- Atenção: o main é a entrega da Fase 1 de DevOps. Mudanças vão numa branch."
afrente=$(git rev-list --count "origin/$ramo..HEAD" 2>/dev/null || git rev-list --count origin/main..HEAD 2>/dev/null)
[ "${afrente:-0}" -gt 0 ] && echo "- $afrente commit(s) ainda não enviados"
mudados=$(git status --short | head -15)
[ -n "$mudados" ] && { echo "- Não gravado:"; sed 's/^/    /' <<<"$mudados"; }
[ -x .venv/bin/python ] || echo "- Falta o .venv: python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt"
command -v node >/dev/null || echo "- Falta o Node (testes do planejador em rota/test/)"
command -v terraform >/dev/null || echo "- Sem terraform nesta máquina: fmt/validate de infra/ só no CI"
python3 rota/montar.py --verificar >/dev/null 2>&1 || echo "- rota/index.html desatualizado: python3 rota/montar.py"
exit 0
