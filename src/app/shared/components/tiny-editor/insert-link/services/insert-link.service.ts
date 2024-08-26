import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IActiveLink } from '@shared/components/tiny-editor/plugins/custom-link/api/types';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { ShareValidators } from '@shared/validators/share-validator';

@Injectable({
  providedIn: 'root'
})
export class InsertLinkService {
  private linkForm: FormGroup;
  private currenLink: BehaviorSubject<IActiveLink> =
    new BehaviorSubject<IActiveLink>(null);
  private isEditLink$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  constructor(private formBuilder: FormBuilder) {}

  public buildForm(): FormGroup {
    this.linkForm = this.formBuilder.group({
      url: new FormControl('', [
        Validators.required,
        ShareValidators.websiteUrl()
      ]),
      title: new FormControl('')
    });
    return this.linkForm;
  }

  public patchFormValues(prefillData: IActiveLink) {
    this.linkForm?.patchValue({
      url: prefillData?.url,
      title: prefillData?.title
    });
  }

  public get isEditLinkBS() {
    return this.isEditLink$.asObservable();
  }

  public get isEditLink() {
    return this.isEditLink$.value;
  }

  public setIsEditLink(value: boolean) {
    this.isEditLink$.next(value);
  }

  public get currentLink$() {
    return this.currenLink.asObservable();
  }
  public setCurrenLink(value: IActiveLink) {
    this.currenLink.next(value);
  }

  public get form() {
    return this.linkForm;
  }
}
