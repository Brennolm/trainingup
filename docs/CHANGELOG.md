# Changelog

**Fase atual:** 0.2 — Projeto (entregue, aguardando aceite do Brenno). Próxima: 0.3 — Deploy.

## 2026-11-21
- Fase 0.2 entregue:
  - Monorepo com `/frontend` (React 19 + Vite 8 + TypeScript) e `/backend` (Laravel 13, API-only, Sanctum instalado).
  - Design system: tokens de cor (temas escuro/claro), tipografia Barlow/Barlow Condensed auto-hospedada, componentes Button, Input, Card, Modal, Tabs, Toast, BottomNav, Sidebar, ThemeToggle, Logo; vitrine em `/design`.
  - Tema escuro padrão, claro alternável, persistido em localStorage (sem piscar na carga).
  - i18n (react-i18next) com `pt-BR.json`; backend com locale `pt_BR`.
  - PWA instalável: manifest, service worker (Workbox), ícones 64/192/512, maskable, apple-touch e favicon gerados da logo.
  - Logo com o nome convertido em contornos; script `npm run brand`.
  - Lint/format: oxlint + Prettier (frontend), Pint (backend); `.editorconfig` e `.gitattributes` (LF).
  - Backend: `GET /api/health` com teste.
  - Testes do frontend: Vitest + Testing Library (20 testes: tema, botão, campo, navegação, modal, abas, aviso, traduções).
  - Portas locais fixas: frontend 5180, backend 8010.
- Fase 0.1 concluída: identidade visual escolhida (conceito A · Brasa). Arquivos em `docs/brand/`.
- Documentação inicial: `docs/SPEC.md`, `CLAUDE.md`, `docs/DECISIONS.md`.
