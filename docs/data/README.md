# Dados de conteúdo (seeds para revisão)

- Fotos e vídeos dos exercícios: plano de produção em [`producao-midias.md`](producao-midias.md).

## Base de exercícios

Arquivo: [`backend/database/data/exercises.csv`](../../backend/database/data/exercises.csv). Ele fica no backend porque a pasta `docs/` não vai para o servidor. O deploy importa o arquivo uma única vez e, depois disso, a base é editada em Painel admin → Exercícios.

**Como revisar:** abra o arquivo no Excel. Ele é separado por `;`, em UTF-8, então abre com os acentos certos. Corrija os valores e salve como **CSV UTF-8 (separado por vírgulas)**; o Excel em português mantém o `;`. Nas colunas de lista, os itens são separados por `|`.

| Coluna | O que é |
|---|---|
| `slug` | Identificador fixo (minúsculas, sem acento, com hífens). Não mude o de um exercício que já existe. |
| `name` | Nome exibido no app. |
| `primary_muscle` | Grupo muscular principal (um). |
| `secondary_muscles` | Grupos secundários (lista; pode ficar vazio). |
| `movement_pattern` | Padrão de movimento, usado nos moldes e nas trocas. |
| `equipment` | Tudo o que o exercício precisa (lista). Vazio = peso do corpo. |
| `level` | Nível mínimo indicado. |
| `contraindications` | Lesões ou limitações que tiram o exercício dos planos gerados (lista; pode ficar vazio). |

**Valores aceitos**

- **Grupos musculares:** `chest` peito · `back` costas · `shoulders` ombros · `biceps` bíceps · `triceps` tríceps · `forearms` antebraço · `abs` abdômen · `lower_back` lombar · `quadriceps` quadríceps · `hamstrings` posteriores da coxa · `glutes` glúteos · `adductors` adutores · `calves` panturrilha
- **Padrões de movimento:** `squat` agachar · `hinge` dobrar o quadril · `horizontal_push` empurrar na horizontal · `vertical_push` empurrar na vertical · `horizontal_pull` puxar na horizontal · `vertical_pull` puxar na vertical · `isolation` isolado · `core` core
- **Equipamentos:** `barbell` barra · `dumbbell` halteres · `machine` máquina · `cable` polia · `bench` banco · `pull_up_bar` barra fixa · `parallel_bars` paralelas · `kettlebell` kettlebell · `band` elástico
- **Níveis:** `beginner` iniciante · `intermediate` intermediário · `advanced` avançado
- **Lesões/limitações:** `shoulder` ombro · `elbow` cotovelo · `wrist` punho · `lower_back` lombar · `neck` pescoço · `hip` quadril · `knee` joelho · `ankle` tornozelo

Um valor fora dessas listas faz a importação parar e mostrar a linha com problema. Para testar localmente depois de editar, `php artisan exercises:import` adiciona só os slugs novos. Ele não altera os exercícios que já estão no banco.
