# Training Up — Especificação do Produto e Plano de Implementação

> Documento-fonte para o Claude Code. Domínio: **trainingup.com.br**. Dono do produto: **Brenno**.

---

## 0. Como usar este documento (instruções para o Claude Code)

1. **Siga as fases na ordem** (seção 10). Uma fase por vez. Não adiante funcionalidades de fases futuras.
2. **Ao final de cada fase, PARE**: apresente o que foi feito, como testar e o checklist de aceite. Só avance com o ok do Brenno.
3. **Ações do Brenno** (marcadas com 🧑‍💻): quando chegar em uma, **pare e peça** com instruções passo a passo do que ele precisa criar/configurar e quais dados devolver (credenciais, hosts etc.). Nunca invente credenciais.
4. **Ambiguidade = pergunta.** Se algo não estiver definido aqui, pergunte antes de implementar. Não presuma.
5. Mantenha um `docs/CHANGELOG.md` e um `docs/DECISIONS.md` (decisões tomadas durante a implementação).
6. Código, nomes de tabelas/variáveis em **inglês**; textos de interface em **português (pt-BR)** via arquivos de tradução.

---

## 1. Visão do produto

**Training Up** é um sistema web (PWA) de **treino e dieta** — dois produtos em um:

- **Treino:** questionário → plano de treino gerado (ou montado pelo usuário) → registro das sessões (carga, repetições, check) → evolução.
- **Dieta:** questionário → cálculo de calorias/macros → plano alimentar gerado com trocas dentro do grupo (ou montado pelo usuário) → check diário → lista de compras.
- **Progresso:** peso corporal, medidas, evolução de cargas, consistência.

**Posicionamento:** os planos gerados são **sugestões e estimativas**, não prescrição. Não substituem nutricionista nem profissional de Educação Física. Esse aviso aparece na landing, no questionário, nos planos e nos termos.

**Modelo de negócio:** gratuito durante o beta. Estrutura de planos/assinatura já modelada no banco (apenas plano `free` ativo, sem cobrança).

**Público:** adultos (18+). Menores de 18 são bloqueados no cadastro.

---

## 2. Requisitos gerais (não funcionais)

### 2.1 UX/UI — obrigatório
- **Intuitivo, fácil de usar, clean e bonito.** Prioridade real, não acabamento.
- **Mobile-first.** O uso principal é no celular, inclusive durante o treino na academia (uma mão, tela pequena, botões grandes, poucos toques).
- Hierarquia visual clara, espaçamento generoso, tipografia legível, microinterações sutis (feedback ao marcar série/refeição).
- Estados vazios, de carregamento e de erro desenhados em todas as telas.
- Acessibilidade: contraste AA, foco visível, labels em inputs, áreas de toque ≥ 44px.
- **Tema escuro como padrão**, tema claro disponível; usuário troca no Perfil (persistido na conta + localStorage como fallback).

### 2.2 Internacionalização
- Somente **pt-BR** no lançamento, mas **todo texto em arquivos de tradução** (frontend e e-mails do backend). Nenhuma string de UI hardcoded.
- Datas, números e decimais formatados por locale.

### 2.3 Unidades
- Padrão: **kg** e **cm**. Usuário pode trocar para **lb** e **ft/in** no Perfil.
- **Banco armazena sempre em métrico** (kg, cm, g). Conversão apenas na exibição/entrada.

### 2.4 PWA e offline
- Instalável (manifest, ícones, splash, tema).
- **Registro de treino funciona 100% offline** (fase 8.6) e sincroniza ao voltar a conexão.
- Plano de treino e plano alimentar do usuário ficam em cache para consulta offline.

### 2.5 Segurança
- HTTPS obrigatório.
- Senhas com hash (bcrypt/argon2 padrão do Laravel).
- Rate limiting em login, cadastro, envio/validação de código, recuperação de senha.
- Proteção CSRF (Sanctum SPA).
- Dados de saúde (respostas de triagem/condições) com **cast criptografado** no banco.
- Logs não devem conter dados de saúde nem senhas/códigos.

### 2.6 LGPD
- Dados de saúde são **dados pessoais sensíveis** (art. 11). Consentimento específico e destacado, registrado com data/versão do texto.
- Exportação de dados (JSON) e exclusão de conta pelo próprio usuário.
- Política de privacidade declara explicitamente o **acesso de suporte (admin) em modo leitura** e seus registros.
- Textos legais gerados como rascunho; recomendar revisão jurídica antes de cobrar.

