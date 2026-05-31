import os
import django
import sys

# Khởi tạo môi trường Django
# Thiết lập đường dẫn tương đối để đảm bảo import đúng config.settings
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from chatbot.models import WebsiteDocument

def main():
    support_docs_dir = os.path.join(settings.MEDIA_ROOT, 'support-docs')
    
    if not os.path.exists(support_docs_dir):
        print(f"Lỗi: Thư mục tài liệu hỗ trợ không tồn tại tại {support_docs_dir}")
        return

    # Kiểm tra cấu hình khóa Gemini
    gemini_key = getattr(settings, "GEMINI_API_KEY", "")
    if not gemini_key:
        print("Cảnh báo: GEMINI_API_KEY chưa được thiết lập trong Django settings.")
        print("Tài liệu sẽ được lưu nhưng không thể tự động tạo vector embedding.")
    else:
        print("Tìm thấy GEMINI_API_KEY. Quá trình tạo Vector Embedding sẽ được kích hoạt tự động qua Signals.")

    md_files = [f for f in os.listdir(support_docs_dir) if f.endswith('.md')]
    
    if not md_files:
        print(f"Không tìm thấy file .md nào trong thư mục {support_docs_dir}")
        return

    print(f"Tìm thấy {len(md_files)} file tài liệu hỗ trợ cần nạp dữ liệu.")
    
    success_count = 0
    for filename in md_files:
        file_path = os.path.join(support_docs_dir, filename)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Trích xuất tiêu đề từ dòng đầu tiên có dạng '# Tiêu đề'
            title = filename.replace('.md', '').replace('_', ' ').title()
            for line in content.split('\n'):
                if line.strip().startswith('#'):
                    title = line.replace('#', '').strip()
                    break
            
            # Chuẩn hóa url_path dạng /support/ten-file
            url_slug = filename.replace('.md', '').replace('_', '-')
            url_path = f"/support/{url_slug}"
            
            # Nạp hoặc cập nhật tài liệu trong cơ sở dữ liệu
            doc, created = WebsiteDocument.objects.update_or_create(
                url_path=url_path,
                defaults={
                    "title": title,
                    "content": content,
                    "is_active": True
                }
            )
            
            status_str = "Tạo mới" if created else "Cập nhật"
            print(f"-> Đã {status_str} tài liệu: '{title}' (URL: {url_path})")
            success_count += 1
            
        except Exception as e:
            print(f"Lỗi khi đọc và nạp file {filename}: {e}")

    print(f"\nHoàn tất nạp dữ liệu! Nạp thành công {success_count}/{len(md_files)} tài liệu hỗ trợ.")
    print("Các signals của Django sẽ tự động chạy ngầm để sinh Vector Embedding thông qua Gemini API.")

if __name__ == '__main__':
    main()
