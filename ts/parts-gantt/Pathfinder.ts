/* *
 *
 *  (c) 2016 Highsoft AS
 *  Authors: Øystein Moseng, Lars A. V. Cabrera
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import H from '../parts/Globals.js';

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        type PathfinderTypeValue = (
            'straight'|
            'fastAvoid'|
            'simpleConnect'|
            string
        );
        interface Chart {
            pathfinder?: Pathfinder;
        }
        interface ConnectorsEndMarkerOptions {
            align?: AlignValue;
            color?: (ColorString|GradientColorObject|PatternObject);
            enabled?: boolean;
            height?: number;
            inside?: boolean;
            lineColor?: ColorString;
            lineWidth?: number;
            radius?: number;
            symbol?: string;
            verticalAlign?: VerticalAlignValue;
            width?: number;
        }
        interface ConnectorsMarkerOptions {
            align?: AlignValue;
            color?: (ColorString|GradientColorObject|PatternObject);
            enabled?: boolean;
            height?: number;
            inside?: boolean;
            lineColor?: ColorString;
            lineWidth?: number;
            radius?: number;
            symbol?: string;
            verticalAlign?: VerticalAlignValue;
            width?: number;
        }
        interface ConnectorsOptions {
            algorithmMargin?: number;
            dashStyle?: string;
            enabled?: boolean;
            endMarker?: ConnectorsEndMarkerOptions;
            lineColor?: ColorString;
            lineWidth?: number;
            marker?: ConnectorsMarkerOptions;
            startMarker?: ConnectorsStartMarkerOptions;
            type?: PathfinderTypeValue;
        }
        interface ConnectorsStartMarkerOptions {
            align?: AlignValue;
            color?: (ColorString|GradientColorObject|PatternObject);
            enabled?: boolean;
            height?: number;
            inside?: boolean;
            lineColor?: ColorString;
            lineWidth?: number;
            radius?: number;
            symbol?: string;
            verticalAlign?: VerticalAlignValue;
            width?: number;
        }
        interface Options {
            connectors?: ConnectorsOptions;
        }
        interface Point {
            getMarkerVector(
                radians: number,
                markerRadius: number,
                anchor: PositionObject
            ): PositionObject;
            getPathfinderAnchorPoint(
                markerOptions: ConnectorsMarkerOptions
            ): PositionObject;
            getRadiansToVector(v1: PositionObject, v2: PositionObject): number;
        }
        interface PointConnectOptionsObject {
            to?: string;
        }
        interface PointOptionsObject {
            connect?: PointConnectOptionsObject;
            connectors?: ConnectorsOptions;
        }
        interface Series {
            pathfinderRemoveRenderEvent?: Function;
        }
        interface SeriesOptions {
            connectors?: ConnectorsOptions;
        }
        class Connection {
            public constructor(
                from: Point,
                to: Point,
                options?: ConnectorsOptions
            );
            public chart: Chart;
            public fromPoint: Point;
            public graphics: Dictionary<SVGElement>;
            public options?: ConnectorsOptions;
            public pathfinder: Pathfinder;
            public toPoint: Point;
            public addMarker(
                type: string,
                options: ConnectorsMarkerOptions,
                path: SVGPathArray
            ): void;
            public destroy(): void;
            public getPath(
                options: ConnectorsOptions
            ): PathfinderAlgorithmResultObject;
            public init(
                from: Point,
                to: Point,
                options?: ConnectorsOptions
            ): void;
            public render(): void;
            public renderPath(
                path: SVGPathArray,
                attribs?: SVGAttributes,
                animation?: (boolean|AnimationOptionsObject)
            ): void;
        }
        class Pathfinder {
            public constructor(chart: Chart);
            public algorithms: PathfinderAlgorithmsObject;
            public chart: Chart;
            public chartObstacles: Array<any>;
            public chartObstacleMetrics: Dictionary<number>;
            public connections: Array<Connection>;
            public group: SVGElement;
            public lineObstacles: Array<any>;
            public getAlgorithmStartDirection(
                markerOptions: ConnectorsMarkerOptions
            ): (boolean|undefined);
            public getChartObstacles(
                options: { algorithmMargin?: number }
            ): Array<any>;
            public getObstacleMetrics(
                obstacles: Array<any>
            ): Dictionary<number>;
            public init(chart: Chart): void;
            public renderConnections(deferRender?: boolean): void;
            public update(deferRender?: boolean): void;
        }
    }
}

/**
 * The default pathfinder algorithm to use for a chart. It is possible to define
 * your own algorithms by adding them to the
 * `Highcharts.Pathfinder.prototype.algorithms`
 * object before the chart has been created.
 *
 * The default algorithms are as follows:
 *
 * `straight`:      Draws a straight line between the connecting
 *                  points. Does not avoid other points when drawing.
 *
 * `simpleConnect`: Finds a path between the points using right angles
 *                  only. Takes only starting/ending points into
 *                  account, and will not avoid other points.
 *
 * `fastAvoid`:     Finds a path between the points using right angles
 *                  only. Will attempt to avoid other points, but its
 *                  focus is performance over accuracy. Works well with
 *                  less dense datasets.
 *
 * @typedef {"fastAvoid"|"simpleConnect"|"straight"|string} Highcharts.PathfinderTypeValue
 */

import '../parts/Point.js';

import U from '../parts/Utilities.js';
var defined = U.defined,
    objectEach = U.objectEach,
    splat = U.splat;

import pathfinderAlgorithms from 'PathfinderAlgorithms.js';
import 'ArrowSymbols.js';

