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

// Icons
import { 
  Activity, Send, FileText, Beaker, Search, 
  UploadCloud, CheckCircle2, Loader2, AlertCircle, Info, User 
} from "lucide-react";

// --- Sub-Component: Real-Time Analysis Dashboard ---
function AnalysisDashboard({ data }: { data: MedicalAnalysis }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      {/* Patient Info Card */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2 mb-2 text-blue-600">
          <User size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Patient Profile</span>
        </div>
        <h3 className="text-sm font-bold text-slate-800">{data.patient_info.name || "Unknown Patient"}</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">{data.patient_info.age_gender_raw || "Details not specified"}</p>
        <div className="mt-3 pt-3 border-t border-blue-100 flex justify-between items-center">
          <span className="text-[9px] text-blue-400 italic">Registered: {data.patient_info.registration_date || "N/A"}</span>
        </div>
      </div>

      {/* Abnormal Findings List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Abnormal Findings</h3>
          <Badge variant="outline" className="text-[9px] h-4 bg-red-50 text-red-600 border-red-100">
            {data.abnormal.length} Detected
          </Badge>
        </div>
        
        <div className="space-y-2">
          {data.abnormal.length > 0 ? (
            data.abnormal.map((item, i) => (
              <div key={i} className="group p-2.5 bg-white border border-slate-100 rounded-lg hover:border-red-200 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[11px] font-bold text-slate-700">{item.name}</p>
                  <Badge className={`h-4 text-[8px] px-1 ${item.flag === 'H' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                    {item.flag}
                  </Badge>
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="text-[12px] font-mono text-red-600 font-bold">{item.result} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span></p>
                  <p className="text-[9px] text-slate-400">Range: {item.ref_low}-{item.ref_high}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-[10px] text-slate-400">No abnormal values detected.</p>
            </div>
          )}
        </div>
      </div>
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
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <Card className="p-4 border-dashed border-2 bg-slate-50/50 border-slate-200">
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {status === 'idle' && (
          <>
            <UploadCloud className="text-slate-400" size={28} />
            <p className="text-[11px] font-medium text-slate-500">Add Medical Report (PDF/Img)</p>
            <input type="file" className="hidden" id="sidebar-upload" onChange={handleFileChange} />
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <label htmlFor="sidebar-upload" className="cursor-pointer">Upload</label>
            </Button>
          </>
        )}
        {status === 'uploading' && (
          <div className="py-2 flex flex-col items-center">
            <Loader2 className="animate-spin text-blue-600 mb-2" size={20} />
            <p className="text-[10px] text-slate-500 animate-pulse">Running OCR & RAG...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="py-2 text-green-600 flex flex-col items-center">
            <CheckCircle2 size={20} className="mb-1" />
            <p className="text-[10px] font-bold">Data Ingested</p>
          </div>
        )}
        {status === 'error' && (
          <div className="py-2 text-red-600 flex flex-col items-center">
            <AlertCircle size={20} className="mb-1" />
            <p className="text-[10px] font-bold">Failed</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// --- Main App Component ---
export default function App() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string, chunks?: Chunk[]}[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Real-Time Analysis State
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
      setMessages(prev => [...prev, { role: 'ai', text: "Server connection failed. Check if FastAPI is running on port 8000." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* 1. Sidebar */}
      <aside className="w-80 border-r bg-white p-6 hidden lg:flex flex-col gap-6 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Activity size={20} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">MedRag <span className="text-blue-600">SLM</span></h1>
        </div>

        <FileUploadZone onUploadSuccess={(data) => setAnalysis(data)} />

        {/* Real-Time Dashboard Analysis */}
        {analysis ? (
          <AnalysisDashboard data={analysis} />
        ) : (
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Report Status</h3>
            <Card className="shadow-none border-slate-200 bg-slate-50/50">
              <CardContent className="p-4 text-center">
                <FileText className="mx-auto text-slate-300 mb-2" size={24} />
                <p className="text-[10px] text-slate-400">No report analysis available. Please upload a medical document.</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-auto p-4 bg-blue-50 rounded-xl border border-blue-100">
           <p className="text-[10px] text-blue-700 font-semibold mb-1 flex items-center gap-1">
             <Info size={12}/> Medical Disclaimer
           </p>
           <p className="text-[9px] text-blue-600 leading-tight">
             This AI is for informational purposes. Always consult a certified physician for diagnosis.
           </p>
        </div>
      </aside>

      {/* 2. Chat Main Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 border-b flex items-center px-8 bg-white/80 backdrop-blur-md justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <Beaker size={16} className="text-blue-500" /> AI Diagnostic Assistant
            </h2>
            {analysis && (
               <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-blue-100">
                 Active: {analysis.report_type}
               </Badge>
            )}
          </div>
          <Badge variant="outline" className="text-slate-400 font-normal">Local LLM</Badge>
        </header>

        <ScrollArea className="flex-1 px-4 lg:px-0">
          <div className="max-w-3xl mx-auto py-10 space-y-8">
            {!analysis && messages.length === 0 && (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <Search className="text-slate-200" size={32} />
                </div>
                <h3 className="text-slate-500 font-medium">Knowledge Base Empty</h3>
                <p className="text-slate-400 text-sm">Upload a medical report to start the real-time analysis.</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white selection:bg-blue-400' 
                    : 'bg-slate-100 border border-slate-200 text-slate-800'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  
                  {m.role === 'ai' && m.chunks && m.chunks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Retrieved Evidence:</span>
                      {m.chunks.map((c, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-[9px] cursor-pointer hover:bg-white border transition-all"
                          onClick={() => { setSelectedChunk(c); setIsDrawerOpen(true); }}
                        >
                          {c.test_name || 'Report Data'}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-5 py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <footer className="p-6 border-t bg-white">
          <div className="max-w-3xl mx-auto flex gap-3 items-center">
            <div className="relative flex-1">
              <Input 
                className="pr-12 py-6 rounded-xl border-slate-200 focus-visible:ring-blue-600 bg-slate-50/50 shadow-inner"
                placeholder={analysis ? "Ask about your results..." : "Please upload a report first..."}
                disabled={!analysis}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 h-9 w-9 hover:bg-blue-700 transition-colors"
                onClick={handleSend}
                disabled={loading || !analysis}
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </footer>
      </main>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] border-l-4 border-l-blue-600">
          <SheetHeader>
            <SheetTitle>Evidence Details</SheetTitle>
            <SheetDescription>Raw data retrieved from the vector database for this response.</SheetDescription>
          </SheetHeader>
          <div className="mt-8 space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 leading-relaxed shadow-sm">
              "{selectedChunk?.content}"
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Source Test</span>
                <p className="font-semibold text-slate-700">{selectedChunk?.test_name || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">RAG Score</span>
                <p className="font-semibold text-blue-600">{(selectedChunk?.score ? selectedChunk.score * 100 : 0).toFixed(1)}% Match</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}