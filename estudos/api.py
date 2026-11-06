from fastapi import FastAPI
from fastapi.responses import FileResponse

from estudos.plano import percentagem_concluida

app = FastAPI()


@app.get("/")
def pagina():
    return FileResponse("web/index.html")


@app.get("/percentagem")
def percentagem_endpoint(feitas: int, total: int):
    return {"percentagem": percentagem_concluida(feitas, total)}