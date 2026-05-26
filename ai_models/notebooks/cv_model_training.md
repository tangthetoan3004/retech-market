# 🧠 Retech Market - CV Model Training Pipeline (Professional)
**Mục tiêu:** Phân loại đa nhiệm tình trạng thiết bị (2 Tasks: Screen Status, Body Status)  
**Kiến trúc:** MobileNetV2 Multi-head + SE Block (Keras)  
**Tối ưu:** Multi-task Binary Crossentropy, Mixed Precision, tf.data.

---

### Bước 1: Setup Môi trường & Mixed Precision
*Tối ưu cho T4 GPU trên Colab.*

```python
import os
import gc
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from google.colab import drive

# 3. Cài đặt Albumentations & tf2onnx
!pip install -q -U albumentations tf2onnx onnxruntime

import tensorflow as tf
import albumentations as A
import cv2
from tensorflow.keras import layers, models, Model, regularizers, mixed_precision
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.model_selection import StratifiedKFold

# 1. Mount Drive
drive.mount('/content/drive')

# 2. Cấu hình đường dẫn
DRIVE_BASE_PATH = '/content/drive/MyDrive/retech_market'
ZIP_PATH = os.path.join(DRIVE_BASE_PATH, 'cv_cleaned.zip') # Lưu ý: Nén thư mục cv_raw sau khi đã chạy script clean
LOCAL_DATA_DIR = '/content/dataset'
MODEL_SAVE_DIR = os.path.join(DRIVE_BASE_PATH, 'models/cv_v1')
os.makedirs(MODEL_SAVE_DIR, exist_ok=True)

# 3. Kích hoạt Mixed Precision (Tăng tốc T4 GPU)
policy = mixed_precision.Policy('mixed_float16')
mixed_precision.set_global_policy(policy)
print('Compute dtype: %s' % policy.compute_dtype)
print('Variable dtype: %s' % policy.variable_dtype)
```

### Bước 2: Chuẩn bị Dữ liệu (Class Mapping & tf.data)
*Gộp 5 classes từ Crawler thành 3 classes thực tế cho Trade-in.*

```python
import shutil

def prepare_and_map_dataset(raw_dir, target_dir):
    """Gộp các folder từ crawler vào 3 class chính."""
    mapping = {
        'good_condition':    [1, 1], # [screen_ok, body_ok]
        'screen_cracked':    [0, 1],
        'screen_dead_pixel': [0, 1],
        'body_scratched':    [1, 0],
        'body_dented':       [1, 0]
    }
    
    if os.path.exists(target_dir): shutil.rmtree(target_dir)
    os.makedirs(target_dir)
    
    for old_cls, new_cls in mapping.items():
        src = os.path.join(raw_dir, old_cls)
        dst = os.path.join(target_dir, new_cls)
        if not os.path.exists(src): continue
        os.makedirs(dst, exist_ok=True)
        for img in os.listdir(src):
            shutil.copy(os.path.join(src, img), os.path.join(dst, img))
    print(f"✅ Đã gộp dữ liệu vào: {target_dir}")

# Giải nén và map class
if not os.path.exists(LOCAL_DATA_DIR):
    !unzip -q {ZIP_PATH} -d /content/raw_data
    prepare_and_map_dataset('/content/raw_data/cv_raw', LOCAL_DATA_DIR)

# Tham số Data
IMG_SIZE = (224, 224)
BATCH_SIZE = 32

# --- THIẾT LẬP MULTI-TASK LEARNING ---
# Nhãn: [screen_ok, body_ok]

# 0. Định nghĩa Class Names (Khớp với mapping ở trên)
class_names = ['0_good', '1_screen_damage', '2_body_damage']
AUTOTUNE = tf.data.AUTOTUNE

# 1. Tích hợp Albumentations cho Augmentation
aug_transform = A.Compose([
    A.Rotate(limit=20, border_mode=cv2.BORDER_REFLECT_101, p=0.4),
    A.HorizontalFlip(p=0.5),
    A.RandomBrightnessContrast(brightness_limit=0.15, contrast_limit=0.15, p=0.5),
    A.HueSaturationValue(hue_shift_limit=3, sat_shift_limit=8, val_shift_limit=8, p=0.4),
    A.GaussianBlur(blur_limit=(3, 5), p=0.2),
    A.GaussNoise(std_range=(0.01, 0.03), mean_range=(0, 0), p=0.2),
])

def aug_fn(image, label):
    data = {"image": image.astype(np.uint8)}
    aug_data = aug_transform(**data)
    aug_img = aug_data["image"].astype(np.float32)
    return aug_img, label

def process_data(image, label):
    aug_img, aug_label = tf.numpy_function(
        func=aug_fn, 
        inp=[image, label], 
        Tout=[tf.float32, tf.float32]
    )
    aug_img.set_shape((224, 224, 3))
    aug_label.set_shape(label.shape)
    return aug_img, aug_label

# 1. Hàm nạp và xử lý (Giữ nhãn dạng Vector để Augmentation không lỗi)
def load_and_preprocess_image(path, label):
    img = tf.io.read_file(path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, IMG_SIZE)
    return img, label

def format_output(image, label):
    """Bước cuối cùng: Chuyển label vector sang Dict cho Keras Multi-output."""
    return image, {'screen_output': label[0], 'body_output': label[1]}

def get_dataset(paths, labels, augment=False):
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    ds = ds.map(load_and_preprocess_image, num_parallel_calls=AUTOTUNE)
    if augment:
        ds = ds.map(process_data, num_parallel_calls=AUTOTUNE)
    # CHỈ chuyển sang Dict ở đây
    ds = ds.map(format_output, num_parallel_calls=AUTOTUNE)
    return ds.batch(BATCH_SIZE).prefetch(AUTOTUNE)

# 2. Thu thập dữ liệu & Hashing nhãn cho StratifiedKFold
all_paths = []
all_labels = []
stratify_helper = [] # Dùng để SKF có thể chia đều tỷ lệ

mapping = {
    'good_condition': [1, 1],
    'screen_cracked': [0, 1],
    'screen_dead_pixel': [0, 1],
    'body_scratched': [1, 0],
    'body_dented': [1, 0]
}

raw_data_dir = '/content/raw_data/cv_raw'
for folder, label_vec in mapping.items():
    folder_path = os.path.join(raw_data_dir, folder)
    if not os.path.exists(folder_path): continue
    for img_name in os.listdir(folder_path):
        all_paths.append(os.path.join(folder_path, img_name))
        all_labels.append(label_vec)
        stratify_helper.append(f"{label_vec[0]}_{label_vec[1]}")

all_paths = np.array(all_paths)
all_labels = np.array(all_labels).astype(np.float32)
stratify_helper = np.array(stratify_helper)

print(f"✅ Thu thập được {len(all_paths)} mẫu ảnh.")
```

