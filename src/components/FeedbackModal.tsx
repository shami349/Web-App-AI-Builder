import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bug, Lightbulb, MessageCircle } from 'lucide-react';

export type FeedbackType = 'bug' | 'feature' | 'general';

export interface Feedback {
  id: string;
  type: FeedbackType;
  text: string;
  date: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Omit<Feedback, 'id' | 'date'>) => void;
}

export default function FeedbackModal({ isOpen, onClose, onSubmit }: Props) {
  const [type, setType] = useState<FeedbackType>('general');
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    onSubmit({ type, text });
    setText('');
    setType('general');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
            dir="rtl"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">إرسال ملاحظات</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">نوع الملاحظة</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('bug')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      type === 'bug'
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Bug className="w-5 h-5" />
                    <span className="text-sm font-medium">مشكلة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('feature')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      type === 'feature'
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span className="text-sm font-medium">اقتراح</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('general')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      type === 'general'
                        ? 'bg-gray-100 border-gray-300 text-gray-900'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">عام</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">التفاصيل</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="صف ملاحظتك هنا..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
                >
                  إرسال
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
