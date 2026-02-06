import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Activity, Beaker } from "lucide-react";
import { Chunk } from "@/services/api";

interface ChatMessageProps {
  role: 'user' | 'ai';
  text: string;
  chunks?: Chunk[];
  onSourceClick: (chunk: Chunk) => void;
}

export function ChatMessage({ role, text, chunks, onSourceClick }: ChatMessageProps) {
  const isAi = role === 'ai';

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-[85%] flex flex-col ${role === 'user' ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          isAi ? 'bg-white border border-slate-200 text-slate-800' : 'bg-blue-600 text-white'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        </div>

        {isAi && chunks && chunks.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Beaker size={10} /> Evidence:
            </span>
            {chunks.map((chunk, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className="cursor-pointer hover:bg-slate-100 text-[10px] transition-colors"
                onClick={() => onSourceClick(chunk)}
              >
                {chunk.test_name || "Report Chunk"}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}