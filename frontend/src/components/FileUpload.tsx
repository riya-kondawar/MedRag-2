import React, { useState } from 'react';
import { uploadFile } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloud, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    try {
      await uploadFile(file);
      setStatus('success');
      onUploadSuccess();
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || "Upload failed");
    }
  };

  return (
    <Card className="p-4 border-dashed border-2 bg-slate-50/50">
      <div className="flex flex-col items-center justify-center gap-2">
        {status === 'idle' && (
          <>
            <UploadCloud className="text-slate-400" size={32} />
            <p className="text-xs font-medium text-slate-600">Upload Report (PDF/PNG)</p>
            <input 
              type="file" 
              className="hidden" 
              id="file-upload" 
              accept=".pdf,.png,.jpg"
              onChange={handleFileChange} 
            />
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">Select File</label>
            </Button>
          </>
        )}

        {status === 'uploading' && (
          <div className="flex flex-col items-center py-2">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={24} />
            <p className="text-xs text-slate-500 italic">Processing OCR & RAG...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-2 text-green-600">
            <CheckCircle2 size={24} className="mb-2" />
            <p className="text-xs font-bold">Report Ingested!</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-2 text-red-600">
            <AlertCircle size={24} className="mb-2" />
            <p className="text-xs font-bold">Error: {error}</p>
            <Button variant="link" size="sm" onClick={() => setStatus('idle')}>Try Again</Button>
          </div>
        )}
      </div>
    </Card>
  );
}