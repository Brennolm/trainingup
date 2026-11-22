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
- **Layout no servidor igual ao LLStar (escolha do Brenno, ajusta a SPEC 3.2):** o Laravel fica dentro da pasta do subdomínio, `domains/trainingup.com.br/public_html/api`, e um `.htaccess` manda tudo para `public/`. O mesmo `.htaccess` bloqueia arquivos ocultos (`.env`, `.git`), as pastas internas do Laravel e `composer.json`/`artisan` (testado: 403). O site React fica em `public_html`.
- **Servidor:** conta compartilhada da Hostinger (mesmo usuário SSH dos outros sites do Brenno); PHP 8.4, Composer, Git, rsync e mysqldump disponíveis; `crontab` não existe via SSH, então agendamentos vão pelo painel de Cron do hPanel.
- **Deploy pelo Git da Hostinger via branch `deploy`:** o Brenno usa a integração Git do hPanel (pull automático). Como o repositório é monorepo, sem `composer.json` na raiz e com o React precisando de build (o servidor não tem Node), o GitHub Actions monta os arquivos prontos (site na raiz, Laravel com `vendor/` em `api/`) e publica na branch `deploy`, que a Hostinger puxa. Alternativa descartada: Actions enviando por SSH, que exigiria guardar no GitHub uma chave com acesso a todos os sites da conta.
- **Pós-deploy pelo agendador:** como a Hostinger só puxa arquivos, `deploy:finalize` roda a cada minuto e executa migrações e caches quando `DEPLOY_VERSION` muda (até ~1 min de atraso após o pull).
- **Backups em `api/storage/app/private/backups`** (bloqueado pelo `.htaccess`), `mysqldump` com senha via `MYSQL_PWD` (não aparece na lista de processos). Alerta de falha no admin fica para a fase 7; até lá, vai para o log.
- **Repositório público no GitHub** (escolha do Brenno, para o Claude conseguir ler o resultado do Actions). Nenhum segredo fica no repositório; a documentação (incluindo host/usuário SSH em `docs/DEPLOY.md`) fica visível.
- **E-mail de contato: `contato@trainingup.com.br`** (escolha do Brenno; caixa ou encaminhamento a criar na Hostinger).
- **Aviso de cookies informativo ("Entendi"), sem aceitar/recusar:** o site usa só cookies essenciais (sessão/login) e localStorage para preferências; não há analytics nem publicidade. A dispensa fica no localStorage com versão do texto; o registro formal de consentimentos entra na fase 3. Se um dia houver cookies não essenciais, o aviso vira escolha.
- **Meta tags de SEO fixas no `index.html`** (não passam pelo i18n): são lidas por robôs antes do JavaScript e o site só tem pt-BR.
- **Fontes em `public/fonts` com nomes fixos** (cópia do subset latin do `@fontsource`), para o `index.html` pré-carregar as usadas no topo da página. Sem isso, a troca de fonte deslocava o layout (CLS 0,145, desempenho 87). Pré-renderização (SSG) avaliada e descartada por ora: o resultado já passou de 90.
- **No celular, o cabeçalho da landing mostra só logo + menu;** "Entrar" e "Criar conta" ficam no menu (o hero logo abaixo tem o CTA "Comece grátis"). Os três itens não cabem em 375 px.
- **`tailwind-merge` no `cn()`:** classes passadas a um componente substituem as conflitantes do componente (ex.: `hidden` em um botão).
- **Fase 2 — escolhas do Brenno:** manter conectado por padrão (caixa marcada no login); senha com 8+ caracteres, 1 letra e 1 número; e-mail só leitura no Perfil (troca entra com a seção Segurança); aceite de Termos/Privacidade registrado já no cadastro (tabela `consents`, versão `2026-11-draft` até os textos da fase 3).
- **Autenticação própria em vez do Fortify:** a verificação da SPEC é por código de 6 dígitos (não link), com regras próprias; controllers simples e testados. O 2FA (fase 5) usa uma biblioteca TOTP.
- **E-mails de autenticação enviados na hora (sem fila):** a fila só roda a cada minuto pelo Cron; o código precisa chegar em segundos. Se o envio falhar, a conta é criada e a tela oferece "Reenviar código" (erro vai para o log; alerta no admin na fase 7).
- **Código de verificação guardado como HMAC** (com a APP_KEY), nunca em texto; o código vai no assunto do e-mail para aparecer na notificação do celular.
- **`GET /api/user` responde `data: null` para visitantes** (em vez de 401), para não gerar erro no console a cada página aberta. As demais rotas protegidas continuam com 401.
- **Ao sair, o usuário é removido do cache depois da navegação** (não definido como nulo): evita que a proteção de rota da tela anterior redirecione para "Entrar".
- **Datas no banco em UTC**; conversão para o fuso do usuário na exibição.
- **Rotas do app** usarão os caminhos em português da navegação (`/hoje`, `/treino`, `/dieta`, `/progresso`, `/perfil`), seguindo `/entrar` e `/criar-conta` da SPEC.
