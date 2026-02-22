function toggle(list, value, checked) {
  const set = new Set(Array.isArray(list) ? list : []);
  if (checked) set.add(value);
  else set.delete(value);
  return Array.from(set);
}

export default function PermissionsMatrix({ roles, permissions, value, onChange }) {
  const current = value || {};

  const onToggle = (roleId, permKey, checked) => {
    const next = {
      ...current,
      [roleId]: toggle(current[roleId], permKey, checked)
    };
    onChange(next);
  };

  return (
    <div className="border rounded bg-card overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Quyền</th>
            {(roles || []).map((r) => (
              <th key={r._id} className="p-2 text-left">
                {r.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(permissions || []).map((p) => (
            <tr key={p.key} className="border-t">
              <td className="p-2">{p.label}</td>
              {(roles || []).map((r) => {
                const list = current[r._id] || r.permissions || [];
                const checked = Array.isArray(list) && list.includes(p.key);
                return (
                  <td key={`${p.key}-${r._id}`} className="p-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onToggle(r._id, p.key, e.target.checked)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
