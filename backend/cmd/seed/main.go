package main

import (
	"context"
	"log"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"jobbridge-ai/backend/internal/config"
	"jobbridge-ai/backend/internal/db"
	"jobbridge-ai/backend/internal/job"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoClient, err := db.NewMongoClient(ctx, cfg.MongoURI)
	if err != nil {
		log.Fatalf("failed to connect mongodb: %v", err)
	}
	defer func() {
		_ = mongoClient.Disconnect(context.Background())
	}()

	database := mongoClient.Database(cfg.MongoDB)
	col := database.Collection("jobs")
	usersCol := database.Collection("users")
	companiesCol := database.Collection("companies")

	_, err = col.DeleteMany(ctx, bson.M{})
	if err != nil {
		log.Fatalf("failed to clear jobs: %v", err)
	}

	now := time.Now()

	// Public jobs endpoint only returns jobs where owner is an unlocked recruiter
	// and the recruiter's company is approved + unlocked.
	type recruiterDoc struct {
		ID bson.ObjectID `bson:"_id"`
	}
	recruiterCursor, err := usersCol.Find(ctx, bson.M{
		"role":      "recruiter",
		"is_locked": false,
	})
	if err != nil {
		log.Fatalf("failed to query recruiter users: %v", err)
	}
	defer recruiterCursor.Close(ctx)

	var recruiters []recruiterDoc
	if err := recruiterCursor.All(ctx, &recruiters); err != nil {
		log.Fatalf("failed to decode recruiter users: %v", err)
	}
	if len(recruiters) == 0 {
		log.Fatal("no recruiter users found, run seed_users first")
	}

	for i, rec := range recruiters {
		_, err = companiesCol.UpdateOne(
			ctx,
			bson.M{"owner_id": rec.ID},
			bson.M{"$set": bson.M{
				"name":        "Recruiter Company",
				"tax_code":    "TAX-SEED-000",
				"website":     "https://example.com",
				"industry":    "Technology",
				"size":        "51-200",
				"location":    "Ho Chi Minh",
				"description": "Seeded company for recruiter-owned jobs",
				"status":      "approved",
				"is_locked":   false,
				"updated_at":  now,
				"created_at":  now,
			}},
			options.UpdateOne().SetUpsert(true),
		)
		if err != nil {
			log.Fatalf("failed to upsert company for recruiter %d: %v", i+1, err)
		}
	}

	jobs := []job.Job{
		{
			Title:           "Senior React Developer",
			Company:         "TechCorp VN",
			Location:        "Hồ Chí Minh",
			Salary:          "32 - 48 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Senior",
			Description:     "Bạn sẽ tham gia xây dựng nền tảng tuyển dụng B2B có lượng người dùng lớn, chịu trách nhiệm thiết kế hệ thống giao diện phức tạp nhưng vẫn mượt trên các thiết bị phổ thông. Vai trò này yêu cầu khả năng chuyển hoá yêu cầu nghiệp vụ thành trải nghiệm trực quan, đồng nhất và dễ mở rộng khi sản phẩm liên tục bổ sung tính năng mới theo từng sprint.",
			Responsibilities: []string{
				"Thiết kế kiến trúc component theo domain, đảm bảo tái sử dụng cao và dễ kiểm thử tự động.",
				"Làm việc cùng Product Designer để chuẩn hoá flow thao tác, trạng thái loading, empty, error và success.",
				"Tối ưu hiệu năng render cho các màn hình danh sách lớn bằng memoization, virtualization và lazy loading.",
				"Phối hợp backend thống nhất API contract, xử lý phân trang, filter, sort và edge case dữ liệu thiếu.",
				"Đảm bảo quality thông qua unit test, integration test và review code chéo trong team frontend.",
				"Đóng góp guideline code style, quy ước naming và cấu trúc folder cho toàn bộ dự án React.",
				"Mentor lập trình viên junior trong các buổi pair-programming và technical sharing định kỳ.",
			},
			Requirements: []string{
				"Tối thiểu 4 năm kinh nghiệm thực chiến với React trong các sản phẩm có người dùng thật và vòng đời dài.",
				"Thành thạo TypeScript nâng cao, nắm rõ generic, utility types và thiết kế type-safe API layer.",
				"Có kinh nghiệm sâu với state management hiện đại (Redux Toolkit, Zustand hoặc tương đương).",
				"Hiểu rõ performance tuning trên trình duyệt, biết sử dụng React Profiler và DevTools để truy vết bottleneck.",
				"Có tư duy UX tốt, biết đặt câu hỏi về hành vi người dùng thay vì chỉ bám theo bản mock tĩnh.",
				"Kinh nghiệm làm việc với CI pipeline frontend, linting, formatting, testing và quy trình release chuẩn.",
				"Ưu tiên ứng viên từng làm dashboard dữ liệu, sản phẩm HRTech hoặc SaaS B2B đa tenant.",
				"Khả năng giao tiếp rõ ràng, chủ động đề xuất giải pháp và phản biện kỹ thuật có cơ sở.",
			},
			Benefits: []string{
				"Lương tháng 13, thưởng hiệu suất theo quý và xét tăng lương 2 lần mỗi năm.",
				"Gói bảo hiểm sức khoẻ premium cho nhân viên và người thân trực hệ.",
				"Hybrid linh hoạt 3 ngày onsite, hỗ trợ thiết bị làm việc cấu hình cao.",
				"Ngân sách học tập cá nhân cho khoá học chuyên môn, chứng chỉ và hội thảo công nghệ.",
			},
			Tags:      []string{"React", "TypeScript", "Frontend", "SaaS", "B2B"},
			PostedAt:  now.Add(-6 * time.Hour),
			CreatedAt: now.Add(-6 * time.Hour),
			UpdatedAt: now.Add(-6 * time.Hour),
		},
		{
			Title:           "Golang Backend Engineer",
			Company:         "VinaPlatform",
			Location:        "Hà Nội",
			Salary:          "28 - 42 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Middle",
			Description:     "Bạn sẽ phát triển các service lõi cho hệ sinh thái tuyển dụng, xử lý hàng nghìn request mỗi phút và đảm bảo tính ổn định khi lưu lượng tăng đột biến trong các đợt chiến dịch tuyển dụng. Công việc tập trung vào thiết kế API hiệu quả, quản trị dữ liệu nhất quán và cải thiện độ tin cậy của hệ thống trong môi trường production.",
			Responsibilities: []string{
				"Xây dựng API REST bằng Go theo chuẩn clean architecture và nguyên tắc tách lớp rõ ràng.",
				"Thiết kế schema MongoDB phục vụ truy vấn nhanh, phù hợp với đặc thù dữ liệu việc làm thay đổi liên tục.",
				"Tối ưu query, index và luồng ghi/đọc để giảm độ trễ tại các endpoint có tần suất truy cập cao.",
				"Viết test cho business logic quan trọng và thiết lập regression test cho các luồng nhạy cảm.",
				"Phối hợp cùng DevOps triển khai observability: metrics, structured logging và tracing cơ bản.",
				"Review pull request, chuẩn hoá coding convention và chia sẻ best practice cho team backend.",
				"Tham gia xử lý sự cố production theo mô hình blameless postmortem và cải tiến sau sự cố.",
			},
			Requirements: []string{
				"Ít nhất 2 năm kinh nghiệm Go với hệ thống production có traffic thật.",
				"Nắm chắc nguyên lý HTTP, REST, authentication, authorization và bảo mật API cơ bản.",
				"Kinh nghiệm làm việc với MongoDB, biết thiết kế index và phân tích execution plan.",
				"Hiểu concurrency trong Go, sử dụng goroutine/channel đúng ngữ cảnh để tránh race condition.",
				"Có kinh nghiệm với message queue, cache layer hoặc background worker là một lợi thế lớn.",
				"Thành thạo Git workflow theo nhánh tính năng, code review và release theo môi trường.",
				"Ưu tiên ứng viên từng làm microservices và có kinh nghiệm tách module dần từ monolith.",
				"Có khả năng đọc log, phân tích nguyên nhân lỗi và chủ động đề xuất hướng xử lý rõ ràng.",
			},
			Benefits: []string{
				"Thưởng theo kết quả kinh doanh và hiệu suất cá nhân hàng quý.",
				"Hỗ trợ ăn trưa, gửi xe, ngân sách team building và hoạt động nội bộ.",
				"Lộ trình phát triển nghề nghiệp rõ ràng theo nhánh Individual Contributor hoặc Tech Lead.",
				"Được tham gia các dự án chiến lược có ảnh hưởng trực tiếp đến tăng trưởng sản phẩm.",
			},
			Tags:      []string{"Golang", "Microservices", "MongoDB", "Backend", "API"},
			PostedAt:  now.Add(-14 * time.Hour),
			CreatedAt: now.Add(-14 * time.Hour),
			UpdatedAt: now.Add(-14 * time.Hour),
		},
		{
			Title:           "AI/ML Engineer",
			Company:         "DataBrain",
			Location:        "Đà Nẵng",
			Salary:          "42 - 65 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Senior",
			Description:     "Vị trí tập trung xây dựng hệ thống gợi ý công việc thông minh, phân tích CV tự động và hỗ trợ matching giữa nhà tuyển dụng với ứng viên theo nhiều tín hiệu dữ liệu. Bạn sẽ làm việc xuyên suốt từ khâu chuẩn hoá dữ liệu, huấn luyện mô hình, triển khai inference service đến theo dõi drift và cải thiện chất lượng dự đoán theo thời gian.",
			Responsibilities: []string{
				"Thiết kế pipeline dữ liệu cho các tác vụ ranking, classification và recommendation trong bài toán tuyển dụng.",
				"Huấn luyện, đánh giá và lựa chọn mô hình dựa trên metric gắn với mục tiêu nghiệp vụ thực tế.",
				"Xây dựng service inference có khả năng mở rộng, thời gian phản hồi thấp và dễ quan sát.",
				"Phối hợp backend để tích hợp model output vào luồng API phục vụ sản phẩm thời gian thực.",
				"Theo dõi model drift, data drift và thiết kế vòng lặp retraining theo ngưỡng chất lượng xác định.",
				"Thiết kế A/B test, phân tích kết quả và đề xuất điều chỉnh feature engineering phù hợp.",
				"Chuẩn hoá tài liệu kỹ thuật để team có thể chuyển giao và vận hành mô hình ổn định.",
			},
			Requirements: []string{
				"Ít nhất 3 năm kinh nghiệm trong vai trò ML Engineer hoặc Data Scientist thiên production.",
				"Thành thạo Python, Numpy, Pandas và ít nhất một framework TensorFlow hoặc PyTorch.",
				"Nắm vững thống kê ứng dụng, xác suất và cách diễn giải metric theo bối cảnh kinh doanh.",
				"Có kinh nghiệm với MLOps: model registry, tracking, deployment và monitoring cơ bản.",
				"Kỹ năng làm việc với dữ liệu văn bản, embedding và xử lý ngôn ngữ tự nhiên là điểm cộng.",
				"Hiểu cách tối ưu chi phí hạ tầng khi triển khai mô hình trong môi trường cloud.",
				"Có thói quen viết tài liệu và kiểm thử cho pipeline để giảm rủi ro khi mở rộng đội ngũ.",
				"Tư duy thực dụng, cân bằng giữa độ chính xác mô hình và hiệu năng hệ thống.",
			},
			Benefits: []string{
				"Thưởng kết quả nghiên cứu và thưởng theo tác động trực tiếp đến KPI sản phẩm.",
				"Ngân sách tham gia hội thảo AI trong nước và quốc tế mỗi năm.",
				"Hỗ trợ máy trạm cấu hình cao và phụ cấp phục vụ thí nghiệm mô hình.",
				"Làm việc trong đội ngũ data đa chức năng, có mentor giàu kinh nghiệm production.",
			},
			Tags:      []string{"Python", "ML", "Recommendation", "NLP", "MLOps"},
			PostedAt:  now.Add(-22 * time.Hour),
			CreatedAt: now.Add(-22 * time.Hour),
			UpdatedAt: now.Add(-22 * time.Hour),
		},
		{
			Title:           "DevOps Specialist",
			Company:         "CloudSys",
			Location:        "Hồ Chí Minh",
			Salary:          "36 - 55 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Senior",
			Description:     "Bạn sẽ chịu trách nhiệm thiết kế và vận hành nền tảng hạ tầng giúp các nhóm sản phẩm release nhanh nhưng vẫn an toàn, ổn định. Vai trò yêu cầu kinh nghiệm sâu về CI/CD, container orchestration, bảo mật cơ bản và năng lực xử lý sự cố theo hướng phòng ngừa, không chỉ chữa cháy tức thời.",
			Responsibilities: []string{
				"Thiết kế và duy trì hạ tầng Kubernetes phục vụ nhiều môi trường dev, staging, production.",
				"Xây dựng pipeline CI/CD tiêu chuẩn với cơ chế kiểm tra chất lượng trước khi triển khai.",
				"Triển khai chiến lược logging, metrics, alerting và dashboard để quan sát hệ thống theo thời gian thực.",
				"Tối ưu chi phí hạ tầng thông qua autoscaling, right-sizing và lifecycle quản lý tài nguyên.",
				"Tự động hoá provisioning bằng IaC để đảm bảo tính nhất quán giữa các môi trường.",
				"Tham gia trực vận hành, điều tra nguyên nhân gốc và triển khai hành động khắc phục sau sự cố.",
				"Phối hợp bảo mật triển khai secret management, policy kiểm soát truy cập và quét lỗ hổng.",
			},
			Requirements: []string{
				"Kinh nghiệm 3+ năm DevOps/SRE với hệ thống chạy production liên tục.",
				"Thành thạo Docker, Kubernetes, helm chart và các mẫu triển khai rolling/canary.",
				"Kinh nghiệm với Terraform hoặc công cụ IaC tương đương trong dự án thực tế.",
				"Nắm chắc networking cơ bản, reverse proxy, TLS và nguyên lý giao tiếp service nội bộ.",
				"Có kinh nghiệm với Prometheus, Grafana, Loki, ELK hoặc các nền tảng quan sát tương tự.",
				"Hiểu các nguyên tắc bảo mật cloud, quản lý quyền và quy trình xoay vòng secret định kỳ.",
				"Khả năng viết script tự động bằng Bash, PowerShell hoặc Python.",
				"Tinh thần hợp tác cao và sẵn sàng hỗ trợ nhiều team khi có sự cố ưu tiên cao.",
			},
			Benefits: []string{
				"On-call allowance rõ ràng, phụ cấp ngoài giờ theo chính sách minh bạch.",
				"Hỗ trợ chứng chỉ cloud và ngân sách đào tạo kỹ năng hạ tầng nâng cao.",
				"Làm việc với hệ thống có scale tăng trưởng nhanh và bài toán kỹ thuật đa dạng.",
				"Hybrid linh hoạt, trang bị đầy đủ công cụ phục vụ vận hành từ xa.",
			},
			Tags:      []string{"DevOps", "Kubernetes", "Terraform", "CI/CD", "SRE"},
			PostedAt:  now.Add(-30 * time.Hour),
			CreatedAt: now.Add(-30 * time.Hour),
			UpdatedAt: now.Add(-30 * time.Hour),
		},
		{
			Title:           "Product Manager",
			Company:         "FinTech Solutions",
			Location:        "Hà Nội",
			Salary:          "45 - 60 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Senior",
			Description:     "Bạn sẽ dẫn dắt roadmap sản phẩm tài chính số cho nhóm khách hàng SME, làm việc sát với engineering, data và business để cân bằng giữa tốc độ tăng trưởng và độ an toàn vận hành. Vị trí đòi hỏi khả năng ưu tiên dựa trên dữ liệu, giao tiếp liên phòng ban và quản trị rủi ro trong bối cảnh sản phẩm thay đổi nhanh.",
			Responsibilities: []string{
				"Xây dựng tầm nhìn sản phẩm 6-12 tháng và chuyển hoá thành roadmap theo quý.",
				"Định nghĩa KPI, hypothesis và tiêu chí thành công cho từng sáng kiến tính năng.",
				"Phối hợp UX Research để xác thực pain point và xác định ưu tiên theo tác động thực tế.",
				"Viết PRD rõ ràng, bóc tách yêu cầu thành user story có thể triển khai theo sprint.",
				"Theo dõi dữ liệu sau phát hành, đánh giá adoption và đề xuất vòng lặp cải tiến liên tục.",
				"Điều phối các cuộc họp cross-functional, xử lý phụ thuộc và quản trị scope thay đổi.",
				"Báo cáo tiến độ, rủi ro và kết quả cho cấp quản lý theo nhịp đều đặn.",
			},
			Requirements: []string{
				"Có 3+ năm kinh nghiệm Product Manager trong môi trường công nghệ sản phẩm.",
				"Kỹ năng phân tích dữ liệu tốt, sử dụng thành thạo công cụ dashboard hoặc SQL cơ bản.",
				"Hiểu vòng đời phát triển phần mềm và thực hành Agile/Scrum trong dự án thực tế.",
				"Kỹ năng viết tài liệu sản phẩm logic, mạch lạc và có khả năng ra quyết định rõ ràng.",
				"Khả năng dẫn dắt stakeholder đa chiều và thương lượng ưu tiên khi nguồn lực giới hạn.",
				"Có tư duy hệ thống, nhận diện được điểm nghẽn từ dữ liệu, quy trình đến con người.",
				"Ưu tiên ứng viên có kinh nghiệm trong lĩnh vực fintech, lending hoặc payment.",
				"Khả năng tiếng Anh đọc hiểu tài liệu chuyên môn và trao đổi trong cuộc họp quốc tế.",
			},
			Benefits: []string{
				"Thưởng KPI theo quý và bonus theo cột mốc phát triển sản phẩm.",
				"Bảo hiểm sức khoẻ toàn diện và khám sức khoẻ định kỳ gói nâng cao.",
				"Quyền truy cập khoá học PM quốc tế và ngân sách tham dự sự kiện ngành.",
				"Môi trường ra quyết định nhanh, trao quyền cao cho owner tính năng.",
			},
			Tags:      []string{"Product", "Agile", "Fintech", "Roadmap", "KPI"},
			PostedAt:  now.Add(-35 * time.Hour),
			CreatedAt: now.Add(-35 * time.Hour),
			UpdatedAt: now.Add(-35 * time.Hour),
		},
		{
			Title:           "Fullstack Node.js/Vue",
			Company:         "Startup Hub",
			Location:        "Remote",
			Salary:          "22 - 34 triệu",
			EmploymentType:  "Remote",
			ExperienceLevel: "Middle",
			Description:     "Vị trí phù hợp với kỹ sư yêu thích làm việc end-to-end, vừa xây API vừa triển khai màn hình quản trị cho hệ sinh thái giáo dục trực tuyến. Bạn sẽ tham gia vào team nhỏ có tốc độ cao, nơi mỗi thành viên có quyền chủ động đề xuất giải pháp kỹ thuật và chịu trách nhiệm toàn diện cho tính năng từ đầu tới cuối.",
			Responsibilities: []string{
				"Phát triển API backend bằng Node.js cho các module khóa học, thanh toán và quản lý người dùng.",
				"Xây dựng giao diện quản trị bằng Vue, tối ưu trải nghiệm cho người vận hành nội bộ.",
				"Thiết kế schema dữ liệu PostgreSQL phù hợp cho báo cáo học tập và tracking hành vi.",
				"Tích hợp các dịch vụ bên thứ ba như cổng thanh toán, email và push notification.",
				"Viết test cho các luồng nghiệp vụ quan trọng và đảm bảo tính ổn định khi refactor.",
				"Theo dõi logs production, phân tích lỗi và khắc phục nhanh các sự cố ảnh hưởng người dùng.",
				"Tham gia review code, đóng góp guideline và chia sẻ kiến thức nội bộ định kỳ.",
			},
			Requirements: []string{
				"Tối thiểu 2 năm kinh nghiệm Node.js và ít nhất 1 năm kinh nghiệm với Vue hoặc framework tương đương.",
				"Nắm chắc JavaScript/TypeScript, bất đồng bộ, pattern xử lý lỗi và thực hành viết code sạch.",
				"Kinh nghiệm làm việc với PostgreSQL, bao gồm migration, index và tối ưu truy vấn cơ bản.",
				"Hiểu cơ bản về bảo mật web: xác thực, phân quyền, input validation và chống injection.",
				"Có kinh nghiệm deploy ứng dụng lên cloud, hiểu pipeline build và release cơ bản.",
				"Kỹ năng tự quản lý công việc tốt, phù hợp môi trường remote và giao tiếp async rõ ràng.",
				"Ưu tiên ứng viên có kinh nghiệm trong sản phẩm EdTech hoặc nền tảng subscription.",
				"Khả năng đọc hiểu tài liệu kỹ thuật tiếng Anh và chủ động nghiên cứu công nghệ mới.",
			},
			Benefits: []string{
				"Remote 100%, giờ làm linh hoạt theo mục tiêu và cam kết output.",
				"Trợ cấp setup góc làm việc tại nhà và ngân sách thiết bị cá nhân.",
				"Chính sách thưởng theo tiến độ phát hành và tác động tính năng.",
				"Cơ hội sở hữu ESOP cho nhân sự gắn bó lâu dài.",
			},
			Tags:      []string{"Node.js", "Vue", "Fullstack", "PostgreSQL", "Remote"},
			PostedAt:  now.Add(-48 * time.Hour),
			CreatedAt: now.Add(-48 * time.Hour),
			UpdatedAt: now.Add(-48 * time.Hour),
		},
		{
			Title:           "Senior QA Automation Engineer",
			Company:         "QualityFirst Labs",
			Location:        "Hồ Chí Minh",
			Salary:          "30 - 44 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Senior",
			Description:     "Bạn sẽ xây dựng chiến lược kiểm thử tự động toàn diện cho các luồng tuyển dụng quan trọng, giúp giảm lỗi lọt production và rút ngắn thời gian phát hành. Vai trò này đòi hỏi tư duy hệ thống, khả năng làm việc liên phòng ban và năng lực thiết lập chuẩn chất lượng có thể nhân rộng trong toàn tổ chức.",
			Responsibilities: []string{
				"Thiết kế test strategy đa tầng gồm API test, UI test và smoke test cho môi trường staging.",
				"Xây dựng framework automation dễ mở rộng, tích hợp trực tiếp vào pipeline CI/CD.",
				"Thiết lập bộ test data và quản trị môi trường kiểm thử để giảm flaky test.",
				"Phối hợp BA, Dev và Product để chuẩn hoá acceptance criteria theo hướng có thể kiểm thử.",
				"Theo dõi chất lượng phát hành qua defect trend, test coverage và lead time.",
				"Thực hiện root cause analysis cho lỗi nghiêm trọng và đưa ra biện pháp phòng ngừa.",
				"Đào tạo team về tư duy quality-first và thực hành viết test hiệu quả.",
			},
			Requirements: []string{
				"Từ 3 năm kinh nghiệm QA Automation với dự án web hoặc mobile có quy mô vừa trở lên.",
				"Thành thạo ít nhất một stack automation như Playwright, Cypress hoặc Selenium.",
				"Có kinh nghiệm API testing với Postman/Newman hoặc framework code-based.",
				"Nắm vững nguyên tắc thiết kế test case và quản lý rủi ro chất lượng theo mức độ ưu tiên.",
				"Hiểu CI/CD và có khả năng tích hợp test suite vào pipeline build/release.",
				"Biết sử dụng SQL cơ bản để xác minh dữ liệu và truy vết sự cố.",
				"Kỹ năng giao tiếp tốt, có khả năng phản biện chất lượng với tinh thần hợp tác.",
				"Ưu tiên ứng viên có kinh nghiệm làm trong lĩnh vực HRTech hoặc workflow nhiều trạng thái.",
			},
			Benefits: []string{
				"Thưởng chất lượng theo tỷ lệ lỗi production giảm theo quý.",
				"Môi trường đề cao chất lượng, QA tham gia từ giai đoạn discovery.",
				"Ngân sách chứng chỉ testing quốc tế và các khoá học nâng cao.",
				"Chính sách làm việc linh hoạt, cân bằng giữa onsite và remote.",
			},
			Tags:      []string{"QA", "Automation", "Playwright", "Cypress", "Testing"},
			PostedAt:  now.Add(-54 * time.Hour),
			CreatedAt: now.Add(-54 * time.Hour),
			UpdatedAt: now.Add(-54 * time.Hour),
		},
		{
			Title:           "Data Analyst",
			Company:         "InsightWorks",
			Location:        "Hà Nội",
			Salary:          "20 - 32 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Junior-Middle",
			Description:     "Bạn sẽ khai thác dữ liệu hành vi người dùng để tạo dashboard vận hành và hỗ trợ đội sản phẩm ra quyết định dựa trên số liệu. Vai trò phù hợp với ứng viên có tư duy logic, cẩn trọng trong kiểm tra dữ liệu và mong muốn tác động trực tiếp đến các quyết định tối ưu chuyển đổi trên nền tảng tuyển dụng.",
			Responsibilities: []string{
				"Xây dựng báo cáo định kỳ về funnel ứng tuyển, retention nhà tuyển dụng và hiệu suất nguồn traffic.",
				"Viết truy vấn SQL phục vụ phân tích ad-hoc cho Product, Marketing và Sales.",
				"Thiết kế dashboard trực quan và chuẩn hoá định nghĩa chỉ số giữa các phòng ban.",
				"Phối hợp Data Engineer kiểm tra chất lượng dữ liệu và xử lý bất thường.",
				"Thực hiện phân tích cohort, segmentation và đề xuất cải tiến dựa trên insight.",
				"Hỗ trợ A/B test tracking, đọc kết quả và giải thích tác động theo ngữ cảnh nghiệp vụ.",
				"Tài liệu hoá logic tính toán để đảm bảo tính minh bạch và khả năng tái sử dụng.",
			},
			Requirements: []string{
				"Tối thiểu 1.5 năm kinh nghiệm ở vị trí Data Analyst hoặc BI Analyst.",
				"Thành thạo SQL, hiểu join, window function và tối ưu truy vấn ở mức cơ bản đến trung bình.",
				"Kinh nghiệm với công cụ BI như Power BI, Tableau hoặc Looker Studio.",
				"Tư duy phân tích tốt, biết đặt giả thuyết và kiểm chứng bằng dữ liệu.",
				"Có kỹ năng trình bày insight rõ ràng cho cả đối tượng kỹ thuật và không kỹ thuật.",
				"Hiểu thống kê cơ bản phục vụ phân tích A/B test và so sánh nhóm.",
				"Ưu tiên ứng viên từng làm sản phẩm nền tảng hai chiều marketplace.",
				"Cẩn thận với chất lượng dữ liệu, có thói quen validate trước khi báo cáo.",
			},
			Benefits: []string{
				"Lộ trình phát triển lên Senior Analyst hoặc Product Analytics rõ ràng.",
				"Được làm việc trực tiếp với C-level trong các bài toán tăng trưởng trọng điểm.",
				"Ngân sách đào tạo kỹ năng dữ liệu và storytelling bằng dashboard.",
				"Thưởng theo hiệu quả dự án phân tích có tác động doanh thu.",
			},
			Tags:      []string{"SQL", "BI", "Analytics", "Dashboard", "A/B Test"},
			PostedAt:  now.Add(-60 * time.Hour),
			CreatedAt: now.Add(-60 * time.Hour),
			UpdatedAt: now.Add(-60 * time.Hour),
		},
		{
			Title:           "UI/UX Designer",
			Company:         "PixelCraft Studio",
			Location:        "Đà Nẵng",
			Salary:          "22 - 35 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Middle",
			Description:     "Bạn sẽ chịu trách nhiệm thiết kế trải nghiệm ứng tuyển và quản trị tin tuyển dụng cho cả ứng viên lẫn nhà tuyển dụng, với trọng tâm là đơn giản hoá thao tác và cải thiện tỷ lệ hoàn thành hành động chính. Vai trò cần khả năng phối hợp chặt với Product và Frontend để biến insight người dùng thành giao diện có tính khả dụng cao.",
			Responsibilities: []string{
				"Thực hiện nghiên cứu người dùng định tính và định lượng cho các luồng quan trọng của sản phẩm.",
				"Thiết kế wireframe, prototype và luồng tương tác rõ ràng cho web responsive.",
				"Xây dựng và duy trì design system đồng bộ với nhu cầu mở rộng tính năng liên tục.",
				"Phối hợp PM xác định ưu tiên UX theo tác động business và mức độ nỗ lực triển khai.",
				"Bàn giao thiết kế có cấu trúc, annotation đầy đủ để developer triển khai chính xác.",
				"Theo dõi kết quả sau release và điều chỉnh thiết kế dựa trên dữ liệu hành vi thực tế.",
				"Đảm bảo tiêu chuẩn accessibility cơ bản cho các thành phần giao diện trọng yếu.",
			},
			Requirements: []string{
				"Có ít nhất 2 năm kinh nghiệm thiết kế sản phẩm số trên nền tảng web.",
				"Sử dụng thành thạo Figma, biết tổ chức component library và biến thể có hệ thống.",
				"Hiểu nguyên tắc UX, information architecture và content hierarchy.",
				"Có kinh nghiệm phối hợp kỹ với developer để đảm bảo chất lượng triển khai cuối cùng.",
				"Biết đọc dữ liệu hành vi cơ bản từ analytics để hỗ trợ quyết định thiết kế.",
				"Có portfolio thể hiện tư duy giải quyết vấn đề, không chỉ thiên về thẩm mỹ.",
				"Ưu tiên ứng viên từng làm sản phẩm marketplace hoặc platform nhiều vai trò người dùng.",
				"Kỹ năng giao tiếp tốt, sẵn sàng nhận phản hồi và iterate nhanh theo sprint.",
			},
			Benefits: []string{
				"Thưởng theo mức độ cải thiện conversion của các luồng UX trọng điểm.",
				"Được tham gia workshop nội bộ về research, accessibility và product thinking.",
				"Môi trường mở cho thử nghiệm ý tưởng mới dựa trên dữ liệu thực tế.",
				"Hybrid linh hoạt và hỗ trợ thiết bị thiết kế chuyên dụng.",
			},
			Tags:      []string{"UX", "UI", "Figma", "Design System", "Research"},
			PostedAt:  now.Add(-68 * time.Hour),
			CreatedAt: now.Add(-68 * time.Hour),
			UpdatedAt: now.Add(-68 * time.Hour),
		},
		{
			Title:           "Technical Project Manager",
			Company:         "Agile Bridge",
			Location:        "Hồ Chí Minh",
			Salary:          "35 - 52 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Senior",
			Description:     "Bạn sẽ điều phối các dự án chuyển đổi kỹ thuật quan trọng, kết nối giữa business và engineering để đảm bảo tiến độ, chất lượng và kiểm soát rủi ro xuyên suốt vòng đời dự án. Vai trò yêu cầu kỹ năng quản trị phụ thuộc tốt, giao tiếp đa chiều và năng lực ra quyết định trong bối cảnh nhiều ưu tiên cạnh tranh.",
			Responsibilities: []string{
				"Lập kế hoạch dự án chi tiết theo milestone, phụ thuộc và nguồn lực thực tế của từng team.",
				"Điều phối triển khai giữa Product, Engineering, QA và vận hành để đảm bảo thống nhất mục tiêu.",
				"Theo dõi tiến độ, chất lượng, chi phí và cập nhật trạng thái minh bạch cho stakeholder.",
				"Quản trị rủi ro chủ động, chuẩn bị phương án dự phòng và kế hoạch giảm thiểu tác động.",
				"Chuẩn hoá quy trình vận hành dự án, retrospective và cải tiến liên tục sau mỗi phase.",
				"Hỗ trợ giải quyết xung đột ưu tiên giữa các nhóm bằng dữ liệu và mục tiêu chung.",
				"Đảm bảo tài liệu dự án đầy đủ, dễ truy xuất và sẵn sàng cho audit nội bộ.",
			},
			Requirements: []string{
				"Kinh nghiệm 4+ năm quản lý dự án công nghệ với nhiều bên liên quan.",
				"Hiểu sâu quy trình phát triển phần mềm và đặc thù delivery trong mô hình Agile.",
				"Kỹ năng lập kế hoạch, theo dõi và báo cáo bằng công cụ quản lý dự án hiện đại.",
				"Khả năng phân tích nguyên nhân chậm tiến độ và đưa ra giải pháp thực tế.",
				"Kỹ năng giao tiếp và thuyết phục tốt với cả team kỹ thuật lẫn khối kinh doanh.",
				"Ưu tiên ứng viên có chứng chỉ PMP, PMI-ACP, Scrum Master hoặc tương đương.",
				"Có kinh nghiệm quản lý dự án tích hợp hệ thống hoặc chuyển đổi kiến trúc là lợi thế.",
				"Tinh thần ownership cao, chịu được áp lực deadline trong các giai đoạn cao điểm.",
			},
			Benefits: []string{
				"Thưởng theo kết quả dự án và mức độ tuân thủ mục tiêu chất lượng/tiến độ.",
				"Ngân sách học tập chứng chỉ quản lý dự án quốc tế.",
				"Môi trường chuyên nghiệp, quy trình rõ ràng và dữ liệu minh bạch.",
				"Cơ hội thăng tiến lên Program Manager khi mở rộng quy mô dự án.",
			},
			Tags:      []string{"Project Management", "Agile", "Delivery", "Stakeholder", "Risk"},
			PostedAt:  now.Add(-74 * time.Hour),
			CreatedAt: now.Add(-74 * time.Hour),
			UpdatedAt: now.Add(-74 * time.Hour),
		},
		{
			Title:           "Mobile Developer (Flutter)",
			Company:         "NextWave Apps",
			Location:        "Hà Nội",
			Salary:          "24 - 38 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Middle",
			Description:     "Bạn sẽ tham gia xây dựng ứng dụng mobile cho ứng viên và nhà tuyển dụng với mục tiêu tạo trải nghiệm tìm việc nhanh, mượt và cá nhân hoá. Vai trò cần sự cân bằng giữa chất lượng kỹ thuật, tối ưu hiệu năng trên nhiều thiết bị và khả năng phối hợp với backend để tích hợp tính năng mới theo chu kỳ phát hành ngắn.",
			Responsibilities: []string{
				"Phát triển ứng dụng Flutter theo kiến trúc rõ ràng, dễ mở rộng và thuận tiện cho kiểm thử.",
				"Tối ưu hiệu năng màn hình danh sách lớn, đảm bảo phản hồi tốt trên thiết bị tầm trung.",
				"Tích hợp API, quản lý trạng thái ứng dụng và xử lý offline/online ổn định.",
				"Thực hiện unit test và widget test cho các module cốt lõi.",
				"Phối hợp cùng QA và Product xử lý bug theo mức độ ưu tiên và lịch release.",
				"Đảm bảo tiêu chuẩn thiết kế nhất quán giữa Android và iOS.",
				"Theo dõi crash report, phân tích nguyên nhân và cải thiện độ ổn định ứng dụng.",
			},
			Requirements: []string{
				"Tối thiểu 2 năm kinh nghiệm Flutter với ứng dụng đã phát hành lên store.",
				"Nắm chắc Dart, asynchronous programming và các pattern quản lý trạng thái phổ biến.",
				"Hiểu vòng đời ứng dụng mobile, tối ưu hiệu năng và xử lý memory leak cơ bản.",
				"Có kinh nghiệm tích hợp push notification, deep link và analytics SDK.",
				"Biết cách viết test tự động cho mobile và tích hợp vào quy trình CI.",
				"Kỹ năng làm việc nhóm tốt, chủ động báo cáo tiến độ và rủi ro.",
				"Ưu tiên ứng viên có kinh nghiệm với kiến trúc clean, modular hoặc feature-first.",
				"Có sản phẩm demo hoặc portfolio thể hiện năng lực triển khai thực tế.",
			},
			Benefits: []string{
				"Thưởng theo chất lượng phát hành và chỉ số crash-free session.",
				"Hỗ trợ thiết bị test đa dạng cho Android/iOS.",
				"Ngân sách học mobile architecture và tối ưu hiệu năng nâng cao.",
				"Cơ hội làm việc với đội ngũ sản phẩm có định hướng data-driven.",
			},
			Tags:      []string{"Flutter", "Mobile", "Dart", "Android", "iOS"},
			PostedAt:  now.Add(-82 * time.Hour),
			CreatedAt: now.Add(-82 * time.Hour),
			UpdatedAt: now.Add(-82 * time.Hour),
		},
		{
			Title:           "Customer Success Executive",
			Company:         "HireFlow Vietnam",
			Location:        "Hồ Chí Minh",
			Salary:          "15 - 24 triệu",
			EmploymentType:  "Toàn thời gian",
			ExperienceLevel: "Junior-Middle",
			Description:     "Bạn sẽ đồng hành cùng khách hàng doanh nghiệp trong toàn bộ vòng đời sử dụng nền tảng, từ onboarding, kích hoạt tính năng đến tối ưu hiệu quả tuyển dụng. Vai trò cần kỹ năng giao tiếp tốt, xử lý tình huống linh hoạt và khả năng chuyển phản hồi khách hàng thành insight cụ thể cho team sản phẩm.",
			Responsibilities: []string{
				"Hướng dẫn khách hàng doanh nghiệp triển khai và sử dụng sản phẩm đúng best practice.",
				"Theo dõi chỉ số sử dụng, chủ động đề xuất giải pháp cải thiện mức độ gắn kết.",
				"Tiếp nhận và xử lý yêu cầu hỗ trợ theo SLA, phối hợp team kỹ thuật khi cần escalation.",
				"Thực hiện các buổi review định kỳ với khách hàng để đánh giá hiệu quả tuyển dụng.",
				"Thu thập phản hồi, tổng hợp insight và chuyển giao cho Product theo định dạng chuẩn.",
				"Hỗ trợ upsell/cross-sell dựa trên nhu cầu thực tế và mức độ trưởng thành của tài khoản.",
				"Đóng góp xây dựng tài liệu self-service giúp giảm tải cho kênh hỗ trợ trực tiếp.",
			},
			Requirements: []string{
				"Từ 1 năm kinh nghiệm Customer Success, Account Management hoặc vai trò hỗ trợ B2B.",
				"Kỹ năng giao tiếp, thuyết trình và xử lý tình huống với khách hàng chuyên nghiệp.",
				"Có tư duy dịch vụ, biết lắng nghe và giải quyết vấn đề theo hướng chủ động.",
				"Sử dụng tốt công cụ CRM, ticketing hoặc nền tảng theo dõi khách hàng tương tự.",
				"Khả năng phân tích dữ liệu cơ bản để đọc hành vi sử dụng và rủi ro churn.",
				"Tinh thần trách nhiệm cao, làm việc nhóm tốt và phản hồi nhanh trong khung thời gian cam kết.",
				"Ưu tiên ứng viên từng làm trong SaaS hoặc nền tảng tuyển dụng/nhân sự.",
				"Tiếng Anh giao tiếp là lợi thế trong làm việc với khách hàng đa quốc gia.",
			},
			Benefits: []string{
				"Lương cứng cạnh tranh và thưởng theo tỷ lệ gia hạn tài khoản khách hàng.",
				"Lộ trình phát triển lên Senior CS hoặc Key Account Manager rõ ràng.",
				"Được đào tạo kỹ năng tư vấn giải pháp và quản trị vòng đời khách hàng.",
				"Môi trường năng động, văn hoá hợp tác và tôn trọng phản hồi hai chiều.",
			},
			Tags:      []string{"Customer Success", "B2B", "SaaS", "CRM", "Onboarding"},
			PostedAt:  now.Add(-90 * time.Hour),
			CreatedAt: now.Add(-90 * time.Hour),
			UpdatedAt: now.Add(-90 * time.Hour),
		},
	}

	for i, j := range jobs {
		j.ID = bson.NewObjectID()
		j.OwnerID = recruiters[i%len(recruiters)].ID
		j.Status = "open"
		_, err := col.InsertOne(ctx, j)
		if err != nil {
			log.Printf("failed to insert %s: %v", j.Title, err)
		}
	}

	log.Println("Seeded job dataset successfully!")
}
