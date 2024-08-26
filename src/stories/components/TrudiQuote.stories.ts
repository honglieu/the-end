import { HttpClientModule } from '@angular/common/http';
import { moduleMetadata } from '@storybook/angular';
import type { Story, Meta } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { TrudiIconComponent } from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';
import { TrudiQuoteComponent } from 'src/app/trudi-ui/views/trudi-quote/trudi-quote.component';

enum EColor {
  landlord = 'landlord',
  supplier = 'supplier',
  tenant = 'tenant',
  agent = 'agent',
  other = 'other',
  unidentified = 'unidentified',
  external = 'external'
}
export default {
  title: 'trudi-ui/TrudiQuote',
  component: TrudiQuoteComponent,
  argTypes: {
    color: {
      name: 'color',
      type: { name: 'string', required: false },
      defaultValue: '',
      description: '',
      control: 'select',
      options: Object.keys(EColor)
    },
    content: {
      name: 'content',
      type: { name: 'string', required: false },
      defaultValue: '',
      description: 'content',
      control: 'object'
    },
    isRead: {
      name: 'isRead',
      type: 'boolean',
      defaultValue: '',
      description: 'isRead'
    }
  },
  decorators: [
    moduleMetadata({
      imports: [
        AngularSvgIconModule.forRoot(),
        HttpClientModule,
        NzDropDownModule
      ],
      providers: [],
      declarations: [TrudiIconComponent]
    })
  ]
} as Meta;

const Template: Story<TrudiQuoteComponent> = (args: TrudiQuoteComponent) => ({
  props: args,
  template: `
    <div style="padding: '10px 20px'">
      <trudi-quote
        [color]="color"
        [isRead]="isRead"
        [content]="content"
      ></trudi-quote>
    </div>
  `
});

export const TrudiQuote = Template.bind({});
TrudiQuote.args = {
  color: EColor.tenant,
  isRead: false,
  content: {
    senderName: 'Kenny Bunting',
    message:
      'The owner has given us instructions to issue you a Notice to Leave for {leave notice reason} - please read the attached document.',
    dateTime: '9:24 am'
  }
};
