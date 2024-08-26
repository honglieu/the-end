import { Editor } from 'tinymce';
import { IActiveLink } from './types';
import { isAnchor } from '@shared/components/tiny-editor/plugins/custom-link/core/utils';

const register = (editor: Editor): void => {
  editor.addCommand('mceEditLink', (_ui, value?: IActiveLink) => {});
  editor.addCommand('mceUpdateLink', (_ui, value: IActiveLink) => {
    const selectedNode = editor.selection.getNode();
    if (isAnchor(selectedNode)) {
      selectedNode.setAttribute('href', value.url);
      selectedNode.setAttribute('data-mce-href', value.url);
      selectedNode.innerText = value.title;
    }
  });
};

export { register };
