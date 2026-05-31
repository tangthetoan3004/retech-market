# Tổng hợp Câu hỏi thường gặp (FAQ) tại Retech Market

Dưới đây là danh sách tổng hợp các câu hỏi và giải đáp chi tiết xoay quanh quá trình mua hàng, bán máy cũ (thu cũ), thanh toán ZaloPay, hoàn tiền và quản lý tài khoản thành viên tại Retech Market.

---

### ❓ Câu hỏi 1: Tôi có thể đăng ký tài khoản trên Retech Market bằng cách nào?
-   **Trả lời**: Bạn có thể đăng ký vô cùng đơn giản bằng cách nhấp vào nút **"Đăng nhập/Đăng ký"** trên thanh tiêu đề của trang web. 
-   Hệ thống hỗ trợ 2 phương thức:
    1.  **Đăng ký truyền thống**: Điền thông tin Email, Họ tên, Số điện thoại và thiết lập mật khẩu cá nhân. Hệ thống sẽ gửi mã xác thực OTP về số điện thoại để bạn kích hoạt.
    2.  **Đăng nhập bằng Google (Google OAuth)**: Nhấn chọn biểu tượng Google để đăng nhập trực tiếp qua tài khoản Gmail của bạn chỉ bằng một cú click chuột mà không cần khai báo mật khẩu.

---

### ❓ Câu hỏi 2: Quy trình định giá thu mua điện thoại bằng AI hoạt động ra sao?
-   **Trả lời**: Retech Market tích hợp mô hình thị giác máy tính AI (Computer Vision) để tự động hóa định giá. 
-   Bạn truy cập trang **Thu cũ đổi mới**, chọn đúng thông tin cấu hình máy (Thương hiệu, Dòng máy, Bộ nhớ RAM/Storage), khai báo tình trạng chức năng và tải lên hình ảnh thật mặt trước của điện thoại.
-   Hệ thống AI sẽ tự động phân tích hình ảnh trong vòng vài giây, phát hiện các vết trầy xước, nứt vỡ để chấm điểm hao mòn ngoại hình của máy. Sau đó, kết hợp cùng các khai báo chức năng, AI sẽ xuất ra **Mức giá thu mua ước tính** ngay trên màn hình.

---

### ❓ Câu hỏi 3: Khách vãng lai chưa đăng nhập có thể dùng tính năng định giá AI không?
-   **Trả lời**: **Có!** Retech Market cho phép người dùng vãng lai tự do chọn cấu hình và tải ảnh lên để AI định giá ước tính.
-   Khi bạn đồng ý mức giá và nhấn nút **"Xác nhận tạo đơn"**, hệ thống sẽ tự động lưu tạm thông tin máy vào `sessionStorage` của trình duyệt và yêu cầu bạn Đăng nhập/Đăng ký tài khoản. Sau khi đăng nhập thành công, dữ liệu lưu tạm sẽ được khôi phục tự động giúp bạn hoàn tất tạo đơn thu cũ rất nhanh mà không cần nhập lại.

---

### ❓ Câu hỏi 4: Cổng thanh toán ZaloPay trên Retech hoạt động như thế nào?
-   **Trả lời**: Khi mua hàng và chọn phương thức thanh toán trực tuyến qua **ZaloPay**, hệ thống sẽ hiển thị một mã QR Code thanh toán tương thích cùng thông tin số tiền.
-   Bạn chỉ cần mở ứng dụng ví điện tử ZaloPay hoặc ứng dụng chat Zalo lên, quét mã QR này và xác nhận thanh toán. Ngay khi giao dịch hoàn tất trên ứng dụng điện thoại, ZaloPay sẽ tự động gửi webhook thông báo về server Retech. Trạng thái đơn hàng của bạn sẽ được cập nhật sang **"Đã thanh toán" (PAID)** ngay lập tức mà không cần nhân viên xác nhận thủ công.

---

### ❓ Câu hỏi 5: Tôi muốn gửi yêu cầu hoàn tiền (Refund) thì phải làm thế nào?
-   **Trả lời**: Bạn có quyền yêu cầu hoàn trả sản phẩm lỗi trong vòng **30 ngày** kể từ ngày nhận hàng.
-   Để gửi yêu cầu trực tuyến:
    1.  Đăng nhập vào tài khoản cá nhân, truy cập mục **Đơn hàng của tôi**.
    2.  Tìm đúng đơn hàng lỗi và nhấn **"Yêu cầu hoàn trả (Refund)"**.
    3.  Nhập lý do chi tiết, thông tin tài khoản ngân hàng nhận tiền hoàn, và chụp ảnh/quay video chứng minh lỗi của máy tải lên hệ thống.
    4.  Nhấn nút **"Gửi yêu cầu"**. Đơn hàng hoàn sẽ được tạo ở trạng thái Chờ xử lý (`PENDING`) để admin xem xét duyệt.

---

### ❓ Câu hỏi 6: Thủ tục hoàn tiền của ZaloPay mất bao lâu tôi nhận được tiền?
-   **Trả lời**: 
    -   Đối với các đơn hàng ban đầu được thanh toán bằng nguồn tiền từ ví ZaloPay hoặc tài khoản ngân hàng liên kết trực tiếp, hệ thống của Retech sẽ gọi API **ZaloPay Refund** tự động khi yêu cầu hoàn trả của bạn được kỹ thuật viên phê duyệt. Tiền sẽ được hoàn trả về ví hoặc thẻ ngân hàng của bạn trong vòng **1 - 3 ngày làm việc** tùy thuộc vào quy trình xử lý của từng ngân hàng.
    -   Đối với đơn hàng COD hoặc chuyển khoản trực tiếp, kế toán Retech sẽ chuyển khoản thẳng vào tài khoản ngân hàng của bạn trong vòng **24 giờ làm việc**.
