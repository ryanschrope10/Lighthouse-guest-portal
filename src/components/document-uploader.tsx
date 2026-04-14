"use client";

import { useState, useRef, useCallback, useEffect, type DragEvent } from "react";
import { Upload, FileText, Image, X } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DocumentUploaderProps {
  onUploadComplete?: (data: {
    file: File;
    documentType: string;
    expiryDate: string | null;
  }) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const DOCUMENT_TYPE_OPTIONS = [
  { label: "Insurance", value: "insurance" },
  { label: "Vehicle Registration", value: "registration" },
  { label: "Driver's License", value: "license" },
];

const TYPES_REQUIRING_EXPIRY = ["insurance", "registration"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentUploader({
  onUploadComplete,
  className,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);

  // Clean up object URL on unmount / file change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ---- File selection helpers ----

  const processFile = useCallback((file: File) => {
    setError(null);
    setUploadDone(false);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please select a JPEG, PNG, WebP, or PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setUploading(false);
    setUploadDone(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  // ---- Mock upload ----

  const handleUpload = useCallback(() => {
    if (!selectedFile || !documentType) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    // Simulate upload progress
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 18 + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setProgress(100);
        setUploading(false);
        setUploadDone(true);
        onUploadComplete?.({
          file: selectedFile,
          documentType,
          expiryDate: expiryDate || null,
        });
      } else {
        setProgress(Math.round(current));
      }
    }, 200);
  }, [selectedFile, documentType, expiryDate, onUploadComplete]);

  // ---- Determine if expiry field is needed ----

  const showExpiry = TYPES_REQUIRING_EXPIRY.includes(documentType);

  // ---- Render ----

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Drop zone / file preview */}
      {!selectedFile ? (
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={clsx(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-gold-400 bg-gold-50"
              : "border-sand-300 bg-sand-50 hover:border-gold-300 hover:bg-gold-50/50",
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand-100">
            <Upload className="h-6 w-6 text-sand-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Tap to select a file
            </p>
            <p className="mt-0.5 text-xs text-sand-500 hidden sm:block">
              or drag and drop here
            </p>
            <p className="mt-1 text-xs text-sand-400">
              JPEG, PNG, WebP, or PDF (max 10 MB)
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      ) : (
        <div className="relative rounded-xl border border-sand-200 bg-white p-4">
          <button
            type="button"
            onClick={clearFile}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-sand-400 transition-colors hover:bg-sand-100 hover:text-sand-600"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            {/* Preview thumbnail or icon */}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-16 w-16 flex-shrink-0 rounded-lg border border-sand-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-sand-200 bg-sand-50">
                {selectedFile.type === "application/pdf" ? (
                  <FileText className="h-7 w-7 text-red-500" />
                ) : (
                  <Image className="h-7 w-7 text-sand-400" />
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {selectedFile.name}
              </p>
              <p className="mt-0.5 text-xs text-sand-500">
                {(selectedFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {(uploading || uploadDone) && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-sand-100">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-300",
                    uploadDone ? "bg-green-500" : "bg-gold-500",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-sand-500">
                {uploadDone ? "Upload complete" : `${progress}%`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Document type selector */}
      <Select
        label="Document type"
        placeholder="Select document type"
        options={DOCUMENT_TYPE_OPTIONS}
        value={documentType}
        onChange={(e) => setDocumentType(e.target.value)}
      />

      {/* Optional expiry date */}
      {showExpiry && (
        <Input
          label="Expiry date"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          helperText="When does this document expire?"
        />
      )}

      {/* Upload button */}
      <Button
        variant="primary"
        size="md"
        className="w-full"
        disabled={!selectedFile || !documentType || uploading || uploadDone}
        loading={uploading}
        onClick={handleUpload}
      >
        {uploadDone ? "Uploaded" : "Upload Document"}
      </Button>
    </div>
  );
}
