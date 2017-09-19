'use strict';

const ref = require('ref');
const ffi = require('ffi');

const { CString, int } = ref.types;
const GO_SIGNER = ffi.Library('./build/escher', {
  SignURL: [CString, [CString, CString, CString, CString, int]],
  SignRequest: [CString, [CString, CString, CString, CString]]
});

class EscherSignerError extends Error {}

class EscherSigner {
  constructor(
    apiKey,
    apiSecret,
    credentialScope,
    hashAlgo = 'SHA256',
    algoPrefix = 'EMS',
    vendorKey = 'EMS',
    authHeaderName = 'X-EMS-Auth',
    dateHeaderName = 'X-EMS-Date'
  ) {
    this._config = {
      accessKeyId: apiKey,
      apiSecret: apiSecret,
      hashAlgo: hashAlgo,
      algoPrefix: algoPrefix,
      vendorKey: vendorKey,
      authHeaderName: authHeaderName,
      dateHeaderName: dateHeaderName,
      credentialScope: credentialScope
    };
  }

  signRequest(method, url, body, headers, headers_to_sign = [], date = new Date().toISOString(), expires = 600) {
    const request = this._createRequest(method, url, headers, body);
    const signResult = this._signRequest(request, headers_to_sign, date, expires);
    return this._unwrapRequestSignResult(signResult);
  }

  _createRequest(method, url, headers, body) {
    const headersTransformed = Object.keys(headers).map(h => [h, headers[h]]);
    return {
      method,
      url,
      headers: headersTransformed,
      body
    };
  }

  _signRequest(request, headers_to_sign, date, expires) {
    const config = this._create_config(date, expires);
    const c_result = GO_SIGNER.SignRequest(
      JSON.stringify(config),
      JSON.stringify(request),
      JSON.stringify(headers_to_sign),
      date
    );
    return JSON.parse(c_result);
  }

  _unwrapRequestSignResult(signResult) {
    if (signResult.SignError != '') throw new EscherSignerError(signResult.SignError);

    const signedHeaders = {};
    for (let header of signResult.RequestHeaders) signedHeaders[header[0]] = header[1];

    return signedHeaders;
  }

  signURL(method, url, date = new Date().toISOString(), expires = 600) {
    const signResult = this._sign_url(method, url, date, expires);
    return this._unwrapUrlSignResult(signResult);
  }

  _sign_url(method, url, date, expires) {
    const config = this._create_config(date, expires);
    const c_result = GO_SIGNER.SignURL(JSON.stringify(config), method, url, date, expires);
    return JSON.parse(c_result);
  }

  _create_config(date, expires) {
    const config = { ...this._config, date, expires };
    return config;
  }

  _unwrapUrlSignResult(result) {
    if (result.SignError !== '') throw new EscherSignerError(result.SignError);
    return result.SignedURL;
  }
}

module.exports = EscherSigner;
