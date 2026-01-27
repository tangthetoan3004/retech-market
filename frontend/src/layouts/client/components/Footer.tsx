export default function Footer({ settingGeneral }) {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-600">
        {settingGeneral?.copyright || ""}
      </div>
    </footer>
  );
}
