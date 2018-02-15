FROM node:9

MAINTAINER Luca De Feo

RUN apt-get update \
    && apt-get install --no-install-recommends sqlite3 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node

COPY . . 
RUN chown -R node:node .data

USER node
RUN npm install

ENV PORT=38080
EXPOSE 38080

CMD ["npm", "start"]
