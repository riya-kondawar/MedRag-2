import React, { useState, useEffect } from 'react';
import { askQuestion, uploadFile } from './services/api';
import type { AskResponse, Chunk, MedicalAnalysis } from './services/api';

// ShadCN UI Components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { 
  Activity, Send, FileText, Beaker, Search, 
  UploadCloud, CheckCircle2, Loader2, AlertCircle, Info, User,
  Stethoscope, Lightbulb, ClipboardCheck, DownloadCloud
} from "lucide-react";

// --- Sub-Component: Clinical Insights ---
function ClinicalInsights({ analysis }: { analysis: MedicalAnalysis }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 p-1">
      <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
        <div className="flex items-center gap-2 mb-2 text-green-700 font-bold text-xs uppercase">
          <ClipboardCheck size={14} /> AI Clinical Summary
        </div>
        <p className="text-xs text-green-800 leading-relaxed italic">
          Based on the detected {analysis.report_type}, the system has identified {analysis.abnormal.length} values outside the standard reference range. 
          Priority focus should be placed on {analysis.abnormal[0]?.name || "general health markers"}.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Recommendations</h3>
        <div className="space-y-2">
          <div className="flex gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-blue-200 transition-colors">
            <Lightbulb className="text-amber-500 shrink-0" size={18} />
            <p className="text-[11px] text-slate-600">Consider discussing the flagged values with a specialist in internal medicine.</p>
          </div>
          <div className="flex gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
            <Stethoscope className="text-blue-500 shrink-0" size={18} />
            <p className="text-[11px] text-slate-600">Prepare your clinical history for a follow-up consultation within 7-10 days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Component: Real-Time Analysis Dashboard ---
function AnalysisDashboard({ data }: { data: MedicalAnalysis }) {
  
  const handleDownload = () => {
    // Direct link to the FastAPI download endpoint
    window.open("http://localhost:8000/download-report", "_blank");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      {/* Patient Info Card */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm relative group">
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 text-blue-600">
                <User size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Patient Profile</span>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-blue-600 hover:bg-blue-100"
                onClick={handleDownload}
                title="Quick Export"
            >
                <DownloadCloud size={14} />
            </Button>
        </div>
        <h3 className="text-sm font-bold text-slate-800 truncate">{data.patient_info?.name || "Unknown Patient"}</h3>
        <p className="text-[11px] text-slate-500 mt-1">{data.patient_info?.age_gender_raw || "Metadata missing"}</p>
        <div className="mt-3 pt-3 border-t border-blue-100 flex justify-between items-center text-[9px] text-blue-400">
          <span>Date: {data.patient_info?.registration_date || "N/A"}</span>
          <Badge variant="outline" className="text-[8px] h-4 bg-white border-blue-100">Verified</Badge>
        </div>
      </div>

      <Tabs defaultValue="findings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 p-1 h-9">
          <TabsTrigger value="findings" className="text-[10px] uppercase font-bold">Findings</TabsTrigger>
          <TabsTrigger value="insights" className="text-[10px] uppercase font-bold">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="findings" className="mt-0">
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {data.abnormal && data.abnormal.length > 0 ? (
              data.abnormal.map((item, i) => (
                <div key={i} className="group p-3 bg-white border border-slate-100 rounded-lg hover:border-red-200 transition-all shadow-sm">
                  <div className="flex justify-between items-start mb-1.5">
                    <p className="text-[11px] font-bold text-slate-700 leading-tight">{item.name}</p>
                    <Badge className={`h-4 text-[8px] px-1 font-bold ${item.flag === 'H' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                      {item.flag}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <p className="text-[13px] font-mono text-red-600 font-bold">
                      {item.result} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 tabular-nums">Range: {item.ref_low}-{item.ref_high}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-[10px] text-slate-400">No abnormal values detected.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="insights" className="mt-0">
          <ClinicalInsights analysis={data} />
        </TabsContent>
      </Tabs>

      {/* Persistence Feature: Export Action */}
      <Button 
        onClick={handleDownload}
        className="w-full bg-slate-900 hover:bg-black text-[10px] font-bold uppercase py-5 flex gap-2"
      >
        <FileText size={16} /> Export clinical data (.xlsx)
      </Button>
    </div>
  );
}

// --- Sub-Component: File Upload ---
function FileUploadZone({ onUploadSuccess }: { onUploadSuccess: (analysis: MedicalAnalysis) => void }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('uploading');
    try {
      const response = await uploadFile(file);
      if (response.status === "success") {
        setStatus('success');
        onUploadSuccess(response.analysis);
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <Card className="p-5 border-dashed border-2 bg-slate-50/50 border-slate-200 transition-colors hover:bg-slate-50 relative group overflow-hidden">
      <div className="flex flex-col items-center justify-center gap-3 text-center relative z-10">
        {status === 'idle' && (
          <>
            <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
              <UploadCloud className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-700">Scan Medical Document</p>
              <p className="text-[9px] text-slate-400 mt-0.5">PDF, PNG, JPG supported</p>
            </div>
            <input type="file" className="hidden" id="sidebar-upload" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold bg-white" asChild>
              <label htmlFor="sidebar-upload" className="cursor-pointer">Upload Report</label>
            </Button>
          </>
        )}
        {status === 'uploading' && (
          <div className="py-2 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <p className="text-[10px] text-slate-500 font-medium animate-pulse tracking-tight">Extracting RAG Context...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="py-2 text-green-600 flex flex-col items-center gap-1">
            <CheckCircle2 size={24} className="animate-bounce" />
            <p className="text-[10px] font-bold uppercase">Success</p>
          </div>
        )}
        {status === 'error' && (
          <div className="py-2 text-red-600 flex flex-col items-center gap-1">
            <AlertCircle size={24} />
            <p className="text-[10px] font-bold">Failed</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string, chunks?: Chunk[]}[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MedicalAnalysis | null>(null);
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const userMsg = query;
    setQuery("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const data: AskResponse = await askQuestion(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: data.answer, chunks: data.chunks }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Assistant offline. Check FastAPI server." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <aside className="w-80 border-r bg-white p-6 hidden lg:flex flex-col gap-6 shadow-sm overflow-y-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-md">
            <Activity size={20} />
          </div>
          <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase italic">MedRag <span className="text-blue-600">SLM</span></h1>
        </div>

        <FileUploadZone onUploadSuccess={(data) => setAnalysis(data)} />

        {analysis ? <AnalysisDashboard data={analysis} /> : (
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Knowledge Status</h3>
            <Card className="shadow-none border-slate-200 bg-slate-50/50 border-dashed">
              <CardContent className="p-6 text-center">
                <FileText className="mx-auto text-slate-200 mb-3" size={32} />
                <p className="text-[10px] text-slate-400">Knowledge base empty. Please upload a report to proceed.</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-auto p-4 bg-blue-50/50 rounded-xl border border-blue-100">
           <p className="text-[10px] text-blue-700 font-bold mb-1 flex items-center gap-1.5 uppercase">
             <Info size={12} strokeWidth={3} /> Advisory
           </p>
           <p className="text-[9px] text-blue-600 font-medium leading-tight">
             AI-generated content is for analysis only. Do not use for definitive diagnosis.
           </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl relative">
        {/* Header and ScrollArea code remains same */}
        <header className="h-16 border-b flex items-center px-8 bg-white/80 backdrop-blur-md justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-tight">
              <Beaker size={16} className="text-blue-500" /> Diagnosis Chat
            </h2>
            {analysis && (
               <Badge variant="outline" className="text-[10px] font-bold text-blue-600 bg-blue-50 border-blue-100">
                 {analysis.report_type}
               </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Secure Core</span>
          </div>
        </header>

        <ScrollArea className="flex-1 px-4 lg:px-0 bg-slate-50/30">
          <div className="max-w-3xl mx-auto py-12 space-y-10">
            {!analysis && messages.length === 0 && (
              <div className="text-center py-24 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm rotate-3">
                  <Search className="text-slate-200" size={40} />
                </div>
                <h3 className="text-slate-800 font-bold text-lg">AI Medical Intelligence</h3>
                <p className="text-slate-400 text-sm max-w-sm mt-2">Upload your lab results to unlock semantic chat and automated report highlighting.</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                <div className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  <p className="text-[13px] leading-relaxed font-medium">{m.text}</p>
                  
                  {m.role === 'ai' && m.chunks && m.chunks.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">RAG Context:</span>
                      {m.chunks.map((c, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-[9px] cursor-pointer hover:bg-slate-100 border transition-all font-bold px-2 py-0.5"
                          onClick={() => { setSelectedChunk(c); setIsDrawerOpen(true); }}
                        >
                          {c.test_name || 'Evidence'}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-6 py-4 border border-slate-100 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <footer className="p-6 border-t bg-white sticky bottom-0 z-20">
          <div className="max-w-3xl mx-auto flex gap-4 items-center">
            <div className="relative flex-1 group">
              <Input 
                className="pr-14 py-7 rounded-2xl border-slate-200 focus-visible:ring-blue-600 bg-slate-50/50 shadow-inner text-sm transition-all focus:bg-white"
                placeholder={analysis ? "Query report data..." : "Knowledge base locked."}
                disabled={!analysis}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button 
                size="icon" 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 h-10 w-10 hover:bg-blue-700 active:scale-95 shadow-md"
                onClick={handleSend}
                disabled={loading || !analysis}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </footer>
      </main>

      {/* Source Evidence Drawer code remains same */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] border-l-8 border-l-blue-600 p-8">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl font-bold uppercase italic">Raw RAG Fragment</SheetTitle>
            <SheetDescription className="text-xs uppercase font-bold text-slate-400">Context used for AI inference</SheetDescription>
          </SheetHeader>
          <div className="mt-10 space-y-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-[12px] text-blue-100 leading-relaxed shadow-2xl relative">
              "{selectedChunk?.content}"
            </div>
            
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Test Name</span>
                <p className="font-bold text-slate-800 text-sm">{selectedChunk?.test_name || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Relevance</span>
                <p className="font-bold text-blue-600 text-sm">{(selectedChunk?.score ? selectedChunk.score * 100 : 0).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}





// // src/App.tsx
// import { useState } from "react";
// import { askQuestion, uploadDocument } from "@/services/api";
// import { FileUpload } from "@/components/upload/FileUpload";
// import { MedicalDashboard } from "@/components/MedicalDashboard";
// import { ChatMessage as ChatBubble } from "@/components/chat/ChatMessage";
// import { ReportsSummary } from "@/components/ReportsSummary";

// function App() {
//   const [analysis, setAnalysis] = useState<any>(null);
//   const [messages, setMessages] = useState<any[]>([]);

//   const handleUpload = async (file: File) => {
//     const result = await uploadDocument(file);
//     setAnalysis(result);
//   };

//   const handleAsk = async (question: string) => {
//     const res = await askQuestion(question);
//     setMessages((prev) => [...prev, res]);
//   };

//   return (
//     <div className="min-h-screen p-6 bg-gray-50">
//       <h1 className="text-2xl font-bold mb-4">🏥 MedRag</h1>

//       <FileUpload onUpload={handleUpload} />

//       {analysis && <MedicalDashboard data={analysis} />}

//       {/* <ReportsSummary /> */}
//       <ReportsSummary chunks={analysis?.chunks} />


//       <div className="mt-6">
//         {messages.map((m, i) => (
//           <ChatBubble key={i} message={m} />
//         ))}
//       </div>
//     </div>
//   );
// }

// export default App;

