def percentagem_concluida(feitas, total):
    if total == 0:
        return 0
    return round(feitas/total * 100)