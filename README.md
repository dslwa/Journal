# Trading Journal

Trading Journal to aplikacja do prowadzenia dziennika tradera z modułami dla transakcji, analityki, journalu, playbooków, kalendarza makro i planowania długoterminowego.

## Co Jest W Środku

- `Trades` do zapisywania i edycji transakcji
- `Analytics` z equity curve, win rate, profit factor i drawdown
- `Journal` do dziennych wpisów i review procesu
- `Playbook` do opisywania setupów, checklist i zasad
- `Long Term` do themes, watchlist, goals i review
- `Calendar` z wydarzeniami makro
- załączniki do trade'ów oraz upload obrazów do playbooków

## Wymagania

- Docker
- Docker Compose

## Quick Start

```bash
./start.sh
```

Alternatywnie:

```bash
docker compose up --build
```

Po starcie:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- PostgreSQL: `localhost:5443`
  user: `postgres`
  password: `postgres`
  database: `journal_db`

## Lokalne Demo

Domyślny profil to `dev`, więc lokalnie ładują się standardowe migracje oraz dev-seedy z [backend/src/main/resources/db/dev](/home/danie/Journal/backend/src/main/resources/db/dev).

Demo konto lokalne:

- email: `demo@local.dev`
- hasło: `demo12345`

To konto jest seedowane tylko dla środowiska developerskiego i ma przykładowe:

- playbooki
- transakcje
- wpisy journalowe
- wpisy `Long Term`
- wydarzenia makro

Jeśli dodasz nową migrację albo seed i chcesz odświeżyć kontenery:

```bash
docker compose up --build
```

Jeśli chcesz uruchomić projekt w tle:

```bash
docker compose up --build -d
```

Zatrzymanie:

```bash
docker compose down
```

## Profile Środowisk

Aplikacja używa profili Springa: `dev` i `prod`.

### Dev

- profil domyślny
- konfiguracja w [application-dev.properties](/home/danie/Journal/backend/src/main/resources/application-dev.properties)
- Flyway ładuje:
  - `classpath:db/migration`
  - `classpath:db/dev`
- lokalne demo działa bez dodatkowej konfiguracji

### Prod

Na serwerze ustaw:

| Variable | Description |
|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DATABASE_URL` | `jdbc:postgresql://host:port/dbname` |
| `DATABASE_USERNAME` | Database user |
| `DATABASE_PASSWORD` | Database password |
| `JWT_SECRET` | Minimum 32 znaki |
| `JWT_EXPIRATION_MS` | TTL tokena JWT |
| `FRONTEND_URL` | URL frontendu używany przez backend |
| `APP_UPLOAD_DIR` | Katalog uploadów |
| `FINNHUB_API_KEY` | Klucz API Finnhub |
| `FMP_API_KEY` | Klucz API Financial Modeling Prep |
| `SMTP_HOST` | Host SMTP |
| `SMTP_PORT` | Port SMTP |
| `SMTP_USERNAME` | Login SMTP |
| `SMTP_PASSWORD` | Hasło lub API key SMTP |

## Główne Widoki

| View | Purpose |
|------|---------|
| `Trades` | historia trade'ów, CRUD, attachments |
| `Analytics` | metryki, equity curve, statystyki po dniach/tagach/strategiach |
| `Journal` | wpisy dzienne i review procesu |
| `Playbook` | strategie, checklisty, opisy setupów, obrazy |
| `Long Term` | themes, watchlist, goals, review |
| `Calendar` | wydarzenia makro |

## Główne Endpointy API

### Public

| Method | Endpoint | Notes |
|--------|----------|-------|
| `POST` | `/api/auth/register` | rejestracja |
| `POST` | `/api/auth/login` | logowanie |
| `POST` | `/api/auth/forgot-password` | rozpoczęcie resetu hasła |
| `POST` | `/api/auth/reset-password` | ustawienie nowego hasła |

### Protected

Wszystkie poniższe endpointy wymagają nagłówka:

```text
Authorization: Bearer <token>
```

| Method | Endpoint | Notes |
|--------|----------|-------|
| `GET` | `/api/me` | dane zalogowanego użytkownika |
| `PUT` | `/api/users/balance` | aktualizacja initial balance |
| `GET/POST/PUT/DELETE` | `/api/trades` | CRUD transakcji |
| `GET/POST/DELETE` | `/api/trades/{id}/attachments` | załączniki do trade'a |
| `GET/POST/PUT/DELETE` | `/api/playbooks` | CRUD playbooków |
| `GET/POST/PUT/DELETE` | `/api/playbook` | alias kompatybilności dla playbooków |
| `POST` | `/api/playbooks/{id}/image` | upload obrazu playbooka |
| `GET/POST/PUT/DELETE` | `/api/journal` | journal entries |
| `GET` | `/api/macro-events` | lista wydarzeń makro |
| `GET/POST/PUT/DELETE` | `/api/long-term` | planning długoterminowy |
| `GET` | `/api/market/price/{symbol}` | podgląd ceny instrumentu |

## Dostęp Do Bazy

```bash
docker exec -it journal-db psql -U postgres -d journal_db
```

## Struktura Projektu

```text
backend/
├── src/main/java/com/journal/backend/
│   ├── controller/      # REST endpoints
│   ├── service/         # logika biznesowa
│   ├── repository/      # Spring Data JPA
│   ├── model/           # encje JPA
│   ├── dto/             # request/response DTOs
│   ├── mapper/          # mapowanie entity <-> DTO
│   ├── enums/           # enumy domenowe
│   ├── exception/       # wyjątki i global handler
│   └── security/        # JWT i security config
└── src/main/resources/
    ├── db/migration/    # główne migracje Flyway
    └── db/dev/          # dev-only seedy i dane demo

frontend/
├── src/pages/           # główne widoki
├── src/components/      # layout i UI
├── src/api/             # klient API
├── src/contexts/        # context providers
├── src/types/           # typy TypeScript
└── src/utils/           # kalkulacje i helpery
```

## Tech Stack

- Backend: Java 21, Spring Boot, Spring Security, JWT, Flyway
- Frontend: React, TypeScript, Vite
- Database: PostgreSQL 16
- Infra lokalna: Docker Compose
