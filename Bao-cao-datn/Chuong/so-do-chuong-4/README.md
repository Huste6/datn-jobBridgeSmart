# So do chuong 4

Muc tieu: Liet ke tung so do/anh can ve cho Chuong 4, gom ten file de luu va goi y noi dung.

## 1) Thiet ke kien truc (Architecture)
- File: `architecture_overview.png`
- Noi dung: So do tong the he thong JobBridge AI (Frontend, API Gateway, Auth/Jobs/AI services, MongoDB, ACR/AKS, OpenAI API). Neu da co so do tu Chuong 2, co the tai su dung va chinh sua nhe.

## 2) Thiet ke tong quan (UML Package Diagram)
- File: `package_diagram.png`
- Noi dung: So do goi UML the hien cac tang ro rang (Frontend, Gateway, Services, Data, AI). The hien phu thuoc 1 chieu (tang tren goi tang duoi).

## 3) Thiet ke chi tiet goi (UML Class Diagram)
- File: `class_diagram_auth.png`
- Noi dung: Class diagram cho Auth (User, Company, Token, AuthService, Repository).

- File: `class_diagram_jobs.png`
- Noi dung: Class diagram cho Jobs (Job, Application, Resume, JobService, Repository).

- File: `class_diagram_ai.png`
- Noi dung: Class diagram cho AI (AIHistory, AIService, PromptBuilder/Client, Repository).

## 4) Thiet ke chi tiet (Sequence Diagram)
- File: `sequence_apply_job.png`
- Noi dung: Luong ung tuyen cong viec (Candidate -> Frontend -> Gateway -> Jobs Service -> DB).

- File: `sequence_ai_interview.png`
- Noi dung: Luong AI interview (Candidate -> Frontend -> Gateway -> AI Service -> OpenAI API -> DB).

- File: `sequence_cv_scoring.png`
- Noi dung: Luong AI danh gia CV (Recruiter -> Frontend -> Gateway -> AI Service -> OpenAI API -> DB).

## 5) Thiet ke giao dien (UI Design - Wireframe/Mockup)
- File: `ui_wireframe_job_list.png`
- Noi dung: Wireframe danh sach viec lam (khong dung screenshot that).

- File: `ui_wireframe_job_detail.png`
- Noi dung: Wireframe trang chi tiet cong viec.

- File: `ui_wireframe_ai_interview.png`
- Noi dung: Wireframe trang AI interview.

- File: `ui_wireframe_recruiter_dashboard.png`
- Noi dung: Wireframe trang quan ly tin/ung vien.

## 6) Thiet ke co so du lieu
- File: `erd_database.png`
- Noi dung: ERD/NoSQL data model (co the tai su dung tu Chuong 3 neu phu hop).

## 7) Trien khai (Deployment)
- File: `deployment_architecture.png`
- Noi dung: So do trien khai tren AKS (Ingress, Services, Pods, ACR, Argo CD/GitHub Actions).

---

Goi y:
- Dinh dang PNG, nen dung nen trang, vien net ro rang.
- Ten file dung dung nhu tren de de chen vao LaTeX.
- Neu chi ve 1 phan, bao lai de bo qua phan con lai.
