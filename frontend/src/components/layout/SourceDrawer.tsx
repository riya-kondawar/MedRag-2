import { Chunk } from "@/types/medical";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function SourceDrawer({
  chunk,
  open,
  onClose,
}: {
  chunk: Chunk | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!chunk) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="p-8">
        <SheetHeader>
          <SheetTitle>Source Evidence</SheetTitle>
        </SheetHeader>

        <pre className="mt-6 text-xs bg-slate-900 text-blue-100 p-4 rounded-lg">
          {chunk.content}
        </pre>

        <p className="mt-4 text-sm">
          Relevance: {(chunk.score * 100).toFixed(2)}%
        </p>
      </SheetContent>
    </Sheet>
  );
}
