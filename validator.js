'use strict';

const URL = require('url');

const ref = require('ref');
const ffi = require('ffi');

const { CString, int } = ref.types;
const LIB = ffi.Library('./build/escher', {
  ValidateRequest: [CString, [CString, CString, CString, CString, CString]]
});

class EscherValidatorError extends Error {}

class EscherValidator {
  constructor(
    credentialScope,
    keyDB,
    hashAlgo = 'SHA256',
    algoPrefix = 'EMS',
    vendorKey = 'EMS',
    authHeaderName = 'X-EMS-Auth',
    dateHeaderName = 'X-EMS-Date'
  ) {
    this._config = {
      hashAlgo: hashAlgo,
      algoPrefix: algoPrefix,
      vendorKey: vendorKey,
      authHeaderName: authHeaderName,
      dateHeaderName: dateHeaderName,
      credentialScope: credentialScope
    };

    this._keyDB = keyDB;
  }

  validateRequest(method, url, body, headers, headers_to_sign = null, date = null, expires = 600) {
    if (date == null) date = new Date();

    if (headers_to_sign == null) headers_to_sign = [];

    const request = this._create_request(method, url, headers, body);

    const raw_result = this._validate_request(request, headers_to_sign, date, expires);

    return raw_result;
  }

  validateURL(method, url, headers = null, headers_to_sign = null, date = null, expires = 600) {
    let url_to_check = url;

    if (headers == null) headers = {};

    if (!('Host' in headers) && !('host' in headers)) {
      const parsed_url = URL.parse('http://' + url);
      url_to_check = `${parsed_url.path}?${parsed_url.query}`;
      headers['Host'] = parsed_url.host;
    }

    return this.validateRequest(method, url_to_check, '', headers, headers_to_sign, date, expires);
  }

  _create_request(method, url, headers, body) {
    const headers_dict = Object.keys(headers).map(h => [h, headers[h]]);
    return {
      method: method,
      url: url,
      headers: headers_dict,
      body: body
    };
  }

  _validate_request(request, headers_to_sign, date, expires) {
    const config = this._create_config(date, expires);
    const config_json = JSON.stringify(config);

    const request_json = JSON.stringify(request);
    const keydb_json = JSON.stringify(this._keyDB);
    const headers_to_sign_json = JSON.stringify(headers_to_sign);
    const date_str = date.toISOString();

    const c_result = LIB.ValidateRequest(config_json, request_json, keydb_json, headers_to_sign_json, date_str);

    return this._parse_validation_result(JSON.parse(c_result));
  }

  _create_config(date, expires) {
    const config = Object.assign({}, this._config);
    config['date'] = date.toISOString();
    config['expires'] = expires;
    return config;
  }

  _parse_validation_result(result) {
    if (result['ValidationError'] != '') throw new EscherValidatorError(result['ValidationError']);

    return result['KeyID'];
  }
}
module.exports = {
  EscherValidator,
  EscherValidatorError
};
