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
7. **Testes junto com o código, sempre.** Toda funcionalidade ou mudança entra com seus testes no mesmo passo, no frontend (Vitest + Testing Library, arquivos `*.test.tsx` ao lado do componente) e no backend (PHPUnit em `backend/tests`). Nada de deixar teste para depois.
8. Comandos locais (composer, npm, build, testes, artisan, servidores de dev) podem ser rodados sem pedir. Commit, push e qualquer coisa em produção: confirmar antes.

## Estrutura
```
/frontend   React + Vite + TS (PWA)
/backend    Laravel API
/docs       SPEC, DECISIONS, CHANGELOG, DEPLOY, data/ (seeds, TACO), brand/
```

## Comandos
- Frontend (`/frontend`): `npm run dev` (**http://localhost:5180**), `npm test`, `npm run build`, `npm run lint` (oxlint), `npm run format` (Prettier).
- Backend (`/backend`): `php artisan serve --port=8010` (**http://localhost:8010**), `php artisan test`, `./vendor/bin/pint`.
- Portas fixas 5180/8010 porque 5173/8000 já são usadas por outros projetos do Brenno.
- Antes de encerrar uma tarefa: testes + build + lint do frontend e testes + Pint do backend passando.

## Convenções do frontend
- Cores só por tokens (`bg`, `surface`, `surface-2`, `border`, `text`, `muted`, `primary`, `on-primary`, `secondary`, `success`, `warning`, `danger`) definidos em `src/index.css`. Nunca usar cor literal em componente.
- Componentes base em `src/components/ui`; vitrine em `/design`.
- Toda string de UI em `src/locales/pt-BR.json`.
- Áreas de toque ≥ 44px (`h-11`); botões de uso na academia `size="lg"`.
