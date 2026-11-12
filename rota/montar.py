"""Monta rota/index.html, a página publicada como artefato no claude.ai.

A página é um arquivo só (o claude.ai publica um HTML único), mas o código
vive separado em rota/src/ para poder ser lido, testado e revisado:

- pagina.html: título, fontes, CSS (tokens do tema) e a estrutura fixa;
- planejador.js: o planejador, função pura (testada em rota/test/);
- app.js: telas, banco do artefato, imprevistos, sincronização com o iPhone.

Uso:
    python rota/montar.py              # regrava rota/index.html
    python rota/montar.py --verificar  # falha se index.html estiver desatualizado
"""

import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
SRC = RAIZ / "src"
SAIDA = RAIZ / "index.html"


def _ler(nome: str) -> str:
    return (SRC / nome).read_text(encoding="utf-8").removesuffix("\n")


def montar() -> str:
    """Junta as três partes na ordem em que o navegador precisa delas."""
    pagina = (SRC / "pagina.html").read_text(encoding="utf-8")
    return (
        f"{pagina}<script>\n{_ler('planejador.js')}\n</script>\n"
        f"<script>\n{_ler('app.js')}\n</script>\n"
    )


def main(argv: list[str]) -> int:
    html = montar()
    if "--verificar" in argv:
        atual = SAIDA.read_text(encoding="utf-8") if SAIDA.exists() else ""
        if atual != html:
            print("rota/index.html está desatualizado: rode python rota/montar.py")
            return 1
        return 0
    SAIDA.write_text(html, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
