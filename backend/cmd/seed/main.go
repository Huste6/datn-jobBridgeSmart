package main

import (
	"context"
	"log"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"

	"jobbridge-ai/backend/internal/auth"
	"jobbridge-ai/backend/internal/config"
	"jobbridge-ai/backend/internal/db"
	"jobbridge-ai/backend/internal/job"
)

type recruiterSeed struct {
	Email       string
	FullName    string
	CompanyName string
	TaxCode     string
	Website     string
	Industry    string
	Size        string
	Location    string
	Description string
	Jobs        []jobSeed
}

type jobSeed struct {
	Title            string
	Salary           string
	EmploymentType   string
	ExperienceLevel  string
	Description      string
	Responsibilities []string
	Requirements     []string
	Benefits         []string
	Tags             []string
}

type candidateSeed struct {
	Email     string
	FullName  string
	Phone     string
	City      string
	Headline  string
	AvatarURL string
	CvURL     string
}

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	mongoClient, err := db.NewMongoClient(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatalf("failed to connect mongodb: %v", err)
	}
	defer func() {
		_ = mongoClient.Disconnect(context.Background())
	}()

	database := mongoClient.Database(cfg.MongoDB)
	usersCol := database.Collection("users")
	companiesCol := database.Collection("companies")
	jobsCol := database.Collection("jobs")

	seedData := recruiterSeeds()
	candidateData := candidateSeeds()
	now := time.Now()

	password := "secret123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("failed to hash password: %v", err)
	}

	// Since this script is for full reset seeding, clear all related collections first.
	if _, err := jobsCol.DeleteMany(ctx, bson.M{}); err != nil {
		log.Fatalf("failed to clear jobs: %v", err)
	}
	if _, err := companiesCol.DeleteMany(ctx, bson.M{}); err != nil {
		log.Fatalf("failed to clear companies: %v", err)
	}
	if _, err := usersCol.DeleteMany(ctx, bson.M{}); err != nil {
		log.Fatalf("failed to clear users: %v", err)
	}

	for i, hr := range seedData {
		recruiterID := bson.NewObjectID()

		user := auth.User{
			ID:           recruiterID,
			Email:        hr.Email,
			FullName:     hr.FullName,
			Role:         "recruiter",
			ProfileDone:  true,
			IsLocked:     false,
			PasswordHash: string(hashedPassword),
			CreatedAt:    now,
			UpdatedAt:    now,
		}
		if _, err := usersCol.InsertOne(ctx, user); err != nil {
			log.Fatalf("failed to insert recruiter %s: %v", hr.Email, err)
		}

		company := auth.Company{
			ID:          bson.NewObjectID(),
			OwnerID:     recruiterID,
			Name:        hr.CompanyName,
			TaxCode:     hr.TaxCode,
			Website:     hr.Website,
			Industry:    hr.Industry,
			Size:        hr.Size,
			Location:    hr.Location,
			Description: hr.Description,
			Status:      "approved",
			IsLocked:    false,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		if _, err := companiesCol.InsertOne(ctx, company); err != nil {
			log.Fatalf("failed to insert company for %s: %v", hr.Email, err)
		}

		for j, seededJob := range hr.Jobs {
			createdAt := now.Add(-time.Duration(i*6+j) * time.Hour)
			jobDoc := job.Job{
				ID:               bson.NewObjectID(),
				OwnerID:          recruiterID,
				Title:            seededJob.Title,
				Company:          hr.CompanyName,
				Location:         hr.Location,
				Salary:           seededJob.Salary,
				EmploymentType:   seededJob.EmploymentType,
				Status:           "open",
				ExperienceLevel:  seededJob.ExperienceLevel,
				Description:      seededJob.Description,
				Responsibilities: seededJob.Responsibilities,
				Requirements:     seededJob.Requirements,
				Benefits:         seededJob.Benefits,
				Tags:             seededJob.Tags,
				PostedAt:         createdAt,
				CreatedAt:        createdAt,
				UpdatedAt:        createdAt,
			}

			if _, err := jobsCol.InsertOne(ctx, jobDoc); err != nil {
				log.Fatalf("failed to insert job %s: %v", seededJob.Title, err)
			}
		}

		log.Printf("seeded recruiter %s with company %s and %d jobs", hr.Email, hr.CompanyName, len(hr.Jobs))
	}

	for _, candidate := range candidateData {
		candidateUser := auth.User{
			ID:           bson.NewObjectID(),
			Email:        candidate.Email,
			FullName:     candidate.FullName,
			Role:         "seeker",
			AvatarURL:    candidate.AvatarURL,
			CvURL:        candidate.CvURL,
			Phone:        candidate.Phone,
			City:         candidate.City,
			Headline:     candidate.Headline,
			ProfileDone:  true,
			IsLocked:     false,
			PasswordHash: string(hashedPassword),
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		if _, err := usersCol.InsertOne(ctx, candidateUser); err != nil {
			log.Fatalf("failed to insert candidate %s: %v", candidate.Email, err)
		}
		log.Printf("seeded candidate user %s", candidate.Email)
	}

	log.Printf(
		"seed completed: recruiters=%d, candidates=%d, users=%d, companies=%d, jobs=%d, password=%s",
		len(seedData),
		len(candidateData),
		len(seedData)+len(candidateData),
		len(seedData),
		totalJobs(seedData),
		password,
	)
}

func totalJobs(data []recruiterSeed) int {
	total := 0
	for _, recruiter := range data {
		total += len(recruiter.Jobs)
	}
	return total
}

func recruiterSeeds() []recruiterSeed {
	return []recruiterSeed{
		{
			Email:       "hr.techcity@example.com",
			FullName:    "Nguyen Minh Khoa",
			CompanyName: "TechCity Vietnam",
			TaxCode:     "TCV-2026-001",
			Website:     "https://techcity.vn",
			Industry:    "Software Product",
			Size:        "51-200",
			Location:    "Ho Chi Minh",
			Description: "Product company focused on HRTech SaaS platforms.",
			Jobs: []jobSeed{
				{
					Title:           "Senior Frontend Engineer",
					Salary:          "35 - 50 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Phát triển dashboard tuyển dụng quy mô lớn với trải nghiệm mượt mà trên nhiều thiết bị.",
					Responsibilities: []string{
						"Thiết kế kiến trúc component theo domain để dễ mở rộng.",
						"Làm việc chặt chẽ với backend để thống nhất API contract.",
						"Tối ưu hiệu năng rendering cho các màn hình dữ liệu lớn.",
					},
					Requirements: []string{
						"Tối thiểu 4 năm kinh nghiệm React + TypeScript.",
						"Kinh nghiệm xây dựng design system và state management hiện đại.",
						"Hiểu sâu về performance tuning và profiling trên trình duyệt.",
					},
					Benefits: []string{
						"Lương tháng 13 và thưởng theo hiệu suất quý.",
						"Bảo hiểm sức khỏe cao cấp cho nhân viên.",
					},
					Tags: []string{"React", "TypeScript", "Frontend"},
				},
				{
					Title:           "QA Automation Engineer",
					Salary:          "25 - 38 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Xây dựng test automation cho các luồng đăng tuyển và ứng tuyển quan trọng.",
					Responsibilities: []string{
						"Thiết kế test strategy cho API và UI test.",
						"Tích hợp automation vào CI/CD để giảm lỗi production.",
						"Phân tích defect trend và đề xuất cải tiến chất lượng.",
					},
					Requirements: []string{
						"Ít nhất 2 năm kinh nghiệm với Playwright hoặc Cypress.",
						"Thành thạo API testing và test data management.",
						"Hiểu pipeline CI/CD và quy trình release.",
					},
					Benefits: []string{
						"Thưởng hiệu quả theo chỉ số chất lượng phát hành.",
						"Hỗ trợ học chứng chỉ testing quốc tế.",
					},
					Tags: []string{"QA", "Automation", "Playwright"},
				},
				{
					Title:           "Fullstack Engineer (Node.js/React)",
					Salary:          "30 - 45 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Phát triển end-to-end các tính năng tuyển dụng từ backend API đến frontend dashboard.",
					Responsibilities: []string{
						"Xây dựng API Node.js và màn hình React cho luồng tuyển dụng.",
						"Thiết kế database schema và tối ưu truy vấn cho dữ liệu ứng viên.",
						"Phối hợp QA xử lý bug và cải thiện chất lượng release.",
					},
					Requirements: []string{
						"2+ năm kinh nghiệm Node.js và React trong dự án thực tế.",
						"Nắm chắc REST API, authentication, authorization.",
						"Có kinh nghiệm với MongoDB hoặc PostgreSQL.",
					},
					Benefits: []string{
						"Thưởng theo hiệu suất theo quý.",
						"Hybrid linh hoạt 2-3 ngày onsite.",
					},
					Tags: []string{"Node.js", "React", "Fullstack"},
				},
				{
					Title:           "Mobile Developer (Flutter)",
					Salary:          "24 - 37 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Xây dựng ứng dụng mobile cho ứng viên và nhà tuyển dụng trên nền tảng Flutter.",
					Responsibilities: []string{
						"Phát triển màn hình mobile theo thiết kế responsive.",
						"Tích hợp API và quản lý state ổn định.",
						"Tối ưu hiệu năng và giảm crash rate.",
					},
					Requirements: []string{
						"2+ năm kinh nghiệm Flutter và Dart.",
						"Hiểu lifecycle ứng dụng mobile và tối ưu performance.",
						"Kinh nghiệm tích hợp analytics và push notifications.",
					},
					Benefits: []string{
						"Hỗ trợ thiết bị test Android/iOS.",
						"Thưởng theo chỉ số crash-free session.",
					},
					Tags: []string{"Flutter", "Mobile", "Dart"},
				},
				{
					Title:           "UI/UX Designer",
					Salary:          "22 - 35 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Thiết kế trải nghiệm ứng tuyển và quản lý tin tuyển dụng cho nền tảng web/mobile.",
					Responsibilities: []string{
						"Nghiên cứu hành vi người dùng và cải thiện flow chính.",
						"Thiết kế prototype và design system bằng Figma.",
						"Làm việc với frontend để bàn giao chi tiết.",
					},
					Requirements: []string{
						"2+ năm kinh nghiệm thiết kế sản phẩm số.",
						"Thành thạo Figma và component system.",
						"Hiểu cơ bản accessibility và UX writing.",
					},
					Benefits: []string{
						"Thưởng theo cải thiện conversion UX.",
						"Ngân sách học nâng cao về product design.",
					},
					Tags: []string{"UX", "UI", "Figma"},
				},
				{
					Title:           "Product Manager (Tech)",
					Salary:          "40 - 58 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Dẫn dắt roadmap sản phẩm tuyển dụng và điều phối team công nghệ đa chức năng.",
					Responsibilities: []string{
						"Xây dựng roadmap theo mục tiêu tăng trưởng.",
						"Phân tách yêu cầu thành user stories cho sprint.",
						"Theo dõi KPI sau phát hành và tối ưu liên tục.",
					},
					Requirements: []string{
						"3+ năm kinh nghiệm Product Manager trong sản phẩm công nghệ.",
						"Kỹ năng phân tích dữ liệu và ưu tiên backlog.",
						"Hiểu rõ quy trình Agile/Scrum.",
					},
					Benefits: []string{
						"Bonus theo kết quả sản phẩm.",
						"Cơ hội dẫn dắt các dự án chiến lược.",
					},
					Tags: []string{"Product", "Agile", "Roadmap"},
				},
				{
					Title:           "Technical Project Manager",
					Salary:          "34 - 50 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Điều phối dự án kỹ thuật giữa Product, Engineering và QA đảm bảo đúng tiến độ.",
					Responsibilities: []string{
						"Lập kế hoạch theo milestone và dependency.",
						"Theo dõi rủi ro và chủ động hành động giảm thiểu.",
						"Báo cáo tiến độ cho stakeholder định kỳ.",
					},
					Requirements: []string{
						"4+ năm quản lý dự án phần mềm.",
						"Kỹ năng giao tiếp và giải quyết xung đột tốt.",
						"Hiểu sâu quy trình delivery trong Agile.",
					},
					Benefits: []string{
						"Thưởng theo tiến độ và chất lượng dự án.",
						"Hỗ trợ học chứng chỉ PMP/PMI-ACP.",
					},
					Tags: []string{"Project Management", "Agile", "Delivery"},
				},
				{
					Title:           "Security Engineer",
					Salary:          "38 - 56 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Xây dựng và triển khai các kiểm soát bảo mật cho ứng dụng và hạ tầng cloud.",
					Responsibilities: []string{
						"Thực hiện security review cho kiến trúc hệ thống.",
						"Thiết lập quy trình scan lỗ hổng trong CI/CD.",
						"Phối hợp đội DevOps triển khai quản lý secrets.",
					},
					Requirements: []string{
						"Kinh nghiệm AppSec/Cloud Security tối thiểu 3 năm.",
						"Hiểu OWASP Top 10 và secure coding.",
						"Kinh nghiệm với công cụ SAST/DAST là lợi thế.",
					},
					Benefits: []string{
						"Bảo hiểm sức khỏe premium.",
						"Ngân sách học chứng chỉ bảo mật.",
					},
					Tags: []string{"Security", "AppSec", "Cloud"},
				},
				{
					Title:           "Site Reliability Engineer",
					Salary:          "36 - 54 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Đảm bảo độ ổn định, khả năng mở rộng và thời gian sẵn sàng của hệ thống production.",
					Responsibilities: []string{
						"Thiết kế SLI/SLO và hệ thống cảnh báo.",
						"Tối ưu vận hành hệ thống và sự cố production.",
						"Phân tích postmortem và cải tiến reliability.",
					},
					Requirements: []string{
						"3+ năm kinh nghiệm SRE/DevOps.",
						"Thành thạo monitoring stack như Prometheus/Grafana.",
						"Hiểu sâu Linux, networking và container orchestration.",
					},
					Benefits: []string{
						"Phụ cấp trực vận hành minh bạch.",
						"Cơ hội làm việc với hệ thống traffic lớn.",
					},
					Tags: []string{"SRE", "Monitoring", "Reliability"},
				},
				{
					Title:           "Business Analyst (IT)",
					Salary:          "18 - 30 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Junior-Middle",
					Description:     "Phân tích yêu cầu nghiệp vụ và chuyển đổi thành tài liệu kỹ thuật cho team phát triển.",
					Responsibilities: []string{
						"Thu thập và làm rõ yêu cầu từ stakeholder.",
						"Viết BRD/FRD và user story rõ ràng.",
						"Hỗ trợ UAT và theo dõi acceptance criteria.",
					},
					Requirements: []string{
						"1+ năm kinh nghiệm BA trong dự án phần mềm.",
						"Kỹ năng giao tiếp và tài liệu hóa tốt.",
						"Hiểu quy trình phát triển phần mềm Agile.",
					},
					Benefits: []string{
						"Lộ trình phát triển lên Senior BA.",
						"Được đào tạo domain và nghiệp vụ chuyên sâu.",
					},
					Tags: []string{"BA", "Requirement", "Agile"},
				},
			},
		},
		{
			Email:       "hr.databridge@example.com",
			FullName:    "Tran Bao Anh",
			CompanyName: "DataBridge Labs",
			TaxCode:     "DBL-2026-002",
			Website:     "https://databridgelabs.vn",
			Industry:    "Data & AI",
			Size:        "201-500",
			Location:    "Ha Noi",
			Description: "AI-first company building matching and recommendation systems.",
			Jobs: []jobSeed{
				{
					Title:           "ML Engineer",
					Salary:          "40 - 62 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Xây dựng hệ thống gợi ý công việc và ranking ứng viên theo dữ liệu hành vi.",
					Responsibilities: []string{
						"Thiết kế pipeline feature cho recommendation.",
						"Triển khai inference service có latency thấp.",
						"Theo dõi model drift và lập kế hoạch retraining.",
					},
					Requirements: []string{
						"3+ năm kinh nghiệm ML production với Python.",
						"Thành thạo TensorFlow hoặc PyTorch.",
						"Có kinh nghiệm MLOps và model monitoring.",
					},
					Benefits: []string{
						"Thưởng theo tác động mô hình đến KPI sản phẩm.",
						"Ngân sách R&D và hội thảo AI hằng năm.",
					},
					Tags: []string{"Python", "ML", "MLOps"},
				},
				{
					Title:           "Data Analyst",
					Salary:          "20 - 32 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Junior-Middle",
					Description:     "Phân tích dữ liệu funnel tuyển dụng và cung cấp insight cho product team.",
					Responsibilities: []string{
						"Xây dựng dashboard vận hành định kỳ.",
						"Viết truy vấn SQL phân tích ad-hoc.",
						"Hỗ trợ thiết kế và đọc kết quả A/B test.",
					},
					Requirements: []string{
						"Tối thiểu 1.5 năm kinh nghiệm Data Analyst.",
						"Thành thạo SQL và BI tools như Power BI/Tableau.",
						"Có tư duy thống kê ứng dụng cơ bản.",
					},
					Benefits: []string{
						"Lộ trình phát triển lên Senior Analyst.",
						"Được làm việc với data team đa chức năng.",
					},
					Tags: []string{"SQL", "BI", "Analytics"},
				},
				{
					Title:           "Data Engineer",
					Salary:          "32 - 48 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Xây dựng data pipeline cho bài toán phân tích và machine learning.",
					Responsibilities: []string{
						"Thiết kế ETL/ELT pipeline ổn định.",
						"Tối ưu data warehouse và chất lượng dữ liệu.",
						"Hỗ trợ team ML chuẩn hóa feature store.",
					},
					Requirements: []string{
						"2+ năm kinh nghiệm Data Engineering.",
						"Kinh nghiệm với Python, SQL và orchestration tools.",
						"Hiểu mô hình dữ liệu cho analytics workloads.",
					},
					Benefits: []string{
						"Hỗ trợ chứng chỉ cloud data.",
						"Thưởng theo chất lượng dữ liệu pipeline.",
					},
					Tags: []string{"Data Engineering", "ETL", "Python"},
				},
				{
					Title:           "NLP Engineer",
					Salary:          "38 - 55 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Phát triển mô hình NLP phục vụ phân tích CV và matching ngữ nghĩa.",
					Responsibilities: []string{
						"Xây dựng pipeline tiền xử lý văn bản tiếng Việt.",
						"Huấn luyện mô hình embedding và ranking.",
						"Đo lường chất lượng mô hình theo business metrics.",
					},
					Requirements: []string{
						"3+ năm kinh nghiệm NLP production.",
						"Thành thạo transformers và semantic search.",
						"Kinh nghiệm triển khai inference tối ưu chi phí.",
					},
					Benefits: []string{
						"Ngân sách nghiên cứu mô hình mới.",
						"Thưởng theo cải thiện chất lượng matching.",
					},
					Tags: []string{"NLP", "LLM", "Recommendation"},
				},
				{
					Title:           "BI Developer",
					Salary:          "24 - 36 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Phát triển dashboard BI cho team vận hành, sales và product.",
					Responsibilities: []string{
						"Thiết kế báo cáo và dashboard đa phòng ban.",
						"Chuẩn hóa metric definition trong toàn hệ thống.",
						"Tối ưu performance truy vấn dữ liệu cho dashboard.",
					},
					Requirements: []string{
						"2+ năm làm việc với Power BI/Tableau/Looker.",
						"Kỹ năng SQL nâng cao với window functions.",
						"Có kinh nghiệm data modeling cho BI.",
					},
					Benefits: []string{
						"Thưởng theo tác động insight đến doanh thu.",
						"Cơ hội làm việc trực tiếp với C-level.",
					},
					Tags: []string{"BI", "Dashboard", "SQL"},
				},
				{
					Title:           "MLOps Engineer",
					Salary:          "36 - 52 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Xây dựng nền tảng triển khai và giám sát vòng đời mô hình ML.",
					Responsibilities: []string{
						"Thiết kế model registry và deployment workflow.",
						"Tự động hóa training/retraining pipeline.",
						"Giám sát model drift và alerting.",
					},
					Requirements: []string{
						"Kinh nghiệm MLOps với Kubeflow/MLflow tương đương.",
						"Hiểu CI/CD cho machine learning.",
						"Có kinh nghiệm cloud-based model deployment.",
					},
					Benefits: []string{
						"Hỗ trợ chứng chỉ cloud AI.",
						"Cơ hội dẫn dắt chuẩn MLOps nội bộ.",
					},
					Tags: []string{"MLOps", "MLflow", "Platform"},
				},
				{
					Title:           "Backend Python Engineer",
					Salary:          "28 - 42 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Phát triển backend service cho hệ thống xử lý dữ liệu và AI API.",
					Responsibilities: []string{
						"Xây dựng REST service với Python framework.",
						"Tối ưu hiệu năng và concurrency cho xử lý batch.",
						"Viết test và tài liệu API rõ ràng.",
					},
					Requirements: []string{
						"2+ năm kinh nghiệm Python backend.",
						"Hiểu rõ FastAPI/Django và API design.",
						"Kinh nghiệm với Redis/queue là lợi thế.",
					},
					Benefits: []string{
						"Thưởng hiệu quả theo dự án.",
						"Đào tạo nâng cao kiến trúc backend.",
					},
					Tags: []string{"Python", "Backend", "FastAPI"},
				},
				{
					Title:           "Data Scientist",
					Salary:          "34 - 50 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Nghiên cứu mô hình dự đoán và đánh giá hiệu quả theo mục tiêu kinh doanh.",
					Responsibilities: []string{
						"Thiết kế thí nghiệm và đánh giá mô hình.",
						"Phân tích feature importance và bias.",
						"Phối hợp product để triển khai use case thực tế.",
					},
					Requirements: []string{
						"3+ năm kinh nghiệm Data Science ứng dụng.",
						"Thành thạo thống kê và machine learning.",
						"Kinh nghiệm triển khai mô hình vào production.",
					},
					Benefits: []string{
						"Ngân sách học tập và hội thảo quốc tế.",
						"Thưởng theo impact vào KPI sản phẩm.",
					},
					Tags: []string{"Data Science", "ML", "Statistics"},
				},
				{
					Title:           "Cloud Engineer",
					Salary:          "30 - 46 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Quản trị hạ tầng cloud phục vụ data platform và AI workloads.",
					Responsibilities: []string{
						"Thiết kế kiến trúc cloud theo best practices.",
						"Tối ưu chi phí compute và storage.",
						"Tự động hóa provisioning bằng IaC.",
					},
					Requirements: []string{
						"2+ năm kinh nghiệm với cloud platform.",
						"Kinh nghiệm với Docker, Kubernetes cơ bản.",
						"Hiểu networking, IAM và bảo mật cloud.",
					},
					Benefits: []string{
						"Hỗ trợ thi chứng chỉ cloud.",
						"Thưởng hiệu quả vận hành hạ tầng.",
					},
					Tags: []string{"Cloud", "Kubernetes", "IaC"},
				},
				{
					Title:           "QA Engineer (API)",
					Salary:          "22 - 34 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Đảm bảo chất lượng API và data workflow cho các dịch vụ lõi.",
					Responsibilities: []string{
						"Thiết kế test case cho API contracts.",
						"Tự động hóa regression test theo sprint.",
						"Phân tích lỗi và làm việc với dev để fix nhanh.",
					},
					Requirements: []string{
						"2+ năm QA với trọng tâm API testing.",
						"Thành thạo Postman/Newman hoặc framework tương đương.",
						"Hiểu lifecycle phát triển phần mềm.",
					},
					Benefits: []string{
						"Thưởng theo chỉ số lỗi production giảm.",
						"Lộ trình phát triển QA automation.",
					},
					Tags: []string{"QA", "API Testing", "Automation"},
				},
			},
		},
		{
			Email:       "hr.cloudnova@example.com",
			FullName:    "Le Quoc Tuan",
			CompanyName: "CloudNova Systems",
			TaxCode:     "CNS-2026-003",
			Website:     "https://cloudnova.io",
			Industry:    "Cloud Infrastructure",
			Size:        "51-200",
			Location:    "Da Nang",
			Description: "Cloud platform company focused on scalable backend and DevOps services.",
			Jobs: []jobSeed{
				{
					Title:           "Backend Golang Engineer",
					Salary:          "30 - 45 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Phát triển API và service lõi cho nền tảng tuyển dụng nhiều tenant.",
					Responsibilities: []string{
						"Xây dựng REST API theo clean architecture.",
						"Tối ưu truy vấn MongoDB và độ trễ endpoint.",
						"Viết test cho business logic quan trọng.",
					},
					Requirements: []string{
						"Từ 2 năm kinh nghiệm Go production.",
						"Nắm vững MongoDB indexing và query optimization.",
						"Hiểu HTTP, auth và bảo mật API cơ bản.",
					},
					Benefits: []string{
						"Thưởng theo kết quả kinh doanh quý.",
						"Hỗ trợ đào tạo nâng cao về kiến trúc backend.",
					},
					Tags: []string{"Golang", "Backend", "MongoDB"},
				},
				{
					Title:           "DevOps Specialist",
					Salary:          "36 - 55 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Vận hành hạ tầng container và pipeline triển khai cho nhiều môi trường.",
					Responsibilities: []string{
						"Thiết kế hạ tầng Kubernetes cho dev/staging/prod.",
						"Triển khai monitoring, logging và alerting.",
						"Tự động hóa provisioning bằng IaC.",
					},
					Requirements: []string{
						"3+ năm kinh nghiệm DevOps/SRE production.",
						"Thành thạo Docker, Kubernetes, CI/CD.",
						"Có kinh nghiệm Terraform hoặc công cụ IaC tương đương.",
					},
					Benefits: []string{
						"Phụ cấp on-call minh bạch.",
						"Hỗ trợ chứng chỉ cloud chuyên sâu.",
					},
					Tags: []string{"DevOps", "Kubernetes", "Terraform"},
				},
				{
					Title:           "Platform Engineer",
					Salary:          "34 - 50 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Xây dựng nền tảng nội bộ giúp team dev self-service deployment và observability.",
					Responsibilities: []string{
						"Phát triển internal developer platform.",
						"Chuẩn hóa template service và release workflow.",
						"Nâng cao DX cho đội ngũ kỹ sư sản phẩm.",
					},
					Requirements: []string{
						"3+ năm kinh nghiệm platform/DevOps.",
						"Hiểu sâu container, orchestration, CI/CD.",
						"Kinh nghiệm scripting automation.",
					},
					Benefits: []string{
						"Cơ hội xây dựng platform từ đầu.",
						"Thưởng theo hiệu quả vận hành.",
					},
					Tags: []string{"Platform", "DevEx", "Automation"},
				},
				{
					Title:           "Cloud Solution Architect",
					Salary:          "45 - 70 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Thiết kế kiến trúc cloud cho hệ thống tuyển dụng có khả năng mở rộng cao.",
					Responsibilities: []string{
						"Thiết kế kiến trúc ứng dụng đa môi trường.",
						"Định hướng lựa chọn dịch vụ cloud phù hợp.",
						"Review architecture và kiểm soát technical risk.",
					},
					Requirements: []string{
						"5+ năm thiết kế hệ thống cloud production.",
						"Kinh nghiệm với microservices và distributed systems.",
						"Hiểu sâu HA/DR, security và cost optimization.",
					},
					Benefits: []string{
						"Package cạnh tranh theo năng lực.",
						"Ngân sách chứng chỉ cloud architect.",
					},
					Tags: []string{"Cloud", "Architecture", "Microservices"},
				},
				{
					Title:           "System Administrator",
					Salary:          "20 - 30 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Junior-Middle",
					Description:     "Vận hành hệ thống máy chủ, mạng nội bộ và hỗ trợ hạ tầng cho các đội phát triển.",
					Responsibilities: []string{
						"Giám sát hệ thống server và dịch vụ nền.",
						"Quản trị tài khoản, quyền truy cập và backup.",
						"Xử lý sự cố hạ tầng theo SLA.",
					},
					Requirements: []string{
						"1+ năm kinh nghiệm quản trị hệ thống.",
						"Hiểu Linux, networking cơ bản và script automation.",
						"Có tư duy vận hành ổn định và bảo mật.",
					},
					Benefits: []string{
						"Phụ cấp trực ngoài giờ.",
						"Đào tạo nâng cao về cloud ops.",
					},
					Tags: []string{"SysAdmin", "Linux", "Infrastructure"},
				},
				{
					Title:           "Network Engineer",
					Salary:          "24 - 36 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Thiết kế và tối ưu hệ thống mạng phục vụ ứng dụng nội bộ và cloud connectivity.",
					Responsibilities: []string{
						"Triển khai cấu hình routing/switching cơ bản.",
						"Giám sát network latency và packet loss.",
						"Phối hợp bảo mật xử lý sự cố mạng.",
					},
					Requirements: []string{
						"2+ năm kinh nghiệm network operations.",
						"Nắm vững TCP/IP, DNS, VPN, firewall concepts.",
						"Ưu tiên có chứng chỉ CCNA/CCNP.",
					},
					Benefits: []string{
						"Hỗ trợ thi chứng chỉ networking.",
						"Thưởng theo hiệu quả vận hành ổn định.",
					},
					Tags: []string{"Network", "TCP/IP", "Operations"},
				},
				{
					Title:           "Database Administrator",
					Salary:          "30 - 44 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Quản trị và tối ưu hệ thống cơ sở dữ liệu phục vụ dịch vụ production.",
					Responsibilities: []string{
						"Theo dõi hiệu năng và tối ưu index/query.",
						"Xây dựng chiến lược backup/restore an toàn.",
						"Hỗ trợ team dev trong thiết kế schema.",
					},
					Requirements: []string{
						"2+ năm DBA với MongoDB/MySQL/PostgreSQL.",
						"Hiểu replication, backup, disaster recovery.",
						"Kinh nghiệm tuning query trong môi trường lớn.",
					},
					Benefits: []string{
						"Thưởng theo uptime và độ ổn định dữ liệu.",
						"Đào tạo nâng cao về data architecture.",
					},
					Tags: []string{"DBA", "MongoDB", "Performance"},
				},
				{
					Title:           "Java Backend Engineer",
					Salary:          "32 - 46 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Phát triển các service backend Java cho hệ thống quản trị tuyển dụng doanh nghiệp.",
					Responsibilities: []string{
						"Xây dựng REST API bằng Java/Spring Boot.",
						"Tối ưu logic nghiệp vụ và transaction handling.",
						"Viết unit/integration tests cho module chính.",
					},
					Requirements: []string{
						"2+ năm Java backend với Spring Boot.",
						"Hiểu JPA, database design và caching.",
						"Kinh nghiệm làm việc theo Git flow và code review.",
					},
					Benefits: []string{
						"Thưởng theo hiệu suất dự án.",
						"Lộ trình phát triển lên Tech Lead.",
					},
					Tags: []string{"Java", "Spring Boot", "Backend"},
				},
				{
					Title:           ".NET Backend Engineer",
					Salary:          "30 - 44 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Middle",
					Description:     "Phát triển API .NET cho các module tuyển dụng và phân quyền người dùng.",
					Responsibilities: []string{
						"Thiết kế API chuẩn REST với .NET.",
						"Tối ưu truy vấn và xử lý nghiệp vụ phức tạp.",
						"Đảm bảo chất lượng qua test tự động.",
					},
					Requirements: []string{
						"2+ năm kinh nghiệm C#/.NET backend.",
						"Hiểu Entity Framework và SQL optimization.",
						"Kinh nghiệm triển khai dịch vụ production.",
					},
					Benefits: []string{
						"Môi trường kỹ thuật chuẩn hóa quy trình.",
						"Ngân sách học công nghệ mới.",
					},
					Tags: []string{".NET", "C#", "API"},
				},
				{
					Title:           "Infrastructure Automation Engineer",
					Salary:          "33 - 49 triệu",
					EmploymentType:  "Toàn thời gian",
					ExperienceLevel: "Senior",
					Description:     "Tự động hóa hạ tầng và quy trình vận hành để tăng tốc độ triển khai hệ thống.",
					Responsibilities: []string{
						"Xây dựng automation scripts cho infra tasks.",
						"Triển khai chuẩn IaC và policy nội bộ.",
						"Hỗ trợ team release với pipeline ổn định.",
					},
					Requirements: []string{
						"3+ năm kinh nghiệm automation/DevOps.",
						"Thành thạo Terraform hoặc tương đương.",
						"Kinh nghiệm với GitOps là điểm cộng.",
					},
					Benefits: []string{
						"Thưởng theo hiệu quả tối ưu vận hành.",
						"Làm việc với hạ tầng hiện đại, scale lớn.",
					},
					Tags: []string{"Automation", "Terraform", "GitOps"},
				},
			},
		},
	}
}

func candidateSeeds() []candidateSeed {
	return []candidateSeed{
		{
			Email:     "candidate1@example.com",
			FullName:  "Pham Gia Hung",
			Phone:     "0901000001",
			City:      "Ho Chi Minh",
			Headline:  "Frontend Developer with 2 years of React experience",
			AvatarURL: "https://i.pravatar.cc/300?img=11",
			CvURL:     "https://example.com/cv/candidate1.pdf",
		},
		{
			Email:     "candidate2@example.com",
			FullName:  "Nguyen Bao Tram",
			Phone:     "0901000002",
			City:      "Ha Noi",
			Headline:  "Backend Engineer specializing in Golang and MongoDB",
			AvatarURL: "https://i.pravatar.cc/300?img=25",
			CvURL:     "https://example.com/cv/candidate2.pdf",
		},
		{
			Email:     "candidate3@example.com",
			FullName:  "Le Hoang Nam",
			Phone:     "0901000003",
			City:      "Da Nang",
			Headline:  "Data Analyst focused on SQL, dashboards, and A/B testing",
			AvatarURL: "https://i.pravatar.cc/300?img=33",
			CvURL:     "https://example.com/cv/candidate3.pdf",
		},
		{
			Email:     "candidate4@example.com",
			FullName:  "Tran Khanh Linh",
			Phone:     "0901000004",
			City:      "Can Tho",
			Headline:  "QA Automation Engineer using Playwright and CI pipelines",
			AvatarURL: "https://i.pravatar.cc/300?img=47",
			CvURL:     "https://example.com/cv/candidate4.pdf",
		},
		{
			Email:     "candidate5@example.com",
			FullName:  "Vo Minh Quan",
			Phone:     "0901000005",
			City:      "Hai Phong",
			Headline:  "DevOps Engineer with Kubernetes and Terraform experience",
			AvatarURL: "https://i.pravatar.cc/300?img=52",
			CvURL:     "https://example.com/cv/candidate5.pdf",
		},
	}
}
