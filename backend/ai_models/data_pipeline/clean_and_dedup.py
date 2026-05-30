import os
import hashlib
import pandas as pd
import imagehash
from PIL import Image
from pathlib import Path
import cv2
import numpy as np

MIN_SIZE = 224        # px
BLUR_THRESHOLD = 80   # Laplacian variance — nhỏ hơn = blur
PHASH_THRESHOLD = 8   # Hamming distance — nhỏ hơn = duplicate

def check_blur(filepath):
    """Trả về True nếu ảnh bị mờ."""
    img = cv2.imread(str(filepath), cv2.IMREAD_GRAYSCALE)
    if img is None:
        return True
    return cv2.Laplacian(img, cv2.CV_64F).var() < BLUR_THRESHOLD

def check_size(filepath):
    """Trả về True nếu ảnh quá nhỏ."""
    try:
        with Image.open(filepath) as img:
            w, h = img.size
            return w < MIN_SIZE or h < MIN_SIZE
    except Exception:
        return True

def clean_cv_dataset(cv_raw_dir):
    print("\n--- BẮT ĐẦU CLEAN CV DATASET ---")
    cv_raw_dir = Path(cv_raw_dir)
    if not cv_raw_dir.exists():
        print(f"Thư mục không tồn tại: {cv_raw_dir}")
        return

    seen_hashes = {}  # phash -> filepath đầu tiên
    stats = {"total": 0, "corrupted": 0, "too_small": 0, "blurry": 0, "duplicate": 0}

    for filepath in sorted(cv_raw_dir.rglob("*")):
        if filepath.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
            continue

        stats["total"] += 1

        # 1. Kiểm tra corrupt
        try:
            with Image.open(filepath) as img:
                img.verify()
            # verify() đóng file, phải mở lại để dùng tiếp
            Image.open(filepath).load()
        except Exception:
            filepath.unlink(missing_ok=True)
            stats["corrupted"] += 1
            continue

        # 2. Kiểm tra kích thước tối thiểu
        if check_size(filepath):
            filepath.unlink(missing_ok=True)
            stats["too_small"] += 1
            continue

        # 3. Kiểm tra blur
        if check_blur(filepath):
            filepath.unlink(missing_ok=True)
            stats["blurry"] += 1
            continue

        # 4. Deduplicate bằng pHash (phát hiện near-duplicate tốt hơn MD5)
        try:
            ph = imagehash.phash(Image.open(filepath))
        except Exception:
            filepath.unlink(missing_ok=True)
            stats["corrupted"] += 1
            continue

        duplicate_found = False
        for seen_hash in seen_hashes:
            if ph - seen_hash <= PHASH_THRESHOLD:
                filepath.unlink(missing_ok=True)
                stats["duplicate"] += 1
                duplicate_found = True
                break

        if not duplicate_found:
            seen_hashes[ph] = filepath

    valid = stats["total"] - sum(v for k, v in stats.items() if k != "total")
    print(f"Tổng: {stats['total']} | Corrupt: {stats['corrupted']} | "
          f"Quá nhỏ: {stats['too_small']} | Blur: {stats['blurry']} | "
          f"Trùng lặp: {stats['duplicate']} | Hợp lệ: {valid}")

def clean_price_dataset(price_json_path, cleaned_json_path):
    print("\n--- BẮT ĐẦU CLEAN PRICE DATASET ---")
    price_json_path = Path(price_json_path)
    if not price_json_path.exists():
        print(f"File không tồn tại: {price_json_path}")
        return

    df = pd.read_json(price_json_path)
    initial_count = len(df)
    print(f"Tổng bản ghi ban đầu: {initial_count}")

    # 1. Drop duplicate theo (source, ad_id)
    df = df.drop_duplicates(subset=["source", "ad_id"])
    print(f"Sau dedup (source+ad_id): {len(df)} ({initial_count - len(df)} xóa)")

    # 2. Drop dòng thiếu cột quan trọng
    important_cols = ["brand", "model_name", "price"]
    before = len(df)
    df = df.dropna(subset=important_cols)
    print(f"Sau drop null quan trọng: {len(df)} ({before - len(df)} xóa)")

    # 3. Lọc giá hợp lệ (100k–100tr VND)
    before = len(df)
    df = df[df["price"].between(100_000, 100_000_000)]
    print(f"Sau lọc giá hợp lệ: {len(df)} ({before - len(df)} outliers xóa)")

    # 4. Chuẩn hoá brand name
    brand_map = {
        "apple": "Apple", "iphone": "Apple",
        "samsung": "Samsung",
        "xiaomi": "Xiaomi", "redmi": "Xiaomi",
        "oppo": "OPPO",
    }
    df["brand"] = df["brand"].str.lower().str.strip().map(
        lambda x: next((v for k, v in brand_map.items() if k in x), x.title())
    )

    Path(cleaned_json_path).parent.mkdir(parents=True, exist_ok=True)
    df.to_json(cleaned_json_path, orient="records", force_ascii=False, indent=2)
    print(f"\nHOÀN TẤT. {len(df)} bản ghi sạch → {cleaned_json_path}")

if __name__ == "__main__":
    # Đồng nhất với OUTPUT_DIR của Crawler
    BASE_DIR = Path(__file__).parent.parent.parent # Trỏ về thư mục 'backend/'
    DATA_ROOT = BASE_DIR / "media/ai_datasets"
    
    cv_dataset_path  = DATA_ROOT / "cv_raw"
    price_raw_path   = DATA_ROOT / "price_raw/multi_source_phones.json"
    price_clean_path = DATA_ROOT / "price_clean/multi_source_phones_cleaned.json"

    cv_dataset_path.mkdir(parents=True, exist_ok=True)
    price_raw_path.parent.mkdir(parents=True, exist_ok=True)
    price_clean_path.parent.mkdir(parents=True, exist_ok=True)

    clean_cv_dataset(cv_dataset_path)
    clean_price_dataset(price_raw_path, price_clean_path)