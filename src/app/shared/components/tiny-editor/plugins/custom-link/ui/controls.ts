import { Editor } from 'tinymce';
import * as Actions from '@shared/components/tiny-editor/plugins/custom-link/core/actions';
import * as Utils from '@shared/components/tiny-editor/plugins/custom-link/core/utils';
import { editLinkSVG, navigateLinkSVG, unLinkSVG } from './svg';

const setupMenuItems = (editor: Editor): void => {
  editor.ui.registry.addMenuItem('navigateLink', {
    text: 'Open link',
    icon: 'navigateLinkIcon',
    onAction: Actions.gotoSelectedLink(editor)
  });

  editor.ui.registry.addMenuItem('editLink', {
    icon: 'editLinkIcon',
    text: 'Edit link',
    onAction: Actions.openPopup(editor)
  });

  editor.ui.registry.addMenuItem('unLink', {
    icon: 'unLinkIcon',
    text: 'Remove link',
    onAction: Actions.unLink(editor)
  });
};

const setupContextMenu = (editor: Editor): void => {
  const inLink = 'editLink unLink navigateLink';
  editor.ui.registry.addContextMenu('customLink', {
    update: (element) => {
      const isEditable = editor.dom.isEditable(element);
      if (!isEditable) {
        return '';
      }

      return Utils.isAnchor(element) ? inLink : '';
    }
  });
};

const setUpIcons = (editor: Editor): void => {
  editor.ui.registry.addIcon('editLinkIcon', editLinkSVG);
  editor.ui.registry.addIcon('unLinkIcon', unLinkSVG);
  editor.ui.registry.addIcon('navigateLinkIcon', navigateLinkSVG);
};

export { setUpIcons, setupContextMenu, setupMenuItems };
