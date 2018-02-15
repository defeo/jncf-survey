FROM node:9

MAINTAINER Luca De Feo

RUN apt-get update \
    && apt-get install --no-install-recommends sqlite3 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /home/node

COPY . . 
RUN npm install
RUN mkdir .data && node dbinit.js

ENV PORT=38080
EXPOSE 38080

CMD ["npm", "start"]
