import { useState } from "react";
import type { uploadFile } from "@/services/api";
import type { MedicalAnalysis } from "@/types/medical";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  onUploadSuccess: (analysis: MedicalAnalysis) => void;
}

export function FileUpload({ onUploadSuccess }: Props) {
  const [status, setStatus] =
    useState<"idle" | "uploading" | "success" | "error">("idle");

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    try {
      const res = await uploadFile(file);
      if (res.status === "success") {
        onUploadSuccess(res.analysis);
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2500);
      } else {
        throw new Error(res.message);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <Card className="p-5 border-dashed border-2 bg-slate-50/50">
      <div className="flex flex-col items-center gap-3 text-center">
        {status === "idle" && (
          <>
            <UploadCloud className="text-blue-500" size={26} />
            <p className="text-xs font-bold">Upload Medical Report</p>
            <input
              type="file"
              hidden
              id="file-upload"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleChange}
            />
            <Button asChild size="sm" variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse File
              </label>
            </Button>
          </>
        )}

        {status === "uploading" && (
          <>
            <Loader2 className="animate-spin text-blue-600" />
            <p className="text-xs">Running OCR & RAG…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="text-green-600" />
            <p className="text-xs font-bold">Analysis Ready</p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="text-red-600" />
            <p className="text-xs font-bold">Upload Failed</p>
          </>
        )}
      </div>
    </Card>
  );
}
