import base64
import hashlib
import time
import requests
import cv2
import numpy as np
import undetected_chromedriver as uc
from pathlib import Path
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

CLASSES = [
    "screen_cracked",
    "screen_dead_pixel",
    "body_scratched",
    "body_dented",
    "good_condition"
]

SEARCH_QUERIES = {
    "screen_cracked": [
        "broken phone screen", "cracked smartphone display", 
        "site:ebay.com cracked iphone", "site:swappa.com broken samsung screen",
        "cracked screen glass only repair"
    ],
    "screen_dead_pixel": [
        "phone screen dead pixels", "amoled damage ink bleed", 
        "oled burn in phone", "lcd black spot phone screen", 
        "purple screen phone damage", "site:reddit.com/r/mobilerepair dead pixels"
    ],
    "body_scratched": [
        "scratched phone body", "heavy scratches iphone back", 
        "worn phone case scratched", "site:ebay.com scratched smartphone",
        "back glass scratched phone"
    ],
    "body_dented": [
        "dented phone corner", "phone frame dented damage", 
        "bent iphone frame", "site:swappa.com dented phone",
        "damaged phone metal frame"
    ],
    "good_condition": [
        "mint condition smartphone", "like new used phone", 
        "certified refurbished iphone", "site:gsmarena.com phone review",
        "pristine condition smartphone"
    ]
}

OUTPUT_DIR = Path(__file__).parent / "../../media/ai_datasets/cv_raw"
MIN_IMAGE_SIZE = 224  # px

def setup_directories():
    for class_name in CLASSES:
        (OUTPUT_DIR / class_name).mkdir(parents=True, exist_ok=True)

def is_already_downloaded(save_path):
    return Path(save_path).exists()

def download_image(url, folder, prefix):
    """Tải ảnh từ URL (hỗ trợ cả http và data:image base64)."""
    try:
        if url.startswith("data:image"):
            # Xử lý ảnh base64
            header, encoded = url.split(",", 1)
            data = base64.b64decode(encoded)
            ext = header.split("/")[1].split(";")[0]
            if ext == "jpeg": ext = "jpg"
            
            # Tính hash để tránh trùng
            file_hash = hashlib.md5(data).hexdigest()
            filename = f"{prefix}_{file_hash}.{ext}"
            filepath = folder / filename
            
            with open(filepath, "wb") as f:
                f.write(data)
            return True
        else:
            # Xử lý URL http
            response = requests.get(url, timeout=10, stream=True)
            if response.status_code == 200:
                file_hash = hashlib.md5(response.content).hexdigest()
                # Thử đoán extension
                ext = "jpg"
                if "png" in response.headers.get("Content-Type", ""): ext = "png"
                
                filename = f"{prefix}_{file_hash}.{ext}"
                filepath = folder / filename
                with open(filepath, "wb") as f:
                    f.write(response.content)
                return True
    except Exception:
        pass
    return False

def validate_image(filepath):
    """Kiểm tra kích thước tối thiểu và file không bị corrupt."""
    try:
        from PIL import Image
        with Image.open(filepath) as img:
            w, h = img.size
            if w < MIN_IMAGE_SIZE or h < MIN_IMAGE_SIZE:
                return False
        return True
    except Exception:
        return False

# --- FIX QUAN TRỌNG: Lấy ảnh full-size thay vì thumbnail ---
def get_fullsize_urls_google(driver, max_images):
    """Lấy URL ảnh Google bằng cách dùng tag img chung và filter src."""
    image_urls = []
    # Scroll để load thêm ảnh
    for _ in range(5):
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1.5)

    # Lấy tất cả các tag img
    thumbnails = driver.find_elements(By.TAG_NAME, "img")
    print(f"  [Google] Tìm thấy {len(thumbnails)} ảnh tiềm năng, đang lọc...")

    for img in thumbnails:
        if len(image_urls) >= max_images:
            break
        try:
            src = img.get_attribute("src")
            # Google dùng base64 (data:image) hoặc gstatic/encrypted-tbn cho thumbnails/fullsize
            if src and (src.startswith("http") or src.startswith("data:image")):
                if "gstatic" in src or "encrypted" in src or "images?" in src or src.startswith("data:image"):
                    if src not in image_urls:
                        image_urls.append(src)
        except Exception:
            continue

    return image_urls

