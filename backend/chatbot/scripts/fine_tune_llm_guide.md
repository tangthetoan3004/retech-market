# Hướng dẫn chi tiết: Huấn luyện LLM bằng LoRA trên Kaggle & Deploy API cục bộ

Tài liệu này hướng dẫn chi tiết quy trình từ lúc xuất dữ liệu dự án, huấn luyện (fine-tune) mô hình ngôn ngữ lớn (LLM) bằng phương pháp LoRA trên Kaggle (sử dụng GPU T4 miễn phí), cho đến cấu hình deploy local bằng Ollama và tích hợp vào hệ thống RAG của Retech Market.

---

## 📅 Phần 1: Chuẩn bị dữ liệu huấn luyện (Dataset Preparation)

Mô hình LLM cần được huấn luyện theo định dạng Chat (ChatML hoặc Instruction-Response). Chúng ta sẽ trích xuất dữ liệu từ các tài liệu hỗ trợ (`WebsiteDocument`) và lịch sử chat mẫu để tạo dataset.

### 1. Cấu trúc dữ liệu chuẩn (JSONL)
Mỗi dòng trong file dữ liệu huấn luyện (`dataset.jsonl`) phải có định dạng hội thoại của Hugging Face:
```json
{"messages": [{"role": "system", "content": "Bạn là trợ lý ảo vui vẻ, lịch sự của Retech Market..."}, {"role": "user", "content": "Cửa hàng có chính sách thu mua máy cũ không?"}, {"role": "assistant", "content": "Dạ có ạ! Retech Market hỗ trợ thu mua điện thoại cũ..."}]}
```

### 2. Script xuất dữ liệu tự động từ Django
Bạn có thể chạy script python này trên server Django để tạo file dataset:
```python
# chatbot/scripts/export_dataset.py
import json
import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from chatbot.models import WebsiteDocument, ChatMessage, ChatSession

dataset = []
system_prompt = "Bạn là trợ lý ảo tư vấn mua sắm và chính sách thông minh của Retech Market. Hãy trả lời thân thiện, lễ phép và trung thực."

for doc in WebsiteDocument.objects.filter(is_active=True):
    user_queries = [
        f"Thông tin về {doc.title.lower()} là gì?",
        f"Cho mình hỏi về {doc.title.lower()}",
        doc.title
    ]
    for query in user_queries:
        dataset.append({
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
                {"role": "assistant", "content": doc.content}
            ]
        })

output_path = "media/ai_datasets/chat_dataset.jsonl"
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    for item in dataset:
        f.write(json.dumps(item, ensure_ascii=False) + "\n")

print(f"Đã xuất thành công {len(dataset)} mẫu dữ liệu huấn luyện tại: {output_path}")
```

---

## 🧪 Phần 2: Huấn luyện LLM bằng LoRA trên Kaggle (Unsloth)

Chúng ta sử dụng thư viện **Unsloth** trên Kaggle vì nó tối ưu hóa bộ nhớ cực tốt, cho phép fine-tune mô hình **Llama-3.2-1B** hoặc **Qwen-2.5-3B** trên 1 GPU T4 (16GB VRAM) nhanh gấp nhiều lần so với Hugging Face chuẩn.

### 1. Thiết lập Notebook trên Kaggle
* Tạo Notebook mới trên Kaggle.
* Trong phần **Settings** ở thanh bên phải, chọn **Accelerator** là **GPU T4 x1**.
* Bật kết nối Internet (**Internet on**).

### 2. Cài đặt các thư viện cần thiết
Chạy cell đầu tiên trong notebook để dọn dẹp và cài đặt Unsloth phiên bản tương thích ổn định.

> [!IMPORTANT]
> **BẮT BUỘC:** Sau khi chạy xong cell cài đặt này, bạn phải vào menu của Kaggle chọn **Session -> Restart Session** (hoặc **Kernel -> Restart**) trước khi chạy cell huấn luyện tiếp theo để Python nạp đúng phiên bản thư viện mới!

```bash
!pip uninstall -y unsloth unsloth_zoo trl transformers datasets peft accelerate bitsandbytes torchao

!pip install --no-cache-dir \
    "unsloth[kaggle-new] @ git+https://github.com/unslothai/unsloth.git" \
    unsloth_zoo \
    msgspec \
    tyro \
    hf_transfer \
    "torchao>=0.13.0" \
    "datasets>=3.4.1,<4.4.0" \
    "transformers>=4.51.3,<=5.5.0" \
    "trl>=0.18.2,<=0.24.0" \
    peft \
    accelerate \
    bitsandbytes
```

