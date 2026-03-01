# Trade-In API Documentation

> **Base URL:** `http://localhost:8000/api/tradein/`
>
> **Authentication:** Cookie-based JWT (`access_token` cookie). Tất cả API yêu cầu đăng nhập.
>
> **Response wrapper:** Mọi response thành công đều có dạng `{ status, code, message, data }`. Response lỗi có dạng `{ status, code, message, errors }`.

---

## Mục lục

1. [Upload ảnh tạm](#1-upload-ảnh-tạm)
2. [Xoá ảnh tạm](#2-xoá-ảnh-tạm)
3. [Ước tính giá](#3-ước-tính-giá)
4. [Tạo TradeInRequest](#4-tạo-tradeinrequest)
5. [Danh sách TradeInRequest](#5-danh-sách-tradeinrequest)
6. [Chi tiết TradeInRequest](#6-chi-tiết-tradeinrequest)
7. [User huỷ TradeInRequest](#7-user-huỷ-tradeinrequest)
8. [Staff duyệt (Approve)](#8-staff-duyệt-approve)
9. [Staff từ chối (Reject)](#9-staff-từ-chối-reject)
10. [State Machine & FLOW](#10-state-machine--flow)

---

### Luồng SELL — Bán lại thiết bị

```
Bước 1 — User mở form:
  ► Client tạo session_key (UUID v4)

Bước 2 — Upload ảnh:
  ► POST /api/tradein/upload_temp/
    {session_key, image}
    (Lặp lại 1-5 lần)

Bước 3 — Xem giá ước tính:
  ► POST /api/tradein/estimate/
    {tradein_type:"SELL", brand_id, category_id, model_name, storage, ...}
    ← {estimated_price: 12000000}

Bước 4 — Tạo TradeInRequest:
  ► POST /api/tradein/
    {tradein_type:"SELL", brand, category, model_name, ..., session_key}
    ← status: "PENDING", expires_at: +7 ngày

  ⏱️ User có 7 ngày để mang thiết bị tới cửa hàng.
  ⏱️ Hết hạn → Celery auto-cancel → CANCELLED.

Bước 5 — Staff kiểm tra thiết bị tại cửa hàng:
  ► POST /api/tradein/{id}/approve/
    {final_price: 11500000, staff_note: "..."}
    ← status: "APPROVED"
    ← Payment(PENDING) tự động tạo: type=TRADEIN_SELL_PAYOUT, direction=OUTBOUND
  HOẶC
  ► POST /api/tradein/{id}/reject/
    {reject_reason: "..."}
    ← status: "REJECTED"

Bước 6 — Thanh toán:
  ► POST /api/payments/{payment_id}/confirm/
    {payment_method:"CASH"}
    ← Payment: COMPLETED
    ← [Signal tự động] TradeIn: APPROVED → COMPLETED ✅
```

---

### Luồng EXCHANGE — Thu cũ đổi mới

```
Bước 1 — User vào Product Detail, click "Trade-in":
  ► Client tạo session_key (UUID v4)

Bước 2 — Upload ảnh:
  ► POST /api/tradein/upload_temp/
    {session_key, image}

Bước 3 — Xem giá ước tính + chênh lệch:
  ► POST /api/tradein/estimate/
    {tradein_type:"EXCHANGE", target_product_id:15, brand_id, ...}
    ← {estimated_price: 14000000, target_product_price: 25000000, difference_amount: 11000000}

Bước 4 — Tạo TradeInRequest:
  ► POST /api/tradein/
    {tradein_type:"EXCHANGE", target_product:15, ..., session_key}
    ← status: "PENDING"
    ← target_product.is_sold = True (giữ chỗ cho User)

  ⏱️ 7 ngày countdown. Hết hạn → CANCELLED, is_sold revert = False.

Bước 5a — Staff duyệt:
  ► POST /api/tradein/{id}/approve/
    {final_price: 14000000, staff_note: "Máy đẹp"}
    ← status: "APPROVED"
    ← ExchangeOrder + Order(PENDING) tự động tạo
    ← Payment(PENDING) tự động tạo: type=TRADEIN_EXCHANGE
       direction=INBOUND (User trả thêm 11tr), amount=11000000

Bước 5b — HOẶC Staff từ chối:
  ► POST /api/tradein/{id}/reject/
    {reject_reason: "Thiết bị không đạt"}
    ← status: "REJECTED"
    ← target_product.is_sold revert = False

Bước 5c — HOẶC User tự huỷ:
  ► POST /api/tradein/{id}/cancel/
    ← status: "CANCELLED"
    ← target_product.is_sold revert = False

Bước 6 — Thanh toán:
  ► POST /api/payments/{payment_id}/confirm/
    {payment_method:"CASH"}
    ← Payment: COMPLETED
    ← [Signal tự động] Order: PENDING → DELIVERED ✅
    ← [Signal tự động] TradeIn: APPROVED → COMPLETED ✅
```

---


## 1. Upload ảnh tạm

Upload ảnh thiết bị **trước khi** tạo TradeInRequest. Client tạo `session_key` (UUID v4) khi mở form.

|                  |                             |
| ---------------- | --------------------------- |
| **Method**       | `POST`                      |
| **URL**          | `/api/tradein/upload_temp/` |
| **Quyền**        | User đã đăng nhập           |
| **Content-Type** | `multipart/form-data`       |

### Headers

```
Cookie: access_token=<jwt_token>
Content-Type: multipart/form-data
```

### Body (form-data)

| Field         | Type | Required | Mô tả                              |
| ------------- | ---- | -------- | ---------------------------------- |
| `session_key` | UUID | ✅       | UUID v4, client tự tạo khi mở form |
| `image`       | File | ✅       | Ảnh JPEG/PNG, tối đa 5 MB          |

### Ví dụ Request

```
POST /api/tradein/upload_temp/
Content-Type: multipart/form-data

session_key: 550e8400-e29b-41d4-a716-446655440000
image: [file: iphone_front.jpg]
```

### Response — 201 Created

```json
{
  "status": "success",
  "code": 201,
  "message": "Success",
  "data": {
    "id": 1,
    "session_key": "550e8400-e29b-41d4-a716-446655440000",
    "image_url": "/media/tradein_temp/iphone_front.jpg"
  }
}
```

### Lỗi có thể xảy ra

| Code | Trường hợp                             |
| ---- | -------------------------------------- |
| 400  | Ảnh vượt quá 5 MB                      |
| 400  | Đã upload đủ 5 ảnh cho session_key này |
| 401  | Chưa đăng nhập                         |

```json
{
  "status": "error",
  "code": 400,
  "message": "non_field_errors: Tối đa 5 ảnh.",
  "errors": {
    "non_field_errors": ["Tối đa 5 ảnh."]
  }
}
```

---

## 2. Xoá ảnh tạm

Xoá ảnh đã upload trước khi tạo TradeInRequest.

|            |                                  |
| ---------- | -------------------------------- |
| **Method** | `DELETE`                         |
| **URL**    | `/api/tradein/delete_temp/{id}/` |
| **Quyền**  | User đã đăng nhập                |

### Headers

```
Cookie: access_token=<jwt_token>
```

### Ví dụ Request

```
DELETE /api/tradein/delete_temp/1/
```

### Response — 204 No Content

_(Không có body)_

### Lỗi có thể xảy ra

| Code | Trường hợp                                 |
| ---- | ------------------------------------------ |
| 404  | Ảnh tạm không tồn tại hoặc đã được sử dụng |
| 401  | Chưa đăng nhập                             |

```json
{
  "status": "error",
  "code": 404,
  "message": "Ảnh tạm không tồn tại.",
  "errors": {}
}
```

---

## 3. Ước tính giá

Tính giá ước tính cho thiết bị cũ. **Stateless** — không lưu DB, chỉ trả kết quả để hiển thị trên UI.

|                  |                          |
| ---------------- | ------------------------ |
| **Method**       | `POST`                   |
| **URL**          | `/api/tradein/estimate/` |
| **Quyền**        | User đã đăng nhập        |
| **Content-Type** | `application/json`       |

### Headers

```
Cookie: access_token=<jwt_token>
Content-Type: application/json
```

### Body

| Field                | Type    | Required | Mô tả                                        |
| -------------------- | ------- | -------- | -------------------------------------------- |
| `tradein_type`       | string  | ✅       | `"SELL"` hoặc `"EXCHANGE"`                   |
| `brand_id`           | integer | ✅       | ID thương hiệu                               |
| `category_id`        | integer | ✅       | ID danh mục                                  |
| `model_name`         | string  | ✅       | Tên model (vd: "iPhone 14 Pro Max")          |
| `storage`            | string  | ❌       | Dung lượng (vd: "256GB")                     |
| `is_power_on`        | boolean | ❌       | Máy bật nguồn được không (default: true)     |
| `screen_ok`          | boolean | ❌       | Màn hình nguyên vẹn (default: true)          |
| `body_ok`            | boolean | ❌       | Thân máy nguyên vẹn (default: true)          |
| `battery_percentage` | integer | ✅       | Phần trăm pin (0-100)                        |
| `target_product_id`  | integer | ❌       | ID sản phẩm muốn đổi (bắt buộc nếu EXCHANGE) |

### Ví dụ Request — Luồng SELL

```json
{
  "tradein_type": "SELL",
  "brand_id": 1,
  "category_id": 1,
  "model_name": "iPhone 14 Pro Max",
  "storage": "256GB",
  "is_power_on": true,
  "screen_ok": true,
  "body_ok": false,
  "battery_percentage": 85
}
```

### Response — 200 OK (SELL)

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "estimated_price": 12000000,
    "target_product_price": null,
    "difference_amount": null
  }
}
```

### Ví dụ Request — Luồng EXCHANGE

```json
{
  "tradein_type": "EXCHANGE",
  "brand_id": 1,
  "category_id": 1,
  "model_name": "iPhone 14 Pro Max",
  "storage": "256GB",
  "is_power_on": true,
  "screen_ok": true,
  "body_ok": true,
  "battery_percentage": 92,
  "target_product_id": 15
}
```

### Response — 200 OK (EXCHANGE)

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "estimated_price": 14000000,
    "target_product_price": 25000000,
    "difference_amount": 11000000
  }
}
```

### Response — Không tìm thấy config giá

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "estimated_price": null,
    "target_product_price": null,
    "difference_amount": null
  }
}
```

### Lỗi có thể xảy ra

| Code | Trường hợp                                                 |
| ---- | ---------------------------------------------------------- |
| 400  | `tradein_type` là EXCHANGE nhưng thiếu `target_product_id` |
| 400  | `battery_percentage` ngoài khoảng 0-100                    |
| 401  | Chưa đăng nhập                                             |

---

## 4. Tạo TradeInRequest

User xác nhận giá ước tính và tạo yêu cầu trade-in. Hẹn tới cửa hàng trong 7 ngày.

|                  |                    |
| ---------------- | ------------------ |
| **Method**       | `POST`             |
| **URL**          | `/api/tradein/`    |
| **Quyền**        | User đã đăng nhập  |
| **Content-Type** | `application/json` |

### Headers

```
Cookie: access_token=<jwt_token>
Content-Type: application/json
```

### Body

| Field                | Type    | Required | Mô tả                                        |
| -------------------- | ------- | -------- | -------------------------------------------- |
| `tradein_type`       | string  | ✅       | `"SELL"` hoặc `"EXCHANGE"`                   |
| `brand`              | integer | ✅       | ID thương hiệu                               |
| `category`           | integer | ✅       | ID danh mục                                  |
| `model_name`         | string  | ✅       | Tên model                                    |
| `storage`            | string  | ❌       | Dung lượng                                   |
| `is_power_on`        | boolean | ❌       | Default: true                                |
| `screen_ok`          | boolean | ❌       | Default: true                                |
| `body_ok`            | boolean | ❌       | Default: true                                |
| `battery_percentage` | integer | ✅       | 0-100                                        |
| `description`        | string  | ❌       | Mô tả thêm                                   |
| `target_product`     | integer | ❌       | ID sản phẩm muốn đổi (bắt buộc nếu EXCHANGE) |
| `session_key`        | UUID    | ✅       | UUID đã dùng khi upload ảnh tạm              |

### Ví dụ Request — SELL

```json
{
  "tradein_type": "SELL",
  "brand": 1,
  "category": 1,
  "model_name": "iPhone 14 Pro Max",
  "storage": "256GB",
  "is_power_on": true,
  "screen_ok": true,
  "body_ok": false,
  "battery_percentage": 85,
  "description": "Máy còn đẹp, có vết xước nhẹ ở viền",
  "session_key": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Ví dụ Request — EXCHANGE

```json
{
  "tradein_type": "EXCHANGE",
  "brand": 1,
  "category": 1,
  "model_name": "iPhone 14 Pro Max",
  "storage": "256GB",
  "is_power_on": true,
  "screen_ok": true,
  "body_ok": true,
  "battery_percentage": 92,
  "description": "Máy sử dụng kỹ, fullbox",
  "target_product": 15,
  "session_key": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response — 201 Created

```json
{
  "status": "success",
  "code": 201,
  "message": "Success",
  "data": {
    "id": 1,
    "user": 3,
    "tradein_type": "SELL",
    "status": "PENDING",
    "brand": 1,
    "category": 1,
    "model_name": "iPhone 14 Pro Max",
    "storage": "256GB",
    "is_power_on": true,
    "screen_ok": true,
    "body_ok": false,
    "battery_percentage": 85,
    "description": "Máy còn đẹp, có vết xước nhẹ ở viền",
    "estimated_price": 12000000,
    "final_price": null,
    "target_product": null,
    "expires_at": "2026-03-08T10:30:00+07:00",
    "staff_note": "",
    "reject_reason": null,
    "images": [
      {
        "id": 1,
        "image": "/media/tradeins/iphone_front.jpg",
        "uploaded_at": "2026-03-01T10:25:00+07:00"
      },
      {
        "id": 2,
        "image": "/media/tradeins/iphone_back.jpg",
        "uploaded_at": "2026-03-01T10:25:30+07:00"
      }
    ],
    "payment": null,
    "created_at": "2026-03-01T10:30:00+07:00",
    "updated_at": "2026-03-01T10:30:00+07:00"
  }
}
```

### Lỗi có thể xảy ra

| Code | Trường hợp                                                   |
| ---- | ------------------------------------------------------------ |
| 400  | `tradein_type` là EXCHANGE nhưng thiếu `target_product`      |
| 400  | `session_key` không có ảnh tạm nào (chưa upload)             |
| 400  | Sản phẩm EXCHANGE đã bán hoặc không tồn tại (race condition) |
| 401  | Chưa đăng nhập                                               |

```json
{
  "status": "error",
  "code": 400,
  "message": "session_key: Chưa upload ảnh nào.",
  "errors": {
    "session_key": ["Chưa upload ảnh nào."]
  }
}
```

---

## 5. Danh sách TradeInRequest

Lấy danh sách yêu cầu trade-in. User thấy của mình, Staff thấy tất cả.

|            |                   |
| ---------- | ----------------- |
| **Method** | `GET`             |
| **URL**    | `/api/tradein/`   |
| **Quyền**  | User đã đăng nhập |

### Headers

```
Cookie: access_token=<jwt_token>
```

### Query Params

| Param    | Type   | Mô tả                                                                           |
| -------- | ------ | ------------------------------------------------------------------------------- |
| `status` | string | Filter theo status: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED` |

### Ví dụ Request

```
GET /api/tradein/?status=PENDING
```

### Response — 200 OK

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "user": 3,
      "tradein_type": "SELL",
      "status": "PENDING",
      "brand": 1,
      "category": 1,
      "model_name": "iPhone 14 Pro Max",
      "storage": "256GB",
      "is_power_on": true,
      "screen_ok": true,
      "body_ok": false,
      "battery_percentage": 85,
      "description": "Máy còn đẹp",
      "estimated_price": 12000000,
      "final_price": null,
      "target_product": null,
      "expires_at": "2026-03-08T10:30:00+07:00",
      "staff_note": "",
      "reject_reason": null,
      "images": [
        {
          "id": 1,
          "image": "/media/tradeins/iphone_front.jpg",
          "uploaded_at": "2026-03-01T10:25:00+07:00"
        }
      ],
      "payment": null,
      "created_at": "2026-03-01T10:30:00+07:00",
      "updated_at": "2026-03-01T10:30:00+07:00"
    }
  ]
}
```

---

## 6. Chi tiết TradeInRequest

|            |                      |
| ---------- | -------------------- |
| **Method** | `GET`                |
| **URL**    | `/api/tradein/{id}/` |
| **Quyền**  | Owner hoặc Staff     |

### Headers

```
Cookie: access_token=<jwt_token>
```

### Ví dụ Request

```
GET /api/tradein/1/
```

### Response — 200 OK (sau khi APPROVED, có payment)

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "user": 3,
    "tradein_type": "SELL",
    "status": "APPROVED",
    "brand": 1,
    "category": 1,
    "model_name": "iPhone 14 Pro Max",
    "storage": "256GB",
    "is_power_on": true,
    "screen_ok": true,
    "body_ok": false,
    "battery_percentage": 85,
    "description": "Máy còn đẹp",
    "estimated_price": 12000000,
    "final_price": 11500000,
    "target_product": null,
    "expires_at": "2026-03-08T10:30:00+07:00",
    "staff_note": "Máy có trầy viền, trừ 500k",
    "reject_reason": null,
    "images": [
      {
        "id": 1,
        "image": "/media/tradeins/iphone_front.jpg",
        "uploaded_at": "2026-03-01T10:25:00+07:00"
      }
    ],
    "payment": {
      "id": 1,
      "status": "PENDING",
      "amount": 11500000,
      "direction": "OUTBOUND",
      "payment_method": "CASH"
    },
    "created_at": "2026-03-01T10:30:00+07:00",
    "updated_at": "2026-03-03T14:00:00+07:00"
  }
}
```

### Lỗi có thể xảy ra

| Code | Trường hợp                                           |
| ---- | ---------------------------------------------------- |
| 404  | TradeInRequest không tồn tại hoặc không có quyền xem |
| 401  | Chưa đăng nhập                                       |

---

## 7. User huỷ TradeInRequest

User tự huỷ yêu cầu trade-in. Chỉ huỷ được khi status = `PENDING`.

|            |                             |
| ---------- | --------------------------- |
| **Method** | `POST`                      |
| **URL**    | `/api/tradein/{id}/cancel/` |
| **Quyền**  | Owner của TradeInRequest    |

### Headers

```
Cookie: access_token=<jwt_token>
```

### Body

_(Không cần body)_

### Ví dụ Request

```
POST /api/tradein/1/cancel/
```

### Response — 200 OK

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "user": 3,
    "tradein_type": "SELL",
    "status": "CANCELLED",
    "brand": 1,
    "category": 1,
    "model_name": "iPhone 14 Pro Max",
    "storage": "256GB",
    "is_power_on": true,
    "screen_ok": true,
    "body_ok": false,
    "battery_percentage": 85,
    "description": "Máy còn đẹp",
    "estimated_price": 12000000,
    "final_price": null,
    "target_product": null,
    "expires_at": "2026-03-08T10:30:00+07:00",
    "staff_note": "",
    "reject_reason": null,
    "images": [],
    "payment": null,
    "created_at": "2026-03-01T10:30:00+07:00",
    "updated_at": "2026-03-01T15:00:00+07:00"
  }
}
```

### Lỗi có thể xảy ra

| Code | Trường hợp                                |
| ---- | ----------------------------------------- |
| 400  | TradeInRequest không ở trạng thái PENDING |
| 403  | Không phải owner và không phải Staff      |
| 404  | TradeInRequest không tồn tại              |
| 401  | Chưa đăng nhập                            |

```json
{
  "status": "error",
  "code": 400,
  "message": "Chỉ có thể huỷ TradeInRequest đang ở trạng thái PENDING.",
  "errors": {}
}
```

> **Lưu ý (EXCHANGE):** Khi huỷ, `target_product.is_sold` sẽ được revert về `False` để sản phẩm trở lại khả dụng.

---

## 8. Staff duyệt (Approve)

Admin kiểm tra thiết bị tại cửa hàng, set giá cuối `final_price` → PENDING → APPROVED.

**Hệ thống tự động:**

- Tạo `Payment(PENDING)` cho TradeIn này.
- Nếu EXCHANGE: tạo `ExchangeOrder` + `Order(PENDING)`.

|                  |                              |
| ---------------- | ---------------------------- |
| **Method**       | `POST`                       |
| **URL**          | `/api/tradein/{id}/approve/` |
| **Quyền**        | **Staff only** (IsAdminUser) |
| **Content-Type** | `application/json`           |

### Headers

```
Cookie: access_token=<jwt_token>
Content-Type: application/json
```

### Body

| Field         | Type    | Required | Mô tả                                   |
| ------------- | ------- | -------- | --------------------------------------- |
| `final_price` | decimal | ✅       | Giá cuối sau khi kiểm tra tận tay (≥ 1) |
| `staff_note`  | string  | ❌       | Ghi chú (cho phép rỗng)                 |

### Ví dụ Request — SELL

```json
{
  "final_price": 11500000,
  "staff_note": "Máy có trầy nhẹ ở viền, trừ 500k so với giá ước tính"
}
```

### Response — 200 OK (SELL)

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "user": 3,
    "tradein_type": "SELL",
    "status": "APPROVED",
    "brand": 1,
    "category": 1,
    "model_name": "iPhone 14 Pro Max",
    "storage": "256GB",
    "is_power_on": true,
    "screen_ok": true,
    "body_ok": false,
    "battery_percentage": 85,
    "description": "Máy còn đẹp, có vết xước nhẹ ở viền",
    "estimated_price": 12000000,
    "final_price": 11500000,
    "target_product": null,
    "expires_at": "2026-03-08T10:30:00+07:00",
    "staff_note": "Máy có trầy nhẹ ở viền, trừ 500k so với giá ước tính",
    "reject_reason": null,
    "images": [
      {
        "id": 1,
        "image": "/media/tradeins/iphone_front.jpg",
        "uploaded_at": "2026-03-01T10:25:00+07:00"
      }
    ],
    "payment": {
      "id": 1,
      "status": "PENDING",
      "amount": 11500000,
      "direction": "OUTBOUND",
      "payment_method": "CASH"
    },
    "created_at": "2026-03-01T10:30:00+07:00",
    "updated_at": "2026-03-03T14:00:00+07:00"
  }
}
```

### Ví dụ Request — EXCHANGE

```json
{
  "final_price": 14000000,
  "staff_note": "Máy đẹp, đúng mô tả"
}
```

### Response — 200 OK (EXCHANGE)

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "id": 2,
    "user": 3,
    "tradein_type": "EXCHANGE",
    "status": "APPROVED",
    "brand": 1,
    "category": 1,
    "model_name": "iPhone 14 Pro Max",
    "storage": "256GB",
    "is_power_on": true,
    "screen_ok": true,
    "body_ok": true,
    "battery_percentage": 92,
    "description": "Máy sử dụng kỹ, fullbox",
    "estimated_price": 14000000,
    "final_price": 14000000,
    "target_product": 15,
    "expires_at": "2026-03-08T10:30:00+07:00",
    "staff_note": "Máy đẹp, đúng mô tả",
    "reject_reason": null,
    "images": [],
    "payment": {
      "id": 2,
      "status": "PENDING",
      "amount": 11000000,
      "direction": "INBOUND",
      "payment_method": "CASH"
    },
    "created_at": "2026-03-01T10:30:00+07:00",
    "updated_at": "2026-03-03T14:00:00+07:00"
  }
}
```

> **Payment tự động tạo:**
>
> - **SELL:** `direction=OUTBOUND`, `amount=final_price` (cửa hàng trả tiền cho User)
> - **EXCHANGE:** `direction=INBOUND/OUTBOUND`, `amount=|target_product.price - final_price|`

### Lỗi có thể xảy ra

| Code | Trường hợp                                |
| ---- | ----------------------------------------- |
| 400  | TradeInRequest không ở trạng thái PENDING |
| 400  | `final_price` < 1                         |
| 403  | Không phải Staff                          |
| 404  | TradeInRequest không tồn tại              |

---

## 9. Staff từ chối (Reject)

Admin từ chối thiết bị (không đạt yêu cầu). Bắt buộc cung cấp lý do.

|                  |                              |
| ---------------- | ---------------------------- |
| **Method**       | `POST`                       |
| **URL**          | `/api/tradein/{id}/reject/`  |
| **Quyền**        | **Staff only** (IsAdminUser) |
| **Content-Type** | `application/json`           |

### Headers

```
Cookie: access_token=<jwt_token>
Content-Type: application/json
```

### Body

| Field           | Type   | Required | Mô tả                       |
| --------------- | ------ | -------- | --------------------------- |
| `reject_reason` | string | ✅       | Lý do từ chối (min 1 ký tự) |

### Ví dụ Request

```json
{
  "reject_reason": "Thiết bị có dấu hiệu ngấm nước, không đáp ứng tiêu chuẩn trade-in"
}
```

### Response — 200 OK

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "user": 3,
    "tradein_type": "SELL",
    "status": "REJECTED",
    "brand": 1,
    "category": 1,
    "model_name": "iPhone 14 Pro Max",
    "storage": "256GB",
    "is_power_on": true,
    "screen_ok": true,
    "body_ok": false,
    "battery_percentage": 85,
    "description": "Máy còn đẹp",
    "estimated_price": 12000000,
    "final_price": null,
    "target_product": null,
    "expires_at": "2026-03-08T10:30:00+07:00",
    "staff_note": "",
    "reject_reason": "Thiết bị có dấu hiệu ngấm nước, không đáp ứng tiêu chuẩn trade-in",
    "images": [],
    "payment": null,
    "created_at": "2026-03-01T10:30:00+07:00",
    "updated_at": "2026-03-03T14:15:00+07:00"
  }
}
```

