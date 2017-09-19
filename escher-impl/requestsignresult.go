package main

import "encoding/json"

// RequestSignResult Request sign result
type RequestSignResult struct {
	RequestHeaders [][2]string `json:"RequestHeaders"`
	SignError      string      `json:"SignError"`
}

// MarshalJSON returns json encoded result
func (s *RequestSignResult) MarshalJSON() ([]byte, error) {
	j := &RequestSignResult{
		RequestHeaders: s.RequestHeaders,
		SignError:      s.SignError,
	}
	return json.Marshal(j)
}
