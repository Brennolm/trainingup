# Training Up — Frontend (React PWA)

Visão geral e regras do produto em [../docs/SPEC.md](../docs/SPEC.md). Marca em [../docs/brand](../docs/brand/README.md).

## Rodar localmente

```sh
npm install
npm run dev              # http://localhost:5180
```

- `/` — página provisória (até a landing da fase 1)
- `/design` — vitrine do design system (temas, componentes, navegação)

## Comandos

- `npm test` — testes (Vitest); `npm run test:watch` enquanto desenvolve
- `npm run build` — build de produção (gera o service worker do PWA)
- `npm run lint` — oxlint
- `npm run format` — Prettier
- `npm run brand` — regenera as SVGs da marca (nome em contornos)
- `npm run icons` — regenera os ícones do PWA a partir de `public/app-icon.svg`
