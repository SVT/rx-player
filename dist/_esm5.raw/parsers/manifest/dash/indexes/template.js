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
import { createIndexURL, getInitSegment, getTimescaledRange, replaceSegmentDASHTokens, } from "./helpers";
var TemplateRepresentationIndex = /** @class */ (function () {
    /**
     * @param {Object} index
     * @param {Object} context
     */
    function TemplateRepresentationIndex(index, context) {
        var periodStart = context.periodStart, representationBaseURL = context.representationBaseURL, representationId = context.representationId, representationBitrate = context.representationBitrate;
        this._periodStart = periodStart;
        var presentationTimeOffset = index.presentationTimeOffset != null ?
            index.presentationTimeOffset : 0;
        var indexTimeOffset = presentationTimeOffset - periodStart * index.timescale;
        this._index = {
            duration: index.duration,
            timescale: index.timescale,
            indexRange: index.indexRange,
            indexTimeOffset: indexTimeOffset,
            initialization: index.initialization && {
                mediaURL: createIndexURL(representationBaseURL, index.initialization.media, representationId, representationBitrate),
                range: index.initialization.range,
            },
            mediaURL: createIndexURL(representationBaseURL, index.media, representationId, representationBitrate),
            presentationTimeOffset: presentationTimeOffset,
            startNumber: index.startNumber,
        };
    }
    /**
     * Construct init Segment.
     * @returns {Object}
     */
    TemplateRepresentationIndex.prototype.getInitSegment = function () {
        return getInitSegment(this._index);
    };
    /**
     * @param {Number} fromTime
     * @param {Number} dur
     * @returns {Array.<Object>}
     */
    TemplateRepresentationIndex.prototype.getSegments = function (fromTime, dur) {
        var index = this._index;
        var _a = getTimescaledRange(index, fromTime, dur), up = _a.up, to = _a.to;
        if (to <= up) {
            return [];
        }
        var duration = index.duration, startNumber = index.startNumber, timescale = index.timescale, mediaURL = index.mediaURL;
        var segments = [];
        for (var baseTime = up; baseTime <= to; baseTime += duration) {
            var periodRelativeStart = baseTime - (this._periodStart * timescale);
            var baseNumber = Math.floor((periodRelativeStart / duration));
            var number = baseNumber + (startNumber == null ? 1 : startNumber);
            var manifestTime = (baseNumber * duration) +
                (this._index.presentationTimeOffset || 0);
            var presentationTime = baseNumber * duration +
                this._periodStart * this._index.timescale;
            var args = {
                id: "" + number,
                number: number,
                time: presentationTime,
                isInit: false,
                duration: duration,
                timescale: timescale,
                mediaURL: replaceSegmentDASHTokens(mediaURL, manifestTime, number),
                timestampOffset: -(index.indexTimeOffset / timescale),
            };
            segments.push(args);
        }
        return segments;
    };
    /**
     * Returns first position in index.
     * @returns {undefined}
     */
    TemplateRepresentationIndex.prototype.getFirstPosition = function () {
        return;
    };
    /**
     * Returns last position in index.
     * @returns {undefined}
     */
    TemplateRepresentationIndex.prototype.getLastPosition = function () {
        return;
    };
    /**
     * Returns true if, based on the arguments, the index should be refreshed.
     * We never have to refresh a SegmentTemplate-based manifest.
     * @returns {Boolean}
     */
    TemplateRepresentationIndex.prototype.shouldRefresh = function () {
        return false;
    };
    /**
     * We cannot check for discontinuity in SegmentTemplate-based indexes.
     * @returns {Number}
     */
    TemplateRepresentationIndex.prototype.checkDiscontinuity = function () {
        return -1;
    };
    /**
     * We do not have to add new segments to SegmentList-based indexes.
     * @returns {Array}
     */
    TemplateRepresentationIndex.prototype._addSegments = function () {
        if (__DEV__) {
            log.warn("Tried to add Segments to a template RepresentationIndex");
        }
    };
    /**
     * @param {Object} newIndex
     */
    TemplateRepresentationIndex.prototype._update = function (newIndex) {
        this._index = newIndex._index;
    };
    return TemplateRepresentationIndex;
}());
export default TemplateRepresentationIndex;
