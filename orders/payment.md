# Thiết kế Payment tự động cho Order thường

> **Phiên bản:** v1  
> **Ngày:** 2026-03-01  
> **Mục tiêu:** Khi User checkout (tạo Order), Payment tự động được tạo. User có thể chọn thanh toán chuyển khoản ngay hoặc thanh toán khi nhận hàng (COD). Staff **không cần** tạo Payment thủ công cho đơn thường nữa.

---

## 1. Vấn đề hiện tại

| Hiện tại                                                                         | Vấn đề                                                      |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| User tạo Order → Order(PENDING)                                                  | Payment **chưa được tạo**                                   |
| Staff phải vào trang quản trị, gọi `POST /api/payments/` để tạo Payment thủ công | User **phải chờ** Staff tạo Payment rồi mới thanh toán được |
| Không có cách nào User thanh toán ngay lập tức khi checkout                      | Trải nghiệm kém, không giống e-commerce thực tế             |

---

## 2. Thiết kế mới — Tổng quan

```
User chọn sản phẩm → Vào giỏ hàng → Bấm "Thanh toán"
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │  Chọn Payment Method │
                              │                     │
                              │  ○ BANK_TRANSFER    │
                              │  ○ COD              │
                              └────────┬────────────┘
                                       │
                                       ▼
                         POST /api/orders/
                         { items: [...], payment_method: "COD" }
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  OrderService.create_order()          │
                    │  1. Tạo Order(PENDING)                │
                    │  2. Tạo Payment(PENDING) tự động      │
                    │     - type = ORDER                    │
                    │     - direction = INBOUND             │
                    │     - amount = order.total_amount     │
                    │     - method = <user chọn>            │
                    └──────────────────────────────────────┘
```

**Nguyên tắc:**

- Payment tự động tạo cùng lúc với Order (trong cùng transaction).
- Staff **không cần tạo Payment thủ công** cho Order thường nữa.
- Endpoint `POST /api/payments/` (Staff tạo thủ công) → **loại bỏ** cho loại ORDER. Giữ lại cho các trường hợp ngoại lệ nếu cần.

---

## 3. Payment Method mới: COD

Thêm lựa chọn `COD` (Cash on Delivery — Thanh toán khi nhận hàng) vào `Payment.PaymentMethod`.

| Method          | Mô tả                    | Ai trả                             | Thời điểm              |
| --------------- | ------------------------ | ---------------------------------- | ---------------------- |
| `BANK_TRANSFER` | Chuyển khoản ngân hàng   | User chuyển khoản                  | Ngay sau khi tạo Order |
| `COD`           | Thanh toán khi nhận hàng | User trả tiền mặt cho shipper      | Khi nhận hàng          |
| `CASH`          | Tiền mặt tại cửa hàng    | _(Dùng cho trade-in tại cửa hàng)_ | Tại cửa hàng           |

```python
class PaymentMethod(models.TextChoices):
    CASH            = "CASH",            "Tiền mặt"
    BANK_TRANSFER   = "BANK_TRANSFER",   "Chuyển khoản ngân hàng"
    COD             = "COD",             "Thanh toán khi nhận hàng"
```

> **Lưu ý:** Khi User tạo Order, chỉ cho phép chọn `BANK_TRANSFER` hoặc `COD`. `CASH` chỉ dùng cho trade-in.

---

## 4. Thay đổi API — Tạo Order

### API: `POST /api/orders/`

**Thêm field `payment_method`** vào request body khi tạo Order.

#### Request Body (mới)

```json
{
  "items": [{ "product_id": 10 }, { "product_id": 15 }],
  "payment_method": "COD"
}
```

| Field            | Type   | Required | Mô tả                          |
| ---------------- | ------ | -------- | ------------------------------ |
| `items`          | array  | ✅       | Danh sách sản phẩm             |
| `payment_method` | string | ✅       | `"BANK_TRANSFER"` hoặc `"COD"` |

#### Validation

- `payment_method` phải là `BANK_TRANSFER` hoặc `COD`.
- `CASH` **không được phép** cho Order thường (chỉ dùng trade-in).

#### Response — 201 Created

