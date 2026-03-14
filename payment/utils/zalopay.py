import hashlib
import hmac
import json
import logging
import random
import time
from datetime import datetime

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

ZALOPAY_CREATE_ORDER_URL = "https://sb-openapi.zalopay.vn/v2/create"


def create_zalopay_order(payment):
    """
    Gọi ZaloPay API /v2/create để tạo đơn thanh toán.
    Trả về order_url (link redirect sang ZaloPay) hoặc raise Exception nếu thất bại.
    """
    app_id = int(settings.ZALOPAY_APP_ID)
    key1 = settings.ZALOPAY_KEY1
    callback_url = f"{settings.NGROK_URL}/api/payments/zalopay-callback/"

    now = datetime.now()
    app_trans_id = f"{now.strftime('%y%m%d')}_{random.randint(100000, 999999)}"
    app_time = int(round(time.time() * 1000))

    embed_data = json.dumps({
        "payment_id": payment.id,
        "redirecturl": "http://localhost:5173/checkout/success",
    })
    item = json.dumps([{
        "itemid": str(payment.order_id),
        "itemname": f"Đơn hàng #{payment.order_id}",
        "itemprice": int(payment.amount),
        "itemquantity": 1,
    }])

    order_data = {
        "app_id": app_id,
        "app_trans_id": app_trans_id,
        "app_user": str(payment.user_id),
        "app_time": app_time,
        "embed_data": embed_data,
        "item": item,
        "amount": int(payment.amount),
        "description": f"Retech Market - Thanh toán đơn hàng #{payment.order_id}",
        "bank_code": "",
        "callback_url": callback_url,
    }

    # Tính MAC = HMAC SHA256 của "app_id|app_trans_id|app_user|amount|app_time|embed_data|item"
    raw_mac = "|".join([
        str(order_data["app_id"]),
        order_data["app_trans_id"],
        order_data["app_user"],
        str(order_data["amount"]),
        str(order_data["app_time"]),
        order_data["embed_data"],
        order_data["item"],
    ])
    order_data["mac"] = hmac.new(key1.encode(), raw_mac.encode(), hashlib.sha256).hexdigest()

    response = requests.post(ZALOPAY_CREATE_ORDER_URL, json=order_data, timeout=15)
    result = response.json()

    if result.get("return_code") != 1:
        logger.error("ZaloPay create order failed: %s", result)
        raise Exception(result.get("return_message", "Tạo đơn ZaloPay thất bại"))

    # Lưu app_trans_id vào transaction_ref để tra cứu callback
    payment.transaction_ref = app_trans_id
    payment.save(update_fields=["transaction_ref", "updated_at"])

    return result["order_url"]


def verify_callback(data: str, mac: str) -> bool:
    """
    Xác thực callback từ ZaloPay bằng HMAC SHA256 với KEY2.
    """
    key2 = settings.ZALOPAY_KEY2
    computed_mac = hmac.new(key2.encode(), data.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed_mac, mac)
