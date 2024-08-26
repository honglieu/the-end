// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { HttpClientModule } from '@angular/common/http';
import type { FormBuilder } from '@angular/forms';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormControl
} from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import type { Meta, Story } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TrudiCheckboxButtonComponent } from 'src/app/trudi-ui/form/trudi-checkbox-button/trudi-checkbox-button.component';
import { TrudiCheckboxGroupComponent } from 'src/app/trudi-ui/form/trudi-checkbox-group/trudi-checkbox-group.component';
import { TrudiCheckboxComponent } from 'src/app/trudi-ui/form/trudi-checkbox/trudi-checkbox.component';
import { TrudiIconComponent } from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';
import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { TrudiButtonComponent } from 'src/app/trudi-ui/views/trudi-button/trudi-button.component';
import { TrudiFormControlComponent } from 'src/app/trudi-ui/form/trudi-form-control/trudi-form-control.component';

@Component({
  selector: 'app-checkboxGroup-form',
  template: ` <div class="container" style="padding: '50px'">
    <div [formGroup]="formGT" class="col-12">
      <div class="grid-row-12">
        <trudi-form-control>
          <trudi-checkbox-group [label]="label" formControlName="form1">
            <ng-container *ngFor="let item of data">
              <trudi-checkbox
                [label]="item.text"
                [stringValue]="item.value"></trudi-checkbox>
            </ng-container>
          </trudi-checkbox-group>
        </trudi-form-control>
      </div>
      <button
        trudi-btn
        size="small"
        variant="filled"
        btnType="primary"
        type="submit"
        (click)="onClick()"
        style="margin-top: '20px'">
        Submit
      </button>
    </div>
  </div>`
})
class FormComponent implements OnInit {
  formGT: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.formGT = new FormGroup({
      form1: new FormControl([], Validators.required)
    });
  }

  onClick() {
    this.formGT.markAllAsTouched();
  }
}

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: 'trudi-ui/Checkbox/CheckboxGroup',
  component: FormComponent,
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
  argTypes: {
    label: {
      name: 'label',
      type: { name: 'string', required: false },
      defaultValue: '',
      description: 'Label of group',
      control: 'text'
    }
  },
  decorators: [
    moduleMetadata({
      imports: [
        AngularSvgIconModule.forRoot(),
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule
      ],
      providers: [],
      declarations: [
        TrudiIconComponent,
        TrudiCheckboxButtonComponent,
        TrudiCheckboxComponent,
        FormComponent,
        TrudiButtonComponent,
        TrudiFormControlComponent,
        TrudiCheckboxGroupComponent
      ]
    })
  ]
} as Meta;

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args
const Template: Story<TrudiCheckboxGroupComponent> = (
  args: TrudiCheckboxGroupComponent
) => ({
  props: args,
  template: `
    <div style="width: '400px'">
        <trudi-checkbox-group
            [label]="label"
            [(ngModel)]="model"
        >
            <ng-container *ngFor="let item of data">
                <trudi-checkbox-button
                    icon="home3"
                    [label]="item.text"
                    [stringValue]="item.value"
                ></trudi-checkbox-button>
            </ng-container>
        </trudi-checkbox-group>
        model: {{ model.join(", ") }}
    </div>
  `
});

const TemplateTrudiCheckBox: Story<TrudiCheckboxComponent> = (
  args: TrudiCheckboxComponent
) => ({
  props: args,
  template: `
    <div style="width: '400px'">
      <trudi-checkbox-group
        [label]="label"
        [(ngModel)]="model"
      >
        <ng-container *ngFor="let item of data">
          <trudi-checkbox
            [label]="item.text"
            [stringValue]="item.value"
          ></trudi-checkbox>
        </ng-container>
      </trudi-checkbox-group>
    model: {{ model.join(", ") }}
  </div>
  `
});

export const CheckboxButtonGroup = Template.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
CheckboxButtonGroup.args = {
  label: 'Event type',
  data: [
    { value: '1', text: 'Compliance expiry date' },
    { value: '2', text: 'Compliance next service date' },
    { value: '3', text: 'Ingoing inspection date' },
    { value: '4', text: 'Lease end date' },
    { value: '5', text: 'Lease start date' },
    { value: '6', text: 'Number of days in arrears' }
  ],
  model: ['1', '2']
};

export const CheckBoxGroup = TemplateTrudiCheckBox.bind({});
CheckBoxGroup.args = {
  label: 'Event type',
  data: [
    { value: '1', text: 'Compliance expiry date' },
    { value: '2', text: 'Compliance next service date' },
    { value: '3', text: 'Ingoing inspection date' },
    { value: '4', text: 'Lease end date' },
    { value: '5', text: 'Lease start date' },
    { value: '6', text: 'Number of days in arrears' }
  ],
  model: ['1', '2']
};

export const ValidationCheckBoxGroup = () => ({
  template: `
    <app-checkboxGroup-form></app-checkboxGroup-form>
    `,
  props: {
    label: 'Event type',
    data: [
      { value: '1', text: 'Compliance expiry date' },
      { value: '2', text: 'Compliance next service date' },
      { value: '3', text: 'Ingoing inspection date' },
      { value: '4', text: 'Lease end date' },
      { value: '5', text: 'Lease start date' },
      { value: '6', text: 'Number of days in arrears' }
    ]
  }
});
