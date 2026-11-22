# Changelog

**Fase atual:** 3 — LGPD (pronta localmente, aguardando teste do Brenno). Fases 4 (Google) e 5 (2FA) publicadas em 2026-11-22.

## 2026-11-22
- Fase 3 — LGPD (em andamento):
  - Páginas Termos de Uso, Política de Privacidade (com acesso de suporte em leitura) e Política de Cookies, versão `2026-11-22`, no lugar de "Em breve".
  - Perfil → Privacidade: exportar meus dados (JSON), Meus consentimentos (versão, data e IP), links dos documentos e excluir conta (apaga tudo na hora; senha ou EXCLUIR + código do 2FA).
  - Nova versão dos textos pede novo aceite antes de usar o app.
- Fase 5 — Verificação em duas etapas (publicada em 2026-11-22, commit e513206; testada pelo Brenno localmente):
  - Perfil → Segurança: ativar (senha → QR code do app autenticador + chave manual → primeiro código), 8 códigos de recuperação de uso único (copiar/baixar, mostrados uma vez), gerar novos códigos, desativar (senha + código do app ou de recuperação).
  - Login com e-mail/senha pede o código em `/entrar/codigo` (ou um código de recuperação); expira em 10 min e após 5 erros. Login pelo Google não pede.
  - Banco: `two_factor_secret` (criptografado), `two_factor_recovery_codes` (hashes), `two_factor_confirmed_at` em `users`.
- Fase 4 — Login com Google (publicada em 2026-11-22, commit f8778ce; credenciais do Google Cloud no `.env` local e do servidor; app em modo "Em teste" no Google):
  - "Continuar com Google" em Entrar e Criar conta; conta existente com o mesmo e-mail é vinculada automaticamente; e-mail novo vai para "Completar cadastro" (nascimento + aceite, bloqueio de menor de 18) e só então a conta é criada.
  - Perfil → Segurança: vincular/desvincular Google (exige senha para desvincular) e criar/alterar senha.
  - Banco: `users.google_id`, senha opcional. Testes: 69 no backend, 101 no frontend.
- Fase 2 — Cadastro e login (e-mail):
  - API (Sanctum SPA, cookie): cadastro, login (manter conectado por padrão), sair, verificação por código de 6 dígitos (15 min, 5 tentativas, reenvio após 60 s, guardado só como hash), esqueci/redefinir senha (link para o app), bloqueio de menores de 18, perfil (nome, nascimento) e preferências (tema, kg/lb, cm/ft-in).
  - Banco: tabela `plans` com `free`, campos de perfil em `users`, `email_verification_codes`, `consents` (aceite de Termos e Privacidade com versão, data e IP).
  - Limite de tentativas em login, cadastro, códigos e recuperação de senha; mensagens da API em pt-BR; e-mails com a identidade da marca (HTML + texto).
  - App: telas Entrar, Criar conta (requisitos de senha ao vivo), Verificar e-mail (envio automático no 6º dígito, contagem para reenviar), Esqueci/Redefinir senha, "Hoje" provisória, Perfil; proteção de rotas; tema sincronizado com a conta.
  - E-mail: `noreply@trainingup.com.br` via SMTP da Hostinger; DNS com SPF, DKIM e DMARC confirmados.
  - Testes: 50 no backend, 87 no frontend; fluxo completo validado no navegador (cadastro → código → Hoje → perfil → sair → entrar) e em produção (cadastro, envio do código, sessão entre `trainingup.com.br` e `api.trainingup.com.br`, cookie seguro).
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
