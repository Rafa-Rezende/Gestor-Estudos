#!/bin/bash
# PreToolUse Bash: comandos que travam a sessão, custam dinheiro na AWS ou mexem na entrega. Exit 2 = bloqueado.
source "$(dirname "$0")/lib.sh"
in=$(cat); cmd=$(json_get command); bg=$(json_get run_in_background)
inicio='(^|[;&|(][[:space:]]*|[[:space:]])'
uvicorn='(^|[;&|(/[:space:]])uvicorn[[:space:]]'

# servidores nunca terminam: em primeiro plano a sessão fica presa
if [[ $bg != true && ( $cmd =~ $uvicorn || $cmd =~ ${inicio}fastapi[[:space:]]+(dev|run) || $cmd =~ http\.server ) ]]; then
  bloquear "Servidores ficam rodando para sempre. Use run_in_background: true (ex.: .venv/bin/uvicorn estudos.api:app --port 8000)."
fi

# reescrever histórico apaga o que o professor já viu ou o que está no GitHub
if [[ $cmd =~ git[[:space:]]+push && $cmd =~ (--force|[[:space:]]-f([[:space:]]|$)|--force-with-lease) ]]; then
  bloquear "Nada de push forçado neste projeto."
fi

# o main é a entrega da Fase 1: só com pedido explícito do usuário (quem pediu prefixa ESTUDOS_MAIN_OK=1)
if [[ $cmd =~ git[[:space:]]+push && ( $cmd =~ [[:space:]]main([[:space:]]|$) || $cmd =~ HEAD:main ) && ! $cmd =~ ESTUDOS_MAIN_OK=1 ]]; then
  bloquear "O main é a entrega da Fase 1 de DevOps. Envie a branch de trabalho; push no main só se o usuário pediu (prefixe ESTUDOS_MAIN_OK=1)."
fi

# `git push` sem destino, estando no main, também vai para o main
if [[ $cmd =~ git[[:space:]]+push([[:space:]]*$|[[:space:]]+(-u[[:space:]]+)?origin[[:space:]]*$) && $(git -C "$(raiz)" branch --show-current 2>/dev/null) == main && ! $cmd =~ ESTUDOS_MAIN_OK=1 ]]; then
  bloquear "Você está no main (entrega da Fase 1). Crie uma branch antes de enviar."
fi

# terraform apply/destroy cria ou apaga recursos reais (e cobra) na conta AWS do usuário
if [[ $cmd =~ terraform[[:space:]].*(apply|destroy|import|state[[:space:]]+(rm|mv|push)) && ! $cmd =~ ESTUDOS_AWS_OK=1 ]]; then
  bloquear "Isso mexe na conta AWS de verdade. Só se o usuário pediu: nesse caso, prefixe ESTUDOS_AWS_OK=1. Para checar, use terraform fmt -check / validate / plan."
fi

# credenciais da AWS nunca passam pela linha de comando
if [[ $cmd =~ AWS_SECRET_ACCESS_KEY= || $cmd =~ aws[[:space:]]+configure ]]; then
  bloquear "Credenciais da AWS não passam pelo terminal da sessão. Peça ao usuário para configurá-las na máquina dele."
fi
exit 0
