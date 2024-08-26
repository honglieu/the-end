import { ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';
import {
  Component,
  ElementRef,
  EmbeddedViewRef,
  HostBinding,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';
import { Subject, takeUntil } from 'rxjs';

import uuid4 from 'uuid4';
import {
  ChartConfig,
  spacingChartConfig,
  MIN_LABEL_INTERVAL
} from '../interfaces';
import { getMaxZoom, calculateShowLabels } from '../utils';

@Component({
  selector: 'stack-bar-chart',
  templateUrl: './stack-bar-chart.component.html',
  styleUrls: ['./stack-bar-chart.component.scss']
})
export class StackBarChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('defaultTooltipTemplate', { static: true })
  defaultTooltipTemplate: TemplateRef<ElementRef<HTMLElement>>;
  private _defaultTooltipTemplate: string;
  private _tooltipTemplate: string;
  private _embeddedView: EmbeddedViewRef<ElementRef<HTMLElement>>;
  private _defaultEmbeddedView: EmbeddedViewRef<ElementRef<HTMLElement>>;
  private viewportSize: { width: number; height: number };
  @Input() config: ChartConfig<StackBarChartData>;
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
  public uuid = 'stack-bar-chart-' + uuid4();
  public svgNode: d3.Selection<SVGElement, undefined, null, undefined>;
  public tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>;
  public MARGIN_CONFIG = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 36,
    width: 0
  };
  private destroy$ = new Subject();

  @HostBinding('attr.id') get id() {
    return this.uuid;
  }

  constructor(
    public elementRef: ElementRef<HTMLElement>,
    private viewPortRuler: ViewportRuler,
    private ngZone: NgZone,
    private scrollDispatcher: ScrollDispatcher
  ) {}

  ngOnInit(): void {
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

  createDefaultTooltipTemplate() {
    this._defaultEmbeddedView = this.defaultTooltipTemplate.createEmbeddedView(
      this.elementRef
    );
    this._defaultTooltipTemplate =
      this._defaultEmbeddedView.rootNodes[0]?.outerHTML;
  }

  updateData(
    config: ChartConfig<StackBarChartData>,
    svg: d3.Selection<SVGElement, undefined, null, undefined>
  ) {
    const height = config.height;
    const data = config.data;
    const dataGroups = config.settings.groups;
    const bindingProperty = config.settings.bindingProperty;
    const minWidth = this.svgNode.node()?.parentElement?.clientWidth;
    const marginBetweenColumns = 24;
    const widthOfEachColumn =
      config.labelWidth * data?.length +
      marginBetweenColumns * (data?.length - 1);
    const maxZoom = getMaxZoom(data?.length);
    const POINT_DISTANCE = calculateShowLabels(this.viewportSize?.width);

    const widthSvg = minWidth;
    const parentWidth = this.elementRef.nativeElement.parentElement.clientWidth;
    svg.attr('width', widthSvg);

    //Remove when redraw chart
    svg.selectAll('g').remove();
    //Create xAxis scale band, assign padding between each column
    const range = [
      spacingChartConfig[config.labelWidth].marginLeft,
      Math.min(
        widthOfEachColumn,
        minWidth - spacingChartConfig[config.labelWidth].marginRight
      )
    ];
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d[bindingProperty.bindLabel]) as Iterable<string>)
      .range(range)
      .align(0.1)
      .paddingInner(0.27)
      .paddingOuter(0);

    //Create yAxis scale with range from 0 to 100 percent and set height limit
    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height, this.MARGIN_CONFIG.bottom]);
    //Create xAxis generator and tickFormat, set tick's size to 0
    const xAxis = d3
      .axisBottom(xScale)
      .tickSizeOuter(0)
      .tickSize(0)
      .tickPadding(10);

    //Control show/hide condition of ticks
    this.applyTickFormat(
      xAxis,
      xScale,
      widthOfEachColumn > minWidth,
      POINT_DISTANCE
    );

    //Create yAxis generator
    const yAxis = d3.axisLeft(yScale);

    //Create stack generator to map data base on chart config for group of keys in one data record
    const stack = d3.stack();
    const chartData = stack.keys(dataGroups)(
      data as Iterable<{ [key: string]: number }>
    );

    //Append g element and call xAxis generator to generate xAxis vector elements
    const xAxisElement = svg
      .append('g')
      .attr('class', 'x-axis')
      .attr(
        'transform',
        `translate(0, ${config.height - this.MARGIN_CONFIG.bottom})`
      )
      .call(xAxis);
    //Hide xAxis domain line
    xAxisElement.selectAll('.domain').style('display', 'none');
    xAxisElement
      .selectAll('text')
      .style('font-size', '14px')
      .style('color', '#999999')
      .style('font-weight', '600');
    //Append g element and call yAxis generator to generate yAxis vector elements
    svg.append('g').call(yAxis).style('display', 'none');

    const zoom = (svg) => {
      const extent: [[number, number], [number, number]] = [
        [0, 0],
        [widthSvg, height]
      ];
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
      // updates the elements and the x-axis accordingly to display the data within the new range after zooming.
      function zoomed(event) {
        xScale.range(range.map((d) => event.transform.applyX(d)));
        svg
          .selectAll('rect')
          .attr('x', (d) => xScale(d.data[bindingProperty.bindLabel]))
          .attr('width', xScale.bandwidth());
        svg.selectAll('.x-axis').call(xAxis);
      }
    };
    svg.call(zoom);

    //Generate area for each data group in stack
    const groups = svg
      .append('g')
      .attr('transform', `translate(0, ${-this.MARGIN_CONFIG.bottom})`)
      .selectAll('g')
      .data(chartData)
      .join('g')
      .attr('key', function (d) {
        return d.key;
      })
      .style('fill', (d, i) => {
        return config.settings.colorConfig[i];
      });

    //Generate rectangles for each data group and set width and height
    groups
      .selectAll('rect')
      .data((d) => d)
      .join('rect')
      .attr('x', (d) => xScale(d.data[bindingProperty.bindLabel]?.toString()))
      .attr('y', (d) => yScale(d[1]))
      .attr('height', (d) => {
        if (!isNaN(d[1])) {
          return yScale(d[0]) - yScale(d[1]);
        } else {
          return 0;
        }
      })
      .attr('width', xScale.bandwidth())
      .on('mousedown', () => {
        this.tooltip.style('visibility', 'hidden');
      })
      .on('mouseover', (event: MouseEvent) => {
        const tooltipX = this.getTooltipPosition(event, parentWidth);
        const target = event.target as HTMLElement;
        const key = target.parentElement.getAttribute('key');
        target.style.fill =
          config.settings.interactionStatesHover.mouseOver[key];
        this.tooltip.style('visibility', 'visible');
        this.tooltip
          .style('top', event.pageY + 20 + 'px')
          .style('left', tooltipX + 'px');
      })
      .on('mousemove', (event: MouseEvent, d) => {
        const target = event.target as HTMLElement;
        const key = target.parentElement.getAttribute('key');
        const tooltipX = this.getTooltipPosition(event, parentWidth);
        this.tooltip
          .style('top', event.pageY + 20 + 'px')
          .style('left', tooltipX + 20 + 'px')
          .html(
            config.tooltip.replaceFunction(
              this._tooltipTemplate || this._defaultTooltipTemplate,
              d.data as StackBarChartData,
              key
            )
          );
      })
      .on('mouseout', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const key = target.parentElement.getAttribute('key');
        target.style.fill =
          config.settings.interactionStatesHover.mouseOut[key];
        this.tooltip.style('visibility', 'hidden');
      });
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
    this.ngZone.runOutsideAngular(() => {
      this.viewportSize = this.viewPortRuler.getViewportSize();
      this.updateData(this.config, this.svgNode);
    });
  }

  buildChart(config: ChartConfig<unknown>) {
    const height = config.height;
    const svg = d3.create('svg').attr('height', height);

    return svg;
  }

  //Show label when index of column in special case
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

  getTooltipPosition(event: MouseEvent, clientWidth: number) {
    let tooltipX = event.pageX + 20;
    const tooltipClientWidth = this.tooltip.node().clientWidth;
    if (event.pageX > clientWidth - (tooltipClientWidth + 20))
      tooltipX = event.pageX - tooltipClientWidth - 40;
    return tooltipX;
  }

  handleHideTooltipWhenScrolling() {
    this.scrollDispatcher
      .ancestorScrolled(this.elementRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.tooltip.style('visibility', 'hidden'));
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

export interface StackBarChartData {
  //Label for each column
  label?: string;
  timeCollection?: string;
  inProgress?: number;
  completed?: number;
  percentageChange?: number;
  isUpTrendInprogress?: string;
  percentInProgress?: number;
  isUpTrendCompleted?: string;
}