```json
{
  "status": "success",
  "code": 201,
  "message": "Success",
  "data": {
    "id": 8,
    "user_email": "user@example.com",
    "status": "PENDING",
    "status_display": "Pending",
    "total_amount": 47000000,
    "items": [
      {
        "id": 1,
        "product": 10,
        "product_name": "iPhone 15 Pro Max 256GB",
        "product_slug": "iphone-15-pro-max-256gb",
        "price_snapshot": 25000000
      },
      {
        "id": 2,
        "product": 15,
        "product_name": "Samsung Galaxy S24 Ultra",
        "product_slug": "samsung-galaxy-s24-ultra",
        "price_snapshot": 22000000
      }
    ],
    "payment": {
      "id": 10,
      "status": "PENDING",
      "payment_method": "COD",
      "amount": 47000000
    },
    "created_at": "2026-03-01T10:00:00+07:00",
    "updated_at": "2026-03-01T10:00:00+07:00"
  }
}
```

> **`payment` field**: Thêm nested payment info vào OrderReadSerializer để FE biết trạng thái thanh toán.

---

## 5. Luồng chi tiết — BANK_TRANSFER (Chuyển khoản)

```
Bước 1 — User checkout:
  POST /api/orders/
  { items: [{product_id: 10}], payment_method: "BANK_TRANSFER" }
  → Order(PENDING) + Payment(PENDING, method=BANK_TRANSFER) tự động tạo

Bước 2 — FE hiển thị thông tin chuyển khoản:
  FE nhận response có payment info → hiển thị:
  - Số tài khoản cửa hàng
  - Số tiền cần chuyển
  - Nội dung chuyển khoản: "RETECH <order_id>"
  - Hoặc QR code

Bước 3 — User chuyển khoản:
  User tự chuyển khoản qua app ngân hàng

Bước 4 — Staff xác nhận đã nhận tiền:
  POST /api/payments/{payment_id}/confirm/
  { payment_method: "BANK_TRANSFER", transaction_ref: "VCB-xxx" }
  → Payment: PENDING → COMPLETED
  → [Signal] Order: PENDING → PROCESSING (sẵn sàng xử lý)

Bước 5 — Staff xử lý đơn hàng:
  PATCH /api/orders/{id}/  { status: "SHIPPED" }
  → Order: PROCESSING → SHIPPED

Bước 6 — Giao hàng:
  PATCH /api/orders/{id}/  { status: "DELIVERED" }
  → Order: SHIPPED → DELIVERED ✅
```

### Timeout

- Nếu User không chuyển khoản sau **24 giờ**, Staff có thể đánh dấu Payment là `FAILED` → tự động huỷ Order + revert `is_sold` cho các Product.
- Hoặc Celery Beat task auto-fail các Payment BANK_TRANSFER quá hạn (tuỳ chọn, implement sau).

---

## 6. Luồng chi tiết — COD (Thanh toán khi nhận hàng)

```
Bước 1 — User checkout:
  POST /api/orders/
  { items: [{product_id: 10}], payment_method: "COD" }
  → Order(PENDING) + Payment(PENDING, method=COD) tự động tạo

Bước 2 — Staff xử lý đơn:
  PATCH /api/orders/{id}/  { status: "PROCESSING" }
  → Order: PENDING → PROCESSING

Bước 3 — Staff giao hàng:
  PATCH /api/orders/{id}/  { status: "SHIPPED" }
  → Order: PROCESSING → SHIPPED

Bước 4 — Shipper giao hàng, nhận tiền:
  POST /api/payments/{payment_id}/confirm/
  { payment_method: "COD" }
  → Payment: PENDING → COMPLETED

Bước 5 — [Signal tự động]:
  → Order: SHIPPED → DELIVERED ✅

  (Hoặc Staff PATCH order status = DELIVERED thủ công nếu đã giao)
```

---

## 7. Thay đổi Signal — `on_payment_completed`

Hiện tại signal cho `ORDER` type chỉ `pass`. Cần cập nhật:

| payment_type            | Hành động khi COMPLETED                               |
| ----------------------- | ----------------------------------------------------- |
| `ORDER` (BANK_TRANSFER) | Order: `PENDING → PROCESSING` (sẵn sàng đóng gói)     |
| `ORDER` (COD)           | Order: `SHIPPED → DELIVERED` (đã giao + nhận tiền)    |
| `TRADEIN_SELL_PAYOUT`   | TradeIn → COMPLETED _(không đổi)_                     |
| `TRADEIN_EXCHANGE`      | Order → DELIVERED + TradeIn → COMPLETED _(không đổi)_ |

