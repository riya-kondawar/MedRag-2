import type { Chunk } from "@/types/medical";
import { Badge } from "@/components/ui/badge";
import { Beaker } from "lucide-react";

interface Props {
  role: "user" | "ai";
  text: string;
  chunks?: Chunk[];
  onSourceClick: (chunk: Chunk) => void;
}

export function ChatMessage({ role, text, chunks, onSourceClick }: Props) {
  const isAI = role === "ai";

  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] px-5 py-3 rounded-2xl ${
          isAI
            ? "bg-slate-50 border"
            : "bg-blue-600 text-white"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{text}</p>

        {isAI && chunks && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[9px] uppercase text-slate-400 flex items-center gap-1">
              <Beaker size={10} /> Evidence
            </span>
            {chunks.map((c, i) => (
              <Badge
                key={i}
                variant="outline"
                className="cursor-pointer text-[9px]"
                onClick={() => onSourceClick(c)}
              >
                {c.test_name || "Chunk"}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

