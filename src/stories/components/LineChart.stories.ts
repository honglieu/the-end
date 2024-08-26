// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { EPeriodType } from 'src/app/trudi-ui/chart/interfaces/chart.constant';
import type { ChartConfig } from 'src/app/trudi-ui/chart/interfaces/chart.interface';
import { TrudiLineChartComponent } from 'src/app/trudi-ui/chart/trudi-line-chart/trudi-line-chart.component';
import { TrudiUiModule } from 'src/app/trudi-ui/trudi-ui.module';

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: 'trudi-ui/Chart/LineChart',
  component: TrudiLineChartComponent,
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

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args

const mockData: ILineChartData[] = [
  { xAxisData: new Date('2024-01-01T00:00:00.000Z'), yAxisData: 20 },
  { xAxisData: new Date('2024-01-02T00:00:00.000Z'), yAxisData: 30 },
  { xAxisData: new Date('2024-05-01T00:00:00.000Z'), yAxisData: 50 },
  { xAxisData: new Date('2024-08-01T00:00:00.000Z'), yAxisData: 70 },
  { xAxisData: new Date('2024-10-01T00:00:00.000Z'), yAxisData: 50 },
  { xAxisData: new Date('2024-11-01T00:00:00.000Z'), yAxisData: 50 },
  { xAxisData: new Date('2024-11-05T00:00:00.000Z'), yAxisData: 70 },
  { xAxisData: new Date('2024-12-01T00:00:00.000Z'), yAxisData: 50 }
];

const mockConfig: ChartConfig<ILineChartData> = {
  data: mockData,
  height: 600,
  width: 600,
  settings: {
    lineColor: '#33BAB1',
    areaDataColor: '#E9F9F8',
    bindingProperty: {
      bindValue: 'yAxisData',
      bindLabel: 'xAxisData'
    }
  },
  periodType: EPeriodType.MONTH,
  tooltip: {
    replaceFunction: (template: string, data: ILineChartData) => {
      const newTemp = template
        .replace(/tooltip_date/, `${data.xAxisData}`)
        .replace(/tooltip_data/, `Data ${data.yAxisData}`);
      return newTemp;
    }
  }
};
interface ILineChartData {
  xAxisData: Date;
  yAxisData: number;
}
const Template: Story<TrudiLineChartComponent> = (
  args: TrudiLineChartComponent
) => ({
  props: args,
  template: `
    <chart-wrapper chartTitle="Total time saved">
      <trudi-line-chart
        [config]="config"></trudi-line-chart>
    </chart-wrapper>
  `
});

export const LineChart = Template.bind({});

// More on args: https://storybook.js.org/docs/angular/writing-stories/args
LineChart.args = {
  config: mockConfig
};
