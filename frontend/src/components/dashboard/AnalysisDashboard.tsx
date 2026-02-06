import { MedicalAnalysis } from "@/types/medical";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export function AnalysisDashboard({ data }: { data: MedicalAnalysis }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-xl border">
        <div className="flex items-center gap-2 mb-2 text-blue-600">
          <User size={14} />
          <span className="text-[10px] font-bold uppercase">Patient</span>
        </div>
        <h3 className="text-sm font-bold">
          {data.patient_info?.name || "Unknown"}
        </h3>
        <p className="text-[11px] text-slate-500">
          {data.patient_info?.age_gender_raw || "N/A"}
        </p>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Abnormal Findings
          </span>
          <Badge variant="destructive" className="text-[9px]">
            {data.abnormal.length}
          </Badge>
        </div>

        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {data.abnormal.map((a, i) => (
            <div
              key={i}
              className="p-3 bg-white border rounded-lg shadow-sm"
            >
              <div className="flex justify-between">
                <span className="text-xs font-bold">{a.name}</span>
                <Badge>{a.flag}</Badge>
              </div>
              <p className="text-sm font-mono text-red-600">
                {a.result} {a.unit}
              </p>
              <p className="text-[10px] text-slate-400">
                Range: {a.ref_low} – {a.ref_high}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
