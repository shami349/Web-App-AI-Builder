import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Code2, LayoutDashboard, MessageSquare, Settings, Sparkles, CheckCircle2, MessageSquareWarning, Bug, Lightbulb, MessageCircle } from 'lucide-react';
import IdeaInput from './components/IdeaInput';
import ChatInterface from './components/ChatInterface';
import AnalysisAndPlan from './components/AnalysisAndPlan';
import CodeGeneration from './components/CodeGeneration';
import FeedbackModal, { Feedback, FeedbackType } from './components/FeedbackModal';

export type Step = 'idea' | 'chat' | 'plan' | 'code' | 'settings';

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // base64 encoded string
}

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  options?: string[];
  files?: FileData[];
}

export default function App() {
  const [step, setStep] = useState<Step>('idea');
  const [idea, setIdea] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [generatedCode, setGeneratedCode] = useState<any>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleIdeaSubmit = (initialIdea: string, files?: FileData[]) => {
    setIdea(initialIdea);
    setChatHistory([
      { role: 'user', text: initialIdea, files }
    ]);
    setStep('chat');
  };

  const handleFeedbackSubmit = (feedbackData: Omit<Feedback, 'id' | 'date'>) => {
    const newFeedback: Feedback = {
      ...feedbackData,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('ar-SA')
    };
    setFeedbacks(prev => [newFeedback, ...prev]);
    setToastMessage('تم إرسال ملاحظاتك بنجاح، شكراً لك!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900 font-sans selection:bg-blue-600/30" dir="rtl">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-l border-gray-200 flex flex-col z-20 relative">
        <div className="p-8 flex items-center gap-4 border-b border-gray-200">
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-600/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.15)]">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight text-gray-900 tracking-tight">AppGenius</h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-blue-600 mt-1">AI Architect</p>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <NavItem icon={<LayoutDashboard />} label="الفكرة المبتكرة" active={step === 'idea'} />
          <NavItem icon={<MessageSquare />} label="الحوار الذكي" active={step === 'chat'} />
          <NavItem icon={<Bot />} label="الخطة المعمارية" active={step === 'plan'} />
          <NavItem icon={<Code2 />} label="توليد النظام" active={step === 'code'} />
        </nav>

        <div className="p-6 border-t border-gray-200 space-y-2">
          <button 
            onClick={() => setIsFeedbackModalOpen(true)}
            className="flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 group text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent"
          >
            <MessageSquareWarning className="w-5 h-5 transition-transform duration-500 group-hover:scale-110" />
            <span className="font-medium text-sm">إرسال ملاحظات</span>
          </button>
          <button 
            onClick={() => setStep('settings')}
            className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 group ${
              step === 'settings' 
                ? 'bg-gray-100 text-gray-900 border border-gray-300' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
            }`}
          >
            <Settings className={`w-5 h-5 transition-transform duration-500 ${step !== 'settings' && 'group-hover:rotate-90'}`} />
            <span className="font-medium text-sm">الإعدادات المتقدمة</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative bg-gray-50">
        {/* Topbar */}
        <header className="h-24 border-b border-gray-200 flex items-center px-10 justify-between z-10 bg-gray-50/80 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight">
              {step === 'idea' && 'ابدأ رحلة الابتكار'}
              {step === 'chat' && 'هندسة المتطلبات'}
              {step === 'plan' && 'المخطط الهندسي'}
              {step === 'code' && 'المخرجات البرمجية'}
              {step === 'settings' && 'الإعدادات المتقدمة'}
            </h2>
            <p className="font-mono text-xs text-gray-500 mt-2">
              {step === 'idea' && 'حول خيالك إلى واقع ملموس'}
              {step === 'chat' && 'نحن نبني الأساس المتين لتطبيقك'}
              {step === 'plan' && 'تحليل دقيق لكل تفاصيل النظام'}
              {step === 'code' && 'كود نظيف، عصري، وجاهز للنشر'}
              {step === 'settings' && 'تخصيص تجربة الاستخدام'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={`w-10 h-10 rounded-full border border-gray-50 flex items-center justify-center font-mono text-[11px] transition-all duration-500 ${
                    ['idea', 'chat', 'plan', 'code'].indexOf(step) + 1 >= i 
                      ? 'bg-blue-600 text-white font-bold z-10 shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}
                >
                  {0}{i}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === 'idea' && (
              <motion.div
                key="idea"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <IdeaInput onSubmit={handleIdeaSubmit} />
              </motion.div>
            )}
            {step === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <ChatInterface 
                  history={chatHistory} 
                  setHistory={setChatHistory} 
                  onAnalyze={() => setStep('plan')} 
                  setPlan={setPlan}
                />
              </motion.div>
            )}
            {step === 'plan' && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full overflow-y-auto"
              >
                <AnalysisAndPlan 
                  plan={plan} 
                  history={chatHistory}
                  onConfirm={() => setStep('code')} 
                  onModify={() => setStep('chat')}
                  setGeneratedCode={setGeneratedCode}
                />
              </motion.div>
            )}
            {step === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full overflow-y-auto"
              >
                <CodeGeneration generatedCode={generatedCode} />
              </motion.div>
            )}
            {step === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full overflow-y-auto p-8"
              >
                <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 border border-gray-200">
                  <h3 className="font-display text-2xl font-bold text-gray-900 mb-8">إعدادات التطبيق</h3>
                  <div className="space-y-6">
                    <div className="p-6 bg-white rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-2">قاعدة المعرفة والتعلم الذاتي</h4>
                      <p className="text-sm text-gray-500 mb-6">
                        الذكاء الاصطناعي متصل حالياً بقاعدة بيانات افتراضية تعتمد على أفضل ممارسات GitHub وقوالب SaaS العالمية.
                      </p>
                      <div className="flex items-center gap-2 text-blue-600 text-sm font-bold bg-blue-600/10 border border-blue-600/20 w-fit px-4 py-2 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>مفعل تلقائياً</span>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-white rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-2">إدارة البيانات</h4>
                      <p className="text-sm text-gray-500 mb-6">
                        يمكنك مسح المحادثة الحالية والبدء من جديد.
                      </p>
                      <button 
                        onClick={() => {
                          if(confirm('هل أنت متأكد من مسح جميع البيانات والبدء من جديد؟')) {
                            setStep('idea');
                            setIdea('');
                            setChatHistory([]);
                            setPlan(null);
                            setGeneratedCode(null);
                          }
                        }}
                        className="px-6 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-bold transition-all"
                      >
                        مسح البيانات والبدء من جديد
                      </button>
                    </div>

                    <div className="p-6 bg-white rounded-xl border border-gray-200">
                      <h4 className="font-bold text-gray-800 mb-6">الملاحظات المرسلة</h4>
                      {feedbacks.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">لا توجد ملاحظات مرسلة حتى الآن.</p>
                      ) : (
                        <div className="space-y-4">
                          {feedbacks.map(fb => (
                            <div key={fb.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-4">
                              <div className={`p-2 rounded-lg shrink-0 ${
                                fb.type === 'bug' ? 'bg-red-100 text-red-600' :
                                fb.type === 'feature' ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-200 text-gray-700'
                              }`}>
                                {fb.type === 'bug' && <Bug className="w-5 h-5" />}
                                {fb.type === 'feature' && <Lightbulb className="w-5 h-5" />}
                                {fb.type === 'general' && <MessageCircle className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-sm text-gray-900">
                                    {fb.type === 'bug' ? 'مشكلة' : fb.type === 'feature' ? 'اقتراح' : 'عام'}
                                  </span>
                                  <span className="text-xs text-gray-500">{fb.date}</span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{fb.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-800"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group cursor-pointer border ${
      active 
        ? 'bg-gray-100 text-gray-900 font-bold border-gray-300' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-transparent'
    }`}>
      <div className={`${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} transition-colors`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      <span className="text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="w-1 h-6 bg-blue-600 rounded-full mr-auto shadow-[0_0_10px_rgba(37,99,235,0.5)]"
        />
      )}
    </div>
  );
}
