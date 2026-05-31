import datetime
import logging
from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import Order, Refund
from payment.models import Payment
from tradein.models import TradeInRequest
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

class AdminDashboardStatsAPIView(APIView):
    """
    API cung cấp các số liệu thống kê tổng hợp cho trang Dashboard Admin.
    Yêu cầu quyền truy cập Staff/Admin.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        range_str = request.query_params.get("range", "30days")
        now = timezone.now()

        # 1. Xác định khoảng thời gian lọc dữ liệu
        if range_str == "7days":
            days_count = 7
            start_date = now - datetime.timedelta(days=7)
            group_by = "day"
        elif range_str == "6months":
            days_count = 180
            start_date = now - datetime.timedelta(days=180)
            group_by = "month"
        else:  # Mặc định là 30 ngày
            days_count = 30
            start_date = now - datetime.timedelta(days=30)
            group_by = "day"

        try:
            # 2. Truy vấn dữ liệu thô trong khoảng thời gian chỉ định
            payments_in = Payment.objects.filter(
                direction=Payment.Direction.INBOUND,
                status=Payment.Status.COMPLETED,
                created_at__gte=start_date
            )

            payments_out = Payment.objects.filter(
                direction=Payment.Direction.OUTBOUND,
                payment_type=Payment.PaymentType.TRADEIN_SELL_PAYOUT,
                status=Payment.Status.COMPLETED,
                created_at__gte=start_date
            )

            refunds = Refund.objects.filter(
                status=Refund.RefundStatus.APPROVED,
                created_at__gte=start_date
            )

            orders_in_range = Order.objects.filter(created_at__gte=start_date)
            tradeins_in_range = TradeInRequest.objects.filter(created_at__gte=start_date)

            # 3. Tính toán các chỉ số tổng quan ở các thẻ (Overview Cards)
            total_revenue = payments_in.aggregate(total=Sum("amount"))["total"] or 0
            total_payout = payments_out.aggregate(total=Sum("amount"))["total"] or 0
            total_refund = refunds.aggregate(total=Sum("total_refund_amount"))["total"] or 0
            net_profit = total_revenue - total_payout - total_refund

            total_orders_count = orders_in_range.count()
            total_tradeins_count = tradeins_in_range.count()
            new_users_count = User.objects.filter(
                is_staff=False, 
                is_superuser=False, 
                date_joined__gte=start_date
            ).count()

            # 4. Tạo xu hướng dữ liệu biểu đồ liên tục (Charts Trend)
            chart_data = []
            if group_by == "day":
                # Khởi tạo danh sách các ngày liên tục từ start_date đến hôm nay
                trend_dict = {}
                for i in range(days_count + 1):
                    day_date = now - datetime.timedelta(days=i)
                    day_str = day_date.strftime("%Y-%m-%d")
                    trend_dict[day_str] = {"revenue": 0, "payout": 0, "refund": 0}

                # Điền dữ liệu vào trend
                for p in payments_in:
                    d_str = p.created_at.astimezone(timezone.get_current_timezone()).strftime("%Y-%m-%d")
                    if d_str in trend_dict:
                        trend_dict[d_str]["revenue"] += int(p.amount)

                for p in payments_out:
                    d_str = p.created_at.astimezone(timezone.get_current_timezone()).strftime("%Y-%m-%d")
                    if d_str in trend_dict:
                        trend_dict[d_str]["payout"] += int(p.amount)

                for r in refunds:
                    d_str = r.created_at.astimezone(timezone.get_current_timezone()).strftime("%Y-%m-%d")
                    if d_str in trend_dict:
                        trend_dict[d_str]["refund"] += int(r.total_refund_amount)

                # Chuyển đổi thành list sắp xếp theo thứ tự ngày tăng dần
                for k in sorted(trend_dict.keys()):
                    chart_data.append({
                        "date": k,
                        "revenue": trend_dict[k]["revenue"],
                        "payout": trend_dict[k]["payout"],
                        "refund": trend_dict[k]["refund"]
                    })

            else:  # group_by == "month"
                # Khởi tạo danh sách 6 tháng gần đây
                trend_dict = {}
                for i in range(6):
                    month_date = now - datetime.timedelta(days=i * 30)
                    month_str = month_date.strftime("%Y-%m")
                    trend_dict[month_str] = {"revenue": 0, "payout": 0, "refund": 0}

                for p in payments_in:
                    m_str = p.created_at.astimezone(timezone.get_current_timezone()).strftime("%Y-%m")
                    if m_str in trend_dict:
                        trend_dict[m_str]["revenue"] += int(p.amount)

                for p in payments_out:
                    m_str = p.created_at.astimezone(timezone.get_current_timezone()).strftime("%Y-%m")
                    if m_str in trend_dict:
                        trend_dict[m_str]["payout"] += int(p.amount)

                for r in refunds:
                    m_str = r.created_at.astimezone(timezone.get_current_timezone()).strftime("%Y-%m")
                    if m_str in trend_dict:
                        trend_dict[m_str]["refund"] += int(r.total_refund_amount)

                for k in sorted(trend_dict.keys()):
                    chart_data.append({
                        "date": k,
                        "revenue": trend_dict[k]["revenue"],
                        "payout": trend_dict[k]["payout"],
                        "refund": trend_dict[k]["refund"]
                    })

            # 5. Phân phối trạng thái phục vụ Pie Charts (Distributions)
            order_distributions = orders_in_range.values("status").annotate(count=Count("id"))
            tradein_distributions = tradeins_in_range.values("status").annotate(count=Count("id"))

            # 6. Danh sách hoạt động gần đây nhất (Recent Activities)
            recent_orders_qs = Order.objects.select_related("user").order_by("-created_at")[:5]
            recent_tradeins_qs = TradeInRequest.objects.select_related("user", "brand").order_by("-created_at")[:5]

            recent_orders = [{
                "id": o.id,
                "customer_name": o.full_name or o.user.username,
                "total_amount": int(o.total_amount),
                "status": o.status,
                "created_at": o.created_at
            } for o in recent_orders_qs]

            recent_tradeins = [{
                "id": t.id,
                "customer_name": t.user.username,
                "device_model": f"{t.brand.name if t.brand else ''} {t.model_name or ''}".strip(),
                "price": int(t.final_price or t.estimated_price or 0),
                "status": t.status,
                "created_at": t.created_at
            } for t in recent_tradeins_qs]

            # 7. Trả về cấu trúc JSON chuẩn hóa
            return Response({
                "range": range_str,
                "overview": {
                    "total_revenue": int(total_revenue),
                    "total_payout": int(total_payout),
                    "total_refund": int(total_refund),
                    "net_profit": int(net_profit),
                    "total_orders": total_orders_count,
                    "total_tradeins": total_tradeins_count,
                    "new_users": new_users_count
                },
                "charts": {
                    "trend": chart_data
                },
                "distributions": {
                    "orders": order_distributions,
                    "tradeins": tradein_distributions
                },
                "recent_activities": {
                    "orders": recent_orders,
                    "tradeins": recent_tradeins
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Lỗi khi truy xuất dữ liệu dashboard admin: {e}")
            return Response(
                {"error": "Không thể tải dữ liệu thống kê dashboard.", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
