import { motion } from "motion/react";
import { Upload, X, CheckCircle } from "lucide-react";
import { useState, useRef } from "react";
import { Progress } from "../ui/progress";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  progress: number;
  status: "uploading" | "success" | "error";
}

interface UploadZoneProps {
  maxFiles?: number;
  onFilesChange?: (files: UploadedFile[]) => void;
  accept?: string;
}

export function UploadZone({ maxFiles = 5, onFilesChange, accept = "image/*" }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).slice(0, maxFiles - files.length).map(
      (file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        progress: 0,
        status: "uploading" as const,
      })
    );

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((file) => {
      simulateUpload(file.id);
    });

    onFilesChange?.([...files, ...newFiles]);
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                progress,
                status: progress >= 100 ? "success" : "uploading",
              }
            : f
        )
      );
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {files.length < maxFiles && (
        <motion.div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/5"
              : "border-border hover:border-[var(--accent-blue)]/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-1">
            Drop your images here, or <span className="text-[var(--accent-blue)]">browse</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Upload up to {maxFiles} images (PNG, JPG, WEBP)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </motion.div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
            >
              {/* Thumbnail */}
              <img
                src={file.url}
                alt={file.name}
                className="w-16 h-16 rounded object-cover"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                {file.status === "uploading" && (
                  <Progress value={file.progress} className="mt-2" />
                )}
                {file.status === "success" && (
                  <div className="flex items-center gap-1 text-[var(--status-success)] text-sm mt-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Upload complete</span>
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <button
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                onClick={() => removeFile(file.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
