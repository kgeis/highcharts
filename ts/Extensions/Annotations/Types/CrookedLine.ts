/* *
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type {
    AnnotationsOptions,
    AnnotationsTypeOptions,
    AnnotationsTypePointsOptions
} from '../AnnotationsOptions';
import type Controllable from '../Controllables/Controllable';
import type PositionObject from '../../../Core/Renderer/PositionObject';
import type MockPointOptions from '../MockPointOptions';
import Annotation from '../Annotation.js';
import ControlPoint from '../ControlPoint.js';
import MockPoint from '../MockPoint.js';
import U from '../../../Core/Utilities.js';
const { merge } = U;

/* eslint-disable no-invalid-this, valid-jsdoc */

class CrookedLine extends Annotation {

    /* *
     *
     * Constructors
     *
     * */
    public constructor(
        chart: Highcharts.AnnotationChart,
        options: CrookedLine.Options
    ) {
        super(chart, options);
    }

    /* *
     *
     * Functions
     *
     * */

    /**
     * Overrides default setter to get axes from typeOptions.
     * @private
     */
    public setClipAxes(): void {
        this.clipXAxis = this.chart.xAxis[
            this.options.typeOptions.xAxis as any
        ];
        this.clipYAxis = this.chart.yAxis[
            this.options.typeOptions.yAxis as any
        ];
    }

    public getPointsOptions(): Array<MockPointOptions> {
        const typeOptions = this.options.typeOptions;

        return (typeOptions.points || []).map(function (
            pointOptions: AnnotationsTypePointsOptions
        ): MockPointOptions {
            pointOptions.xAxis = typeOptions.xAxis;
            pointOptions.yAxis = typeOptions.yAxis;

            return pointOptions as any;
        });
    }

    public getControlPointsOptions(): Array<MockPointOptions> {
        return this.getPointsOptions();
    }

    public addControlPoints(): void {
        this.getControlPointsOptions().forEach(
            function (
                pointOptions: MockPointOptions,
                i: number
            ): void {
                const controlPoint = new ControlPoint(
                    this.chart,
                    this as any,
                    merge(
                        this.options.controlPointOptions,
                        pointOptions.controlPoint
                    ),
                    i
                );

                this.controlPoints.push(controlPoint);

                pointOptions.controlPoint = controlPoint.options;
            },
            this
        );
    }

    public addShapes(): void {
        const typeOptions = this.options.typeOptions,
            shape = this.initShape(
                merge(typeOptions.line, {
                    type: 'path',
                    points: this.points.map(function (
                        _point: Highcharts.AnnotationPointType,
                        i: number
                    ): Function {
                        return function (
                            target: Controllable
                        ): Highcharts.AnnotationPointType {
                            return target.annotation.points[i];
                        };
                    })
                }),
                0
            );

        typeOptions.line = shape.options;
    }
}

/**
 * @private
 */
interface CrookedLine {
    defaultOptions: Annotation['defaultOptions'];
}

CrookedLine.prototype.defaultOptions = merge(
    Annotation.prototype.defaultOptions,
    /**
     * A crooked line annotation.
     *
     * @sample highcharts/annotations-advanced/crooked-line/
     *         Crooked line
     *
     * @product      highstock
     * @optionparent annotations.crookedLine
     */
    {
        /**
         * @extends   annotations.labelOptions
         * @apioption annotations.crookedLine.labelOptions
         */

        /**
         * @extends   annotations.shapeOptions
         * @apioption annotations.crookedLine.shapeOptions
         */

        /**
         * Additional options for an annotation with the type.
         */
        typeOptions: {
            /**
             * This number defines which xAxis the point is connected to.
             * It refers to either the axis id or the index of the axis
             * in the xAxis array.
             */
            xAxis: 0,
            /**
             * This number defines which yAxis the point is connected to.
             * It refers to either the axis id or the index of the axis
             * in the xAxis array.
             */
            yAxis: 0,

            /**
             * @type      {Array<*>}
             * @apioption annotations.crookedLine.typeOptions.points
             */

            /**
             * The x position of the point.
             *
             * @type      {number}
             * @apioption annotations.crookedLine.typeOptions.points.x
             */

            /**
             * The y position of the point.
             *
             * @type      {number}
             * @apioption annotations.crookedLine.typeOptions.points.y
             */

            /**
             * @type      {number}
             * @excluding positioner, events
             * @apioption annotations.crookedLine.typeOptions.points.controlPoint
             */

            /**
             * Line options.
             *
             * @excluding height, point, points, r, type, width
             */
            line: {
                fill: 'none'
            }
        },

        /**
         * @excluding positioner, events
         */
        controlPointOptions: {
            positioner: function (
                this: Highcharts.AnnotationControlPoint,
                target: Controllable
            ): PositionObject {
                const graphic = this.graphic,
                    xy = MockPoint.pointToPixels(target.points[this.index]);

                return {
                    x: xy.x - graphic.width / 2,
                    y: xy.y - graphic.height / 2
                };
            },

            events: {
                drag: function (
                    this: Annotation,
                    e: Highcharts.AnnotationEventObject,
                    target: Controllable
                ): void {
                    if (
                        target.chart.isInsidePlot(
                            e.chartX - target.chart.plotLeft,
                            e.chartY - target.chart.plotTop,
                            {
                                visiblePlotOnly: true
                            }
                        )
                    ) {
                        const translation = this.mouseMoveToTranslation(e);

                        target.translatePoint(
                            translation.x,
                            translation.y,
                            this.index
                        );

                        // Update options:
                        (target.options as any).typeOptions
                            .points[this.index].x = target.points[this.index].x;
                        (target.options as any).typeOptions
                            .points[this.index].y = target.points[this.index].y;

                        target.redraw(false);
                    }
                }
            }
        }
    }
);

namespace CrookedLine {
    export interface Options extends AnnotationsOptions {
        typeOptions: TypeOptions;
    }
    export interface TypeOptions extends AnnotationsTypeOptions {
        points?: Array<AnnotationsTypePointsOptions>;
    }
}

/* *
 *
 *  Registry
 *
 * */

Annotation.types.crookedLine = CrookedLine;
declare module './AnnotationType'{
    interface AnnotationTypeRegistry {
        crookedLine: typeof CrookedLine;
    }
}

/* *
 *
 *  Export Default
 *
 * */

export default CrookedLine;