```python
# payment/signals.py — on_payment_completed (cập nhật phần ORDER)

elif payment.payment_type == Payment.PaymentType.ORDER:
    order = payment.order
    if payment.payment_method == Payment.PaymentMethod.BANK_TRANSFER:
        # Đã nhận tiền chuyển khoản → chuyển sang xử lý đơn
        if order.status == Order.Status.PENDING:
            order.change_status(Order.Status.PROCESSING)
    elif payment.payment_method == Payment.PaymentMethod.COD:
        # Shipper giao hàng xong, nhận tiền → DELIVERED
        if order.status == Order.Status.SHIPPED:
            order.change_status(Order.Status.DELIVERED)
```

---

## 8. Thay đổi Order State Machine

Order hiện tại cho phép: `PENDING → DELIVERED` (dùng cho trade-in exchange). Cần thêm luồng mới:

```
                    ┌──────────────────────────────────────────────────┐
                    │             ORDER STATE MACHINE                  │
                    └──────────────────────────────────────────────────┘

                              ┌──────────┐
                    Tạo mới ──►  PENDING  │
                              └──┬──┬──┬─┘
                                 │  │  │
                    ┌────────────┘  │  └──────────┐
                    │              │               │
                    ▼              ▼               ▼
              ┌───────────┐ ┌───────────┐   ┌──────────┐
              │PROCESSING │ │ CANCELLED │   │DELIVERED │ ← (trade-in exchange)
              └─────┬─────┘ └───────────┘   └──────────┘
                    │
                    ▼
              ┌──────────┐
              │ SHIPPED  │
              └─────┬────┘
                    │
                    ▼
              ┌──────────┐
              │DELIVERED │
              └──────────┘
```

**Không thay đổi ALLOWED_TRANSITIONS** — giữ nguyên hiện tại vì đã hỗ trợ đủ:

```python
ALLOWED_TRANSITIONS = {
    PENDING:    [PROCESSING, CANCELLED, DELIVERED],  # ✅ đã có
    PROCESSING: [SHIPPED, CANCELLED],
    SHIPPED:    [DELIVERED],
    DELIVERED:  [],
    CANCELLED:  [],
    RETURNED:   [],
}
```

---

## 9. Thay đổi khi Cancel Order

Khi user huỷ Order (`POST /api/orders/{id}/cancel/`):

- Nếu có Payment liên kết → tự động chuyển Payment sang `FAILED`.
- Revert `is_sold` cho các Product (đã có).

```python
# orders/services.py — cancel_order() cập nhật
@staticmethod
@transaction.atomic
def cancel_order(order: Order) -> Order:
    # ... (logic hiện tại) ...

    # Thêm: auto-fail Payment nếu đang PENDING
    from payment.models import Payment
    order.payments.filter(status=Payment.Status.PENDING).update(
        status=Payment.Status.FAILED
    )
```

---

## 10. Thay đổi khi Payment FAILED

Khi Staff đánh dấu Payment là FAILED (`POST /api/payments/{id}/fail/`):

- Nếu `payment_type == ORDER` → tự động huỷ Order + revert `is_sold`.

```python
# payment/signals.py — thêm hàm on_payment_failed

def on_payment_failed(payment: Payment) -> None:
    if payment.payment_type == Payment.PaymentType.ORDER:
        order = payment.order
        if order and order.status == Order.Status.PENDING:
            from orders.services import OrderService
            OrderService.cancel_order(order)
```

---

## 11. Loại bỏ endpoint tạo Payment thủ công cho Order

| Endpoint                                            | Thay đổi                                                       |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `POST /api/payments/` (Staff tạo Payment cho Order) | **Loại bỏ** — Payment ORDER được tạo tự động khi User checkout |
| `POST /api/payments/{id}/confirm/`                  | Giữ nguyên — Staff xác nhận thanh toán                         |
| `POST /api/payments/{id}/fail/`                     | Giữ nguyên + thêm auto-cancel Order                            |
| `POST /api/payments/{id}/refund/`                   | Giữ nguyên                                                     |
| `GET /api/payments/my/`                             | Giữ nguyên                                                     |
| `GET /api/payments/`                                | Giữ nguyên                                                     |
| `GET /api/payments/{id}/`                           | Giữ nguyên                                                     |