---

## 3. Stack e arquitetura

### 3.1 Stack
| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + TypeScript |
| UI | Tailwind CSS + biblioteca de componentes acessível (ex.: shadcn/ui/Radix) |
| Dados/cache | TanStack Query |
| Offline | IndexedDB (Dexie) + fila de sincronização |
| PWA | vite-plugin-pwa (Workbox) |
| i18n | react-i18next |
| Gráficos | Recharts (ou equivalente leve) |
| Formulários | React Hook Form + Zod |
| Backend | Laravel (versão estável mais recente compatível com o PHP da Hostinger) — API REST |
| Auth | Laravel Sanctum (SPA, cookie), Socialite (Google), 2FA TOTP (Fortify ou pacote equivalente) |
| Banco | MySQL (Hostinger) |
| E-mail | SMTP Hostinger (`noreply@trainingup.com.br`) |
| Filas/agendamentos | Driver `database` + cron chamando `schedule:run` (hospedagem compartilhada, sem worker contínuo) |

### 3.2 Hospedagem (Hostinger Premium, com SSH)
- `trainingup.com.br` → build estático do React (`public_html`).
- `api.trainingup.com.br` → Laravel (pasta fora de `public_html`; subdomínio aponta para `laravel/public`).
- Sanctum: `SESSION_DOMAIN=.trainingup.com.br`, `SANCTUM_STATEFUL_DOMAINS=trainingup.com.br`.
- SPA: fallback de rotas para `index.html` via `.htaccess`.
- Deploy: script documentado (e, se viável, GitHub Actions via SSH/rsync): build do front → upload; back → `git pull`, `composer install --no-dev`, `php artisan migrate --force`, cache de config/rotas.
- Backup: dump diário do MySQL via agendamento + retenção de 7 dias; falha gera alerta no admin.

### 3.3 Estrutura do repositório (monorepo)
```
/frontend      React PWA
/backend       Laravel API
/docs          SPEC (este arquivo), DECISIONS, CHANGELOG, DEPLOY, data/ (TACO, seeds)
```

---

## 4. Modelo de dados (visão inicial — refinar na implementação)

- `users` — nome, e-mail, senha (nullable p/ Google), `google_id`, `birth_date`, `email_verified_at`, `role` (`user`|`admin`), `plan_id`, 2FA (secret, recovery codes, confirmed_at), `theme`, `weight_unit`, `length_unit`, `locale`.
- `plans` — `free` (único ativo). Estrutura pronta para planos pagos.
- `email_verification_codes` — hash do código, expiração, tentativas.
- `consents` — tipo (termos, privacidade, dados de saúde, cookies), versão do documento, aceito em, IP.
- `questionnaires` — versionado por usuário (cada reavaliação cria nova versão); seções: pessoal, rotina, objetivo, treino, alimentação.
- `health_screenings` — respostas PAR-Q, gestante/lactante, condições (criptografado), resultado (`clear`|`blocked`), histórico de retificações (data, resposta anterior → nova).
- `body_weights` — data, peso.
- `body_measurements` — data, tipo (cintura, pescoço, braço, peito, quadril, coxa…), valor.
- **Treino:** `exercises` (nome, grupo muscular primário/secundários, padrão de movimento, equipamento, nível, contraindicações por lesão, ativo), `workout_templates` (moldes versionados), `workout_plans` (`generated`|`manual`, ativo, versão do molde usada), `workout_plan_days`, `workout_plan_exercises` (séries, faixa de reps, descanso, ordem), `workout_sessions` (UUID gerado no cliente, início/fim, origem `full`|`quick_check`), `session_sets` (carga, reps, concluída), `cardio_logs`, `personal_records`.
- **Dieta:** `food_groups`, `foods` (origem `taco`|`admin`|`user`, `owner_user_id` p/ alimento próprio, nutrientes por 100 g, grupo, porção de referência, medida caseira), `meal_templates` (moldes versionados), `diet_plans` (`generated`|`manual`, `day_type`: `all`|`training`|`rest`, metas kcal/macros), `diet_plan_meals`, `diet_plan_items`, `meal_checks` (data, refeição, comi/não comi).
- **Admin:** `admin_impersonation_logs` (admin, usuário, motivo, início, fim), `admin_alerts` (tipo, mensagem, status), `app_settings` (parâmetros de cálculo editáveis).

