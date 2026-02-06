import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, Stethoscope, AlertTriangle } from "lucide-react";

export function MedicalDashboard({ analysis, suggestions }: { analysis: any, suggestions: string }) {
  if (!analysis) return null;

  return (
    <div className="space-y-6 p-4 border-l bg-slate-50/30 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope className="text-blue-600" size={20} />
        <h2 className="text-lg font-bold text-slate-800">Clinical Insights</h2>
      </div>

      {/* AI Suggestions Section */}
      <Alert className="bg-blue-50 border-blue-200">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 font-bold">AI Recommendations</AlertTitle>
        <AlertDescription className="text-blue-700 text-sm whitespace-pre-wrap">
          {suggestions}
        </AlertDescription>
      </Alert>

      {/* Abnormal Values Breakdown */}
      <div className="space-y-3 mt-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" /> Flagged Results
        </h3>
        
        <Accordion type="single" collapsible className="w-full">
          {analysis.abnormal.map((test: any, i: number) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-none mb-2 bg-white rounded-lg px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex justify-between w-full pr-4">
                  <span className="text-sm font-semibold text-slate-700">{test.name}</span>
                  <Badge variant="destructive" className="text-[10px]">{test.result} {test.unit}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-500 pb-3 border-t pt-2">
                <p><strong>Reference Range:</strong> {test.ref_low} - {test.ref_high} {test.unit}</p>
                <p className="mt-1 font-medium text-red-600 uppercase">Status: {test.flag === 'H' ? 'Above Normal' : 'Below Normal'}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}