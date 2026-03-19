import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Lightbulb, Database, Layout, Code2, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { generateCode } from '../services/ai';

interface Props {
  plan: any;
  history: { role: string; text: string; files?: { mimeType: string; data: string }[] }[];
  onConfirm: () => void;
  onModify: () => void;
  setGeneratedCode: (code: any) => void;
}

export default function AnalysisAndPlan({ plan, history, onConfirm, onModify, setGeneratedCode }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!plan) return null;

  const handleConfirm = async () => {
    setIsGenerating(true);
    try {
      const code = await generateCode(plan, history);
      setGeneratedCode(code);
      onConfirm();
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'حدث خطأ أثناء توليد الكود. يرجى المحاولة مرة أخرى.';
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('429')) {
        errorMsg = 'تم تجاوز حد الاستخدام المسموح به (Quota Exceeded). يرجى الانتظار دقيقة واحدة ثم المحاولة مرة أخرى.';
      }
      alert(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Analysis Section */}
      <section className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.15)]">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">التحليل الاستراتيجي</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">رؤية المعمار الذكي لمشروعك</p>
          </div>
        </div>
        
        <div className="space-y-6 relative z-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 relative overflow-hidden tech-border">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <h3 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_5px_rgba(37,99,235,0.5)]" />
              الملخص التنفيذي
            </h3>
            <p className="text-gray-600 leading-relaxed text-[15px]">{plan.analysis.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 tech-border hover:border-blue-600/30 transition-colors">
              <h3 className="font-bold text-blue-600 mb-4 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>نقاط القوة</span>
              </h3>
              <ul className="space-y-3">
                {(plan.analysis.strengths || []).map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600/50 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 tech-border hover:border-amber-500/30 transition-colors">
              <h3 className="font-bold text-amber-400 mb-4 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>المخاطر المحتملة</span>
              </h3>
              <ul className="space-y-3">
                {(plan.analysis.risks || []).map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 tech-border hover:border-violet-500/30 transition-colors">
              <h3 className="font-bold text-violet-400 mb-4 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4" />
                <span>اقتراحات ابتكارية</span>
              </h3>
              <ul className="space-y-3">
                {(plan.analysis.innovations || []).map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Plan Section */}
      <section className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -ml-32 -mt-32 pointer-events-none" />
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Layout className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">المخطط الهندسي</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">خارطة الطريق التقنية للتنفيذ</p>
          </div>
        </div>

        <div className="space-y-8 relative z-10">
          {/* Architecture */}
          <div className="bg-white text-gray-700 p-6 rounded-2xl border border-gray-200 tech-border">
            <h3 className="text-blue-600 font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-xs font-mono">
              <Code2 className="w-4 h-4" />
              <span>هندسة تدفق البيانات (Architecture)</span>
            </h3>
            <p className="leading-relaxed font-mono text-sm text-gray-600">{plan.plan.architecture}</p>
          </div>

          {/* Tech Stack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 tech-border">
              <h4 className="text-[11px] uppercase tracking-widest text-gray-500 font-mono font-bold mb-4">التقنيات المستخدمة</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-3">
                  <span className="text-gray-600 font-mono">Frontend</span>
                  <span className="font-bold text-blue-600 bg-blue-600/10 px-2 py-1 rounded-md">{plan.plan.techStack.frontend}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-mono">Backend</span>
                  <span className="font-bold text-blue-600 bg-blue-600/10 px-2 py-1 rounded-md">{plan.plan.techStack.backend}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 tech-border">
              <h4 className="text-[11px] uppercase tracking-widest text-gray-500 font-mono font-bold mb-4">الميزات التقنية</h4>
              <div className="flex flex-wrap gap-2">
                {(plan.plan.techStack.features || []).map((f: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pages */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
              <span>هيكلية الصفحات</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plan.plan.pages.map((page: any, idx: number) => (
                <div key={idx} className="group bg-white p-6 rounded-2xl border border-gray-200 tech-border hover:border-blue-600/30 transition-all">
                  <h4 className="font-bold text-blue-600 mb-2 text-[15px]">{page.name}</h4>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{page.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {(page.ui_elements || []).map((el: string, i: number) => (
                      <span key={i} className="text-[10px] bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-md font-mono">
                        {el}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <span>تصميم قاعدة البيانات</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {plan.plan.database.map((table: any, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-200 tech-border overflow-hidden">
                  <div className="bg-gray-100 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-[15px] tracking-wide font-mono">{table.tableName}</span>
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {table.fields.map((field: any, fIdx: number) => (
                        <div key={fIdx} className="flex justify-between items-start border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                          <div>
                            <div className="font-mono text-sm font-bold text-blue-600" dir="ltr">{field.name}</div>
                            <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">{field.description}</div>
                          </div>
                          <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-600 px-2 py-1 rounded-md uppercase font-mono tracking-wider ml-4 shrink-0">
                            {field.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-3xl sticky bottom-6 z-20">
        <div className="text-right">
          <h3 className="font-bold text-gray-900 text-[15px]">هل أنت مستعد لبدء البناء؟</h3>
          <p className="text-xs text-gray-500 font-mono mt-1">المعمار الذكي جاهز لتحويل هذا المخطط إلى كود مصدري.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onModify}
            disabled={isGenerating}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 hover:text-gray-900 transition-all disabled:opacity-50"
          >
            تعديل الرؤية
          </button>
          <button
            onClick={handleConfirm}
            disabled={isGenerating}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] disabled:opacity-50 active:scale-95"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري البناء...</span>
              </>
            ) : (
              <>
                <span>توليد الكود المصدري</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
