import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '@services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  public propertyNoteForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {}
}
