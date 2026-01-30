import { Link } from "react-router-dom";
import { useState } from "react";

type Props = {
  items: any[];
};

const fmt = new Intl.NumberFormat("vi-VN");

function money(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0₫";
  return `${fmt.format(n)}₫`;
}

function firstChar(text: string) {
  const s = String(text || "").trim();
  return s ? s[0].toUpperCase() : "P";
}

function Card({ p, idx }: { p: any; idx: number }) {
  const id = p?.id ?? idx;
  const slug = p?.slug ?? "";
  const title = p?.title || p?.name || "Unnamed product";
  const brand = String(p?.brand || "").trim();
  const grade = String(p?.grade || "").trim();

  const thumb = String(p?.thumbnail || p?.main_image || p?.image || "").trim();

  const priceNew = p?.priceNew ?? p?.price ?? 0;
  const priceOld = p?.original_price ?? p?.price ?? 0;

  const hasDiscount = Number(priceOld) > Number(priceNew) && Number(priceOld) > 0;
  const href = slug ? `/products/detail/${slug}` : `/products`;

  const [imgOk, setImgOk] = useState(Boolean(thumb));

  return (
    <Link
      key={id}
      to={href}
      className="group block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors overflow-hidden"
    >
      <div className="relative w-full aspect-[4/3] bg-black/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />

        {thumb && imgOk ? (
          <img
            src={thumb}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity"
            loading="lazy"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-black/35 border border-white/10 flex items-center justify-center text-white text-2xl font-extrabold tracking-wide">
              {firstChar(brand || title)}
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {grade ? (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-black/60 text-white border border-white/10">
              Grade {grade}
            </span>
          ) : (
            <span />
          )}

          {brand ? (
            <span className="max-w-[60%] truncate inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-white/85 text-black">
              {brand}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4 overflow-hidden">
        <div className="text-[15px] font-semibold text-white leading-snug line-clamp-2 min-h-[44px]">
          {title}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-extrabold text-white tabular-nums truncate">
              {money(priceNew)}
            </div>

            {hasDiscount ? (
              <div className="text-sm text-white/60 line-through tabular-nums truncate">
                {money(priceOld)}
              </div>
            ) : (
              <div className="text-sm text-white/60">&nbsp;</div>
            )}
          </div>

          <span className="shrink-0 inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold bg-blue-500/90 text-white group-hover:bg-blue-500 transition-colors">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ProductGrid({ items }: Props) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((p: any, idx: number) => (
        <Card key={p?.id ?? idx} p={p} idx={idx} />
      ))}
    </div>
  );
}
