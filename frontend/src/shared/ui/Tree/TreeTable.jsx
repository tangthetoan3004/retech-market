function Row({ node, level, columns, renderActions }) {
  return (
    <>
      <tr className="border-t">
        {columns.map((col) => (
          <td key={col.key} className="p-2">
            {col.render(node, level)}
          </td>
        ))}
        <td className="p-2">{renderActions ? renderActions(node) : null}</td>
      </tr>
      {Array.isArray(node.children) && node.children.length
        ? node.children.map((c) => (
          <Row
            key={c._id}
            node={c}
            level={level + 1}
            columns={columns}
            renderActions={renderActions}
          />
        ))
        : null}
    </>
  );
}

export default function TreeTable({ nodes, columns, renderActions }) {
  if (!Array.isArray(nodes)) return null;

  return (
    <div className="border rounded bg-white overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="p-2 text-left">
                {c.title}
              </th>
            ))}
            <th className="p-2 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((n) => (
            <Row key={n._id} node={n} level={0} columns={columns} renderActions={renderActions} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
