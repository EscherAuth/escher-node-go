package main

import "encoding/json"

// ValidationResult Request sign result
type ValidationResult struct {
	KeyID           string `json:"KeyID"`
	ValidationError string `json:"ValidationError"`
}

// MarshalJSON returns json encoded result
func (s *ValidationResult) MarshalJSON() ([]byte, error) {
	j := &ValidationResult{
		KeyID:           s.KeyID,
		ValidationError: s.ValidationError,
	}
	return json.Marshal(j)
}
