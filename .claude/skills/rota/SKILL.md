---
name: rota
description: Tudo sobre o Rota de Estudos, o app publicado como artefato no claude.ai (planejador das aulas da PUC, imprevistos, prazos, treino de código, sincronização com o iPhone). Usar ao mudar rota/src/, ao republicar a página, ao ler ou corrigir os dados do banco do artefato, ou quando o plano mostrado parecer errado.
---
## Onde está

- Página publicada: https://claude.ai/artifact/LazjqpYBaArfHZSXkLo4tj (privada, do Rafael). Título "Rota de Estudos", ícone `calendar`.
- Código: `rota/src/pagina.html` (CSS, tokens do tema caderno pastel), `rota/src/planejador.js` (função pura `RotaPlanner.buildPlan`), `rota/src/app.js` (telas e banco). `rota/montar.py` junta tudo em `rota/index.html` (gerado; o hook remonta a cada edição).
- Testes do planejador: `node --test rota/test/*.test.js`. O teste `tests/test_rota_montagem.py` garante que o `index.html` está em dia.

## Banco do artefato (capability `db`)

Regras: `{"db": {"rules": [{"path": "", "read": "view", "write": "admin"}]}, "user": {}}`: só o dono escreve. Coleções:

| coleção | doc | campos |
|---|---|---|
| `subjects` | `devops`, `gp`, `co`, `codigo`, `m_*`, `t_*` | `name`, `short`, `color` (devops/gp/co/t1/t2/t3), `kind` (`puc` ou `trilha`), `lessons`, `parts`, `order`; trilha: `modules[{id,title}]`, `plan{days[0-6],start,end}`, `desc` |
| `progress` | id da matéria | `parts{"6.1": "AAAA-MM-DD" ou true}` (true = assistida sem data), `modules{id: data}` |
| `sessions` | `p_AAAAMMDD_NN` (do planejador, `auto: true`), `n0xx` (importadas do Notion), `s_*` (manuais) | `type` (Aula, Trabalho, Entrega, Estudo, Revisão, Reserva, Descanso), `subject`, `date`, `start`, `end` (`24:00` = meia-noite), `units` (partes de 30 min), `lesson`, `pFrom`, `pTo`, `task`, `phase`, `title`, `note`, `done`, `doneAt` |
| `tasks` | `f2_devops`, `f2_gp`, `f2_co`, `k_*` | `title`, `subject`, `phase`, `units`, `done` |
| `days` | `AAAA-MM-DD` | `livre` (sem pizzaria, mais horas), `sem` (sem estudo), `ranges[{start,end,note}]` (ocupado), `note` |
| `settings` | `main` | `name`, rotina (`windows`, `freeWindows`, `capNormal`, `capFree`, `maxRun`, `restDay`, `travel`, `shifts[{day,start,end}]`), `syncDays`, `syncReserva` |

Uma Aula está feita quando todas as partes dela estão em `progress`; as outras sessões usam `done`.

## Como o planejador decide

1. Descarta sessões automáticas não concluídas e aulas manuais que já passaram; as partes voltam para a fila.
2. Fila: a matéria com mais trabalho restante vai primeiro; cada bloco é o resto de uma aula ou um trabalho (trabalho só depois das aulas da matéria).
3. Dias: janelas de estudo menos turnos (com folga antes), horários ocupados e sessões fixas; domingo de descanso; dia `livre` ignora turnos e usa `freeWindows` e `capFree`; dia `sem` fica vazio.
4. Trilhas no horário próprio (desviam de turno no mesmo dia, senão pulam), sem gastar o limite das aulas.
5. `late` = termina no dia da próxima entrega ou depois, ou sobrou parte sem lugar.

## Republicar

1. `python3 rota/montar.py --verificar` e `node --test rota/test/*.test.js` verdes.
2. Ferramenta Artifact: numa conversa nova, primeiro `action: "read"` da URL; depois `publish` com `url` da página e `file_path` = `rota/index.html`. Omita `capabilities` (mantém as regras) e `icon`.
3. Mudou o formato dos dados → migre pelo `ArtifactData`: leia antes, `batch` de no máximo 50 escritas, `if_version` em todo doc que já existe, `delete` com `if_version`. Para refazer o plano, prefira deixar o próprio app fazer (botão Replanejar) ou rode `RotaPlanner.buildPlan` no Node com os dados lidos e grave o `create` e os `dropIds`.
4. Confirme com um `list` da coleção mexida.

## iPhone

Não há sync direto. O app copia um JSON `{calendario, geradoEm, eventos[{titulo, inicio:"AAAA-MM-DD HH:MM", fim, notas}]}`; o atalho "Sincronizar Estudos" (app Atalhos) apaga os eventos futuros do calendário "Estudos" e recria. Mudou esse formato → o atalho do usuário quebra: avise e atualize os passos na tela iPhone.
