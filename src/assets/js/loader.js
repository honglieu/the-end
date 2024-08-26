// TODO: remove this file and use the loader by angular component
var loader = (function () {
  const loaderElementId = '__loading__';
  const resetLoader = () =>
    document
      .querySelectorAll(`#${loaderElementId}`)
      .forEach((element) => element.remove());

  HTMLElement.prototype.css = function (styles) {
    for (const property in styles) {
      this.style[property] = styles[property];
    }
    return this;
  };

  return {
    ajaxindicatorstart: function (message = '') {
      resetLoader();
      const loadingElement = document.createElement('div');
      loadingElement.setAttribute('id', loaderElementId);
      loadingElement.innerHTML = `
        <div>
          <img style="margin-bottom: 12px" src='assets/images/ajax-loader.gif'>
          <div>${message}</div>
        </div>"
        <div class='bg'></div>`;

      document.querySelector('body').appendChild(loadingElement);

      document.querySelector(`#${loaderElementId}`).css({
        width: '100%',
        height: '100%',
        position: 'fixed',
        'z-index': '10000000',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        margin: 'auto'
      });

      document.querySelector(`#${loaderElementId} .bg`).css({
        background: '#000000',
        opacity: '0.7',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: '0'
      });

      document.querySelector(`#${loaderElementId}>div`).css({
        width: '250px',
        height: '75px',
        'text-align': 'center',
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        margin: 'auto',
        'font-size': '16px',
        'z-index': '10',
        color: '#ffffff'
      });

      document.querySelector(`#${loaderElementId} .bg`).css({
        height: '100%'
      });
      document.querySelector('body').css({
        cursor: 'wait'
      });
    },
    ajaxindicatorstop: function () {
      resetLoader();
      document.querySelector('body').css({
        cursor: 'default'
      });
    }
  };
})(loader || {});
