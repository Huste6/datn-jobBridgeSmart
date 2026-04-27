package main

import (
	"reflect"
	"testing"
)

func TestMainEntryPointExists(t *testing.T) {
	if reflect.ValueOf(main).Kind() != reflect.Func {
		t.Fatal("main entrypoint must be a function")
	}
}
