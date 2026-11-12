---
name: rever
description: Revisão do código alterado no Gestor de Estudos (bugs, lógica do planejador, CI/Terraform, segurança, texto da tela) com os agentes especializados em paralelo. Usar quando pedirem para revisar alterações, um commit ou um intervalo de commits.
---
1. **Alvo**:
   - Commit ou intervalo dado (`/rever HEAD~3`, `/rever abc123`) → esse intervalo até `HEAD`.
   - Senão → o que não está no remoto (`git diff origin/main` numa branch nova, `git diff origin/<branch>` numa que já existe) mais o não gravado.
   - Nada mudou → diga e pare.
2. **Intenção**: leia as mensagens de commit do intervalo. Revise contra o que a mudança diz que faz.
3. **Em paralelo**, numa mensagem só, passando a cada agente a lista de arquivos e a intenção:
   - `estudos-revisor`: sempre.
   - `estudos-planejador`: só se o diff mexe em `rota/src/planejador.js`, nas funções de datas/replanejamento de `rota/src/app.js` (`replan`, `planStatus`, `isPast`, `dayExtras`) ou nos padrões de rotina (`DEFAULTS`).
   - `estudos-devops`: só se o diff mexe em `.github/workflows/`, `infra/`, `Dockerfile`, `requirements*.txt` ou na forma de rodar/publicar a API.
   - `estudos-seguranca`: só se o diff mexe em `infra/`, endpoints de `estudos/api.py`, variáveis de ambiente, regras do banco do artefato (`capabilities.db.rules`), HTML montado com dados (`innerHTML`) ou dependências.
   - `estudos-texto`: só se o diff muda texto que o usuário lê (strings em `rota/src/app.js` e `pagina.html`, `web/index.html`, mensagens da API).
4. **Juntar**: tire duplicados e o que estiver fora das linhas mudadas (a não ser que a mudança piore). Confirme cada achado lendo o código; descarte os falsos.
5. **Saída**:
   - Veredito: `pode enviar` / `pode enviar, com retoques` / `corrigir antes`.
   - Achados, o mais grave primeiro: `gravidade — arquivo:linha — problema — correção`. Máximo 20.
   - Testes que faltam, uma linha cada.

Não corrigir nada sem o usuário pedir.
