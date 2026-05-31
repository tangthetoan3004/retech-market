# Retech Market - Backend System & AI Modules

Dự án Backend của **Retech Market** được xây dựng dựa trên framework Django và Django REST Framework (DRF), tích hợp cơ sở dữ liệu MySQL, bộ nhớ đệm Redis (Broker cho Celery và Cache) cùng các mô hình trí tuệ nhân tạo (Computer Vision & RAG Chatbot).

---

## 🛠️ 1. Hướng Dẫn Thiết Lập & Khởi Chạy Hệ Thống

Khi mới clone code về máy tính cá nhân, bạn hãy thực hiện tuần tự các bước sau để thiết lập môi trường và khởi chạy server phát triển:

### Bước 1: Cấu hình Môi trường ảo Python
Yêu cầu phiên bản Python từ **3.10** trở lên.
```powershell
# Tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường ảo (Windows)
.\venv\Scripts\activate

# Kích hoạt môi trường ảo (Linux / macOS)
source venv/bin/activate
```

### Bước 2: Cài đặt các thư viện cần thiết
```powershell
pip install -r requirements.txt
```

### Bước 3: Thiết lập các biến môi trường (`.env`)
Tạo file `.env` tại thư mục gốc của backend (`backend/backend/`) và khai báo đầy đủ các thông số cấu hình sau:
```env
# Cấu hình Django
DEBUG=True
SECRET_KEY=your-django-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Cấu hình Cơ sở dữ liệu MySQL
DB_NAME=retech_db
DB_USER=retech_user
DB_PASSWORD=retech_password
DB_HOST=127.0.0.1
DB_PORT=3306

# Cấu hình khóa API Google Gemini (Bắt buộc cho Chatbot RAG & Sinh Vector)
GEMINI_API_KEY=your-gemini-api-key

# Cấu hình Redis & Celery
REDIS_URL=redis://127.0.0.1:6379/0
```

### Bước 4: Khởi tạo Cơ sở dữ liệu (Migrations)
Đảm bảo bạn đã khởi động service MySQL trên máy trước khi chạy các lệnh sau:
```powershell
python manage.py makemigrations
python manage.py migrate
```

### Bước 5: Tạo tài khoản quản trị tối cao (Superuser)
```powershell
python manage.py createsuperuser
```

### Bước 6: Khởi chạy các Server phát triển
Để chạy hệ thống backend đầy đủ chức năng, bạn cần khởi chạy đồng thời hai tiến trình:

1.  **Chạy Django Web Server**:
    ```powershell
    python manage.py runserver
    ```
    *Server sẽ chạy mặc định tại: `http://127.0.0.1:8000/`*

2.  **Chạy Celery Worker** (để xử lý các tác vụ gửi mail, đồng bộ ngầm và tác vụ định kỳ):
    ```powershell
    # Windows (Yêu cầu cài đặt thêm thư viện eventlet: pip install eventlet)
    celery -A config worker --loglevel=info -P eventlet
    
    # Linux / macOS
    celery -A config worker --loglevel=info
    ```

---

## 🧠 2. Tổng Quan Các Mô Hình Trí Tuệ Nhân Tạo (AI Modules)

Hệ thống tích hợp hai mô hình AI chính thức phục vụ nghiệp vụ định giá tự động và hỗ trợ khách hàng:

### 2.1. Mô hình Phân tích Ngoại hình (Computer Vision Model)
- **Mục đích**: Tự động phát hiện các vết trầy xước, nứt vỡ ngoại quan trên bề mặt điện thoại thông qua hình ảnh khách hàng tải lên để đưa ra điểm số hao mòn khách quan.
- **Kiến trúc**: Huấn luyện dựa trên PyTorch sử dụng mạng xương sống **EfficientNetV2-S** kết hợp hàm mất mát Focal Loss để xử lý mất cân bằng dữ liệu.
- **Dataset**: https://drive.google.com/file/d/1PW2CZ5ttmk3-2FrW5HE8AWTKZZ5C9mf9/view?usp=sharing
- **Đường dẫn tài liệu & Code huấn luyện**: [cv_model_training.md](backend/backend/ai_models/notebooks/cv_model_training.md).
- **Đường dẫn file mô hình ONNX đang chạy**: [cv_model.onnx](backend/backend/ai_models/models/cv_model.onnx) (Sử dụng onnxruntime để suy luận cực nhanh trên CPU).

### 2.2. Bộ phân loại Ý định Chatbot (Intent Classifier Model)
- **Mục đích**: Nhận diện ý định câu hỏi của khách hàng để điều phối luồng xử lý: Tư vấn sản phẩm, Hướng dẫn chính sách, Thu cũ đổi mới, hoặc Chuyện phiếm.
- **Kiến trúc**: Tinh chỉnh (fine-tune) mô hình **BERT-Tiny** bằng PyTorch trên tập dữ liệu câu hỏi tiếng Việt, sau đó xuất ra mô hình định dạng ONNX.
- **Đường dẫn code huấn luyện**: [train_intent_model.py](backend/backend/chatbot/scripts/train_intent_model.py).
- **Đường dẫn file mô hình ONNX đang chạy**: `backend/backend/chatbot/models/intent_classifier.onnx`.

