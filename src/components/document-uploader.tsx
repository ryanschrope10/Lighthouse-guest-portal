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
    /** Free-text label the guest typed when documentType === "other". */
    customLabel: string | null;
    expiryDate: string | null;
    fileData: string; // base64 (no data: prefix)
    contentType: string;
  }) => Promise<{ ok: boolean; error?: string }> | void;
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

const MAX_BYTES = 5 * 1024 * 1024;

const DOCUMENT_TYPE_OPTIONS = [
  { label: "Insurance", value: "insurance" },
  { label: "Vehicle Registration", value: "registration" },
  { label: "Driver's License", value: "license" },
  { label: "Other", value: "other" },
];

const TYPES_REQUIRING_EXPIRY = ["insurance", "registration"];

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      // data:<mime>;base64,<data> -> <data>
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

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
  const [customLabel, setCustomLabel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const processFile = useCallback((file: File) => {
    setError(null);
    setUploadDone(false);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please select a JPEG, PNG, WebP, or PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File must be under 5 MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    );
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
    setUploading(false);
    setUploadDone(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const isOther = documentType === "other";
  const trimmedCustomLabel = customLabel.trim();

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !documentType) return;
    if (isOther && !trimmedCustomLabel) {
      setError("Please enter a document type.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const fileData = await readAsBase64(selectedFile);
      const result = await onUploadComplete?.({
        file: selectedFile,
        documentType,
        customLabel: isOther ? trimmedCustomLabel : null,
        expiryDate: expiryDate || null,
        fileData,
        contentType: selectedFile.type,
      });
      if (result && result.ok === false) {
        setError(result.error || "Upload failed. Please try again.");
        return;
      }
      setUploadDone(true);
    } catch {
      setError("Could not upload the file. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [
    selectedFile,
    documentType,
    isOther,
    trimmedCustomLabel,
    expiryDate,
    onUploadComplete,
  ]);

  const showExpiry = TYPES_REQUIRING_EXPIRY.includes(documentType);

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
              JPEG, PNG, WebP, or PDF (max 5 MB)
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

          {uploadDone && (
            <p className="mt-3 text-xs font-medium text-green-700">
              Upload complete
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Document type selector */}
      <Select
        label="Document type"
        placeholder="Select document type"
        options={DOCUMENT_TYPE_OPTIONS}
        value={documentType}
        onChange={(e) => setDocumentType(e.target.value)}
      />

      {/* Free-text type when "Other" is selected */}
      {isOther && (
        <Input
          label="Document name"
          placeholder="e.g. Pet vaccination record"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          helperText="Tell us what this document is."
        />
      )}

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
        disabled={
          !selectedFile ||
          !documentType ||
          (isOther && !trimmedCustomLabel) ||
          uploading ||
          uploadDone
        }
        loading={uploading}
        onClick={handleUpload}
      >
        {uploadDone ? "Uploaded" : "Upload Document"}
      </Button>
    </div>
  );
}
