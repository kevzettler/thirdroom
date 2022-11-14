FROM node:19-alpine3.15
RUN apk update
RUN apk add git
ADD . /code
WORKDIR /code
RUN yarn
RUN yarn build
