import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'circle-loading-indicator',
  template: `
    <ng-container *ngIf="btnLoadingStyle; else normal">
      <div class="btn-submitting"></div>
    </ng-container>
    <ng-template #normal>
      <div
        class="gradient conic"
        [style.background]="
          'conic-gradient(white -180deg 5%, ' + circleBackgroundColor + '98% )'
        ">
        <div
          class="ralax"
          [ngStyle]="{
            'margin-left': fixBreak ? '0' : '50%',
            'background-color': innerBackgroundColor
          }"></div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .btn-submitting {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border-style: solid;
        border-width: 1px;
        border-top-color: transparent;
        border-bottom-color: transparent;
        border-left-color: white;
        border-right-color: white;
        animation: rotate 1.2s linear infinite;
      }
      .gradient {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        position: relative;
        margin: 0 auto;
        .ralax {
          width: 35px;
          height: 35px;
          position: absolute;
          background: white;
          border-radius: 50%;
          transform: translate(-50%, 22.5%);
        }
      }
      .conic {
        animation: rotate 1.2s linear infinite;
        background: conic-gradient(white -180deg 5%, var(--brand-500) 98%);
        // background: conic-gradient( rgba(255,0,0,0.1) 0deg 5%,rgba(255,0,0,0.5), rgba(255,0,0,0.7),red );
      }

      @keyframes rotate {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes opac {
        0% {
          opacity: 0.5;
        }
        40% {
          opacity: 0.05;
        }
        90% {
          opacity: 0.1;
        }
        100% {
          opacity: 0.5;
          transform: rotate(-360deg);
        }
      }
      .reflect {
        opacity: 0;
        background: conic-gradient(rgba(255, 0, 0, 0.5) 120deg 20%, black 0%);
        transition: opacity 1.5s ease;
        transition-delay: 1s;
        animation: opac 1.2s linear infinite;
        animation-delay: 0.5s;
      }
    `
  ]
})
export class CircleLoadingIndicatorComponent implements OnInit {
  @Input() btnLoadingStyle = false;
  @Input() fixBreak = false;
  @Input() innerBackgroundColor = 'white';
  @Input() circleBackgroundColor = 'var(--brand-500)';
  constructor() {}

  ngOnInit(): void {}
}
