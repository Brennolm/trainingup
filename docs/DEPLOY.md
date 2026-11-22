# Deploy — Training Up

Como o código sai do GitHub e chega em produção na Hostinger.

## Visão geral

```
push na main
   │
   ▼
GitHub Actions (.github/workflows/deploy.yml)
   ├─ frontend: lint, Prettier, testes, build
   ├─ backend: Pint, testes
   └─ deploy (só se tudo passou): monta site + API e publica na branch `deploy`
   │
   ▼
Hostinger (hPanel → Git), branch `deploy` → public_html
   └─ puxa a branch automaticamente (webhook)
   │
   ▼
Cron do hPanel (a cada minuto): php artisan schedule:run
   └─ deploy:finalize → migrações + caches, uma vez por versão
```

Nenhuma senha ou chave SSH fica no GitHub: o Actions só monta arquivos; quem puxa é a Hostinger.

## Estrutura no servidor

Conta compartilhada `u501993331` (mesmo usuário dos outros sites).

```
~/domains/trainingup.com.br/public_html/      ← raiz da branch `deploy`
├── .htaccess          HTTPS, sem www, fallback da SPA, cabeçalhos e cache
├── index.html, assets/, sw.js…   site React (trainingup.com.br)
└── api/               Laravel completo (api.trainingup.com.br)
    ├── .htaccess      só serve public/; bloqueia .env, pastas internas; só responde no subdomínio
    ├── .env           ⚠ só no servidor (preservado entre deploys)
    ├── DEPLOY_VERSION commit publicado
    ├── vendor/        dependências de produção (instaladas pelo Actions)
    └── public/index.php
```

- O subdomínio `api` foi criado no hPanel com a pasta `public_html/api`.
- SSL ativo nos dois domínios.
- `.htaccess` versionados: site em `frontend/public/.htaccess`, API em `deploy/api.htaccess`.
- Arquivos preservados entre deploys: definidos em `deploy/deploy.gitignore` (`.env`, `default.php`) + os `.gitignore` do próprio Laravel em `storage/` e `bootstrap/cache/`.

## Banco de dados

- MariaDB 11.8 (compatível com MySQL), banco e usuário `u501993331_trainingup`, host `localhost`.
- Senha só no `.env` do servidor (colada pelo Brenno via Gerenciador de Arquivos; nunca vai para o Git nem para o chat).

## E-mail

- Conta `noreply@trainingup.com.br` (Hostinger). No `api/.env`: `MAIL_MAILER=smtp`, `MAIL_SCHEME=smtps`, `MAIL_HOST=smtp.hostinger.com`, `MAIL_PORT=465`, `MAIL_USERNAME=noreply@trainingup.com.br`, `MAIL_PASSWORD` (colada pelo Brenno).
- DNS (criado pela Hostinger): MX, SPF `include:_spf.mail.hostinger.com`, DKIM `hostingermail-a/b/c._domainkey`, DMARC `p=none` (endurecer para `quarantine` depois de algumas semanas sem problemas).
- Localmente: o `.env` do Brenno envia de verdade pela mesma conta (escolha dele). Para testar sem enviar, use `MAIL_MAILER=log` e os e-mails (e os códigos) aparecem em `backend/storage/logs/laravel.log`. O `.env.example` continua com `log`.
- Contato público: `contato@trainingup.com.br`.

## Login com Google

- Google Cloud: projeto "Training Up", tela de consentimento externa (escopos `openid`, `email`, `profile`), credencial "Aplicativo da Web".
- URIs de redirecionamento: `https://api.trainingup.com.br/auth/google/callback` e `http://localhost:8010/auth/google/callback`.
- `.env`: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (o redirect sai de `APP_URL` + `/auth/google/callback`).
- Enquanto o app estiver "Em teste" no Google, só os usuários de teste cadastrados lá conseguem entrar; publicar o app libera para todos.

## Agendador (cron)

A hospedagem compartilhada não tem processo contínuo; tudo roda pelo `schedule:run` (ver `backend/routes/console.php`):

| Tarefa | Quando | O que faz |
|---|---|---|
| `deploy:finalize` | a cada minuto | se `DEPLOY_VERSION` mudou: limpa caches, `migrate --force`, recria caches |
| `queue:work --stop-when-empty` | a cada minuto | processa a fila (e-mails etc.) |
| `backup:database` | diário, 03:00 (Brasília) | `mysqldump` gzip em `api/storage/app/private/backups`, mantém os 7 mais recentes |

Cron no hPanel (*Avançado → Cron Jobs*), a cada minuto:

```
/usr/bin/php /home/u501993331/domains/trainingup.com.br/public_html/api/artisan schedule:run
```

Após um deploy, as migrações rodam em até ~1 minuto (próximo `schedule:run`).

## Configuração única no hPanel (já feita / a fazer)

1. Subdomínio `api` → pasta `public_html/api`. ✅
2. SSL nos dois domínios + forçar HTTPS. ✅
3. Banco MySQL + usuário; senha no `api/.env`. ✅
4. **PHP 8.4** na configuração do site (*Avançado → Configuração do PHP*). ✅ O PHP do site é separado do PHP do SSH: o site estava em 8.3 e a API falhava (dependências exigem ≥ 8.4.1).
5. **Git:** repositório `https://github.com/Brennolm/trainingup.git`, branch **`deploy`** (nunca a `main`), raiz do site, implantação automática ativada. ✅
6. **Cron:** comando acima, a cada minuto. ✅

## Operação

- **Publicar:** push na `main`. Acompanhe em GitHub → Actions. Se algum teste falhar, nada é publicado.
- **Publicar de novo sem mudanças:** GitHub → Actions → *CI / Deploy* → *Run workflow*.
- **Rollback:** a branch `deploy` guarda o histórico de builds. Reverter o último commit dela (`git revert`) e dar push; a Hostinger puxa a versão anterior. Migrações não são desfeitas automaticamente.
- **Rodar algo no servidor:** `ssh -p 65002 u501993331@195.200.3.73`, depois `cd ~/domains/trainingup.com.br/public_html/api`.
- **Forçar pós-deploy:** `php artisan deploy:finalize --force`.
- **Dar ou tirar o papel de admin:** `php artisan user:make-admin email@exemplo.com` (a conta precisa existir; `--revoke` volta para usuário comum).
- **Logs:** `api/storage/logs/laravel-AAAA-MM-DD.log` (14 dias).
- **Backups:** `api/storage/app/private/backups/`. Restaurar: `gunzip < arquivo.sql.gz | mysql -u USUARIO -p BANCO`.

## Pendências conhecidas

- Ao editar o `.env` pelo Gerenciador de Arquivos, a permissão volta para 644. Não expõe nada (o `.htaccess` bloqueia), mas dá para restaurar com `chmod 600 .env` pelo SSH.
- Falhas de backup, deploy e envio de e-mail, e erros inesperados, vão para o log e para Painel admin → Alertas (`admin_alerts`). Não há aviso por e-mail: é preciso abrir o painel (as Métricas mostram quantos alertas estão abertos).
