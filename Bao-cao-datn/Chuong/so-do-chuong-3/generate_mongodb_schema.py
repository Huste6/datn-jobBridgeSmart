from pathlib import Path
import textwrap

from PIL import Image, ImageDraw, ImageFont


BASE_DIR = Path(__file__).resolve().parent
OUTPUT = BASE_DIR / "erd_database.png"


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    if name == "bold":
        candidates = [
            Path("C:/Windows/Fonts/arialbd.ttf"),
            Path("C:/Windows/Fonts/segoeuib.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        ]
    else:
        candidates = [
            Path("C:/Windows/Fonts/arial.ttf"),
            Path("C:/Windows/Fonts/segoeui.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


FONT_TITLE = load_font("bold", 64)
FONT_SUBTITLE = load_font("regular", 34)
FONT_CARD_TITLE = load_font("bold", 46)
FONT_CARD_TEXT = load_font("regular", 36)
FONT_NOTE = load_font("regular", 32)
FONT_NOTE_BOLD = load_font("bold", 36)


def rounded_box(draw, xy, radius, fill, outline, width=4):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_centered(draw, text, y, font, fill, canvas_width):
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (canvas_width - (bbox[2] - bbox[0])) / 2
    draw.text((x, y), text, font=font, fill=fill)


def draw_wrapped(draw, text, x, y, width, font, fill, line_height):
    words = text.split()
    line = ""
    for word in words:
        candidate = word if not line else f"{line} {word}"
        bbox = draw.textbbox((0, 0), candidate, font=font)
        if bbox[2] - bbox[0] <= width:
            line = candidate
        else:
            draw.text((x, y), line, font=font, fill=fill)
            y += line_height
            line = word
    if line:
        draw.text((x, y), line, font=font, fill=fill)
        y += line_height
    return y


def draw_collection_card(draw, x, y, w, h, title, rows, header_color):
    rounded_box(draw, (x, y, x + w, y + h), 28, "#ffffff", "#2d3748", 5)
    draw.rounded_rectangle((x, y, x + w, y + 88), radius=28, fill=header_color, outline=header_color)
    draw.rectangle((x, y + 54, x + w, y + 88), fill=header_color)
    draw.text((x + 42, y + 18), title, font=FONT_CARD_TITLE, fill="#102a43")

    current_y = y + 120
    for row in rows:
        current_y = draw_wrapped(draw, f"- {row}", x + 46, current_y, w - 92, FONT_CARD_TEXT, "#1f2933", 50)
        current_y += 6


def main():
    width, height = 3200, 1800
    image = Image.new("RGB", (width, height), "#f8fafc")
    draw = ImageDraw.Draw(image)

    draw_centered(draw, "Mô hình tài liệu MongoDB - JobBridge AI", 70, FONT_TITLE, "#102a43", width)
    draw_centered(
        draw,
        "Các collection được tổ chức độc lập; ObjectId chỉ là tham chiếu logic do tầng service kiểm soát.",
        145,
        FONT_SUBTITLE,
        "#52606d",
        width,
    )

    card_w, card_h = 1360, 530
    left_x, right_x = 190, 1650
    top_y, bottom_y = 250, 850

    collections = [
        (
            left_x,
            top_y,
            "users",
            [
                "_id: ObjectId",
                "email, password_hash, role, is_locked",
                "profile: {name, phone, address, skills, experience}",
                "avatar_url, cv_url, cv_text",
                "created_at, updated_at",
            ],
            "#dbeafe",
        ),
        (
            right_x,
            top_y,
            "companies",
            [
                "_id: ObjectId",
                "owner_id: ObjectId (tham chiếu logic)",
                "name, tax_code, industry, size, location",
                "description, logo_url",
                "approval_status, is_locked, created_at",
            ],
            "#dcfce7",
        ),
        (
            left_x,
            bottom_y,
            "jobs",
            [
                "_id: ObjectId",
                "company_id, owner_id: ObjectId (tham chiếu logic)",
                "title, description, requirements",
                "salary_range, location, type",
                "status, deadline, created_at, updated_at",
            ],
            "#ffedd5",
        ),
        (
            right_x,
            bottom_y,
            "applications",
            [
                "_id: ObjectId",
                "user_id, job_id: ObjectId (tham chiếu logic)",
                "cv_url, cv_text_snapshot",
                "status, manual_score (HR cập nhật)",
                "created_at, updated_at",
            ],
            "#f3e8ff",
        ),
    ]

    for x, y, title, rows, color in collections:
        draw_collection_card(draw, x, y, card_w, card_h, title, rows, color)

    note_x, note_y, note_w, note_h = 190, 1455, 2820, 210
    rounded_box(draw, (note_x, note_y, note_x + note_w, note_y + note_h), 26, "#ffffff", "#64748b", 4)
    draw.text((note_x + 46, note_y + 35), "Ghi chú thiết kế", font=FONT_NOTE_BOLD, fill="#102a43")
    note = (
        "MongoDB không thực thi khóa ngoại hoặc quan hệ nối bảng như cơ sở dữ liệu quan hệ. "
        "Các trường ObjectId trong hình chỉ giúp service truy vấn, kiểm tra quyền sở hữu và "
        "bảo đảm nhất quán nghiệp vụ ở tầng ứng dụng; vì vậy sơ đồ không sử dụng đường liên kết giữa các collection."
    )
    draw_wrapped(draw, note, note_x + 46, note_y + 90, note_w - 92, FONT_NOTE, "#334e68", 45)

    image.save(OUTPUT, dpi=(300, 300))
    print(f"Generated {OUTPUT}")


if __name__ == "__main__":
    main()
