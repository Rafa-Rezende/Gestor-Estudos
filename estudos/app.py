from estudos.plano import percentagem_concluida


def main():
    feitas = int(input("Quantas atividades você concluiu? "))
    total = int(input("Quantas aulas ao Total? "))
    print(f"Você concluiu {percentagem_concluida(feitas, total)}% do curso")

if __name__ == "__main__":
    main()