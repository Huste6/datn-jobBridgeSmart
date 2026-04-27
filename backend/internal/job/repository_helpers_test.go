package job

import (
	"testing"
)

func TestNormalizeSearchText_RemovesDiacritics(t *testing.T) {
	got := normalizeSearchText("  Da Nang - Đà Nẵng  ")
	want := "da nang - da nang"
	if got != want {
		t.Fatalf("unexpected normalized text: got %q, want %q", got, want)
	}
}

func TestFilterByKeywordAndLocation(t *testing.T) {
	jobs := []Job{
		{Title: "DevOps Engineer", Company: "CloudNova", Description: "Kubernetes and Terraform", Tags: []string{"DevOps"}, Location: "Da Nang"},
		{Title: "Frontend Engineer", Company: "TechCity", Description: "React", Tags: []string{"Frontend"}, Location: "Ha Noi"},
	}

	filtered := filterByKeywordAndLocation(jobs, "kubernetes", "da nang")
	if len(filtered) != 1 {
		t.Fatalf("expected one matching job, got %d", len(filtered))
	}
	if filtered[0].Title != "DevOps Engineer" {
		t.Fatalf("unexpected filtered job title: %q", filtered[0].Title)
	}
}

func TestParseSalaryLevel(t *testing.T) {
	if got := parseSalaryLevel("20 - 35 trieu"); got != 35 {
		t.Fatalf("unexpected salary level: got %d, want 35", got)
	}
	if got := parseSalaryLevel("thoa thuan"); got != 0 {
		t.Fatalf("unexpected salary level for non-numeric input: got %d, want 0", got)
	}
}

func TestFilterBySalaryBand(t *testing.T) {
	jobs := []Job{
		{Title: "A", Salary: "10 - 18 trieu"},
		{Title: "B", Salary: "20 - 35 trieu"},
		{Title: "C", Salary: "36 - 50 trieu"},
		{Title: "D", Salary: "55 - 70 trieu"},
	}

	if got := filterBySalaryBand(jobs, "under20"); len(got) != 1 || got[0].Title != "A" {
		t.Fatalf("under20 filter unexpected result: %+v", got)
	}
	if got := filterBySalaryBand(jobs, "20to35"); len(got) != 1 || got[0].Title != "B" {
		t.Fatalf("20to35 filter unexpected result: %+v", got)
	}
	if got := filterBySalaryBand(jobs, "35to50"); len(got) != 1 || got[0].Title != "C" {
		t.Fatalf("35to50 filter unexpected result: %+v", got)
	}
	if got := filterBySalaryBand(jobs, "over50"); len(got) != 1 || got[0].Title != "D" {
		t.Fatalf("over50 filter unexpected result: %+v", got)
	}
}

func TestNormalizeStringSlice_TrimAndDropEmpty(t *testing.T) {
	got := normalizeStringSlice([]string{"  Go  ", "", "  ", "Kubernetes"})
	if len(got) != 2 {
		t.Fatalf("unexpected normalized slice length: got %d, want 2", len(got))
	}
	if got[0] != "Go" || got[1] != "Kubernetes" {
		t.Fatalf("unexpected normalized slice content: %+v", got)
	}
}
