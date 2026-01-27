export default function TreeSelectOptions({ nodes, level = 0 }) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;

  return (
    <>
      {nodes.map((n) => (
        <option key={n._id} value={n._id}>
          {"--".repeat(level)} {n.title}
        </option>
      ))}
      {nodes.map((n) =>
        n.children && n.children.length ? (
          <TreeSelectOptions key={`${n._id}-children`} nodes={n.children} level={level + 1} />
        ) : null
      )}
    </>
  );
}
