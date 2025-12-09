
import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Question, McqQuestion, TfQuestion } from '../../models/question.model';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionFormComponent {
  questionType = input.required<'MCQ' | 'TF'>();
  addQuestion = output<Question>();
  cancel = output<void>();

  questionText = signal('');
  options = signal(['', '', '', '']);
  answer = signal('');

  updateOption(index: number, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.options.update(currentOptions => {
      const newOptions = [...currentOptions];
      newOptions[index] = value;
      return newOptions;
    });
  }

  isFormValid(): boolean {
    if (!this.questionText().trim()) return false;
    if (this.questionType() === 'MCQ') {
      return this.options().every(opt => opt.trim()) && !!this.answer().trim() && this.options().includes(this.answer());
    }
    if (this.questionType() === 'TF') {
      return this.answer() === 'Đúng' || this.answer() === 'Sai';
    }
    return false;
  }
  
  onAddQuestion() {
    if (!this.isFormValid()) return;
    
    let newQuestion: Question;
    
    if (this.questionType() === 'MCQ') {
      newQuestion = {
        type: 'MCQ',
        question: this.questionText(),
        options: [...this.options()],
        answer: this.answer(),
      } as McqQuestion;
    } else {
       newQuestion = {
        type: 'TF',
        question: this.questionText(),
        answer: this.answer(),
        options: null
      } as TfQuestion;
    }

    this.addQuestion.emit(newQuestion);
    this.resetForm();
  }

  onCancel() {
    this.cancel.emit();
    this.resetForm();
  }

  private resetForm() {
    this.questionText.set('');
    this.options.set(['', '', '', '']);
    this.answer.set('');
  }
}
