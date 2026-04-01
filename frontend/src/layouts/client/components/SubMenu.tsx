import { Link } from "react-router-dom";

export default function SubMenu({ items, basePath }) {
  if (!items || items.length === 0) return null;

  return (
    <ul className="min-w-[220px] rounded border bg-card shadow p-2">
      {items.map((item) => (
        <li key={item.slug} className="relative group">
          <Link
            className="block px-3 py-2 rounded hover:bg-slate-100"
            to={`${basePath}/${item.slug}`}
          >
            {item.title}
          </Link>

          {item.children && item.children.length > 0 && (
            <div className="hidden group-hover:block absolute left-full top-0 pl-2">
              <SubMenu items={item.children} basePath={basePath} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
