# Prompt gen lại wireframe JobBridge AI

## Quy cách chung

- Phong cách: wireframe học thuật, nền trắng, nét đen/xám, ít màu, chữ rõ.
- Tỷ lệ ảnh: 16:9 hoặc A4 ngang, ưu tiên xuất PNG độ phân giải cao.
- Không dùng hiệu ứng marketing, không dùng ảnh stock, không dùng nền gradient.
- Bố cục cần giống sản phẩm thật: có sidebar/topbar khi phù hợp, vùng nội dung chính rõ ràng, bảng/form/card đủ nhãn.
- Tên file đầu ra giữ đúng như bên dưới để LaTeX tự nhận.

## 1. `ui_wireframe_dang_nhap.png`

Vẽ wireframe màn hình đăng nhập của hệ thống tuyển dụng JobBridge AI. Bố cục gồm logo/tên hệ thống ở đầu form, hai input Email và Mật khẩu, nút Đăng nhập chính, liên kết Đăng ký tài khoản, thông báo lỗi nhỏ dưới input khi đăng nhập sai. Màn hình gọn, tập trung vào form xác thực, không cần trang landing.

## 2. `ui_wireframe_dang_ky.png`

Vẽ wireframe màn hình đăng ký tài khoản JobBridge AI. Form gồm họ tên, email, mật khẩu, xác nhận mật khẩu, lựa chọn vai trò Ứng viên/Nhà tuyển dụng dạng segmented control, nút Đăng ký, liên kết quay lại đăng nhập. Bố cục cần thể hiện rõ luồng tạo tài khoản mới.

## 3. `ui_wireframe_danh_sach_viec_lam.png`

Vẽ wireframe màn hình danh sách việc làm. Bố cục gồm thanh tìm kiếm ở phía trên, bộ lọc bên trái gồm địa điểm, mức lương, loại hình, kinh nghiệm; vùng nội dung chính hiển thị danh sách job card gồm tên vị trí, công ty, địa điểm, lương, tag kỹ năng và nút Xem chi tiết/Ứng tuyển. Có phân trang ở cuối.

## 4. `ui_wireframe_ai_coach.png`

Vẽ wireframe màn hình AI Interview Coach cho ứng viên. Bố cục gồm tiêu đề job đang luyện phỏng vấn, cột trái hiển thị thông tin ngữ cảnh job/CV, vùng chính là khung chat với câu hỏi AI và câu trả lời của ứng viên, ô nhập câu trả lời ở dưới, nút Gửi và nút Kết thúc phiên. Có vùng phản hồi ngắn về điểm mạnh/điểm cần cải thiện.

## 5. `ui_wireframe_quan_ly_tin_tuyen_dung.png`

Vẽ wireframe màn hình quản lý tin tuyển dụng cho nhà tuyển dụng. Bố cục gồm sidebar nhà tuyển dụng, nút Tạo tin tuyển dụng, bảng danh sách job với cột Tiêu đề, Công ty, Số ứng viên, Trạng thái, Ngày tạo và Hành động. Hành động gồm xem ứng viên, sửa, đóng/mở tin.

## 6. `ui_wireframe_ai_danh_gia_cv.png`

Vẽ wireframe màn hình nhà tuyển dụng đánh giá CV bằng AI. Bố cục chia hai cột: bên trái là danh sách ứng viên hoặc thông tin CV ứng viên, bên phải là panel AI đánh giá gồm điểm phù hợp, kỹ năng khớp, kỹ năng thiếu, nhận xét tổng quan và nút Gọi AI đánh giá. Có phần ghi chú thủ công và cập nhật trạng thái ứng tuyển.

## 7. `ui_wireframe_admin_dashboard.png`

Vẽ wireframe dashboard quản trị viên. Bố cục gồm sidebar admin, các thẻ thống kê số người dùng, số công ty, số job, số application; biểu đồ đơn giản theo thời gian; bảng công ty chờ duyệt; bảng người dùng gần đây; nút khóa/mở khóa hoặc duyệt/từ chối.