---

## 5. Regras de negócio

### 5.1 Triagem de saúde
- Questionário inclui **PAR-Q** (7 perguntas padrão de prontidão para atividade física), **gestante/lactante** e **condições clínicas** (diabetes, hipertensão, doença cardíaca, renal, hepática, transtorno alimentar diagnosticado, outra).
- **Qualquer resposta "sim" → bloqueia planos GERADOS (treino e dieta).** Mensagem clara e respeitosa orientando procurar médico/profissional.
- Usuário bloqueado **continua usando**: ficha de treino manual, plano alimentar manual, registro, histórico, progresso, lista de compras.
- Usuário pode **retificar** respostas em "Meus dados"; cada retificação fica registrada (data, antes/depois) e exige confirmação explícita ("Confirmo que as informações estão corretas").
- Menor de 18 anos: cadastro bloqueado.

### 5.2 Cálculo de calorias e macros (dieta gerada)
Todos os parâmetros abaixo ficam em `app_settings`, **editáveis no admin**. Valores iniciais:

1. **TMB (Mifflin-St Jeor):** homem `10×peso + 6,25×altura − 5×idade + 5`; mulher `… − 161`.
2. **Fator de atividade** (combinação trabalho + treinos/semana): 1,2 / 1,375 / 1,55 / 1,725 / 1,9 — tabela de mapeamento documentada em `DECISIONS.md`.
3. **GET** = TMB × fator.
4. **Ajuste por objetivo:** perder gordura leve −15%, moderado −20%; manter 0%; ganhar massa leve +5%, moderado +10%.
5. **Travas:** déficit máximo 25%; calorias nunca abaixo da TMB nem de 1.500 kcal (homem) / 1.200 kcal (mulher).
6. **Proteína:** perder 2,0 g/kg; manter 1,6 g/kg; ganhar 1,8 g/kg. Se IMC ≥ 30, usar peso de referência (peso correspondente a IMC 25 na altura do usuário).
7. **Gordura:** 0,8 g/kg (mesmo peso de referência), mínimo 20% das kcal.
8. **Carboidrato:** restante das calorias.
9. **Dois planos (opcional no questionário):** dia de treino e dia de descanso com a mesma média semanal; dia de treino +10% kcal (via carboidrato), dia de descanso ajustado para fechar a média. Proteína igual nos dois.

### 5.3 Geração do plano alimentar (por regras, sem IA)
1. **Número de refeições** escolhido pelo usuário (3 a 6); recomendação exibida: 4–5.
2. **Distribuição de kcal por refeição** conforme o molde (ex. 5 refeições: café 20%, lanche 10%, almoço 30%, lanche 15%, jantar 25%).
3. **Molde de refeição** (editável no admin, versionado): define slots por grupo (ex. almoço = carboidrato + proteína + leguminosa + vegetais + gordura).
4. **Porções:** cada grupo tem porção de referência. Dimensionar proteína para a meta de proteína; fixar gordura; completar kcal com carboidrato.
5. **Seleção do alimento:** alimento padrão do grupo, excluindo os que o usuário não come e respeitando restrições (vegetariano, vegano, sem lactose, sem glúten).
6. **Arredondamento** para medidas reais: múltiplos de 10 g, unidades (1 ovo, 1 fatia), medida caseira exibida junto.
7. **Troca:** somente dentro do mesmo grupo; quantidade recalculada para manter as kcal equivalentes.
8. Exibir kcal e macros por refeição e total do dia vs meta.
9. Alterações de molde afetam **apenas planos gerados depois**.

### 5.4 Plano alimentar manual
- Usuário monta refeições escolhendo **qualquer alimento** da base (TACO/admin) ou **alimento próprio**.
- **Alimento próprio:** cadastrado a partir da tabela nutricional da embalagem (porção, kcal, proteína, carboidrato, gordura; fibras/sódio opcionais), visível **só para o dono**.
- Mostra totais vs meta calculada (se o usuário tiver meta; bloqueados pela triagem veem só os totais).