### Bước 3: Định nghĩa Kiến trúc Model (MobileNetV2 + SE)
*Sử dụng kiến trúc tùy chỉnh của bạn.*

```python
def se_block(input_tensor, ratio=16):
    filters = input_tensor.shape[-1]
    se = layers.GlobalAveragePooling2D()(input_tensor)
    se = layers.Reshape((1, 1, filters))(se)
    se = layers.Dense(filters // ratio, activation='relu',
                      kernel_initializer='he_normal', use_bias=False)(se)
    se = layers.Dense(filters, activation='sigmoid',
                      kernel_initializer='he_normal', use_bias=False)(se)
    return layers.Multiply()([input_tensor, se])

def build_mobilenetv2_multitask(dropout_rate=0.3, l2_lambda=1e-4):
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3), include_top=False, weights='imagenet'
    )
    base_model.trainable = True
    for layer in base_model.layers[:100]:
        layer.trainable = False

    inputs = tf.keras.Input(shape=(224, 224, 3))
    x = layers.Rescaling(scale=1./127.5, offset=-1.0)(inputs)
    x = base_model(x, training=False)
    x = se_block(x)
    x = layers.GlobalAveragePooling2D()(x)
    
    # Nhánh chung (Shared Layers)
    shared = layers.Dense(256, activation='relu', kernel_regularizer=regularizers.l2(l2_lambda))(x)
    shared = layers.BatchNormalization()(shared)
    shared = layers.Dropout(dropout_rate)(shared)

    # Đầu ra 1: Screen Status
    screen_out = layers.Dense(1, activation='sigmoid', name='screen_output', dtype='float32')(shared)
    
    # Đầu ra 2: Body Status
    body_out = layers.Dense(1, activation='sigmoid', name='body_output', dtype='float32')(shared)

    model = Model(inputs=inputs, outputs=[screen_out, body_out])
    return model

model = build_mobilenetv2_multitask()

# Compile với Loss cho từng đầu ra
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss={
        'screen_output': 'binary_crossentropy',
        'body_output': 'binary_crossentropy'
    },
    loss_weights={
        'screen_output': 1.0,
        'body_output': 1.0
    },
    metrics={
        'screen_output': ['accuracy', tf.keras.metrics.AUC(name='auc')],
        'body_output': ['accuracy', tf.keras.metrics.AUC(name='auc')]
    }
)
model.summary()
```

### Bước 4: Huấn luyện với Callbacks Chuyên nghiệp