var deg2rad = H.deg2rad,
    extend = H.extend,
    addEvent = H.addEvent,
    merge = H.merge,
    pick = H.pick,
    max = Math.max,
    min = Math.min;

/*
 @todo:
     - Document how to write your own algorithms
     - Consider adding a Point.pathTo method that wraps creating a connection
       and rendering it
*/


// Set default Pathfinder options
extend(H.defaultOptions, {
    /**
     * The Pathfinder module allows you to define connections between any two
     * points, represented as lines - optionally with markers for the start
     * and/or end points. Multiple algorithms are available for calculating how
     * the connecting lines are drawn.
     *
     * Connector functionality requires Highcharts Gantt to be loaded. In Gantt
     * charts, the connectors are used to draw dependencies between tasks.
     *
     * @see [dependency](series.gantt.data.dependency)
     *
     * @sample gantt/pathfinder/demo
     *         Pathfinder connections
     *
     * @product      gantt
     * @optionparent connectors
     */
    connectors: {

        /**
         * Enable connectors for this chart. Requires Highcharts Gantt.
         *
         * @type      {boolean}
         * @default   true
         * @since     6.2.0
         * @apioption connectors.enabled
         */

        /**
         * Set the default dash style for this chart's connecting lines.
         *
         * @type      {string}
         * @default   solid
         * @since     6.2.0
         * @apioption connectors.dashStyle
         */

        /**
         * Set the default color for this chart's Pathfinder connecting lines.
         * Defaults to the color of the point being connected.
         *
         * @type      {Highcharts.ColorString}
         * @since     6.2.0
         * @apioption connectors.lineColor
         */

        /**
         * Set the default pathfinder margin to use, in pixels. Some Pathfinder
         * algorithms attempt to avoid obstacles, such as other points in the
         * chart. These algorithms use this margin to determine how close lines
         * can be to an obstacle. The default is to compute this automatically
         * from the size of the obstacles in the chart.
         *
         * To draw connecting lines close to existing points, set this to a low
         * number. For more space around existing points, set this number
         * higher.
         *
         * @sample gantt/pathfinder/algorithm-margin
         *         Small algorithmMargin
         *
         * @type      {number}
         * @since     6.2.0
         * @apioption connectors.algorithmMargin
         */

        /**
         * Set the default pathfinder algorithm to use for this chart. It is
         * possible to define your own algorithms by adding them to the
         * Highcharts.Pathfinder.prototype.algorithms object before the chart
         * has been created.
         *
         * The default algorithms are as follows:
         *
         * `straight`:      Draws a straight line between the connecting
         *                  points. Does not avoid other points when drawing.
         *
         * `simpleConnect`: Finds a path between the points using right angles
         *                  only. Takes only starting/ending points into
         *                  account, and will not avoid other points.
         *
         * `fastAvoid`:     Finds a path between the points using right angles
         *                  only. Will attempt to avoid other points, but its
         *                  focus is performance over accuracy. Works well with
         *                  less dense datasets.
         *
         * Default value: `straight` is used as default for most series types,
         * while `simpleConnect` is used as default for Gantt series, to show
         * dependencies between points.
         *
         * @sample gantt/pathfinder/demo
         *         Different types used
         *
         * @type    {Highcharts.PathfinderTypeValue}
         * @default undefined
         * @since   6.2.0
         */
        type: 'straight',

        /**
         * Set the default pixel width for this chart's Pathfinder connecting
         * lines.
         *
         * @since 6.2.0
         */
        lineWidth: 1,

        /**
         * Marker options for this chart's Pathfinder connectors. Note that
         * this option is overridden by the `startMarker` and `endMarker`
         * options.
         *
         * @since 6.2.0
         */
        marker: {
            /**
             * Set the radius of the connector markers. The default is
             * automatically computed based on the algorithmMargin setting.
             *
             * Setting marker.width and marker.height will override this
             * setting.
             *
             * @type      {number}
             * @since     6.2.0
             * @apioption connectors.marker.radius
             */

            /**
             * Set the width of the connector markers. If not supplied, this
             * is inferred from the marker radius.
             *
             * @type      {number}
             * @since     6.2.0
             * @apioption connectors.marker.width
             */

            /**
             * Set the height of the connector markers. If not supplied, this
             * is inferred from the marker radius.
             *
             * @type      {number}
             * @since     6.2.0
             * @apioption connectors.marker.height
             */

            /**
             * Set the color of the connector markers. By default this is the
             * same as the connector color.
             *
             * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
             * @since     6.2.0
             * @apioption connectors.marker.color
             */

            /**
             * Set the line/border color of the connector markers. By default
             * this is the same as the marker color.
             *
             * @type      {Highcharts.ColorString}
             * @since     6.2.0
             * @apioption connectors.marker.lineColor
             */

            /**
             * Enable markers for the connectors.
             */
            enabled: false,

            /**
             * Horizontal alignment of the markers relative to the points.
             *
             * @type {Highcharts.AlignValue}
             */
            align: 'center',

            /**
             * Vertical alignment of the markers relative to the points.
             *
             * @type {Highcharts.VerticalAlignValue}
             */
            verticalAlign: 'middle',

            /**
             * Whether or not to draw the markers inside the points.
             */
            inside: false,

            /**
             * Set the line/border width of the pathfinder markers.
             */
            lineWidth: 1
        },

        /**
         * Marker options specific to the start markers for this chart's
         * Pathfinder connectors. Overrides the generic marker options.
         *
         * @extends connectors.marker
         * @since   6.2.0
         */
        startMarker: {
            /**
             * Set the symbol of the connector start markers.
             */
            symbol: 'diamond'
        },

        /**
         * Marker options specific to the end markers for this chart's
         * Pathfinder connectors. Overrides the generic marker options.
         *
         * @extends connectors.marker
         * @since   6.2.0
         */
        endMarker: {
            /**
             * Set the symbol of the connector end markers.
             */
            symbol: 'arrow-filled'
        }
    }
});

