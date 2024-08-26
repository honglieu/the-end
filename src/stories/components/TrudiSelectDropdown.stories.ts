import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgSelectModule } from '@ng-select/ng-select';
import { moduleMetadata, type Meta, type Story } from '@storybook/angular';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { TrudiSelectDropdownComponent } from 'src/app/trudi-ui/form/trudi-select-dropdown/trudi-select-dropdown.component';
import { SelectModule } from 'src/app/trudi-ui/select/select.module';
import { TrudiUiModule } from 'src/app/trudi-ui/trudi-ui.module';
import { IconType } from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';

const items = [
  {
    id: 0,
    label: 'Task 1',
    status: 1,
    avatar: 'assets/images/avatar-1.jpg'
  },
  {
    id: 1,
    label: 'Task 2',
    status: 2,
    avatar: 'assets/images/avatar-1.jpg'
  },
  {
    id: 2,
    label: 'Task 3',
    status: 1,
    avatar: 'assets/images/avatar-1.jpg'
  },
  {
    id: 3,
    label: 'Task 4',
    status: 2,
    disabled: true,
    avatar: 'assets/images/avatar-1.jpg'
  },
  {
    id: 4,
    label: 'Task 5',
    status: 3,
    avatar: 'assets/images/avatar-1.jpg'
  },
  {
    id: 5,
    label: 'Task 6',
    status: 3,
    avatar: 'assets/images/avatar-1.jpg'
  },
  {
    id: 6,
    label: 'Task 7',
    status: 2,
    avatar: 'assets/images/avatar-1.jpg'
  },
  {
    id: 7,
    label: 'Task 8',
    status: 2,
    avatar: 'assets/images/avatar-1.jpg'
  }
];

const size = ['small', 'medium', 'semi-large', 'large'];
const variant = ['filled', 'tonal', 'outlined', 'text'];
const placement = [
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
  'topLeft',
  'topCenter',
  'topRight'
];
const trudiTrigger = ['click', 'hover'];

export default {
  title: 'trudi-ui/Select/TrudiSelectDropdown',
  component: TrudiSelectDropdownComponent,
  argTypes: {
    size: {
      name: 'size',
      type: {
        name: 'string'
      },
      control: 'select',
      defaultValue: 'medium',
      description: 'size of  button',
      options: size
    },
    variant: {
      name: 'variant',
      type: {
        name: 'string'
      },
      control: 'select',
      defaultValue: 'outlined',
      description: 'variant of  button',
      options: variant
    },
    disabled: {
      name: 'disabled',
      type: {
        name: 'boolean'
      },
      defaultValue: false,
      description: 'disabled of button'
    },
    placement: {
      name: 'placement',
      type: {
        name: 'string'
      },
      control: 'select',
      defaultValue: 'bottomLeft',
      description: 'placement of pop menu',
      options: placement
    },
    trudiTrigger: {
      name: 'trudiTrigger',
      type: {
        name: 'string'
      },
      control: 'select',
      defaultValue: 'click',
      description: 'trigger of button',
      options: trudiTrigger
    },
    bindValue: {
      name: 'bindValue',
      type: {
        name: 'string'
      },
      defaultValue: 'id'
    },
    bindLabel: {
      name: 'bindLabel',
      type: {
        name: 'string'
      },
      defaultValue: 'label'
    },
    placeholder: {
      name: 'placeholder',
      type: {
        name: 'string'
      },
      defaultValue: '',
      description: 'placeholder of input search when searchable = true.'
    },
    searchable: {
      name: 'searchable',
      type: {
        name: 'boolean'
      },
      defaultValue: false,
      description: 'search input of pop menu.'
    },
    showArrowIcon: {
      name: 'showArrowIcon',
      type: {
        name: 'boolean'
      },
      defaultValue: true
    },
    prefixIcon: {
      name: 'prefixIcon',
      type: { name: 'string', required: true },
      defaultValue: '',
      description: 'use IconType value',
      control: 'select',
      options: Object.keys(IconType)
    },
    multi: {
      name: 'multi',
      type: {
        name: 'boolean'
      },
      defaultValue: false,
      description: 'choose many option.'
    },
    itemImage: {
      name: 'itemImage',
      type: {
        name: 'string'
      },
      description: 'avatar of option.'
    },
    overlayClassName: {
      name: 'overlayClassName',
      type: {
        name: 'string'
      },
      description: 'use class to override css of base css.'
    },
    customTitle: {
      name: 'customTitle',
      defaultValue: undefined,
      type: {
        name: 'string',
        required: false
      },
      description: 'custom text of button.'
    },
    groupBy: {
      name: 'groupBy',
      type: {
        name: 'string'
      },
      description: 'group item by field of object'
    },
    // customSearchFn: {
    //   name: 'customSearchFn',
    //   type: {
    //     name: 'string'
    //   }
    // },
    search: {
      action: 'search',
      description: 'Emit when user typing in input.'
    },
    clearable: {
      name: 'clearable',
      type: {
        name: 'boolean'
      },
      defaultValue: true
    }
  },
  decorators: [
    moduleMetadata({
      declarations: [],
      imports: [
        HttpClientModule,
        NgSelectModule,
        BrowserAnimationsModule,
        FormsModule,
        SelectModule,
        TrudiUiModule,
        CommonModule,
        NzSkeletonModule
      ]
    })
  ],
  args: {}
} as Meta;

