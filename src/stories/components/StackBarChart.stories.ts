// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import dayjs from 'dayjs';
import type {
  ChartAnnotation,
  ChartConfig
} from 'src/app/trudi-ui/chart/interfaces/chart.interface';
import { StackBarChartComponent } from 'src/app/trudi-ui/chart/stack-bar-chart/stack-bar-chart.component';
import type { StackBarChartData } from 'src/app/trudi-ui/chart/stack-bar-chart/stack-bar-chart.component';
import { TrudiUiModule } from 'src/app/trudi-ui/trudi-ui.module';

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: 'trudi-ui/Chart/StackBarChart',
  component: StackBarChartComponent,
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
  argTypes: {
    config: {
      name: 'config'
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
const data: StackBarChartData[] = [
  {
    label: dayjs('2023-01-1').format('MMMM'),
    inProgress: 20,
    completed: 80,
    percentageChange: 10
  },
  {
    label: dayjs('2023-02-1').format('MMMM'),
    inProgress: 55,
    completed: 45,
    percentageChange: 10
  },
  {
    label: dayjs('2023-03-1').format('MMMM'),
    inProgress: 60,
    completed: 40,
    percentageChange: 10
  },
  {
    label: dayjs('2023-04-1').format('MMMM'),
    inProgress: 30,
    completed: 70,
    percentageChange: 10
  },
  {
    label: dayjs('2023-05-1').format('MMMM'),
    inProgress: 50,
    completed: 50,
    percentageChange: 10
  },
  {
    label: dayjs('2023-06-1').format('MMMM'),
    inProgress: 36,
    completed: 64,
    percentageChange: 10
  },
  {
    label: dayjs('2023-07-1').format('MMMM'),
    inProgress: 30,
    completed: 70,
    percentageChange: 10
  },
  {
    label: dayjs('2023-08-1').format('MMMM'),
    inProgress: 35,
    completed: 65,
    percentageChange: 10
  },
  {
    label: dayjs('2023-09-1').format('MMMM'),
    inProgress: 40,
    completed: 60,
    percentageChange: 10
  },
  {
    label: dayjs('2023-10-1').format('MMMM'),
    inProgress: 47,
    completed: 53,
    percentageChange: 10
  },
  {
    label: dayjs('2023-11-1').format('MMMM'),
    inProgress: 52,
    completed: 48,
    percentageChange: 10
  },
  {
    label: dayjs('2023-12-1').format('MMMM'),
    inProgress: 36,
    completed: 64,
    percentageChange: 10
  }
];

const annotation: ChartAnnotation[] = [
  {
    color: 'rgba(51, 187, 178, 0.50)',
    title: 'Tasks completed'
  },
  {
    color: 'rgba(216, 220, 223, 0.5)',
    title: 'Tasks in progress'
  }
];

const config: ChartConfig<StackBarChartData> = {
  annotation: annotation,
  data: data,
  height: 500,
  tooltip: {
    replaceFunction: (replaceString: string, data: StackBarChartData) => {
      const text = replaceString
        .replace(/tooltip_header/, data['label'])
        .replace(/tooltip_body/, data['label'])
        .replace(/tooltip_footer/, data['percentageChange'].toString() + '%');
      return text;
    }
  },
  settings: {
    bindingProperty: {
      bindLabel: 'label',
      bindValue: null
    },
    colorConfig: ['rgba(51, 187, 178, 1)', 'rgba(216, 220, 223, 1)'],
    groups: ['inprogress', 'completed']
  }
};

const Template: Story<StackBarChartComponent> = (
  args: StackBarChartComponent
) => ({
  props: args,
  template: `
    <chart-wrapper chartTitle="Total time saved">
      <stack-bar-chart
        [config]="config"></stack-bar-chart>
    </chart-wrapper>
  `
});
export const StackBarChart = Template.bind({});

// More on args: https://storybook.js.org/docs/angular/writing-stories/args
StackBarChart.args = {
  config: config
};

const TemplateStackBarChartCustomToolTip: Story<StackBarChartComponent> = (
  args: StackBarChartComponent
) => ({
  props: args,
  template: `
    <chart-wrapper chartTitle="Total time saved">
      <stack-bar-chart
        [config]="config"
        [tooltipTemplate]="tooltipTemplate"
        >
        <ng-template #tooltipTemplate>
          <div class="default-tooltip">
            <div class="default-tooltip__header">tooltip_header</div>
            <div class="default-tooltip__body">tooltip_body</div>
            <div class="default-tooltip__footer">tooltip_footer</div>
          </div>
        </ng-template>
      </stack-bar-chart>
    </chart-wrapper>
    `
});
export const StackBarChartCustomToolTip =
  TemplateStackBarChartCustomToolTip.bind({});

StackBarChartCustomToolTip.args = {
  config: config
};
