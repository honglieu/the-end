// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { HttpClientModule } from '@angular/common/http';
import { moduleMetadata } from '@storybook/angular';
import type { Meta, Story } from '@storybook/angular/types-6-0';
import { AngularSvgIconModule } from 'angular-svg-icon';
import {
  IconType,
  TrudiIconComponent
} from 'src/app/trudi-ui/views/trudi-icon/trudi-icon.component';
import { TrudiTagComponent } from 'src/app/trudi-ui/views/trudi-tag/trudi-tag.component';

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
  title: 'trudi-ui/Tag',
  component: TrudiTagComponent,
  // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
  argTypes: {
    title: {
      title: 'title',
      type: { name: 'string', required: false },
      defaultValue: '',
      description: 'title',
      control: 'text'
    },
    imgUrl: {
      title: 'imgUrl',
      type: { name: 'string', required: false },
      defaultValue: '',
      description: 'imgUrl',
      control: 'text'
    },
    disabled: {
      name: 'disabled',
      type: 'boolean',
      defaultValue: '',
      description: 'disabled'
    },
    icon: {
      name: 'icon',
      type: { name: 'string', required: false },
      defaultValue: '',
      description: 'use IconType value',
      control: 'select',
      options: Object.keys(IconType)
    }
  },
  decorators: [
    moduleMetadata({
      imports: [AngularSvgIconModule.forRoot(), HttpClientModule],
      providers: [],
      declarations: [TrudiIconComponent]
    })
  ]
} as Meta;

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args
const Template: Story<TrudiTagComponent> = (args: TrudiTagComponent) => ({
  props: args
});

export const Tag = Template.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
Tag.args = {
  title: 'Event type',
  imgUrl:
    'https://attic-trudi-assets.s3.ap-southeast-1.amazonaws.com/pm_avatars/c3d460ff-3f3b-4fa7-baf8-04f282192088/1675845253988/Ung-dung-hinh-nen-dep-Android-%28159%29.jpg.jpeg',
  disabled: false,
  icon: 'filter'
};
