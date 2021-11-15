FROM node:14-alpine
ENV NODE_ENV=development
WORKDIR /usr/src/app
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install
COPY . .
RUN yarn build
RUN chown -R node /usr/src/app
USER node
ENTRYPOINT ["node", "build/index.js"]