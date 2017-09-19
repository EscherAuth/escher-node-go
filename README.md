# Go Escher from NodeJS

Proof of Concept project for using Go based Escher implementation from a NodeJS application.

## Installation

1. Clone the repository
2. `npm install`

## Building the applicatoin

`make build`

## Starting application

1. `make start` or `node app.js`
2. open `localhost:3000`

The listening port can be modified with the `PORT` environment variable.

## Notes

* tested on Mac OS X 10.12
* application cannot be stopped with `CTRL-C`. However, it can be stopped with `kill -9 PID`.

  Eg. `ps | grep "\d node app.js" | cut -d' ' -f1 | xargs -I {} kill -9 {}`
