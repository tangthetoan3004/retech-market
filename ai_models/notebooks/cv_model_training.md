# 🧠 Retech Market - CV Model Training Pipeline (PyTorch EfficientNetV2-S)

Tài liệu này cung cấp toàn bộ mã nguồn và pipeline chuyên nghiệp để huấn luyện mô hình phân loại hình ảnh (Computer Vision) phục vụ cho tính năng định giá Trade-in. Pipeline sử dụng **PyTorch**, huấn luyện trên **EfficientNetV2-S** tiền huấn luyện trên ImageNet, tối ưu cho Colab free T4 GPU và giải quyết vấn đề mất cân bằng dữ liệu bằng **Focal Loss**.

---

### Bước 1: Kết nối Google Drive & Thiết lập Môi trường
*Mount tài khoản Drive để lưu trữ checkpoint và cấu hình đường dẫn dữ liệu.*

```python
import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from google.colab import drive

# 1. Kết nối Google Drive
drive.mount('/content/drive')

# 2. Cấu hình đường dẫn lưu trữ trên Drive và Colab cục bộ
DRIVE_BASE_PATH = '/content/drive/MyDrive/retech_market'
ZIP_PATH = os.path.join(DRIVE_BASE_PATH, 'cv_cleaned.zip')
LOCAL_DATA_DIR = '/content/dataset'
CHECKPOINT_DIR = os.path.join(DRIVE_BASE_PATH, 'checkpoints')
os.makedirs(CHECKPOINT_DIR, exist_ok=True)
CHECKPOINT_PATH = os.path.join(CHECKPOINT_DIR, 'efficientnet_v2s_checkpoint.pth')

# 3. Cấu hình thiết bị (Ưu tiên GPU T4 trên Colab)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Đang sử dụng thiết bị: {device}")
```

### Bước 2: Giải nén Dữ liệu Cục bộ
*Giải nén tệp zip từ Google Drive vào ổ đĩa cục bộ của Colab để tăng tốc độ nạp dữ liệu khi huấn luyện.*

```python
import zipfile
import shutil

# Giải nén dữ liệu vào thư mục cục bộ /content/dataset
if os.path.exists(LOCAL_DATA_DIR):
    shutil.rmtree(LOCAL_DATA_DIR)
os.makedirs(LOCAL_DATA_DIR, exist_ok=True)

if os.path.exists(ZIP_PATH):
    print(f"Bắt đầu giải nén {ZIP_PATH} vào {LOCAL_DATA_DIR}...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(LOCAL_DATA_DIR)
    print("Giải nén dữ liệu hoàn tất!")
else:
    print(f"⚠️ Cảnh báo: Không tìm thấy file zip tại {ZIP_PATH}. Vui lòng tải dữ liệu lên Drive đúng đường dẫn!")
```

### Bước 3: Chia Dữ liệu Phân tầng (Stratified 70/15/15) & Custom Dataset
*Quét cấu trúc thư mục tự động làm tên lớp, chia tập dữ liệu và định nghĩa lớp Dataset trong PyTorch.*

```python
import glob
from PIL import Image
from sklearn.model_selection import train_test_split

# 1. Tự động quét các thư mục con sau giải nén để làm tên lớp (Classes)
subdirs = [d for d in os.listdir(LOCAL_DATA_DIR) if os.path.isdir(os.path.join(LOCAL_DATA_DIR, d))]
# Xử lý trường hợp file zip giải nén ra một thư mục cha trung gian
if len(subdirs) == 1 and subdirs[0] in ['cv_raw', 'cv_cleaned', 'dataset']:
    dataset_root = os.path.join(LOCAL_DATA_DIR, subdirs[0])
    subdirs = [d for d in os.listdir(dataset_root) if os.path.isdir(os.path.join(dataset_root, d))]
else:
    dataset_root = LOCAL_DATA_DIR

classes = sorted(subdirs)
class_to_idx = {cls_name: i for i, cls_name in enumerate(classes)}
print(f"Các lớp phát hiện được từ dữ liệu: {class_to_idx}")

image_paths = []
labels = []

# Quét tất cả ảnh (.jpg, .jpeg, .png) trong từng thư mục lớp
valid_extensions = ('*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG')
for cls_name in classes:
    cls_dir = os.path.join(dataset_root, cls_name)
    cls_idx = class_to_idx[cls_name]
    for ext in valid_extensions:
        files = glob.glob(os.path.join(cls_dir, ext))
        for f in files:
            image_paths.append(f)
            labels.append(cls_idx)

print(f"Tổng số ảnh thu thập được: {len(image_paths)}")

# 2. Chia tập dữ liệu phân tầng: 70% Train, 15% Validation, 15% Test
# Chia thành Train (70%) và Temp (30%)
train_paths, temp_paths, train_labels, temp_labels = train_test_split(
    image_paths, labels, test_size=0.30, stratify=labels, random_state=42
)

# Chia Temp thành Val (15%) và Test (15%)
val_paths, test_paths, val_labels, test_labels = train_test_split(
    temp_paths, temp_labels, test_size=0.50, stratify=temp_labels, random_state=42
)

print(f"Tập Train: {len(train_paths)} ảnh")
print(f"Tập Val: {len(val_paths)} ảnh")
print(f"Tập Test: {len(test_paths)} ảnh")

# 3. Định nghĩa PyTorch Custom Dataset để load ảnh động
class CustomImageDataset(Dataset):
    def __init__(self, paths, labels, transform=None):
        self.paths = paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, idx):
        img_path = self.paths[idx]
        image = Image.open(img_path).convert('RGB')
        label = self.labels[idx]
        
        if self.transform:
            image = self.transform(image)
            
        return image, label
```

