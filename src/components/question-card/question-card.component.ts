
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question, McqQuestion } from '../../models/question.model';

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionCardComponent {
  question = input.required<Question>();
  index = input.required<number>();
  removeQuestion = output<number>();

  isMcq(question: Question): question is McqQuestion {
    return question.type === 'MCQ';
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }
  
  onRemove() {
    this.removeQuestion.emit(this.index());
  }
}