### 5.5 Geração do treino (por regras, sem IA)
1. **Divisão por frequência:** 2× corpo inteiro A/B; 3× corpo inteiro A/B/C; 4× superior/inferior; 5× empurrar/puxar/pernas + superior/inferior; 6× empurrar/puxar/pernas ×2.
2. **Nº de exercícios por sessão pelo tempo:** 30 min → 4; 45 → 5; 60 → 6; 75+ → 7.
3. **Molde de treino** (editável no admin, versionado): slots por padrão de movimento (agachar, dobrar quadril, empurrar horizontal/vertical, puxar horizontal/vertical, isolados, core).
4. **Séries/reps/descanso** por objetivo e nível (valores iniciais no admin): iniciante 2–3 séries; intermediário/avançado 3–4; ganhar massa 8–12 reps; perder gordura 10–15 reps; descanso compostos 90–120 s, isolados 60 s.
5. **Filtros:** equipamento disponível (academia completa / academia de prédio / casa + itens), nível, e **exclusão por contraindicação** das lesões informadas.
6. **Troca:** somente por exercício do mesmo padrão de movimento e grupo muscular, respeitando os mesmos filtros.
7. **Progressão sugerida (dupla progressão):** ao atingir o topo da faixa de reps em todas as séries, sugerir aumento de carga na próxima sessão.
8. **Cardio:** se o usuário quiser — tipo, frequência e duração sugeridos conforme objetivo e dias disponíveis.

### 5.6 Ficha de treino manual
- Usuário monta seus treinos (A, B, C…) escolhendo **somente exercícios da base** (não há exercício próprio), com séries, reps, carga-alvo e descanso.

### 5.7 Registro de treino
- **Sessão completa:** por série, carga e reps (pré-preenchidos com a última sessão), check por série, timer de descanso automático, observação.
- **Check rápido:** "Treino feito" sem detalhes (conta para consistência, não para evolução de carga).
- **"Última vez":** exibe a última carga × reps de cada exercício.
- **Recorde pessoal:** detectado automaticamente (maior carga em um exercício para ≥ 1 rep; e maior carga × reps) e destacado.
- Resumo ao finalizar: duração, volume total (Σ carga × reps), recordes.

### 5.8 Peso e medidas
- Peso: lançamento diário ou quando o usuário quiser. Gráfico com **média móvel de 7 dias** em destaque + pontos diários.
- Medidas (opcional): cintura, pescoço, braço, peito, quadril, coxa (lista configurável no admin). Gráfico de evolução por medida.

### 5.9 Consistência
- Treinos: realizados / planejados na semana.
- Dieta: refeições marcadas "comi" / refeições do plano na semana (apenas para quem usa o check).
- Quem não marca não é penalizado nem cobrado; o indicador simplesmente não aparece.

### 5.10 Reavaliação
- Sugerida a cada 4 semanas ou variação de ±3 kg desde o último plano (aviso no "Hoje").
- Refazer questionário completo **ou** editar itens isolados em "Meus dados" (objetivo, lesões, dias de treino etc.). Ao salvar: "Quer gerar um novo plano com isso?".
- Planos antigos vão para histórico (somente leitura).

---

## 6. Telas

### 6.1 Landing page (`/`) — página única com rolagem
1. **Header fixo:** logo, links âncora (Como funciona · Recursos · FAQ), botões **Entrar** e **Criar conta**.
2. **Hero:** título forte, subtítulo, CTA "Comece grátis", selo **"Gratuito durante o beta"**, mockup do app em celular.
3. **Dois produtos em um:** cards Treino e Dieta (3 bullets cada).
4. **Como funciona:** 3 passos — Responda o questionário → Receba seus planos → Registre e evolua.
5. **Recursos:** grade com 6 — treino gerado, registro offline, evolução de carga, plano alimentar com trocas, lista de compras, acompanhamento de peso e medidas.
6. **Instale como app:** instruções iPhone e Android.
7. **FAQ:** É grátis? Substitui nutricionista/personal? Funciona sem internet? O que fazem com meus dados? Posso montar meu próprio treino/dieta?
8. **CTA final.**
9. **Footer:** Termos, Privacidade, Cookies, contato, aviso "Os planos são sugestões e estimativas e não substituem acompanhamento profissional."
10. **Banner de cookies** na primeira visita.
- **Sem depoimentos** (não há usuários reais; não inventar).
- SEO básico: title, description, Open Graph, favicon.

