#!/bin/bash
# PreToolUse Edit|Write: não mexer no que é gerado, nos segredos nem no estado da AWS.
source "$(dirname "$0")/lib.sh"
in=$(cat); f=$(json_get file_path)
case "$f" in
  */rota/index.html)          bloquear "rota/index.html é gerado: edite rota/src/ (pagina.html, planejador.js, app.js); o hook remonta sozinho." ;;
  */.venv/*)                  bloquear ".venv não se edita: mude o requirements-dev.txt e reinstale." ;;
  */.terraform/*)             bloquear ".terraform/ é gerado pelo terraform init." ;;
  *.tfstate|*.tfstate.*)      bloquear "O tfstate é o estado real da AWS: nunca editar à mão (nem ir para o git)." ;;
  */terraform.tfvars|*.auto.tfvars) bloquear "tfvars pode ter nomes e segredos da conta: peça ao usuário para editar." ;;
  */.env|*/.env.*)            bloquear ".env tem segredos: peça ao usuário para editar." ;;
esac
exit 0
