### Sơ đồ kiến trúc Microservices

Sơ đồ này minh họa kiến trúc hiện thực của hệ thống JobBridge AI. Hệ thống được tổ chức theo mô hình microservices, trong đó frontend React SPA gửi toàn bộ request nghiệp vụ đến API Gateway. Gateway đóng vai trò reverse proxy và định tuyến request theo path đến các service backend tương ứng, bao gồm Auth Service, Jobs Service và AI Service.

API Gateway không trực tiếp xác thực JWT hoặc quyết định quyền truy cập nghiệp vụ. Trách nhiệm xác thực và phân quyền được thực hiện tại từng service bằng middleware và logic handler. Cách tổ chức này giúp từng service tự bảo vệ tài nguyên của mình, đồng thời tránh phụ thuộc hoàn toàn vào một lớp gateway duy nhất.

Các thành phần chính của kiến trúc gồm:

1. **Frontend (React SPA):** Giao diện người dùng cho khách truy cập, ứng viên, nhà tuyển dụng và quản trị viên. Frontend gọi API qua Gateway bằng REST/HTTP.
2. **API Gateway (Go/Gin, port 8080):** Điểm vào API duy nhất cho frontend. Gateway định tuyến các nhóm path như `/api/auth`, `/api/users`, `/api/hr`, `/api/admin`, `/api/public` sang Auth Service; `/api/jobs`, `/api/applications` sang Jobs Service; và `/api/ai` sang AI Service.
3. **Auth Service (Go/Gin, port 8081):** Quản lý đăng ký, đăng nhập, JWT, hồ sơ người dùng, công ty, quản trị viên, upload avatar/CV lên Cloudinary và trích xuất text từ CV PDF để lưu vào MongoDB.
4. **Jobs Service (Go/Gin, port 8082):** Quản lý tin tuyển dụng, tìm kiếm job, tin tuyển dụng của recruiter và hồ sơ ứng tuyển. Service này kiểm tra JWT và role recruiter ở các API cần bảo vệ.
5. **AI Service (Go/Gin, port 8085):** Cung cấp AI Interview Coach, AI Interview Quiz và HR Evaluate CV. Service này kiểm tra JWT, role và quyền sở hữu tài nguyên trước khi gọi OpenAI-compatible API.
6. **MongoDB:** Cơ sở dữ liệu chính của hệ thống, lưu các collection `users`, `companies`, `jobs` và `applications`.
7. **Cloudinary:** Lưu trữ file avatar và CV. URL file được lưu trong MongoDB.
8. **OpenAI-compatible API:** Nhà cung cấp mô hình ngôn ngữ lớn cho các chức năng AI.

Luồng xử lý tổng quát: người dùng thao tác trên frontend, frontend gửi REST request đến API Gateway, Gateway định tuyến request đến service phù hợp, service tự xác thực/phân quyền nếu endpoint yêu cầu đăng nhập, sau đó đọc/ghi MongoDB hoặc gọi dịch vụ ngoài như Cloudinary/OpenAI nếu cần. Kết quả được trả ngược về frontend thông qua Gateway.

```mermaid
flowchart LR
    %% Luồng chính được bố trí từ trái sang phải để tránh giao cắt mũi tên.
    USER[Người dùng] --> FE[Frontend<br/>React SPA]
    FE --> GW[API Gateway<br/>Go/Gin :8080]

    subgraph ROUTES[Nhóm định tuyến tại Gateway]
        direction TB
        R_AUTH["/api/auth<br/>/api/users<br/>/api/hr<br/>/api/admin<br/>/api/public"]
        R_JOBS["/api/jobs<br/>/api/applications"]
        R_AI["/api/ai"]
    end

    subgraph SERVICES[Backend services]
        direction TB
        AUTH[Auth Service<br/>Go/Gin :8081]
        JOBS[Jobs Service<br/>Go/Gin :8082]
        AI[AI Service<br/>Go/Gin :8085]
    end

    subgraph DATA[Data & external services]
        direction TB
        MONGO[(MongoDB<br/>users, companies,<br/>jobs, applications)]
        CLOUD[Cloudinary<br/>Avatar/CV]
        LLM[OpenAI-compatible<br/>LLM API]
    end

    GW --> R_AUTH --> AUTH
    GW --> R_JOBS --> JOBS
    GW --> R_AI --> AI

    AUTH -->|Đọc/ghi user, company, CV text| MONGO
    JOBS -->|Đọc/ghi job, application| MONGO
    AI -->|Lấy ngữ cảnh JD, CV, application| MONGO

    AUTH -->|Upload avatar/CV| CLOUD
    AI -->|Sinh phản hồi AI| LLM

    AUTH -.-> AUTH_RULE["JWT middleware<br/>role/admin checks"]
    JOBS -.-> JOBS_RULE["JWT middleware<br/>recruiter ownership checks"]
    AI -.-> AI_RULE["JWT middleware<br/>seeker/recruiter checks<br/>application/job ownership"]

    classDef route fill:#f7fbff,stroke:#8bb7e0,stroke-width:1px,color:#111;
    classDef service fill:#fffaf0,stroke:#b7791f,stroke-width:1.5px,color:#111;
    classDef data fill:#f0fff4,stroke:#2f855a,stroke-width:1.5px,color:#111;
    classDef rule fill:#ffffff,stroke:#777,stroke-dasharray: 5 5,color:#333;
    class R_AUTH,R_JOBS,R_AI route;
    class AUTH,JOBS,AI service;
    class MONGO,CLOUD,LLM data;
    class AUTH_RULE,JOBS_RULE,AI_RULE rule;
```
