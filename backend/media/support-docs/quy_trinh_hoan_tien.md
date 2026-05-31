# Chính sách và Quy trình Yêu cầu Hoàn trả - Hoàn tiền từ A-Z tại Retech Market

Tại Retech Market, chúng tôi luôn cam kết mang lại sự an tâm tuyệt đối cho khách hàng khi mua sắm các thiết bị công nghệ cũ. Nếu sản phẩm bạn nhận được gặp lỗi phần cứng phát sinh từ nhà sản xuất hoặc không đúng mô tả, chính sách đổi trả và hoàn tiền của chúng tôi sẵn sàng bảo vệ quyền lợi của bạn.

---

### 1. Điều kiện áp dụng Đổi trả - Hoàn tiền
Yêu cầu hoàn trả của quý khách được chấp nhận khi thỏa mãn đầy đủ các điều kiện sau:
- **Thời hạn yêu cầu**: Trong vòng **30 ngày** kể từ ngày quý khách ký nhận đơn hàng từ shipper.
- **Trường hợp áp dụng**:
  - Sản phẩm bị lỗi phần cứng phần cứng nghiêm trọng từ phía nhà sản xuất (lỗi nguồn, lỗi màn hình, hỏng camera, lỗi mainboard...).
  - Sản phẩm nhận được không đúng với mô tả trên website (sai thương hiệu, sai dung lượng bộ nhớ, RAM, màu sắc hoặc ngoại hình hao mòn tệ hơn nhiều so với Grade đã cam kết).
  - Thiết bị bị hư hại, nứt vỡ do lỗi vận chuyển của bên thứ ba trước khi giao tới tay khách hàng.
- **Tình trạng sản phẩm trả về**:
  - Sản phẩm phải còn nguyên tem bảo hành của Retech Market, không bị tháo gỡ hoặc tự ý sửa chữa.
  - Máy không bị vào nước, chập cháy nguồn do dùng sai điện áp, hoặc rơi vỡ móp méo thêm trong quá trình quý khách sử dụng.
  - Phải đi kèm đầy đủ phụ kiện và quà tặng (nếu có) được gửi cùng lúc mua máy.

---

### 2. Quy trình Yêu cầu Hoàn trả từ A-Z

#### Bước 1: Gửi yêu cầu hoàn trả trực tuyến
- Đăng nhập vào tài khoản Retech Market của bạn.
- Vào trang cá nhân và di chuyển đến mục [Đơn hàng của tôi (API: /api/orders/)](http://localhost:5173/user/orders).
- Tìm đúng đơn hàng muốn hoàn trả và nhấn nút **"Yêu cầu hoàn trả (Refund)"** để được dẫn đến [Trang Yêu cầu Hoàn trả (API: /api/orders/refunds/)](http://localhost:5173/orders/refunds).
- Điền đầy đủ các thông tin:
  - **Lý do hoàn trả**: Chọn lý do thích hợp (Lỗi kỹ thuật, sai mô tả, v.v.) và viết mô tả cụ thể lỗi gặp phải.
  - **Thông tin nhận tiền**: Nhập số tài khoản ngân hàng nhận tiền hoàn.
  - **Tải lên bằng chứng**: Chụp ảnh hoặc tải lên video quay lại lỗi của máy (ví dụ: màn hình sọc, camera không lên) làm căn cứ đối chiếu.
  - Nhấn nút **"Gửi yêu cầu"**.

#### Bước 2: Tiếp nhận và Duyệt sơ bộ (Backend Admin)
- Đơn hoàn tiền của bạn sẽ được tạo ở trạng thái **Chờ xử lý (PENDING)**.
- Đội ngũ chăm sóc khách hàng của Retech sẽ tiến hành kiểm tra lý do và bằng chứng hình ảnh trong vòng 24 giờ làm việc.
- Nếu lý do hợp lệ, yêu cầu của bạn sẽ được duyệt sơ bộ và chuyển sang trạng thái **Đã duyệt (APPROVED)**. Bạn sẽ nhận được email hướng dẫn gửi hàng.

#### Bước 3: Đóng gói và gửi hàng về trung tâm bảo hành
- Đóng gói sản phẩm cẩn thận bằng hộp giấy chống sốc và dán kín để tránh hư hại thêm trong quá trình vận chuyển.
- Gửi máy về địa chỉ trung tâm bảo hành của Retech Market theo thông tin trong email hướng dẫn.
- Chụp ảnh hóa đơn gửi hàng hoặc mã vận đơn gửi cho bộ phận hỗ trợ khách hàng của Retech qua hotline **1900-8888** hoặc chatbot để chúng tôi theo dõi.

#### Bước 4: Kiểm tra kỹ thuật thực tế (Đồng kiểm)
- Khi nhận được sản phẩm gửi về, kỹ thuật viên Retech sẽ tiến hành mở hộp đồng kiểm ghi hình và kiểm tra lỗi thực tế của máy.
- Thời gian kiểm định kỹ thuật từ 24 - 48 giờ làm việc kể từ lúc nhận được hàng.
- Nếu tình trạng đúng lỗi như quý khách khai báo, cửa hàng tiến hành chốt thủ tục giải ngân tiền hoàn trả.

#### Bước 5: Thực hiện hoàn tiền cho khách hàng
Tiền hoàn lại sẽ được gửi về cho bạn dựa trên phương thức thanh toán ban đầu:
- **Nếu thanh toán qua ZaloPay (API: /api/payments/refund/)**: Hệ thống gọi API ZaloPay Refund để hoàn tiền trực tiếp vào tài khoản ví ZaloPay hoặc tài khoản ngân hàng liên kết của bạn. Tiền về tài khoản ngay lập tức hoặc trong 1-3 ngày làm việc tùy chính sách ngân hàng.
- **Nếu thanh toán qua COD / Chuyển khoản ngân hàng**: Kế toán Retech tiến hành chuyển khoản trực tiếp số tiền hoàn trả vào tài khoản ngân hàng bạn đã cung cấp khi tạo yêu cầu.
- **Quy đổi kho hàng**: Sản phẩm lỗi sau khi hoàn trả sẽ được cập nhật trạng thái `Đã trả về` (`RETURNED`) và đưa vào danh sách kiểm kho kỹ thuật.
- Khi hoàn tiền thành công, trạng thái yêu cầu hoàn trả chuyển sang **Hoàn thành (COMPLETED)** và bạn sẽ nhận được thông báo biên nhận.