### 6.2 Autenticação
- **Entrar:** e-mail, senha (mostrar/ocultar), "Esqueci minha senha", "Continuar com Google", link "Criar conta". Se 2FA ativo → tela de código TOTP (ou código de recuperação).
- **Criar conta:** nome, e-mail, senha (requisitos visíveis), data de nascimento, checkbox obrigatório de Termos + Privacidade, "Continuar com Google".
- **Verificar e-mail (cadastro sem Google):** código de **6 dígitos** por e-mail, validade 15 min, máx. 5 tentativas, reenvio com espera de 60 s. Sem verificação, não acessa o app.
- **Completar cadastro (Google):** data de nascimento + aceite (Google não fornece).
- **Esqueci a senha / Redefinir senha.**
- Opções de login: **e-mail+senha e Google**. (Apple fora do escopo.)

### 6.3 Questionário (wizard, barra de progresso, salva e continua depois)
1. **Sobre você:** sexo biológico (explicar que é para o cálculo), altura, peso, unidades.
2. **Saúde:** PAR-Q, gestante/lactante, condições clínicas. Consentimento específico de dados de saúde.
3. **Rotina:** trabalho sedentário / em pé / fisicamente ativo.
4. **Objetivo:** perder gordura / manter / ganhar massa; ritmo leve/moderado.
5. **Treino:** experiência, dias por semana e quais dias, tempo por sessão, local, equipamentos, lesões/limitações, cardio (sim/não, preferência).
6. **Alimentação:** restrições, alimentos que não come (seleção por grupo), nº de refeições, plano único ou treino/descanso.
7. **Resumo:** revisão, aceite do aviso "sugestão e estimativa", botão **Gerar meus planos** (ou mensagem de bloqueio da triagem + caminho para planos manuais).

### 6.4 Navegação do app
- **Mobile:** barra inferior com 5 itens. **Desktop:** menu lateral com os mesmos itens.
- **Hoje · Treino · Dieta · Progresso · Perfil**

#### Hoje
- Saudação + data.
- Card **Treino do dia** (nome, "Iniciar", check rápido "Treino feito"; ou "Descanso").
- **Refeições do dia** com check (comi / não comi).
- **Peso de hoje** (lançamento rápido).
- **Consistência da semana.**
- **Avisos** (reavaliação sugerida, sincronização pendente).

#### Treino (abas)
- **Meu plano:** semana com treinos; exercícios com séries/reps/descanso; "Trocar"; alternar para/criar **ficha manual**.
- **Sessão ativa** (tela cheia): exercício atual, "Última vez", inputs por série pré-preenchidos, check, timer automático, observação, destaque de recorde, registro de cardio, finalizar → resumo. Funciona offline.
- **Histórico:** calendário de dias treinados + lista de sessões com detalhe.
- **Exercícios:** biblioteca (busca, filtro por grupo muscular/equipamento).

#### Dieta (abas)
- **Meu plano:** seletor treino/descanso (se houver); refeições com alimentos, gramas e medida caseira; kcal/macros por refeição e total; "Trocar" (mesmo grupo, quantidade equivalente); alternar para/criar **plano manual**; cadastrar **alimento próprio**.
- **Hoje:** check por refeição (comi / não comi).
- **Lista de compras:** semanal, gerada do plano ativo, agrupada por categoria, quantidade total, marcar como comprado.

#### Progresso (abas)
- **Peso:** lançamento, gráfico com média móvel 7 dias, variação total.
- **Medidas:** lançamento opcional, gráfico por medida.
- **Cargas:** escolher exercício → gráfico de evolução + recordes pessoais.
- **Consistência:** treinos e dieta por semana.

#### Perfil
- Dados pessoais.
- **Meus dados** (editar itens do questionário: objetivo, lesões, dias, restrições… → oferecer regerar plano).
- Reavaliar (refazer questionário completo).
- Preferências: tema (escuro/claro), unidades.
- Segurança: trocar senha, **ativar/desativar 2FA (TOTP + códigos de recuperação)**, vincular/desvincular Google.
- Privacidade: exportar meus dados, excluir conta, ver consentimentos.
- Termos, Privacidade, Sobre. Sair.

