import React, { useState, useMemo } from 'react';
import { FileCode2, Database, Rocket, Copy, CheckCircle2, ChevronDown, ChevronUp, Eye, Download, Loader2, BrainCircuit, Settings, Code2, Github, X } from 'lucide-react';
import JSZip from 'jszip';

interface Props {
  generatedCode: any;
}

export default function CodeGeneration({ generatedCode }: Props) {
  const [activeTab, setActiveTab] = useState<'files' | 'supabase' | 'deploy' | 'preview'>('preview');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedFile, setExpandedFile] = useState<number | null>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavedToDB, setIsSavedToDB] = useState(false);
  
  const [isDeployingToGithub, setIsDeployingToGithub] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [showGithubModal, setShowGithubModal] = useState(false);

  if (!generatedCode) return null;

  const handleSaveToDB = () => {
    // Simulate saving to AI knowledge base
    setTimeout(() => {
      setIsSavedToDB(true);
    }, 1000);
  };

  const handleGithubDeploy = async () => {
    if (!githubToken || !githubRepo) {
      alert('يرجى إدخال رمز الوصول (Token) واسم المستودع.');
      return;
    }
    
    setIsDeployingToGithub(true);
    try {
      // 1. Create Repo
      const createRepoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: githubRepo,
          private: false,
          auto_init: true
        })
      });

      let fullName = '';
      if (!createRepoRes.ok) {
        const err = await createRepoRes.json();
        if (err.message !== 'name already exists on this account' && !err.errors?.some((e: any) => e.message === 'name already exists on this account')) {
          throw new Error('فشل في إنشاء المستودع: ' + err.message);
        }
        const userRes = await fetch('https://api.github.com/user', {headers: {'Authorization': `token ${githubToken}`}});
        const userData = await userRes.json();
        fullName = `${userData.login}/${githubRepo}`;
      } else {
        const repoData = await createRepoRes.json();
        fullName = repoData.full_name;
      }

      // 2. Upload files
      for (const file of generatedCode.files) {
        let sha;
        try {
          const getFileRes = await fetch(`https://api.github.com/repos/${fullName}/contents/${file.filename}`, {
            headers: { 'Authorization': `token ${githubToken}` }
          });
          if (getFileRes.ok) {
            const fileData = await getFileRes.json();
            sha = fileData.sha;
          }
        } catch (e) {}

        const contentBase64 = btoa(unescape(encodeURIComponent(file.content)));
        
        await fetch(`https://api.github.com/repos/${fullName}/contents/${file.filename}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Add ${file.filename}`,
            content: contentBase64,
            sha: sha
          })
        });
      }

      alert('تم رفع المشروع بنجاح إلى GitHub!');
      setShowGithubModal(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'حدث خطأ أثناء الرفع إلى GitHub.');
    } finally {
      setIsDeployingToGithub(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      
      // Add all generated files to the zip
      generatedCode.files.forEach((file: any) => {
        zip.file(file.filename, file.content);
      });

      // Add SQL instructions as a separate file
      zip.file('supabase_setup.sql', generatedCode.supabase_sql || generatedCode.supabase_setup || generatedCode.supabase?.sql || '');
      zip.file('supabase_client.js', generatedCode.supabase_client || '');
      zip.file('README_INSTRUCTIONS.txt', `
SUPABASE SETUP GUIDE:
${generatedCode.supabase_guide || generatedCode.guide || generatedCode.supabase?.instructions || ''}

DEPLOYMENT INSTRUCTIONS:
GITHUB: ${generatedCode.deployment?.github || 'قم برفع الملفات إلى مستودع جديد على GitHub'}
GITHUB PAGES: ${generatedCode.deployment?.githubPages || 'قم بتفعيل GitHub Pages من إعدادات المستودع'}
PWA BUILDER: ${generatedCode.deployment?.pwaBuilder || 'استخدم PWABuilder.com لتحويل التطبيق إلى تطبيق أصلي'}
      `);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'web-app-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('حدث خطأ أثناء تحميل المشروع.');
    } finally {
      setIsDownloading(false);
    }
  };

  const previewContent = useMemo(() => {
    const indexFile = generatedCode.files.find((f: any) => f.filename === 'index.html');
    if (!indexFile) return null;

    // We need to inject the CSS and JS into the HTML for the preview
    // This is a simple implementation, it might not work perfectly for all cases
    let content = indexFile.content;
    
    const styleFile = generatedCode.files.find((f: any) => f.filename === 'style.css');
    if (styleFile) {
      content = content.replace('</head>', `<style>${styleFile.content}</style></head>`);
    }

    const jsFile = generatedCode.files.find((f: any) => f.filename === 'app.js');
    if (jsFile) {
      // Mock Supabase if it's used, or just inject the JS
      content = content.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }

    return content;
  }, [generatedCode]);

  return (
    <div className="max-w-6xl mx-auto p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.15)] rotate-3">
            <Rocket className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">اكتمل البناء بنجاح! 🚀</h1>
            <p className="text-gray-600 mt-2 font-mono text-sm">تطبيقك جاهز الآن للانطلاق إلى العالم الرقمي.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSaveToDB}
            disabled={isSavedToDB}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg text-sm ${
              isSavedToDB 
                ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-blue-600/30 active:scale-95'
            }`}
          >
            {isSavedToDB ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>تم الحفظ في قاعدة المعرفة</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-5 h-5 text-blue-600" />
                <span>حفظ كنموذج للتعلم الذاتي</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowGithubModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-lg active:scale-95"
          >
            <Github className="w-6 h-6" />
            <span>نشر على GitHub</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] disabled:opacity-50 active:scale-95"
          >
            {isDownloading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Download className="w-6 h-6" />
            )}
            <span>تحميل الحزمة (ZIP)</span>
          </button>
        </div>
      </div>

      {/* GitHub Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
            <button 
              onClick={() => setShowGithubModal(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                <Github className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-gray-900">النشر على GitHub</h3>
                <p className="text-sm text-gray-600">سيتم إنشاء مستودع جديد ورفع الملفات إليه.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستودع (Repository Name)</label>
                <input 
                  type="text" 
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="my-awesome-project"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600/50 transition-colors"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رمز الوصول (Personal Access Token)</label>
                <input 
                  type="password" 
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-600/50 transition-colors"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-2">
                  تأكد من إعطاء صلاحية "repo" للرمز. <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">إنشاء رمز جديد</a>
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setShowGithubModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleGithubDeploy}
                disabled={isDeployingToGithub || !githubRepo || !githubToken}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-all"
              >
                {isDeployingToGithub ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                <span>نشر الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-white p-2 rounded-2xl w-fit border border-gray-200">
        <TabButton 
          active={activeTab === 'preview'} 
          onClick={() => setActiveTab('preview')} 
          icon={<Eye className="w-5 h-5" />} 
          label="المعاينة الحية" 
        />
        <TabButton 
          active={activeTab === 'files'} 
          onClick={() => setActiveTab('files')} 
          icon={<FileCode2 className="w-5 h-5" />} 
          label="الملفات المصدرية" 
        />
        <TabButton 
          active={activeTab === 'supabase'} 
          onClick={() => setActiveTab('supabase')} 
          icon={<Database className="w-5 h-5" />} 
          label="قاعدة البيانات" 
        />
        <TabButton 
          active={activeTab === 'deploy'} 
          onClick={() => setActiveTab('deploy')} 
          icon={<Rocket className="w-5 h-5" />} 
          label="دليل النشر" 
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 glass-panel rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-[600px] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />
        
        {activeTab === 'preview' && (
          <div className="flex-1 flex flex-col z-10">
            <div className="p-5 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-blue-600/80" />
                </div>
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest mr-4">Live Environment Simulation</span>
              </div>
            </div>
            <div className="flex-1 bg-white relative">
              {previewContent ? (
                <iframe 
                  srcDoc={previewContent}
                  title="Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-forms allow-modals"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  لا يمكن عرض المعاينة لعدم وجود ملف index.html
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex-1 overflow-y-auto p-8 space-y-6 z-10">
            {generatedCode.files.map((file: any, idx: number) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden tech-border">
                <button 
                  onClick={() => setExpandedFile(expandedFile === idx ? null : idx)}
                  className={`w-full flex items-center justify-between p-5 transition-colors ${
                    expandedFile === idx ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <FileCode2 className={`w-6 h-6 ${expandedFile === idx ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-mono font-bold text-sm tracking-tight" dir="ltr">{file.filename}</span>
                  </div>
                  {expandedFile === idx ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>
                
                {expandedFile === idx && (
                  <div className="relative border-t border-gray-200">
                    <button 
                      onClick={() => handleCopy(file.content, idx)}
                      className="absolute top-6 right-6 p-3 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-xl backdrop-blur-md transition-all active:scale-90 border border-gray-200"
                      title="نسخ الكود"
                    >
                      {copiedIndex === idx ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <pre className="p-8 bg-gray-50 text-gray-700 overflow-x-auto text-sm font-mono leading-relaxed" dir="ltr">
                      <code>{file.content}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'supabase' && (
          <div className="flex-1 overflow-y-auto p-10 space-y-10 z-10">
            {/* 1. Project Setup Guide */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-200 relative overflow-hidden tech-border">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <h3 className="font-display font-bold text-gray-900 text-xl mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <span>1. إعداد مشروع Supabase</span>
              </h3>
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-gray-600 leading-relaxed font-mono text-sm relative z-10">
                {generatedCode.supabase_guide || generatedCode.guide || generatedCode.supabase?.instructions || "قم بإنشاء مشروع جديد في Supabase واحصل على Project URL و anon key."}
              </div>
            </div>

            {/* 2. Client Initialization Code */}
            <div>
              <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                  <Code2 className="w-5 h-5 text-blue-600" />
                </div>
                <span>2. تهيئة العميل (Client Setup)</span>
              </h3>
              <div className="relative rounded-[2rem] overflow-hidden border border-gray-200 shadow-2xl bg-white">
                <button 
                  onClick={() => handleCopy(generatedCode.supabase_client || "// Initialize Supabase client here", 998)}
                  className="absolute top-6 right-6 p-3 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-xl backdrop-blur-md transition-all active:scale-90 border border-gray-200"
                >
                  {copiedIndex === 998 ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> : <Copy className="w-5 h-5" />}
                </button>
                <pre className="p-8 bg-gray-50 text-gray-700 overflow-x-auto text-sm font-mono leading-relaxed" dir="ltr">
                  <code>{generatedCode.supabase_client || `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)`}</code>
                </pre>
              </div>
            </div>

            {/* 3. Database Schema */}
            <div>
              <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                  <Database className="w-5 h-5 text-violet-400" />
                </div>
                <span>3. هيكلية قاعدة البيانات (SQL)</span>
              </h3>
              <div className="relative rounded-[2rem] overflow-hidden border border-gray-200 shadow-2xl bg-white">
                <button 
                  onClick={() => handleCopy(generatedCode.supabase_sql || generatedCode.supabase_setup || generatedCode.supabase?.sql, 999)}
                  className="absolute top-6 right-6 p-3 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-xl backdrop-blur-md transition-all active:scale-90 border border-gray-200"
                >
                  {copiedIndex === 999 ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> : <Copy className="w-5 h-5" />}
                </button>
                <pre className="p-8 bg-gray-50 text-gray-700 overflow-x-auto text-sm font-mono leading-relaxed" dir="ltr">
                  <code>{generatedCode.supabase_sql || generatedCode.supabase_setup || generatedCode.supabase?.sql}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="flex-1 overflow-y-auto p-10 space-y-8 z-10">
            <DeployStep 
              number={1} 
              title="تجهيز المستودع (GitHub)" 
              content={generatedCode.deployment?.github || "قم بإنشاء مستودع جديد على GitHub وارفع الملفات المحملة إليه."} 
            />
            <DeployStep 
              number={2} 
              title="إطلاق الواجهة (GitHub Pages)" 
              content={generatedCode.deployment?.githubPages || "من إعدادات المستودع، فعل GitHub Pages واختر فرع main."} 
            />
            <DeployStep 
              number={3} 
              title="تحويل التطبيق إلى PWA" 
              content={generatedCode.deployment?.pwaBuilder || "استخدم PWABuilder لتحويل رابط موقعك إلى تطبيق جاهز للمتاجر."} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
        active 
          ? 'bg-gray-100 text-gray-900 shadow-lg border border-gray-200' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DeployStep({ number, title, content }: { number: number, title: string, content: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 text-blue-600 flex items-center justify-center font-display font-bold text-xl shrink-0 shadow-inner group-hover:border-blue-600/30 transition-colors">
        {number}
      </div>
      <div className="flex-1 pt-1">
        <h3 className="text-lg font-display font-bold text-gray-900 mb-3 tracking-tight">{title}</h3>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 whitespace-pre-wrap text-gray-600 leading-relaxed font-mono text-sm tech-border">
          {content}
        </div>
      </div>
    </div>
  );
}
