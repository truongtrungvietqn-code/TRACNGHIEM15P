import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';
import { Question, McqQuestion, TfQuestion } from './models/question.model';
import { QuestionCardComponent } from './components/question-card/question-card.component';
import { QuestionFormComponent } from './components/question-form/question-form.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, QuestionCardComponent, QuestionFormComponent]
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  sach = signal('Kết nối tri thức');
  mon = signal('Địa lý');
  lop = signal('Lớp 6');
  chuDe = signal('');

  questions = signal<Question[]>([]);
  questionTypeToAdd = signal<'MCQ' | 'TF' | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  sachOptions = ["Kết nối tri thức", "Chân trời sáng tạo", "Cánh diều"];
  monOptions = ["Địa lý", "Tin học", "Lịch sử", "Giáo dục công dân", "Vật lý", "Hóa học", "Sinh học"];
  lopOptions = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12"];

  onSachChange(event: Event) {
    this.sach.set((event.target as HTMLSelectElement).value);
  }

  onMonChange(event: Event) {
    this.mon.set((event.target as HTMLSelectElement).value);
  }

  onLopChange(event: Event) {
    this.lop.set((event.target as HTMLSelectElement).value);
  }
  
  onChuDeChange(event: Event) {
    this.chuDe.set((event.target as HTMLInputElement).value);
  }

  setQuestionTypeToAdd(type: 'MCQ' | 'TF') {
    if (this.questionTypeToAdd() === type) {
      this.questionTypeToAdd.set(null); // Toggle off if same button is clicked
    } else {
      this.questionTypeToAdd.set(type);
    }
  }

  async generateQuestions() {
    if (this.isLoading() || !this.chuDe()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.questions.set([]);
    this.questionTypeToAdd.set(null);

    try {
      const generatedQuestions = await this.geminiService.generateQuestions(
        this.sach(),
        this.mon(),
        this.lop(),
        this.chuDe()
      );
      this.questions.set(generatedQuestions);
    } catch (e) {
      console.error(e);
      this.error.set('Failed to generate questions. Please check the topic and try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  addQuestion(question: Question) {
    this.questions.update(currentQuestions => [...currentQuestions, question]);
    this.questionTypeToAdd.set(null);
  }
  
  removeQuestion(index: number) {
    this.questions.update(currentQuestions => currentQuestions.filter((_, i) => i !== index));
  }
  
  isMcqQuestion(question: Question): question is McqQuestion {
    return question.type === 'MCQ';
  }

  isTfQuestion(question: Question): question is TfQuestion {
    return question.type === 'TF';
  }
  
  exportTest() {
    const author = `Biên soạn: Trương Trung Việt - Trường THCS Nghĩa Hoa\n`;
    const header = `ĐỀ KIỂM TRA 15 PHÚT\n`;
    const info = `Môn: ${this.mon()} - Lớp: ${this.lop()}\nChủ đề: ${this.chuDe()}\n`;
    const separator = '-'.repeat(40) + '\n\n';

    const mcqQuestions = this.questions().filter(q => this.isMcqQuestion(q));
    const tfQuestions = this.questions().filter(q => this.isTfQuestion(q));

    let content = header + info + author + separator;

    if (mcqQuestions.length > 0) {
      content += 'I. TRẮC NGHIỆM\n\n';
      mcqQuestions.forEach((q, i) => {
        content += `Câu ${i + 1}: ${q.question}\n`;
        if (this.isMcqQuestion(q)) {
          q.options.forEach((opt, optIndex) => {
            content += `  ${String.fromCharCode(65 + optIndex)}. ${opt}\n`;
          });
        }
        content += '\n';
      });
    }

    if (tfQuestions.length > 0) {
      content += 'II. ĐÚNG/SAI\n\n';
      tfQuestions.forEach((q, i) => {
        const questionNumber = mcqQuestions.length + i + 1;
        content += `Câu ${questionNumber}: ${q.question}\n`;
        content += `  A. Đúng\n`;
        content += `  B. Sai\n\n`;
      });
    }

    const filename = `De-kiem-tra-${this.mon().replace(/\s/g, '-')}-${this.lop().replace(/\s/g, '-')}.txt`;
    this.downloadFile(content, filename, 'text/plain;charset=utf-8');
  }

  exportAnswers() {
    const author = `Biên soạn: Trương Trung Việt - Trường THCS Nghĩa Hoa\n`;
    const header = `ĐÁP ÁN ĐỀ KIỂM TRA 15 PHÚT\n`;
    const info = `Môn: ${this.mon()} - Lớp: ${this.lop()}\nChủ đề: ${this.chuDe()}\n`;
    const separator = '-'.repeat(40) + '\n\n';

    const mcqQuestions = this.questions().filter(q => this.isMcqQuestion(q));
    const tfQuestions = this.questions().filter(q => this.isTfQuestion(q));
    const orderedQuestions = [...mcqQuestions, ...tfQuestions];

    let answersContent = '';
    orderedQuestions.forEach((q, index) => {
      let answerText = '';
      if (this.isMcqQuestion(q)) {
        const correctIndex = q.options.findIndex(opt => opt === q.answer);
        answerText = correctIndex !== -1 ? String.fromCharCode(65 + correctIndex) : q.answer;
      } else {
        answerText = q.answer;
      }
      answersContent += `${index + 1}. ${answerText}\n`;
    });

    const fullContent = header + info + author + separator + answersContent;
    const filename = `Dap-an-${this.mon().replace(/\s/g, '-')}-${this.lop().replace(/\s/g, '-')}.txt`;
    this.downloadFile(fullContent, filename, 'text/plain;charset=utf-8');
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}