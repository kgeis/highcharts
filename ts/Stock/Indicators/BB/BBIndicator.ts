/**
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type {
    BBOptions,
    BBParamsOptions
} from './BBOptions';
import type BBPoint from './BBPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import MultipleLinesComposition from '../MultipleLinesComposition.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        sma: SMAIndicator
    }
} = SeriesRegistry;
import U from '../../../Core/Utilities.js';
const {
    extend,
    isArray,
    merge
} = U;

/* *
 *
 *  Functions
 *
 * */

/* eslint-disable valid-jsdoc */

// Utils:
/**
 * @private
 */
function getStandardDeviation(
    arr: Array<Array<number>>,
    index: number,
    isOHLC: boolean,
    mean: number
): number {
    let variance = 0,
        arrLen = arr.length,
        std = 0,
        i = 0,
        value: number;

    for (; i < arrLen; i++) {
        value = ((isOHLC ? arr[i][index] : arr[i]) as any) - mean;
        variance += value * value;
    }
    variance = variance / (arrLen - 1);

    std = Math.sqrt(variance);
    return std;
}

/* *
 *
 *  Class
 *
 * */

/**
 * Bollinger Bands series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.bb
 *
 * @augments Highcharts.Series
 */
class BBIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Bollinger bands (BB). This series requires the `linkedTo` option to be
     * set and should be loaded after the `stock/indicators/indicators.js` file.
     *
     * @sample stock/indicators/bollinger-bands
     *         Bollinger bands
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/bollinger-bands
     * @optionparent plotOptions.bb
     */
    public static defaultOptions: BBOptions = merge(SMAIndicator.defaultOptions, {

        /**
         * Option for fill color between lines in Bollinger Bands Indicator.
         *
         * @sample {highstock} stock/indicators/indicator-area-fill
         *      Background fill between lines.
         *
         * @type      {Highcharts.Color}
         * @since 9.3.2
         * @apioption plotOptions.bb.fillColor
         *
         */

        params: {
            period: 20,
            /**
             * Standard deviation for top and bottom bands.
             */
            standardDeviation: 2,
            index: 3
        },
        /**
         * Bottom line options.
         */
        bottomLine: {
            /**
             * Styles for a bottom line.
             */
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1,
                /**
                 * Color of the line. If not set, it's inherited from
                 * [plotOptions.bb.color](#plotOptions.bb.color).
                 *
                 * @type  {Highcharts.ColorString}
                 */
                lineColor: void 0
            }
        },
        /**
         * Top line options.
         *
         * @extends plotOptions.bb.bottomLine
         */
        topLine: {
            styles: {
                lineWidth: 1,
                /**
                 * @type {Highcharts.ColorString}
                 */
                lineColor: void 0
            }
        },
        tooltip: {
            pointFormat: '<span style="color:{point.color}">\u25CF</span><b> {series.name}</b><br/>Top: {point.top}<br/>Middle: {point.middle}<br/>Bottom: {point.bottom}<br/>'
        },
        marker: {
            enabled: false
        },
        dataGrouping: {
            approximation: 'averages'
        }
    } as BBOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<BBPoint> = void 0 as any;

    public options: BBOptions = void 0 as any;

    public points: Array<BBPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public init(this: BBIndicator): void {
        SeriesRegistry.seriesTypes.sma.prototype.init.apply(this, arguments);

        // Set default color for lines:
        this.options = merge({
            topLine: {
                styles: {
                    lineColor: this.color
                }
            },
            bottomLine: {
                styles: {
                    lineColor: this.color
                }
            }
        }, this.options);
    }

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: BBParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        let period: number = (params.period as any),
            standardDeviation: number = (params.standardDeviation as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            // 0- date, 1-middle line, 2-top line, 3-bottom line
            BB: Array<Array<number>> = [],
            // middle line, top line and bottom line
            ML: number,
            TL: number,
            BL: number,
            date: number,
            xData: Array<number> = [],
            yData: Array<Array<number>> = [],
            slicedX: (Array<number>|undefined),
            slicedY: Array<Array<number>>,
            stdDev: number,
            isOHLC: boolean,
            point: (
                IndicatorValuesObject<TLinkedSeries>|
                undefined
            ),
            i: number;

        if (xVal.length < period) {
            return;
        }

        isOHLC = isArray(yVal[0]);

        for (i = period; i <= yValLen; i++) {
            slicedX = xVal.slice(i - period, i);
            slicedY = yVal.slice(i - period, i);

            point = SeriesRegistry.seriesTypes.sma.prototype.getValues.call(
                this,
                ({
                    xData: slicedX,
                    yData: slicedY
                } as any),
                params
            ) as IndicatorValuesObject<TLinkedSeries>;

            date = (point as any).xData[0];
            ML = (point as any).yData[0];
            stdDev = getStandardDeviation(
                slicedY,
                (params.index as any),
                isOHLC,
                ML
            );
            TL = ML + standardDeviation * stdDev;
            BL = ML - standardDeviation * stdDev;

            BB.push([date, TL, ML, BL]);
            xData.push(date);
            yData.push([TL, ML, BL]);
        }

        return {
            values: BB,
            xData: xData,
            yData: yData
        } as IndicatorValuesObject<TLinkedSeries>;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface BBIndicator extends MultipleLinesComposition.IndicatorComposition {
    linesApiNames: Array<string>;
    nameComponents: Array<string>;
    pointArrayMap: Array<keyof BBPoint>;
    pointClass: typeof BBPoint;
    pointValKey: string;
}
extend(BBIndicator.prototype, {
    areaLinesNames: ['top', 'bottom'],
    linesApiNames: ['topLine', 'bottomLine'],
    nameComponents: ['period', 'standardDeviation'],
    pointArrayMap: ['top', 'middle', 'bottom'],
    pointValKey: 'middle'
});
MultipleLinesComposition.compose(BBIndicator);

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        bb: typeof BBIndicator;
    }
}
SeriesRegistry.registerSeriesType('bb', BBIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default BBIndicator;

/**
 * A bollinger bands indicator. If the [type](#series.bb.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.bb
 * @since     6.0.0
 * @excluding dataParser, dataURL
 * @product   highstock
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/bollinger-bands
 * @apioption series.bb
 */

''; // to include the above in the js output
