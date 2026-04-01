import { useMemo, useState } from "react";
import ImageUpload from "../../../../shared/ui/ImageUpload/ImageUpload";

export default function BrandForm({ initialValues, onSubmit, submitting }: any) {
    const init = useMemo(() => {
        return {
            name: "",
            description: "",
            logo: "",
            ...initialValues
        };
    }, [initialValues]);

    const [name, setName] = useState(init.name);
    const [description, setDescription] = useState(init.description || "");
    const [logoFile, setLogoFile] = useState(null);

    const submit = (ev: any) => {
        ev.preventDefault();
        onSubmit({
            name,
            description,
            logo: logoFile
        });
    };

    return (
        <form onSubmit={submit} className="border rounded p-4 bg-card space-y-3">
            <div>
                <label className="block text-sm font-medium mb-1">Brand Name *</label>
                <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Brand Name"
                    value={name}
                    onChange={(x) => setName(x.target.value)}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                    className="w-full border rounded px-3 py-2 min-h-[100px]"
                    placeholder="Brand Description"
                    value={description}
                    onChange={(x) => setDescription(x.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Logo / Image</label>
                <ImageUpload label="Upload Logo" value={init.logo || ""} onChange={setLogoFile} />
            </div>

            <button className="border rounded px-4 py-2 bg-blue-600 text-white" disabled={submitting} type="submit">
                {submitting ? "Saving..." : "Save Brand"}
            </button>
        </form>
    );
}
