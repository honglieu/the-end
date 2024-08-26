import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class AutomatedRepliesFormService {
  public addQuestionForm: FormGroup;
  constructor(private formBuilder: FormBuilder) {}

  buildFormAddQuestion() {
    this.addQuestionForm = this.formBuilder.group({
      question: this.formBuilder.control('')
    });
  }
}
