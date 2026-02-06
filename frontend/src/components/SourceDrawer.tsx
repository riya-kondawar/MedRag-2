import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Chunk } from "@/services/api";
import { Badge } from "./ui/badge";

export function SourceDrawer({ 
  selectedChunk, 
  isOpen, 
  onClose 
}: { 
  selectedChunk: Chunk | null, 
  isOpen: boolean, 
  onClose: () => void 
}) {
  if (!selectedChunk) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            Source Documentation
          </SheetTitle>
          <SheetDescription>
            Actual data extracted from your medical report.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Extracted Content</h4>
            <p className="text-sm text-slate-800 font-mono leading-relaxed">
              "{selectedChunk.content}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Test Name</p>
              <p className="text-sm">{selectedChunk.test_name || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Confidence Score</p>
              <Badge variant="secondary">{(selectedChunk.score * 100).toFixed(1)}% Match</Badge>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}