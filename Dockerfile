FROM node:12-alpine

ENV NODE_ENV production
ENV NPM_CONFIG_PRODUCTION false

RUN mkdir -p /home/node/app/node_modules \
  && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

RUN npm run build

RUN npm prune --production
RUN npm cache clean --force

EXPOSE 6000

CMD [ "npm", "start" ]
