import { ScrollDispatcher } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EmbeddedViewRef,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';
import uuid4 from 'uuid4';
import { Subject, takeUntil } from 'rxjs';
import { ChartConfig } from '../interfaces/chart.interface';
@Component({
  selector: 'donut-chart',
  templateUrl: './donut-chart.component.html',
  styleUrls: ['./donut-chart.component.scss']
})
export class DonutChartComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('defaultTooltipTemplate', { static: true })
  defaultTooltipTemplate: TemplateRef<ElementRef<HTMLElement>>;
  private _defaultTooltipTemplate: string;
  private _tooltipTemplate: string;
  private _embeddedView: EmbeddedViewRef<ElementRef<HTMLElement>>;
  private _defaultEmbeddedView: EmbeddedViewRef<ElementRef<HTMLElement>>;
  @Input() config: ChartConfig<unknown>;
  @Input() chartTitle: string;
  @Input() set tooltipTemplate(template: TemplateRef<ElementRef<HTMLElement>>) {
    if (this._embeddedView) {
      this._embeddedView.detach();
      this._embeddedView.destroy();
    }
    if (!template) {
      this._tooltipTemplate = null;
      return;
    }
    this._embeddedView = template.createEmbeddedView(this.elementRef);
    this._tooltipTemplate = this._embeddedView.rootNodes[0]?.outerHTML;
  }
  public readonly ENTRY_ANIMATION = 1500;
  public uuid = 'donut-chart-' + uuid4();
  public svgNode: d3.Selection<SVGElement, undefined, null, undefined>;
  public tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>;
  private destroy$ = new Subject();
  constructor(
    public elementRef: ElementRef<HTMLElement>,
    private scrollDispatcher: ScrollDispatcher
  ) {}

  ngOnInit(): void {
    this.createDefaultTooltipTemplate();
    this.svgNode = this.buildChart(this.config);
    this.updateData(this.config, this.svgNode);
    this.elementRef.nativeElement
      .querySelector('.chart-content')
      .append(this.svgNode.node());
    this.handleHideTooltipWhenScrolling();
  }

  createDefaultTooltipTemplate() {
    this._defaultEmbeddedView = this.defaultTooltipTemplate.createEmbeddedView(
      this.elementRef
    );
    this._defaultTooltipTemplate =
      this._defaultEmbeddedView.rootNodes[0]?.outerHTML;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      this.svgNode &&
      changes['config'].currentValue &&
      !changes['config'].isFirstChange()
    ) {
      this.updateData(this.config, this.svgNode);
    }
  }

  @HostBinding('attr.id') get id() {
    return this.uuid;
  }

  ngAfterViewInit() {
    //Create tooltip wrapper
    this.tooltip = d3
      .select(`#${this.uuid}`)
      .select('.chart-content')
      .append('div')
      .style('position', 'absolute')
      .style('z-index', 1000)
      .style('font-weight', 600);
  }

  updateData(
    config: ChartConfig<unknown>,
    svg: d3.Selection<SVGElement, undefined, null, undefined>
  ) {
    const bindingProperty = config.settings.bindingProperty;
    const data = config.data;
    const width = config.width;
    const height = Math.min(width, config.height);
    const radius = Math.min(width, height) / 2;

    //Create pie data function return angle for each piece of data
    const pie = d3
      .pie()
      .sort(null)
      .value((d) => d[bindingProperty.bindValue]);

    //Create function return number between start and end angle of a piece
    const angleInterpolation = d3.interpolate(0, 360);

    //Create circular sector with outer and inner radius which mean it will be hollow in middle
    const arc = d3
      .arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    svg
      .select('g')
      .selectAll('path')
      .data(pie(data as { valueOf(): number }[]))
      .join('path')
      .attr('fill', (d) => d.data[bindingProperty.bindColor])
      .attr('opacity', 0.6)
      .transition()
      .duration(this.ENTRY_ANIMATION)
      .attrTween('d', function (context, index) {
        const defaultArcObject = {
          endAngle: context.endAngle,
          innerRadius: radius * 0.5,
          outerRadius: radius,
          startAngle: context.startAngle,
          padAngle: context.padAngle
        } as d3.DefaultArcObject;
        const originalEnd = context.endAngle;
        return (t) => {
          const currentAngle = angleInterpolation(t);
          if (currentAngle < context.startAngle) {
            return '';
          }
          context.endAngle = Math.min(currentAngle, originalEnd);
          return arc(defaultArcObject);
        };
      });

    //Control active state of a piece of data: change opacity and show tooltip
    svg
      .selectAll('path')
      .on('mousemove', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        target.setAttribute('opacity', '1');

        if (this.tooltip) {
          this.tooltip
            .style('visibility', 'visible')
            .style('top', event.pageY + 20 + 'px')
            .style('left', event.pageX + 20 + 'px');
        }
        return;
      })
      .on('mouseenter', (event: MouseEvent, d) => {
        const target = event.target as HTMLElement;
        target.setAttribute('opacity', '1');
        if (this.tooltip) {
          this.tooltip
            .style('top', event.pageY + 20 + 'px')
            .style('left', event.pageX + 20 + 'px')
            .html(
              config.tooltip.replaceFunction(
                this._tooltipTemplate || this._defaultTooltipTemplate,
                d['data']
              )
            );
        }
        return;
      })
      .on('mouseout', (event) => {
        const target = event.target as HTMLElement;
        target.setAttribute('opacity', '0.6');
        if (this.tooltip) {
          this.tooltip.style('visibility', 'hidden');
        }
      });
  }

  handleHideTooltipWhenScrolling() {
    this.scrollDispatcher
      .ancestorScrolled(this.elementRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.tooltip.style('visibility', 'hidden'));
  }

  buildChart(config: ChartConfig<unknown>) {
    const width = config.width;
    const height = Math.min(width, config.height);
    //Create svg element
    const svg = d3
      .create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr('style', 'max-width: 100%; height: auto;');
    svg.append('g');
    return svg;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