> **Lưu ý:** Nếu vẫn muốn giữ endpoint `POST /api/payments/` cho trường hợp ngoại lệ (Staff tự tạo Payment đặc biệt), có thể để ẩn hoặc restrict. Nhưng luồng chính sẽ là tự động.

---

## 12. Tổng hợp thay đổi cần implement

### Models

| File                | Thay đổi                                                           |
| ------------------- | ------------------------------------------------------------------ |
| `payment/models.py` | Thêm `COD = "COD", "Thanh toán khi nhận hàng"` vào `PaymentMethod` |

### Serializers

| File                    | Thay đổi                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `orders/serializers.py` | `OrderCreateSerializer` thêm field `payment_method` (choices: BANK_TRANSFER, COD)      |
| `orders/serializers.py` | `OrderReadSerializer` thêm nested `payment` field (id, status, payment_method, amount) |

### Services

| File                  | Thay đổi                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `orders/services.py`  | `create_order()` nhận thêm param `payment_method`, tự động tạo Payment sau khi tạo Order |
| `orders/services.py`  | `cancel_order()` thêm logic auto-fail Payment PENDING                                    |
| `payment/services.py` | Loại bỏ (hoặc deprecate) `create_order_payment()` — không còn gọi từ view                |

### Signals

| File                 | Thay đổi                                                                               |
| -------------------- | -------------------------------------------------------------------------------------- |
| `payment/signals.py` | `on_payment_completed()` xử lý ORDER type: BANK_TRANSFER → PROCESSING, COD → DELIVERED |
| `payment/signals.py` | Thêm `on_payment_failed()` → auto-cancel Order nếu PENDING                             |

### Views

| File               | Thay đổi                                                             |
| ------------------ | -------------------------------------------------------------------- |
| `orders/views.py`  | `create()` truyền `payment_method` vào `OrderService.create_order()` |
| `payment/views.py` | Loại bỏ / restrict `create()` cho ORDER type                         |

---

## 13. FLOW Tổng hợp

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LUỒNG BANK_TRANSFER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User checkout                Staff confirm          Staff ship     │
│  ────────────                ──────────────          ──────────     │
│  POST /orders/               POST /payments/         PATCH /orders/ │
│  {payment_method:            {id}/confirm/           {status:       │
│   "BANK_TRANSFER"}                                    "SHIPPED"}    │
│       │                          │                       │          │
│       ▼                          ▼                       ▼          │
│  Order: PENDING ──────────► PROCESSING ──────────► SHIPPED          │
│  Payment: PENDING ────────► COMPLETED                    │          │
│                                                          │          │
│                                              PATCH /orders/         │
│                                              {status: "DELIVERED"}  │
│                                                          │          │
│                                                          ▼          │
│                                                     DELIVERED ✅    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         LUỒNG COD                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User checkout          Staff process & ship      Shipper confirm   │
│  ────────────          ─────────────────────     ────────────────   │
│  POST /orders/         PATCH /orders/             POST /payments/   │
│  {payment_method:      {status:"PROCESSING"}      {id}/confirm/    │
│   "COD"}               {status:"SHIPPED"}                           │
│       │                     │    │                      │           │
│       ▼                     ▼    ▼                      ▼           │
│  Order: PENDING ──► PROCESSING ──► SHIPPED         DELIVERED ✅     │
│  Payment: PENDING ─────────────────────────────► COMPLETED          │
│                                                 (signal → DELIVERED)│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       LUỒNG HUỶ ĐƠN                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User hoặc Staff huỷ:                                               │
│  POST /orders/{id}/cancel/                                          │
│       │                                                             │
│       ▼                                                             │
│  Order: PENDING → CANCELLED                                         │
│  Payment: PENDING → FAILED (tự động)                                │
│  Products: is_sold → False (revert)                                 │
│                                                                     │
│  ─────────────────────────────────────                              │
│  Staff fail payment (BANK_TRANSFER quá hạn):                        │
│  POST /api/payments/{id}/fail/                                      │
│       │                                                             │
│       ▼                                                             │
│  Payment: PENDING → FAILED                                          │
│  Order: PENDING → CANCELLED (tự động)                               │
│  Products: is_sold → False (revert)                                 │
└─────────────────────────────────────────────────────────────────────┘
```
