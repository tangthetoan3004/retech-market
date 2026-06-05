# Retech Market - Backend System & AI Modules

Dự án Backend của **Retech Market** — nền tảng thương mại điện tử mua bán điện thoại cũ — được xây dựng trên **Django 5.x** và **Django REST Framework (DRF) 3.15+**, tích hợp cơ sở dữ liệu **MySQL 8.0**, bộ nhớ đệm **Redis 7** (Cache & Celery Broker), cùng hệ thống **trí tuệ nhân tạo đa tầng** (Computer Vision, Price Prediction, RAG Chatbot & Intent Classification).

---

## 📑 Mục Lục

1. [Yêu Cầu Hệ Thống](#-1-yêu-cầu-hệ-thống)
2. [Hướng Dẫn Cài Đặt & Khởi Chạy (Local)](#️-2-hướng-dẫn-cài-đặt--khởi-chạy-local)
3. [Hướng Dẫn Chạy Bằng Docker](#-3-hướng-dẫn-chạy-bằng-docker)
4. [Tổng Quan Các Mô Hình AI](#-4-tổng-quan-các-mô-hình-ai)
5. [Hướng Dẫn Huấn Luyện Các Mô Hình AI](#-5-hướng-dẫn-huấn-luyện-các-mô-hình-ai)
6. [Vận Hành & Nạp Dữ Liệu Chatbot RAG](#-6-vận-hành--nạp-dữ-liệu-chatbot-rag)
7. [Tích Hợp Local LLM (Ollama)](#-7-tích-hợp-local-llm-ollama)
8. [Cấu Trúc Thư Mục Backend](#-8-cấu-trúc-thư-mục-backend)
9. [API Documentation](#-9-api-documentation)

---

## 📋 1. Yêu Cầu Hệ Thống

| Thành phần | Phiên bản tối thiểu | Mục đích |
|---|---|---|
| **Python** | 3.10+ | Runtime chính cho Django |
| **MySQL** | 8.0 | Cơ sở dữ liệu quan hệ chính |
| **Redis** | 7.x | Cache dữ liệu & Celery Message Broker |
| **Ollama** *(tùy chọn)* | Latest | Chạy LLM local cho chatbot |
| **Docker & Docker Compose** *(tùy chọn)* | 24.x+ | Triển khai containerized |

> **Lưu ý:** Trên Windows, Celery yêu cầu thêm thư viện `eventlet` để hoạt động (do Windows không hỗ trợ fork).

---

## 🛠️ 2. Hướng Dẫn Cài Đặt & Khởi Chạy (Local)

Khi mới clone code về máy tính cá nhân, hãy thực hiện **tuần tự** các bước sau:

### Bước 1: Cấu hình Môi trường ảo Python

```powershell
# Tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường ảo (Windows PowerShell)
.\venv\Scripts\activate

# Kích hoạt môi trường ảo (Linux / macOS)
source venv/bin/activate
```

### Bước 2: Cài đặt các thư viện cần thiết

```powershell
pip install -r requirements.txt
```

> **Danh sách các nhóm thư viện chính trong `requirements.txt`:**
>
> | Nhóm | Thư viện | Mô tả |
> |------|----------|-------|
> | **Core** | `Django>=5.0`, `djangorestframework>=3.15`, `mysqlclient>=2.2` | Framework web & ORM |
> | **Auth** | `djangorestframework-simplejwt>=5.3`, `PyJWT>=2.8` | Xác thực JWT |
> | **API** | `drf-spectacular>=0.27`, `django-filter>=24.0`, `django-cors-headers>=4.3` | Swagger UI, Filter, CORS |
> | **Cache & Queue** | `django-redis==5.4.0`, `redis==5.2.0`, `celery==5.4.0`, `django-celery-beat==2.9.0` | Redis Cache & Celery |
> | **Image** | `Pillow>=10.0`, `pillow-heif>=0.15.0` | Xử lý ảnh (hỗ trợ HEIC/iPhone) |
> | **AI & ML** | `onnxruntime>=1.15.0`, `transformers>=4.30.0`, `scikit-learn>=1.3.0`, `numpy>=1.24.0`, `opencv-python-headless>=4.8.0`, `pandas>=2.0.0` | Suy luận AI (ONNX), ML Pipeline |
> | **Crawler** | `selenium>=4.10.0`, `undetected-chromedriver>=3.5.0`, `beautifulsoup4>=4.12.0` | Thu thập dữ liệu web |
> | **External** | `requests==2.32.3`, `google-auth==2.38.0`, `python-dotenv>=1.0` | API bên ngoài & biến môi trường |

### Bước 3: Khởi tạo Cơ sở dữ liệu MySQL

**3.1. Khởi động MySQL Server** trên máy:
- **Windows (XAMPP):** Mở XAMPP Control Panel → Start MySQL.
- **Windows (MySQL Server):** Chạy `net start mysql` hoặc mở MySQL Workbench.
- **Linux:** `sudo systemctl start mysql`
- **Docker:** `docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql:8.0`

**3.2. Tạo Database:**
```sql
-- Đăng nhập MySQL và tạo database
CREATE DATABASE retech_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**3.3. Chạy Migrations:**
```powershell
python manage.py makemigrations
python manage.py migrate
```

> **Lưu ý quan trọng:** Khi gặp lỗi `500 Internal Server Error` (MySQL Error 1054: Unknown column), hãy kiểm tra trạng thái migration bằng lệnh `python manage.py showmigrations` — rất có thể bạn quên chạy `migrate` sau khi thêm field mới vào Model.

### Bước 4: Khởi tạo Redis Server

Redis đóng vai trò kép trong hệ thống: **Cache dữ liệu** (DB 0) và **Celery Message Broker** (DB 1).

```powershell
# Chạy Redis local (nếu đã cài Redis CLI)
redis-server

# Hoặc chạy qua Docker (khuyến nghị cho Windows)
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### Bước 5: Thiết lập các biến môi trường (`.env`)

Tạo file `.env` tại thư mục gốc của backend (`backend/backend/.env`) và khai báo đầy đủ các thông số cấu hình:

```env
# ═══════════════════════════════════════════════
# CẤU HÌNH DJANGO CỐT LÕI
# ═══════════════════════════════════════════════
DEBUG=True
SECRET_KEY=your-django-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# ═══════════════════════════════════════════════
# CẤU HÌNH CƠ SỞ DỮ LIỆU MYSQL
# ═══════════════════════════════════════════════
DB_NAME=retech_db
DB_USER=root
DB_PASSWORD=123456
DB_HOST=localhost
DB_PORT=3306

# ═══════════════════════════════════════════════
# CẤU HÌNH EMAIL (SendGrid hoặc Gmail App Password)
# ═══════════════════════════════════════════════
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=your-email@gmail.com

# ═══════════════════════════════════════════════
# GOOGLE OAUTH (Đăng nhập bằng Google)
# ═══════════════════════════════════════════════
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/user/login

# ═══════════════════════════════════════════════
# ZALOPAY SANDBOX (Thanh toán)
# ═══════════════════════════════════════════════
ZALOPAY_APP_ID=2553
ZALOPAY_KEY1=your-zalopay-key1
ZALOPAY_KEY2=your-zalopay-key2
NGROK_URL=https://your-ngrok-url.ngrok-free.app

# ═══════════════════════════════════════════════
# GEMINI API (Bắt buộc cho Chatbot RAG & Sinh Vector)
# ═══════════════════════════════════════════════
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_TIMEOUT=30

# ═══════════════════════════════════════════════
# HYBRID LLM ROUTER (Chatbot Local/Cloud)
# ═══════════════════════════════════════════════
LLM_PROVIDER=gemini
LOCAL_LLM_API_URL=http://localhost:11434/api/generate
LOCAL_LLM_MODEL=retech-bot
LOCAL_LLM_TIMEOUT=20
LOCAL_LLM_MAX_HISTORY=2
LOCAL_LLM_NUM_PREDICT=512
CHATBOT_RAG_ENABLED=True
```

> **Giải thích cấu hình LLM Router:**
> - `LLM_PROVIDER=gemini`: Dùng Gemini API làm mặc định (ổn định, cần internet).
> - `LLM_PROVIDER=local`: Dùng mô hình Ollama local (cần Ollama đang chạy trên máy).
> - Hệ thống có **cơ chế Fallback tự động**: Nếu LLM local offline → tự chuyển sang Gemini API.

### Bước 6: Tạo tài khoản quản trị tối cao (Superuser)

```powershell
python manage.py createsuperuser
```

### Bước 7: Khởi chạy các Server phát triển

Để chạy hệ thống backend đầy đủ chức năng, cần khởi chạy **đồng thời 2 tiến trình** trong 2 terminal riêng biệt:

**Terminal 1 — Django Web Server:**
```powershell
python manage.py runserver
```
*Server chạy tại: `http://127.0.0.1:8000/`*

**Terminal 2 — Celery Worker** (xử lý gửi email, tác vụ đồng bộ ngầm, tác vụ định kỳ):
```powershell
# Windows (BẮT BUỘC dùng eventlet)
pip install eventlet
celery -A config worker --loglevel=info -P eventlet

# Linux / macOS
celery -A config worker --loglevel=info
```

> **Truy cập hệ thống:**
> - **Swagger API Docs:** `http://127.0.0.1:8000/api/docs/`
> - **Django Admin Panel:** `http://127.0.0.1:8000/django-admin/`

---

## 🐳 3. Hướng Dẫn Chạy Bằng Docker

Dự án hỗ trợ triển khai toàn bộ hệ thống bằng **Docker Compose** với 5 containers:

| Container | Image | Mô tả |
|---|---|---|
| `retech-mysql` | MySQL 8.0 | Cơ sở dữ liệu chính |
| `retech-redis` | Redis 7 | Cache & Celery Broker |
| `retech-backend` | Python 3.12-slim | Django API Server + Celery Worker |
| `retech-frontend` | Node 20-alpine | React Vite Dev Server |
| `retech-nginx` | Nginx | Reverse Proxy (điều hướng `/api/*` → Django, `/*` → React) |

### Khởi chạy nhanh

```powershell
# Build và chạy toàn bộ hệ thống (lần đầu mất 5-15 phút)
docker compose build --no-cache
docker compose up -d

# Kiểm tra trạng thái (đợi tất cả đều Up/Healthy)
docker compose ps

# Import database SQL (nếu có file backup)
docker cp retech_db.sql retech-mysql:/tmp/retech_db.sql
docker exec -it retech-mysql bash -c "mysql -uroot -p123456 retech_db < /tmp/retech_db.sql"
docker restart retech-backend
```

### Cấu hình biến môi trường Docker

Sử dụng file `.env.docker` tại thư mục gốc dự án. Đặc biệt lưu ý:
- Khi chạy Ollama local kết hợp Docker, thay `localhost` bằng `host.docker.internal`.
- Cookie `SameSite=None` tự động bật khi `DEBUG=False` (production mode).

> **Tham khảo chi tiết:** Xem file `build_docker.md` tại thư mục gốc dự án để biết quy trình rebuild Docker đầy đủ, import SQL và cấu hình Ngrok tunnel.

---

## 🧠 4. Tổng Quan Các Mô Hình AI

Hệ thống tích hợp **4 mô hình/module AI** phục vụ 3 nghiệp vụ chính:

### 4.1. Mô hình Phân tích Ngoại hình — Computer Vision (CV)

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Tự động phát hiện trầy xước, nứt vỡ trên bề mặt điện thoại qua ảnh khách hàng tải lên |
| **Kiến trúc** | PyTorch — **EfficientNetV2-S** (pretrained ImageNet) + **Focal Loss** (xử lý mất cân bằng dữ liệu) |
| **Số lớp phân loại** | 4 lớp (tình trạng ngoại quan) |
| **Định dạng triển khai** | ONNX (suy luận bằng `onnxruntime` trên CPU, không cần PyTorch/GPU) |
| **File mô hình** | `ai_models/models/cv_model.onnx` |
| **Code huấn luyện** | [`ai_models/notebooks/cv_model_training.md`](ai_models/notebooks/cv_model_training.md) |
| **Dataset** | [Google Drive](https://drive.google.com/file/d/1PW2CZ5ttmk3-2FrW5HE8AWTKZZ5C9mf9/view?usp=sharing) |
| **API Endpoint** | `POST /api/ai/predict-damage/` |

### 4.2. Mô hình Dự đoán Giá — Price Prediction

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Dự đoán giá thu mua điện thoại cũ dựa trên thông số kỹ thuật và tình trạng máy |
| **Kiến trúc** | **XGBoost Regressor** + K-Fold Cross Validation (5-Fold) |
| **Tiền xử lý** | Log-Target Transformation, IQR Outlier Detection per Brand, RobustScaler |
| **Định dạng triển khai** | Joblib Pipeline (preprocessor + model) |
| **Code huấn luyện** | [`ai_models/notebooks/price_model_training.md`](ai_models/notebooks/price_model_training.md) |

### 4.3. Bộ Phân loại Ý định — Intent Classifier

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Nhận diện ý định câu hỏi khách hàng để điều phối luồng xử lý chatbot |
| **Kiến trúc** | Fine-tune **BERT-Tiny** bằng PyTorch trên tập câu hỏi tiếng Việt → xuất ONNX |
| **Các ý định** | Tư vấn sản phẩm, Hướng dẫn chính sách, Thu cũ đổi mới, Chuyện phiếm |
| **Định dạng triển khai** | ONNX (suy luận bằng `onnxruntime` trên CPU) |
| **File mô hình** | `chatbot/models/intent_classifier.onnx` |
| **Code huấn luyện** | [`chatbot/scripts/train_intent_model.py`](chatbot/scripts/train_intent_model.py) |

### 4.4. Hybrid LLM Router — Bộ định tuyến Cloud/Local

| Thuộc tính | Chi tiết |
|---|---|
| **Mục đích** | Chuyển đổi linh hoạt giữa LLM Cloud (Gemini API) và LLM Local (Ollama) |
| **Cơ chế** | Ưu tiên Local → Nếu offline tự động Fallback sang Gemini API |
| **Cấu hình** | Biến `.env`: `LLM_PROVIDER=local\|gemini` |
| **Code triển khai** | [`chatbot/rag_pipeline.py`](chatbot/rag_pipeline.py) |

> **Lưu ý kỹ thuật quan trọng:**
> - Khi chạy suy luận CV Model trên ảnh, **BẮT BUỘC** dùng `Image.BILINEAR` (Pillow) để match với `torchvision.transforms.Resize` lúc training. Dùng sai interpolation sẽ gây lệch kết quả dự đoán.
> - Thư viện `pillow-heif` đã được tích hợp để hỗ trợ đọc ảnh `.heic` từ iPhone, tránh lỗi `UnidentifiedImageError` gây định giá sai.

---

## 🔬 5. Hướng Dẫn Huấn Luyện Các Mô Hình AI

### 5.1. Huấn luyện CV Model (Google Colab)

Pipeline huấn luyện chi tiết từng bước (12 bước) được lưu tại: [`ai_models/notebooks/cv_model_training.md`](ai_models/notebooks/cv_model_training.md).

**Tóm tắt quy trình:**
1. Mount Google Drive & giải nén dataset
2. Chia dữ liệu phân tầng Stratified (70% Train / 15% Val / 15% Test)
3. Data Augmentation (RandomFlip, Rotation, ColorJitter)
4. Khởi tạo EfficientNetV2-S pretrained + tuỳ chỉnh lớp classifier
5. Huấn luyện với Focal Loss + AdamW optimizer + ReduceLROnPlateau scheduler
6. Auto-save checkpoint lên Google Drive sau mỗi epoch
7. Đánh giá: Classification Report, Confusion Matrix, F1-Score
8. Xuất mô hình sang ONNX (`opset_version=15`)

**Yêu cầu:** Google Colab (Free T4 GPU), cài thêm `onnx` và `onnxscript` để xuất ONNX.

### 5.2. Huấn luyện Price Prediction Model (Google Colab)

Pipeline chi tiết tại: [`ai_models/notebooks/price_model_training.md`](ai_models/notebooks/price_model_training.md).

**Tóm tắt quy trình:**
1. Load và làm sạch dữ liệu (loại giá ảo, IQR Outlier Detection theo Brand)
2. Feature Engineering: Log-Target Transform (`np.log1p`), OneHotEncoder, RobustScaler
3. Huấn luyện XGBoost Regressor với 5-Fold Cross Validation trên GPU T4
4. Đánh giá: MAE (VNĐ), MAPE (%), R2 Score, Feature Importance chart
5. Lưu pipeline hoàn chỉnh dạng Joblib

### 5.3. Huấn luyện Intent Classifier (Local)

Code huấn luyện tại: [`chatbot/scripts/train_intent_model.py`](chatbot/scripts/train_intent_model.py).

**Tóm tắt:** Fine-tune BERT-Tiny → xuất ONNX. Lưu ý trên Windows dùng `BertTokenizer` và `BertModel` trực tiếp thay vì `AutoTokenizer`/`AutoModel` để tránh lỗi backend tokenizer.

### 5.4. Fine-tune LLM cho Chatbot (Kaggle)

Hướng dẫn chi tiết tại: [`chatbot/scripts/fine_tune_llm_guide.md`](chatbot/scripts/fine_tune_llm_guide.md).

**Tóm tắt quy trình:**
1. Xuất dataset từ Django (`chatbot/scripts/export_dataset.py`) → `chat_dataset.jsonl`
2. Upload lên Kaggle, fine-tune **Llama-3.2-1B-Instruct** bằng LoRA (thư viện Unsloth)
3. Xuất mô hình sang GGUF (`q4_k_m` quantization, ~800MB)
4. Import vào Ollama local và tích hợp Django qua Hybrid LLM Router

> **Lưu ý Kaggle:**
> - **BẮT BUỘC** Restart Session sau khi cài thư viện Unsloth.
> - Do Kaggle giới hạn 20GB `/kaggle/working`, cần lưu file GGUF tạm vào `/tmp` rồi copy lại.
> - Đảm bảo phiên bản tương thích: `transformers>=4.51.3,<=5.5.0` và `trl>=0.18.2,<=0.24.0`.

---

## 💬 6. Vận Hành & Nạp Dữ Liệu Chatbot RAG

### 6.1. Kiểm tra khóa API Gemini

Trước khi vận hành chatbot, hãy chạy script kiểm tra để đảm bảo kết nối Gemini API hoạt động:
```powershell
$env:PYTHONIOENCODING="utf-8"
python chatbot/scripts/test_gemini_key.py
```

### 6.2. Nạp dữ liệu Knowledge Base từ file Markdown

Các file tài liệu chính sách/quy trình của website được lưu tại `media/support-docs/`:

| File | Nội dung |
|---|---|
| `cau_hoi_thuong_gap_faq.md` | Câu hỏi thường gặp (FAQ) |
| `chinh_sach_bao_hanh.md` | Chính sách bảo hành |
| `chinh_sach_giao_hang.md` | Chính sách giao hàng |
| `gioi_thieu_retech_market.md` | Giới thiệu Retech Market |
| `quy_trinh_hoan_tien.md` | Quy trình hoàn tiền |
| `quy_trinh_mua_hang.md` | Quy trình mua hàng |
| `quy_trinh_thu_cu_ban_may.md` | Quy trình thu cũ bán máy |

**Chạy script import vào Database:**
```powershell
$env:PYTHONIOENCODING="utf-8"
python chatbot/scripts/import_support_docs.py
```
*Script tự động đọc, chuẩn hóa tiêu đề và URL, lưu vào Database và kích hoạt Django Signal tạo Vector Embedding qua Gemini API.*

### 6.3. Thêm tri thức qua Django Admin UI

1. Truy cập: `http://localhost:8000/django-admin/`
2. Vào mục **Chatbot** → **Tài liệu Website** → **Thêm tài liệu**
3. Nhập: Tiêu đề, Nội dung, Đường dẫn URL (ví dụ: `/support/chinh-sach-bao-duong`)
4. Nhấn **Lưu** — Django Signals tự động sinh Vector Embedding
5. **Đồng bộ lại:** Tích chọn tài liệu → Action `Đồng bộ hóa Vector Embeddings` → **Go**

> **Lưu ý:** Sản phẩm mới tạo hoặc cập nhật sẽ tự động sinh vector embedding qua Django `post_save` signals. Sản phẩm bị đánh dấu `is_sold=True` hoặc `is_deleted=True` sẽ tự động bị xóa embedding.

---

## 🤖 7. Tích Hợp Local LLM (Ollama)

Khi muốn chuyển chatbot từ Gemini API sang mô hình tự huấn luyện chạy local:

### Bước 1: Cài đặt Ollama
Tải và cài đặt từ [ollama.com](https://ollama.com) cho Windows/macOS/Linux.

### Bước 2: Tạo Modelfile & Import mô hình

Tạo file `Modelfile` (không có đuôi mở rộng) nằm cùng thư mục với file `.gguf`:
```dockerfile
FROM ./retech_model_llama1b-unsloth.gguf

PARAMETER temperature 0.2
PARAMETER num_ctx 2048

SYSTEM """
Bạn là trợ lý ảo tư vấn mua sắm và chính sách thông minh của Retech Market. 
Hãy trả lời thân thiện, lịch sự và trung thực bằng tiếng Việt.
"""
```

```bash
# Tạo model trong Ollama
ollama create retech-bot -f Modelfile

# Khởi chạy thử
ollama run retech-bot
```

### Bước 3: Cấu hình Django kết nối

Cập nhật file `.env`:
```env
LLM_PROVIDER=local
LOCAL_LLM_API_URL=http://localhost:11434/api/generate
LOCAL_LLM_MODEL=retech-bot
LOCAL_LLM_TIMEOUT=12
LOCAL_LLM_NUM_PREDICT=256
```

> **Khuyến nghị phần cứng:**
> - GPU ≥ 6GB VRAM: Dùng mô hình **Llama-3.2-1B-Instruct** hoặc **Qwen-2.5-3B**.
> - GPU < 6GB VRAM (như GTX 1650 4GB): **BẮT BUỘC** dùng mô hình siêu nhẹ **Llama-3.2-1B** (Q4_K_M, ~800MB) để tránh nghẽn cổ chai CPU.
> - Đặt `LOCAL_LLM_TIMEOUT` nhỏ hơn timeout Frontend (ví dụ 12s vs 50s) để chừa thời gian cho Fallback sang Gemini.

---

## 📂 8. Cấu Trúc Thư Mục Backend

```
backend/backend/
├── config/                 # Cấu hình Django project (settings, urls, celery, wsgi/asgi)
│   ├── settings.py         # Cấu hình chính (DB, Redis, CORS, JWT, Email...)
│   ├── urls.py             # URL routing tổng (/api/users/, /api/products/,...)
│   ├── celery.py           # Cấu hình Celery app
│   └── exceptions.py       # Custom exception handlers
│
├── users/                  # App quản lý người dùng & xác thực
├── products/               # App quản lý sản phẩm (Category, Brand, Product)
├── orders/                 # App quản lý đơn hàng & hoàn trả (Order, Refund)
├── payment/                # App quản lý thanh toán (ZaloPay webhook)
├── tradein/                # App thu cũ đổi mới (TradeInRequest, PriceConfig)
├── core/                   # Utilities dùng chung (SoftDeleteModel, Pagination, Cache...)
│
├── ai_models/              # Module AI - Computer Vision & Price Prediction
│   ├── models/             # File mô hình ONNX/Joblib đã huấn luyện
│   ├── notebooks/          # Code huấn luyện (cv_model_training.md, price_model_training.md)
│   ├── services/           # Logic suy luận (DamageDetectionService)
│   ├── data_pipeline/      # Crawler & scripts xử lý dữ liệu
│   └── scripts/            # Scripts tiện ích
│
├── chatbot/                # Module AI - RAG Chatbot & Intent Classifier
│   ├── models/             # File mô hình ONNX (intent_classifier.onnx)
│   ├── scripts/            # Scripts: import docs, export dataset, test Gemini...
│   ├── rag_pipeline.py     # Pipeline RAG chính (Hybrid LLM Router + Vector Search)
│   ├── intent_classifier.py# Service phân loại ý định (ONNX inference)
│   └── signals.py          # Auto-sync vector embeddings (post_save signal)
│
├── media/                  # Thư mục media (ảnh sản phẩm, tài liệu, dataset)
│   ├── support-docs/       # Knowledge Base .md cho chatbot RAG
│   └── ai_datasets/        # Dataset huấn luyện (chat_dataset.jsonl...)
│
├── staticfiles/            # Static files (collectstatic output)
├── requirements.txt        # Danh sách thư viện Python
├── Dockerfile              # Dockerfile cho backend container
├── entrypoint.sh           # Script khởi động container (wait DB → migrate → celery → django)
├── manage.py               # Django CLI entry point
└── .env                    # Biến môi trường (KHÔNG commit lên Git)
```

---

## 📖 9. API Documentation

Hệ thống sử dụng **drf-spectacular** để tự động sinh tài liệu API dạng Swagger UI:

| Endpoint | Mô tả |
|---|---|
| `/api/docs/` | **Swagger UI** — Giao diện tương tác API đầy đủ |
| `/api/users/` | Auth & Users (JWT Login, Google OAuth, OTP, Reset Password) |
| `/api/products/` | CRUD Products, Categories, Brands (hỗ trợ `no_pagination=true` cho dropdown) |
| `/api/orders/` | Orders & Refunds |
| `/api/payments/` | Payments & ZaloPay Webhook (`zalopay-callback/`) |
| `/api/tradein/` | Trade-in API (vòng đời đơn thu đổi, định giá động) |
| `/api/ai/` | AI endpoints (predict damage, price estimation) |
| `/api/chatbot/` | RAG Chatbot API |
| `/api/dashboard/` | Admin Dashboard Stats (Revenue, Payout, Refund) |
| `/django-admin/` | Django Superadmin Panel |

> **Quy ước API quan trọng:**
> - Frontend **BẮT BUỘC** gọi API qua relative path (`/api/...`) để Nginx proxy, không hardcode `localhost`.
> - Luôn có dấu `/` ở đầu endpoint (ví dụ: `/api/dashboard/stats/` thay vì `api/dashboard/stats/`).
> - Khi Backend bật phân trang, response có cấu trúc `{ count, results: [...] }` thay vì mảng thuần.
