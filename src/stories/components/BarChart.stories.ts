// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { BarChartComponent } from 'src/app/trudi-ui/chart/bar-chart/bar-chart.component';
import type { ChartConfig } from 'src/app/trudi-ui/chart/interfaces/chart.interface';
import { TrudiUiModule } from 'src/app/trudi-ui/trudi-ui.module';

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: 'trudi-ui/Chart/BarChart',
  component: BarChartComponent,
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
  argTypes: {
    config: {
      name: 'config'
    },
    chartTitle: {
      name: 'chartTitle',
      type: 'string',
      defaultValue: '',
      description: 'content',
      control: 'text'
    }
  },
  decorators: [
    moduleMetadata({
      imports: [
        AngularSvgIconModule.forRoot(),
        TrudiUiModule,
        HttpClientModule,
        RouterModule
      ],
      providers: [],
      declarations: []
    })
  ]
} as Meta;

export interface chartData {
  label?: string;
  heightRatio?: number | undefined;
}
// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args

const mockData: chartData[] = [
  { label: 'JAN', heightRatio: 100 },
  { label: 'FEB', heightRatio: 98 },
  { label: 'MAR', heightRatio: 80 },
  { label: 'APR', heightRatio: 30 },
  { label: 'MAY', heightRatio: 50 },
  { label: 'JUN', heightRatio: 90 },
  { label: 'JUL', heightRatio: 10 },
  { label: 'AUG', heightRatio: 40 },
  { label: 'SEP', heightRatio: 20 },
  { label: 'OCT', heightRatio: 22 },
  { label: 'NOV', heightRatio: 55 },
  { label: 'DEC', heightRatio: 65 }
];

const mockConfig: ChartConfig<chartData> = {
  data: mockData,
  height: 500,
  width: 1236,
  settings: {
    bindingProperty: {
      bindValue: 'heightRatio',
      bindColor: '#33BBB2',
      bindLabel: 'label'
    }
  },
  tooltip: {
    replaceFunction: (template: string, data: chartData) => {
      const newTemp = template
        ?.replace(/value_year/, `${data.label}`)
        .replace(/value_hours/, `${data.heightRatio} hours saved`)
        .replace(/value_trend/, `${data.heightRatio}` + '%');
      return newTemp;
    }
  },
  annotation: []
};

const Template: Story<BarChartComponent> = (args: BarChartComponent) => ({
  props: args,
  template: `
    <chart-wrapper chartTitle="Total time saved">
      <bar-chart
        [config]="config"></bar-chart>
    </chart-wrapper>
  `
});
export const BarChart = Template.bind({});

// More on args: https://storybook.js.org/docs/angular/writing-stories/args
BarChart.args = {
  config: mockConfig
};

const TemplateBarChartCumtomsToolTip: Story<BarChartComponent> = (
  args: BarChartComponent
) => ({
  props: args,
  template: `
    <chart-wrapper chartTitle="Total time saved">
      <bar-chart
        [config]="config"
        [tooltipTemplate]="tooltipTemplate"
        >
          <ng-template #tooltipTemplate>
              <div class="default_tooltip">
                  <div class="default_tooltip--year">value_year</div>
                  <div class="default_tooltip--hours">value_hours</div>
                  <div class="default_tooltip--trend">value_trend</div>
              </div>
          </ng-template>
        </bar-chart>
      </chart-wrapper>
    `
});
export const BarChartCumtomsToolTip = TemplateBarChartCumtomsToolTip.bind({});

BarChartCumtomsToolTip.args = {
  config: mockConfig
};
