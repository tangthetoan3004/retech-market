import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProductCategoryTree } from "../../../../services/admin/products-category/productCategoryService";
import { showAlert } from "../../../../features/ui/uiSlice";
import TreeTable from "../../../../shared/ui/Tree/TreeTable";

function has(perms, key) {
  return Array.isArray(perms) && perms.includes(key);
}

export default function ProductCategoryListPage() {
  const dispatch = useDispatch();
  const perms = useSelector((s) => s.auth.permissions);

  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState([]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getProductCategoryTree();
      setTree(data.records || data.categories || data.tree || []);
    } catch (err) {
      dispatch(showAlert({ type: "error", message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const columns = [
    {
      key: "title",
      title: "Tiêu đề",
      render: (node, level) => (
        <div style={{ paddingLeft: level * 16 }}>
          {node.title}
        </div>
      )
    },
    {
      key: "position",
      title: "Vị trí",
      render: (node) => node.position
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (node) => node.status
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Danh mục sản phẩm</h1>
        {has(perms, "products-category_create") ? (
          <Link className="border rounded px-3 py-2 text-sm bg-white" to="/admin/products-category/create">
            + Thêm mới
          </Link>
        ) : null}
      </div>

      {loading ? <div>Đang tải...</div> : null}

      <TreeTable
        nodes={tree}
        columns={columns}
        renderActions={(node) => (
          <div className="flex gap-2 flex-wrap">
            {has(perms, "products-category_edit") ? (
              <Link className="border rounded px-2 py-1 text-xs" to={`/admin/products-category/edit/${node._id}`}>
                Sửa
              </Link>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}
