# 4) Thiet ke chi tiet (Sequence Diagram)

## File can ve
- `sequence_apply_job.png`
- `sequence_ai_interview.png`
- `sequence_cv_scoring.png`

## Noi dung can co
- Apply job: Candidate -> Frontend -> Gateway -> Jobs Service -> MongoDB.
- AI interview: Candidate -> Frontend -> Gateway -> AI Service -> OpenAI API -> MongoDB.
- CV scoring: Recruiter -> Frontend -> Gateway -> AI Service -> OpenAI API -> MongoDB.

## Goi y
- Vung lifeline ro rang, mui ten request/response.
- Ghi chu ngan cho buoc luu du lieu vao DB.

## Prompt goi y de gen anh (copy vao chat gen anh)
"Ve 3 UML sequence diagram rieng biet (3 anh). Nen trang, chu ro. Lifeline gom: Candidate/Recruiter, Frontend, API Gateway, Service (Jobs/AI), MongoDB, OpenAI API (neu can). Anh 1: Apply job - Candidate -> Frontend: chon job va nhan ung tuyen; Frontend -> Gateway: POST /apply; Gateway -> Jobs Service; Jobs Service -> MongoDB: save application; tra ket qua nguoc lai. Anh 2: AI interview - Candidate -> Frontend: gui cau hoi; Frontend -> Gateway -> AI Service; AI Service -> OpenAI API: tao cau hoi/phan hoi; AI Service -> MongoDB: luu lich su; tra ve Frontend. Anh 3: CV scoring - Recruiter -> Frontend: yeu cau danh gia CV; Frontend -> Gateway -> AI Service; AI Service -> OpenAI API: cham diem; AI Service -> MongoDB: luu ket qua; tra ve Frontend."

## Bo cuc de ve
- Lifeline xep tu trai sang phai: User, Frontend, Gateway, Service, DB, External API
- Mui ten request/response ro rang
