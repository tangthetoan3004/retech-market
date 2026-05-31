import json
import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from chatbot.models import WebsiteDocument

dataset = []
system_prompt = "Bạn là trợ lý ảo tư vấn mua sắm và chính sách thông minh của Retech Market. Hãy trả lời bằng tiếng Việt một cách thân thiện, lễ phép và trung thực."

# 1. Trích xuất từ tài liệu tĩnh (WebsiteDocument) trong DB
for doc in WebsiteDocument.objects.filter(is_active=True):
    # Tạo câu hỏi giả lập dựa trên tiêu đề tài liệu
    user_queries = [
        f"Thông tin về {doc.title.lower()} là gì?",
        f"Cho mình hỏi về {doc.title.lower()}",
        doc.title
    ]
    for query in user_queries:
        dataset.append({
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
                {"role": "assistant", "content": doc.content}
            ]
        })

# 2. Bổ sung các đoạn hội thoại câu hỏi - câu trả lời chi tiết và thực tế (Manual Q&A)
manual_qa = [
    # Thu cũ / Bán máy cũ và AI
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Mình muốn bán điện thoại cũ thì làm thế nào?"},
            {"role": "assistant", "content": "Dạ, để bán điện thoại cũ tại Retech Market, bạn chỉ cần thực hiện quy trình thu cũ trực tuyến cực kỳ đơn giản qua các bước sau:\n1. Chọn mục 'Thu cũ đổi mới' trên trang web.\n2. Nhập thông tin cấu hình máy (Thương hiệu, Dòng máy, Bộ nhớ RAM/Storage).\n3. Khai báo tình trạng chức năng và tự đánh giá ngoại hình máy.\n4. Tải lên ảnh chụp mặt trước của máy để AI phân tích vết trầy xước và tự động chấm điểm hao mòn.\n5. Xem báo giá ước tính từ hệ thống.\n6. Điền thông tin tài khoản ngân hàng nhận tiền và bấm 'Xác nhận tạo đơn'.\n7. Đóng gói máy gửi bưu điện miễn phí hoặc mang trực tiếp ra cửa hàng Retech. Kỹ thuật viên sẽ kiểm tra thực tế và chuyển khoản thanh toán cho bạn trong 24 giờ làm việc ạ."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Hệ thống AI định giá điện thoại cũ có chính xác không?"},
            {"role": "assistant", "content": "Dạ có ạ! Hệ thống Computer Vision AI của Retech Market được huấn luyện trên tập dữ liệu hàng nghìn ảnh thiết bị hao mòn thực tế để nhận diện chuẩn xác các vết nứt, vỡ kính hay trầy xước. Kết quả phân tích hình ảnh kết hợp với khai báo lỗi chức năng sẽ xuất ra mức định giá ước tính vô cùng khách quan và bám sát giá trị thị trường, đảm bảo quyền lợi tốt nhất cho bạn ạ."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Khách vãng lai chưa đăng nhập tài khoản có dùng được tính năng định giá AI không?"},
            {"role": "assistant", "content": "Dạ hoàn toàn được ạ! Khách vãng lai chưa đăng nhập vẫn có thể sử dụng đầy đủ tính năng định giá AI và xem báo giá. Tuy nhiên, khi bạn bấm 'Xác nhận tạo đơn', hệ thống sẽ tự động lưu tạm cấu hình máy vào bộ nhớ trình duyệt và yêu cầu bạn Đăng nhập. Sau khi đăng nhập thành công, dữ liệu lưu tạm sẽ tự động nạp lại để bạn hoàn tất tạo đơn thu cũ nhanh chóng mà không cần nhập lại từ đầu ạ."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Nếu mình gửi máy đi thẩm định mà không đồng ý với mức giá cửa hàng đưa ra thì thế nào?"},
            {"role": "assistant", "content": "Dạ bạn hoàn toàn yên tâm ạ! Khi kỹ thuật viên thẩm định thực tế phát hiện sai lệch so với khai báo và đề xuất giá mới, nếu bạn không đồng ý bán, Retech Market sẽ đóng gói máy cẩn thận và gửi trả lại thiết bị nguyên vẹn cho bạn hoàn toàn miễn phí bưu điện ạ."}
        ]
    },
    # Bảo hành & Đổi trả
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Điện thoại mua ở Retech Market được bảo hành bao lâu?"},
            {"role": "assistant", "content": "Dạ, thời hạn bảo hành phần cứng tiêu chuẩn được quy định rõ theo phân loại ngoại hình (Grade) của máy như sau ạ:\n- Dòng máy Grade A (Đẹp như mới): Bảo hành phần cứng toàn diện 12 tháng.\n- Dòng máy Grade B (Trầy xước nhẹ): Bảo hành phần cứng toàn diện 6 tháng.\n- Dòng máy Grade C (Hao mòn nhiều): Bảo hành phần cứng toàn diện 3 tháng."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Chính sách bảo hành pin của cửa hàng thế nào? Chai bao nhiêu thì được thay miễn phí?"},
            {"role": "assistant", "content": "Dạ, Retech Market có gói bảo hành pin vô cùng ưu đãi ạ! Trong thời gian bảo hành tiêu chuẩn của máy, nếu dung lượng pin tối đa của máy bị chai xuống dưới 80% (kiểm tra trực tiếp trong phần Cài đặt của điện thoại), Retech Market sẽ hỗ trợ thay pin mới hoàn toàn miễn phí 100% cho bạn."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Chính sách đổi trả 1 đổi 1 của shop là trong bao nhiêu ngày?"},
            {"role": "assistant", "content": "Dạ, Retech Market áp dụng chính sách 1 đổi 1 trong vòng 30 ngày đầu tiên kể từ ngày nhận máy nếu sản phẩm phát sinh lỗi phần cứng từ nhà sản xuất. Nếu cửa hàng không còn máy tương đương để đổi, bạn sẽ được đổi sang dòng máy khác bù/trừ chênh lệch hoặc nhận lại 100% tiền hoàn trả ạ."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Lỗi do người dùng làm rơi vỡ màn hình hoặc vào nước thì có được bảo hành miễn phí không?"},
            {"role": "assistant", "content": "Dạ, chính sách bảo hành miễn phí của Retech rất tiếc sẽ từ chối áp dụng cho các lỗi vật lý do tai nạn người dùng như rơi vỡ màn hình, nứt mặt kính trước/sau, chập cháy nguồn do vào nước (quỳ tím đổi màu) hoặc mất tem bảo hành dán trên ốc. Tuy nhiên, cửa hàng sẽ hỗ trợ sửa chữa dịch vụ có tính phí với mức ưu đãi giảm 20% tiền linh kiện cho khách hàng cũ ạ."}
        ]
    },
    # Mua hàng & Giao hàng
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Khi nhận hàng, mình có được mở hộp kiểm tra điện thoại cùng shipper không?"},
            {"role": "assistant", "content": "Dạ có ạ! Retech Market áp dụng chính sách đồng kiểm bắt buộc để bảo vệ quyền lợi khách hàng. Khi nhận máy từ shipper, bạn có quyền mở hộp kiểm tra ngoại hình, số lượng và dòng máy trước khi ký tên nhận hàng hoặc thanh toán (COD). Nếu phát hiện máy bị nứt vỡ do vận chuyển hoặc sai mẫu mã, bạn chỉ cần từ chối nhận hàng và gọi ngay Hotline 1900-8888 để được hỗ trợ gửi máy mới miễn phí."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Thời gian giao hàng mất bao lâu thì mình nhận được máy?"},
            {"role": "assistant", "content": "Dạ, thời gian giao hàng dự kiến như sau ạ:\n- Giao hỏa tốc 2 giờ: Áp dụng tại nội thành TP. Hồ Chí Minh đối với các đơn hàng đặt trước 18h00 hàng ngày.\n- Giao hàng nhanh toàn quốc: Từ 1 - 2 ngày đối với các khu vực thành phố trung tâm và từ 3 - 4 ngày đối với khu vực huyện xã ngoại thành hoặc vùng sâu vùng xa."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Phí vận chuyển giao nhận hàng được tính thế nào? Có được miễn phí ship không?"},
            {"role": "assistant", "content": "Dạ, phí giao hàng nhanh đồng giá toàn quốc là 30.000 VNĐ. Tuy nhiên, bạn sẽ được miễn phí vận chuyển 100% đối với các đơn mua máy trị giá từ 5.000.000 VNĐ trở lên hoặc các đơn hàng đăng ký thu cũ (bán máy điện thoại cũ) gửi về cho Retech Market ạ."}
        ]
    },
    # Thanh toán & Hoàn tiền
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Trang web hỗ trợ các phương thức thanh toán trực tuyến nào?"},
            {"role": "assistant", "content": "Dạ, Retech Market hỗ trợ đa dạng phương thức thanh toán linh hoạt và bảo mật:\n1. Thanh toán COD (Tiền mặt khi nhận hàng và đồng kiểm cùng shipper).\n2. Quét mã QR qua cổng ví điện tử ZaloPay thanh toán tức thì.\n3. Chuyển khoản ngân hàng trực tiếp theo thông tin hiển thị tại trang checkout.\n4. Cổng thanh toán quốc tế PayPal / thẻ tín dụng (Visa, Mastercard)."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Nếu mình quét mã QR thanh toán qua ZaloPay thì đơn hàng có được tự động duyệt không?"},
            {"role": "assistant", "content": "Dạ có ạ! Cổng thanh toán ZaloPay của chúng tôi được tích hợp cơ chế webhook tự động nhận callback từ máy chủ ZaloPay. Ngay khi bạn quét mã QR và thanh toán thành công trên điện thoại, hệ thống sẽ lập tức cập nhật trạng thái đơn hàng của bạn sang 'Đã thanh toán' (PAID) mà không cần nhân viên hỗ trợ phê duyệt thủ công."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Thủ tục yêu cầu hoàn trả hàng trực tuyến thực hiện thế nào?"},
            {"role": "assistant", "content": "Dạ, nếu máy gặp lỗi phần cứng trong vòng 30 ngày và thỏa mãn điều kiện trả hàng, bạn thực hiện gửi yêu cầu online như sau:\n1. Đăng nhập tài khoản, vào trang cá nhân chọn mục 'Đơn hàng của tôi'.\n2. Chọn đúng đơn hàng bị lỗi và nhấn 'Yêu cầu hoàn trả (Refund)'.\n3. Chọn lý do lỗi, nhập thông tin tài khoản ngân hàng nhận tiền hoàn và tải lên hình ảnh/video bằng chứng lỗi máy.\n4. Bấm 'Gửi yêu cầu'. Đội ngũ Retech sẽ kiểm tra và phê duyệt sơ bộ đơn của bạn trong vòng 24 giờ làm việc ạ."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Nếu hoàn tiền qua ví ZaloPay thì mất bao lâu mình nhận được tiền?"},
            {"role": "assistant", "content": "Dạ, đối với các đơn hàng thanh toán qua cổng ZaloPay, khi yêu cầu hoàn trả được duyệt, hệ thống Retech sẽ gọi API ZaloPay Refund tự động hoàn trả trực tiếp về ví hoặc thẻ ngân hàng liên kết của bạn. Thời gian nhận tiền thường từ 1 - 3 ngày làm việc tùy thuộc vào ngân hàng liên kết của bạn ạ. Đối với đơn hàng COD hoặc chuyển khoản, kế toán Retech sẽ chuyển khoản hoàn tiền vào số tài khoản bạn cung cấp trong vòng 24 giờ làm việc."}
        ]
    },
    # Tài khoản & Tính năng hệ thống
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Tôi đăng nhập tài khoản bằng Google (Gmail) trên web được không?"},
            {"role": "assistant", "content": "Dạ được chứ ạ! Trang web Retech Market đã tích hợp Google OAuth cho phép bạn đăng nhập nhanh bằng tài khoản Google (Gmail) của mình. Bạn chỉ cần nhấn vào biểu tượng Google tại màn hình đăng nhập, hệ thống sẽ tự động xác thực và tạo/đăng nhập tài khoản cho bạn ngay tức thì mà không cần khai báo mật khẩu phức tạp."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Làm thế nào để tôi theo dõi tiến độ giao hàng của đơn đã đặt?"},
            {"role": "assistant", "content": "Dạ, sau khi đặt hàng thành công, bạn có thể dễ dàng theo dõi trạng thái đơn hàng theo thời gian thực bằng cách đăng nhập, vào mục 'Đơn hàng của tôi' trong trang cá nhân. Trạng thái đơn sẽ được cập nhật liên tục: Chờ xử lý -> Đang xử lý -> Đang giao hàng -> Đã hoàn thành, giúp bạn chủ động thời gian nhận máy ạ."}
        ]
    }
]

# Thêm tất cả QA thủ công vào dataset huấn luyện
dataset.extend(manual_qa)

# 3. Lưu file dataset.jsonl
output_path = "media/ai_datasets/chat_dataset.jsonl"
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    for item in dataset:
        f.write(json.dumps(item, ensure_ascii=False) + "\n")

print(f"Đã xuất thành công {len(dataset)} mẫu dữ liệu huấn luyện (bao gồm cả tài liệu Website và Q&A thực tế) tại: {output_path}")