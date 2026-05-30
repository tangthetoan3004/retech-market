import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-3">
      <h1 className="text-2xl font-semibold">404 Not Found</h1>
      <Link className="underline" to="/">Về trang chủ</Link>
    </div>
  );
}
