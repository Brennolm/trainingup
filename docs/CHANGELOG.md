# Changelog

**Fase atual:** 1 — Landing page (publicada, aguardando aceite do Brenno). Próxima: fase 2 — Cadastro e login (e-mail).

## 2026-11-22
- Fase 1 — Landing page:
  - Página única conforme SPEC 6.1: cabeçalho fixo (menu no celular), hero com mockup do app, dois produtos, como funciona, 6 recursos, instalação (iPhone/Android + botão "Instalar agora" quando o navegador permite), FAQ, chamada final e rodapé com links legais, contato e aviso de "sugestão e estimativa".
  - Aviso de cookies na primeira visita; páginas provisórias "Em breve" para `/entrar`, `/criar-conta`, `/termos`, `/privacidade`, `/cookies`.
  - SEO: título, descrição, canonical, Open Graph/Twitter com imagem 1200×630 gerada da marca, `robots.txt`, `sitemap.xml`.
  - Desempenho: fontes com URL fixa e pré-carregadas; vitrine `/design` carregada sob demanda. Lighthouse mobile em produção: desempenho 99, acessibilidade 100, boas práticas 100, SEO 100.
  - Rolagem suave nas âncoras (desligada com "reduzir movimento").
  - `tailwind-merge` no `cn()` (corrige conflitos de classes em botões); variante de botão `inverse`.
  - Testes: landing, rotas, aviso de cookies, instalação, `cn` (43 no frontend).

## 2026-11-21
- Fase 0.3 entregue — produção no ar (trainingup.com.br e api.trainingup.com.br):
  - Git da Hostinger plugado na branch `deploy`, PHP 8.4 no site, Cron do agendador ativo; fluxo push → testes → deploy → pós-deploy validado de ponta a ponta.
  - Correções: ordem do pós-deploy no primeiro deploy (migrar antes de limpar o cache do banco) e pasta `resources/views` versionada.
  - Servidor preparado: subdomínio `api`, SSL, banco MariaDB, `.env` de produção (senha colocada pelo Brenno).
  - GitHub Actions: testes de frontend e backend em todo push/PR; na `main`, publica site + API prontos na branch `deploy`.
  - `.htaccess` do site (HTTPS, sem www, SPA, cabeçalhos de segurança, cache) e da API (só `public/`, bloqueios, só no subdomínio).
  - Comandos `deploy:finalize` (migrações/caches por versão) e `backup:database` (diário, 7 dias), agendados com a fila em `routes/console.php`, com testes.
  - `docs/DEPLOY.md`.
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
