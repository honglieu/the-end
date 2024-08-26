// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { DonutChartComponent } from 'src/app/trudi-ui/chart/donut-chart/donut-chart.component';
import type {
  ChartAnnotation,
  ChartConfig
} from 'src/app/trudi-ui/chart/interfaces/chart.interface';
import { TrudiUiModule } from 'src/app/trudi-ui/trudi-ui.module';

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: 'trudi-ui/Chart/DonutChart',
  component: DonutChartComponent,
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

enum ETimeSavedAnnotation {
  AI_GENERATED_REPLIES = 'AI-generated replies',
  TRANSCRIBING_PHONE_CALLS = 'Transcribing phone calls',
  TRANSLATING_ENQUIRIES = 'Translating enquiries in another language',
  VOICEMAIL_MESSAGES = 'Voicemail messages',
  AI_ASSISTANT_APP_SESSIONS = 'AI-assistant app sessions'
}

const TimeSavedTypeSetting = {
  [ETimeSavedAnnotation.AI_GENERATED_REPLIES]: {
    title: 'AI-generated replies',
    color: 'rgba(254, 223, 115, 1)'
  },
  [ETimeSavedAnnotation.TRANSCRIBING_PHONE_CALLS]: {
    title: 'Transcribing phone calls',
    color: 'rgba(255, 143, 81, 1)'
  },
  [ETimeSavedAnnotation.TRANSLATING_ENQUIRIES]: {
    title: 'Translating enquiries in another language',
    color: 'rgba(241, 86, 86, 1)'
  },
  [ETimeSavedAnnotation.VOICEMAIL_MESSAGES]: {
    title: 'Taking a voicemail message',
    color: 'rgba(71, 110, 250, 1)'
  },
  [ETimeSavedAnnotation.AI_ASSISTANT_APP_SESSIONS]: {
    title: 'Chatting to AI assistant via the app',
    color: 'rgba(183, 233, 77, 1)'
  }
};

const mockData: TimeSavedData[] = [
  {
    color:
      TimeSavedTypeSetting[ETimeSavedAnnotation.AI_GENERATED_REPLIES].color,
    name: '1',
    type: ETimeSavedAnnotation.AI_GENERATED_REPLIES,
    hour: 19,
    percent: 10,
    count: 1100
  },
  {
    color:
      TimeSavedTypeSetting[ETimeSavedAnnotation.TRANSCRIBING_PHONE_CALLS].color,
    name: '3',
    type: ETimeSavedAnnotation.TRANSCRIBING_PHONE_CALLS,
    hour: 4,
    percent: 30,
    count: 100
  },
  {
    color:
      TimeSavedTypeSetting[ETimeSavedAnnotation.TRANSLATING_ENQUIRIES].color,
    name: '3',
    type: ETimeSavedAnnotation.TRANSLATING_ENQUIRIES,
    hour: 4,
    percent: 10,
    count: 69
  },
  {
    color: TimeSavedTypeSetting[ETimeSavedAnnotation.VOICEMAIL_MESSAGES].color,
    name: '3',
    type: ETimeSavedAnnotation.VOICEMAIL_MESSAGES,
    hour: 4,
    percent: 30,
    count: 190
  },
  {
    color:
      TimeSavedTypeSetting[ETimeSavedAnnotation.AI_ASSISTANT_APP_SESSIONS]
        .color,
    name: '2',
    type: ETimeSavedAnnotation.AI_ASSISTANT_APP_SESSIONS,
    hour: 2,
    percent: 25,
    count: 980
  }
];

const mockAnno: ChartAnnotation[] = [
  {
    color: '#FEDF73',
    title: 'AI-generated replies',
    badge: null,
    description: 'Saves PM average of 8 mins per email'
  },
  {
    color: '#FF8F51',
    title: 'Transcribing phone calls',
    badge: {
      variant: 'warning',
      icon: 'crownGold',
      text: 'Pro',
      bgColor: '#FFBF41'
    },
    description: 'Saves PM average of 8 mins per email'
  },
  {
    color: '#F15656',
    title: 'Translating enquiries in another language ',
    badge: {
      variant: 'warning',
      icon: 'crownGold',
      text: 'Pro',
      bgColor: '#FFBF41'
    },
    description: 'Save a PM average of 3 mins per translation	'
  },
  {
    color: '#476EFA',
    title: 'Taking a voicemail message',
    badge: {
      variant: 'primary',
      icon: 'star',
      text: 'Elite',
      bgColor: '#38DBD0'
    },
    description: 'Save a PM average 8minutes per voicemail session	'
  },
  {
    color: '#FEDF73',
    title: 'Chatting to AI assistant via the app',
    badge: {
      variant: 'primary',
      icon: 'star',
      text: 'Elite',
      bgColor: '#38DBD0'
    },
    description: 'Save a PM average of 8 mins per app session'
  }
];

const htmlContent =
  '<div style="display:flex; flex-direction: column; gap: 1.98px; background: white; padding: 8px; border-radius: 8px;border: 0.991px solid var(--border-neutral-light, #F2F5F7);box-shadow: 0px 13.86849px 35.66184px 0px rgba(0, 0, 0, 0.13), 0px 1.98121px 11.88728px 0px rgba(0, 0, 0, 0.08);"><div>tooltip_value</div><div>tooltip_header</div><div style="color: var(--fg-success);">tooltip_footer hours</div></div>';

const mockConfig: ChartConfig<TimeSavedData> = {
  data: mockData,
  annotation: mockAnno,
  height: 380,
  width: 380,
  settings: {
    bindingProperty: {
      bindColor: 'color',
      bindValue: 'percent'
    }
  },
  tooltip: {
    replaceFunction: (template: string, data: TimeSavedData) => {
      const newTemp = template
        .replace(/tooltip_value/, `${data.percent}%`)
        .replace(/tooltip_header/, `${data.count} ${data.type}`)
        .replace(/tooltip_footer/, `Saving ${data.hour}`);
      return newTemp;
    }
  }
};

interface TimeSavedData {
  color: string;
  type: ETimeSavedAnnotation;
  hour: number;
  percent: number;
  count: number;
  [key: string]: string | number | boolean;
}

const Template: Story<DonutChartComponent> = (args: DonutChartComponent) => ({
  props: args,
  template: `
  <chart-wrapper chartTitle="Total time saved">
    <donut-chart
    [config]="config"></donut-chart>
  </chart-wrapper>
  `
});
export const DonutChart = Template.bind({});

// More on args: https://storybook.js.org/docs/angular/writing-stories/args
DonutChart.args = {
  config: mockConfig
};
