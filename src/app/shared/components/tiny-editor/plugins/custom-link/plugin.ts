import tinymce from 'tinymce';

import * as Options from './api/options';
import * as Controls from './ui/controls';
import * as Commands from './api/commands';
import * as Actions from './core/actions';

export default (): void => {
  tinymce.PluginManager.add('customLink', (editor) => {
    Options.register(editor);
    Controls.setupMenuItems(editor);
    Controls.setupContextMenu(editor);
    Controls.setUpIcons(editor);
    Commands.register(editor);
    Actions.setupGotoLinks(editor);
  });
};
