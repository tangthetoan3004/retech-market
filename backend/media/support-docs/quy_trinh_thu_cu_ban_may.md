# Hướng dẫn quy trình Thu cũ - Bán máy điện thoại cũ trực tuyến từ A-Z tại Retech Market

Bạn đang sở hữu điện thoại cũ không dùng tới và muốn bán lại với giá cao, nhanh chóng và không mất thời gian tìm người mua? Dịch vụ **Thu cũ trực tuyến (Bán máy cũ)** của Retech Market là giải pháp tối ưu dành cho bạn. Dưới đây là hướng dẫn chi tiết quy trình từ A-Z.

---

### Bước 1: Truy cập tính năng Thu cũ
- Trên thanh điều hướng chính (Header) của website, nhấp chọn mục **"Thu cũ đổi mới"** hoặc truy cập trực tiếp vào [Trang Thu cũ đổi mới (API: /api/tradein/options/ và /api/tradein/estimate/)](http://localhost:5173/tradeins).
- Giao diện Multi-step Wizard hiện đại của chúng tôi sẽ hướng dẫn bạn qua từng bước định giá chi tiết.

### Bước 2: Nhập thông tin cấu hình thiết bị
- Chọn chính xác các thông tin cơ bản của điện thoại bạn muốn bán:
  - **Thương hiệu**: Apple, Samsung, Xiaomi...
  - **Dòng máy (Model)**: iPhone 12 Pro, Galaxy S21 Ultra...
  - **Bộ nhớ trong (Storage)**: 128GB, 256GB...
  - **Dung lượng RAM** (nếu dòng máy hỗ trợ nhiều phiên bản RAM).

### Bước 3: Đánh giá tình trạng chức năng và ngoại hình
Bạn cần tự đánh giá trung thực các hạng mục sau (hệ thống sẽ dựa vào đây để đưa ra báo giá ước tính):
1.  **Tình trạng chức năng**: Tích chọn xem máy có gặp lỗi nào hay không (Ví dụ: Lỗi FaceID/TouchID, hỏng camera, loa rè, màn hình chảy mực, lỗi sóng...).
2.  **Tình trạng ngoại hình**: Chọn 1 trong 4 mức độ:
    - **Đẹp xuất sắc (Grade A)**: Máy như mới, không trầy xước hoặc xước lông mèo cực nhẹ ở viền/lưng.
    - **Trầy xước nhẹ (Grade B)**: Máy có vài vết xước nhỏ quanh viền hoặc màn hình, không cấn móp sâu.
    - **Cấn móp nhiều (Grade C)**: Có các vết cấn móp rõ ràng ở góc hoặc xước sâu do va chạm vật lý.
    - **Bể vỡ / Hỏng nát (Grade D)**: Mặt kính trước hoặc sau bị nứt vỡ, khung sườn móp méo nghiêm trọng.

### Bước 4: Tải ảnh thật của máy để AI phân tích
- Chụp ảnh mặt trước của điện thoại (bật màn hình sáng) và tải lên hệ thống.
- **Phân tích bằng Trí tuệ nhân tạo (AI - API: /api/ai/predict-damage/)**:
  - Hệ thống Computer Vision của Retech sẽ tự động phân tích vết trầy xước, nứt vỡ trên bề mặt kính để đưa ra điểm số đánh giá độ hao mòn khách quan.
  - Kết quả phân tích sẽ hiển thị ngay trên màn hình để bạn đối chiếu.
  *Lưu ý: Khách vãng lai chưa đăng nhập vẫn hoàn toàn được phép thực hiện đến bước này và nhấn nút **"Ước tính giá ngay"** để xem báo giá đề xuất.*

### Bước 5: Xem báo giá ước tính của AI
- Hệ thống tổng hợp cấu hình, tình trạng chức năng và kết quả phân tích hình ảnh từ AI để hiển thị **Mức giá thu mua ước tính**.
- Mức giá này cực kỳ cạnh tranh và phản ánh đúng giá trị thị trường của thiết bị.

### Bước 6: Xác nhận tạo yêu cầu thu cũ (Đăng nhập)
- Nếu bạn đồng ý với mức giá đề xuất và nhấn nút **"Xác nhận tạo đơn"**:
  - **Đối với khách vãng lai (Chưa đăng nhập)**: Hệ thống sẽ tự động đóng gói toàn bộ thông tin cấu hình máy và hình ảnh bạn vừa nhập lưu tạm vào bộ nhớ trình duyệt (`sessionStorage`). Sau đó, giao diện đăng nhập sẽ hiện ra. Khi bạn đăng nhập thành công, hệ thống tự động tải lại dữ liệu cũ, giúp bạn tiếp tục tạo đơn đặt tại [Form Tạo đơn thu cũ (API: /api/tradein/)](http://localhost:5173/tradeins/form) mà không cần khai báo lại từ đầu.
- **Nhập thông tin nhận tiền**: Nhập thông tin tài khoản ngân hàng của bạn (Tên ngân hàng, Số tài khoản, Tên chủ tài khoản) để cửa hàng chuyển khoản thanh toán sau khi hoàn tất kiểm tra máy.

### Bước 7: Gửi thiết bị về Retech Market
Sau khi tạo đơn thu cũ thành công (mã đơn dạng `#TR-102`):
- **Lựa chọn 1**: Mang máy trực tiếp đến cửa hàng Retech Market gần nhất để kiểm định lấy tiền ngay sau 15 phút.
- **Lựa chọn 2**: Đóng gói máy cẩn thận và gửi chuyển phát nhanh về địa chỉ trung tâm thẩm định của Retech. (Retech hỗ trợ phí vận chuyển cho các đơn thu cũ trực tuyến).

### Bước 8: Thẩm định thực tế và Nhận tiền thanh toán
- Sau khi nhận được máy, kỹ thuật viên của Retech sẽ tiến hành kiểm định thực tế tình trạng chức năng và ngoại hình trong vòng 4-8 giờ làm việc:
  - **Trường hợp 1 (Máy đúng như khai báo)**: Đơn hàng được phê duyệt (`APPROVED`), hệ thống chuyển khoản 100% số tiền đã cam kết vào tài khoản ngân hàng của bạn trong vòng 24 giờ.
  - **Trường hợp 2 (Máy sai lệch tình trạng)**: Kỹ thuật viên sẽ liên hệ trực tiếp qua điện thoại giải thích và đề xuất mức giá thu mua mới. 
    - Nếu bạn **Đồng ý**: Cửa hàng cập nhật đơn và giải ngân ngay lập tức.
    - Nếu bạn **Từ chối**: Retech sẽ đóng gói máy cẩn thận và gửi trả lại thiết bị nguyên vẹn cho bạn qua đường bưu điện hoàn toàn miễn phí.