```python
# Thiết lập K-Fold
N_FOLDS = 5
skf = StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=42)

fold_histories = []
fold_scores = []
best_overall_acc = 0
best_model_path = ""

print(f"🚀 Bắt đầu huấn luyện với {N_FOLDS}-Fold Cross Validation...")

# FIX: Sử dụng stratify_helper thay vì all_labels
for fold, (train_idx, val_idx) in enumerate(skf.split(all_paths, stratify_helper)):
    print(f"\n📂 FOLD {fold + 1}/{N_FOLDS}")
    
    train_paths, train_labels = all_paths[train_idx], all_labels[train_idx]
    val_paths, val_labels = all_paths[val_idx], all_labels[val_idx]
    
    fold_train_ds = get_dataset(train_paths, train_labels, augment=True)
    fold_val_ds = get_dataset(val_paths, val_labels, augment=False)
    
    model = build_mobilenetv2_multitask()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss={'screen_output': 'binary_crossentropy', 'body_output': 'binary_crossentropy'},
        metrics=['accuracy']
    )
    
    checkpoint_path = os.path.join(MODEL_SAVE_DIR, f'best_model_fold_{fold+1}.h5')
    # FIX: Monitor 'val_loss' vì không có 'val_accuracy' chung
    fold_callbacks = [
        EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True),
        ModelCheckpoint(checkpoint_path, monitor='val_loss', save_best_only=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=1e-6)
    ]
    
    history = model.fit(
        fold_train_ds,
        validation_data=fold_val_ds,
        epochs=30,
        callbacks=fold_callbacks,
        verbose=1
    )
    
    # FIX: Unpack đúng số lượng giá trị trả về (Total Loss, Screen Loss, Body Loss, Screen Acc, Body Acc)
    eval_results = model.evaluate(fold_val_ds, verbose=0)
    val_loss = eval_results[0]
    # Trung bình cộng Acc của 2 task để đánh giá fold
    avg_acc = (eval_results[3] + eval_results[4]) / 2 
    
    fold_scores.append(avg_acc)
    fold_histories.append(history)
    
    if avg_acc > best_overall_acc:
        best_overall_acc = avg_acc
        best_model_path = checkpoint_path
        
    print(f"✅ Fold {fold+1} Result - Avg Acc: {avg_acc:.4f}, Total Loss: {val_loss:.4f}")

# KHÔNG del model ở đây để dùng cho bước ONNX
gc.collect()
```

### Bước 5: Đánh giá & Export
*Vẽ đồ thị và xuất model sang định dạng TFLite cho Production.*

```python
# 1. Tổng hợp kết quả Cross-Validation
print("\n🏆 KẾT QUẢ CUỐI CÙNG (CROSS-VALIDATION):")
print(f"Mean Avg Accuracy: {np.mean(fold_scores):.4f} (+/- {np.std(fold_scores):.4f})")
print(f"Best Fold Accuracy: {best_overall_acc:.4f}")

# 2. Đồ thị Loss & Accuracy
def plot_fold_history(histories):
    plt.figure(figsize=(15, 5))
    
    # Plot Accuracy (Avg của 2 tasks)
    plt.subplot(1, 2, 1)
    for i, h in enumerate(histories):
        # Tính trung bình cộng accuracy của 2 output
        avg_val_acc = (np.array(h.history['val_screen_output_accuracy']) + 
                       np.array(h.history['val_body_output_accuracy'])) / 2
        plt.plot(avg_val_acc, label=f'Fold {i+1}')
    plt.title('Average Validation Accuracy across Folds')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend()

    # Plot Total Loss
    plt.subplot(1, 2, 2)
    for i, h in enumerate(histories):
        plt.plot(h.history['val_loss'], label=f'Fold {i+1}')
    plt.title('Total Validation Loss across Folds')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.show()

plot_fold_history(fold_histories)

# 3. Export sang ONNX
import tf2onnx
import onnx

print("\n📦 Đang nạp model tốt nhất để chuyển đổi sang ONNX...")
# Load lại model tốt nhất từ file .h5
final_model = build_mobilenetv2_multitask()
final_model.load_weights(best_model_path)

spec = (tf.TensorSpec((None, 224, 224, 3), tf.float32, name="input"),)
onnx_path = os.path.join(MODEL_SAVE_DIR, 'retech_cv_multitask.onnx')

model_proto, _ = tf2onnx.convert.from_keras(final_model, input_signature=spec, opset=13)
with open(onnx_path, "wb") as f:
    f.write(model_proto.SerializeToString())

print(f"✅ Đã lưu model ONNX cuối cùng tại: {onnx_path}")

# Cleanup cuối cùng
del final_model
tf.keras.backend.clear_session()
gc.collect()
```

