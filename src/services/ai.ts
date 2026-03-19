import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PRIMARY_MODEL = "gemini-3.1-pro-preview";
const FALLBACK_MODEL = "gemini-3-flash-preview";

async function withRetry<T>(fn: (model: string) => Promise<T>, maxRetries = 5, delay = 3000): Promise<T> {
  let lastError: any;
  let currentModel = PRIMARY_MODEL;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn(currentModel);
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toLowerCase();
      const errorMsg = (error.message || "").toLowerCase();
      
      const isQuotaError = errorMsg.includes('429') || 
                          errorMsg.includes('quota') ||
                          errorMsg.includes('resource_exhausted') ||
                          errorStr.includes('429') ||
                          errorStr.includes('quota') ||
                          errorStr.includes('resource_exhausted') ||
                          errorStr.includes('limit');

      if (isQuotaError) {
        console.warn(`Quota exceeded for ${currentModel}, attempt ${i + 1}/${maxRetries}`);
        
        // Switch to fallback model on first quota error if we are on primary
        if (currentModel === PRIMARY_MODEL) {
          console.info(`Switching to fallback model: ${FALLBACK_MODEL}`);
          currentModel = FALLBACK_MODEL;
          // Small delay before switching
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // If already on fallback or after first switch, wait and retry with backoff
        console.warn(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error; // Rethrow other errors
    }
  }
  
  // If we reach here, all retries failed
  const finalErrorStr = JSON.stringify(lastError).toLowerCase();
  if (finalErrorStr.includes('429') || finalErrorStr.includes('quota') || finalErrorStr.includes('resource_exhausted')) {
    throw new Error('QUOTA_EXCEEDED: تم تجاوز حد الاستخدام المسموح به للذكاء الاصطناعي حالياً. يرجى الانتظار دقيقة واحدة ثم المحاولة مرة أخرى.');
  }
  throw lastError;
}

export async function generateChatResponse(history: { role: string; text: string; files?: { mimeType: string; data: string }[] }[]) {
  const contents = history.map(msg => {
    const parts: any[] = [{ text: msg.text }];
    if (msg.files && msg.files.length > 0) {
      msg.files.forEach(file => {
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        });
      });
    }
    return {
      role: msg.role === 'user' ? 'user' : 'model',
      parts: parts
    };
  });

  return withRetry(async (model) => {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "السؤال أو الرد القصير جداً" },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "خيارات للإجابة السريعة (مثل: نعم، لا، أو خيارات محددة). اتركها فارغة إذا كان السؤال يتطلب إجابة مفتوحة."
            }
          },
          required: ["text"]
        },
        systemInstruction: `أنت مهندس برمجيات خبير ومصمم واجهات (UX/UI) ذكي. مهمتك هي مساعدة المستخدم في بلورة فكرة تطبيقه (PWA) بأفضل جودة ممكنة وبأسرع وقت.
استخدم أسلوب "الاستبيان السريع والذكي" (Fast Smart Survey).

قواعد هامة جداً:
1. الإيجاز الشديد: استخدم الأسئلة المباشرة فقط. تجنب الردود الطويلة أو الشروحات التي تشتت الانتباه.
2. خيارات متعددة (Radio Buttons/Yes-No): بعد السؤال الأول (الذي قد يكون مفتوحاً)، يجب أن تكون أسئلتك مصحوبة بـ 2 إلى 4 خيارات قصيرة ومحددة لتسهيل الإجابة على المستخدم.
3. التركيز: اسأل عن (القيمة الجوهرية، تجربة المستخدم، الميزات المتقدمة، الهوية البصرية) خطوة بخطوة.
4. للتطبيقات المحاسبية والإدارية (هام جداً): يجب عليك طرح هذا السؤال الجوهري في مرحلة مبكرة: "ما هي الحقول التي يجب عليك تسجيلها لكل معاملة؟ وما هي المخرجات أو التقارير التي تريدها من هذه البيانات؟" لضمان بناء هيكلة بيانات دقيقة.
5. التعلم الذاتي والخبرة: اعتمد في اقتراحاتك على قاعدة بياناتك الضخمة من أفضل قوالب GitHub، وتطبيقات SaaS الحديثة، ومنصات تقييم التطبيقات. قدم خيارات تعكس أحدث وأرقى التصاميم.
6. بمجرد أن تفهم الفكرة الأساسية والميزات المطلوبة وهيكلة البيانات، توقف عن الأسئلة وقل نصاً: "لقد اكتملت الصورة. أنا جاهز الآن لإعداد المخطط الهندسي."
7. اللغة: العربية الفصحى الحديثة والمهنية.`,
      },
    });
    return JSON.parse(response.text || "{}");
  });
}

