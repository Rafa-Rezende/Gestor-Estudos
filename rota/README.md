# Rota de Estudos

App de planejamento de estudos publicado como artefato no claude.ai: https://claude.ai/artifact/LazjqpYBaArfHZSXkLo4tj (privado).

- `src/pagina.html`: título, fontes, CSS (tokens do tema caderno, claro e escuro) e a estrutura fixa.
- `src/planejador.js`: `RotaPlanner.buildPlan(estado, agora)`, função pura que transforma as partes que faltam, a rotina e os imprevistos em sessões com data e hora.
- `src/app.js`: telas (Início, Agenda, Matérias, Prazos, Trilhas, Rotina, iPhone), banco do artefato, imprevistos e replanejamento.
- `montar.py`: junta as três partes em `index.html`, o arquivo que vai para o claude.ai.
- `test/`: testes do planejador (`node --test rota/test/*.test.js`).

O `index.html` é gerado: edite `src/` e rode `python3 rota/montar.py`. O teste `tests/test_rota_montagem.py` falha se ele ficar desatualizado.

Fora do claude.ai a página abre, mas mostra "Abra esta página no claude.ai": o banco vem da capability `db` do artefato. Formato do banco, regras do planejador e como republicar: `.claude/skills/rota/SKILL.md`.
