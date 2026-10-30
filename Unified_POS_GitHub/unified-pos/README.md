# Unified POS System

A senior project by Kyle Plovie at Lawrence Technological University: a point-of-sale application for a venue with multiple bars and bowling lanes.

The React interface supports customer tabs, order entry, cross-bar requests, payment records, receipts, menu management, staff administration, and sales reports. The Express API stores data in SQLite through Prisma. A separate printer simulator polls queued tickets and writes them to the terminal.

## Stack and structure

| Folder | Purpose |
| --- | --- |
| `client/` | React 18, TypeScript, and Vite interface |
| `server/` | Express API, Zod validation, Prisma schema, migrations, and sample data |
| `print-service/` | Terminal-based ticket printer simulator |

This is an npm workspace. Install dependencies from the repository root using the included root lockfile.

## Run locally

Use Node.js 22 and npm. Copy `server/.env.example` to `server/.env` before database setup. The example uses a local SQLite database; no separate database server is required.

From the repository root:

```sh
npm ci
npx prisma generate --schema=server/prisma/schema.prisma
```

Apply the included migrations and seed a new database:

```sh
cd server
npx prisma migrate deploy
npm run db:seed
cd ..
npm run dev
```

Run the seed once per fresh database. It inserts demo records and is not idempotent; repeating it creates duplicate data.

Open `http://localhost:5173`. The API runs at `http://localhost:3001/api`, with a health endpoint at `/api/health`. Vite proxies frontend `/api` requests to port 3001. The default development ports match the example environment. If you change the backend port, also update the Vite proxy and printer URL.

## Demo accounts

These PINs are intentionally public sample credentials created by the seed script.

| PIN | Account | Role |
| --- | --- | --- |
| `0000` | Administrator | ADMIN |
| `1111` | Bartender 1 | BARTENDER |
| `2222` | Bartender 2 | BARTENDER |
| `3333` | Server 1 | SERVER |
| `4444` | Server 2 | SERVER |

## Printer simulator

Start the API first. Log in through `POST /api/users/login` with a demo PIN and use the returned `id` as `PRINTER_USER_ID`. For example, from PowerShell at the repository root:

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/users/login -ContentType 'application/json' -Body '{"pin":"1111"}'
$env:PRINTER_USER_ID = $login.id
npm run dev:print
```

On macOS/Linux, set `PRINTER_USER_ID` in the shell before running `npm run dev:print`. The simulator polls I-Bar, Service Bar, and Quickie Bar every three seconds. It prints to the console and marks jobs complete; no physical printer integration is included.

## Build

```sh
npm run build
npx tsc --noEmit -p print-service/tsconfig.json
```

The build creates `client/dist` and `server/dist`. Start the compiled API with `npm start --workspace=server`. The API does not serve the frontend build; production hosting needs a separate static host and `/api` routing. The provided workflow is intended for a local demo.

## Prototype limitations

Authentication is a classroom prototype: PINs are stored in plaintext, requests trust an `x-user-id` header, and the user-list endpoint exposes PINs without authentication. Do not deploy this version publicly or use real staff/customer data. Production use requires server-verified sessions, protected account endpoints, and hashed credentials.

Payments record cash/card amounts without charging a card or integrating with a payment processor. Money uses floating-point values, and payment/balance updates are not wrapped in a single transaction. Printing is simulated. These areas need further work before operational use.