export async function analyzeAndGeneratePlan(history: { role: string; text: string; files?: { mimeType: string; data: string }[] }[]) {
  const contents = history.map(msg => {
    const parts: any[] = [{ text: msg.text }];
    if (msg.files && msg.files.length > 0) {
      msg.files.forEach(file => {
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        });
      });
    }
    return {
      role: msg.role === 'user' ? 'user' : 'model',
      parts: parts
    };
  });

  // Add the instruction as the last user message
  contents.push({
    role: 'user',
    parts: [{
      text: `بناءً على المحادثة السابقة والملفات المرفقة (إن وجدت)، قم بإجراء تحليل تقني وتصميمي شامل.
استخدم قاعدة بياناتك المعرفية الضخمة (التي تضم أفضل قوالب GitHub، وتطبيقات SaaS العالمية، وأحدث أدوات التطوير) لإنشاء نموذج جاهز ومثالي لهذا المشروع.
تأكد من معالجة هيكلة البيانات بدقة بناءً على الحقول والمخرجات التي حددها المستخدم في المحادثة (خاصة للأنظمة المحاسبية والإدارية).

يجب أن يكون الرد بصيغة JSON دقيقة تحتوي على:
1. تحليل ذكي (Analysis): ملخص، نقاط القوة، المخاطر المحتملة، واقتراحات ابتكارية (مستوحاة من أفضل التطبيقات العالمية).
2. خطة تقنية (Plan):
   - البنية التحتية (Infrastructure): Supabase (Auth, DB, Storage).
   - الصفحات (Pages): قائمة الصفحات مع تفاصيل الـ UI لكل صفحة (بتصميم عصري وأنيق، متضمنة التقارير والمخرجات المطلوبة).
   - قاعدة البيانات (Database): جداول مفصلة مع العلاقات (Foreign Keys) تعكس بدقة الحقول التي طلبها المستخدم للمعاملات.
   - الهندسة التقنية (Architecture): شرح لكيفية تدفق البيانات (Data Flow).
   - تجربة المستخدم (UX Strategy): الخطوط، الألوان (بصيغة Hex)، وتوجهات التصميم (يجب أن تكون الألوان راقية، هادئة، وحديثة).`
    }]
  });

  return withRetry(async (model) => {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                innovations: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["summary", "strengths", "risks", "innovations"]
            },
            plan: {
              type: Type.OBJECT,
              properties: {
                techStack: {
                  type: Type.OBJECT,
                  properties: {
                    frontend: { type: Type.STRING },
                    backend: { type: Type.STRING },
                    features: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["frontend", "backend", "features"]
                },
                architecture: { type: Type.STRING },
                pages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      ui_elements: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["name", "description"]
                  }
                },
                database: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      tableName: { type: Type.STRING },
                      fields: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            type: { type: Type.STRING },
                            description: { type: Type.STRING }
                          },
                          required: ["name", "type", "description"]
                        }
                      }
                    },
                    required: ["tableName", "fields"]
                  }
                },
                ux: {
                  type: Type.OBJECT,
                  properties: {
                    direction: { type: Type.STRING },
                    primaryColor: { type: Type.STRING },
                    font: { type: Type.STRING },
                    theme: { type: Type.STRING }
                  },
                  required: ["direction", "primaryColor", "font", "theme"]
                }
              },
              required: ["techStack", "architecture", "pages", "database", "ux"]
            }
          },
          required: ["analysis", "plan"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
}

export async function generateCode(plan: any, history?: { role: string; text: string; files?: { mimeType: string; data: string }[] }[]) {
  const contents: any[] = [];
  
  if (history) {
    history.forEach(msg => {
      const parts: any[] = [{ text: msg.text }];
      if (msg.files && msg.files.length > 0) {
        msg.files.forEach(file => {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.data
            }
          });
        });
      }
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts
      });
    });
  }

  contents.push({
    role: 'user',
    parts: [{
      text: `أنت الآن المبرمج المنفذ الخبير. قم بتحويل الخطة التالية إلى كود مصدري كامل وجاهز للعمل.
استعن بخبرتك الواسعة من مستودعات GitHub العالمية لبناء كود نظيف، قابل للتوسع، وذو أداء عالي.
استخدم HTML5, Tailwind CSS (CDN), و Vanilla JavaScript لضمان سهولة العمل كـ PWA.
اجعل التصميم عصرياً جداً، أنيقاً، وبسيطاً (Minimalist, Elegant, Responsive) مع استخدام أيقونات Lucide (عبر CDN).
استخدم صناديق (Boxes) أصغر وأكثر أناقة، وخطوط بحجم مناسب غير مبالغ فيه.
إذا كان هناك صور مرفقة في المحادثة، حاول محاكاة التصميم الموجود فيها بأكبر قدر ممكن من الدقة.

الخطة:
${JSON.stringify(plan, null, 2)}

يجب أن يتضمن الكود:
1. نظام المصادقة (Auth) مع Supabase.
2. عمليات CRUD كاملة للجداول المقترحة.
3. التعامل مع حالة عدم وجود إنترنت (Offline handling).
4. تصميم متجاوب بالكامل (Mobile-first).

الرد بصيغة JSON:
{
  "files": [
    { "filename": "index.html", "content": "..." },
    { "filename": "app.js", "content": "..." },
    { "filename": "style.css", "content": "..." },
    { "filename": "manifest.json", "content": "..." },
    { "filename": "sw.js", "content": "..." }
  ],
  "supabase_setup": "SQL code...",
  "supabase_client": "JavaScript code to initialize Supabase client...",
  "supabase_guide": "شرح مفصل لخطوات إعداد Supabase...",
  "guide": "شرح مفصل لخطوات التشغيل والنشر"
}`
    }]
  });

  return withRetry(async (model) => {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  filename: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["filename", "content"]
              }
            },
            supabase_setup: { type: Type.STRING },
            supabase_client: { type: Type.STRING },
            supabase_guide: { type: Type.STRING },
            guide: { type: Type.STRING }
          },
          required: ["files", "supabase_setup", "supabase_client", "supabase_guide", "guide"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  });
}
