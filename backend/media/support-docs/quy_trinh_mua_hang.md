# Hướng dẫn chi tiết Quy trình mua sản phẩm từ A-Z tại Retech Market

Chào mừng bạn đến với Retech Market! Dưới đây là hướng dẫn chi tiết từng bước giúp bạn dễ dàng tìm kiếm, lựa chọn và hoàn tất đơn hàng mua sắm các thiết bị công nghệ (như iPhone, iPad, Laptop) chất lượng cao tại cửa hàng trực tuyến của chúng tôi.

---

### Bước 1: Tìm kiếm và Lọc sản phẩm phù hợp
- Truy cập vào [Trang danh sách sản phẩm (API: /api/products/)](http://localhost:5173/products).
- Sử dụng thanh tìm kiếm để gõ tên sản phẩm mong muốn (ví dụ: "iPhone 13 Pro Max", "MacBook Air M1").
- Sử dụng bộ lọc thông minh ở thanh bên (Sidebar Filters) để thu hẹp phạm vi tìm kiếm theo:
  - **Thương hiệu**: Apple, Samsung, Dell, Asus...
  - **Danh mục**: Điện thoại (Smartphones), Máy tính xách tay (Laptops), Máy tính bảng (Tablets)...
  - **Dung lượng lưu trữ**: 128GB, 256GB, 512GB...
  - **RAM**: 8GB, 16GB...
  - **Phân loại ngoại hình (Grade)**:
    - **Grade A (Đẹp keng/Như mới)**: Máy đẹp không tì vết hoặc chỉ xước lông mèo cực nhẹ khó thấy.
    - **Grade B (Xước nhẹ)**: Có một vài vết xước nhỏ ở viền hoặc mặt lưng, không cấn móp sâu.
    - **Grade C (Hao mòn nhiều)**: Máy có vết cấn hoặc xước sâu rõ ràng nhưng chức năng hoàn hảo 100%, giá cực kỳ tiết kiệm.

### Bước 2: Xem chi tiết sản phẩm và Kiểm tra chất lượng
- Nhấn vào sản phẩm bạn quan tâm để xem trang chi tiết.
- Kiểm tra các thông số kỹ thuật thực tế (RAM, bộ nhớ, tình trạng pin, thời gian bảo hành).
- Xem kỹ **Báo cáo tình trạng (Condition Report)**: Đây là báo cáo kiểm định chất lượng nghiêm ngặt của Retech, thể hiện rõ các linh kiện đã được kiểm tra (màn hình, camera, loa, nút bấm...) đảm bảo máy nguyên bản, hoạt động mượt mà.
- Xem hình ảnh thực tế đa góc độ của máy do đội ngũ kỹ thuật tự chụp (không dùng ảnh hãng quảng cáo).

### Bước 3: Thêm vào giỏ hàng hoặc Mua ngay
- Chọn các tùy chọn có sẵn (nếu có) và nhấn nút **"Thêm vào giỏ hàng"** để tiếp tục mua thêm sản phẩm khác, hoặc nhấn **"Mua ngay"** để chuyển thẳng tới trang đặt hàng.
- Một thông báo nhỏ sẽ xuất hiện xác nhận bạn đã thêm sản phẩm vào giỏ hàng thành công.

### Bước 4: Kiểm tra giỏ hàng
- Nhấp vào biểu tượng giỏ hàng ở thanh tiêu đề (Header) để mở [Trang Giỏ hàng](http://localhost:5173/cart).
- Kiểm tra lại danh sách sản phẩm, số lượng và tổng số tiền tạm tính.
- Nhấn nút **"Tiến hành thanh toán"** để bắt đầu quy trình đặt hàng chính thức tại [Trang Thanh toán (API: /api/payments/)](http://localhost:5173/checkout).

### Bước 5: Điền thông tin giao hàng
- Tại trang Thanh toán (Checkout), nhập đầy đủ và chính xác các thông tin bao gồm:
  - **Họ và tên người nhận**.
  - **Số điện thoại liên hệ** (bắt buộc phải chính xác để shipper gọi giao hàng).
  - **Địa chỉ nhận hàng chi tiết** (Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố).

### Bước 6: Lựa chọn phương thức thanh toán
Retech Market hỗ trợ đa dạng phương thức thanh toán an toàn bảo mật:
1.  **Thanh toán khi nhận hàng (COD - Cash on Delivery)**: Khách hàng nhận máy, đồng kiểm cùng nhân viên giao hàng và thanh toán bằng tiền mặt trực tiếp cho shipper.
2.  **Cổng thanh toán điện tử ZaloPay (API Webhook: /api/payments/zalopay-callback/)**: Hệ thống hiển thị mã QR ZaloPay. Bạn mở ứng dụng Zalo/ZaloPay quét mã QR để thanh toán tức thì. Đơn hàng sẽ được chuyển sang trạng thái "Đã thanh toán" tự động.
3.  **Chuyển khoản ngân hàng trực tiếp**: Bạn chuyển khoản theo thông tin số tài khoản của cửa hàng hiển thị trên màn hình với nội dung chuyển khoản là mã đơn hàng.
4.  **Cổng thanh toán quốc tế PayPal / Thẻ tín dụng**: Dành cho khách hàng sử dụng thẻ Visa/MasterCard.

### Bước 7: Xác nhận đơn hàng và Theo dõi vận chuyển
- Nhấn nút **"Đặt hàng"** để hoàn tất giao dịch.
- Sau khi đặt hàng thành công, hệ thống gửi email xác nhận và tạo mã đơn hàng duy nhất (ví dụ: `#1024`).
- Bạn có thể vào mục [Đơn hàng của tôi (API: /api/orders/)](http://localhost:5173/user/orders) trong trang cá nhân để theo dõi trạng thái đơn hàng thời gian thực: `Chờ xử lý` -> `Đang xử lý` -> `Đang giao hàng` -> `Đã hoàn thành`.

### Bước 8: Nhận hàng và Đồng kiểm
- Khi đơn hàng được giao đến, quý khách có quyền mở hộp kiểm tra ngoại hình máy cùng nhân viên giao hàng (đồng kiểm) trước khi ký nhận.
- Nếu phát hiện hàng bị móp méo do vận chuyển hoặc không đúng dòng máy đã đặt, bạn có quyền từ chối nhận hàng và liên hệ ngay Hotline **1900-8888** để được gửi máy thay thế.