### Bước 4: Định nghĩa Phương pháp Augmentation (Tăng cường dữ liệu)
*Áp dụng các kỹ thuật biến đổi ảnh ngẫu nhiên giúp mô hình tránh bị Overfitting.*

```python
# Định nghĩa các phép chuyển đổi ảnh (transforms)
train_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.2),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]) # Chuẩn hóa theo ImageNet
])

val_test_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Khởi tạo Datasets
train_dataset = CustomImageDataset(train_paths, train_labels, transform=train_transforms)
val_dataset = CustomImageDataset(val_paths, val_labels, transform=val_test_transforms)
test_dataset = CustomImageDataset(test_paths, test_labels, transform=val_test_transforms)

# Khởi tạo Dataloaders cho PyTorch
BATCH_SIZE = 32
train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2, pin_memory=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)
test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2, pin_memory=True)
```

### Bước 5: Thiết lập Kiến trúc Mô hình EfficientNetV2-S
*Sử dụng mô hình pretrained chất lượng cao và tùy chỉnh lớp đầu ra cho bài toán đa lớp.*

```python
# Tải mô hình EfficientNetV2-S tiền huấn luyện từ torchvision
weights = models.EfficientNet_V2_S_Weights.DEFAULT
model = models.efficientnet_v2_s(weights=weights)

# Thay thế lớp classifier cuối cùng cho phù hợp với số lượng lớp thực tế
num_features = model.classifier[1].in_features
model.classifier[1] = nn.Linear(num_features, len(classes))

# Chuyển mô hình vào thiết bị tính toán (GPU/CPU)
model = model.to(device)
print(f"Mô hình EfficientNetV2-S đã sẵn sàng với {len(classes)} ngõ ra!")
```

### Bước 6: Định nghĩa Custom Loss - Focal Loss
*Cài đặt Focal Loss để giúp mô hình tập trung học các mẫu khó phân loại và giải quyết mất cân bằng dữ liệu.*

```python
class FocalLoss(nn.Module):
    def __init__(self, alpha=None, gamma=2.0, reduction='mean'):
        super(FocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

        if isinstance(alpha, (float, int)):
            self.alpha = torch.Tensor([alpha, 1 - alpha])
        if isinstance(alpha, list):
            self.alpha = torch.Tensor(alpha)

    def forward(self, inputs, targets):
        # Tính Loss Cross Entropy không rút gọn trước
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss) # Xác suất dự đoán đúng lớp thực tế
        
        # Áp dụng trọng số lớp alpha nếu được định nghĩa
        if self.alpha is not None:
            self.alpha = self.alpha.to(inputs.device)
            alpha_t = self.alpha[targets]
            focal_loss = alpha_t * (1 - pt) ** self.gamma * ce_loss
        else:
            focal_loss = (1 - pt) ** self.gamma * ce_loss

        # Rút gọn loss theo yêu cầu
        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        else:
            return focal_loss
```

### Bước 7: Phục hồi Huấn luyện từ Checkpoint
*Kiểm tra và nạp checkpoint từ Google Drive để tiếp tục quá trình học mà không cần train lại từ đầu.*

