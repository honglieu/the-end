import { Editor } from 'tinymce';
import * as Utils from './utils';

const openPopup = (editor: Editor) => (): void => {
  const selectedNode = editor.selection.getNode();
  if (Utils.isAnchor(selectedNode)) {
    const url = selectedNode.getAttribute('href');
    const currentLink = {
      url: url,
      title: selectedNode.innerText
    };
    editor.execCommand('mceEditLink', false, { link: currentLink });
  }
};

const unLink = (editor: Editor) => (): void => {
  editor.execCommand('unlink');
};

const gotoSelectedLink = (editor: Editor) => (): void => {
  const selectedNode = editor.selection.getNode();
  goToLink(selectedNode);
};

const goToLink = (selectedNode: HTMLElement): void => {
  if (Utils.isAnchor(selectedNode)) {
    const url = selectedNode.getAttribute('href');
    window.open(url, '_blank');
  }
};

const setupGotoLinks = (editor: Editor): void => {
  editor.on('click', (e) => {
    goToLink(e.target);
  });
};

export { gotoSelectedLink, openPopup, unLink, setupGotoLinks };