### 6.5 Painel admin (`role = admin`)
- **Usuários:** lista (nome, e-mail, cadastro, último acesso, status). Clique → **"Ver como usuário"** (impersonação):
  - **somente leitura** (todas as escritas bloqueadas no backend durante a impersonação);
  - motivo obrigatório antes de entrar;
  - faixa fixa "Você está vendo como {nome} — Sair";
  - log em `admin_impersonation_logs`.
- **Exercícios:** CRUD (nome, grupos, padrão, equipamento, nível, contraindicações, ativo).
- **Alimentos e grupos:** CRUD (nutrientes, grupo, porção de referência, medida caseira, ativo).
- **Moldes de treino e de refeição:** CRUD com **versionamento** (alterar cria nova versão; planos existentes mantêm a versão usada).
- **Parâmetros de cálculo:** valores da seção 5.2/5.5.
- **Métricas:** cadastros, ativos na semana, planos gerados, sessões registradas.
- **Alertas:** erros da aplicação, falha de backup, falha de envio de e-mail (listar, marcar resolvido).

---

## 7. Conteúdo a produzir (seeds para revisão do Brenno)

- **Base de exercícios:** ~100 exercícios com grupo muscular, padrão, equipamento, nível e contraindicações. Gerar como seed (CSV/JSON em `docs/data/`) → Brenno revisa → importar.
- **Base de alimentos:** importar **TACO 4ª edição (NEPA/UNICAMP)**; curar ~150 alimentos mais comuns em **grupos de equivalência** com porção de referência e medida caseira (ex.: 1 porção de carboidrato ≈ 100 g arroz cozido ≈ 110 g macarrão cozido ≈ 150 g batata cozida). Brenno revisa → importar.
- **Moldes iniciais** de treino e refeição.
- **Textos legais (rascunho):** Termos de Uso, Política de Privacidade (incluindo acesso de suporte em leitura), Política de Cookies, avisos de "sugestão e estimativa".

---

## 8. Fora do escopo (agora)
Pagamento/cobrança · login Apple · SMS · IA · notificações push · leitura de código de barras · integração com relógios · área social/ranking · modo personal/aluno · exercício próprio · vídeos/GIFs de exercícios · outros idiomas.

---

## 9. Ações do Brenno 🧑‍💻 (consolidado)

O Claude Code deve **parar e pedir** cada uma na fase indicada, com passo a passo.

| Fase | Ação |
|---|---|
| 0.1 | Escolher o conceito de logo e a paleta |
| 0.3 | Criar repositório no GitHub; confirmar/ajustar versão do PHP na Hostinger; fornecer acesso SSH (host, porta, usuário); criar banco MySQL e usuário (nome, usuário, senha, host) |
| 0.3 | Apontar `trainingup.com.br` para a hospedagem; criar subdomínio `api.trainingup.com.br`; ativar SSL nos dois |
| 2 | Criar conta de e-mail `noreply@trainingup.com.br` na Hostinger (fornecer host SMTP, porta, senha); configurar **SPF, DKIM e DMARC** no DNS |
| 4 | Criar projeto no Google Cloud, tela de consentimento OAuth e credenciais (Client ID/Secret) com URI de retorno `https://api.trainingup.com.br/...` |
| 7 | Definir qual e-mail será o admin inicial |
| 8.1 / 10.1 | Revisar seeds de exercícios e de alimentos; baixar a planilha TACO 4ª edição (se o Claude Code não conseguir obter) e colocar em `docs/data/` |
| 3 / antes de cobrar | Revisar textos legais (recomendado: advogado) |

---

## 10. Fases de implementação

Cada fase: entregável publicável, testes do que for regra de negócio (cálculos, geração, permissões), e checklist de aceite. **Parar ao final de cada fase.**

### Fase 0 — Fundação
- **0.1 Identidade visual (PRIMEIRA COISA):** propor **3 conceitos de logo** (SVG, símbolo + nome "Training Up") e **paleta** para tema escuro e claro, tipografia. 🧑‍💻 Brenno escolhe. Só então seguir.
- **0.2 Projeto:** monorepo, Laravel API, React+Vite+TS, Tailwind, design system (tokens de cor/tipografia/espaçamento, componentes base: botão, input, card, modal, abas, toast, bottom nav, sidebar), tema escuro/claro, i18n configurado, PWA instalável (manifest + ícones a partir da logo), lint/format.
- **0.3 Deploy:** 🧑‍💻 ações de infraestrutura; pipeline/script de deploy; `.htaccess`; ambiente de produção no ar com página placeholder; backup diário do banco; `docs/DEPLOY.md`.
- **Aceite:** app instalável no celular, tema alternando, deploy reproduzível.

