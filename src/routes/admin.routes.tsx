import type { RouteObject } from "react-router-dom";

import AdminAuthLayout from "../layouts/admin/AdminAuthLayout";
import AdminLayout from "../layouts/admin/AdminLayout";

import LoginPage from "../pages/admin/auth/login/page";
import DashboardPage from "../pages/admin/dashboard/page";

import ProductsListPage from "../pages/admin/products/list/page";
// import ProductsCreatePage from "../pages/admin/products/create/page";
import ProductsEditPage from "../pages/admin/products/edit/page";
import ProductsDetailPage from "../pages/admin/products/detail/page";

import ProductCategoryListPage from "../pages/admin/products-category/list/page";
import ProductCategoryCreatePage from "../pages/admin/products-category/create/page";
import ProductCategoryEditPage from "../pages/admin/products-category/edit/page";

import RolesListPage from "../pages/admin/roles/list/page";
import RolesCreatePage from "../pages/admin/roles/create/page";
import RolesEditPage from "../pages/admin/roles/edit/page";
import RolesPermissionsPage from "../pages/admin/roles/permissions/page";

import AccountsListPage from "../pages/admin/accounts/list/page";
import AccountsCreatePage from "../pages/admin/accounts/create/page";
import AccountsEditPage from "../pages/admin/accounts/edit/page";

import MyAccountViewPage from "../pages/admin/my-account/view/page";
import MyAccountEditPage from "../pages/admin/my-account/edit/page";

import SettingsGeneralPage from "../pages/admin/settings/general/page";

import TradeInsListPage from "../pages/admin/tradeins/list/page";

import RequireAdminAuth from "./admin/_guards/RequireAdminAuth";
import OrdersListPage from "../pages/admin/order/list/page";

export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: <AdminAuthLayout />,
    children: [{ path: "auth/login", element: <LoginPage /> }]
  },
  {
    path: "/admin",
    element: <RequireAdminAuth />,
    children: [
      {
        element: (
          <AdminLayout />
        ),
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },

          { path: "products", element: <ProductsListPage /> },
          // { path: "products/create", element: <ProductsCreatePage /> },
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

          { path: "settings/general", element: <SettingsGeneralPage /> },
          { path: "tradeins", element: <TradeInsListPage /> },
          { path: "orders", element: <OrdersListPage /> },
        ]
      }
    ]
  }
];