### Lỗi có thể xảy ra

| Code | Trường hợp                                |
| ---- | ----------------------------------------- |
| 400  | TradeInRequest không ở trạng thái PENDING |
| 400  | `reject_reason` rỗng                      |
| 403  | Không phải Staff                          |
| 404  | TradeInRequest không tồn tại              |

> **Lưu ý (EXCHANGE):** Khi reject, `target_product.is_sold` sẽ được revert về `False`.

---

## 10. State Machine & FLOW

### State Machine — TradeInRequest

```
                    ┌──────────────────────────┐
                    │                          │
             ┌──────▼──────┐                   │
  User tạo ──►   PENDING   │                   │
             └──┬──┬──┬────┘                   │
                │  │  │                        │
    ┌───────────┘  │  └───────────────┐        │
    │              │                  │        │
    ▼              ▼                  ▼        │
┌────────┐  ┌──────────┐      ┌───────────┐   │
│APPROVED│  │ REJECTED │      │ CANCELLED │   │
└───┬────┘  └──────────┘      └───────────┘   │
    │         (terminal)        (terminal)     │
    │                                          │
    │  Payment COMPLETED (signal)              │
    ▼                                          │
┌──────────┐                                   │
│COMPLETED │                                   │
└──────────┘                                   │
  (terminal)                                   │
```

