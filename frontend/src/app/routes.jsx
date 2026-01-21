import ClientLayout from "../layouts/client/ClientLayout";

import HomePage from "../routes/client/home/page";
import ProductsPage from "../routes/client/products/page";
import ProductDetailPage from "../routes/client/product-detail/page";
import SearchPage from "../routes/client/search/page";
import CartPage from "../routes/client/cart/page";
import CheckoutPage from "../routes/client/checkout/page";
import CheckoutSuccessPage from "../routes/client/checkout-success/page";

import UserLoginPage from "../routes/client/user/login/page";
import UserRegisterPage from "../routes/client/user/register/page";
import ForgotPasswordPage from "../routes/client/user/forgot-password/page";
import ForgotPasswordOtpPage from "../routes/client/user/forgot-password-otp/page";
import ResetPasswordPage from "../routes/client/user/reset-password/page";
import UserInfoPage from "../routes/client/user/info/page";

import AdminAuthLayout from "../layouts/admin/AdminAuthLayout";
import AdminLayout from "../layouts/admin/AdminLayout";

import LoginPage from "../routes/admin/auth/login/page";
import DashboardPage from "../routes/admin/dashboard/page";

import ProductsListPage from "../routes/admin/products/list/page";
import ProductsCreatePage from "../routes/admin/products/create/page";
import ProductsEditPage from "../routes/admin/products/edit/page";
import ProductsDetailPage from "../routes/admin/products/detail/page";

import ProductCategoryListPage from "../routes/admin/products-category/list/page";
import ProductCategoryCreatePage from "../routes/admin/products-category/create/page";
import ProductCategoryEditPage from "../routes/admin/products-category/edit/page";

import RolesListPage from "../routes/admin/roles/list/page";
import RolesCreatePage from "../routes/admin/roles/create/page";
import RolesEditPage from "../routes/admin/roles/edit/page";
import RolesPermissionsPage from "../routes/admin/roles/permissions/page";

import AccountsListPage from "../routes/admin/accounts/list/page";
import AccountsCreatePage from "../routes/admin/accounts/create/page";
import AccountsEditPage from "../routes/admin/accounts/edit/page";

import MyAccountViewPage from "../routes/admin/my-account/view/page";
import MyAccountEditPage from "../routes/admin/my-account/edit/page";

import SettingsGeneralPage from "../routes/admin/settings/general/page";

import NotFound from "../routes/NotFound";
import RequireAdminAuth from "../routes/admin/_guards/RequireAdminAuth";
import RequireClientAuth from "../routes/client/_guards/RequireClientAuth";

export const routes = [
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
      { path: "checkout", element: <CheckoutPage /> },
      { path: "checkout/success", element: <CheckoutSuccessPage /> },

      { path: "user/login", element: <UserLoginPage /> },
      { path: "user/register", element: <UserRegisterPage /> },
      { path: "user/password/forgot", element: <ForgotPasswordPage /> },
      { path: "user/password/otp", element: <ForgotPasswordOtpPage /> },
      { path: "user/password/reset", element: <ResetPasswordPage /> },
      {
        element: <RequireClientAuth />,
        children: [
          { path: "user/info", element: <UserInfoPage /> }
        ]
      }
    ]
  },
  {
    path: "/admin",
    element: <AdminAuthLayout />,
    children: [
      { path: "auth/login", element: <LoginPage /> }
    ]
  },
  {
    path: "/admin",
    element: <RequireAdminAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },

          { path: "products", element: <ProductsListPage /> },
          { path: "products/create", element: <ProductsCreatePage /> },
          { path: "products/edit/:id", element: <ProductsEditPage /> },
          { path: "products/detail/:id", element: <ProductsDetailPage /> },

          { path: "products-category", element: <ProductCategoryListPage /> },
          { path: "products-category/create", element: <ProductCategoryCreatePage /> },
          { path: "products-category/edit/:id", element: <ProductCategoryEditPage /> },

          { path: "roles", element: <RolesListPage /> },
          { path: "roles/create", element: <RolesCreatePage /> },
          { path: "roles/edit/:id", element: <RolesEditPage /> },
          { path: "roles/permissions", element: <RolesPermissionsPage /> },

          { path: "accounts", element: <AccountsListPage /> },
          { path: "accounts/create", element: <AccountsCreatePage /> },
          { path: "accounts/edit/:id", element: <AccountsEditPage /> },

          { path: "my-account", element: <MyAccountViewPage /> },
          { path: "my-account/edit", element: <MyAccountEditPage /> },

          { path: "settings/general", element: <SettingsGeneralPage /> }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
];