/**
 * Override Pathfinder connector options for a series. Requires Highcharts Gantt
 * to be loaded.
 *
 * @extends   connectors
 * @since     6.2.0
 * @excluding enabled, algorithmMargin
 * @product   gantt
 * @apioption plotOptions.series.connectors
 */

/**
 * Connect to a point. Requires Highcharts Gantt to be loaded. This option can
 * be either a string, referring to the ID of another point, or an object, or an
 * array of either. If the option is an array, each element defines a
 * connection.
 *
 * @sample gantt/pathfinder/demo
 *         Different connection types
 *
 * @type      {string|Array<string|*>|*}
 * @extends   plotOptions.series.connectors
 * @since     6.2.0
 * @excluding enabled
 * @product   gantt
 * @apioption series.xrange.data.connect
 */

/**
 * The ID of the point to connect to.
 *
 * @type      {string}
 * @since     6.2.0
 * @product   gantt
 * @apioption series.xrange.data.connect.to
 */


/**
 * Get point bounding box using plotX/plotY and shapeArgs. If using
 * graphic.getBBox() directly, the bbox will be affected by animation.
 *
 * @private
 * @function
 *
 * @param {Highcharts.Point} point
 *        The point to get BB of.
 *
 * @return {Highcharts.Dictionary<number>|null}
 *         Result xMax, xMin, yMax, yMin.
 */
function getPointBB(
    point: Highcharts.Point
): (Highcharts.Dictionary<number>|null) {
    var shapeArgs = point.shapeArgs,
        bb;

    // Prefer using shapeArgs (columns)
    if (shapeArgs) {
        return {
            xMin: shapeArgs.x,
            xMax: shapeArgs.x + shapeArgs.width,
            yMin: shapeArgs.y,
            yMax: shapeArgs.y + shapeArgs.height
        };
    }

    // Otherwise use plotX/plotY and bb
    bb = point.graphic && point.graphic.getBBox();
    return bb ? {
        xMin: (point.plotX as any) - bb.width / 2,
        xMax: (point.plotX as any) + bb.width / 2,
        yMin: (point.plotY as any) - bb.height / 2,
        yMax: (point.plotY as any) + bb.height / 2
    } : null;
}


/**
 * Calculate margin to place around obstacles for the pathfinder in pixels.
 * Returns a minimum of 1 pixel margin.
 *
 * @private
 * @function
 *
 * @param {Array<object>} obstacles
 *        Obstacles to calculate margin from.
 *
 * @return {number}
 *         The calculated margin in pixels. At least 1.
 */
function calculateObstacleMargin(obstacles: Array<any>): number {
    var len = obstacles.length,
        i = 0,
        j,
        obstacleDistance,
        distances = [],
        // Compute smallest distance between two rectangles
        distance = function (
            a: Highcharts.Dictionary<number>,
            b: Highcharts.Dictionary<number>,
            bbMargin?: number
        ): number {
            // Count the distance even if we are slightly off
            var margin = pick(bbMargin, 10),
                yOverlap = a.yMax + margin > b.yMin - margin &&
                            a.yMin - margin < b.yMax + margin,
                xOverlap = a.xMax + margin > b.xMin - margin &&
                            a.xMin - margin < b.xMax + margin,
                xDistance = yOverlap ? (
                    a.xMin > b.xMax ? a.xMin - b.xMax : b.xMin - a.xMax
                ) : Infinity,
                yDistance = xOverlap ? (
                    a.yMin > b.yMax ? a.yMin - b.yMax : b.yMin - a.yMax
                ) : Infinity;

            // If the rectangles collide, try recomputing with smaller margin.
            // If they collide anyway, discard the obstacle.
            if (xOverlap && yOverlap) {
                return (
                    margin ?
                        distance(a, b, Math.floor(margin / 2)) :
                        Infinity
                );
            }

            return min(xDistance, yDistance);
        };

    // Go over all obstacles and compare them to the others.
    for (; i < len; ++i) {
        // Compare to all obstacles ahead. We will already have compared this
        // obstacle to the ones before.
        for (j = i + 1; j < len; ++j) {
            obstacleDistance = distance(obstacles[i], obstacles[j]);
            // TODO: Magic number 80
            if (obstacleDistance < 80) { // Ignore large distances
                distances.push(obstacleDistance);
            }
        }
    }
    // Ensure we always have at least one value, even in very spaceous charts
    distances.push(80);

    return max(
        Math.floor(
            distances.sort(function (a: number, b: number): number {
                return (a - b);
            })[
                // Discard first 10% of the relevant distances, and then grab
                // the smallest one.
                Math.floor(distances.length / 10)
            ] / 2 - 1 // Divide the distance by 2 and subtract 1.
        ),
        1 // 1 is the minimum margin
    );
}

/* eslint-disable no-invalid-this, valid-jsdoc */

