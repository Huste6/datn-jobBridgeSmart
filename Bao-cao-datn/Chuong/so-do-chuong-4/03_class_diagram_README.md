# 3) Thiet ke chi tiet goi (UML Class Diagram)

## File can ve
- `class_diagram_auth.png`
- `class_diagram_jobs.png`
- `class_diagram_ai.png`

## Noi dung can co
- Auth: User, Company, Token, AuthService, Repository.
- Jobs: Job, Application, Resume, JobService, Repository.
- AI: AIHistory, AIService, OpenAIClient, Repository.

## Goi y
- Chi can ten lop, khong can thuoc tinh/ham.
- The hien cac quan he: association, aggregation, composition, inheritance.

## Prompt goi y de gen anh (copy vao chat gen anh)
"Ve 3 UML class diagram rieng biet (3 anh). Phong cach toi gian, nen trang, chu ro. Khong can thuoc tinh/ham, chi can ten lop va mui ten quan he. Anh 1: Auth package gom lop User, Company, Token, AuthService, AuthRepository. Quan he: AuthService association voi AuthRepository; AuthRepository association voi User va Company; User association voi Token. Anh 2: Jobs package gom Job, Application, Resume, JobService, JobRepository. Quan he: JobService association voi JobRepository; JobRepository association voi Job, Application, Resume; Application association voi Job va Resume. Anh 3: AI package gom AIHistory, AIService, OpenAIClient, AIRepository. Quan he: AIService association voi OpenAIClient va AIRepository; AIRepository association voi AIHistory."

## Bo cuc de ve
- Moi anh: ten goi o tieu de (Auth/Jobs/AI)
- Dat Service o giua, Repository o ben duoi, Model o ben trai/phai
- Mui ten 1 chieu, khong vong lap
