from estudos.plano import percentagem_concluida


def test_um_de_quatro():
    assert percentagem_concluida(1,4) == 25


def test_zero_de_zero():
    assert percentagem_concluida(0,0) == 0

def test_um_de_3():
    assert percentagem_concluida(1,3) == 33