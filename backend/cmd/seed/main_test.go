package main

import "testing"

func TestDefaultAdminSeed_HasExpectedDefaults(t *testing.T) {
	admin := defaultAdminSeed()
	if admin.Email == "" || admin.Password == "" || admin.FullName == "" {
		t.Fatalf("unexpected empty default admin seed: %+v", admin)
	}
}

func TestTotalJobs_SumsAllRecruiterJobs(t *testing.T) {
	data := []recruiterSeed{
		{Jobs: []jobSeed{{Title: "A"}, {Title: "B"}}},
		{Jobs: []jobSeed{{Title: "C"}}},
	}
	if got := totalJobs(data); got != 3 {
		t.Fatalf("unexpected totalJobs result: got %d, want %d", got, 3)
	}
}

func TestSeedData_IsNotEmpty(t *testing.T) {
	recruiters := recruiterSeeds()
	candidates := candidateSeeds()
	if len(recruiters) == 0 {
		t.Fatal("expected recruiterSeeds to return data")
	}
	if len(candidates) == 0 {
		t.Fatal("expected candidateSeeds to return data")
	}
}
