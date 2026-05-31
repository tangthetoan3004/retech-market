import os
import requests
import numpy as np

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import Dataset, DataLoader
    from transformers import BertTokenizer, BertModel
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

training_data = [
    # 0: tu_van_san_pham
    ("tôi muốn mua iphone 13 pro max cũ", 0),
    ("ở đây còn samsung s22 ultra likenew không", 0),
    ("iphone 12 giá bao nhiêu vậy shop", 0),
    ("tìm cho mình điện thoại cũ giá dưới 10 triệu", 0),
    ("máy này còn pin bao nhiêu phần trăm", 0),
    ("sản phẩm này có kèm sạc cáp không", 0),
    
    # 1: chinh_sach
    ("chính sách bảo hành của cửa hàng thế nào", 1),
    ("máy cũ có được đổi trả nếu lỗi không", 1),
    ("shop hỗ trợ ship cod toàn quốc không", 1),
    ("tôi muốn thanh toán qua zalopay được không", 1),
    ("thời hạn bảo hành của máy likenew là bao lâu", 1),
    ("nếu không ưng ý có được hoàn tiền không", 1),
    
    # 2: ban_may_cu
    ("tôi muốn bán lại con iphone 11 cũ", 2),
    ("quy trình thu cũ đổi mới diễn ra như thế nào", 2),
    ("shop định giá thu mua máy cũ ra sao", 2),
    ("làm sao để bán máy cũ lấy tiền mặt", 2),
    ("máy bị trầy xước nhẹ shop có thu mua không", 2),
    ("muốn thẩm định giá điện thoại cũ trực tuyến", 2),
    
    # 3: chuyen_phiem
    ("xin chào chatbot", 3),
    ("hello shop nha", 3),
    ("bạn là ai thế", 3),
    ("chúc shop một ngày tốt lành", 3),
    ("chatbot có thông minh không", 3),
    ("tạm biệt nhé", 3)
]

if TORCH_AVAILABLE:
    class IntentDataset(Dataset):
        def __init__(self, data, tokenizer, max_len=32):
            self.texts = [item[0] for item in data]
            self.labels = [item[1] for item in data]
            self.tokenizer = tokenizer
            self.max_len = max_len

        def __len__(self):
            return len(self.texts)

        def __getitem__(self, idx):
            text = self.texts[idx]
            label = self.labels[idx]
            
            encoding = self.tokenizer(
                text,
                add_special_tokens=True,
                max_length=self.max_len,
                padding='max_length',
                truncation=True,
                return_tensors='pt'
            )
            
            return {
                'input_ids': encoding['input_ids'].flatten(),
                'attention_mask': encoding['attention_mask'].flatten(),
                'label': torch.tensor(label, dtype=torch.long)
            }

    class BertIntentClassifier(nn.Module):
        def __init__(self, model_name, num_classes=4):
            super(BertIntentClassifier, self).__init__()
            self.bert = BertModel.from_pretrained(model_name)
            self.drop = nn.Dropout(0.1)
            self.out = nn.Linear(self.bert.config.hidden_size, num_classes)

        def forward(self, input_ids, attention_mask):
            outputs = self.bert(
                input_ids=input_ids,
                attention_mask=attention_mask
            )
            pooled_output = outputs[0][:, 0, :]
            output = self.drop(pooled_output)
            return self.out(output)

def train_and_export():
    if not TORCH_AVAILABLE:
        print("Lỗi: Không tìm thấy thư viện torch hoặc transformers.")
        print("Vui lòng cài đặt chúng trước bằng cách chạy: ")
        print("   pip install torch transformers onnx onnxruntime")
        return

    MODEL_NAME = "prajjwal1/bert-tiny" 
    print(f"Đang tải pre-trained tokenizer và model {MODEL_NAME}...")
    tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
    
    dataset = IntentDataset(training_data, tokenizer)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)
    
    model = BertIntentClassifier(MODEL_NAME, num_classes=4)
    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-5)
    loss_fn = nn.CrossEntropyLoss()
    
    print("Bắt đầu huấn luyện mô hình Intent Classifier (5 epochs)...")
    model.train()
    for epoch in range(5):
        total_loss = 0
        for batch in dataloader:
            input_ids = batch['input_ids']
            attention_mask = batch['attention_mask']
            labels = batch['label']
            
            optimizer.zero_grad()
            outputs = model(input_ids, attention_mask)
            loss = loss_fn(outputs, labels)
            
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            
        print(f"   Epoch {epoch + 1}/5 - Loss: {total_loss/len(dataloader):.4f}")
        
    print("Huấn luyện hoàn tất!")
    
    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
    os.makedirs(models_dir, exist_ok=True)
    
    onnx_path = os.path.join(models_dir, "intent_classifier.onnx")
    print(f"Đang xuất mô hình sang định dạng ONNX tại: {onnx_path}...")
    
    model.eval()
    dummy_input_ids = torch.randint(0, 1000, (1, 32), dtype=torch.long)
    dummy_attention_mask = torch.ones((1, 32), dtype=torch.long)
    
    torch.onnx.export(
        model,
        (dummy_input_ids, dummy_attention_mask),
        onnx_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input_ids', 'attention_mask'],
        output_names=['output'],
        dynamic_axes={
            'input_ids': {0: 'batch_size'},
            'attention_mask': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    print("Xuất mô hình ONNX thành công!")

if __name__ == "__main__":
    train_and_export()
