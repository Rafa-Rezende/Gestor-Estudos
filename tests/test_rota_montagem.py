from rota.montar import SAIDA, montar


def test_index_html_e_igual_ao_que_sai_de_rota_src():
    # o artefato publicado tem de ser exatamente o código revisado em rota/src
    assert SAIDA.read_text(encoding="utf-8") == montar()


def test_planejador_vem_antes_do_app():
    html = montar()
    assert html.index("root.RotaPlanner =") < html.index("const P = window.RotaPlanner")
