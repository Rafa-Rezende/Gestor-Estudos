---
name: preflight
description: Checagem completa antes de gravar ou enviar alterações do Gestor de Estudos (ruff, pytest, testes do planejador, montagem do artefato, terraform, segredos, escopo, documentação). Usar antes de git commit/push, antes de /publicar, ou quando perguntarem "está pronto?".
---
Base: o que ainda não está no remoto da branch atual (`git diff origin/<branch>` ou, se a branch é nova, `git diff origin/main`) e `git status --short`.

Na ordem. Se um passo falhar: corrija, repita esse passo, siga.

1. **Lint**: `ruff check .` (o CI roda o mesmo). Sem avisos.
2. **Testes Python**: `.venv/bin/python -m pytest -q`. Tudo verde. Lógica nova em `estudos/` sem teste → escreva (agente `estudos-testes`) ou aponte a falta.
3. **Planejador**: `node --test rota/test/*.test.js`. Mudou `rota/src/planejador.js` sem teste novo cobrindo o caso → escreva ou aponte.
4. **Artefato**: `python3 rota/montar.py --verificar`. `rota/index.html` igual ao que sai de `rota/src/`.
5. **Terraform** (se mexeu em `infra/` e há `terraform` na máquina): `terraform -chdir=infra fmt -check` e `terraform -chdir=infra init -backend=false && terraform -chdir=infra validate`. Sem terraform aqui → diga que só o CI vai checar.
6. **CI**: mudou `.github/workflows/` → o YAML é válido (`python3 -c "import yaml,sys;yaml.safe_load(open(sys.argv[1]))" <arquivo>` se houver PyYAML) e cada passo novo roda local também.
7. **Limpeza** no diff: sem `print(` de depuração em `estudos/`, sem `console.log` em `rota/src`, sem código comentado, sem `.only`/`skip` esquecidos.
8. **Segredos e arquivos**: nada de `.env`, `*.tfstate`, `terraform.tfvars`, `.terraform/`, chaves da AWS (`AKIA…`), tokens.
9. **Escopo**: o diff só tem o que é desta tarefa. O que for alheio → diga ao usuário, não grave escondido.
10. **Documentação**: `CLAUDE.md`, `PRODUCT.md` ou `rota/README.md` ficaram errados com esta mudança (comandos, estrutura, coleções do banco)? Atualize.

Relatório, uma linha por passo: `✅ passo` ou `❌ passo — o que falta`. Termine com PRONTO ou NÃO PRONTO.
