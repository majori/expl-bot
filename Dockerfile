FROM node:16 AS build

COPY . /app
WORKDIR /app

RUN npm ci
RUN npm run build

RUN npm prune --production
RUN npm cache clean --force

FROM gcr.io/distroless/nodejs:16

ENV NODE_ENV production

COPY --from=build /app /app
WORKDIR /app

EXPOSE 6000
CMD [ "build/index.js" ]
