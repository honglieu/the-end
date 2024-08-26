import { HttpClientModule } from '@angular/common/http';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import {
  TrudiTableComponent,
  ETrudiTableSize
} from 'src/app/trudi-ui/views/trudi-table/trudi-table.component';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TrudiCheckboxComponent } from 'src/app/trudi-ui/form/trudi-checkbox/trudi-checkbox.component';
import { TrudiIconComponent } from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';
import { TrudiPaginationComponent } from 'src/app/trudi-ui/views/trudi-table/components/trudi-pagination.component';
import { NgSelectModule } from '@ng-select/ng-select';

export default {
  title: 'trudi-ui/TrudiTableComponent',
  component: TrudiTableComponent,
  argTypes: {
    tableSize: {
      name: 'tableSize',
      type: { name: 'string', required: true },
      defaultValue: ETrudiTableSize.DEFAULT,
      description: 'use tableSize value',
      control: 'select',
      options: Object.keys(ETrudiTableSize)
    },
    showPagination: {
      name: 'showPagination',
      type: 'boolean',
      defaultValue: false,
      description: 'showPagination'
    },
    showCheckbox: {
      name: 'showCheckbox',
      type: 'boolean',
      defaultValue: true,
      description: 'showCheckbox'
    }
  },
  decorators: [
    moduleMetadata({
      imports: [
        AngularSvgIconModule.forRoot(),
        HttpClientModule,
        NzTableModule,
        NgSelectModule
      ],
      declarations: [
        TrudiTableComponent,
        TrudiCheckboxComponent,
        TrudiIconComponent,
        TrudiPaginationComponent
      ],
      providers: []
    })
  ]
} as Meta;

const Template: Story<TrudiTableComponent> = (args: TrudiTableComponent) => ({
  props: args,
  template: `
    <trudi-table
      [trudiTableColumns]="trudiTableColumns"
      [trudiTableDataSource]="trudiTableDataSource"
      [showPagination]="showPagination"
      [showCheckbox]="showCheckbox"
      [tableSize]="tableSize">
    </trudi-table>
    `
});

export const TrudiTable = Template.bind({});

TrudiTable.args = {
  trudiTableColumns: [
    {
      key: 'name',
      label: 'Task name1'
    },
    {
      key: 'region',
      label: 'Region'
    },
    {
      key: 'crm',
      label: 'CRM'
    },
    {
      key: 'last_update',
      label: 'Last updated'
    }
  ],
  trudiTableDataSource: [
    {
      id: '123a',
      name: 'Pet request',
      region: 'All region',
      crm: 'Property tree',
      last_update: '10/12/2012',
      checked: false,
      disabled: true
    },
    {
      id: '123b',
      name: 'Leasing',
      region: 'All region 1',
      crm: 'Property tree',
      last_update: '11/12/2012',
      checked: false,
      disabled: false
    },
    {
      id: '123c',
      name: 'Routine maintenance',
      region: 'All region 2',
      crm: 'Property tree',
      last_update: '12/12/2012',
      checked: false,
      disabled: false
    },
    {
      id: '123d',
      name: 'Routine maintenance',
      region: 'All region 2',
      crm: 'Property tree',
      last_update: '12/12/2012',
      checked: false,
      disabled: false
    },
    {
      id: '123e',
      name: 'Leasing',
      region: 'All region 1',
      crm: 'Property tree',
      last_update: '11/12/2012',
      checked: false,
      disabled: false
    },
    {
      id: '123f',
      name: 'Routine maintenance',
      region: 'All region 2',
      crm: 'Property tree',
      last_update: '12/12/2012',
      checked: false,
      disabled: false
    },
    {
      id: '123a',
      name: 'Pet request',
      region: 'All region',
      crm: 'Property tree',
      last_update: '10/12/2012',
      checked: false,
      disabled: true
    },
    {
      id: '123a',
      name: 'Pet request',
      region: 'All region',
      crm: 'Property tree',
      last_update: '10/12/2012',
      checked: false,
      disabled: false
    },
    {
      id: '123a',
      name: 'Pet request',
      region: 'All region',
      crm: 'Property tree',
      last_update: '10/12/2012',
      checked: false,
      disabled: false
    },
    {
      id: '123a',
      name: 'Pet request',
      region: 'All region',
      crm: 'Property tree',
      last_update: '10/12/2012',
      checked: false,
      disabled: false
    },
    {
      id: '123a',
      name: 'Pet request',
      region: 'All region',
      crm: 'Property tree',
      last_update: '10/12/2012',
      checked: false,
      disabled: false
    }
  ],
  showPagination: true,
  showCheckbox: true,
  tableSize: ETrudiTableSize.DEFAULT
};
