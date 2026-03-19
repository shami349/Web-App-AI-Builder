import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { generateChatResponse, analyzeAndGeneratePlan } from '../services/ai';
import { Message, FileData } from '../App';
import JSZip from 'jszip';

interface Props {
  history: Message[];
  setHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  onAnalyze: () => void;
  setPlan: (plan: any) => void;
}

export default function ChatInterface({ history, setHistory, onAnalyze, setPlan }: Props) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    if (history.length === 1 && history[0].role === 'user') {
      handleInitialResponse();
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      const processedFiles: FileData[] = [];

      for (const file of newFiles) {
        if (file.name.endsWith('.zip') || file.type === 'application/zip') {
          try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            for (const [filename, zipEntry] of Object.entries(contents.files)) {
              if (!zipEntry.dir) {
                if (filename.match(/\.(html|js|txt|md|css|json|ts|jsx|tsx)$/i)) {
                  const textContent = await zipEntry.async('string');
                  processedFiles.push({
                    name: filename,
                    mimeType: 'text/plain',
                    data: btoa(unescape(encodeURIComponent(textContent)))
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error reading zip file:', error);
            alert('حدث خطأ أثناء قراءة ملف ZIP.');
          }
        } else {
          const reader = new FileReader();
          const data = await new Promise<string>((resolve) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(file);
          });
          
          let mimeType = file.type || 'application/octet-stream';
          if (file.name.match(/\.(js|ts|jsx|tsx|md|css|json|html)$/i) && !mimeType.startsWith('image/')) {
            mimeType = 'text/plain';
          }

          processedFiles.push({
            name: file.name,
            mimeType,
            data
          });
        }
      }

      setFiles(prev => [...prev, ...processedFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInitialResponse = async () => {
    setIsLoading(true);
    try {
      const response = await generateChatResponse(history);
      setHistory(prev => [...prev, { role: 'assistant', text: response.text, options: response.options }]);
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('429')) {
        errorMsg = 'تم تجاوز حد الاستخدام المسموح به (Quota Exceeded). يرجى الانتظار دقيقة واحدة ثم المحاولة مرة أخرى.';
      }
      setHistory(prev => [...prev, { role: 'assistant', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent, optionText?: string) => {
    if (e) e.preventDefault();
    const userMsg = optionText || input.trim();
    if ((!userMsg && files.length === 0) || isLoading) return;

    setInput('');
    const currentFiles = [...files];
    setFiles([]);
    
    const newHistory: Message[] = [...history, { role: 'user', text: userMsg, files: currentFiles.length > 0 ? currentFiles : undefined }];
    setHistory(newHistory);

    setIsLoading(true);
    try {
      const response = await generateChatResponse(newHistory);
      setHistory(prev => [...prev, { role: 'assistant', text: response.text, options: response.options }]);
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'عذراً، حدث خطأ في الاتصال.';
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('429')) {
        errorMsg = 'تم تجاوز حد الاستخدام المسموح به (Quota Exceeded). يرجى الانتظار دقيقة واحدة ثم المحاولة مرة أخرى.';
      }
      setHistory(prev => [...prev, { role: 'assistant', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (currentHistory: Message[]) => {
    setIsAnalyzing(true);
    try {
      const plan = await analyzeAndGeneratePlan(currentHistory);
      setPlan(plan);
      onAnalyze();
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'عذراً، حدث خطأ أثناء تحليل الفكرة. يرجى المحاولة مرة أخرى.';
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('429')) {
        errorMsg = 'تم تجاوز حد الاستخدام المسموح به (Quota Exceeded). يرجى الانتظار دقيقة واحدة ثم المحاولة مرة أخرى.';
      }
      setHistory(prev => [...prev, { role: 'assistant', text: errorMsg }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
              msg.role === 'user' 
                ? 'bg-blue-600/10 text-blue-600 border-blue-600/20' 
                : 'bg-white text-gray-600 border-gray-200'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`max-w-[75%] p-5 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-[0_0_15px_rgba(37,99,235,0.15)]' 
                : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</p>
              
              {msg.files && msg.files.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {msg.files.map((file, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      {file.mimeType.startsWith('image/') ? (
                        <div className="relative group rounded-lg overflow-hidden border border-black/10 max-w-[200px]">
                          <img src={`data:${file.mimeType};base64,${file.data}`} alt={file.name} className="w-full h-auto object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <span className="text-xs text-gray-900 truncate w-full text-center" dir="ltr">{file.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-black/10 border border-black/10 rounded-lg px-3 py-1.5 text-sm">
                          <FileText className="w-4 h-4 opacity-70" />
                          <span className="max-w-[150px] truncate" dir="ltr">{file.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {msg.options && msg.options.length > 0 && idx === history.length - 1 && !isLoading && !isAnalyzing && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {msg.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(undefined, opt)}
                      className="px-4 py-2 bg-white hover:bg-gray-100 text-blue-600 border border-gray-200 hover:border-blue-600/30 rounded-xl text-sm font-medium transition-all text-right"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-gray-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl rounded-tl-none flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-gray-500 font-mono text-sm">المعمار الذكي يفكر...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-4">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-white border border-gray-200 rounded-xl">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                  {file.mimeType.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-600" /> : <FileText className="w-4 h-4 text-blue-600" />}
                  <span className="max-w-[150px] truncate" dir="ltr">{file.name}</span>
                  <button type="button" onClick={() => removeFile(idx)} className="hover:text-red-400 transition-colors ml-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative flex gap-4 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="اكتب ردك هنا... (Shift+Enter للإرسال)"
                className="w-full min-h-[56px] max-h-32 p-4 pb-12 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-gray-900 placeholder-gray-400 resize-none text-[15px]"
                disabled={isLoading || isAnalyzing}
              />
              <div className="absolute bottom-3 right-3">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  accept=".html,.js,.txt,.md,.zip,image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="إرفاق ملفات أو صور"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && files.length === 0) || isLoading || isAnalyzing}
              className="h-14 px-8 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-3 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] active:scale-95 shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري التحليل...</span>
                </>
              ) : (
                <>
                  <span>إرسال</span>
                  <Send className="w-5 h-5 rtl:-scale-x-100" />
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <div className="text-xs text-gray-400 font-mono">
              Enter للسطر الجديد | Shift+Enter للإرسال
            </div>
            <button 
              onClick={() => handleAnalyze(history)}
              disabled={isLoading || isAnalyzing}
              className="text-xs text-blue-600 hover:text-blue-300 font-bold flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 hover:bg-blue-600/20 px-4 py-2 rounded-lg transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>اكتفيت، ابدأ التحليل الهندسي الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
