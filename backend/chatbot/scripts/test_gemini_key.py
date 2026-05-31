import os
import requests
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))

def test_gemini_api():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Không tìm thấy GEMINI_API_KEY trong file .env.")
        api_key = input("Nhập GEMINI_API_KEY của bạn để kiểm tra: ").strip()
        
    if not api_key:
        print("Lỗi: Bạn chưa cung cấp API Key.")
        return

    print(f"Đang kết nối tới Gemini API bằng khóa: {api_key[:6]}...{api_key[-6:] if len(api_key) > 12 else ''}")
    headers = {"Content-Type": "application/json"}
    
    # 1. Kiểm tra mô hình sinh câu trả lời (Gemini Flash Latest)
    url_chat = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
    payload_chat = {
        "contents": [
            {
                "parts": [{"text": "Hãy trả lời từ 'OK' nếu bạn đọc được tin nhắn này."}]
            }
        ]
    }
    
    try:
        res_chat = requests.post(url_chat, headers=headers, json=payload_chat, timeout=10)
        if res_chat.status_code == 200:
            print("1. Kết nối Gemini Chat (gemini-flash-latest) THÀNH CÔNG!")
            text = res_chat.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            print(f"AI phản hồi: '{text}'")
        else:
            print(f"Lỗi kết nối Gemini Chat. HTTP Code: {res_chat.status_code}")
            print(f"Chi tiết: {res_chat.text}")
    except Exception as e:
        print(f"Lỗi ngoại lệ khi gọi API Chat: {e}")

    # 2. Kiểm tra mô hình sinh vector embedding (gemini-embedding-001)
    url_emb = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"
    payload_emb = {
        "model": "models/gemini-embedding-001",
        "content": {
            "parts": [{"text": "Retech Market AI Chatbot Test"}]
        }
    }

    
    try:
        res_emb = requests.post(url_emb, headers=headers, json=payload_emb, timeout=10)
        if res_emb.status_code == 200:
            print("✅ 2. Kết nối Gemini Embedding (gemini-embedding-001) THÀNH CÔNG!")
            values = res_emb.json()["embedding"]["values"]
            print(f"Đã sinh thành công vector {len(values)} chiều.")
        else:
            print(f"Lỗi kết nối Gemini Embedding. HTTP Code: {res_emb.status_code}")
            print(f"Chi tiết: {res_emb.text}")
    except Exception as e:
        print(f"Lỗi ngoại lệ khi gọi API Embedding: {e}")

if __name__ == "__main__":
    test_gemini_api()
