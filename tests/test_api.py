from fastapi.testclient import TestClient

from estudos.api import app

client = TestClient(app)

def test_um_de_quatro():                                      
    resposta = client.get("/percentagem?feitas=1&total=4")  
    dados = resposta.json()                                     
    assert dados["percentagem"] == 25                       