### ALLOWED_TRANSITIONS

| Từ          | → Cho phép chuyển sang              |
| ----------- | ----------------------------------- |
| `PENDING`   | `APPROVED`, `REJECTED`, `CANCELLED` |
| `APPROVED`  | `COMPLETED`                         |
| `REJECTED`  | _(terminal)_                        |
| `CANCELLED` | _(terminal)_                        |
| `COMPLETED` | _(terminal)_                        |

---

### Luồng SELL — Bán lại thiết bị

```
Bước 1 — User mở form:
  ► Client tạo session_key (UUID v4)

Bước 2 — Upload ảnh:
  ► POST /api/tradein/upload_temp/
    {session_key, image}
    (Lặp lại 1-5 lần)

Bước 3 — Xem giá ước tính:
  ► POST /api/tradein/estimate/
    {tradein_type:"SELL", brand_id, category_id, model_name, storage, ...}
    ← {estimated_price: 12000000}

Bước 4 — Tạo TradeInRequest:
  ► POST /api/tradein/
    {tradein_type:"SELL", brand, category, model_name, ..., session_key}
    ← status: "PENDING", expires_at: +7 ngày

  ⏱️ User có 7 ngày để mang thiết bị tới cửa hàng.
  ⏱️ Hết hạn → Celery auto-cancel → CANCELLED.

Bước 5 — Staff kiểm tra thiết bị tại cửa hàng:
  ► POST /api/tradein/{id}/approve/
    {final_price: 11500000, staff_note: "..."}
    ← status: "APPROVED"
    ← Payment(PENDING) tự động tạo: type=TRADEIN_SELL_PAYOUT, direction=OUTBOUND
  HOẶC
  ► POST /api/tradein/{id}/reject/
    {reject_reason: "..."}
    ← status: "REJECTED"

Bước 6 — Thanh toán:
  ► POST /api/payments/{payment_id}/confirm/
    {payment_method:"CASH"}
    ← Payment: COMPLETED
    ← [Signal tự động] TradeIn: APPROVED → COMPLETED ✅
```

