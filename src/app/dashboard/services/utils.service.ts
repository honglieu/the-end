import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor(private rendererFactory: RendererFactory2) {}

  openFireworksByQuerySelector(
    selector: string,
    time: number = 1000,
    callbackFn: () => void = () => {},
    styles = {
      width: '142px',
      height: '120px',
      src: 'assets/images/firework-2.gif'
    }
  ) {
    const element = document.querySelector(selector);
    if (!element) return null;

    let renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);
    const div = renderer.createElement('div');
    renderer.addClass(div, 'firework');
    renderer.setStyle(div, 'position', 'fixed');
    renderer.setStyle(div, 'z-index', '99999999');

    const rect = element.getBoundingClientRect();

    const targetWidth = rect.width;
    const targetHeight = rect.height;
    const fireworkWidth = parseInt(styles.width, 10);
    const fireworkHeight = parseInt(styles.height, 10);
    const topPosition =
      rect.top + window.scrollY + (targetHeight - fireworkHeight) / 2 + 'px';
    const leftPosition =
      rect.left + window.scrollX + (targetWidth - fireworkWidth) / 2 + 'px';

    renderer.setStyle(div, 'top', topPosition);
    renderer.setStyle(div, 'left', leftPosition);

    const img = renderer.createElement('img');
    renderer.setAttribute(img, 'src', styles.src);
    renderer.setStyle(img, 'width', styles.width);
    renderer.setStyle(img, 'height', styles.height);

    renderer.appendChild(div, img);
    renderer.appendChild(document.body, div);

    setTimeout(() => {
      renderer.removeChild(document.body, div);
    }, time);

    return setTimeout(() => {
      callbackFn();
    }, time);
  }

  openFireworksByMouseEvent(
    event: MouseEvent,
    time: number = 1000,
    callbackFn: () => void = () => {},
    styles = { width: 142, height: 120, src: 'assets/images/firework-2.gif' }
  ) {
    if (!event) return null;

    let renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);
    const div = renderer.createElement('div');
    renderer.addClass(div, 'firework');
    renderer.setStyle(div, 'position', 'fixed');
    renderer.setStyle(div, 'z-index', '99999999');

    const topPosition = `${event.clientY - styles.height / 2}px`;
    const leftPosition = `${event.clientX - styles.width / 2}px`;
    renderer.setStyle(div, 'top', topPosition);
    renderer.setStyle(div, 'left', leftPosition);

    const img = renderer.createElement('img');
    renderer.setAttribute(img, 'src', styles.src);
    renderer.setStyle(img, 'width', styles.width + 'px');
    renderer.setStyle(img, 'height', styles.height + 'px');

    renderer.appendChild(div, img);
    renderer.appendChild(document.body, div);

    setTimeout(() => {
      renderer.removeChild(document.body, div);
    }, time);

    return setTimeout(() => {
      callbackFn();
    }, time);
  }
}