### 2.3. Bộ định tuyến Hybrid LLM Router (Cloud/Local Routing)
- **Mục đích**: Cho phép chatbot linh hoạt chuyển đổi giữa LLM trên Cloud (Gemini API) và LLM Local tự host (Ollama/vLLM) nhằm tối ưu chi phí và tăng tính bảo mật/tự chủ.
- **Kiến trúc**: Triển khai trong [rag_pipeline.py](backend/backend/chatbot/rag_pipeline.py).
  - Tự động ưu tiên gọi API của mô hình Local chạy bằng Ollama khi `LLM_PROVIDER=local`.
  - **Cơ chế Fallback thông minh**: Nếu phát hiện server local offline hoặc lỗi kết nối, hệ thống tự động bắt lỗi và chuyển hướng (fallback) cuộc gọi sang Gemini API trên Cloud để đảm bảo chatbot hoạt động liên tục không gián đoạn.

---

## 💬 3. Hướng Dẫn Vận Hành & Nạp Dữ Liệu Cho Chatbot RAG

### 3.1. Chạy Script kiểm tra khóa API Gemini
Trước khi vận hành chatbot, hãy chạy kịch bản kiểm tra để đảm bảo khóa API Gemini trong `.env` hoạt động chính xác và kết nối thành công:
```powershell
$env:PYTHONIOENCODING="utf-8"
python chatbot/scripts/test_gemini_key.py
```

### 3.2. Nạp dữ liệu tài liệu quy trình hỗ trợ dạng Markdown (.md)
Khi cần nạp tri thức mới hoặc cập nhật các quy trình nghiệp vụ của website (như mua hàng, thu cũ, hoàn tiền) từ các file văn bản Markdown:

1.  Đặt các file `.md` tài liệu hỗ trợ vào thư mục: [backend/backend/media/support-docs/](backend/backend/media/support-docs/).
2.  Thực hiện chạy script import dữ liệu:
    ```powershell
    $env:PYTHONIOENCODING="utf-8"
    python chatbot/scripts/import_support_docs.py
    ```
    *Script sẽ tự động đọc, chuẩn hóa tiêu đề và đường dẫn URL, lưu vào Database và kích hoạt Signal tạo Vector Embedding qua Gemini API.*

### 3.3. Thêm dữ liệu tri thức trực tiếp qua Django Admin UI
Quản trị viên có thể trực tiếp bổ sung tri thức dạng văn bản tùy ý qua màn hình trực quan mà không cần viết file hay chạy code:

1.  Truy cập vào trang quản trị tại: `http://localhost:8000/django-admin/`.
2.  Di chuyển đến mục **Chatbot** -> **Tài liệu Website** (Website Documents) -> Nhấn **Thêm tài liệu** (Add).
3.  Nhập đầy đủ thông tin:
    - **Tiêu đề**: Tên tài liệu tri thức (Ví dụ: *Chính sách bảo dưỡng thiết bị*).
    - **Nội dung**: Chi tiết thông tin tư vấn.
    - **Đường dẫn URL**: Endpoint trỏ tới trang tương ứng (Ví dụ: `/support/chinh-sach-bao-duong`).
4.  Bấm **Lưu (Save)**. Django Signals sẽ tự động kích hoạt để gọi Gemini sinh Vector Embedding và lưu lại trực tiếp vào cơ sở dữ liệu.
5.  **Đồng bộ lại**: Nếu muốn tính toán lại vector cho một nhóm tài liệu, hãy tích chọn các tài liệu đó trong danh sách, tại ô Action chọn `Đồng bộ hóa Vector Embeddings cho tài liệu này` và nhấn **Go**.

### 3.4. Hướng dẫn Tích hợp Local LLM (Fine-tune LoRA & Ollama)
Khi bạn muốn chuyển chatbot từ sử dụng Gemini API sang một mô hình tự huấn luyện (ví dụ Llama-3-8B) chạy trực tiếp trên máy cá nhân:

1.  **Huấn luyện mô hình trên Kaggle**:
    - Sử dụng script và hướng dẫn tại file [fine_tune_llm_guide.md](backend/backend/chatbot/models/fine_tune_llm_guide.md) để fine-tune mô hình bằng phương pháp LoRA trên GPU T4 của Kaggle (sử dụng thư viện Unsloth để tối ưu tốc độ và VRAM).
    - Sau khi train xong, xuất mô hình sang định dạng GGUF (ví dụ `retech_model_q4-unsloth.gguf`) và tải về máy tính cá nhân.
2.  **Cài đặt Ollama**:
    - Tải và cài đặt Ollama từ [ollama.com](https://ollama.com).
3.  **Tạo Modelfile & Import**:
    - Tạo file tên là `Modelfile` (không có phần mở rộng) nằm cùng thư mục với file `.gguf` mới tải về với nội dung:
      ```dockerfile
      FROM ./retech_model_q4-unsloth.gguf
      PARAMETER temperature 0.2
      PARAMETER num_ctx 2048
      SYSTEM """
      Bạn là trợ lý ảo tư vấn mua sắm và chính sách thông minh của Retech Market. Hãy trả lời thân thiện, lịch sự và trung thực bằng tiếng Việt.
      """
      ```
    - Chạy lệnh build mô hình trong terminal:
      ```bash
      ollama create retech-bot -f Modelfile
      ```
4.  **Khởi chạy mô hình local**:
    ```bash
    ollama run retech-bot
    ```
5.  **Cấu hình dự án Django kết nối**:
    Cập nhật file `.env` của backend:
    ```env
    LLM_PROVIDER=local
    LOCAL_LLM_API_URL=http://localhost:11434/api/generate
    LOCAL_LLM_MODEL=retech-bot
    ```
    *Khởi động lại Django server. Giờ đây chatbot sẽ tự động gọi trực tiếp tới mô hình `retech-bot` đang chạy local trên máy của bạn!*

