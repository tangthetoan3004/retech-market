import json
import re
import random
import time
from pathlib import Path
import requests
from bs4 import BeautifulSoup
import sys

# Ép kiểu UTF-8 cho console Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_FILE = Path(__file__).parent / "../../media/ai_datasets/price_raw/multi_source_phones.json"
TARGET_TOTAL = 10000

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
]

# --- Chợ Tốt: params đúng theo API thực tế ---
CHOTOT_API_URL = "https://gateway.chotot.com/v1/public/ad-listing"
CHOTOT_BASE_PARAMS = {
    "cg": 5010,       # Category: Điện thoại di động (ID mới)
    "limit": 100,
    "st": "s,k",      # s=sold, k=active
    "key": "",
    "w": 1,
}

# Các field thực tế Chợ Tốt trả về (dựa trên API public)
CHOTOT_FIELD_MAP = {
    "ad_id": "list_id",
    "model_name": "subject",       # Tiêu đề listing
    "price": "price",
    "area": "area_name",
    "posted_date": "date",
    # brand, RAM, storage thường nằm trong `params` array
}

def setup_dirs():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

def parse_chotot_params(ad):
    """Parse params array của Chợ Tốt để lấy RAM, storage, brand."""
    params = ad.get("params", []) or []
    result = {"brand": "Unknown", "storage": "Unknown", "ram": "Unknown", "condition": "Unknown"}
    for param in params:
        label = param.get("label", "").lower()
        value = param.get("value", "")
        if "hãng" in label or "brand" in label:
            result["brand"] = value
        elif "bộ nhớ trong" in label or "storage" in label:
            result["storage"] = value
        elif "ram" in label:
            result["ram"] = value
        elif "tình trạng" in label or "condition" in label:
            result["condition"] = value
    return result

def extract_features_from_text(text, condition=""):
    """
    Sử dụng Regex và Keyword matching để trích xuất các thông số 
    khớp với UI Frontend và mô hình DB:
    - is_power_on
    - screen_ok
    - body_ok
    - battery_percentage
    """
    full_text = f"{text} {condition}".lower()
    
    # 1. Tình trạng pin
    battery = 85 # Mặc định cho máy cũ
    if "mới" in condition.lower() and "cũ" not in condition.lower():
        battery = 100
        
    # Tìm kiếm chuỗi như "pin 90%", "pin zin 95", "pin còn 89"
    match = re.search(r'pin\s*(?:còn|zin|cao)?\s*(\d{2,3})(?:\s*%|\s|$)', full_text)
    if match:
        val = int(match.group(1))
        if 50 <= val <= 100:
            battery = val

    # 2. Màn hình (screen_ok)
    # Thêm các từ lóng: ám, ố, lưu ảnh (burn-in), phản quang, đốm trắng
    bad_screen_kw = [
        "sọc", "ám", "ố", "chảy mực", "nứt kính", "vỡ màn", "loạn cảm ứng", 
        "đốm", "liệt", "lưu ảnh", "phản quang", "mực", "trầy màn"
    ]
    screen_ok = 1
    if any(kw in full_text for kw in bad_screen_kw):
         screen_ok = 0
         
    # 3. Ngoại hình (body_ok)
    # Thêm: phẩy, nhỡ, cấn, tróc
    bad_body_kw = [
        "cấn", "móp", "xước nhiều", "trầy nhiều", "nứt lưng", "vỡ lưng", 
        "tróc sơn", "phẩy", "vỏ xấu", "thay vỏ"
    ]
    body_ok = 1
    if any(kw in full_text for kw in bad_body_kw) or "cấn móp" in condition.lower() or "trầy xước" in condition.lower():
        body_ok = 0
        
    # 4. Nguồn (is_power_on)
    # Thêm: icloud, bypass, mdx, mất face, mất vân
    bad_power_kw = [
        "mất nguồn", "bán xác", "không lên nguồn", "treo logo", "icloud ẩn", 
        "bypass", "đột tử", "mdm", "mất face", "mất vân", "mất vân tay"
    ]
    is_power_on = 1
    if any(kw in full_text for kw in bad_power_kw):
        is_power_on = 0
        
    return {
        "battery_percentage": battery,
        "screen_ok": screen_ok,
        "body_ok": body_ok,
        "is_power_on": is_power_on
    }

