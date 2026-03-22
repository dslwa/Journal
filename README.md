# Trading Journal

## Requirements
- Docker & Docker Compose

## Quick Start

```bash
./start.sh
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8081
- Database: localhost:5443 (user: `postgres`, pass: `postgres`, db: `journal_db`)

## Stop

```bash
docker compose down
```

## API Endpoints

### Auth (public)
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/auth/register` | `{ "email", "password", "username" }` |
| POST | `/api/auth/login` | `{ "email", "password" }` |

### Trades (requires JWT)
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/api/trades` | - |
| POST | `/api/trades` | `{ "ticker", "direction", "entryPrice", "positionSize", "openedAt", ... }` |
| PUT | `/api/trades/{id}` | `{ "ticker", "direction", "entryPrice", "positionSize", "openedAt", ... }` |
| DELETE | `/api/trades/{id}` | - |

All protected endpoints require header: `Authorization: Bearer <token>`

## Database access

```bash
docker exec -it journal-db psql -U postgres -d journal_db
```

## Environment setup

The app uses Spring profiles (`dev` / `prod`).

### Dev (default)
Everything is preconfigured in `application-dev.properties`. No extra setup needed - just run `./start.sh`.

### Prod
Set these environment variables on your server:

| Variable | Description |
|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DATABASE_URL` | `jdbc:postgresql://host:port/dbname` |
| `DATABASE_USERNAME` | Database user |
| `DATABASE_PASSWORD` | Database password |
| `JWT_SECRET` | Min 32 chars, random string for signing tokens |

## Project structure

```
backend/
├── controller/     # REST endpoints
├── service/        # Business logic
├── repository/     # Database access (Spring Data JPA)
├── model/          # JPA entities (User, Trade)
├── dto/            # Request/Response objects
├── mapper/         # Entity <-> DTO mapping
├── enums/          # Role, TradeDirection
├── exception/      # Custom exceptions + global handler
├── security/       # JWT, auth filter, security config
└── resources/
    └── db/migration/   # Flyway SQL migrations
```

## Tech Stack
- **Backend:** Java 21, Spring Boot, Spring Security, JWT, Flyway
- **Frontend:** React, TypeScript, Vite
- **Database:** PostgreSQL 16
