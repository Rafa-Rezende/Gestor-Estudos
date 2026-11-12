---
name: publicar
description: Grava e envia as alterações do Gestor de Estudos (commit e push da branch de trabalho), confere o CI e, se mudou o Rota de Estudos, republica o artefato no claude.ai.
disable-model-invocation: true
---
O `main` é a entrega da Fase 1 de DevOps (o professor avalia o que está lá). Trabalho novo vai numa branch; o CI (`.github/workflows/ci.yml`) roda em push no `main` e em pull requests.

1. **Branch**: se estiver no `main`, pare e pergunte o nome da branch (sugira um, ex.: `fase2-rota`). Push no `main` só com pedido explícito do usuário nesta conversa; aí o comando leva o prefixo `ESTUDOS_MAIN_OK=1`.
2. **Preflight**: rode a skill `preflight`. NÃO PRONTO → pare e mostre o que falta.
3. **Revisão**: se o que vai sair mexe em `estudos/`, `rota/src/`, `infra/` ou `.github/`, rode a skill `rever` (a não ser que já tenha rodado sobre estas mesmas mudanças nesta conversa). `corrigir antes` → pare e mostre. `com retoques` → mostre e pergunte se envia assim ou corrige antes. Só documentação ou testes → pule.
4. **Commit**: só os arquivos desta tarefa (`git add <arquivos>`, nunca `git add -A`). Mensagem em português, no estilo do `git log`: um título que diz o que muda ("Rota: dia livre aceita 5h de estudo"), e se preciso um parágrafo curto com o porquê. Termine com as linhas de atribuição que o sistema indicar.
5. **Push**: `git push -u origin <branch>`. Nunca forçado. Rejeitado → `git pull --rebase origin <branch>`, rode os testes de novo, e só então push.
6. **CI**: se existe PR da branch, acompanhe com `gh pr checks` (ou `gh run list --branch <branch> --limit 1`). Sem PR o CI não roda: diga isso, e não abra PR sem o usuário pedir.
7. **Artefato**: mudou `rota/src/` → siga a skill `rota` (seção "Republicar") para atualizar a página no claude.ai e, se o formato dos dados mudou, migrar o banco.
8. **Relatório**, curto: commit (hash e título), branch, estado do CI, se o artefato foi republicado, e o que o usuário precisa fazer (recarregar a página; rodar o atalho do iPhone se o plano mudou).
