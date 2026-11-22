# Decisões

Registro de decisões tomadas durante a implementação que complementam ou ajustam a [SPEC](SPEC.md). Formato: data, decisão, motivo.

## 2026-11-21
- **Spec movida para `docs/SPEC.md`** (estava na raiz como `TRAINING_UP_SPEC.md`), conforme a estrutura da seção 3.3. `CLAUDE.md` na raiz aponta para ela, para que qualquer nova sessão carregue o contexto.
- **Identidade visual: conceito A · Brasa** (escolhido pelo Brenno entre 3 propostas: A Brasa/energia, B Cobalto/clean, C Folha/saúde). Símbolo de duas setas subindo, laranja `#FF5A1F` + âmbar `#FFB020`, fontes Barlow Condensed + Barlow. Tokens e arquivos em [brand/README.md](brand/README.md).
- **PHP 8.4 na Hostinger** (informado pelo Brenno) → **Laravel 13** (exige PHP ≥ 8.3).
- **Backend somente API:** removidos Vite, `resources/js|css` e a view de boas-vindas do Laravel. Removidos também o `CLAUDE.md`/`AGENTS.md` genéricos que o instalador do Laravel cria; o contexto do projeto fica no `CLAUDE.md` da raiz.
- **Componentes no estilo shadcn/ui, escritos à mão sobre Radix** (Dialog, Tabs, Toast), em vez de usar a CLI do shadcn: menos dependências e controle total dos tokens da marca.
- **Lint do frontend com oxlint** (padrão do template atual do Vite) em vez de ESLint, + Prettier com plugin de ordenação de classes Tailwind.
- **Fontes auto-hospedadas** via `@fontsource` (não Google Fonts): funcionam offline no PWA e evitam requisição a terceiros (LGPD).
- **Tailwind v4** com tokens em CSS variables (`@theme inline`); o tema é aplicado por `data-theme` no `<html>`, com script inline no `index.html` para evitar flash de tema errado.
- **Testes sempre junto com o código** (pedido do Brenno): Vitest + Testing Library no frontend, PHPUnit no backend, na mesma entrega de cada funcionalidade.
- **Portas locais 5180 (frontend) e 8010 (backend)**, porque 5173/8000 já estão em uso por outro projeto local.
- **Alertas do `npm audit` (minimatch via workbox-build) aceitos por enquanto:** é dependência só do build do service worker, não vai para produção; a correção sugerida rebaixaria o vite-plugin-pwa. Reavaliar quando sair versão corrigida.
- **Datas no banco em UTC**; conversão para o fuso do usuário na exibição.
- **Rotas do app** usarão os caminhos em português da navegação (`/hoje`, `/treino`, `/dieta`, `/progresso`, `/perfil`), seguindo `/entrar` e `/criar-conta` da SPEC.
