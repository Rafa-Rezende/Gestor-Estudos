#!/bin/bash
set -e
AMBIENTE=${1:-staging}
TAG=${2:-latest}
if [ "$AMBIENTE" = "producao" ]; then PORT=8000; else PORT=8001; fi
export TAG PORT
docker compose -p gestor-$AMBIENTE pull
docker compose -p gestor-$AMBIENTE up -d
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://localhost:$PORT/percentagem?feitas=1&total=4"; then
    echo; echo "Deploy $AMBIENTE OK (porta $PORT)"; exit 0
  fi
  sleep 2
done
echo "Deploy $AMBIENTE FALHOU"; exit 1orbstack
