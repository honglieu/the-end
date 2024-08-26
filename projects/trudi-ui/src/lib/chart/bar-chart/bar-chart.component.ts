import {
  Component,
  ElementRef,
  EmbeddedViewRef,
  HostBinding,
  Input,
  NgZone,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';
import { ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';
import { Subject, takeUntil } from 'rxjs';
import uuid4 from 'uuid4';
import { ChartConfig } from '../interfaces/chart.interface';
import { spacingChartConfig, MIN_LABEL_INTERVAL } from '../interfaces';
import { calculateShowLabels, getMaxZoom } from '../utils';

@Component({
  selector: 'bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements OnInit {
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

  private _defaultTooltipTemplate: string;
  private _tooltipTemplate: string;
  private _embeddedView: EmbeddedViewRef<ElementRef<HTMLElement>>;
  private _defaultEmbeddedView: EmbeddedViewRef<ElementRef<HTMLElement>>;
  public svgNode: d3.Selection<SVGElement, undefined, null, undefined>;
  public tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>;
  private viewportSize: { width: number; height: number };
  public uuid = 'bar-chart-' + uuid4();
  @HostBinding('attr.id')
  get id() {
    return this.uuid;
  }

  @ViewChild('barChart', { static: true }) chartContainer!: ElementRef;

  @ViewChild('defaultTooltipTemplate', { static: true })
  defaultTooltipTemplate: TemplateRef<ElementRef<HTMLElement>>;
  private destroy$ = new Subject();
  constructor(
    public elementRef: ElementRef<HTMLElement>,
    private viewPortRuler: ViewportRuler,
    private ngZone: NgZone,
    private scrollDispatcher: ScrollDispatcher
  ) {}

  ngOnInit() {
    this.createDefaultTooltipTemplate();
    this.svgNode = this.buildChart(this.config);
    this.elementRef.nativeElement
      .querySelector('.chart-content')
      .append(this.svgNode.node());
    this.updateData(this.config, this.svgNode);

    this.viewPortRuler
      .change(50)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.ngZone.runOutsideAngular(() => {
          this.viewportSize = this.viewPortRuler.getViewportSize();
          //Redraw chart when size of viewport change
          this.updateData(this.config, this.svgNode);
        });
      });
    this.handleHideTooltipWhenScrolling();
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

  ngAfterViewInit(): void {
    //Create tooltip wrapper
    this.tooltip = d3
      .select(`#${this.uuid}`)
      .select('.chart-content')
      .append('div')
      .style('position', 'absolute')
      .style('z-index', 1000)
      .style('font-weight', 600);
    this.ngZone.runOutsideAngular(() => {
      this.viewportSize = this.viewPortRuler.getViewportSize();
      this.updateData(this.config, this.svgNode);
    });
  }
  createDefaultTooltipTemplate() {
    this._defaultEmbeddedView = this.defaultTooltipTemplate.createEmbeddedView(
      this.elementRef
    );
    this._defaultTooltipTemplate =
      this._defaultEmbeddedView.rootNodes[0]?.outerHTML;
  }
  updateData(
    config: ChartConfig<unknown>,
    svg: d3.Selection<SVGElement, undefined, null, undefined>
  ) {
    const bindValue = config.settings.bindingProperty.bindValue;
    const bindLabel = config.settings.bindingProperty.bindLabel;
    const bindColor = config.settings.bindingProperty.bindColor;
    const parentWidth = this.elementRef.nativeElement.parentElement.clientWidth;
    const minWidth = this.svgNode.node().parentElement.clientWidth;
    const marginBetweenColumns = 24;
    const widthOfEachColumn =
      this.config.labelWidth * config.data.length +
      marginBetweenColumns * (config.data.length - 1);

    const widthSvg = minWidth;
    const range = [
      spacingChartConfig[config.labelWidth].marginLeft,
      Math.min(
        widthOfEachColumn,
        minWidth - spacingChartConfig[config.labelWidth].marginRight
      )
    ];
    const POINT_DISTANCE = calculateShowLabels(this.viewportSize?.width);

    const maxZoom = getMaxZoom(config.data.length);

    svg.attr('width', widthSvg);
    // Create the horizontal scale and its axis generator.
    const xAsisTemplate = d3
      .scaleBand()
      .domain(config.data.map((value) => value[bindLabel]))
      .range(range)
      .paddingInner(0.24);
    const zoomableXAsis = d3.axisBottom(xAsisTemplate).tickSizeOuter(0);

    // Create the vertical scale.
    const yAsisTemplate = d3
      .scaleLinear()
      .domain([0, d3.max(this.config.data, (d) => d[bindValue])])
      .range([this.config.height - 30, 0]);

    //Control show/hide condition of ticks
    this.applyTickFormat(
      zoomableXAsis,
      xAsisTemplate,
      widthOfEachColumn > minWidth,
      POINT_DISTANCE
    );
    //Remove when redraw chart
    svg.selectAll('g').remove();

    // Sets the range for shifting in the chart
    const zoom = (svg) => {
      const extent: [[number, number], [number, number]] = [
        [0, 0],
        [widthSvg, config.height]
      ];

      // updates the elements and the x-axis accordingly to display the data within the new range after zooming.
      const zoomed = (event) => {
        const action =
          event.type === 'zoom' && event?.sourceEvent?.type === 'mousemove'
            ? 'PAN'
            : 'ZOOM';
        if (action === 'PAN') this.tooltip.style('visibility', 'hidden');

        xAsisTemplate.range(range.map((d) => event.transform.applyX(d)));
        svg
          .selectAll('rect')
          .attr('x', (d) => xAsisTemplate(d[bindLabel]))
          .attr('width', xAsisTemplate.bandwidth());
        svg.selectAll('.x-axis').call(zoomableXAsis);
      };

      svg.call(
        d3
          .zoom()
          .scaleExtent([1, maxZoom])
          .translateExtent(extent)
          .extent(extent)
          .filter((event) => {
            if (event.ctrlKey) {
              event.preventDefault();
            }
            return event.ctrlKey || event.type === 'mousedown';
          })
          .on('zoom', zoomed)
      );
    };

    svg.call(zoom);

    // Append the bars and control active state of a piece of data: change opacity and show tooltip
    svg
      .append('g')
      .selectAll()
      .data(config.data)
      .join('rect')
      .attr('fill', bindColor)
      .on('mouseover', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const tooltipX = this.getTooltipPosition(event, parentWidth);
        this.tooltip.style('visibility', 'visible');
        this.tooltip
          .style('top', event.pageY + 20 + 'px')
          .style('left', tooltipX + 20 + 'px');
        target.style.fill =
          config.settings?.interactionStatesHover?.mouseOver[bindLabel];
      })
      .on('mousemove', (event: MouseEvent, d) => {
        const tooltipX = this.getTooltipPosition(event, parentWidth);
        const target = event.target as HTMLElement;
        target.style.fill =
          config.settings?.interactionStatesHover?.mouseOver[bindLabel];
        this.tooltip
          .style('top', event.pageY + 20 + 'px')
          .style('left', tooltipX + 20 + 'px')
          .html(
            config.tooltip.replaceFunction(
              this._tooltipTemplate || this._defaultTooltipTemplate,
              d
            )
          );
      })
      .on('mouseout', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        target.style.fill =
          config.settings?.interactionStatesHover?.mouseOut[bindLabel];
        this.tooltip.style('visibility', 'hidden');
      })
      .attr('x', (d) => xAsisTemplate(d[bindLabel]))
      .attr('y', (d) => yAsisTemplate(d[bindValue]))
      .attr('height', (d) => yAsisTemplate(0) - yAsisTemplate(d[bindValue]))
      .attr('width', xAsisTemplate.bandwidth());

    //appends the X-axis
    const xAxis = svg
      .append('g')
      .attr('transform', `translate(0,${config.height - 25})`)
      .attr('class', 'x-axis')
      .call(zoomableXAsis);
    xAxis.selectAll('.domain').style('display', 'none');
    xAxis.selectAll('.tick line').style('display', 'none');
    xAxis
      .selectAll('text')
      .style('font-size', '14px')
      .style('color', '#999999')
      .style('font-weight', '600');
  }

  handleHideTooltipWhenScrolling() {
    this.scrollDispatcher
      .ancestorScrolled(this.elementRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.tooltip.style('visibility', 'hidden'));
  }

  getTooltipPosition(event: MouseEvent, clientWidth: number) {
    let tooltipX = event.pageX + 20;
    const tooltipClientWidth = this.tooltip.node().clientWidth;
    if (event.pageX > clientWidth - (tooltipClientWidth + 20))
      tooltipX = event.pageX - tooltipClientWidth - 40;
    return tooltipX;
  }

  applyTickFormat(
    axis: d3.Axis<unknown>,
    scale: d3.ScaleBand<unknown>,
    isOverflow?: boolean,
    pointDistance?: number
  ) {
    const dataLength = scale.domain().length;
    let interval = Math.round(dataLength / pointDistance);
    interval = isOverflow ? Math.max(interval, MIN_LABEL_INTERVAL) : interval;
    const maxIndex = dataLength - 1;
    if (interval > 1)
      return axis.tickFormat((d, index) => {
        if ((index - maxIndex) % interval === 0) {
          return d as string;
        }
        return '';
      });

    return axis;
  }

  buildChart(config: ChartConfig<unknown>) {
    //Create svg element
    const svg_tag = d3.create('svg').attr('height', config.height);
    return svg_tag;
  }
}
