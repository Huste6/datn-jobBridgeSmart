# -*- coding: utf-8 -*-
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import textwrap

OUT = Path(__file__).resolve().parent
FONT = r"C:\Windows\Fonts\arial.ttf"
FONT_BOLD = r"C:\Windows\Fonts\arialbd.ttf"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def wrap(text, width):
    return "\n".join(textwrap.wrap(text, width=width, break_long_words=False))


def text_center(draw, rect, text, size=18, bold=False, fill="black", chars=18, spacing=4):
    x, y, w, h = rect
    ft = font(size, bold)
    text = wrap(text, chars)
    box = draw.multiline_textbbox((0, 0), text, font=ft, spacing=spacing, align="center")
    tw, th = box[2] - box[0], box[3] - box[1]
    draw.multiline_text((x + (w - tw) / 2, y + (h - th) / 2), text, font=ft, fill=fill, spacing=spacing, align="center")


def arrow(draw, x1, y, x2, label, dashed=False):
    color = "#222222"
    if abs(x2 - x1) < 1:
        loop_w = 130
        loop_h = 46
        draw.line((x1, y, x1 + loop_w, y), fill=color, width=3)
        draw.line((x1 + loop_w, y, x1 + loop_w, y + loop_h), fill=color, width=3)
        draw.line((x1 + loop_w, y + loop_h, x1, y + loop_h), fill=color, width=3)
        draw.polygon([(x1, y + loop_h), (x1 + 18, y + loop_h - 9), (x1 + 18, y + loop_h + 9)], fill=color)
        text_center(draw, (x1 + 18, y - 56, 460, 52), label, 24, chars=34, spacing=6)
        return

    if dashed:
        step = 24 if x2 >= x1 else -24
        x = x1
        while (x < x2 if step > 0 else x > x2):
            x_next = x + step * 0.55
            if step > 0:
                x_next = min(x_next, x2)
            else:
                x_next = max(x_next, x2)
            draw.line((x, y, x_next, y), fill=color, width=3)
            x += step
    else:
        draw.line((x1, y, x2, y), fill=color, width=3)
    direction = 1 if x2 >= x1 else -1
    draw.polygon([(x2, y), (x2 - direction * 18, y - 9), (x2 - direction * 18, y + 9)], fill=color)
    label_w = 520
    tx = min(x1, x2) + abs(x2 - x1) / 2 - label_w / 2
    text_center(draw, (tx, y - 58, label_w, 52), label, 24, chars=34, spacing=6)


def write_mmd(filename, title, participants, steps):
    aliases = {alias: label for alias, label in participants}
    lines = ["sequenceDiagram", f"    title {title}"]
    for alias, label in participants:
        lines.append(f"    participant {alias} as {label}")
    for src, dst, msg, kind in steps:
        connector = "-->>" if kind == "return" else "->>"
        lines.append(f"    {src}{connector}{dst}: {msg}")
    (OUT / f"{filename}.mmd").write_text("\n".join(lines) + "\n", encoding="utf-8")


def draw_png(filename, title, participants, steps):
    margin_x = 125
    header_y = 135
    step_gap = 88
    participant_w = 250
    participant_h = 68
    width = max(2400, margin_x * 2 + (len(participants) - 1) * 330)
    height = header_y + 120 + len(steps) * step_gap
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    text_center(draw, (0, 32, width, 58), title, 38, True, "#174a8b", chars=80)

    col_gap = (width - 2 * margin_x) / (len(participants) - 1)
    xs = {}
    for i, (alias, label) in enumerate(participants):
        x = margin_x + i * col_gap
        xs[alias] = x
        draw.rounded_rectangle((x - participant_w / 2, header_y, x + participant_w / 2, header_y + participant_h), radius=10, outline="#222222", width=3, fill="#f4f8ff")
        text_center(draw, (x - participant_w / 2 + 8, header_y + 5, participant_w - 16, participant_h - 10), label, 24, True, chars=16, spacing=5)
        draw.line((x, header_y + participant_h, x, height - 46), fill="#b0b0b0", width=3)

    y = header_y + 142
    for src, dst, msg, kind in steps:
        arrow(draw, xs[src], y, xs[dst], msg, dashed=(kind == "return"))
        y += step_gap

    image.save(OUT / f"{filename}.png", dpi=(300, 300))


