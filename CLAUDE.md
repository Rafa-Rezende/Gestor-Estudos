# Gestor de Estudos

Projeto da disciplina **DevOps na prática** (PUC-RS Online) do Rafael, que também é o sistema que ele usa de verdade para organizar os estudos. Produto, usuário e regras de texto no [PRODUCT.md](PRODUCT.md).

Duas partes:

- **API da Fase 1** (`estudos/`, `web/`, `infra/`, CI): FastAPI que calcula a porcentagem concluída, página simples, testes, GitHub Actions e um bucket S3 por Terraform. **Já entregue**: o `main` é o que o professor avalia.
- **Rota de Estudos** (`rota/`): o app completo (planejador das aulas em partes de 30 min, imprevistos, turnos da pizzaria, prazos, treino de código, sincronização com o iPhone), publicado como artefato no claude.ai. Detalhes na skill `/rota`.

## Estrutura

- `estudos/`: `plano.py` (contas), `api.py` (FastAPI: `/` serve `web/index.html`, `/percentagem`), `app.py` (versão de terminal).
- `web/index.html`: página da Fase 1.
- `rota/src/`: `pagina.html` (CSS e estrutura), `planejador.js` (função pura), `app.js` (telas e banco). `rota/montar.py` gera `rota/index.html` (não editar à mão). `rota/test/`: testes do planejador.
- `tests/`: pytest. `infra/`: Terraform (AWS, `us-east-1`).

## Comandos

- Ambiente: `python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt`.
- Lint: `ruff check .` · Testes: `.venv/bin/python -m pytest -q` (< 1 s).
- Planejador: `node --test rota/test/*.test.js` · Montar o artefato: `python3 rota/montar.py` (`--verificar` só confere).
- API local: `.venv/bin/uvicorn estudos.api:app --port 8000`, sempre com `run_in_background: true`.
- Terraform: `terraform -chdir=infra fmt -check` / `validate` / `plan`. `apply` e `destroy` só com pedido explícito.

## CI

`.github/workflows/ci.yml` roda em push no `main` e em pull requests: ruff, pytest (inclui o teste de montagem do artefato), testes do planejador no Node, e `terraform fmt`/`init -backend=false`/`validate`. Push numa branch sem PR não roda o CI.

## Regras

- O `main` é a entrega da Fase 1: trabalho novo em branch; push no `main` só com pedido explícito do usuário.
- Texto do código, commits e telas em **português do Brasil**.
- Nada de credencial da AWS, `.env`, `*.tfstate` ou `terraform.tfvars` no git (o repositório é público).
- Mudou o planejador → teste em `rota/test/`. Mudou `estudos/` → teste em `tests/`.
- O Rota é um arquivo HTML único: CDN só `cdnjs`/`jsdelivr`/`unpkg`, fontes só do Google Fonts, sem `alert`/`confirm`, dados no banco do artefato (não no `localStorage`, que guarda só o tema por aparelho).
- Tema padrão do Rota: papel claro (caderno pastel). O escuro é opção do usuário.

## Ferramentas do projeto (`.claude/`)

- Hooks: checam cada arquivo editado (`py_compile` + `ruff`, `node --check`, `terraform fmt`) e remontam o `rota/index.html`; antes de cada `git commit` rodam ruff, pytest, testes do planejador e procura de segredos; bloqueiam servidor em primeiro plano, push forçado, push no `main`, `terraform apply`/`destroy` e credenciais da AWS no terminal; protegem `rota/index.html`, `.env`, tfstate e tfvars.
- Skills: `/preflight` (está pronto?), `/rever` (revisão com agentes), `/publicar` (commit, push da branch, CI e republicar o artefato; só o usuário chama), `/rota` (o app, o banco, o planejador e o atalho do iPhone).
- Agentes: `estudos-revisor` (bugs), `estudos-planejador` (lógica do plano), `estudos-devops` (CI, Terraform, Fase 2), `estudos-seguranca` (AWS, segredos, artefato), `estudos-texto` (texto da tela), `estudos-testes` (escreve testes).
