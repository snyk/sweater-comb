FROM node:14-alpine
ENV NODE_ENV=development
WORKDIR /usr/src/sweater-comb
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install
COPY . .
RUN yarn build
USER node
ENV NODE_PATH /usr/src/sweater-comb
VOLUME /target
WORKDIR /target
ENTRYPOINT [ "node", "/usr/src/sweater-comb/build/index.js" ]
