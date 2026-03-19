import React, { useState, useRef } from 'react';
import { Sparkles, ArrowLeft, Lightbulb, Zap, Rocket, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { FileData } from '../App';
import JSZip from 'jszip';

interface Props {
  onSubmit: (idea: string, files?: FileData[]) => void;
}

export default function IdeaInput({ onSubmit }: Props) {
  const [idea, setIdea] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                // Only process text-based files from the zip
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
          // Map common text extensions to text/plain if mimeType is missing or generic
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
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim() || files.length > 0) {
      onSubmit(idea, files.length > 0 ? files : undefined);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-4xl text-center space-y-8 relative z-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-blue-600 text-sm font-mono mb-4">
            <Sparkles className="w-4 h-4" />
            <span>نظام الذكاء الاصطناعي المعماري</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1]">
            ماذا تريد أن <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">تبني</span> اليوم؟
          </h1>
          <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
            صف فكرتك أو ارفع ملفات (HTML, JS, TXT, MD, ZIP) أو صوراً لتحليلها وبناء نظام برمجي متكامل.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative group mt-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-white border border-gray-200 rounded-3xl p-3 flex flex-col shadow-2xl">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="مثال: أريد بناء نظام محاسبي لشركة صرافة وحوالات مالية..."
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 p-4 outline-none resize-none min-h-[120px] text-lg"
              dir="rtl"
            />
            
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 border-t border-gray-200">
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

            <div className="flex items-center justify-between p-2 border-t border-gray-200 mt-2">
              <div className="flex items-center gap-2">
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-200 text-sm"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>إرفاق ملفات أو صور</span>
                </button>
              </div>
              <button
                type="submit"
                disabled={!idea.trim() && files.length === 0}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <span>ابدأ البناء</span>
                <ArrowLeft className="w-5 h-5 rtl:-scale-x-100" />
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap justify-center gap-3 mt-12">
          <span className="text-sm text-gray-500 font-mono ml-4 flex items-center">أفكار مقترحة:</span>
          <SuggestionBadge icon={<Lightbulb className="w-4 h-4" />} text="نظام محاسبي لشركة صرافة" onClick={() => setIdea("نظام محاسبي متكامل لشركة صرافة وحوالات مالية مع إدارة العملات والعملاء")} />
          <SuggestionBadge icon={<Zap className="w-4 h-4" />} text="إدارة بيانات محطة وقود" onClick={() => setIdea("نظام إدارة بيانات ومبيعات لمحطة وقود مع تتبع المخزون والورديات")} />
          <SuggestionBadge icon={<Rocket className="w-4 h-4" />} text="منصة تداول مالي مبسطة" onClick={() => setIdea("منصة تداول مالي مبسطة للمبتدئين مع تحليلات ورسوم بيانية")} />
        </div>
      </div>
    </div>
  );
}

function SuggestionBadge({ text, icon, onClick }: { text: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-gray-300 hover:bg-gray-100 transition-all shadow-sm"
    >
      <span className="text-blue-600">{icon}</span>
      {text}
    </button>
  );
}
