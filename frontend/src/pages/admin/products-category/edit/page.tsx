import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import React from "react";

import {
  getCategoryDetail,
  updateCategory,
} from "../../../../services/admin/products-category/productCategoryService";

function slugifyLite(input: string) {
  const s = (input || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s;
}

export default function ProductCategoryEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState<File | null>(null);
  const [iconUrl, setIconUrl] = useState("");

  const previewUrl = useMemo(() => {
    if (icon) return URL.createObjectURL(icon);
    return iconUrl || "";
  }, [icon, iconUrl]);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      try {
        const c: any = await getCategoryDetail(id);
        setName(c?.name ?? "");
        setSlug(c?.slug ?? "");
        setIconUrl(c?.icon ?? "");
      } catch (err: any) {
        toast.error(err?.message || "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const finalName = name.trim();
    const finalSlug = (slug || slugifyLite(finalName)).trim();

    if (!finalName) {
      toast.error("Name is required");
      return;
    }
    if (!finalSlug) {
      toast.error("Slug is required");
      return;
    }

    setSaving(true);
    try {
      await updateCategory(id, { name: finalName, slug: finalSlug, icon });
      toast.success("Category updated");
      navigate("/admin/products-category", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-slate-300">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Edit Category</h1>
          <p className="text-slate-400">Update category info</p>
        </div>
        <Link to="/admin/products-category">
          <Button
            variant="outline"
            className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100"
          >
            Back
          </Button>
        </Link>
      </div>

      <Card className="bg-slate-950 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle className="text-slate-100">Category info</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300">Name</Label>
              <Input
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  if (!slug) setSlug(slugifyLite(v));
                }}
                className="bg-slate-900/60 border-slate-800 text-slate-100"
                required
              />
            </div>

            <div>
              <Label className="text-slate-300">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="bg-slate-900/60 border-slate-800 text-slate-100"
                required
              />
            </div>

            <div>
              <Label className="text-slate-300">Icon (optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setIcon(e.target.files?.[0] ?? null)}
                className="bg-slate-900/60 border-slate-800 text-slate-100"
              />
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="mt-3 max-w-[220px] border border-slate-800 rounded"
                />
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-600/90 text-white"
              >
                Save
              </Button>
              <Link to="/admin/products-category">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 text-slate-100"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
