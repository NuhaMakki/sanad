const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-v4-flash:free";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const SYSTEM_PROMPTS = {
  QUEUE: `أنت مساعد جامعي داخل منصة سند لجامعة الإمام محمد بن سعود الإسلامية.
دورك في هذا السياق: جمع معلومات أولية دقيقة عن مشكلة الطالب قبل إحالته للجهة المختصة.
اسأل أسئلة موجزة وواضحة لفهم المشكلة. اطرح سؤالاً واحداً في كل مرة. كن محدداً.
بعد 3-4 أسئلة قدّم ملخصاً مختصراً للمشكلة في 2-3 جمل.
لا تعطِ وعوداً بالحل. لا تصدر قرارات أكاديمية. لا تقل "أنت معذور" أو "لن تُحاسب".
استخدم لغة عربية رسمية واضحة ومختصرة.`,

  GENERAL: `أنت مساعد جامعي عربي داخل منصة سند لجامعة الإمام محمد بن سعود الإسلامية.
دورك: فهم مشكلة الطالب، تهدئته، جمع المعلومات الأولية، وتوجيهه للخطوة أو الجهة المناسبة.
قيود مهمة:
- لا تصدر قرارات أكاديمية
- لا تقدم تشخيصاً نفسياً
- لا تقدم وعوداً رسمية
- لا تجعل الطالب يعتمد على كلامك كمبرر للتقصير
- إذا ظهرت مؤشرات نفسية خطيرة، وجّه الطالب للتواصل مع وحدة الدعم النفسي
- لا تقل "أنت معذور" أو "لن تُحاسب"
استخدم لغة عربية رسمية، واضحة، وداعمة. كن موجزاً ومفيداً.`,

  REPORT: `أنت مساعد تقارير أكاديمية متخصص في جامعة الإمام محمد بن سعود الإسلامية.
مهمتك: كتابة تقارير إرشادية أكاديمية مفصّلة باللغة العربية الرسمية بناءً على بيانات الطالب.
اكتب التقرير بأسلوب أكاديمي رسمي. أدرج الملاحظات والتوصيات والخطوات المقترحة.
لا تختلق بيانات غير موجودة. استند فقط للمعطيات المقدمة.`,
};

export async function chatWithAI(
  messages: ChatMessage[],
  context: "QUEUE" | "GENERAL" | "REPORT" = "GENERAL"
): Promise<string> {
  const systemPrompt = SYSTEM_PROMPTS[context];

  const allMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
          "X-Title": "Sanad - IMAMU Student Platform",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: allMessages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) throw new Error("Empty response from AI");

      return content;
    } catch (error) {
      lastError = error as Error;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  console.error("OpenRouter failed after 3 attempts:", lastError);
  return "عذراً، الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع الجهة المختصة مباشرة.";
}