```python
import torch.optim as optim

# Định nghĩa hàm Loss, Optimizer và Bộ điều chỉnh tốc độ học (Scheduler)
criterion = FocalLoss(gamma=2.0)
optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

start_epoch = 0
best_val_acc = 0.0
train_losses = []
val_losses = []
train_accs = []
val_accs = []

# Kiểm tra sự tồn tại của checkpoint trên Google Drive
if os.path.exists(CHECKPOINT_PATH):
    print(f"Tìm thấy checkpoint! Đang tiến hành nạp từ {CHECKPOINT_PATH}...")
    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    start_epoch = checkpoint['epoch'] + 1
    best_val_acc = checkpoint['best_val_acc']
    train_losses = checkpoint.get('train_losses', [])
    val_losses = checkpoint.get('val_losses', [])
    train_accs = checkpoint.get('train_accs', [])
    val_accs = checkpoint.get('val_accs', [])
    print(f"Khôi phục thành công! Tiếp tục huấn luyện từ epoch {start_epoch + 1} (Val Acc tốt nhất hiện tại: {best_val_acc:.4f})")
else:
    print("Không tìm thấy checkpoint trên Drive. Bắt đầu huấn luyện mới từ đầu.")
```

### Bước 8: Vòng lặp Huấn luyện (Training Loop) & Auto-Save
*Huấn luyện mô hình, kiểm tra độ chính xác sau mỗi epoch và lưu checkpoint tự động lên Drive.*

```python
import time

num_epochs = 20
print("Bắt đầu huấn luyện...")

for epoch in range(start_epoch, num_epochs):
    epoch_start = time.time()
    
    # 1. Giai đoạn Huấn luyện (Training Phase)
    model.train()
    running_loss = 0.0
    correct_train = 0
    total_train = 0
    
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct_train += (preds == labels).sum().item()
        total_train += labels.size(0)
        
    epoch_train_loss = running_loss / len(train_dataset)
    epoch_train_acc = correct_train / total_train
    
    # 2. Giai đoạn Đánh giá (Validation Phase)
    model.eval()
    running_val_loss = 0.0
    correct_val = 0
    total_val = 0
    
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            running_val_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct_val += (preds == labels).sum().item()
            total_val += labels.size(0)
            
    epoch_val_loss = running_val_loss / len(val_dataset)
    epoch_val_acc = correct_val / total_val
    
    # Cập nhật tốc độ học dựa theo Val Loss
    scheduler.step(epoch_val_loss)
    
    # Lưu kết quả vào danh sách lịch sử
    train_losses.append(epoch_train_loss)
    val_losses.append(epoch_val_loss)
    train_accs.append(epoch_train_acc)
    val_accs.append(epoch_val_acc)
    
    epoch_duration = time.time() - epoch_start
    print(f"Epoch {epoch+1}/{num_epochs} [{epoch_duration:.0f}s] - "
          f"Train Loss: {epoch_train_loss:.4f}, Train Acc: {epoch_train_acc:.4f} | "
          f"Val Loss: {epoch_val_loss:.4f}, Val Acc: {epoch_val_acc:.4f}")
    
    # 3. Lưu checkpoint định kỳ lên Drive
    checkpoint_data = {
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'best_val_acc': max(best_val_acc, epoch_val_acc),
        'train_losses': train_losses,
        'val_losses': val_losses,
        'train_accs': train_accs,
        'val_accs': val_accs
    }
    torch.save(checkpoint_data, CHECKPOINT_PATH)
    print(f"-> Checkpoint phục hồi đã được lưu tại {CHECKPOINT_PATH}")
    
    # Lưu trọng số mô hình tốt nhất đạt được
    if epoch_val_acc > best_val_acc:
        best_val_acc = epoch_val_acc
        best_model_path = os.path.join(CHECKPOINT_DIR, 'efficientnet_v2s_best.pth')
        torch.save(model.state_dict(), best_model_path)
        print(f"🔥 Phát hiện mô hình tốt nhất mới! Val Acc: {best_val_acc:.4f}. Đã lưu trọng số.")

print("Huấn luyện hoàn tất!")
```

### Bước 9: Trực quan hóa Lịch sử Huấn luyện (Loss & Accuracy Curves)
*Vẽ biểu đồ Loss và Accuracy để phân tích hiệu suất và kiểm tra Overfitting.*

```python
import matplotlib.pyplot as plt

epochs_range = range(1, len(train_losses) + 1)

plt.figure(figsize=(15, 5))

# Đồ thị biểu diễn sự thay đổi của Loss
plt.subplot(1, 2, 1)
plt.plot(epochs_range, train_losses, label='Train Loss', color='blue', marker='o')
plt.plot(epochs_range, val_losses, label='Val Loss', color='red', marker='x')
plt.title('Đồ thị Loss Curves')
plt.xlabel('Epochs')
plt.ylabel('Loss')
plt.legend()
plt.grid(True)

# Đồ thị biểu diễn sự thay đổi của Accuracy
plt.subplot(1, 2, 2)
plt.plot(epochs_range, train_accs, label='Train Accuracy', color='blue', marker='o')
plt.plot(epochs_range, val_accs, label='Val Accuracy', color='red', marker='x')
plt.title('Đồ thị Accuracy Curves')
plt.xlabel('Epochs')
plt.ylabel('Accuracy')
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.show()
```

