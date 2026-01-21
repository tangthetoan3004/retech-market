import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { changeProductStatus, changeProductsMulti, deleteProduct, getProducts } from "../../../../services/admin/products/productsService";
import { showAlert } from "../../../../features/ui/uiSlice";
import FilterStatus from "../../../../shared/ui/FilterStatus/FilterStatus";
import SearchBox from "../../../../shared/ui/SearchBox/SearchBox";
import SortSelect from "../../../../shared/ui/SortSelect/SortSelect";
import Pagination from "../../../../shared/ui/Pagination/Pagination";

function has(perms, key) {
  return Array.isArray(perms) && perms.includes(key);
}

export default function ProductsListPage() {
  const dispatch = useDispatch();
  const perms = useSelector((s) => s.auth.permissions);

  const [sp, setSp] = useSearchParams();

  const page = Number(sp.get("page") || "1");
  const status = sp.get("status") || "";
  const keyword = sp.get("keyword") || "";
  const sortKey = sp.get("sortKey") || "";
  const sortValue = sp.get("sortValue") || "";

  const sortPacked = useMemo(() => {
    if (!sortKey || !sortValue) return "";
    return `${sortKey}-${sortValue}`;
  }, [sortKey, sortValue]);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [selected, setSelected] = useState({});
  const [positions, setPositions] = useState({});

  const setParam = (key, value, resetPage) => {
    const next = new URLSearchParams(sp);
    if (value === "" || value === null || value === undefined) next.delete(key);
    else next.set(key, String(value));
    if (resetPage) next.set("page", "1");
    setSp(next);
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getProducts({
        page,
        status,
        keyword,
        sortKey,
        sortValue
      });

      const items = data.products || data.items || data.records || [];
      const pg = data.objectPagination || data.pagination || data.paging || {};

      setRows(items);
      setPagination({
        page: Number(pg.currentPage || pg.page || page),
        totalPages: Number(pg.totalPage || pg.totalPages || pg.pages || 1)
      });

      const nextPos = {};
      items.forEach((it) => {
        nextPos[it._id] = it.position;
      });
      setPositions(nextPos);
      setSelected({});
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, status, keyword, sortKey, sortValue]);

  const toggleAll = (checked) => {
    const next = {};
    if (checked) rows.forEach((r) => (next[r._id] = true));
    setSelected(next);
  };

  const toggleOne = (id, checked) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  const changeStatus = async (it) => {
    try {
      const next = it.status === "active" ? "inactive" : "active";
      await changeProductStatus(it._id, next);
      dispatch(showAlert({ type: "success", message: "Đã đổi trạng thái" }));
      fetchList();
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    }
  };

  const removeOne = async (it) => {
    const ok = confirm("Bạn có chắc muốn xóa sản phẩm này?");
    if (!ok) return;
    try {
      await deleteProduct(it._id);
      dispatch(showAlert({ type: "success", message: "Đã xoá" }));
      fetchList();
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    }
  };

  const bulk = async (type) => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) {
      alert("Vui lòng chọn ít nhất một bản ghi!");
      return;
    }

    if (type === "delete-all") {
      const ok = confirm("Bạn có chắc muốn xóa những sản phẩm này?");
      if (!ok) return;
    }

    let payload = { type, ids };

    if (type === "change-position") {
      payload = {
        type,
        ids: ids.map((id) => `${id}-${positions[id] || 1}`)
      };
    }

    try {
      await changeProductsMulti(payload);
      dispatch(showAlert({ type: "success", message: "Đã thực hiện thao tác" }));
      fetchList();
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    }
  };

  const allChecked = rows.length > 0 && rows.every((r) => selected[r._id]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Danh sách sản phẩm</h1>
        {has(perms, "products_create") ? (
          <Link className="border rounded px-3 py-2 text-sm bg-white" to="/admin/products/create">
            + Thêm mới
          </Link>
        ) : null}
      </div>

      <div className="border rounded p-3 bg-white space-y-3">
        <FilterStatus
          value={status}
          onChange={(v) => setParam("status", v, true)}
        />

        <SearchBox
          value={keyword}
          onSubmit={(v) => setParam("keyword", v, true)}
        />

        <SortSelect
          value={sortPacked}
          onChange={(packed) => {
            if (!packed) {
              setParam("sortKey", "", true);
              setParam("sortValue", "", true);
              return;
            }
            const [k, v] = packed.split("-");
            setParam("sortKey", k, true);
            setParam("sortValue", v, true);
          }}
          onClear={() => {
            setParam("sortKey", "", true);
            setParam("sortValue", "", true);
          }}
        />
      </div>

      <div className="border rounded p-3 bg-white flex flex-wrap gap-2 items-center">
        <button className="border rounded px-3 py-2 text-sm" type="button" onClick={() => bulk("active")}>
          Active
        </button>
        <button className="border rounded px-3 py-2 text-sm" type="button" onClick={() => bulk("inactive")}>
          Inactive
        </button>
        <button className="border rounded px-3 py-2 text-sm" type="button" onClick={() => bulk("change-position")}>
          Đổi vị trí
        </button>
        <button className="border rounded px-3 py-2 text-sm" type="button" onClick={() => bulk("delete-all")}>
          Xoá
        </button>
      </div>

      <div className="border rounded bg-white overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th className="p-2 text-left">Hình ảnh</th>
              <th className="p-2 text-left">Tiêu đề</th>
              <th className="p-2 text-left">Giá</th>
              <th className="p-2 text-left">Vị trí</th>
              <th className="p-2 text-left">Trạng thái</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={7}>
                  Đang tải...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={7}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              rows.map((it) => (
                <tr key={it._id} className="border-t">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={!!selected[it._id]}
                      onChange={(e) => toggleOne(it._id, e.target.checked)}
                    />
                  </td>
                  <td className="p-2">
                    {it.thumbnail ? (
                      <img src={it.thumbnail} alt={it.title || ""} className="w-24" />
                    ) : null}
                  </td>
                  <td className="p-2">{it.title || ""}</td>
                  <td className="p-2">{it.price}</td>
                  <td className="p-2">
                    <input
                      className="border rounded px-2 py-1 w-20"
                      type="number"
                      min={1}
                      value={positions[it._id] ?? it.position ?? 1}
                      onChange={(e) =>
                        setPositions((p) => ({
                          ...p,
                          [it._id]: Number(e.target.value)
                        }))
                      }
                    />
                  </td>
                  <td className="p-2">
                    {has(perms, "products_edit") ? (
                      <button
                        className={`px-2 py-1 rounded text-xs border ${it.status === "active" ? "bg-green-50" : "bg-red-50"}`}
                        type="button"
                        onClick={() => changeStatus(it)}
                      >
                        {it.status === "active" ? "Hoạt động" : "Dừng"}
                      </button>
                    ) : (
                      it.status
                    )}
                  </td>
                  <td className="p-2 flex gap-2 flex-wrap">
                    <Link className="border rounded px-2 py-1 text-xs" to={`/admin/products/detail/${it._id}`}>
                      Chi tiết
                    </Link>
                    {has(perms, "products_edit") ? (
                      <Link className="border rounded px-2 py-1 text-xs" to={`/admin/products/edit/${it._id}`}>
                        Sửa
                      </Link>
                    ) : null}
                    {has(perms, "products_delete") ? (
                      <button className="border rounded px-2 py-1 text-xs" type="button" onClick={() => removeOne(it)}>
                        Xóa
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        onPage={(p) => setParam("page", p, false)}
      />
    </div>
  );
}
