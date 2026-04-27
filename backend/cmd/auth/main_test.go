package main

import "testing"

func TestMustAvatarUploader_ReturnsNilWhenDisabledOrInvalid(t *testing.T) {
	if uploader := mustAvatarUploader("", "jobbridge/user"); uploader != nil {
		t.Fatal("expected nil avatar uploader when cloudinary url is empty")
	}
	if uploader := mustAvatarUploader("invalid-url", "jobbridge/user"); uploader != nil {
		t.Fatal("expected nil avatar uploader when cloudinary url is invalid")
	}
}

func TestMustCvUploader_ReturnsNilWhenDisabledOrInvalid(t *testing.T) {
	if uploader := mustCvUploader(""); uploader != nil {
		t.Fatal("expected nil cv uploader when cloudinary url is empty")
	}
	if uploader := mustCvUploader("invalid-url"); uploader != nil {
		t.Fatal("expected nil cv uploader when cloudinary url is invalid")
	}
}
