# -*- coding: utf-8 -*-
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
import textwrap

OUT = Path(__file__).resolve().parent

FONT = r"C:\Windows\Fonts\arial.ttf"
FONT_BOLD = r"C:\Windows\Fonts\arialbd.ttf"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def wrap_text(text, chars):
    lines = []
    for part in str(text).split("\n"):
        lines.extend(textwrap.wrap(part, width=chars, break_long_words=False) or [""])
    return "\n".join(lines)


def center(draw, rect, text, size=24, bold=False, chars=24, fill="black", spacing=6):
    x, y, w, h = rect
    text = wrap_text(text, chars)
    ft = font(size, bold)
    box = draw.multiline_textbbox((0, 0), text, font=ft, spacing=spacing, align="center")
    tw, th = box[2] - box[0], box[3] - box[1]
    draw.multiline_text(
        (x + (w - tw) / 2, y + (h - th) / 2),
        text,
        font=ft,
        fill=fill,
        spacing=spacing,
        align="center",
    )


def line(draw, p1, p2, fill="black", width=3):
    draw.line((p1, p2), fill=fill, width=width)


def dashed_line(draw, p1, p2, fill="black", width=3, dash=20, gap=14):
    x1, y1 = p1
    x2, y2 = p2
    length = math.hypot(x2 - x1, y2 - y1)
    if length == 0:
        return
    ux, uy = (x2 - x1) / length, (y2 - y1) / length
    distance = 0
    while distance < length:
        start = distance
        end = min(distance + dash, length)
        draw.line(
            (
                (x1 + ux * start, y1 + uy * start),
                (x1 + ux * end, y1 + uy * end),
            ),
            fill=fill,
            width=width,
        )
        distance += dash + gap


def arrow_head(draw, start, end, fill="black", size=18):
    x1, y1 = start
    x2, y2 = end
    angle = math.atan2(y2 - y1, x2 - x1)
    draw.polygon(
        [
            (x2, y2),
            (x2 + size * math.cos(angle + math.pi * 0.82), y2 + size * math.sin(angle + math.pi * 0.82)),
            (x2 + size * math.cos(angle - math.pi * 0.82), y2 + size * math.sin(angle - math.pi * 0.82)),
        ],
        fill=fill,
    )


def dashed_poly_arrow(draw, points, fill="black", width=3):
    for index in range(len(points) - 1):
        dashed_line(draw, points[index], points[index + 1], fill=fill, width=width)
    arrow_head(draw, points[-2], points[-1], fill=fill)


def actor(draw, x, y, label, scale=1.0):
    head = 18 * scale
    body = 70 * scale
    arm = 42 * scale
    leg = 38 * scale
    stroke = max(2, int(3 * scale))
    draw.ellipse((x - head, y, x + head, y + 2 * head), outline="black", width=stroke)
    line(draw, (x, y + 2 * head), (x, y + 2 * head + body), width=stroke)
    line(draw, (x - arm, y + 2 * head + 28 * scale), (x + arm, y + 2 * head + 28 * scale), width=stroke)
    line(draw, (x, y + 2 * head + body), (x - leg, y + 2 * head + body + 54 * scale), width=stroke)
    line(draw, (x, y + 2 * head + body), (x + leg, y + 2 * head + body + 54 * scale), width=stroke)
    center(draw, (x - 150, y + 2 * head + body + 62 * scale, 300, 72), label, 24, chars=16)


def ellipse(draw, x, y, w, h, label, width=3, size=30, chars=22):
    draw.ellipse((x, y, x + w, y + h), outline="black", width=width, fill="white")
    center(draw, (x + 18, y + 12, w - 36, h - 24), label, size=size, chars=chars)
    return (x + w / 2, y + h / 2)


def edge_point(center_point, target_point, rx, ry):
    cx, cy = center_point
    tx, ty = target_point
    dx, dy = tx - cx, ty - cy
    if dx == 0 and dy == 0:
        return center_point
    scale = 1 / math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry))
    return (cx + dx * scale, cy + dy * scale)


