import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { Chunk } from "@/types/medical";

interface Props {
  chunks?: Chunk[]; // ✅ optional
}

export function ReportsSummary({ chunks = [] }: Props) {
  // Safe even if chunks is undefined
  const abnormalTests = chunks.filter(
    (c) => c.flag === "H" || c.flag === "L"
  );

  return (
    <Card className="border-t-4 border-t-blue-600">
      <CardHeader>
        <CardTitle className="text-md flex items-center justify-between">
          Key Findings
          {abnormalTests.length > 0 ? (
            <Badge variant="destructive" className="animate-pulse">
              Attention Required
            </Badge>
          ) : (
            <Badge className="bg-green-500 text-white">
              All Clear
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {abnormalTests.length > 0 ? (
          abnormalTests.map((test, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100"
            >
              <AlertCircle
                className="text-red-600 shrink-0 mt-0.5"
                size={18}
              />
              <div>
                <p className="text-sm font-bold text-red-900">
                  {test.test_name ?? "Abnormal Finding"}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {test.content.length > 120
                    ? `${test.content.slice(0, 120)}…`
                    : test.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <CheckCircle2 size={16} className="text-green-500" />
            No abnormal values detected in retrieved context.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
