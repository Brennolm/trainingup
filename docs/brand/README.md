# Marca Training Up — conceito A · Brasa

Escolhido pelo Brenno em 2026-11-21 (fase 0.1). Direção: energia, esportivo, performance.

## Símbolo
Duas setas subindo, inclinadas para dar movimento: progressão de carga, série após série. A seta de cima usa a cor principal; a de baixo, a cor de apoio.

| Arquivo | Uso |
|---|---|
| `symbol-dark.svg` | Símbolo sobre fundo escuro |
| `symbol-light.svg` | Símbolo sobre fundo claro |
| `logo-dark.svg` | Símbolo + nome, fundo escuro |
| `logo-light.svg` | Símbolo + nome, fundo claro |
| `app-icon.svg` | Base dos ícones PWA (512, fundo cheio, símbolo dentro da área segura para ícone *maskable*) |

> O nome nos arquivos `logo-*.svg` está em contornos (paths): renderiza igual em qualquer lugar, sem depender da fonte. Para regenerar: `npm run brand` em `/frontend`.

Nome: **TRAINING UP** em maiúsculas, Barlow Condensed 800 itálico; "UP" na cor principal.

## Cores

| Token | Escuro (padrão) | Claro |
|---|---|---|
| `bg` fundo | `#121316` | `#F7F6F4` |
| `surface` superfície | `#1D1F24` | `#FFFFFF` |
| `text` texto | `#F4F2EF` | `#17181C` |
| `muted` texto secundário | `#9C9EA5` | `#5E6168` |
| `primary` principal | `#FF5A1F` | `#C93D08` |
| `secondary` apoio | `#FFB020` | `#B56E00` |

- Tema escuro: texto sobre o botão principal usa a cor de fundo (`#121316`).
- Tema claro: texto sobre o botão principal usa branco (`#FFFFFF`). O principal é mais escuro no claro para manter o contraste AA.
- As cores de sucesso, alerta e erro serão definidas no design system da fase 0.2.

## Tipografia
- **Títulos:** Barlow Condensed (600/800, itálico 800 para destaques e nome da marca).
- **Texto e números:** Barlow (400/600). Usar `tabular-nums` em cargas, reps e tempos.
