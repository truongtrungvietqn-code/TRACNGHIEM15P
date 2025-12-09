import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { Question } from '../models/question.model';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async generateQuestions(sach: string, mon: string, lop: string, chuDe: string): Promise<Question[]> {
    const prompt = `Dựa trên chương trình giáo dục Việt Nam cho loại sách giáo khoa '${sach}', môn '${mon}', lớp '${lop}', và chủ đề '${chuDe}', hãy tạo chính xác 10 câu hỏi cho một bài kiểm tra 15 phút, bao gồm 5 câu hỏi trắc nghiệm nhiều lựa chọn (MCQ) với 4 phương án trả lời và 5 câu hỏi đúng/sai (TF). Cung cấp câu trả lời đúng cho mỗi câu hỏi.`;

    const questionSchema = {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: 'Loại câu hỏi: "MCQ" cho trắc nghiệm hoặc "TF" cho đúng/sai.',
        },
        question: {
          type: Type.STRING,
          description: 'Nội dung câu hỏi.',
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Một mảng gồm 4 lựa chọn cho câu hỏi MCQ. Null cho câu hỏi TF.',
          nullable: true
        },
        answer: {
          type: Type.STRING,
          description: 'Câu trả lời đúng. Đối với TF, là "Đúng" hoặc "Sai". Đối với MCQ, là nội dung của đáp án đúng.',
        },
      },
      required: ['type', 'question', 'answer'],
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: questionSchema,
          },
        },
      });

      const responseText = response.text;
      const parsedJson = JSON.parse(responseText);
      
      // Ensure options are null for TF questions as per our model
      return parsedJson.map((q: any) => {
          if (q.type === 'TF') {
              q.options = null;
          }
          return q;
      });

    } catch (error) {
      console.error('Error generating questions from Gemini API:', error);
      throw new Error('Could not generate questions. The API returned an error.');
    }
  }
}
