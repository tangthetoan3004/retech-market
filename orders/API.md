# Orders API Documentation

> **Base URL:** `http://localhost:8000/api/orders/`
>
> **Authentication:** Cookie-based JWT (`access_token` cookie). Tất cả API yêu cầu đăng nhập.
>
> **Response wrapper:** Mọi response thành công: `{ status, code, message, data }`. Response lỗi: `{ status, code, message, errors }`.
>
> **Ghi chú:** Payment cho Order được **tạo tự động** khi User checkout. Không phải Staff tạo thủ công.

---

## Mục lục

1. [Tạo đơn hàng — Create](#1-tạo-đơn-hàng--create)
2. [Danh sách đơn hàng — List](#2-danh-sách-đơn-hàng--list)
3. [Chi tiết đơn hàng — Detail](#3-chi-tiết-đơn-hàng--detail)
4. [Cập nhật trạng thái — Update Status (Staff)](#4-cập-nhật-trạng-thái--update-status-staff)
5. [Hủy đơn hàng — Cancel](#5-hủy-đơn-hàng--cancel)
6. [Tạo yêu cầu hoàn tiền — Create Refund](#6-tạo-yêu-cầu-hoàn-tiền--create-refund)
7. [Danh sách hoàn tiền — List Refunds](#7-danh-sách-hoàn-tiền--list-refunds)
8. [Duyệt hoàn tiền — Approve Refund (Staff)](#8-duyệt-hoàn-tiền--approve-refund-staff)
9. [Từ chối hoàn tiền — Reject Refund (Staff)](#9-từ-chối-hoàn-tiền--reject-refund-staff)
10. [State Machine & FLOW](#10-state-machine--flow)

---

### Tổng hợp Endpoint

| #   | Method  | URL                          | Quyền      | Mô tả               |
| --- | ------- | ---------------------------- | ---------- | ------------------- |
| 1   | `POST`  | `/api/orders/`               | User       | Tạo đơn hàng mới    |
| 2   | `GET`   | `/api/orders/`               | User       | Danh sách đơn hàng  |
| 3   | `GET`   | `/api/orders/{id}/`          | User/Staff | Chi tiết đơn hàng   |
| 4   | `PATCH` | `/api/orders/{id}/`          | Staff      | Cập nhật trạng thái |
| 5   | `POST`  | `/api/orders/{id}/cancel/`   | User/Staff | Hủy đơn hàng        |
| 6   | `POST`  | `/api/refunds/`              | User       | Yêu cầu hoàn tiền   |
| 7   | `GET`   | `/api/refunds/`              | User/Staff | Danh sách hoàn tiền |
| 8   | `POST`  | `/api/refunds/{id}/approve/` | Staff      | Duyệt hoàn tiền     |
| 9   | `POST`  | `/api/refunds/{id}/reject/`  | Staff      | Từ chối hoàn tiền   |

---

## 1. Tạo đơn hàng — Create

User chọn sản phẩm, thanh toán. Payment **tự động** tạo cùng Order.

|                  |                                     |
| ---------------- | ----------------------------------- |
| **Method**       | `POST`                              |
| **URL**          | `/api/orders/`                      |
| **Quyền**        | User đã đăng nhập (IsAuthenticated) |
| **Content-Type** | `application/json`                  |

### Headers

```
Cookie: access_token=<jwt_token>
Content-Type: application/json
```

### Body

| Field                | Type    | Required | Mô tả                          |
| -------------------- | ------- | -------- | ------------------------------ |
| `items`              | array   | ✅       | Danh sách sản phẩm             |
| `items[].product_id` | integer | ✅       | ID sản phẩm                    |
| `payment_method`     | string  | ✅       | `"BANK_TRANSFER"` hoặc `"COD"` |

### Ví dụ Request

```json
{
  "items": [{ "product_id": 10 }, { "product_id": 15 }],
  "payment_method": "BANK_TRANSFER"
}
```

### Response — 201 Created

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
    "total_amount": "47000000",
    "items": [
      {
        "id": 1,
        "product": 10,
        "product_name": "iPhone 15 Pro Max 256GB",
        "product_slug": "iphone-15-pro-max-256gb",
        "price_snapshot": "25000000"
      },
      {
        "id": 2,
        "product": 15,
        "product_name": "Samsung Galaxy S24 Ultra",
        "product_slug": "samsung-galaxy-s24-ultra",
        "price_snapshot": "22000000"
      }
    ],
    "payment": {
      "id": 10,
      "status": "PENDING",
      "payment_method": "BANK_TRANSFER",
      "amount": "47000000"
    },
    "created_at": "2026-03-01T10:00:00+07:00",
    "updated_at": "2026-03-01T10:00:00+07:00"
  }
}
```

### Auto-created Payment

| Field            | Giá trị                                 |
| ---------------- | --------------------------------------- |
| `payment_type`   | `ORDER`                                 |
| `payment_method` | Từ request (`BANK_TRANSFER` hoặc `COD`) |
| `direction`      | `INBOUND`                               |
| `status`         | `PENDING`                               |
| `amount`         | `order.total_amount`                    |

### Lỗi có thể xảy ra

| Code | Trường hợp                                          |
| ---- | --------------------------------------------------- |
| 400  | Danh sách items trống hoặc bị trùng lặp             |
| 400  | Sản phẩm không khả dụng (đã bán hoặc không tồn tại) |
| 400  | `payment_method` không hợp lệ                       |
| 401  | Chưa đăng nhập                                      |

```json
{
  "status": "error",
  "code": 400,
  "message": "Một hoặc nhiều sản phẩm không khả dụng (đã bán hoặc không tồn tại). ID không hợp lệ: [99]",
  "errors": {}
}
```

---

## 2. Danh sách đơn hàng — List

User xem đơn hàng của mình, Staff xem tất cả.

|            |                   |
| ---------- | ----------------- |
| **Method** | `GET`             |
| **URL**    | `/api/orders/`    |
| **Quyền**  | User đã đăng nhập |

### Headers

```
Cookie: access_token=<jwt_token>
```

### Query Params

| Param   | Type    | Mô tả                          |
| ------- | ------- | ------------------------------ |
| `page`  | integer | Số trang (default: 1)          |
| `limit` | integer | Items trên trang (default: 10) |

### Ví dụ Request

```
GET /api/orders/?page=1
```

### Response — 200 OK

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "count": 5,
    "next": "http://localhost:8000/api/orders/?page=2",
    "previous": null,
    "results": [
      {
        "id": 8,
        "user_email": "user@example.com",
        "status": "PROCESSING",
        "status_display": "Processing",
        "total_amount": "47000000",
        "items": [
          {
            "id": 1,
            "product": 10,
            "product_name": "iPhone 15 Pro Max 256GB",
            "product_slug": "iphone-15-pro-max-256gb",
            "price_snapshot": "25000000"
          }
        ],
        "payment": {
          "id": 10,
          "status": "COMPLETED",
          "payment_method": "BANK_TRANSFER",
          "amount": "47000000"
        },
        "created_at": "2026-03-01T10:00:00+07:00",
        "updated_at": "2026-03-01T12:00:00+07:00"
      }
    ]
  }
}
```

### Lỗi có thể xảy ra

| Code | Trường hợp     |
| ---- | -------------- |
| 401  | Chưa đăng nhập |

---

## 3. Chi tiết đơn hàng — Detail

|            |                     |
| ---------- | ------------------- |
| **Method** | `GET`               |
| **URL**    | `/api/orders/{id}/` |
| **Quyền**  | Owner hoặc Staff    |

### Headers

```
Cookie: access_token=<jwt_token>
```

### Ví dụ Request

```
GET /api/orders/8/
```

### Response — 200 OK

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "id": 8,
    "user_email": "user@example.com",
    "status": "DELIVERED",
    "status_display": "Delivered",
    "total_amount": "47000000",
    "items": [
      {
        "id": 1,
        "product": 10,
        "product_name": "iPhone 15 Pro Max 256GB",
        "product_slug": "iphone-15-pro-max-256gb",
        "price_snapshot": "25000000"
      },
      {
        "id": 2,
        "product": 15,
        "product_name": "Samsung Galaxy S24 Ultra",
        "product_slug": "samsung-galaxy-s24-ultra",
        "price_snapshot": "22000000"
      }
    ],
    "payment": {
      "id": 10,
      "status": "COMPLETED",
      "payment_method": "BANK_TRANSFER",
      "amount": "47000000"
    },
    "created_at": "2026-03-01T10:00:00+07:00",
    "updated_at": "2026-03-05T16:30:00+07:00"
  }
}
```

### Lỗi có thể xảy ra

| Code | Trường hợp                                  |
| ---- | ------------------------------------------- |
| 404  | Order không tồn tại hoặc không có quyền xem |
| 401  | Chưa đăng nhập                              |

---

## 4. Cập nhật trạng thái — Update Status (Staff)

Staff cập nhật trạng thái Order: PENDING → PROCESSING → SHIPPED → DELIVERED.

|                  |                              |
| ---------------- | ---------------------------- |
| **Method**       | `PATCH`                      |
| **URL**          | `/api/orders/{id}/`          |
| **Quyền**        | **Staff only** (IsAdminUser) |
| **Content-Type** | `application/json`           |

### Headers

```
Cookie: access_token=<jwt_token>
Content-Type: application/json
```

### Body

| Field    | Type   | Required | Mô tả                                      |
| -------- | ------ | -------- | ------------------------------------------ |
| `status` | string | ✅       | `"PROCESSING"`, `"SHIPPED"`, `"DELIVERED"` |

### Ví dụ Request — Chuyển sang PROCESSING

```json
{
  "status": "PROCESSING"
}
```

### Response — 200 OK

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "id": 8,
    "user_email": "user@example.com",
    "status": "PROCESSING",
    "status_display": "Processing",
    "total_amount": "47000000",
    "items": [...],
    "payment": {
      "id": 10,
      "status": "COMPLETED",
      "payment_method": "BANK_TRANSFER",
      "amount": "47000000"
    },
    "created_at": "2026-03-01T10:00:00+07:00",
    "updated_at": "2026-03-01T14:30:00+07:00"
  }
}
```

### Allowed Transitions

| Từ           | → Việt để chuyển sang                  |
| ------------ | -------------------------------------- |
| `PENDING`    | `PROCESSING`, `CANCELLED`, `DELIVERED` |
| `PROCESSING` | `SHIPPED`, `CANCELLED`                 |
| `SHIPPED`    | `DELIVERED`                            |
| `DELIVERED`  | _(terminal)_                           |
| `CANCELLED`  | _(terminal)_                           |

### Lỗi có thể xảy ra

| Code | Trường hợp                |
| ---- | ------------------------- |
| 400  | Transition không cho phép |
| 403  | Không phải Staff          |
| 404  | Order không tồn tại       |
| 401  | Chưa đăng nhập            |

```json
{
  "status": "error",
  "code": 400,
  "message": "Không thể chuyển trạng thái từ 'DELIVERED' sang 'PROCESSING'. Các trạng thái được phép: Không có.",
  "errors": {}
}
```

---

## 5. Hủy đơn hàng — Cancel

User hủy đơn của mình (chỉ khi PENDING). Payment tự động fail → Products is_sold revert.

|            |                            |
| ---------- | -------------------------- |
| **Method** | `POST`                     |
| **URL**    | `/api/orders/{id}/cancel/` |
| **Quyền**  | Owner hoặc Staff           |

### Headers

```
Cookie: access_token=<jwt_token>
```

### Body

_(Không cần body)_

### Ví dụ Request

```
POST /api/orders/8/cancel/
```

### Response — 200 OK

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "status": "Đơn hàng đã được hủy thành công."
  }
}
```

### Auto-actions

| Thao tác                                                                   |
| -------------------------------------------------------------------------- |
| Order: PENDING → CANCELLED                                                 |
| Payment PENDING liên kết: → FAILED (QuerySet.update, không trigger signal) |
| Products: `is_sold` → `False` (revert)                                     |

### Lỗi có thể xảy ra

| Code | Trường hợp                                                        |
| ---- | ----------------------------------------------------------------- |
| 400  | Order không ở trạng thái PENDING hoặc đã giao (SHIPPED/DELIVERED) |
| 403  | Không phải owner và không phải Staff                              |
| 404  | Order không tồn tại                                               |
| 401  | Chưa đăng nhập                                                    |

```json
{
  "status": "error",
  "code": 400,
  "message": "Không thể hủy đơn hàng khi đã giao hoặc đang giao.",
  "errors": {}
}
```

---

## 6. Tạo yêu cầu hoàn tiền — Create Refund

User yêu cầu hoàn tiền đối với Order đã DELIVERED.

|                  |                    |
| ---------------- | ------------------ |
| **Method**       | `POST`             |
| **URL**          | `/api/refunds/`    |
| **Quyền**        | User đã đăng nhập  |
| **Content-Type** | `application/json` |

### Headers

```
Cookie: access_token=<jwt_token>
Content-Type: application/json
```

### Body

| Field           | Type    | Required | Mô tả                 |
| --------------- | ------- | -------- | --------------------- |
| `order_id`      | integer | ✅       | ID Order đã DELIVERED |
| `reason_refund` | string  | ❌       | Lý do hoàn tiền       |

### Ví dụ Request

```json
{
  "order_id": 8,
  "reason_refund": "Sản phẩm bị lỗi từ nhà sản xuất"
}
```

### Response — 201 Created

```json
{
  "status": "success",
  "code": 201,
  "message": "Success",
  "data": {
    "id": 3,
    "order_id": 8,
    "reason_refund": "Sản phẩm bị lỗi từ nhà sản xuất",
    "status": "PENDING",
    "total_refund_amount": "47000000",
    "reject_reason": null,
    "refund_items": [
      {
        "id": 1,
        "order_item": 1,
        "product_name": "iPhone 15 Pro Max 256GB",
        "price_snapshot": "25000000"
      },
      {
        "id": 2,
        "order_item": 2,
        "product_name": "Samsung Galaxy S24 Ultra",
        "price_snapshot": "22000000"
      }
    ],
    "created_at": "2026-03-10T10:00:00+07:00"
  }
}
```

### Auto-created

- `total_refund_amount` = `order.total_amount`
- `refund_items` tautomatically created từ `order.items`
- `status` = `PENDING` (chờ Staff duyệt)

### Lỗi có thể xảy ra

| Code | Trường hợp                                   |
| ---- | -------------------------------------------- |
| 400  | Order không ở trạng thái DELIVERED           |
| 400  | Order đã có yêu cầu hoàn tiền                |
| 404  | Order không tồn tại hoặc không phải của User |
| 401  | Chưa đăng nhập                               |

```json
{
  "status": "error",
  "code": 400,
  "message": "Chỉ đơn hàng đã giao thành công mới có thể yêu cầu trả hàng.",
  "errors": {}
}
```

---

## 7. Danh sách hoàn tiền — List Refunds

User xem hoàn tiền của mình, Staff xem tất cả.

|            |                   |
| ---------- | ----------------- |
| **Method** | `GET`             |
| **URL**    | `/api/refunds/`   |
| **Quyền**  | User đã đăng nhập |

### Headers

```
Cookie: access_token=<jwt_token>
```

### Ví dụ Request

```
GET /api/refunds/
```

### Response — 200 OK

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 3,
      "order_id": 8,
      "reason_refund": "Sản phẩm bị lỗi từ nhà sản xuất",
      "status": "PENDING",
      "total_refund_amount": "47000000",
      "reject_reason": null,
      "refund_items": [
        {
          "id": 1,
          "order_item": 1,
          "product_name": "iPhone 15 Pro Max 256GB",
          "price_snapshot": "25000000"
        }
      ],
      "created_at": "2026-03-10T10:00:00+07:00"
    }
  ]
}
```

---

## 8. Duyệt hoàn tiền — Approve Refund (Staff)

Staff duyệt yêu cầu hoàn tiền: PENDING → APPROVED. Order → RETURNED, Payment → REFUNDED, Products is_sold revert.

|            |                              |
| ---------- | ---------------------------- |
| **Method** | `POST`                       |
| **URL**    | `/api/refunds/{id}/approve/` |
| **Quyền**  | **Staff only** (IsAdminUser) |

### Headers

```
Cookie: access_token=<jwt_token>
```

### Body

_(Không cần body)_

### Ví dụ Request

```
POST /api/refunds/3/approve/
```

### Response — 200 OK

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "id": 3,
    "order_id": 8,
    "reason_refund": "Sản phẩm bị lỗi từ nhà sản xuất",
    "status": "APPROVED",
    "total_refund_amount": "47000000",
    "reject_reason": null,
    "refund_items": [...],
    "created_at": "2026-03-10T10:00:00+07:00"
  }
}
```

### Auto-actions

| Thao tác                                    |
| ------------------------------------------- |
| Refund: PENDING → APPROVED                  |
| Order: → RETURNED                           |
| Payment: COMPLETED → REFUNDED (nếu tồn tại) |
| Products: `is_sold` → `False` (revert)      |

### Lỗi có thể xảy ra

| Code | Trường hợp                        |
| ---- | --------------------------------- |
| 400  | Refund không ở trạng thái PENDING |
| 403  | Không phải Staff                  |
| 404  | Refund không tồn tại              |
| 401  | Chưa đăng nhập                    |

---

## 9. Từ chối hoàn tiền — Reject Refund (Staff)

Staff từ chối yêu cầu hoàn tiền với lý do cụ thể.

|                  |                              |
| ---------------- | ---------------------------- |
| **Method**       | `POST`                       |
| **URL**          | `/api/refunds/{id}/reject/`  |
| **Quyền**        | **Staff only** (IsAdminUser) |
| **Content-Type** | `application/json`           |

### Headers

```
Cookie: access_token=<jwt_token>
Content-Type: application/json
```

### Body

| Field           | Type   | Required | Mô tả         |
| --------------- | ------ | -------- | ------------- |
| `reject_reason` | string | ✅       | Lý do từ chối |

### Ví dụ Request

```json
{
  "reject_reason": "Đơn hàng nằm ngoài thời gian yêu cầu hoàn tiền (30 ngày)"
}
```

### Response — 200 OK

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "id": 3,
    "order_id": 8,
    "reason_refund": "Sản phẩm bị lỗi từ nhà sản xuất",
    "status": "REJECTED",
    "total_refund_amount": "47000000",
    "reject_reason": "Đơn hàng nằm ngoài thời gian yêu cầu hoàn tiền (30 ngày)",
    "refund_items": [...],
    "created_at": "2026-03-10T10:00:00+07:00"
  }
}
```

### Lỗi có thể xảy ra

| Code | Trường hợp                        |
| ---- | --------------------------------- |
| 400  | Refund không ở trạng thái PENDING |
| 403  | Không phải Staff                  |
| 404  | Refund không tồn tại              |
| 401  | Chưa đăng nhập                    |

---

## 10. State Machine & FLOW

### Order State Machine

```
        ┌───────────┐
        │ POST /    │ (User checkout + Payment tự tạo)
        └─────┬─────┘
              │
              ▼
        ┌───────────┐
    ┌──►│ PENDING   │◄──┐
    │   └─────┬─────┘   │ (User cancel)
    │         │         │ (Payment fail → signal cancel)
    │         │         │
    │    ┌────┴────────────────┐
    │    │   (Staff update)     │
    │    ▼                      │
    │ ┌──────────┐  ┌────────┐  │
    │ │PROCESSING├─►│ SHIPPED├──┤
    │ └──────────┘  └───┬────┘  │
    │                   │       │
    │                   ▼       │
    │              ┌──────────┐ │
    │              │DELIVERED │ │
    │              └──────────┘ │
    │                           │
    └───────────────────────────┘
         ┌──────────────┐
         ▼              │
    ┌──────────┐        │
    │CANCELLED │◄───────┘
    └──────────┘
    (terminal)
```

### Refund State Machine

```
    ┌──────────┐
    │ POST /   │  (User requests)
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │ PENDING  │
    └────┬─────┘
         │
    ┌────┴─────────────┐
    │                  │
    ▼                  ▼
┌─────────┐      ┌──────────┐
│APPROVED │      │ REJECTED │
└─────────┘      └──────────┘
(terminal)       (terminal)
```

### ALLOWED_TRANSITIONS

| Entity     | Từ         | → Được phép                      |
| ---------- | ---------- | -------------------------------- |
| **Order**  | PENDING    | PROCESSING, CANCELLED, DELIVERED |
|            | PROCESSING | SHIPPED, CANCELLED               |
|            | SHIPPED    | DELIVERED                        |
|            | DELIVERED  | _(terminal)_                     |
|            | CANCELLED  | _(terminal)_                     |
| **Refund** | PENDING    | APPROVED, REJECTED               |
|            | APPROVED   | _(terminal)_                     |
|            | REJECTED   | _(terminal)_                     |

---

### Luồng 1 — BANK_TRANSFER (Chuyển khoản)

```
Bước 1 — User checkout:
  ► POST /api/orders/
    { items: [{product_id: 10}], payment_method: "BANK_TRANSFER" }
  ← Order(PENDING) + Payment(PENDING, method=BANK_TRANSFER) tự động tạo
  ← Response gồm payment info: id, status, amount

Bước 2 — FE hiển thị thông tin chuyển khoản:
  - Số tài khoản cửa hàng
  - Số tiền: 25,000,000 đ
  - Nội dung: "RETECH-ORDER-<order_id>"
  - QR code (tuỳ chọn)

Bước 3 — User chuyển khoản:
  User mở app ngân hàng → chuyển khoản qua link/QR

Bước 4 — Staff xác nhận tiền đã vào:
  ► POST /api/payments/{payment_id}/confirm/
    { payment_method: "BANK_TRANSFER", transaction_ref: "VCB-xxx" }
  ← Payment: PENDING → COMPLETED
  ← [Signal] Order: PENDING → PROCESSING (sẵn sàng xử lý)

Bước 5 — Staff chuẩn bị hàng:
  ► PATCH /api/orders/{id}/
    { status: "PROCESSING" }
  ← (Unchanged, chỉ để audit trail)

Bước 6 — Giao hàng:
  ► PATCH /api/orders/{id}/
    { status: "SHIPPED" }
  ← Order: PROCESSING → SHIPPED

Bước 7 — Shipper giao thành công:
  ► PATCH /api/orders/{id}/
    { status: "DELIVERED" }
  ← Order: SHIPPED → DELIVERED ✅

⏱️ Timeout (24 giờ):
  Nếu User không chuyển khoản sau 24 giờ:
  - Celery Beat auto-fail Payment
  - [Signal] Order → CANCELLED + revert is_sold
```

---

### Luồng 2 — COD (Thanh toán khi nhận hàng)

```
Bước 1 — User checkout:
  ► POST /api/orders/
    { items: [{product_id: 10}], payment_method: "COD" }
  ← Order(PENDING) + Payment(PENDING, method=COD) tự động tạo

Bước 2 — FE hiển thị:
  - "Bạn sẽ thanh toán 25,000,000 đ khi nhận hàng"
  - Có thể có option "Lấy lại từ nơi khác" nếu cần

Bước 3 — Staff xử lý đơn:
  ► PATCH /api/orders/{id}/
    { status: "PROCESSING" }
  ← Order: PENDING → PROCESSING

Bước 4 — Staff chuẩn bị giao:
  ► PATCH /api/orders/{id}/
    { status: "SHIPPED" }
  ← Order: PROCESSING → SHIPPED

Bước 5 — Shipper giao hàng, nhận tiền:
  Shipper nhận tiền mặt từ User

Bước 6 — Staff xác nhận thanh toán:
  ► POST /api/payments/{payment_id}/confirm/
    { payment_method: "COD" }
  ← Payment: PENDING → COMPLETED
  ← [Signal] Order: SHIPPED → DELIVERED ✅
```

---

### Luồng 3 — Hủy đơn hàng (2 chiều)

```
┌─────────────────────────────────────────────────┐
│ Chiều 1: User / Staff hủy Order                 │
│                                                 │
│ ► POST /api/orders/{id}/cancel/                 │
│ ← Order: PENDING → CANCELLED                    │
│ ← Payment PENDING: → FAILED (QuerySet.update)   │
│ ← Products: is_sold: True → False (revert)      │
├─────────────────────────────────────────────────┤
│ Chiều 2: Staff fail Payment (manual)             │
│ hoặc Celery auto-fail (BANK_TRANSFER 24h+)      │
│                                                 │
│ ► POST /api/payments/{id}/fail/                 │
│ ← Payment: PENDING → FAILED                     │
│ ← [Signal] Order: PENDING → CANCELLED (auto)    │
│ ← Products: is_sold: True → False (auto revert) │
└─────────────────────────────────────────────────┘
```

---

### Luồng 4 — Hoàn tiền

```
Bước 1 — Order đã DELIVERED, User muốn hoàn:
  ► POST /api/refunds/
    { order_id: 8, reason_refund: "Sản phẩm lỗi" }
  ← Refund(PENDING) + RefundItems tự tạo
  ← total_refund_amount = order.total_amount

Bước 2 — Staff review yêu cầu:
  (Có thể cần kiểm tra điều kiện: hạn trả, tình trạng sản phẩm)

Bước 3a — Staff DUYỆT hoàn tiền:
  ► POST /api/refunds/{id}/approve/
  ← Refund: PENDING → APPROVED
  ← Order: DELIVERED → RETURNED
  ← Payment: COMPLETED → REFUNDED
  ← Products: is_sold: True → False (revert) ✅
  → User nhận tiền

Bước 3b — HOẶC Staff TỪ CHỐI:
  ► POST /api/refunds/{id}/reject/
    { reject_reason: "Ngoài thời gian quy định" }
  ← Refund: PENDING → REJECTED
  → User được thông báo lý do
```

---

### Payment & Order Relationship

| Order.status | Payment.status | Ý nghĩa                                   |
| ------------ | -------------- | ----------------------------------------- |
| PENDING      | PENDING        | Chờ User thanh toán hoặc confirm          |
| PENDING      | COMPLETED      | User đã thanh toán, chờ Staff xử lý       |
| PROCESSING   | COMPLETED      | Staff đang xử lý, sẽ ship                 |
| SHIPPED      | COMPLETED      | Đang giao hàng                            |
| DELIVERED    | COMPLETED      | Giao thành công, xong                     |
| CANCELLED    | FAILED         | Đơn bị hủy, hoàn tiền (nếu COD chưa nhận) |
| RETURNED     | REFUNDED       | Hoàn hàng, hoàn tiền                      |

---

### Auto-cancel bởi Celery Beat

| Điều kiện                                                | Hành động                 | Khi nào |
| -------------------------------------------------------- | ------------------------- | ------- |
| Payment(ORDER, BANK_TRANSFER, PENDING, created_at < 24h) | Auto-fail Payment         | Mỗi giờ |
| → Trigger on_payment_failed() signal                     | Order PENDING → CANCELLED | Tự động |
| → Revert Products.is_sold                                | Khôi phục sản phẩm        | Tự động |

---

### Quyền hạn

| Action                          | Owner         | Staff       | Other User |
| ------------------------------- | ------------- | ----------- | ---------- |
| POST /api/orders/               | ✅            | ✅          | ❌         |
| GET /api/orders/                | ✅ (của mình) | ✅ (tất cả) | ❌         |
| GET /api/orders/{id}/           | ✅            | ✅          | ❌         |
| PATCH /api/orders/{id}/         | ❌            | ✅          | ❌         |
| POST /api/orders/{id}/cancel/   | ✅            | ✅          | ❌         |
| POST /api/refunds/              | ✅            | ✅          | ❌         |
| GET /api/refunds/               | ✅ (của mình) | ✅ (tất cả) | ❌         |
| POST /api/refunds/{id}/approve/ | ❌            | ✅          | ❌         |
| POST /api/refunds/{id}/reject/  | ❌            | ✅          | ❌         |

---

## Ví dụ API Calls (Curl)

### 1. Checkout với BANK_TRANSFER

```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Cookie: access_token=<jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_id": 10}],
    "payment_method": "BANK_TRANSFER"
  }'
```

### 2. Xác nhận thanh toán

```bash
curl -X POST http://localhost:8000/api/payments/10/confirm/ \
  -H "Cookie: access_token=<jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "BANK_TRANSFER",
    "transaction_ref": "VCB-2026030512345"
  }'
```

### 3. Update Order status

```bash
curl -X PATCH http://localhost:8000/api/orders/8/ \
  -H "Cookie: access_token=<jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "SHIPPED"}'
```

### 4. Hủy đơn hàng

```bash
curl -X POST http://localhost:8000/api/orders/8/cancel/ \
  -H "Cookie: access_token=<jwt_token>"
```

### 5. Yêu cầu hoàn tiền

```bash
curl -X POST http://localhost:8000/api/refunds/ \
  -H "Cookie: access_token=<jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 8,
    "reason_refund": "Sản phẩm bị lỗi"
  }'
```