export const Default: Story = (args) => ({
  template: `
    <trudi-select-dropdown
    [placeholder]="placeholder"
    [searchable]="searchable"
    [prefixIcon]="prefixIcon"
    [customTitle]="customTitle"
    [overlayClassName]="overlayClassName"
    [itemImage]="itemImage"
    [multi]="multi"
    [showArrowIcon]="showArrowIcon"
    [size]="size"
    [variant]="variant"
    [disabled]="disabled"
    [clearable]="clearable"
    [(ngModel)]="model"
    [items]="items"
    [trudiTrigger]="trudiTrigger"
    [placement]="placement"
    [bindLabel]="bindLabel"
    [bindValue]="bindValue"
    [groupBy]="groupBy"
    (search)="search($event)">
    </trudi-select-dropdown>
  `,
  props: args
});

Default.args = {
  clearable: false,
  searchable: false,
  showArrowIcon: true,
  customTitle: null,
  prefixIcon: null,
  overlayClassName: null,
  itemImage: null,
  multi: false,
  model: 0,
  items: items,
  bindLabel: 'label',
  bindValue: 'id',
  disabled: false,
  size: 'medium',
  variant: 'outlined',
  placement: 'bottomLeft',
  trudiTrigger: 'click',
  placeholder: ''
};

export const Group = Default.bind({});
Group.args = {
  clearable: false,
  searchable: false,
  showArrowIcon: true,
  customTitle: null,
  prefixIcon: null,
  overlayClassName: null,
  itemImage: null,
  multi: false,
  model: 0,
  items: items,
  bindLabel: 'label',
  bindValue: 'id',
  disabled: false,
  size: 'medium',
  variant: 'outlined',
  placement: 'bottomLeft',
  trudiTrigger: 'click',
  placeholder: '',
  groupBy: 'status'
};

export const GroupAndSearch = Default.bind({});
GroupAndSearch.args = {
  clearable: false,
  searchable: true,
  showArrowIcon: true,
  customTitle: null,
  prefixIcon: null,
  overlayClassName: null,
  itemImage: null,
  multi: false,
  model: 0,
  items: items,
  bindLabel: 'label',
  bindValue: 'id',
  disabled: false,
  size: 'medium',
  variant: 'outlined',
  placement: 'bottomLeft',
  trudiTrigger: 'click',
  placeholder: '',
  groupBy: 'status'
};

export const MultiSelect = Default.bind({});
MultiSelect.args = {
  clearable: false,
  searchable: true,
  showArrowIcon: true,
  customTitle: null,
  prefixIcon: null,
  overlayClassName: null,
  itemImage: null,
  multi: true,
  model: null,
  items: items,
  bindLabel: 'label',
  bindValue: 'id',
  disabled: false,
  size: 'medium',
  variant: 'outlined',
  placement: 'bottomLeft',
  trudiTrigger: 'click',
  placeholder: '',
  groupBy: 'status'
};

export const CustomTitle = Default.bind({});
CustomTitle.args = {
  clearable: false,
  searchable: false,
  showArrowIcon: true,
  customTitle: 'Custom title',
  prefixIcon: null,
  overlayClassName: null,
  itemImage: null,
  multi: false,
  model: 0,
  items: items,
  bindLabel: 'label',
  bindValue: 'id',
  disabled: false,
  size: 'medium',
  variant: 'outlined',
  placement: 'bottomLeft',
  trudiTrigger: 'click',
  placeholder: ''
};

export const Custom: Story = (args) => ({
  template: `
    <trudi-select-dropdown
    [placeholder]="placeholder"
    [searchable]="searchable"
    [prefixIcon]="prefixIcon"
    [customTitle]="customTitle"
    [overlayClassName]="overlayClassName"
    [itemImage]="itemImage"
    [multi]="multi"
    [showArrowIcon]="showArrowIcon"
    [size]="size"
    [variant]="variant"
    [disabled]="disabled"
    [clearable]="clearable"
    [(ngModel)]="model"
    [items]="items"
    [trudiTrigger]="trudiTrigger"
    [placement]="placement"
    [bindLabel]="bindLabel"
    [bindValue]="bindValue"
    [groupBy]="groupBy"
    (search)="search($event)">
      <ng-template trudi-select-dropdown-header-tmp>Custom header</ng-template>
      <ng-template trudi-select-dropdown-footer-tmp>Custom footer</ng-template>
      <ng-template trudi-select-dropdown-option-tmp let-item="item">
        <div>{{ item.label }}</div>
      </ng-template>
    </trudi-select-dropdown>
  `,
  props: args
});

Custom.args = {
  clearable: false,
  searchable: false,
  showArrowIcon: true,
  customTitle: null,
  prefixIcon: null,
  overlayClassName: null,
  itemImage: null,
  multi: false,
  model: 0,
  items: items,
  bindLabel: 'label',
  bindValue: 'id',
  disabled: false,
  size: 'medium',
  variant: 'outlined',
  placement: 'bottomLeft',
  trudiTrigger: 'click',
  placeholder: ''
};

export const AvatarOption = Default.bind({});
AvatarOption.args = {
  clearable: false,
  searchable: false,
  showArrowIcon: true,
  customTitle: null,
  prefixIcon: null,
  overlayClassName: null,
  itemImage: 'avatar',
  multi: false,
  model: 0,
  items: items,
  bindLabel: 'label',
  bindValue: 'id',
  disabled: false,
  size: 'medium',
  variant: 'outlined',
  placement: 'bottomLeft',
  trudiTrigger: 'click',
  placeholder: ''
};