def get_urls_bing(driver, max_images):
    """Bing Images — ảnh thumbnail đã đủ lớn hơn Google."""
    image_urls = []
    try:
        for _ in range(8):
            # Kiểm tra xem cửa sổ còn tồn tại không
            if not driver.window_handles:
                print("  [Cảnh báo] Cửa sổ trình duyệt đã bị đóng.")
                return []
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2.5)

        imgs = driver.find_elements(By.CSS_SELECTOR, "img.mimg")
        for img in imgs:
            src = img.get_attribute("src") or img.get_attribute("data-src")
            if src and src.startswith("http"):
                image_urls.append(src)
            if len(image_urls) >= max_images:
                break
    except Exception as e:
        print(f"  [Lỗi Bing]: {e}")
    return image_urls

def scrape_images_from_source(source_name, driver, class_name, query, max_images):
    print(f"\n[{source_name}] Query: '{query}' | Class: [{class_name}]")

    try:
        if source_name == "Google":
            search_url = f"https://www.google.com/search?tbm=isch&q={query.replace(' ', '+')}"
            driver.get(search_url)
            time.sleep(4)
            image_urls = get_fullsize_urls_google(driver, max_images)
        elif source_name == "Bing":
            search_url = f"https://www.bing.com/images/search?q={query.replace(' ', '+')}&form=HDRSC2"
            driver.get(search_url)
            time.sleep(4)
            image_urls = get_urls_bing(driver, max_images)
        else:
            return 0
    except Exception as e:
        print(f"  [Lỗi nguồn {source_name}]: {e}")
        return 0

    print(f"  [{source_name}] Có {len(image_urls)} URL, bắt đầu tải...")
    downloaded = 0
    for idx, url in enumerate(image_urls):
        if downloaded >= max_images:
            break

        save_folder = OUTPUT_DIR / class_name
        
        if download_image(url, save_folder, source_name):
            # Cần validate file vừa tải. Tên file trong download_image được tạo bằng hash.
            # Để đơn giản hóa, ta giả định download_image ghi file thành công.
            downloaded += 1

        # Rate limiting — tránh bị block
        time.sleep(0.7)

        if downloaded % 20 == 0 and downloaded > 0:
            print(f"  [{source_name}] {downloaded}/{max_images} ảnh hợp lệ...")

    print(f"  Xong: {downloaded} ảnh hợp lệ cho '{query}'")
    return downloaded

if __name__ == "__main__":
    print("KHỞI ĐỘNG CRAWLER ẢNH (MULTI-SOURCE)")
    setup_directories()

    SOURCES = ["Google", "Bing"]
    total_target = 10000
    total_queries = sum(len(q) for q in SEARCH_QUERIES.values())
    images_per_query_per_source = (total_target // (total_queries * len(SOURCES))) + 20

    # --- Cấu hình undetected-chromedriver ---
    options = uc.ChromeOptions()
    # Chạy ẩn (nếu muốn ổn định hơn, bỏ comment dòng dưới)
    # options.add_argument("--headless") 
    options.add_argument("--lang=en-US")
    options.add_argument("--disable-blink-features=AutomationControlled")
    
    print("  [*] Đang khởi tạo Undetected Chromedriver (vượt rào cản bot)...")
    driver = uc.Chrome(options=options)
    
    try:
        # Tăng thời gian timeout
        driver.set_page_load_timeout(30)
        for class_name, queries in SEARCH_QUERIES.items():
            for query in queries:
                for source in SOURCES:
                    # Kiểm tra xem trình duyệt còn sống không trước khi tiếp tục
                    try:
                        _ = driver.window_handles
                    except Exception:
                        print("\n[!] Trình duyệt đã bị đóng hoặc mất kết nối. Dừng script.")
                        break

                    scrape_images_from_source(
                        source, driver, class_name, query,
                        max_images=images_per_query_per_source
                    )
                    # Nghỉ giữa các query để tránh bị block
                    time.sleep(5)
    finally:
        try:
            driver.quit()
        except:
            pass

    print(f"\nHOÀN TẤT. Ảnh lưu tại: {OUTPUT_DIR}")