def save(image, name):
    image.save(OUT / name, dpi=(300, 300))


def usecase_general():
    width, height = 2800, 1850
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    center(draw, (0, 28, width, 66), "Sơ đồ Use Case tổng quát hệ thống JobBridge AI", 42, True, chars=90)
    draw.rectangle((350, 115, 2670, 1730), outline="black", width=4)
    center(draw, (350, 124, 2320, 48), "JobBridge AI", 32, True, chars=40)

    lane_ys = [180, 560, 970, 1380, 1730]
    for y in lane_ys[1:-1]:
        draw.line((350, y, 2670, y), fill="#d8d8d8", width=2)

    actors = {
        "guest": (160, 275, "Khách truy cập", (285, 365)),
        "seeker": (160, 680, "Ứng viên", (285, 770)),
        "recruiter": (160, 1090, "Nhà tuyển dụng", (285, 1180)),
        "admin": (160, 1480, "Quản trị viên", (285, 1570)),
    }
    for x, y, label, _anchor in actors.values():
        actor(draw, x, y, label)

    cases = {
        "auth": (520, 235, 320, 115, "Đăng ký /\nĐăng nhập", "guest"),
        "jobs_public": (890, 365, 350, 115, "Xem / tìm kiếm\nviệc làm", "guest"),
        "companies_public": (1260, 235, 320, 115, "Xem công ty", "guest"),
        "profile": (520, 615, 340, 120, "Cập nhật hồ sơ\nvà CV", "seeker"),
        "apply": (920, 775, 330, 120, "Ứng tuyển job", "seeker"),
        "track": (1260, 615, 330, 120, "Theo dõi\nứng tuyển", "seeker"),
        "coach": (1640, 775, 340, 120, "AI Coach /\nAI Quiz", "seeker"),
        "check_apply": (2100, 775, 350, 120, "Kiểm tra điều kiện\nứng tuyển", None),
        "company": (520, 1025, 335, 120, "Quản lý\ncông ty", "recruiter"),
        "manage_jobs": (910, 1190, 350, 120, "Quản lý tin\ntuyển dụng", "recruiter"),
        "candidates": (1285, 1025, 350, 120, "Xem ứng viên\ntheo job", "recruiter"),
        "eval": (1680, 1190, 350, 120, "Đánh giá CV\nbằng AI", "recruiter"),
        "check_owner": (2140, 1190, 350, 120, "Kiểm tra quyền\nsở hữu job", None),
        "users": (520, 1435, 335, 120, "Quản lý\nngười dùng", "admin"),
        "approve": (930, 1570, 335, 120, "Duyệt / khóa\ncông ty", "admin"),
        "stats": (1340, 1435, 335, 120, "Dashboard\nthống kê", "admin"),
    }
    centers = {
        key: (x + w / 2, y + h / 2)
        for key, (x, y, w, h, _label, _actor_key) in cases.items()
    }

    for key, (x, y, w, h, _label, actor_key) in cases.items():
        if actor_key is None:
            continue
        actor_anchor = actors[actor_key][3]
        target = edge_point(centers[key], actor_anchor, w / 2, h / 2)
        line(draw, actor_anchor, target, fill="#333333", width=2)

    for x, y, w, h, label, _actor_key in cases.values():
        ellipse(draw, x, y, w, h, label, width=3, size=30, chars=18)

    include_pairs = [
        ("coach", "check_apply", (1970, 735, 210, 34)),
        ("eval", "check_owner", (2010, 1150, 210, 34)),
    ]
    for src, dst, label_rect in include_pairs:
        sx, sy, sw, sh, *_ = cases[src]
        dx, dy, dw, dh, *_ = cases[dst]
        start = edge_point(centers[src], centers[dst], sw / 2, sh / 2)
        end = edge_point(centers[dst], centers[src], dw / 2, dh / 2)
        dashed_poly_arrow(draw, [start, end], width=2)
        center(draw, label_rect, "<<include>>", 26, chars=18)

    save(image, "usecase_00_tong_quat.png")


