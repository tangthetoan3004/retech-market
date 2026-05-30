import os
import time
import requests
import json
from decimal import Decimal

# Cấu hình
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../../media/ai_datasets/price_raw/chotot_phones.json')
TARGET_TOTAL = 10000
API_URL = "https://gateway.chotot.com/v1/public/ad-listing"

# Param cơ bản để gọi API Chợ Tốt cho danh mục Điện Thoại (cg=3010)
BASE_PARAMS = {
    "cg": 3010, # Điện thoại di động
    "limit": 100, # Lấy tối đa 100 item mỗi request
    "st": "s,k" # Tin đăng cá nhân & bán chuyên
}

def setup_dirs():
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

def crawl_chotot_prices():
    print(f"Bắt đầu thu thập dữ liệu giá điện thoại từ Chợ Tốt (Mục tiêu: {TARGET_TOTAL} tin đăng)...")
    setup_dirs()
    
    collected_data = []
    page = 0
    
    while len(collected_data) < TARGET_TOTAL:
        params = BASE_PARAMS.copy()
        params['o'] = page * BASE_PARAMS['limit'] # Offset
        
        try:
            response = requests.get(API_URL, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                ads = data.get('ads', [])
                
                if not ads:
                    print("Không còn dữ liệu mới từ API.")
                    break
                    
                for ad in ads:
                    # Lọc ra các trường quan trọng làm features
                    item = {
                        "ad_id": ad.get("list_id"),
                        "model_name": ad.get("model", "Unknown"),
                        "brand": ad.get("body", "Unknown"), # Thường hãng nằm trong body hoặc parameters
                        "storage": ad.get("elt_condition", "Unknown"), # Tình trạng
                        "price": ad.get("price"),
                        "date": ad.get("date"),
                        "is_pro": ad.get("company_ad", False)
                    }
                    collected_data.append(item)
                    
                    if len(collected_data) >= TARGET_TOTAL:
                        break
                        
                print(f" Đã thu thập {len(collected_data)}/{TARGET_TOTAL} tin đăng...")
                page += 1
                time.sleep(1) # Tránh bị rate limit
            else:
                print(f"Lỗi API: {response.status_code}")
                break
                
        except Exception as e:
            print(f"Exception: {e}")
            break

    # Lưu ra file JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(collected_data, f, ensure_ascii=False, indent=4)
        
    print(f"HOÀN TẤT. Dữ liệu đã lưu tại: {OUTPUT_FILE}")

if __name__ == "__main__":
    crawl_chotot_prices()