DIAGRAMS = [
    {
        "file": "sequence_01_dang_ky_dang_nhap",
        "title": "UC01 - Đăng ký / Đăng nhập",
        "participants": [("U", "Người dùng"), ("FE", "Frontend"), ("GW", "API Gateway"), ("AUTH", "Auth Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Nhập email, mật khẩu", "call"),
            ("FE", "GW", "POST /api/auth/register hoặc /login", "call"),
            ("GW", "AUTH", "Định tuyến request xác thực", "call"),
            ("AUTH", "DB", "Kiểm tra email, mật khẩu, trạng thái tài khoản", "call"),
            ("DB", "AUTH", "Trả thông tin người dùng", "return"),
            ("AUTH", "AUTH", "Băm/so khớp mật khẩu và tạo JWT", "call"),
            ("AUTH", "FE", "Trả JWT và thông tin vai trò", "return"),
            ("FE", "U", "Điều hướng theo vai trò", "return"),
        ],
    },
    {
        "file": "sequence_02_cap_nhat_ho_so_cv",
        "title": "UC02 - Cập nhật hồ sơ và CV",
        "participants": [("U", "Ứng viên"), ("FE", "Frontend"), ("GW", "API Gateway"), ("AUTH", "Auth Service"), ("CLOUD", "Cloudinary"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Cập nhật hồ sơ, tải avatar/CV", "call"),
            ("FE", "GW", "PUT /api/users/me/profile", "call"),
            ("GW", "AUTH", "Xác thực JWT và role seeker", "call"),
            ("AUTH", "CLOUD", "Upload avatar/CV PDF", "call"),
            ("CLOUD", "AUTH", "Trả URL file", "return"),
            ("AUTH", "AUTH", "Trích xuất cv_text từ CV", "call"),
            ("AUTH", "DB", "Cập nhật profile, cv_url, cv_text", "call"),
            ("DB", "FE", "Trả hồ sơ đã cập nhật", "return"),
        ],
    },
    {
        "file": "sequence_03_xem_tim_kiem_viec_lam",
        "title": "UC03 - Xem và tìm kiếm việc làm",
        "participants": [("U", "Người dùng"), ("FE", "Frontend"), ("GW", "API Gateway"), ("JOBS", "Jobs Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Nhập từ khóa/bộ lọc", "call"),
            ("FE", "GW", "GET /api/jobs?keyword&location&salary", "call"),
            ("GW", "JOBS", "Chuyển truy vấn tìm kiếm", "call"),
            ("JOBS", "DB", "Tìm job đang mở và lọc dữ liệu", "call"),
            ("DB", "JOBS", "Trả danh sách job", "return"),
            ("JOBS", "FE", "Trả kết quả phân trang", "return"),
            ("FE", "U", "Hiển thị danh sách/chi tiết job", "return"),
        ],
    },
    {
        "file": "sequence_04_xem_cong_ty",
        "title": "UC04 - Xem công ty",
        "participants": [("U", "Người dùng"), ("FE", "Frontend"), ("GW", "API Gateway"), ("AUTH", "Auth Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Chọn danh sách hoặc hồ sơ công ty", "call"),
            ("FE", "GW", "GET /api/public/companies", "call"),
            ("GW", "AUTH", "Lấy công ty đã duyệt và chưa khóa", "call"),
            ("AUTH", "DB", "Truy vấn companies", "call"),
            ("DB", "AUTH", "Trả hồ sơ công ty", "return"),
            ("AUTH", "FE", "Trả dữ liệu public", "return"),
            ("FE", "U", "Hiển thị hồ sơ và job của công ty", "return"),
        ],
    },
    {
        "file": "sequence_05_ung_tuyen_job",
        "title": "UC05 - Ứng tuyển job",
        "participants": [("U", "Ứng viên"), ("FE", "Frontend"), ("GW", "API Gateway"), ("JOBS", "Jobs Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Bấm ứng tuyển job", "call"),
            ("FE", "GW", "POST /api/applications", "call"),
            ("GW", "JOBS", "Chuyển request kèm JWT", "call"),
            ("JOBS", "DB", "Kiểm tra role, job, CV và application trùng", "call"),
            ("DB", "JOBS", "Trả dữ liệu hợp lệ", "return"),
            ("JOBS", "DB", "Tạo application trạng thái submitted", "call"),
            ("DB", "FE", "Trả application mới", "return"),
            ("FE", "U", "Thông báo ứng tuyển thành công", "return"),
        ],
    },
    {
        "file": "sequence_06_theo_doi_ung_tuyen",
        "title": "UC06 - Theo dõi ứng tuyển",
        "participants": [("U", "Ứng viên"), ("FE", "Frontend"), ("GW", "API Gateway"), ("JOBS", "Jobs Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Mở trang hồ sơ đã ứng tuyển", "call"),
            ("FE", "GW", "GET /api/applications/me", "call"),
            ("GW", "JOBS", "Xác thực role seeker", "call"),
            ("JOBS", "DB", "Lấy applications theo user_id", "call"),
            ("DB", "JOBS", "Trả application và thông tin job", "return"),
            ("JOBS", "FE", "Trả danh sách trạng thái", "return"),
            ("FE", "U", "Hiển thị lịch sử ứng tuyển", "return"),
        ],
    },
    {
        "file": "sequence_07_ai_interview_coach",
        "title": "UC07 - AI Interview Coach",
        "participants": [("U", "Ứng viên"), ("FE", "Frontend"), ("GW", "API Gateway"), ("AI", "AI Service"), ("DB", "MongoDB"), ("LLM", "LLM API")],
        "steps": [
            ("U", "FE", "Gửi câu hỏi luyện phỏng vấn", "call"),
            ("FE", "GW", "POST /api/ai/interview-coach", "call"),
            ("GW", "AI", "Chuyển request kèm JWT", "call"),
            ("AI", "DB", "Kiểm tra đã ứng tuyển job và lấy JD/CV", "call"),
            ("DB", "AI", "Trả job, application, cv_text", "return"),
            ("AI", "LLM", "Tạo prompt và gọi LLM", "call"),
            ("LLM", "AI", "Trả phản hồi tư vấn", "return"),
            ("AI", "FE", "Trả câu trả lời", "return"),
        ],
    },
    {
        "file": "sequence_08_ai_interview_quiz",
        "title": "UC08 - AI Interview Quiz",
        "participants": [("U", "Ứng viên"), ("FE", "Frontend"), ("GW", "API Gateway"), ("AI", "AI Service"), ("DB", "MongoDB"), ("LLM", "LLM API")],
        "steps": [
            ("U", "FE", "Yêu cầu tạo quiz theo job", "call"),
            ("FE", "GW", "POST /api/ai/interview-quiz", "call"),
            ("GW", "AI", "Xác thực request", "call"),
            ("AI", "DB", "Kiểm tra application và lấy JD/CV", "call"),
            ("DB", "AI", "Trả ngữ cảnh tạo quiz", "return"),
            ("AI", "LLM", "Sinh câu hỏi, đáp án, giải thích", "call"),
            ("LLM", "AI", "Trả bộ quiz", "return"),
            ("AI", "FE", "Hiển thị quiz cho ứng viên", "return"),
        ],
    },
    {
        "file": "sequence_09_quan_ly_cong_ty",
        "title": "UC09 - Quản lý công ty",
        "participants": [("U", "Nhà tuyển dụng"), ("FE", "Frontend"), ("GW", "API Gateway"), ("AUTH", "Auth Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Tạo/cập nhật hồ sơ công ty", "call"),
            ("FE", "GW", "POST/PUT /api/hr/company", "call"),
            ("GW", "AUTH", "Kiểm tra role recruiter", "call"),
            ("AUTH", "DB", "Lưu hồ sơ công ty trạng thái pending", "call"),
            ("DB", "AUTH", "Trả công ty đã lưu", "return"),
            ("AUTH", "FE", "Trả kết quả cập nhật", "return"),
            ("FE", "U", "Hiển thị trạng thái chờ duyệt", "return"),
        ],
    },
    {
        "file": "sequence_10_quan_ly_tin_tuyen_dung",
        "title": "UC10 - Quản lý tin tuyển dụng",
        "participants": [("U", "Nhà tuyển dụng"), ("FE", "Frontend"), ("GW", "API Gateway"), ("JOBS", "Jobs Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Tạo/chỉnh sửa/mở đóng job", "call"),
            ("FE", "GW", "POST/PUT /api/jobs", "call"),
            ("GW", "JOBS", "Kiểm tra role recruiter", "call"),
            ("JOBS", "DB", "Kiểm tra công ty và quyền sở hữu", "call"),
            ("DB", "JOBS", "Trả dữ liệu hợp lệ", "return"),
            ("JOBS", "DB", "Lưu thông tin job", "call"),
            ("JOBS", "FE", "Trả danh sách job của recruiter", "return"),
        ],
    },
    {
        "file": "sequence_11_xem_ung_vien_theo_job",
        "title": "UC11 - Xem ứng viên theo job",
        "participants": [("U", "Nhà tuyển dụng"), ("FE", "Frontend"), ("GW", "API Gateway"), ("JOBS", "Jobs Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Chọn một job đang quản lý", "call"),
            ("FE", "GW", "GET /api/jobs/{id}/applications", "call"),
            ("GW", "JOBS", "Chuyển request kèm JWT", "call"),
            ("JOBS", "DB", "Kiểm tra owner_id của job", "call"),
            ("DB", "JOBS", "Trả applications và CV ứng viên", "return"),
            ("JOBS", "FE", "Trả danh sách ứng viên", "return"),
            ("FE", "U", "Hiển thị CV, trạng thái, ghi chú", "return"),
        ],
    },
    {
        "file": "sequence_12_ai_danh_gia_cv",
        "title": "UC12 - Đánh giá CV bằng AI",
        "participants": [("U", "Nhà tuyển dụng"), ("FE", "Frontend"), ("GW", "API Gateway"), ("AI", "AI Service"), ("DB", "MongoDB"), ("LLM", "LLM API")],
        "steps": [
            ("U", "FE", "Chọn đánh giá một application", "call"),
            ("FE", "GW", "POST /api/ai/hr/evaluate-cv", "call"),
            ("GW", "AI", "Chuyển request kèm JWT", "call"),
            ("AI", "DB", "Kiểm tra recruiter sở hữu job", "call"),
            ("DB", "AI", "Trả JD, CV text, application", "return"),
            ("AI", "LLM", "Gọi LLM đánh giá độ phù hợp", "call"),
            ("LLM", "AI", "Trả nhận xét và gợi ý", "return"),
            ("AI", "FE", "Hiển thị kết quả đánh giá", "return"),
        ],
    },
    {
        "file": "sequence_13_dashboard_admin",
        "title": "UC13 - Dashboard thống kê",
        "participants": [("U", "Quản trị viên"), ("FE", "Frontend"), ("GW", "API Gateway"), ("AUTH", "Auth Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Mở dashboard quản trị", "call"),
            ("FE", "GW", "GET /api/admin/dashboard", "call"),
            ("GW", "AUTH", "Kiểm tra role admin", "call"),
            ("AUTH", "DB", "Đếm users, companies, jobs, applications", "call"),
            ("DB", "AUTH", "Trả số liệu tổng hợp", "return"),
            ("AUTH", "FE", "Trả dữ liệu dashboard", "return"),
            ("FE", "U", "Hiển thị biểu đồ và chỉ số", "return"),
        ],
    },
    {
        "file": "sequence_14_quan_ly_nguoi_dung",
        "title": "UC14 - Quản lý người dùng",
        "participants": [("U", "Quản trị viên"), ("FE", "Frontend"), ("GW", "API Gateway"), ("AUTH", "Auth Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Lọc/tìm hoặc khóa tài khoản", "call"),
            ("FE", "GW", "GET/PUT /api/admin/users", "call"),
            ("GW", "AUTH", "Kiểm tra role admin", "call"),
            ("AUTH", "DB", "Truy vấn hoặc cập nhật trạng thái user", "call"),
            ("DB", "AUTH", "Trả dữ liệu người dùng", "return"),
            ("AUTH", "FE", "Trả kết quả quản lý", "return"),
            ("FE", "U", "Cập nhật danh sách người dùng", "return"),
        ],
    },
    {
        "file": "sequence_15_duyet_khoa_cong_ty",
        "title": "UC15 - Duyệt và khóa công ty",
        "participants": [("U", "Quản trị viên"), ("FE", "Frontend"), ("GW", "API Gateway"), ("AUTH", "Auth Service"), ("DB", "MongoDB")],
        "steps": [
            ("U", "FE", "Duyệt/từ chối/khóa công ty", "call"),
            ("FE", "GW", "PUT /api/admin/companies/{id}", "call"),
            ("GW", "AUTH", "Kiểm tra role admin", "call"),
            ("AUTH", "DB", "Cập nhật trạng thái company", "call"),
            ("DB", "AUTH", "Trả company đã cập nhật", "return"),
            ("AUTH", "FE", "Trả kết quả kiểm duyệt", "return"),
            ("FE", "U", "Hiển thị trạng thái mới", "return"),
        ],
    },
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in list(OUT.glob("sequence_*.mmd")) + list(OUT.glob("sequence_*.png")):
        old.unlink()
    for item in DIAGRAMS:
        write_mmd(item["file"], item["title"], item["participants"], item["steps"])
        draw_png(item["file"], item["title"], item["participants"], item["steps"])
    print(f"Generated {len(DIAGRAMS)} Mermaid files and {len(DIAGRAMS)} PNG diagrams in {OUT}")


if __name__ == "__main__":
    main()
