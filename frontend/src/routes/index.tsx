import type { RouteObject } from "react-router-dom";

import { clientRoutes } from "./client.routes";
import { adminRoutes } from "./admin.routes";
import NotFound from "../pages/NotFound";

export const routes: RouteObject[] = [
  ...clientRoutes,
  ...adminRoutes,
  {
    path: "*",
    element: <NotFound />
  }
];
