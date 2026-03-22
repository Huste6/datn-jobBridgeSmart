package job

import (
	"context"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"unicode"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"golang.org/x/text/unicode/norm"
)

type Repository interface {
	FindAll(ctx context.Context) ([]Job, error)
	FindByQuery(ctx context.Context, query JobQuery) ([]Job, error)
	FindByID(ctx context.Context, id string) (*Job, error)
}

type JobQuery struct {
	Keyword          string
	Location         string
	SalaryBand       string
	EmploymentTypes  []string
	ExperienceLevels []string
	Sort             string
}

type repository struct {
	collection *mongo.Collection
}

func NewRepository(db *mongo.Database) Repository {
	return &repository{
		collection: db.Collection("jobs"),
	}
}

func (r *repository) FindAll(ctx context.Context) ([]Job, error) {
	var jobs []Job
	cursor, err := r.collection.Find(ctx, bson.M{}, options.Find().SetSort(bson.D{{Key: "posted_at", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &jobs); err != nil {
		return nil, err
	}

	if jobs == nil {
		jobs = []Job{}
	}

	return jobs, nil
}

func (r *repository) FindByQuery(ctx context.Context, query JobQuery) ([]Job, error) {
	filter := bson.M{}
	andConditions := bson.A{}

	if len(query.EmploymentTypes) > 0 {
		andConditions = append(andConditions, bson.M{"employment_type": bson.M{"$in": query.EmploymentTypes}})
	}

	if len(query.ExperienceLevels) > 0 {
		andConditions = append(andConditions, bson.M{"experience_level": bson.M{"$in": query.ExperienceLevels}})
	}

	if len(andConditions) > 0 {
		filter["$and"] = andConditions
	}

	var jobs []Job
	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &jobs); err != nil {
		return nil, err
	}

	jobs = filterByKeywordAndLocation(jobs, query.Keyword, query.Location)
	jobs = filterBySalaryBand(jobs, query.SalaryBand)

	sortMode := strings.ToLower(strings.TrimSpace(query.Sort))
	switch sortMode {
	case "title":
		sort.SliceStable(jobs, func(i, j int) bool {
			return strings.ToLower(jobs[i].Title) < strings.ToLower(jobs[j].Title)
		})
	case "company":
		sort.SliceStable(jobs, func(i, j int) bool {
			return strings.ToLower(jobs[i].Company) < strings.ToLower(jobs[j].Company)
		})
	default:
		sort.SliceStable(jobs, func(i, j int) bool {
			return jobs[i].PostedAt.After(jobs[j].PostedAt)
		})
	}

	if jobs == nil {
		jobs = []Job{}
	}

	return jobs, nil
}

func filterByKeywordAndLocation(jobs []Job, keyword string, location string) []Job {
	normalizedKeyword := normalizeSearchText(keyword)
	normalizedLocation := normalizeSearchText(location)

	if normalizedKeyword == "" && normalizedLocation == "" {
		return jobs
	}

	filtered := make([]Job, 0, len(jobs))
	for _, item := range jobs {
		haystack := normalizeSearchText(item.Title + " " + item.Company + " " + item.Description + " " + strings.Join(item.Tags, " "))
		normalizedJobLocation := normalizeSearchText(item.Location)

		keywordMatched := normalizedKeyword == "" || strings.Contains(haystack, normalizedKeyword)
		locationMatched := normalizedLocation == "" || strings.Contains(normalizedJobLocation, normalizedLocation)

		if keywordMatched && locationMatched {
			filtered = append(filtered, item)
		}
	}

	return filtered
}

func normalizeSearchText(input string) string {
	trimmed := strings.TrimSpace(strings.ToLower(input))
	if trimmed == "" {
		return ""
	}

	decomposed := norm.NFD.String(trimmed)
	b := strings.Builder{}
	b.Grow(len(decomposed))

	for _, r := range decomposed {
		if unicode.Is(unicode.Mn, r) {
			continue
		}

		if r == 'đ' {
			b.WriteRune('d')
			continue
		}

		if r == 'Đ' {
			b.WriteRune('D')
			continue
		}

		b.WriteRune(r)
	}

	return b.String()
}

func filterBySalaryBand(jobs []Job, salaryBand string) []Job {
	band := strings.ToLower(strings.TrimSpace(salaryBand))
	if band == "" || band == "all" {
		return jobs
	}

	filtered := make([]Job, 0, len(jobs))
	for _, item := range jobs {
		level := parseSalaryLevel(item.Salary)
		switch band {
		case "under20":
			if level > 0 && level < 20 {
				filtered = append(filtered, item)
			}
		case "20to35":
			if level >= 20 && level <= 35 {
				filtered = append(filtered, item)
			}
		case "35to50":
			if level > 35 && level <= 50 {
				filtered = append(filtered, item)
			}
		case "over50":
			if level > 50 {
				filtered = append(filtered, item)
			}
		default:
			filtered = append(filtered, item)
		}
	}

	return filtered
}

func parseSalaryLevel(salary string) int {
	numbers := regexp.MustCompile(`\d+`).FindAllString(salary, -1)
	if len(numbers) == 0 {
		return 0
	}

	value, err := strconv.Atoi(numbers[len(numbers)-1])
	if err != nil {
		return 0
	}

	return value
}

func (r *repository) FindByID(ctx context.Context, id string) (*Job, error) {
	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var job Job
	err = r.collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&job)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &job, nil
}