### Bước 10: Đánh giá chi tiết trên Tập dữ liệu Test & Dự đoán Trực quan
*Sử dụng mô hình tốt nhất để kiểm tra hiệu năng trên tập Test, vẽ Confusion Matrix, biểu đồ F1-Score và hiển thị 5 ảnh dự đoán mẫu.*

```python
import numpy as np
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, f1_score

# Nạp trọng số mô hình tốt nhất để bắt đầu đánh giá
best_model_path = os.path.join(CHECKPOINT_DIR, 'efficientnet_v2s_best.pth')
if os.path.exists(best_model_path):
    print(f"Đang nạp trọng số tốt nhất từ {best_model_path}...")
    model.load_state_dict(torch.load(best_model_path, map_location=device))
    print("Nạp trọng số thành công!")

model.eval()
all_preds = []
all_targets = []
test_images_sample = []
test_labels_sample = []
test_preds_sample = []

# Đánh giá tập Test
with torch.no_grad():
    for images, labels in test_loader:
        images_dev = images.to(device)
        outputs = model(images_dev)
        _, preds = torch.max(outputs, 1)
        
        all_preds.extend(preds.cpu().numpy())
        all_targets.extend(labels.numpy())
        
        # Lưu lại một số mẫu ảnh để vẽ minh họa trực quan
        if len(test_images_sample) < 5:
            test_images_sample.append(images[0])
            test_labels_sample.append(labels[0].item())
            test_preds_sample.append(preds[0].item())

# 1. In báo cáo phân loại chi tiết (Classification Report)
print("\n📊 BÁO CÁO PHÂN LOẠI CHI TIẾT (CLASSIFICATION REPORT):")
report = classification_report(all_targets, all_preds, target_names=classes)
print(report)

# 2. Vẽ đồ thị F1-Score cho từng lớp
f1_scores = f1_score(all_targets, all_preds, average=None)
plt.figure(figsize=(10, 5))
plt.bar(classes, f1_scores, color='skyblue', edgecolor='black')
plt.title('Đồ thị F1-Score cho từng lớp')
plt.xlabel('Lớp')
plt.ylabel('F1-Score')
plt.ylim(0, 1.05)
for i, v in enumerate(f1_scores):
    plt.text(i, v + 0.02, f"{v:.2f}", ha='center', fontweight='bold')
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.show()

# 3. Vẽ Ma trận nhầm lẫn (Confusion Matrix)
cm = confusion_matrix(all_targets, all_preds)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes)
plt.title('Ma Trận Nhầm Lẫn (Confusion Matrix)')
plt.xlabel('Lớp dự đoán (Predicted)')
plt.ylabel('Lớp thực tế (Actual)')
plt.show()

# 4. Trực quan hóa 5 ảnh mẫu cùng kết quả dự đoán của mô hình
def imshow(img, title):
    # Mean và Std sử dụng để chuẩn hóa ImageNet
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    
    npimg = img.numpy().transpose((1, 2, 0))
    npimg = std * npimg + mean  # Đảo ngược quá trình chuẩn hóa (unnormalize)
    npimg = np.clip(npimg, 0, 1)
    
    plt.imshow(npimg)
    plt.title(title, fontsize=12, color='green' if 'Đúng' in title else 'red')
    plt.axis('off')

plt.figure(figsize=(20, 4))
for idx in range(min(len(test_images_sample), 5)):
    plt.subplot(1, 5, idx + 1)
    actual_class = classes[test_labels_sample[idx]]
    pred_class = classes[test_preds_sample[idx]]
    is_correct = "Đúng" if test_labels_sample[idx] == test_preds_sample[idx] else "Sai"
    
    title = f"Thực tế: {actual_class}\nDự đoán: {pred_class}\n({is_correct})"
    imshow(test_images_sample[idx], title)

plt.tight_layout()
plt.show()
```

### Bước 11: Tải Mô hình & Dự đoán từ Liên kết Ảnh (URL)
*Tải hình ảnh từ liên kết URL ngẫu nhiên, thực hiện tiền xử lý và sử dụng mô hình tốt nhất để dự đoán lớp tương ứng.*