DETAILS = [
    ("usecase_01_dang_ky_dang_nhap", "Use Case 01 - Đăng ký / Đăng nhập", "Khách truy cập", ["Nhập email, mật khẩu", "Tạo tài khoản", "Đăng nhập", "Nhận JWT", "Chọn vai trò sau đăng nhập"]),
    ("usecase_02_cap_nhat_ho_so_cv", "Use Case 02 - Cập nhật hồ sơ và CV", "Ứng viên", ["Cập nhật thông tin cá nhân", "Upload avatar", "Upload CV PDF", "Trích xuất cv_text", "Lưu URL Cloudinary"]),
    ("usecase_03_xem_tim_kiem_viec_lam", "Use Case 03 - Xem và tìm kiếm việc làm", "Khách truy cập / Ứng viên", ["Xem danh sách việc làm", "Tìm theo từ khóa", "Lọc địa điểm / mức lương", "Xem chi tiết job", "Xem thông tin công ty"]),
    ("usecase_04_xem_cong_ty", "Use Case 04 - Xem danh sách và hồ sơ công ty", "Khách truy cập / Ứng viên", ["Xem danh sách công ty", "Xem hồ sơ công ty public", "Xem các job của công ty", "Chuyển sang chi tiết việc làm"]),
    ("usecase_05_ung_tuyen_job", "Use Case 05 - Ứng tuyển job", "Ứng viên", ["Chọn job", "Kiểm tra đăng nhập và role seeker", "Kiểm tra CV", "Tạo application", "Lưu trạng thái submitted"]),
    ("usecase_06_theo_doi_ung_tuyen", "Use Case 06 - Theo dõi ứng tuyển", "Ứng viên", ["Xem danh sách application", "Xem trạng thái xét duyệt", "Xem job đã ứng tuyển", "Theo dõi lịch sử nộp hồ sơ"]),
    ("usecase_07_ai_interview_coach", "Use Case 07 - AI Interview Coach", "Ứng viên", ["Chọn job đã ứng tuyển", "Kiểm tra ứng tuyển hợp lệ", "Lấy JD và CV text", "Gửi câu hỏi phỏng vấn", "Nhận phản hồi tư vấn"]),
    ("usecase_08_ai_interview_quiz", "Use Case 08 - AI Interview Quiz", "Ứng viên", ["Chọn job đã ứng tuyển", "Kiểm tra ứng tuyển hợp lệ", "Tạo prompt từ JD và CV", "Sinh bộ câu hỏi trắc nghiệm", "Hiển thị đáp án và giải thích"]),
    ("usecase_09_quan_ly_cong_ty", "Use Case 09 - Quản lý công ty", "Nhà tuyển dụng", ["Tạo hồ sơ công ty", "Cập nhật thông tin công ty", "Gửi duyệt public profile", "Theo dõi trạng thái duyệt"]),
    ("usecase_10_quan_ly_tin_tuyen_dung", "Use Case 10 - Quản lý tin tuyển dụng", "Nhà tuyển dụng", ["Tạo job", "Chỉnh sửa job", "Mở / đóng tin tuyển dụng", "Xóa job", "Xem danh sách job của mình"]),
    ("usecase_11_xem_ung_vien_theo_job", "Use Case 11 - Xem ứng viên theo job", "Nhà tuyển dụng", ["Chọn job thuộc sở hữu", "Xem danh sách application", "Xem CV ứng viên", "Cập nhật trạng thái", "Ghi chú và cập nhật điểm"]),
    ("usecase_12_ai_danh_gia_cv", "Use Case 12 - Đánh giá CV bằng AI", "Nhà tuyển dụng", ["Chọn application", "Kiểm tra quyền sở hữu job", "Lấy JD và CV text", "Gọi LLM API", "Nhận nhận xét mức độ phù hợp"]),
    ("usecase_13_dashboard_admin", "Use Case 13 - Dashboard thống kê", "Quản trị viên", ["Xem tổng số người dùng", "Xem số công ty", "Xem số tin tuyển dụng", "Theo dõi số liệu vận hành"]),
    ("usecase_14_quan_ly_nguoi_dung", "Use Case 14 - Quản lý người dùng", "Quản trị viên", ["Xem danh sách người dùng", "Lọc theo vai trò", "Khóa / mở khóa tài khoản", "Kiểm soát tài khoản vi phạm"]),
    ("usecase_15_duyet_khoa_cong_ty", "Use Case 15 - Duyệt và khóa công ty", "Quản trị viên", ["Xem danh sách công ty", "Duyệt hồ sơ công ty", "Từ chối hoặc khóa công ty", "Mở khóa khi hợp lệ"]),
]