---

### Luồng EXCHANGE — Thu cũ đổi mới

```
Bước 1 — User vào Product Detail, click "Trade-in":
  ► Client tạo session_key (UUID v4)

Bước 2 — Upload ảnh:
  ► POST /api/tradein/upload_temp/
    {session_key, image}

Bước 3 — Xem giá ước tính + chênh lệch:
  ► POST /api/tradein/estimate/
    {tradein_type:"EXCHANGE", target_product_id:15, brand_id, ...}
    ← {estimated_price: 14000000, target_product_price: 25000000, difference_amount: 11000000}

Bước 4 — Tạo TradeInRequest:
  ► POST /api/tradein/
    {tradein_type:"EXCHANGE", target_product:15, ..., session_key}
    ← status: "PENDING"
    ← target_product.is_sold = True (giữ chỗ cho User)

  ⏱️ 7 ngày countdown. Hết hạn → CANCELLED, is_sold revert = False.

Bước 5a — Staff duyệt:
  ► POST /api/tradein/{id}/approve/
    {final_price: 14000000, staff_note: "Máy đẹp"}
    ← status: "APPROVED"
    ← ExchangeOrder + Order(PENDING) tự động tạo
    ← Payment(PENDING) tự động tạo: type=TRADEIN_EXCHANGE
       direction=INBOUND (User trả thêm 11tr), amount=11000000

Bước 5b — HOẶC Staff từ chối:
  ► POST /api/tradein/{id}/reject/
    {reject_reason: "Thiết bị không đạt"}
    ← status: "REJECTED"
    ← target_product.is_sold revert = False

Bước 5c — HOẶC User tự huỷ:
  ► POST /api/tradein/{id}/cancel/
    ← status: "CANCELLED"
    ← target_product.is_sold revert = False

Bước 6 — Thanh toán:
  ► POST /api/payments/{payment_id}/confirm/
    {payment_method:"CASH"}
    ← Payment: COMPLETED
    ← [Signal tự động] Order: PENDING → DELIVERED ✅
    ← [Signal tự động] TradeIn: APPROVED → COMPLETED ✅
```

---

### Auto-cancel (Celery Beat)

- **Mỗi giờ**: Tìm TradeInRequest có `status=PENDING` + `expires_at < now()` → tự động cancel.
- **3h sáng mỗi ngày**: Xoá `TradeInTempImage` có `is_used=False` + `created_at > 24h` (dọn ảnh rác).
