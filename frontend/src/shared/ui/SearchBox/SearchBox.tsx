import { useState } from "react";

export default function SearchBox({ value, onSubmit }) {
  const [keyword, setKeyword] = useState(value || "");

  const submit = (ev) => {
    ev.preventDefault();
    onSubmit(keyword);
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="flex-1 border rounded px-3 py-2"
        placeholder="Nhập từ khóa"
        value={keyword}
        onChange={(x) => setKeyword(x.target.value)}
      />
      <button className="border rounded px-3 py-2" type="submit">
        Tìm
      </button>
    </form>
  );
}