/**
 * The Connection class. Used internally to represent a connection between two
 * points.
 *
 * @private
 * @class
 * @name Highcharts.Connection
 *
 * @param {Highcharts.Point} from
 *        Connection runs from this Point.
 *
 * @param {Highcharts.Point} to
 *        Connection runs to this Point.
 *
 * @param {Highcharts.ConnectorsOptions} [options]
 *        Connection options.
 */
function Connection(
    this: Highcharts.Connection,
    from: Highcharts.Point,
    to: Highcharts.Point,
    options?: Highcharts.ConnectorsOptions
): void {
    this.init(from, to, options);
}
declare type Connection = Highcharts.Connection;
Connection.prototype = {

    /**
     * Initialize the Connection object. Used as constructor only.
     *
     * @function Highcharts.Connection#init
     *
     * @param {Highcharts.Point} from
     *        Connection runs from this Point.
     *
     * @param {Highcharts.Point} to
     *        Connection runs to this Point.
     *
     * @param {Highcharts.ConnectorsOptions} [options]
     *        Connection options.
     */
    init: function (
        this: Highcharts.Connection,
        from: Highcharts.Point,
        to: Highcharts.Point,
        options?: Highcharts.ConnectorsOptions
    ): void {
        this.fromPoint = from;
        this.toPoint = to;
        this.options = options;
        this.chart = from.series.chart;
        this.pathfinder = this.chart.pathfinder as any;
    },

    /**
     * Add (or update) this connection's path on chart. Stores reference to the
     * created element on this.graphics.path.
     *
     * @function Highcharts.Connection#renderPath
     *
     * @param {Highcharts.SVGPathArray} path
     *        Path to render, in array format. E.g. ['M', 0, 0, 'L', 10, 10]
     *
     * @param {Highcharts.SVGAttributes} [attribs]
     *        SVG attributes for the path.
     *
     * @param {Highcharts.AnimationOptionsObject} [animation]
     *        Animation options for the rendering.
     */
    renderPath: function (
        this: Highcharts.Connection,
        path: Highcharts.SVGPathArray,
        attribs?: Highcharts.SVGAttributes,
        animation?: (boolean|Highcharts.AnimationOptionsObject)
    ): void {
        var connection = this,
            chart = this.chart,
            styledMode = chart.styledMode,
            pathfinder = chart.pathfinder,
            animate =
                !(chart.options.chart as any).forExport && animation !== false,
            pathGraphic = connection.graphics && connection.graphics.path,
            anim: Highcharts.SVGAttributes;

        // Add the SVG element of the pathfinder group if it doesn't exist
        if (!(pathfinder as any).group) {
            (pathfinder as any).group = chart.renderer.g()
                .addClass('highcharts-pathfinder-group')
                .attr({ zIndex: -1 })
                .add(chart.seriesGroup);
        }

        // Shift the group to compensate for plot area.
        // Note: Do this always (even when redrawing a path) to avoid issues
        // when updating chart in a way that changes plot metrics.
        (pathfinder as any).group.translate(chart.plotLeft, chart.plotTop);

        // Create path if does not exist
        if (!(pathGraphic && pathGraphic.renderer)) {
            pathGraphic = chart.renderer.path()
                .add((pathfinder as any).group);
            if (!styledMode) {
                pathGraphic.attr({
                    opacity: 0
                });
            }
        }

        // Set path attribs and animate to the new path
        pathGraphic.attr(attribs);
        anim = { d: path };
        if (!styledMode) {
            anim.opacity = 1;
        }
        pathGraphic[animate ? 'animate' : 'attr'](anim, animation as any);

        // Store reference on connection
        this.graphics = this.graphics || {};
        this.graphics.path = pathGraphic;
    },

    /**
     * Calculate and add marker graphics for connection to the chart. The
     * created/updated elements are stored on this.graphics.start and
     * this.graphics.end.
     *
     * @function Highcharts.Connection#addMarker
     *
     * @param {string} type
     *        Marker type, either 'start' or 'end'.
     *
     * @param {Highcharts.ConnectorsMarkerOptions} options
     *        All options for this marker. Not calculated or merged with other
     *        options.
     *
     * @param {Highcharts.SVGPathArray} path
     *        Connection path in array format. This is used to calculate the
     *        rotation angle of the markers.
     */
    addMarker: function (
        this: Highcharts.Connection,
        type: string,
        options: Highcharts.ConnectorsMarkerOptions,
        path: Highcharts.SVGPathArray
    ): void {
        var connection = this,
            chart = connection.fromPoint.series.chart,
            pathfinder = chart.pathfinder,
            renderer = chart.renderer,
            point = (
                type === 'start' ?
                    connection.fromPoint :
                    connection.toPoint
            ),
            anchor = point.getPathfinderAnchorPoint(options),
            markerVector,
            radians,
            rotation,
            box,
            width,
            height,
            pathVector;


        if (!options.enabled) {
            return;
        }

        // Last vector before start/end of path, used to get angle
        if (type === 'start') {
            pathVector = {
                x: path[4],
                y: path[5]
            };
        } else { // 'end'
            pathVector = {
                x: path[path.length - 5],
                y: path[path.length - 4]
            };
        }

        // Get angle between pathVector and anchor point and use it to create
        // marker position.
        radians = point.getRadiansToVector(pathVector as any, anchor);
        markerVector = point.getMarkerVector(
            radians,
            options.radius as any,
            anchor
        );

        // Rotation of marker is calculated from angle between pathVector and
        // markerVector.
        // (Note:
        //  Used to recalculate radians between markerVector and pathVector,
        //  but this should be the same as between pathVector and anchor.)
        rotation = -radians / deg2rad;

        if (options.width && options.height) {
            width = options.width;
            height = options.height;
        } else {
            width = height = (options.radius as any) * 2;
        }

        // Add graphics object if it does not exist
        connection.graphics = connection.graphics || {};
        box = {
            x: markerVector.x - (width / 2),
            y: markerVector.y - (height / 2),
            width: width,
            height: height,
            rotation: rotation,
            rotationOriginX: markerVector.x,
            rotationOriginY: markerVector.y
        };

        if (!connection.graphics[type]) {

            // Create new marker element
            connection.graphics[type] = renderer
                .symbol(options.symbol as any)
                .addClass(
                    'highcharts-point-connecting-path-' + type + '-marker'
                )
                .attr(box)
                .add((pathfinder as any).group);

            if (!renderer.styledMode) {
                connection.graphics[type].attr({
                    fill: options.color || connection.fromPoint.color,
                    stroke: options.lineColor,
                    'stroke-width': options.lineWidth,
                    opacity: 0
                })
                    .animate({
                        opacity: 1
                    }, point.series.options.animation);
            }

        } else {
            connection.graphics[type].animate(box);
        }
    },

    /**
     * Calculate and return connection path.
     * Note: Recalculates chart obstacles on demand if they aren't calculated.
     *
     * @function Highcharts.Connection#getPath
     *
     * @param {Highcharts.ConnectorsOptions} options
     *        Connector options. Not calculated or merged with other options.
     *
     * @return {object|undefined}
     *         Calculated SVG path data in array format.
     */
    getPath: function (
        this: Highcharts.Connection,
        options: Highcharts.ConnectorsOptions
    ): (Highcharts.PathfinderAlgorithmResultObject|undefined) {
        var pathfinder = this.pathfinder,
            chart = this.chart,
            algorithm = pathfinder.algorithms[options.type as any],
            chartObstacles = pathfinder.chartObstacles;

        if (typeof algorithm !== 'function') {
            H.error(
                '"' + options.type + '" is not a Pathfinder algorithm.'
            );
            return;
        }

        // This function calculates obstacles on demand if they don't exist
        if (algorithm.requiresObstacles && !chartObstacles) {
            chartObstacles =
                pathfinder.chartObstacles =
                pathfinder.getChartObstacles(options);

            // If the algorithmMargin was computed, store the result in default
            // options.
            (chart.options.connectors as any).algorithmMargin =
                options.algorithmMargin;

            // Cache some metrics too
            pathfinder.chartObstacleMetrics =
                pathfinder.getObstacleMetrics(chartObstacles);
        }

        // Get the SVG path
        return algorithm(
            // From
            this.fromPoint.getPathfinderAnchorPoint(options.startMarker as any),
            // To
            this.toPoint.getPathfinderAnchorPoint(options.endMarker as any),
            merge({
                chartObstacles: chartObstacles,
                lineObstacles: pathfinder.lineObstacles || [],
                obstacleMetrics: pathfinder.chartObstacleMetrics as any,
                hardBounds: {
                    xMin: 0,
                    xMax: chart.plotWidth,
                    yMin: 0,
                    yMax: chart.plotHeight
                },
                obstacleOptions: {
                    margin: options.algorithmMargin
                },
                startDirectionX: pathfinder.getAlgorithmStartDirection(
                    options.startMarker as any
                )
            }, options)
        );
    },

    /**
     * (re)Calculate and (re)draw the connection.
     *
     * @function Highcharts.Connection#render
     */
    render: function (this: Highcharts.Connection): void {
        var connection = this,
            fromPoint = connection.fromPoint,
            series = fromPoint.series,
            chart = series.chart,
            pathfinder = chart.pathfinder,
            pathResult: Highcharts.PathfinderAlgorithmResultObject,
            path: Highcharts.SVGPathArray,
            options = merge(
                chart.options.connectors, series.options.connectors,
                fromPoint.options.connectors, connection.options
            ),
            attribs = {} as Highcharts.SVGAttributes;

        // Set path attribs
        if (!chart.styledMode) {
            attribs.stroke = options.lineColor || fromPoint.color;
            attribs['stroke-width'] = options.lineWidth;
            if (options.dashStyle) {
                attribs.dashstyle = options.dashStyle;
            }
        }

        attribs['class'] = // eslint-disable-line dot-notation
            'highcharts-point-connecting-path ' +
            'highcharts-color-' + fromPoint.colorIndex;
        options = merge(attribs, options);

        // Set common marker options
        if (!defined((options.marker as any).radius)) {
            (options.marker as any).radius = min(max(
                Math.ceil((options.algorithmMargin || 8) / 2) - 1, 1
            ), 5);
        }
        // Get the path
        pathResult = connection.getPath(options);
        path = pathResult.path;

        // Always update obstacle storage with obstacles from this path.
        // We don't know if future calls will need this for their algorithm.
        if (pathResult.obstacles) {
            (pathfinder as any).lineObstacles =
                (pathfinder as any).lineObstacles || [];
            (pathfinder as any).lineObstacles =
                (pathfinder as any).lineObstacles.concat(pathResult.obstacles);
        }

        // Add the calculated path to the pathfinder group
        connection.renderPath(path, attribs, series.options.animation);

        // Render the markers
        connection.addMarker(
            'start',
            merge(options.marker, options.startMarker),
            path
        );
        connection.addMarker(
            'end',
            merge(options.marker, options.endMarker),
            path
        );
    },

    /**
     * Destroy connection by destroying the added graphics elements.
     *
     * @function Highcharts.Connection#destroy
     */
    destroy: function (this: Highcharts.Connection): void {
        if (this.graphics) {
            objectEach(this.graphics, function (
                val: Highcharts.SVGElement
            ): void {
                val.destroy();
            });
            delete this.graphics;
        }
    }
};


