'use strict';

const PORT = parseInt(process.env.PORT || '3000', 10);

const express = require('express');
const EscherSigner = require('./signer.js');
const { EscherValidator } = require('./validator.js');
const request = require('request');

const API_KEY = 'test-key_v1';
const API_SECRET = 'T3St s3cR3T!';
const CREDENTIAL_SCOPE = 'test/credential_scope/ems_request';
const KEY_DB = [
  {
    keyId: API_KEY,
    secret: API_SECRET,
    acceptOnly: 0
  }
];

const app = express();

app.get('/', function(req, res) {
  res.send('<a href="/get_url">Test presigned URL</a>');
});

app.get('/get_url', function(req, res) {
  const signer = new EscherSigner(API_KEY, API_SECRET, CREDENTIAL_SCOPE);
  const signed_url = signer.signURL('GET', 'http://localhost:3000/check_signature');
  res.send(`<a href="${signed_url}">Test signed URL</a>`);
});

app.get('/sign-request', function(req, res) {
  const body = JSON.stringify({ id: 42 });
  const signer = new EscherSigner(API_KEY, API_SECRET, CREDENTIAL_SCOPE);
  const signedHeaders = signer.signRequest('POST', '/check-signed-request', body, { Host: 'localhost:5000' });
  request.post('http://localhost:5000/check-signed-request', {
    body,
    headers: signedHeaders
  }, function reqCb(error, response, body) {
    res.send(body);
  });
});

app.post('/check-signed-request', function(req, res) {
  const validator = new EscherValidator(CREDENTIAL_SCOPE, KEY_DB);
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString('utf8');
  })
  req.on('end', () => {
    let myHeaders = {};
    for (let i = 0; i < req.rawHeaders.length; i += 2)
      myHeaders[req.rawHeaders[i]] = req.rawHeaders[i+1];
    validator.validateRequest(req.method, req.originalUrl, body, { Host: req.header('host'), ...myHeaders });
    res.send({ secret: 'very secret' });
  });


});

app.get('/check_signature', function(req, res) {
  const validator = new EscherValidator(CREDENTIAL_SCOPE, KEY_DB);
  // sok host kombinaciobol ez volt a mukodo
  const validated_key_id = validator.validateURL('GET', req.originalUrl, { Host: req.header('host') });
  res.send(`VALIDATION SUCCEEDED! KEY ID: ${validated_key_id}`);
});

app.listen(PORT, function() {
  console.log('listening on port ' + PORT);
});