def crawl_chotot(target_count):
    print(f"\n[Chợ Tốt] Mục tiêu: {target_count} listing...")
    collected = []
    page = 0
    consecutive_errors = 0

    session = requests.Session()
    
    while len(collected) < target_count and consecutive_errors < 3:
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://www.chotot.com/",
            "Origin": "https://www.chotot.com",
        }
        params = CHOTOT_BASE_PARAMS.copy()
        params["o"] = page * 100  # offset

        try:
            response = session.get(CHOTOT_API_URL, params=params, headers=headers, timeout=15)
            response.raise_for_status()
            data = response.json()
            ads = data.get("ads", [])

            if not ads:
                print("  [Chợ Tốt] Hết dữ liệu.")
                break

            for ad in ads:
                extra = parse_chotot_params(ad)
                
                # Trích xuất các thông số AI từ title và body
                title = ad.get("subject", "")
                body = ad.get("body", "")
                text_for_nlp = f"{title} {body}"
                ai_features = extract_features_from_text(text_for_nlp, extra.get("condition", ""))

                item = {
                    "source": "chotot",
                    "ad_id": ad.get("list_id"),
                    "model_name": title,
                    "brand": extra["brand"],
                    "storage": extra["storage"],
                    "ram": extra["ram"],
                    "condition": extra["condition"],
                    "battery_percentage": ai_features["battery_percentage"],
                    "is_power_on": ai_features["is_power_on"],
                    "screen_ok": ai_features["screen_ok"],
                    "body_ok": ai_features["body_ok"],
                    "price": ad.get("price"),
                    "area": ad.get("area_name", "Unknown"),
                    "posted_date": ad.get("date"),
                    "image_url": ad.get("image", ""),
                }
                # Bỏ qua listing thiếu giá
                if item["price"] and item["price"] > 0:
                    collected.append(item)

                if len(collected) >= target_count:
                    break

            print(f"  [Chợ Tốt] Trang {page+1}: tổng {len(collected)}/{target_count}")
            page += 1
            consecutive_errors = 0
            time.sleep(1.5)  # Rate limiting

        except requests.HTTPError as e:
            print(f"  [Chợ Tốt] HTTP Error {e.response.status_code}")
            consecutive_errors += 1
            time.sleep(5)
        except Exception as e:
            print(f"  [Chợ Tốt] Exception: {e}")
            consecutive_errors += 1
            time.sleep(3)

    return collected

def crawl_hoanghaMobile(target_count):
    """
    Crawl Hoàng Hà Mobile từ "Kho sản phẩm cũ" (Trả về HTML).
    """
    print(f"\n[Hoàng Hà Mobile] Mục tiêu: {target_count} sản phẩm...")
    collected = []

    session = requests.Session()
    page = 1

    while len(collected) < target_count:
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html, */*",
            "Accept-Language": "vi-VN,vi;q=0.9",
            "Referer": "https://hoanghamobile.com/kho-san-pham-cu",
            "X-Requested-With": "XMLHttpRequest"
        }
        try:
            if page == 1:
                url = 'https://hoanghamobile.com/kho-san-pham-cu?filters={"type":"1"}'
            else:
                url = f'https://hoanghamobile.com/Ajax/Loadmore?page={page}&filters={{"type":"1"}}'
            
            response = session.get(url, headers=headers, timeout=15)
            if response.status_code != 200:
                break

            soup = BeautifulSoup(response.text, 'html.parser')
            # Cập nhật selector mới nhất từ thực tế website
            items = soup.select('div.v5-item')
            if not items:
                break

            for item in items:
                try:
                    title_tag = item.select_one('a.text-limit')
                    name = title_tag.text.strip() if title_tag else "Unknown"
                    
                    price_tag = item.select_one('.price strong')
                    price_str = price_tag.text if price_tag else "0"
                    # Clean price string: "15.000.000₫" -> 15000000
                    price = int(re.sub(r'[^\d]', '', price_str))
                    
                    img_tag = item.select_one('a.img img')
                    image_url = img_tag['src'] if img_tag else ""
                    
                    # Extract ID từ link hoặc random
                    link_tag = item.select_one('a.img') or title_tag
                    link = link_tag['href'] if link_tag else ""
                    match_id = re.search(r'/([\w-]+)$', link)
                    ad_id = match_id.group(1) if match_id else str(random.randint(1000, 9999))

                    ai_features = extract_features_from_text(name, "")

                    data_item = {
                        "source": "hoanghaMobile",
                        "ad_id": ad_id,
                        "model_name": name,
                        "brand": "Unknown", # Sẽ được fix ở bước clean hoặc dựa trên regex name
                        "storage": "Unknown",
                        "ram": "Unknown",
                        "condition": "Cũ",
                        "battery_percentage": ai_features["battery_percentage"],
                        "is_power_on": ai_features["is_power_on"],
                        "screen_ok": ai_features["screen_ok"],
                        "body_ok": ai_features["body_ok"],
                        "price": price,
                        "area": "Toàn quốc",
                        "posted_date": time.strftime("%Y-%m-%d"),
                        "image_url": image_url if image_url.startswith('http') else f"https://hoanghamobile.com{image_url}",
                    }
                    
                    if data_item["price"] > 0:
                        collected.append(data_item)
                except Exception:
                    continue

                if len(collected) >= target_count:
                    break

            print(f"  [Hoàng Hà] Trang {page}: tổng {len(collected)}")
            page += 1
            time.sleep(2)

        except Exception as e:
            print(f"  [Hoàng Hà] Lỗi tại trang {page}: {e}")
            break

    return collected

def deduplicate(data):
    """Xóa listing trùng lặp dựa trên (source, ad_id)."""
    seen = set()
    result = []
    for item in data:
        key = (item.get("source"), str(item.get("ad_id")))
        if key not in seen:
            seen.add(key)
            result.append(item)
    dedup_count = len(data) - len(result)
    print(f"  [Deduplicate] Đã xóa {dedup_count} bản ghi trùng lặp.")
    return result

def crawl_all_prices():
    setup_dirs()
    print("KHỞI ĐỘNG CRAWLER GIÁ THỊ TRƯỜNG")

    target_chotot = int(TARGET_TOTAL * 0.6)
    target_hoanghha = TARGET_TOTAL - target_chotot

    all_data = []
    all_data.extend(crawl_chotot(target_chotot))
    all_data.extend(crawl_hoanghaMobile(target_hoanghha))

    # Deduplicate sớm trước khi lưu
    all_data = deduplicate(all_data)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\nHOÀN TẤT. {len(all_data)} records → {OUTPUT_FILE}")

if __name__ == "__main__":
    crawl_all_prices()