### Fase 1 — Landing page
- Conforme 6.1, responsiva, bonita, rápida (Lighthouse ≥ 90 em performance/acessibilidade no mobile). Botões levam para `/entrar` e `/criar-conta` (placeholders até a fase 2). Banner de cookies.

### Fase 2 — Cadastro e login (e-mail)
- Criar conta, verificação por código de 6 dígitos, entrar, sair, esqueci/redefinir senha, bloqueio de menor de 18. 🧑‍💻 e-mail + DNS.
- Perfil básico: dados pessoais, tema, unidades.
- Estrutura `plans` com `free`.

### Fase 3 — LGPD
- Termos, Privacidade, Cookies (páginas), registro de consentimentos com versão, exportar dados (JSON), excluir conta (com confirmação e remoção/anonimização efetiva), tela "Meus consentimentos".

### Fase 4 — Login com Google
- Socialite; completar cadastro (nascimento + aceite); vincular/desvincular no Perfil. 🧑‍💻 Google Cloud.

### Fase 5 — 2FA (MFA)
- Ativar no Perfil (QR code TOTP + confirmação), códigos de recuperação, desafio no login, desativar (exige senha + código). Vale para login com e-mail/senha.

### Fase 6 — Questionário e triagem
- Wizard completo (6.3), salvar e continuar, triagem com bloqueio e retificação registrada, consentimento de dados de saúde, "Meus dados" no Perfil para edição por item, versionamento do questionário.

### Fase 7 — Admin base
- Papel admin, layout do painel, usuários + **impersonação somente leitura** com log, métricas, alertas, parâmetros de cálculo.

### Fase 8 — Treino
- **8.1** Base de exercícios: seed para revisão 🧑‍💻, importação, CRUD no admin, biblioteca para o usuário.
- **8.2** Moldes de treino versionados (admin) + parâmetros de séries/reps/descanso.
- **8.3** Geração do plano (5.5) com testes unitários cobrindo frequências, tempos, equipamentos e lesões.
- **8.4** "Meu plano": visualização, troca dentro do padrão/grupo, **ficha manual**.
- **8.5** Registro: sessão completa, check rápido, "última vez", timer, recorde pessoal, cardio, resumo.
- **8.6** Offline: cache do plano, sessão registrada offline em IndexedDB, fila de sync com UUID do cliente (idempotente), indicador de pendências.
- **8.7** Histórico (calendário + lista) e evolução de cargas (gráfico + recordes).

### Fase 9 — Peso e medidas
- Lançamento, gráficos (média móvel 7 dias para peso), medidas opcionais configuráveis no admin.

### Fase 10 — Dieta
- **10.1** Base de alimentos: importação TACO, grupos de equivalência (seed para revisão 🧑‍💻), CRUD no admin, **alimento próprio** do usuário.
- **10.2** Moldes de refeição versionados (admin).
- **10.3** Cálculo de calorias/macros (5.2) com testes unitários (incluindo travas e IMC ≥ 30).
- **10.4** Geração do plano (5.3), plano único ou treino/descanso.
- **10.5** Trocas dentro do grupo com quantidade equivalente.
- **10.6** Plano alimentar manual.
- **10.7** Check diário (comi / não comi).
- **10.8** Lista de compras semanal.

### Fase 11 — "Hoje" e consistência
- Tela Hoje completa (6.4) e indicadores de consistência.

### Fase 12 — Reavaliação
- Aviso de reavaliação (4 semanas / ±3 kg), regerar planos, histórico de planos.

---

## 11. Critérios gerais de pronto (toda fase)
- Funciona e está bonito no mobile (375 px) e no desktop.
- Tema escuro e claro corretos.
- Textos via i18n.
- Unidades respeitadas onde houver peso/medida.
- Regras de negócio com testes automatizados.
- Sem erros no console; erros do backend tratados com mensagem amigável.
- Publicado em produção e `CHANGELOG.md` atualizado.
