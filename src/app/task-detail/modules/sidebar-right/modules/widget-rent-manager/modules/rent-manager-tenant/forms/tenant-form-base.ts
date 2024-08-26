import { Directive, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { AsyncSubject } from 'rxjs';
import { TenantFormName } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';

@Directive()
export abstract class TenantFormBase<TForm extends AbstractControl>
  implements OnInit, OnDestroy
{
  private _formMaster: FormGroup;
  @Input() set formMaster(form: FormGroup) {
    this._formMaster = form;
  }
  @Input() formName: TenantFormName;
  @Input() isLoading: boolean = false;
  @Input() isSubmitted: boolean = false;

  public form: TForm;
  protected readonly destroy$ = new AsyncSubject<void>();

  ngOnInit(): void {
    this._setCurrentForm();
  }

  private _setCurrentForm() {
    this.form = this._formMaster.get(this.formName) as TForm;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
