package server

import "testing"

func TestMustAvatarUploader_ReturnsNilWhenConfigMissingOrInvalid(t *testing.T) {
	if uploader := mustAvatarUploader("", "jobbridge/user"); uploader != nil {
		t.Fatal("expected nil uploader when cloudinary url is empty")
	}
	if uploader := mustAvatarUploader("not-a-cloudinary-url", "jobbridge/user"); uploader != nil {
		t.Fatal("expected nil uploader for invalid cloudinary url")
	}
}

func TestMustCvUploader_ReturnsNilWhenConfigMissingOrInvalid(t *testing.T) {
	if uploader := mustCvUploader(""); uploader != nil {
		t.Fatal("expected nil uploader when cloudinary url is empty")
	}
	if uploader := mustCvUploader("not-a-cloudinary-url"); uploader != nil {
		t.Fatal("expected nil uploader for invalid cloudinary url")
	}
}