def detail(filename, title, actor_label, items):
    width, height = 1900, 520
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    draw.rounded_rectangle((35, 35, width - 35, height - 35), radius=18, outline="black", width=4, fill="white")
    center(draw, (70, 42, 620, 46), title, 30, True, chars=52, fill="#174a8b")
    center(draw, (620, 42, 660, 42), "JobBridge AI", 24, True, chars=40)
    actor(draw, 170, 140, actor_label, scale=0.72)

    main_label = title.split(" - ", 1)[1]
    main_rect = (360, 190, 420, 135)
    main_center = (main_rect[0] + main_rect[2] / 2, main_rect[1] + main_rect[3] / 2)

    child_w, child_h = 430, 65
    child_x = 1185
    if len(items) <= 3:
        ys = [125, 220, 315][:len(items)]
    elif len(items) == 4:
        ys = [95, 185, 275, 365]
    else:
        ys = [92, 166, 240, 314, 388]

    actor_anchor = (245, 252)
    main_left = edge_point(main_center, actor_anchor, main_rect[2] / 2, main_rect[3] / 2)
    line(draw, actor_anchor, main_left, width=3)
    arrow_head(draw, actor_anchor, main_left, size=14)

    child_centers = []
    for index, item in enumerate(items):
        y = ys[index]
        child_center = (child_x + child_w / 2, y + child_h / 2)
        child_centers.append((item, y, child_center))

        main_edge = edge_point(main_center, child_center, main_rect[2] / 2, main_rect[3] / 2)
        child_edge = edge_point(child_center, main_center, child_w / 2, child_h / 2)
        dashed_poly_arrow(draw, [main_edge, child_edge], width=2)
        label_x = main_edge[0] + (child_edge[0] - main_edge[0]) * 0.47 - 90
        label_y = main_edge[1] + (child_edge[1] - main_edge[1]) * 0.47 - 18
        center(draw, (label_x - 8, label_y - 2, 196, 34), "<<include>>", 22, chars=18, fill="#6f6f6f")

    draw.ellipse(
        (main_rect[0], main_rect[1], main_rect[0] + main_rect[2], main_rect[1] + main_rect[3]),
        outline="#174a8b",
        width=4,
        fill="#f4f8ff",
    )
    center(draw, (main_rect[0] + 18, main_rect[1] + 12, main_rect[2] - 36, main_rect[3] - 24), main_label, size=34, bold=True, chars=20)
    for item, y, _child_center in child_centers:
        ellipse(draw, child_x, y, child_w, child_h, item, width=3, size=30, chars=24)

    save(image, filename + ".png")


def main():
    for image in OUT.glob("*.png"):
        image.unlink()
    usecase_general()
    for row in DETAILS:
        detail(*row)
    print(f"Generated {len(list(OUT.glob('*.png')))} use case diagrams in {OUT}")


if __name__ == "__main__":
    main()
