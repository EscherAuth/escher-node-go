package main

import (
	"C"
)
import (
	"encoding/json"
	"time"

	"github.com/EscherAuth/escher/keydb"

	"github.com/EscherAuth/escher/config"
	"github.com/EscherAuth/escher/request"
	"github.com/EscherAuth/escher/utils"
	"github.com/EscherAuth/escher/validator"
	"github.com/EscherAuth/escher/signer"
)

// ValidateRequest returns json encoded ValidationResult
//export ValidateRequest
func ValidateRequest(jsonConfig *C.char, jsonRequest *C.char, jsonKeyDB *C.char, jsonHeadersToSign *C.char, date *C.char) *C.char {
	result := validateRequest([]byte(C.GoString(jsonConfig)), []byte(C.GoString(jsonRequest)), []byte(C.GoString(jsonKeyDB)), []byte(C.GoString(jsonHeadersToSign)), C.GoString(date))
	return C.CString(string(result))
}

func validateRequest(jsonConfig []byte, jsonRequest []byte, jsonKeyDB []byte, jsonHeadersToSign []byte, date string) []byte {
	cfg, err := parseConfig(jsonConfig, date)
	if err != nil {
		return returnValidationError("Config/Date parse error", err)
	}

	keyDB, err := keydb.NewFromJSON(string(jsonKeyDB))
	if err != nil {
		return returnValidationError("KeyDB parse error", err)
	}

	headersToSign := []string{}
	err = json.Unmarshal(jsonHeadersToSign, &headersToSign)
	if err != nil {
		return returnValidationError("Headers to sign parse error", err)
	}

	escherRequest, err := request.ParseJSON(jsonRequest)
	if err != nil {
		return returnValidationError("Request parse error", err)
	}

	validatedKeyID, err := validator.New(cfg).Validate(escherRequest, keyDB, headersToSign)
	if err != nil {
		return returnValidationError("Validation error", err)
	}

	result := ValidationResult{
		KeyID:           validatedKeyID,
		ValidationError: "",
	}
	res, err := json.Marshal(result)
	if err != nil {
		return []byte(err.Error())
	}
	return res
}

func returnValidationError(msg string, err error) []byte {
	signResult := ValidationResult{
		KeyID:           "",
		ValidationError: msg + " - " + err.Error(),
	}

	res, err := json.Marshal(signResult)
	if err != nil {
		return []byte(err.Error())
	}
	return res
}

// SignRequest returns json encoded RequestSignResult
//export SignRequest
func SignRequest(jsonConfig *C.char, jsonRequest *C.char, jsonHeadersToSign *C.char, date *C.char) *C.char {
	result := signRequest([]byte(C.GoString(jsonConfig)), []byte(C.GoString(jsonRequest)), []byte(C.GoString(jsonHeadersToSign)), C.GoString(date))
	return C.CString(string(result))
}

// SignURL resturns json encoded URLSignResult
//export SignURL
func SignURL(jsonConfig *C.char, method *C.char, url *C.char, date *C.char, expires C.int) *C.char {
	result := signURL([]byte(C.GoString(jsonConfig)), C.GoString(method), C.GoString(url), C.GoString(date), int(expires))
	return C.CString(string(result))
}

func signURL(jsonConfig []byte, method string, url string, date string, expires int) []byte {
	cfg, err := parseConfig(jsonConfig, date)
	if err != nil {
		return returnURLSignError("Config/Date parse error", err)
	}

	signedURL, err := signer.New(cfg).SignedURLBy(method, url, expires)
	if err != nil {
		return returnURLSignError("Sign error", err)
	}

	result := URLSignResult{
		SignedURL: signedURL,
		SignError: "",
	}
	res, err := json.Marshal(result)
	if err != nil {
		return returnURLSignError("Result encode error", err)
	}
	return res
}

func signRequest(jsonConfig []byte, jsonRequest []byte, jsonHeadersToSign []byte, date string) []byte {
	cfg, err := parseConfig(jsonConfig, date)
	if err != nil {
		return returnRequestSignError("Config/Date parse error", err)
	}

	headersToSign := []string{}
	err = json.Unmarshal(jsonHeadersToSign, &headersToSign)
	if err != nil {
		return returnRequestSignError("Headers to sign parse error", err)
	}

	escherRequest, err := request.ParseJSON(jsonRequest)
	if err != nil {
		return returnRequestSignError("Request parse error", err)
	}

	signResult, err := signEscherRequest(cfg, escherRequest, headersToSign)
	if err != nil {
		return returnRequestSignError("Sign error", err)
	}

	res, err := json.Marshal(signResult)
	if err != nil {
		return returnRequestSignError("Result encode error", err)
	}
	return res
}

func returnRequestSignError(msg string, err error) []byte {
	signResult := RequestSignResult{
		RequestHeaders: [][2]string{},
		SignError:      msg + " - " + err.Error(),
	}

	res, err := json.Marshal(signResult)
	if err != nil {
		return []byte(err.Error())
	}
	return res
}

func returnURLSignError(msg string, err error) []byte {
	signResult := URLSignResult{
		SignedURL: "",
		SignError: msg + " - " + err.Error(),
	}

	res, err := json.Marshal(signResult)
	if err != nil {
		return []byte(err.Error())
	}
	return res
}

func parseConfig(jsonConfig []byte, date string) (config.Config, error) {
	var cfg config.Config
	err := json.Unmarshal(jsonConfig, &cfg)
	if err != nil {
		return config.Config{}, err
	}

	parsedDate, err := utils.ParseTime(date)
	if err != nil {
		return config.Config{}, err
	}
	cfg.Date = parsedDate.In(time.UTC).Format(utils.EscherDateFormat)

	return cfg, nil
}

func signEscherRequest(cfg config.Config, req request.Interface, headersToSign []string) (RequestSignResult, error) {
	signResult := RequestSignResult{
		RequestHeaders: req.Headers(),
		SignError:      "",
	}

	signedRequest, err := signer.New(cfg).SignRequest(req, headersToSign)
	if err != nil {
		return RequestSignResult{}, err
	}
	signResult.RequestHeaders = signedRequest.Headers()

	return signResult, nil
}

func main() {}
