# Training Up — instruções para o Claude Code

**Leia [docs/SPEC.md](docs/SPEC.md) antes de qualquer tarefa.** Ela é a fonte da verdade do produto (escopo, regras de negócio, telas, stack, fases).

## Onde estamos
- Fase atual: veja o topo de [docs/CHANGELOG.md](docs/CHANGELOG.md).
- Decisões tomadas durante a implementação: [docs/DECISIONS.md](docs/DECISIONS.md). Elas complementam a SPEC; em conflito, a decisão mais recente registrada vale.

## Regras de trabalho (resumo da seção 0 da SPEC)
1. Siga as fases da seção 10 **na ordem**, uma por vez. Não adiante funcionalidades de fases futuras.
2. Ao fim de cada fase, **pare**: mostre o que foi feito, como testar e o checklist de aceite. Só avance com o ok do Brenno.
3. Ações do Brenno (🧑‍💻, seção 9): pare e peça com passo a passo. Nunca invente credenciais.
4. Ambiguidade → pergunte antes de implementar.
5. Atualize `docs/CHANGELOG.md` e `docs/DECISIONS.md` a cada fase/decisão.
6. Código, tabelas e variáveis em **inglês**; textos de interface em **pt-BR** via arquivos de tradução (nada hardcoded).

## Estrutura
```
/frontend   React + Vite + TS (PWA)
/backend    Laravel API
/docs       SPEC, DECISIONS, CHANGELOG, DEPLOY, data/ (seeds, TACO)
```
