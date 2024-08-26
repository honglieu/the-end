import tinymce from 'tinymce';

import * as Options from './api/options';
import * as Keys from './core/keys';

export default (): void => {
  tinymce.PluginManager.add('shortlink', (editor) => {
    Options.register(editor);
    Keys.setup(editor);
  });
};
