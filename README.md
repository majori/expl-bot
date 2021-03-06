# expl-bot

![CI](https://github.com/majori/expl-bot/workflows/CI/badge.svg)

# Development

- Install [node.js](https://nodejs.org/en/) v12.\* and [Docker](https://www.docker.com/community-edition)
- Run `npm install`
- Create local database with `docker-compose up -d`
- Copy contents of `.env-sample` to new file called `.env`
- Create your bot with [Botfather](https://telegram.me/botfather) and insert the token to `.env` file
- Source environment variables file with `source .env`
- Initialize database with `npm run migrate:dev`
- Run `npm run dev` to start the bot

# Production (Docker)

- Use existing PostgreSQL database or create one with `docker run --name postgres -e POSTGRES_PASSWORD=<mysecretpassword> -d postgres`
- Make sure your `.env` file contains variables for production use
- Start bot with

```
docker run \
  --name expl-bot \
  -e "PG_CONNECTION_STRING=$PG_CONNECTION_STRING" \
  -e "TG_WEBHOOK=$TG_WEBHOOK" \
  -e "TG_TOKEN=$TG_TOKEN" \
  -p 6000:6000 \
  -d \
  ghrc.io/majori/expl-bot
```

- Run migrations with `docker exec expl-bot npm run migrate`
