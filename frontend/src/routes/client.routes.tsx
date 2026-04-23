import type { RouteObject } from "react-router-dom";

import ClientLayout from "../layouts/client/ClientLayout";

import HomePage from "../pages/client/home/page";
import ProductsPage from "../pages/client/products/page";
import ProductDetailPage from "../pages/client/product-detail/page";
import SearchPage from "../pages/client/search/page";
import CartPage from "../pages/client/cart/page";
import CheckoutPage from "../pages/client/checkout/page";
import CheckoutSuccessPage from "../pages/client/checkout-success/page";
import { WishlistPage } from "../pages/client/wishlist/page";
import TradeInsPage from "../pages/client/tradeins/page";
import TradeInsLandingPage from "../pages/client/tradeins/landing";

import UserLoginPage from "../pages/client/user/login/page";
import UserRegisterPage from "../pages/client/user/register/page";
import ForgotPasswordPage from "../pages/client/user/forgot-password/page";
import ForgotPasswordOtpPage from "../pages/client/user/forgot-password-otp/page";
import ResetPasswordPage from "../pages/client/user/reset-password/page";
import UserInfoPage from "../pages/client/user/info/page";

import RequireClientAuth from "./client/_guards/RequireClientAuth";

import UserOrdersPage from "../pages/client/user/orders/page";
import OrderDetailPage from "../pages/client/user/orders/detail/page";
export const clientRoutes: RouteObject[] = [
  {
    path: "/",
    element: <ClientLayout />,
    children: [
      { index: true, element: <HomePage /> },

      { path: "products", element: <ProductsPage /> },
      { path: "products/:categorySlug", element: <ProductsPage /> },
      { path: "products/detail/:slug", element: <ProductDetailPage /> },

      { path: "search", element: <SearchPage /> },

      { path: "cart", element: <CartPage /> },
      { path: "wishlist", element: <WishlistPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "checkout/success", element: <CheckoutSuccessPage /> },
      { path: "tradeins", element: <TradeInsLandingPage /> },
      { path: "tradeins/form", element: <TradeInsPage /> },

      { path: "user/login", element: <UserLoginPage /> },
      { path: "user/register", element: <UserRegisterPage /> },
      { path: "user/password/forgot", element: <ForgotPasswordPage /> },
      { path: "user/password/otp", element: <ForgotPasswordOtpPage /> },
      { path: "user/password/reset", element: <ResetPasswordPage /> },
      {
        element: <RequireClientAuth />,
        children: [
          { path: "user/info", element: <UserInfoPage /> },
          { path: "user/orders", element: <UserOrdersPage /> },
          { path: "user/orders/:id", element: <OrderDetailPage /> }
        ]
      }
    ]
  }
];
