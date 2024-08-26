import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  TemplateRef,
  EmbeddedViewRef,
  NgZone
} from '@angular/core';
import * as d3 from 'd3';
import { Selection, ScaleTime, ScaleLinear } from 'd3';
import {
  differenceInCalendarQuarters,
  differenceInCalendarYears,
  differenceInDays,
  differenceInMonths,
  differenceInWeeks
} from 'date-fns';
import { ScrollDispatcher, ViewportRuler } from '@angular/cdk/scrolling';
import { Subject, takeUntil } from 'rxjs';
import dayjs from 'dayjs';
import {
  ChartConfig,
  MAX_DATA_LENGTH_FOR_POINT_DISTANCE,
  EPeriodType
} from '../interfaces';

@Component({
  selector: 'trudi-line-chart',
  templateUrl: './trudi-line-chart.component.html',
  styleUrls: ['./trudi-line-chart.component.scss']
})
export class TrudiLineChartComponent implements OnInit, OnChanges {
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
  private svgNode: Selection<SVGElement, undefined, null, undefined>;
  private focusPoint: Selection<SVGGElement, undefined, null, undefined>;
  private tooltip: Selection<HTMLDivElement, unknown, HTMLElement, undefined>;
  private scatter: Selection<SVGGElement, unknown, HTMLElement, undefined>;
  private xScaleZoom: ScaleTime<number, number> | undefined;
  private xScale: ScaleTime<number, number, undefined>;
  private yScale: ScaleLinear<number, number, undefined>;
  private bindLabel: string;
  private bindValue: string;
  private marginChartToAxis = {
    left: 35,
    top: 20,
    bottom: 35,
    right: 35
  };
  public width: number = 0;
  private readonly ENTRY_ANIMATION = 1500;
  private destroy$ = new Subject();
  // distance between time (label of X-axis) points
  private distancePoint: number = 1;
  constructor(
    public elementRef: ElementRef<HTMLElement>,
    private viewPortRuler: ViewportRuler,
    private ngZone: NgZone,
    private scrollDispatcher: ScrollDispatcher
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      this.svgNode &&
      changes['config'].currentValue &&
      !changes['config'].isFirstChange()
    ) {
      this.clearChartData();
      this.setWidthChart();
      this.updateData(this.config, this.svgNode);
      this.handleHover();
    }
  }

  ngOnInit(): void {
    this.setWidthChart();
    this.createDefaultTooltipTemplate();
    this.svgNode = this.buildChart(this.config);
    this.elementRef.nativeElement
      .querySelector('.line-chart-wrapper')
      .append(this.svgNode.node());
    this.updateData(this.config, this.svgNode);
    this.handleHover();
    this.viewPortRuler
      .change(0)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.ngZone.runOutsideAngular(() => {
          this.clearChartData();
          this.setWidthChart();
          this.updateData(this.config, this.svgNode);
          this.handleHover();
        });
      });
    this.handleHideTooltipWhenScrolling();
  }

  setWidthChart() {
    const tempDistancePoint = Math.round(
      this.config.data.length / MAX_DATA_LENGTH_FOR_POINT_DISTANCE.DESKTOP
    );
    if (!!this.config.data && tempDistancePoint > 1) {
      this.distancePoint = tempDistancePoint;
    }
    this.bindValue = this.config.settings.bindingProperty.bindValue;
    this.bindLabel = this.config.settings.bindingProperty.bindLabel;
    const startDate = this.config.data[0][this.bindLabel];
    const endDate =
      this.config.data[this.config.data.length - 1][this.bindLabel];
    let lengthOfDataXAxis = 0;
    let updateWidth = 0;

    switch (this.config.periodType) {
      case EPeriodType.MONTH: {
        lengthOfDataXAxis = differenceInMonths(endDate, startDate) + 1;
        updateWidth = lengthOfDataXAxis * 100; // 100 ~ label'width
        break;
      }
      case EPeriodType.YEAR: {
        lengthOfDataXAxis = differenceInCalendarYears(endDate, startDate) + 1;
        updateWidth = lengthOfDataXAxis * 70;
        break;
      }
      case EPeriodType.QUARTER: {
        lengthOfDataXAxis =
          differenceInCalendarQuarters(endDate, startDate) + 1;
        updateWidth = lengthOfDataXAxis * 100;
        break;
      }
      case EPeriodType.WEEK: {
        lengthOfDataXAxis = differenceInWeeks(endDate, startDate) + 1;
        updateWidth = lengthOfDataXAxis * 170;
        this.marginChartToAxis.left = this.marginChartToAxis.left + 30;
        this.marginChartToAxis.right = this.marginChartToAxis.right + 30;
        break;
      }
      case EPeriodType.DAY: {
        lengthOfDataXAxis = differenceInDays(endDate, startDate) + 1;
        updateWidth = lengthOfDataXAxis * 120;
        break;
      }
    }
    this.width = this.elementRef.nativeElement.parentElement.clientWidth;
    updateWidth = updateWidth / this.distancePoint;
    if (this.width < updateWidth) {
      this.width = updateWidth;
    }
  }

  buildChart(config: ChartConfig<unknown>) {
    const width = this.width;
    const height = config.height;
    // Create the SVG container.
    const svg = d3
      .create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');
    //Create tooltip wrapper
    this.tooltip = d3
      .select('.line-chart-wrapper')
      .append('div')
      .style('position', 'absolute')
      .style('z-index', 1000);
    return svg;
  }

  updateData(config, svgNode) {
    const width = this.width;
    const height = config.height;
    const marginTop = this.marginChartToAxis.top;
    const marginRight = this.marginChartToAxis.right;
    const marginBottom = this.marginChartToAxis.bottom;
    const marginLeft = this.marginChartToAxis.left;
    const chartData = config.data;
    this.bindValue = config.settings.bindingProperty.bindValue;
    this.bindLabel = config.settings.bindingProperty.bindLabel;

    if (this.svgNode) {
      this.svgNode
        .attr('width', this.width)
        .attr('viewBox', [0, 0, this.width, this.config.height])
        .attr('style', 'max-width: 100%; height: auto;');
    }
    // Declare the x (horizontal position) scale.
    this.xScale = d3
      .scaleTime()
      .domain(d3.extent(this.config.data, (d) => d[this.bindLabel]))
      .range([marginLeft, width - marginRight]);

    // Declare the y (vertical position) scale.
    const maxValue = d3.max(this.config.data, (d) => d[this.bindValue]);
    const maxY = maxValue === 0 ? 1 : maxValue;
    this.yScale = d3
      .scaleLinear()
      .domain([0, maxY])
      .range([height - marginBottom, marginTop]);

    // Declare the line generator.
    const line = d3
      .line()
      .x((d) => this.xScale(d[this.bindLabel]))
      .y((d) => this.yScale(d[this.bindValue]));

    // Add the x-axis.
    const xAxisData = this.configDisplayXAxis(this.xScale);
    const xAxis = svgNode
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - 25})`)
      .call(xAxisData);

    // Data area
    const areaDataScale = d3
      .area()
      .x((d) => this.xScale(d[this.bindLabel]))
      .y0(this.yScale(0))
      .y1((d) => this.yScale(d[this.bindValue]));

    const areaData = svgNode
      .append('path')
      .attr('class', 'area')
      .datum(chartData)
      .attr('fill', this.config.settings.areaDataColor)
      .attr('d', areaDataScale);

    //Create line chart
    const lineData = svgNode
      .append('path')
      .attr('class', 'line-data')
      .attr('fill', 'none')
      .attr('stroke', this.config.settings.lineColor)
      .attr('stroke-width', 2)
      .attr('d', line(chartData));

    // Add room function
    const zoom = this.handleZoom(xAxis, areaData, lineData, chartData);
    svgNode.call(zoom).transition().duration(this.ENTRY_ANIMATION);
  }

  handleZoom(xAxis, areaData, lineData, chartData) {
    const extent: [[number, number], [number, number]] = [
      [this.marginChartToAxis.left, this.marginChartToAxis.top],
      [
        this.width - this.marginChartToAxis.right,
        this.config.height - this.marginChartToAxis.top
      ]
    ];
    const zooming = d3
      .zoom()
      .scaleExtent([1, 32])
      .translateExtent(extent)
      .filter((event) => {
        if (event.ctrlKey) {
          event.preventDefault();
        }
        return event.ctrlKey || event.type === 'mousedown';
      })
      .extent(extent)
      .on('zoom', (event) => {
        this.updateChartZoomed(event, xAxis, areaData, lineData, chartData);
      });

    return zooming;
  }

  updateChartZoomed(event, xAxis, areaData, lineData, chartData) {
    // Update chart
    const xs = event.transform.rescaleX(this.xScale);
    this.xScaleZoom = xs;
    xAxis.call(this.configDisplayXAxis(xs));

    const updatedAreaData = d3
      .area()
      .x((d) => xs(d[this.bindLabel]))
      .y0(this.yScale(0))
      .y1((d) => this.yScale(d[this.bindValue]));

    const updatedLineData = d3
      .line()
      .x((d) => xs(d[this.bindLabel]))
      .y((d) => this.yScale(d[this.bindValue]));

    areaData.attr('d', updatedAreaData);
    lineData.attr('d', updatedLineData(chartData));

    this.scatter
      .selectAll('.data-circle')
      .attr('cx', (d) => xs(d[this.bindLabel]))
      .attr('cy', (d) => this.yScale(d[this.bindValue]));
    // Update function hover chart
    this.handleMouseOut();
  }

  handleHover(): void {
    const defaultShowPointDataByConfig = this.config.data.length === 1 ? 1 : 0;
    this.focusPoint = this.svgNode
      .append('g')
      .attr('class', 'focus')
      .style('visibility', 'hidden');

    this.focusPoint
      .append('line')
      .attr('class', 'x-hover-line hover-line')
      .attr('y1', 0)
      .attr('y2', this.config.height);

    // hover in the whole chart, half-part between 2 points
    this.svgNode
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', this.width)
      .attr('height', this.config.height)
      .on('mouseover', () => this.focusPoint.style('display', null))
      .on('mouseout', () => {
        this.handleMouseOut();
      })
      .on('mousemove', (event) => {
        const currentX = this.xScaleZoom ?? this.xScale;
        const bisectDate = d3.bisector((d) => d[this.bindLabel]).center;
        const x0 = currentX.invert(d3.pointer(event)[0]);
        const index = bisectDate(this.config.data, x0, 0);
        const currentPoint = this.config.data[index];
        this.handleMouseMove(currentPoint, currentX, event);
      });

    // hover in exact circle point
    this.focusPoint.append('circle').attr('r', 7.5);
    this.scatter = this.svgNode.append('g').attr('clip-path', 'url(#clip)');
    this.scatter
      .selectAll('.data-circle')
      .data(this.config.data)
      .enter()
      .append('circle')
      .attr('class', 'data-circle')
      .attr('cx', (d) => this.xScale(d[this.bindLabel]))
      .attr('cy', (d) => this.yScale(d[this.bindValue]))
      .attr('r', 8)
      .style('opacity', defaultShowPointDataByConfig)
      .on('mouseout', () => {
        this.handleMouseOut();
        this.scatter
          .selectAll('.data-circle')
          .style('opacity', defaultShowPointDataByConfig);
      })
      .on('mouseover', (event, data) => {
        this.scatter.selectAll('.data-circle').style('opacity', 0);
        const currentX = this.xScaleZoom ?? this.xScale;
        this.handleMouseMove(data, currentX, event);
      });
  }

  getTooltipPosition(event: MouseEvent, clientWidth: number) {
    let tooltipX = event.pageX + 20;
    const tooltipClientWidth = this.tooltip.node()?.clientWidth ?? 200;
    if (event.pageX > clientWidth - (tooltipClientWidth + 20))
      tooltipX = event.pageX - tooltipClientWidth - 40;
    return tooltipX;
  }

  handleMouseOut() {
    this.focusPoint.style('visibility', 'hidden');
    if (this.tooltip) {
      this.tooltip.style('visibility', 'hidden');
    }
  }

  handleMouseMove(currentPoint, currentX, event) {
    const parentWidth = this.elementRef.nativeElement.parentElement.clientWidth;
    const tooltipX = this.getTooltipPosition(event, parentWidth);

    this.tooltip
      .style('visibility', 'visible')
      .style('top', event.clientY + 'px')
      .style('left', tooltipX + 'px')
      .html(
        this.config.tooltip.replaceFunction(
          this._tooltipTemplate || this._defaultTooltipTemplate,
          currentPoint
        )
      );
    // Show line and circle point data in chart
    this.focusPoint.style('visibility', 'visible');
    this.focusPoint.attr(
      'transform',
      `translate(${currentX(currentPoint[this.bindLabel])}, ${this.yScale(
        currentPoint[this.bindValue]
      )})`
    );

    this.focusPoint
      .select('.x-hover-line')
      .attr(
        'y2',
        this.config.height -
          this.yScale(currentPoint[this.bindValue]) -
          this.marginChartToAxis.bottom
      );
  }

  handleHideTooltipWhenScrolling() {
    this.scrollDispatcher
      .ancestorScrolled(this.elementRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.handleMouseOut());
  }

  configDisplayXAxis(x) {
    const maxIndex = this.config.data.length - 1;
    //If the data length > MAX_DATA_LENGTH_FOR_POINT_DISTANCE
    //the label will be displayed with a jump = DISTANCE_POINT from the last index of the data
    switch (this.config.periodType) {
      case EPeriodType.YEAR: {
        return d3
          .axisBottom(x)
          .ticks(d3.utcYear.every(1))
          .tickFormat((date: Date, index) => {
            const firstDayOfYear = new Date(date);
            firstDayOfYear.setUTCDate(1);
            firstDayOfYear.setUTCMonth(0);
            const dayFormatted = d3.utcFormat('%Y')(firstDayOfYear);
            return this.handleDisplayLabel(maxIndex, index, dayFormatted);
          });
      }
      case EPeriodType.QUARTER: {
        const stepByDataLength = this.config.data.length > 1 ? 3 : 1;
        return d3
          .axisBottom(x)
          .ticks(d3.utcMonth.every(stepByDataLength))
          .tickFormat((date: Date, index) => {
            const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
            const year = date.getUTCFullYear();
            const dayFormatted = `Q${quarter}/${year}`;
            return this.handleDisplayLabel(maxIndex, index, dayFormatted);
          });
      }
      case EPeriodType.MONTH: {
        return d3
          .axisBottom(x)
          .ticks(d3.utcMonth.every(1))
          .tickFormat((date: Date, index) => {
            const formattedDate = d3.utcFormat('%b')(date);
            const year = date.getUTCFullYear();
            const dayFormatted = `${formattedDate} ${year}`;
            return this.handleDisplayLabel(maxIndex, index, dayFormatted);
          });
      }

      case EPeriodType.WEEK: {
        const minDate = this.config.minLabel;
        const maxDate = this.config.maxLabel;
        return d3
          .axisBottom(x)
          .ticks(d3.utcMonday.every(1))
          .tickFormat((date: Date, index) => {
            const weekStart = d3.utcMonday.floor(date);
            const weekEnd = d3.utcSunday.ceil(date);
            let formattedStartDate = dayjs.utc(weekStart);
            let formattedEndDate = dayjs.utc(weekEnd);
            if (weekStart.getTime() < new Date(minDate).getTime()) {
              formattedStartDate = dayjs.utc(minDate);
            }

            if (weekEnd.getTime() > new Date(maxDate).getTime()) {
              formattedEndDate = dayjs.utc(maxDate);
            }
            const dayFormatted = `${formattedStartDate.format(
              this.config.dateFormat.DATE_FORMAT_DAY_MONTH_DAYJS
            )} - ${formattedEndDate.format(
              this.config.dateFormat.DATE_FORMAT_DAYJS
            )}`;
            return this.handleDisplayLabel(maxIndex, index, dayFormatted);
          });
      }
      case EPeriodType.DAY: {
        return d3
          .axisBottom(x)
          .ticks(d3.utcDay.every(1))
          .tickFormat((date: Date, index) => {
            const dayFormatted = dayjs
              .utc(date)
              .format(this.config.dateFormat.DATE_FORMAT_DAYJS);
            return this.handleDisplayLabel(maxIndex, index, dayFormatted);
          });
      }
      default: {
        return d3.axisBottom(x);
      }
    }
  }

  handleDisplayLabel(maxIndex, currentIndex, currentLabel) {
    if (
      this.distancePoint === 1 ||
      (currentIndex - maxIndex) % this.distancePoint === 0
    ) {
      return currentLabel;
    }
    return null;
  }

  createDefaultTooltipTemplate() {
    this._defaultEmbeddedView = this.defaultTooltipTemplate.createEmbeddedView(
      this.elementRef
    );
    this._defaultTooltipTemplate =
      this._defaultEmbeddedView.rootNodes[0]?.outerHTML;
  }

  private clearChartData(): void {
    if (this.config.data !== null && this.config.data.length > 0) {
      this.svgNode.selectAll('g').remove();
      this.svgNode.selectAll('path').remove();
      this.svgNode.selectAll('circle').remove();
      this.marginChartToAxis.left = this.marginChartToAxis.right = 35;
      this.xScaleZoom = null;
      this.distancePoint = 1;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