```python
import requests
from io import BytesIO
import matplotlib.pyplot as plt

# 1. Định nghĩa hàm dự đoán ảnh từ một URL
def predict_image_url(image_url, model_path, classes):
    # Thiết lập thiết bị tính toán
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Khởi tạo lại cấu trúc mô hình (EfficientNetV2-S)
    weights = models.EfficientNet_V2_S_Weights.DEFAULT
    model = models.efficientnet_v2_s(weights=weights)
    num_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_features, len(classes))
    
    # Nạp trọng số mô hình đã huấn luyện
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device))
        print(f"Đã nạp trọng số mô hình tốt nhất từ {model_path}")
    else:
        raise FileNotFoundError(f"Không tìm thấy file trọng số tại {model_path}")
        
    model = model.to(device)
    model.eval()
    
    # 2. Tải ảnh từ URL
    print(f"Đang tải ảnh từ URL: {image_url}...")
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(image_url, headers=headers)
    img = Image.open(BytesIO(response.content)).convert('RGB')
    
    # 3. Tiền xử lý ảnh (giống val_test_transforms ở Bước 4)
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    img_tensor = preprocess(img).unsqueeze(0).to(device) # Thêm dimension batch: [1, 3, 224, 224]
    
    # 4. Dự đoán
    with torch.no_grad():
        outputs = model(img_tensor)
        probabilities = F.softmax(outputs, dim=1)
        confidence, pred_idx = torch.max(probabilities, 1)
        
    pred_class = classes[pred_idx.item()]
    confidence_val = confidence.item() * 100
    
    print(f"\n🎉 Kết quả dự đoán:")
    print(f"👉 Lớp dự đoán: {pred_class}")
    print(f"👉 Độ tin cậy (Confidence): {confidence_val:.2f}%")
    
    # Hiển thị ảnh kèm kết quả
    plt.imshow(img)
    plt.title(f"Dự đoán: {pred_class} ({confidence_val:.2f}%)")
    plt.axis('off')
    plt.show()

# 5. Chạy thử nghiệm dự đoán
# Thay thế URL bên dưới bằng link ảnh sản phẩm bạn muốn kiểm tra
sample_url = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500"
best_model_path = os.path.join(CHECKPOINT_DIR, 'efficientnet_v2s_best.pth')

try:
    predict_image_url(sample_url, best_model_path, classes)
except Exception as e:
    print(f"Lỗi khi thực hiện dự đoán: {e}")
```

### Bước 12: Xuất mô hình sang định dạng ONNX
*Sau khi huấn luyện xong mô hình tốt nhất, ta cần xuất nó sang định dạng ONNX để tích hợp vào Backend Django. Định dạng này giúp ứng dụng chạy nhẹ hơn và không cần nạp toàn bộ thư viện PyTorch.*

```python
import torch
import torch.nn as nn
from torchvision import models

def export_to_onnx(pytorch_model_path, onnx_model_output_path, num_classes=4):
    # 1. Khởi tạo cấu trúc mô hình gốc (EfficientNetV2-S)
    weights = models.EfficientNet_V2_S_Weights.DEFAULT
    model = models.efficientnet_v2_s(weights=weights)
    num_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_features, num_classes)
    
    # 2. Nạp trọng số từ checkpoint đã lưu (.pth hoặc .pt)
    state_dict = torch.load(pytorch_model_path, map_location='cpu')
    # Nếu checkpoint lưu kèm các thông tin khác như epoch, optimizer...
    if 'model_state_dict' in state_dict:
        model.load_state_dict(state_dict['model_state_dict'])
    else:
        model.load_state_dict(state_dict)
        
    model.eval()
    
    # 3. Tạo dữ liệu giả lập (dummy input) có kích thước 1x3x224x224 (BCHW)
    dummy_input = torch.randn(1, 3, 224, 224, requires_grad=False)
    
    # 4. Xuất mô hình sang file ONNX
    print(f"Đang xuất mô hình từ {pytorch_model_path} sang {onnx_model_output_path}...")
    torch.onnx.export(
        model,
        dummy_input,
        onnx_model_output_path,
        export_params=True,
        opset_version=15, # Opset version tương thích cao
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print("Xuất mô hình sang ONNX thành công!")

# Đường dẫn tệp tin
best_model_path = os.path.join(CHECKPOINT_DIR, 'efficientnet_v2s_best.pth')
onnx_output_path = os.path.join(DRIVE_BASE_PATH, 'cv_model.onnx')

export_to_onnx(best_model_path, onnx_output_path, num_classes=len(classes))
```


