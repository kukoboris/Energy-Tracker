import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const metaEnv = (import.meta as any).env;
    const apiKey = metaEnv?.VITE_GEMINI_API_KEY || (window as unknown as { GEMINI_API_KEY?: string }).GEMINI_API_KEY;
    if (apiKey) {
      aiInstance = new GoogleGenAI({ apiKey });
    }
  }
  return aiInstance;
}

export async function generateEnergyTips(kwh: number, billTl: number, month: string): Promise<string[]> {
  try {
    const ai = getAIClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Provide 3 actionable, specific energy-saving recommendations for an apartment in Kemer, Antalya consuming ${kwh} kWh (${billTl} TL) in ${month}. Keep each bullet point under 25 words in Russian.`,
      });
      if (response.text) {
        return response.text
          .split('\n')
          .map((line) => line.replace(/^[\s•*-]+/, '').trim())
          .filter((line) => line.length > 5);
      }
    }
  } catch (e) {
    console.warn('Gemini AI fallback active:', e);
  }

  // Fallback high-quality expert recommendations
  return [
    'Оптимизируйте работу кондиционеров: установка температуры на 24°C сэкономит до 18% энергии.',
    'Используйте ночной тариф для стиральных и посудомоечных машин с 22:00 до 06:00.',
    'Проверьте уплотнители окон и балкона для снижения потерь охлажденного воздуха в жару.'
  ];
}

export async function extractInvoiceFromContent(
  textOrBase64: string,
  mimeType?: string
): Promise<{
  period: string;
  bill_date: string;
  due_date: string;
  kwh: number;
  unit_rate_tl: number;
  total_amount_tl: number;
} | null> {
  try {
    const ai = getAIClient();
    if (ai) {
      let contentsParam: any;
      if (mimeType && mimeType.startsWith('image/')) {
        contentsParam = {
          parts: [
            {
              inlineData: {
                data: textOrBase64.replace(/^data:image\/\w+;base64,/, ''),
                mimeType: mimeType
              }
            },
            {
              text: `Extract electricity bill statement information. Return a JSON object with strictly these keys:
              "period" (YYYY-MM format, e.g. 2026-08),
              "bill_date" (DD.MM.YYYY format),
              "due_date" (DD.MM.YYYY format),
              "kwh" (number, total active kWh energy),
              "unit_rate_tl" (number, TL per kWh),
              "total_amount_tl" (number, total payable bill in TL).`
            }
          ]
        };
      } else {
        contentsParam = `Extract electricity invoice data from the following text/document. Return ONLY JSON with keys: period (YYYY-MM), bill_date (DD.MM.YYYY), due_date (DD.MM.YYYY), kwh (number), unit_rate_tl (number), total_amount_tl (number).
        Document text:
        ${textOrBase64.slice(0, 3000)}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contentsParam,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed && typeof parsed.kwh === 'number') {
          return {
            period: parsed.period || '2026-08',
            bill_date: parsed.bill_date || '26.08.2026',
            due_date: parsed.due_date || '05.09.2026',
            kwh: Number(parsed.kwh),
            unit_rate_tl: Number(parsed.unit_rate_tl || 5.69),
            total_amount_tl: Number(parsed.total_amount_tl || Math.round(parsed.kwh * 5.69 * 1.12))
          };
        }
      }
    }
  } catch (err) {
    console.warn('AI extraction fallback:', err);
  }

  return null;
}
