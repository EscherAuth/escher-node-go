package main

import "encoding/json"

// URLSignResult Request sign result
type URLSignResult struct {
	SignedURL string `json:"SignedURL"`
	SignError string `json:"SignError"`
}

// MarshalJSON returns json encoded result
func (s *URLSignResult) MarshalJSON() ([]byte, error) {
	j := &URLSignResult{
		SignedURL: s.SignedURL,
		SignError: s.SignError,
	}
	return json.Marshal(j)
}