/**
 * The Pathfinder class.
 *
 * @private
 * @class
 * @name Highcharts.Pathfinder
 *
 * @param {Highcharts.Chart} chart
 *        The chart to operate on.
 */
function Pathfinder(
    this: Highcharts.Pathfinder,
    chart: Highcharts.Chart
): void {
    this.init(chart);
}
Pathfinder.prototype = {

    /**
     * @name Highcharts.Pathfinder#algorithms
     * @type {Highcharts.Dictionary<Function>}
     */
    algorithms: pathfinderAlgorithms,

    /**
     * Initialize the Pathfinder object.
     *
     * @function Highcharts.Pathfinder#init
     *
     * @param {Highcharts.Chart} chart
     *        The chart context.
     */
    init: function (
        this: Highcharts.Pathfinder,
        chart: Highcharts.Chart
    ): void {
        // Initialize pathfinder with chart context
        this.chart = chart;

        // Init connection reference list
        this.connections = [];

        // Recalculate paths/obstacles on chart redraw
        addEvent(chart, 'redraw', function (): void {
            (this.pathfinder as any).update();
        });
    },

    /**
     * Update Pathfinder connections from scratch.
     *
     * @function Highcharts.Pathfinder#update
     *
     * @param {boolean} [deferRender]
     *        Whether or not to defer rendering of connections until
     *        series.afterAnimate event has fired. Used on first render.
     */
    update: function (
        this: Highcharts.Pathfinder,
        deferRender?: boolean
    ): void {
        var chart = this.chart,
            pathfinder = this,
            oldConnections = pathfinder.connections;

        // Rebuild pathfinder connections from options
        pathfinder.connections = [];
        chart.series.forEach(function (series: Highcharts.Series): void {
            if (series.visible && !series.options.isInternal) {
                series.points.forEach(function (point: Highcharts.Point): void {
                    var to: (
                            Highcharts.Axis|
                            Highcharts.Point|
                            Highcharts.Series|
                            undefined
                        ),
                        connects = (
                            point.options &&
                            point.options.connect &&
                            splat(point.options.connect)
                        );

                    if (point.visible && point.isInside !== false && connects) {
                        connects.forEach(function (
                            connect: (string|Highcharts.Dictionary<string>)
                        ): void {
                            to = chart.get(
                                typeof connect === 'string' ?
                                    connect : connect.to
                            );
                            if (
                                to instanceof H.Point &&
                                to.series.visible &&
                                to.visible &&
                                to.isInside !== false
                            ) {
                                // Add new connection
                                pathfinder.connections.push(
                                    new (Connection as any)(
                                        point, // from
                                        to,
                                        typeof connect === 'string' ?
                                            {} :
                                            connect
                                    )
                                );
                            }
                        });
                    }
                });
            }
        });

        // Clear connections that should not be updated, and move old info over
        // to new connections.
        for (
            var j = 0, k, found, lenOld = oldConnections.length,
                lenNew = pathfinder.connections.length;
            j < lenOld;
            ++j
        ) {
            found = false;
            for (k = 0; k < lenNew; ++k) {
                if (
                    oldConnections[j].fromPoint ===
                        pathfinder.connections[k].fromPoint &&
                    oldConnections[j].toPoint ===
                        pathfinder.connections[k].toPoint
                ) {
                    pathfinder.connections[k].graphics =
                        oldConnections[j].graphics;
                    found = true;
                    break;
                }
            }
            if (!found) {
                oldConnections[j].destroy();
            }
        }

        // Clear obstacles to force recalculation. This must be done on every
        // redraw in case positions have changed. Recalculation is handled in
        // Connection.getPath on demand.
        delete this.chartObstacles;
        delete this.lineObstacles;

        // Draw the pending connections
        pathfinder.renderConnections(deferRender);
    },

    /**
     * Draw the chart's connecting paths.
     *
     * @function Highcharts.Pathfinder#renderConnections
     *
     * @param {boolean} [deferRender]
     *        Whether or not to defer render until series animation is finished.
     *        Used on first render.
     */
    renderConnections: function (
        this: Highcharts.Pathfinder,
        deferRender?: boolean
    ): void {
        if (deferRender) {
            // Render after series are done animating
            this.chart.series.forEach(function (
                series: Highcharts.Series
            ): void {
                var render = function (): void {
                    // Find pathfinder connections belonging to this series
                    // that haven't rendered, and render them now.
                    var pathfinder = series.chart.pathfinder,
                        conns = pathfinder && pathfinder.connections || [];

                    conns.forEach(function (
                        connection: Highcharts.Connection
                    ): void {
                        if (
                            connection.fromPoint &&
                            connection.fromPoint.series === series
                        ) {
                            connection.render();
                        }
                    });
                    if (series.pathfinderRemoveRenderEvent) {
                        series.pathfinderRemoveRenderEvent();
                        delete series.pathfinderRemoveRenderEvent;
                    }
                };

                if (series.options.animation === false) {
                    render();
                } else {
                    series.pathfinderRemoveRenderEvent = addEvent(
                        series, 'afterAnimate', render
                    );
                }
            });
        } else {
            // Go through connections and render them
            this.connections.forEach(function (
                connection: Highcharts.Connection
            ): void {
                connection.render();
            });
        }
    },

    /**
     * Get obstacles for the points in the chart. Does not include connecting
     * lines from Pathfinder. Applies algorithmMargin to the obstacles.
     *
     * @function Highcharts.Pathfinder#getChartObstacles
     *
     * @param {object} options
     *        Options for the calculation. Currenlty only
     *        options.algorithmMargin.
     *
     * @return {Array<object>}
     *         An array of calculated obstacles. Each obstacle is defined as an
     *         object with xMin, xMax, yMin and yMax properties.
     */
    getChartObstacles: function (
        this: Highcharts.Pathfinder,
        options: { algorithmMargin?: number }
    ): Array<any> {
        var obstacles = [],
            series = this.chart.series,
            margin = pick(options.algorithmMargin, 0),
            calculatedMargin: number;

        for (var i = 0, sLen = series.length; i < sLen; ++i) {
            if (series[i].visible && !series[i].options.isInternal) {
                for (
                    var j = 0, pLen = series[i].points.length, bb, point;
                    j < pLen;
                    ++j
                ) {
                    point = series[i].points[j];
                    if (point.visible) {
                        bb = getPointBB(point);
                        if (bb) {
                            obstacles.push({
                                xMin: bb.xMin - margin,
                                xMax: bb.xMax + margin,
                                yMin: bb.yMin - margin,
                                yMax: bb.yMax + margin
                            });
                        }
                    }
                }
            }
        }

        // Sort obstacles by xMin for optimization
        obstacles = obstacles.sort(function (a: any, b: any): number {
            return a.xMin - b.xMin;
        });

        // Add auto-calculated margin if the option is not defined
        if (!defined(options.algorithmMargin)) {
            calculatedMargin =
                options.algorithmMargin =
                calculateObstacleMargin(obstacles);
            obstacles.forEach(function (obstacle: any): void {
                obstacle.xMin -= calculatedMargin;
                obstacle.xMax += calculatedMargin;
                obstacle.yMin -= calculatedMargin;
                obstacle.yMax += calculatedMargin;
            });
        }

        return obstacles;
    },

    /**
     * Utility function to get metrics for obstacles:
     * - Widest obstacle width
     * - Tallest obstacle height
     *
     * @function Highcharts.Pathfinder#getObstacleMetrics
     *
     * @param {Array<object>} obstacles
     *        An array of obstacles to inspect.
     *
     * @return {object}
     *         The calculated metrics, as an object with maxHeight and maxWidth
     *         properties.
     */
    getObstacleMetrics: function (
        this: Highcharts.Pathfinder,
        obstacles: Array<any>
    ): Highcharts.Dictionary<number> {
        var maxWidth = 0,
            maxHeight = 0,
            width,
            height,
            i = obstacles.length;

        while (i--) {
            width = obstacles[i].xMax - obstacles[i].xMin;
            height = obstacles[i].yMax - obstacles[i].yMin;
            if (maxWidth < width) {
                maxWidth = width;
            }
            if (maxHeight < height) {
                maxHeight = height;
            }
        }

        return {
            maxHeight: maxHeight,
            maxWidth: maxWidth
        };
    },

    /**
     * Utility to get which direction to start the pathfinding algorithm
     * (X vs Y), calculated from a set of marker options.
     *
     * @function Highcharts.Pathfinder#getAlgorithmStartDirection
     *
     * @param {Highcharts.ConnectorsMarkerOptions} markerOptions
     *        Marker options to calculate from.
     *
     * @return {boolean}
     *         Returns true for X, false for Y, and undefined for autocalculate.
     */
    getAlgorithmStartDirection: function (
        this: Highcharts.Pathfinder,
        markerOptions: Highcharts.ConnectorsMarkerOptions
    ): (boolean|undefined) {
        var xCenter = markerOptions.align !== 'left' &&
                        markerOptions.align !== 'right',
            yCenter = markerOptions.verticalAlign !== 'top' &&
                        markerOptions.verticalAlign !== 'bottom',
            undef;

        return xCenter ?
            (yCenter ? undef : false) : // x is centered
            (yCenter ? true : undef); // x is off-center
    }
};

