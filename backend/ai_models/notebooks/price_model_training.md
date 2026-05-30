# 💰 Retech Market - Price Prediction Pipeline (Professional)
**Mục tiêu:** Dự đoán giá thu mua điện thoại chính xác (Regression)  
**Thuật toán:** XGBoost Regressor + K-Fold Cross Validation  
**Tối ưu:** Outlier Detection, Log-Target Transformation, Feature Engineering.

---

### Bước 1: Setup & Data Cleaning (Kaggle Style)
*Loại bỏ nhiễu và xử lý giá ảo từ crawler.*

```python
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from google.colab import drive

import xgboost as xgb
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler, RobustScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score, mean_absolute_percentage_error

# 1. Mount Drive
drive.mount('/content/drive')

# 2. Load Data (Sử dụng bản đã làm sạch Outliers)
DRIVE_JSON_PATH = '/content/drive/MyDrive/retech_market/multi_source_phones_cleaned.json'
MODEL_SAVE_PATH = '/content/drive/MyDrive/retech_market/models/price_model_v1.joblib'
os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)

df = pd.read_json(DRIVE_JSON_PATH)

# --- CLEANING: Khử nhiễu giá ảo ---
# Loại bỏ giá quá thấp (< 500k) hoặc quá cao (> 60tr) thường là tin ảo
df = df[(df['price'] >= 500000) & (df['price'] <= 60000000)]

# Khử Outliers bằng IQR cho từng Brand (Giúp giá iPhone không bị so với Xiaomi)
def remove_outliers(df):
    clean_df = pd.DataFrame()
    for brand in df['brand'].unique():
        brand_df = df[df['brand'] == brand]
        q1 = brand_df['price'].quantile(0.25)
        q3 = brand_df['price'].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        clean_df = pd.concat([clean_df, brand_df[(brand_df['price'] >= lower) & (brand_df['price'] <= upper)]])
    return clean_df

df = remove_outliers(df)
print(f"✅ Dữ liệu sau khi làm sạch: {len(df)} mẫu.")
```

### Bước 2: Feature Engineering & Transformation
*Sử dụng Log-Transform để xử lý dữ liệu giá bị lệch.*

```python
# Biến mục tiêu: Dùng Log để ổn định phương sai (Chuẩn Kaggle)
y = np.log1p(df['price']) 

# Đặc trưng: Bổ sung RAM và Condition từ Crawler
X = df[['brand', 'model_name', 'storage', 'ram', 'condition', 
        'battery_percentage', 'is_power_on', 'screen_ok', 'body_ok']]

# Xử lý missing values đơn giản
X = X.fillna('Unknown')

# Chia tập dữ liệu để đánh giá cuối cùng
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

# Định nghĩa Transformer
cat_features = ['brand', 'model_name', 'storage', 'ram', 'condition']
num_features = ['battery_percentage']
binary_features = ['is_power_on', 'screen_ok', 'body_ok']

preprocessor = ColumnTransformer(
    transformers=[
        ('num', RobustScaler(), num_features), # RobustScaler chống nhiễu tốt hơn StandardScaler
        ('cat', OneHotEncoder(handle_unknown='ignore'), cat_features),
        ('bin', 'passthrough', binary_features)
    ])

print("✅ Pipeline tiền xử lý đã sẵn sàng.")
```

### Bước 3: Huấn luyện với K-Fold Cross Validation

```python
# Tham số tối ưu cho XGBoost (Kaggle Baseline)
xgb_params = {
    'n_estimators': 1000,
    'learning_rate': 0.05,
    'max_depth': 6,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'n_jobs': -1,
    'random_state': 42,
    'objective': 'reg:squarederror',
    'tree_method': 'gpu_hist' # Tận dụng T4 GPU
}

# Tạo K-Fold
kf = KFold(n_splits=5, shuffle=True, random_state=42)

# Pipeline
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('model', xgb.XGBRegressor(**xgb_params))
])

# Kiểm thử nhanh qua Cross-Validation
print("🚀 Đang chạy Cross-Validation (5-Folds)...")
cv_scores = cross_val_score(pipeline, X_train, y_train, cv=kf, scoring='neg_mean_absolute_error')
print(f"🏆 Average CV MAE (Log Scale): {-cv_scores.mean():.4f}")

# Huấn luyện final trên toàn bộ tập train
pipeline.fit(X_train, y_train)

# Lưu model
joblib.dump(pipeline, MODEL_SAVE_PATH)
print(f"✅ Đã lưu model tại: {MODEL_SAVE_PATH}")
```

### Bước 4: Đánh giá chuyên sâu & Feature Importance

```python
# Dự đoán và chuyển ngược từ Log sang Giá thực (VNĐ)
y_pred_log = pipeline.predict(X_test)
y_pred = np.expm1(y_pred_log)
y_test_real = np.expm1(y_test)

mae = mean_absolute_error(y_test_real, y_pred)
mape = mean_absolute_percentage_error(y_test_real, y_pred)
r2 = r2_score(y_test_real, y_pred)

print(f"\n📊 KẾT QUẢ ĐÁNH GIÁ:")
print(f"MAE: {mae:,.0f} VNĐ")
print(f"MAPE: {mape*100:.2f}% (Sai số trung bình theo tỷ lệ)")
print(f"R2 Score: {r2:.4f}")

# 1. Biểu đồ Actual vs Predicted
plt.figure(figsize=(10, 6))
sns.regplot(x=y_test_real, y=y_pred, scatter_kws={'alpha':0.3}, line_kws={'color':'red'})
plt.title('Actual vs Predicted Phone Prices')
plt.xlabel('Actual Price (VNĐ)')
plt.ylabel('Predicted Price (VNĐ)')
plt.show()

# 2. Feature Importance (Top 15)
# Lấy tên các feature sau khi One-Hot Encoding
ohe_feature_names = pipeline.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(cat_features)
features = np.concatenate([num_features, ohe_feature_names, binary_features])

importances = pipeline.named_steps['model'].feature_importances_
indices = np.argsort(importances)[-15:] # Lấy top 15

plt.figure(figsize=(10, 8))
plt.title('Top 15 Important Features')
plt.barh(range(len(indices)), importances[indices], color='b', align='center')
plt.yticks(range(len(indices)), [features[i] for i in indices])
plt.xlabel('Relative Importance')
plt.show()
```

