/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import log from "../../../../log";
import { createIndexURL, getInitSegment, getTimescaledRange, } from "./helpers";
/**
 * Provide helpers for SegmentList-based DASH indexes.
 * @type {Object}
 */
var ListRepresentationIndex = /** @class */ (function () {
    /**
     * @param {Object} index
     * @param {Object} context
     */
    function ListRepresentationIndex(index, context) {
        var periodStart = context.periodStart, representationBaseURL = context.representationBaseURL, representationId = context.representationId, representationBitrate = context.representationBitrate;
        this._periodStart = periodStart;
        var presentationTimeOffset = index.presentationTimeOffset != null ?
            index.presentationTimeOffset : 0;
        var indexTimeOffset = presentationTimeOffset - periodStart * index.timescale;
        this._index = {
            list: index.list.map(function (lItem) { return ({
                mediaURL: createIndexURL(representationBaseURL, lItem.media, representationId, representationBitrate),
                mediaRange: lItem.mediaRange,
            }); }),
            timescale: index.timescale,
            duration: index.duration,
            indexTimeOffset: indexTimeOffset,
            indexRange: index.indexRange,
            initialization: index.initialization && {
                mediaURL: createIndexURL(representationBaseURL, index.initialization.media, representationId, representationBitrate),
                range: index.initialization.range,
            },
        };
    }
    /**
     * Construct init Segment.
     * @returns {Object}
     */
    ListRepresentationIndex.prototype.getInitSegment = function () {
        return getInitSegment(this._index);
    };
    /**
     * @param {Number} fromTime
     * @param {Number} duration
     * @returns {Array.<Object>}
     */
    ListRepresentationIndex.prototype.getSegments = function (fromTime, dur) {
        var index = this._index;
        var fromTimeInPeriod = fromTime + this._periodStart;
        var _a = getTimescaledRange(index, fromTimeInPeriod, dur), up = _a.up, to = _a.to;
        var duration = index.duration, list = index.list, timescale = index.timescale;
        var length = Math.min(list.length - 1, Math.floor(to / duration));
        var segments = [];
        var i = Math.floor(up / duration);
        while (i <= length) {
            var range = list[i].mediaRange;
            var mediaURL = list[i].mediaURL;
            var args = {
                id: "" + i,
                time: i * duration,
                isInit: false,
                range: range,
                duration: duration,
                timescale: timescale,
                mediaURL: mediaURL,
                timestampOffset: -(index.indexTimeOffset / timescale),
            };
            segments.push(args);
            i++;
        }
        return segments;
    };
    /**
     * Returns true if, based on the arguments, the index should be refreshed.
     * (If we should re-fetch the manifest)
     * @param {Number} _fromTime
     * @param {Number} toTime
     * @returns {Boolean}
     */
    ListRepresentationIndex.prototype.shouldRefresh = function (_fromTime, toTime) {
        var _a = this._index, timescale = _a.timescale, duration = _a.duration, list = _a.list;
        var scaledTo = toTime * timescale;
        var i = Math.floor(scaledTo / duration);
        return !(i >= 0 && i < list.length);
    };
    /**
     * Returns first position in index.
     * @returns {Number}
     */
    ListRepresentationIndex.prototype.getFirstPosition = function () {
        return this._periodStart;
    };
    /**
     * Returns last position in index.
     * @returns {Number}
     */
    ListRepresentationIndex.prototype.getLastPosition = function () {
        var index = this._index;
        var duration = index.duration, list = index.list;
        return ((list.length * duration) / index.timescale) + this._periodStart;
    };
    /**
     * We do not check for discontinuity in SegmentList-based indexes.
     * @returns {Number}
     */
    ListRepresentationIndex.prototype.checkDiscontinuity = function () {
        return -1;
    };
    /**
     * @param {Object} newIndex
     */
    ListRepresentationIndex.prototype._update = function (newIndex) {
        this._index = newIndex._index;
    };
    /**
     * We do not have to add new segments to SegmentList-based indexes.
     * @returns {Array}
     */
    ListRepresentationIndex.prototype._addSegments = function () {
        if (__DEV__) {
            log.warn("Tried to add Segments to a list RepresentationIndex");
        }
    };
    return ListRepresentationIndex;
}());
export default ListRepresentationIndex;
