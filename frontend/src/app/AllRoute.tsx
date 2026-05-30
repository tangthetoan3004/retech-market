import { useEffect } from "react";
import { useRoutes, useLocation } from "react-router-dom";
import { routes } from "../routes";

export default function AllRoute() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  const elements = useRoutes(routes);
  return <>{elements}</>;
}
