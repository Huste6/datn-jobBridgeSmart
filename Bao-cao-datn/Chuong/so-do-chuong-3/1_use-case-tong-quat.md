```mermaid
graph TD
    subgraph "Hệ thống JobBridge"
        direction LR

        subgraph "Quản lý Việc làm"
            UC1("Đăng tin tuyển dụng")
            UC2("Tìm kiếm việc làm")
            UC3("Xem chi tiết việc làm")
            UC4("Quản lý tin tuyển dụng")
            UC5("Nộp hồ sơ ứng tuyển")
        end

        subgraph "Quản lý Hồ sơ & CV"
            UC6("Tạo và quản lý hồ sơ")
            UC7("Tải CV lên")
            UC8("Phân tích CV bằng AI")
            UC9("Xem danh sách ứng viên")
        end

        subgraph "Tính năng AI"
            UC10("Tạo CV với AI")
            UC11("Tư vấn phỏng vấn với AI")
            UC12("Gợi ý việc làm phù hợp")
        end

        subgraph "Quản lý Tài khoản"
            UC13("Đăng ký / Đăng nhập")
            UC14("Quản lý thông tin cá nhân")
            UC15("Quản lý thông tin công ty")
        end
    end

    actor "Ứng viên" as Candidate
    actor "Nhà tuyển dụng" as Recruiter

    Candidate --|> UC2
    Candidate --|> UC3
    Candidate --|> UC5
    Candidate --|> UC6
    Candidate --|> UC7
    Candidate --|> UC8
    Candidate --|> UC10
    Candidate --|> UC11
    Candidate --|> UC12
    Candidate --|> UC13
    Candidate --|> UC14

    Recruiter --|> UC1
    Recruiter --|> UC3
    Recruiter --|> UC4
    Recruiter --|> UC9
    Recruiter --|> UC13
    Recruiter --|> UC15

```

**Ghi chú để vẽ:**

*   **Actor:**
    *   **Ứng viên (Candidate):** Người tìm việc.
    *   **Nhà tuyển dụng (Recruiter):** Người đại diện cho công ty để đăng tin và tìm kiếm ứng viên.
*   **Các Use Case chính:**
    *   **Ứng viên:** Có thể tìm kiếm, xem chi tiết và nộp hồ sơ cho các công việc. Họ có thể quản lý hồ sơ cá nhân, tải CV lên để được AI phân tích, hoặc dùng AI để tạo CV mới và luyện phỏng vấn.
    *   **Nhà tuyển dụng:** Có thể đăng và quản lý các tin tuyển dụng của công ty mình. Họ có thể xem danh sách các ứng viên đã nộp hồ sơ.
*   **Quan hệ:** Các đường nối thể hiện actor nào có thể thực hiện use case nào.
