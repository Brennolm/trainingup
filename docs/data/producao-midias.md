# Produção das imagens dos exercícios

Uma imagem por exercício: a **posição inicial e a final lado a lado**, na academia Training Up (parede, logo e luz) e com o modelo oficial.

- **Foto base:** [`docs/brand/academia/modelo-oficial-maos-vazias.png`](../brand/academia/modelo-oficial-maos-vazias.png). É o modelo de mãos vazias na academia; toda imagem parte dela, para manter o mesmo rosto, roupa e cenário.
- **Gerador:** API de imagens da OpenAI (conta do Brenno). A chave fica só no `backend/.env` local (`OPENAI_API_KEY`), nunca no servidor nem no Git.
- **Custo:** qualidade média (padrão) ~US$ 0,06 por imagem (~US$ 10 para os 163); alta US$ 0,22. Nos testes as duas ficaram praticamente iguais.
- **Composição:** as duas figuras costumam sair espelhadas (cada uma virada para um lado, com seu equipamento). Foi aceito.

## Como gerar

Na pasta `backend`:

```
php artisan exercises:generate-images --dry-run          # só mostra os prompts
php artisan exercises:generate-images                    # gera todas as que faltam
php artisan exercises:generate-images flexao prancha     # só essas
php artisan exercises:generate-images flexao --force     # refaz (gasta de novo)
php artisan exercises:generate-images --quality=high     # low, medium (padrão) ou high
```

O prompt de cada exercício sai de [`backend/database/data/exercise-image-specs.json`](../../backend/database/data/exercise-image-specs.json): nome em inglês, equipamento (`scene`), ângulo (`view`: side, three-quarter ou front), posição inicial (`start`), movimento até a posição final (`end`) e uma regra de técnica (`rule`). O campo `checks` (pt-BR) é o que o revisor confere e não vai para a API. Para corrigir uma imagem, ajuste o texto do exercício e rode com `--force`. A técnica foi conferida no ACE Exercise Library e no ExRx.

## Onde as imagens ficam

- Geradas em `backend/database/data/exercise-images/{slug}.jpg` e versionadas com o código.
- O gerador já liga cada imagem ao seu exercício localmente. Em produção, `php artisan exercises:images` faz isso sozinho a cada deploy. Uma imagem enviada pelo admin de produção nunca é sobrescrita.
- Também dá para enviar uma imagem à mão em Admin → Exercícios → Editar → "Imagem de exemplo".

## Revisão

Um profissional de Educação Física confere as duas posições de cada imagem (veja `checks`). Imagem errada: ajuste o texto e gere de novo.
