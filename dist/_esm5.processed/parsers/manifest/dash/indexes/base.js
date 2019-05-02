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
import { createIndexURL, fromIndexTime, getIndexSegmentEnd, getInitSegment, getSegmentsFromTimeline, } from "./helpers";
/**
 * Add a new segment to the index.
 *
 * /!\ Mutate the given index
 * @param {Object} index
 * @param {Object} segmentInfos
 * @returns {Boolean} - true if the segment has been added
 */
function _addSegmentInfos(index, segmentInfos) {
    if (segmentInfos.timescale !== index.timescale) {
        var timescale = index.timescale;
        index.timeline.push({
            start: (segmentInfos.time / segmentInfos.timescale) * timescale,
            duration: (segmentInfos.duration / segmentInfos.timescale) * timescale,
            repeatCount: segmentInfos.count || 0,
            range: segmentInfos.range,
        });
    }
    else {
        index.timeline.push({
            start: segmentInfos.time,
            duration: segmentInfos.duration,
            repeatCount: segmentInfos.count || 0,
            range: segmentInfos.range,
        });
    }
    return true;
}
/**
 * Provide helpers for SegmentBase-based indexes.
 * @type {Object}
 */
var BaseRepresentationIndex = /** @class */ (function () {
    /**
     * @param {Object} index
     * @param {Object} context
     */
    function BaseRepresentationIndex(index, context) {
        var periodStart = context.periodStart, periodEnd = context.periodEnd, representationBaseURL = context.representationBaseURL, representationId = context.representationId, representationBitrate = context.representationBitrate;
        var timescale = index.timescale;
        var presentationTimeOffset = index.presentationTimeOffset != null ?
            index.presentationTimeOffset : 0;
        var indexTimeOffset = presentationTimeOffset - periodStart * timescale;
        this._index = {
            duration: index.duration,
            indexRange: index.indexRange,
            indexTimeOffset: indexTimeOffset,
            initialization: index.initialization && {
                mediaURL: createIndexURL(representationBaseURL, index.initialization.media, representationId, representationBitrate),
                range: index.initialization.range,
            },
            mediaURL: createIndexURL(representationBaseURL, index.media, representationId, representationBitrate),
            startNumber: index.startNumber,
            timeline: index.timeline,
            timelineEnd: periodEnd == null ? undefined : periodEnd * timescale,
            timescale: timescale,
        };
    }
    /**
     * Construct init Segment.
     * @returns {Object}
     */
    BaseRepresentationIndex.prototype.getInitSegment = function () {
        return getInitSegment(this._index);
    };
    /**
     * @param {Number} _up
     * @param {Number} _to
     * @returns {Array.<Object>}
     */
    BaseRepresentationIndex.prototype.getSegments = function (_up, _to) {
        return getSegmentsFromTimeline(this._index, _up, _to);
    };
    /**
     * Returns false as no Segment-Base based index should need to be refreshed.
     * @returns {Boolean}
     */
    BaseRepresentationIndex.prototype.shouldRefresh = function () {
        return false;
    };
    /**
     * Returns first position in index.
     * @returns {Number|undefined}
     */
    BaseRepresentationIndex.prototype.getFirstPosition = function () {
        var index = this._index;
        if (index.timeline.length === 0) {
            return undefined;
        }
        return fromIndexTime(index, index.timeline[0].start);
    };
    /**
     * Returns last position in index.
     * @returns {Number|undefined}
     */
    BaseRepresentationIndex.prototype.getLastPosition = function () {
        var _a = this._index, timeline = _a.timeline, timelineEnd = _a.timelineEnd;
        if (timeline.length === 0) {
            return undefined;
        }
        var lastTimelineElement = timeline[timeline.length - 1];
        var lastTime = getIndexSegmentEnd(lastTimelineElement, null, timelineEnd);
        return fromIndexTime(this._index, lastTime);
    };
    /**
     * We do not check for discontinuity in SegmentBase-based indexes.
     * @returns {Number}
     */
    BaseRepresentationIndex.prototype.checkDiscontinuity = function () {
        return -1;
    };
    /**
     * @param {Array.<Object>} nextSegments
     * @returns {Array.<Object>}
     */
    BaseRepresentationIndex.prototype._addSegments = function (nextSegments) {
        for (var i = 0; i < nextSegments.length; i++) {
            _addSegmentInfos(this._index, nextSegments[i]);
        }
    };
    /**
     * @param {Object} newIndex
     */
    BaseRepresentationIndex.prototype._update = function (newIndex) {
        this._index = newIndex._index;
    };
    return BaseRepresentationIndex;
}());
export default BaseRepresentationIndex;
