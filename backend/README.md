# Training Up — API (Laravel)

API REST do Training Up. Visão geral e regras do produto em [../docs/SPEC.md](../docs/SPEC.md).

## Rodar localmente
```sh
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --port=8010   # http://localhost:8010
```

## Comandos
- `php artisan test` — testes
- `./vendor/bin/pint` — formatação
