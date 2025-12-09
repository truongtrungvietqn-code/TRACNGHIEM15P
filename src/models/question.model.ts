
export interface BaseQuestion {
  type: 'MCQ' | 'TF';
  question: string;
  answer: string;
}

export interface McqQuestion extends BaseQuestion {
  type: 'MCQ';
  options: string[];
}

export interface TfQuestion extends BaseQuestion {
  type: 'TF';
  options: null;
}

export type Question = McqQuestion | TfQuestion;