// Add to Highcharts namespace
H.Connection = Connection as any;
H.Pathfinder = Pathfinder as any;


// Add pathfinding capabilities to Points
extend(H.Point.prototype, /** @lends Point.prototype */ {

    /**
     * Get coordinates of anchor point for pathfinder connection.
     *
     * @private
     * @function Highcharts.Point#getPathfinderAnchorPoint
     *
     * @param {Highcharts.ConnectorsMarkerOptions} markerOptions
     *        Connection options for position on point.
     *
     * @return {Highcharts.PositionObject}
     *         An object with x/y properties for the position. Coordinates are
     *         in plot values, not relative to point.
     */
    getPathfinderAnchorPoint: function (
        this: Highcharts.Point,
        markerOptions: Highcharts.ConnectorsMarkerOptions
    ): Highcharts.PositionObject {
        var bb = getPointBB(this),
            x,
            y;

        switch (markerOptions.align) { // eslint-disable-line default-case
        case 'right':
            x = 'xMax';
            break;
        case 'left':
            x = 'xMin';
        }

        switch (markerOptions.verticalAlign) { // eslint-disable-line default-case
        case 'top':
            y = 'yMin';
            break;
        case 'bottom':
            y = 'yMax';
        }

        return {
            x: x ? (bb as any)[x] : ((bb as any).xMin + (bb as any).xMax) / 2,
            y: y ? (bb as any)[y] : ((bb as any).yMin + (bb as any).yMax) / 2
        };
    },

    /**
     * Utility to get the angle from one point to another.
     *
     * @private
     * @function Highcharts.Point#getRadiansToVector
     *
     * @param {Highcharts.PositionObject} v1
     *        The first vector, as an object with x/y properties.
     *
     * @param {Highcharts.PositionObject} v2
     *        The second vector, as an object with x/y properties.
     *
     * @return {number}
     *         The angle in degrees
     */
    getRadiansToVector: function (
        this: Highcharts.Point,
        v1: Highcharts.PositionObject,
        v2: Highcharts.PositionObject
    ): number {
        var box: (Highcharts.Dictionary<number>|null);

        if (!defined(v2)) {
            box = getPointBB(this);
            v2 = {
                x: ((box as any).xMin + (box as any).xMax) / 2,
                y: ((box as any).yMin + (box as any).yMax) / 2
            };
        }
        return Math.atan2(v2.y - v1.y, v1.x - v2.x);
    },

    /**
     * Utility to get the position of the marker, based on the path angle and
     * the marker's radius.
     *
     * @private
     * @function Highcharts.Point#getMarkerVector
     *
     * @param {number} radians
     *        The angle in radians from the point center to another vector.
     *
     * @param {number} markerRadius
     *        The radius of the marker, to calculate the additional distance to
     *        the center of the marker.
     *
     * @param {object} anchor
     *        The anchor point of the path and marker as an object with x/y
     *        properties.
     *
     * @return {object}
     *         The marker vector as an object with x/y properties.
     */
    getMarkerVector: function (
        this: Highcharts.Point,
        radians: number,
        markerRadius: number,
        anchor: Highcharts.PositionObject
    ): Highcharts.PositionObject {
        var twoPI = Math.PI * 2.0,
            theta = radians,
            bb = getPointBB(this),
            rectWidth = (bb as any).xMax - (bb as any).xMin,
            rectHeight = (bb as any).yMax - (bb as any).yMin,
            rAtan = Math.atan2(rectHeight, rectWidth),
            tanTheta = 1,
            leftOrRightRegion = false,
            rectHalfWidth = rectWidth / 2.0,
            rectHalfHeight = rectHeight / 2.0,
            rectHorizontalCenter = (bb as any).xMin + rectHalfWidth,
            rectVerticalCenter = (bb as any).yMin + rectHalfHeight,
            edgePoint = {
                x: rectHorizontalCenter,
                y: rectVerticalCenter
            },
            markerPoint = {} as Highcharts.PositionObject,
            xFactor = 1,
            yFactor = 1;

        while (theta < -Math.PI) {
            theta += twoPI;
        }

        while (theta > Math.PI) {
            theta -= twoPI;
        }

        tanTheta = Math.tan(theta);

        if ((theta > -rAtan) && (theta <= rAtan)) {
            // Right side
            yFactor = -1;
            leftOrRightRegion = true;
        } else if (theta > rAtan && theta <= (Math.PI - rAtan)) {
            // Top side
            yFactor = -1;
        } else if (theta > (Math.PI - rAtan) || theta <= -(Math.PI - rAtan)) {
            // Left side
            xFactor = -1;
            leftOrRightRegion = true;
        } else {
            // Bottom side
            xFactor = -1;
        }

        // Correct the edgePoint according to the placement of the marker
        if (leftOrRightRegion) {
            edgePoint.x += xFactor * (rectHalfWidth);
            edgePoint.y += yFactor * (rectHalfWidth) * tanTheta;
        } else {
            edgePoint.x += xFactor * (rectHeight / (2.0 * tanTheta));
            edgePoint.y += yFactor * (rectHalfHeight);
        }

        if (anchor.x !== rectHorizontalCenter) {
            edgePoint.x = anchor.x;
        }
        if (anchor.y !== rectVerticalCenter) {
            edgePoint.y = anchor.y;
        }

        markerPoint.x = edgePoint.x + (markerRadius * Math.cos(theta));
        markerPoint.y = edgePoint.y - (markerRadius * Math.sin(theta));

        return markerPoint;
    }
});


