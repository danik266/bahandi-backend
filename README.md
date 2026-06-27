# Bahandi Backend

Backend-only package for Bahandi write-off automation.

Runtime API:

```txt
http://46.101.134.38:4000/api
```

## Local Run

```bash
npm install
cp .env.example .env
docker compose up -d
npm start
```

## Demo Auth

- employees: PIN `1111`
- reviewer: PIN `9999`

## Main Endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/bootstrap`
- `POST /api/requests`
- `PATCH /api/requests/:requestId/approve`
- `PATCH /api/requests/:requestId/reject`

## Server Deploy

Current production server:

- PM2 process: `bahandi-api`
- MongoDB container: `bahandi-mongo`
- MongoDB data volume: `/opt/bahandi-mongo`
- API folder: `/opt/bahandi-api`

Deploy commands on server:

```bash
cd /opt/bahandi-api
npm install
docker compose up -d
pm2 start ecosystem.config.cjs
pm2 save
```