### 3. Mã nguồn huấn luyện (Python Notebook Cell)
```python
import torch
from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer, SFTConfig

max_seq_length = 2048 
dtype = None 
load_in_4bit = True 

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Llama-3.2-1B-Instruct-bnb-4bit", 
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

model = FastLanguageModel.get_peft_model(
    model,
    r = 16, 
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 32,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

def format_prompts(examples):
    messages = examples["messages"]
    texts = []
    for msg in messages:
        text = tokenizer.apply_chat_template(msg, tokenize=False, add_generation_prompt=False)
        texts.append(text)
    return { "text" : texts }

# Upload file dataset.jsonl lên Kaggle và load vào
dataset = load_dataset("json", data_files="/kaggle/input/chat-dataset/chat_dataset.jsonl", split="train")
dataset = dataset.map(format_prompts, batched=True)

trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False,
    args = SFTConfig(
        per_device_train_batch_size = 4,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60,
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

trainer_stats = trainer.train()
```

### 4. Xuất mô hình sang định dạng GGUF (Để chạy local với Ollama)
Sau khi huấn luyện xong, chúng ta cần chuyển đổi và lưu trực tiếp mô hình đã merge sang định dạng GGUF (lượng tử hóa 4-bit).

> [!TIP]
> **Giải quyết vấn đề ổ đĩa:** Do Kaggle giới hạn dung lượng `/kaggle/working`, chúng ta chuyển CWD sang thư mục `/tmp` trước khi gọi lệnh lưu mô hình. Sau khi hoàn tất lượng tử hóa, sao chép file `.gguf` q4_k_m cuối cùng (~800MB - 1GB) về `/kaggle/working/` để tải xuống.

Chạy đoạn code sau trong notebook:
```python
# 1. Dọn dẹp sạch sẽ ổ đĩa khỏi các file rác bị ghi dở từ lần chạy trước
!rm -rf /kaggle/working/*gguf /kaggle/working/retech_model_llama1b /kaggle/working/outputs

import os
import shutil
import glob

# 2. Chuyển CWD sang /tmp để tránh tràn đĩa
old_cwd = os.getcwd()
os.chdir("/tmp")

# 3. Lưu mô hình và GGUF vào thư mục tạm /tmp
model.save_pretrained_gguf(
    "retech_model_llama1b", 
    tokenizer, 
    quantization_method = "q4_k_m",
    temporary_location = "/tmp"
)

# 4. Trở lại thư mục làm việc cũ
os.chdir(old_cwd)

# 5. Sao chép file GGUF cuối cùng từ /tmp về thư mục làm việc /kaggle/working/
gguf_files = glob.glob("/tmp/*retech_model_llama1b*.gguf")
for f in gguf_files:
    dest = os.path.join("/kaggle/working/", os.path.basename(f))
    print(f"Sao chép file GGUF thành công: {f} -> {dest}")
    shutil.copy(f, dest)
```
Tải file `retech_model_llama1b-unsloth.gguf` từ mục `/kaggle/working/` về máy tính cá nhân của bạn.

---

## 💻 Phần 3: Deploy API Cục bộ (Local Deployment) bằng Ollama

Ollama là thư viện chạy LLM local tối ưu và đơn giản nhất, cung cấp sẵn API tương thích cao.

### 1. Cài đặt Ollama
Tải và cài đặt Ollama từ trang chủ [ollama.com](https://ollama.com) cho Windows/macOS/Linux.

### 2. Tạo Modelfile
Tạo một file có tên là `Modelfile` (không có đuôi mở rộng) nằm cùng thư mục với file `.gguf` bạn vừa tải về:
```dockerfile
FROM ./retech_model_llama1b-unsloth.gguf

PARAMETER temperature 0.2
PARAMETER num_ctx 2048

SYSTEM """
Bạn là trợ lý ảo tư vấn mua sắm và chính sách thông minh của website Retech Market. Hãy trả lời bằng tiếng Việt một cách lễ phép, lịch sự và trung thực.
"""
```

### 3. Tạo và Khởi chạy mô hình trong Ollama
Mở PowerShell/Terminal tại thư mục chứa file Modelfile và chạy lệnh:
```bash
# 1. Tạo model trong hệ thống Ollama
ollama create retech-bot -f Modelfile

# 2. Khởi chạy thử trên Terminal để kiểm tra
ollama run retech-bot
```
Sau khi chạy thành công, Ollama sẽ tự động mở một API server lắng nghe tại địa chỉ: `http://localhost:11434/api/generate`.

---

## 🔌 Phần 4: Tích hợp vào Django (Hybrid LLM Router)

Chúng ta cấu trúc lại `rag_pipeline.py` để hỗ trợ cơ chế:
1. Gửi câu hỏi đến Local Ollama API trước.
2. Nếu Ollama không phản hồi (chưa bật server hoặc lỗi), tự động chuyển hướng (fallback) cuộc gọi sang Google Gemini API.

### Cấu hình `.env` trên local:
```env
LLM_PROVIDER=local
LOCAL_LLM_API_URL=http://localhost:11434/api/generate
LOCAL_LLM_MODEL=retech-bot
GEMINI_API_KEY=AIzaSy... (dùng làm dự phòng)
```
