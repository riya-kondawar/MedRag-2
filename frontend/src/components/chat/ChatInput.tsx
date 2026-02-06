import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface Props {
  value: string;
  disabled: boolean;
  loading: boolean;
  onChange: (v: string) => void;
  onSend: () => void;
}

export function ChatInput({
  value,
  disabled,
  loading,
  onChange,
  onSend,
}: Props) {
  return (
    <div className="flex gap-3">
      <Input
        value={value}
        disabled={disabled}
        placeholder="Ask about report values…"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading && !disabled) onSend();
        }}
      />
      <Button onClick={onSend} disabled={disabled || loading}>
        <Send size={16} />
      </Button>
    </div>
  );
}