/**
 * Warn if using legacy options. Copy the options over. Note that this will
 * still break if using the legacy options in chart.update, addSeries etc.
 * @private
 */
function warnLegacy(chart: Highcharts.Chart): void {
    if (
        (chart.options as any).pathfinder ||
        chart.series.reduce(function (
            acc: boolean,
            series: Highcharts.Series
        ): boolean {
            if (series.options) {
                merge(
                    true,
                    (
                        series.options.connectors = series.options.connectors ||
                        {}
                    ), (series.options as any).pathfinder
                );
            }
            return acc || series.options && (series.options as any).pathfinder;
        }, false)
    ) {
        merge(
            true,
            (chart.options.connectors = chart.options.connectors || {}),
            (chart.options as any).pathfinder
        );
        H.error('WARNING: Pathfinder options have been renamed. ' +
            'Use "chart.connectors" or "series.connectors" instead.');
    }
}


// Initialize Pathfinder for charts
H.Chart.prototype.callbacks.push(function (
    this: Highcharts.Chart,
    chart: Highcharts.Chart
): void {
    var options = chart.options;

    if ((options.connectors as any).enabled !== false) {
        warnLegacy(chart);
        this.pathfinder = new (Pathfinder as any)(this);
        (this.pathfinder as any).update(true); // First draw, defer render
    }
});
