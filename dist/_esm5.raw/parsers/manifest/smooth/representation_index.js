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
import log from "../../../log";
import { replaceSegmentSmoothTokens } from "./utils/tokens";
/**
 * Add a new segment to the index.
 *
 * /!\ Mutate the given index
 * @param {Object} index
 * @param {Object} newSegment
 * @param {Object} currentSegment
 * @returns {Boolean} - true if the segment has been added
 */
function _addSegmentInfos(index, newSegment, currentSegment) {
    var timeline = index.timeline, timescale = index.timescale;
    var timelineLength = timeline.length;
    var last = timeline[timelineLength - 1];
    var scaledNewSegment = newSegment.timescale === timescale ? {
        time: newSegment.time,
        duration: newSegment.duration,
    } : {
        time: (newSegment.time / newSegment.timescale) * timescale,
        duration: (newSegment.duration / newSegment.timescale) * timescale,
    };
    var scaledCurrentTime;
    if (currentSegment && currentSegment.timescale) {
        scaledCurrentTime = currentSegment.timescale === timescale ?
            currentSegment.time :
            (currentSegment.time / currentSegment.timescale) * timescale;
    }
    // in some circumstances, the new segment informations are only
    // duration informations that we can use to deduct the start of the
    // next segment. this is the case where the new segment are
    // associated to a current segment and have the same start
    var shouldDeductNextSegment = scaledCurrentTime != null &&
        (scaledNewSegment.time === scaledCurrentTime);
    if (shouldDeductNextSegment) {
        var newSegmentStart = scaledNewSegment.time + scaledNewSegment.duration;
        var lastSegmentStart = (last.start + (last.duration || 0) * last.repeatCount);
        var startDiff = newSegmentStart - lastSegmentStart;
        if (startDiff <= 0) { // same segment / behind the last
            return false;
        }
        // try to use the compact notation with @r attribute on the last
        // to elements of the timeline if we find out they have the same
        // duration
        if (last.duration === -1) {
            var prev = timeline[timelineLength - 2];
            if (prev && prev.duration === startDiff) {
                prev.repeatCount++;
                timeline.pop();
            }
            else {
                last.duration = startDiff;
            }
        }
        index.timeline.push({
            duration: -1,
            start: newSegmentStart,
            repeatCount: 0,
        });
        return true;
    }
    // if the given timing has a timestamp after the timeline end we
    // just need to push a new element in the timeline, or increase
    // the @r attribute of the last element.
    else if (scaledNewSegment.time >= getTimelineRangeEnd(last)) {
        if (last.duration === scaledNewSegment.duration) {
            last.repeatCount++;
        }
        else {
            index.timeline.push({
                duration: scaledNewSegment.duration,
                start: scaledNewSegment.time,
                repeatCount: 0,
            });
        }
        return true;
    }
    return false;
}
/**
 * Get index of the segment containing the given timescaled timestamp.
 * @param {Object} index
 * @param {Number} start
 * @returns {Number}
 */
function getSegmentIndex(index, start) {
    var timeline = index.timeline;
    var low = 0;
    var high = timeline.length;
    while (low < high) {
        var mid = (low + high) >>> 1;
        if (timeline[mid].start < start) {
            low = mid + 1;
        }
        else {
            high = mid;
        }
    }
    return (low > 0)
        ? low - 1
        : low;
}
/**
 * @param {Number} start
 * @param {Number} up
 * @param {Number} duration
 * @returns {Number}
 */
function getSegmentNumber(start, up, duration) {
    if (!duration) {
        return 0;
    }
    var diff = up - start;
    if (diff > 0) {
        return Math.floor(diff / duration);
    }
    else {
        return 0;
    }
}
/**
 * Get end of the given index range, timescaled.
 * @param {Object} range
 * @returns {Number} - absolute end time of the range
 */
function getTimelineRangeEnd(_a) {
    var start = _a.start, duration = _a.duration, repeatCount = _a.repeatCount;
    return (duration == null || duration === -1) ?
        start : start + (repeatCount + 1) * duration;
}
// interface ISmoothIndex {
//   presentationTimeOffset? : number;
//   timescale : number;
//   media? : string;
//   timeline : IIndexSegment[];
//   startNumber? : number;
// }
/**
 * Convert second-based start time and duration to the timescale of the
 * manifest's index.
 * @param {Object} index
 * @param {Number} start
 * @param {Number} duration
 * @returns {Object} - Object with two properties:
 *   - up {Number}: timescaled timestamp of the beginning time
 *   - to {Number}: timescaled timestamp of the end time (start time + duration)
 */
function normalizeRange(index, start, duration) {
    var timescale = index.timescale || 1;
    return {
        up: start * timescale,
        to: (start + duration) * timescale,
    };
}
/**
 * Calculate the number of times a segment repeat based on the next segment.
 * @param {Object} segment
 * @param {Object} nextSegment
 * @returns {Number}
 */
function calculateRepeat(segment, nextSegment) {
    var repeatCount = segment.repeatCount || 0;
    // A negative value of the @r attribute of the S element indicates
    // that the duration indicated in @d attribute repeats until the
    // start of the next S element, the end of the Period or until the
    // next MPD update.
    // TODO Also for SMOOTH????
    if (segment.duration != null && repeatCount < 0) {
        var repeatEnd = nextSegment ? nextSegment.start : Infinity;
        repeatCount = Math.ceil((repeatEnd - segment.start) / segment.duration) - 1;
    }
    return repeatCount;
}
/**
 * RepresentationIndex implementation for Smooth Manifests.
 *
 * Allows to interact with the index to create new Segments.
 *
 * @class SmoothRepresentationIndex
 */
var SmoothRepresentationIndex = /** @class */ (function () {
    function SmoothRepresentationIndex(index, infos) {
        this._index = index;
        this._indexValidityTime = index.manifestReceivedTime || performance.now();
        this._bitsPerSample = infos.bitsPerSample;
        this._channels = infos.channels;
        this._codecPrivateData = infos.codecPrivateData;
        this._packetSize = infos.packetSize;
        this._samplingRate = infos.samplingRate;
        this._protection = infos.protection;
        if (index.timeline.length) {
            var _a = index.timeline[index.timeline.length - 1], start = _a.start, duration = _a.duration;
            this._initialLastPosition = (start + duration) / index.timescale;
        }
    }
    /**
     * Construct init Segment compatible with a Smooth Manifest.
     * @returns {Object}
     */
    SmoothRepresentationIndex.prototype.getInitSegment = function () {
        var index = this._index;
        return {
            id: "init",
            isInit: true,
            time: 0,
            timescale: index.timescale,
            privateInfos: {
                smoothInit: {
                    bitsPerSample: this._bitsPerSample,
                    channels: this._channels,
                    codecPrivateData: this._codecPrivateData,
                    packetSize: this._packetSize,
                    samplingRate: this._samplingRate,
                    protection: this._protection,
                },
            },
            mediaURL: null,
        };
    };
    /**
     * Generate a list of Segments for a particular period of time.
     *
     * @param {Number} _up
     * @param {Number} _to
     * @returns {Array.<Object>}
     */
    SmoothRepresentationIndex.prototype.getSegments = function (_up, _to) {
        var index = this._index;
        var _a = normalizeRange(index, _up, _to), up = _a.up, to = _a.to;
        var timeline = index.timeline, timescale = index.timescale, media = index.media;
        var currentNumber;
        var segments = [];
        var timelineLength = timeline.length;
        // TODO(pierre): use @maxSegmentDuration if possible
        var maxEncounteredDuration = (timeline.length && timeline[0].duration) || 0;
        for (var i = 0; i < timelineLength; i++) {
            var segmentRange = timeline[i];
            var duration = segmentRange.duration, start = segmentRange.start;
            maxEncounteredDuration = Math.max(maxEncounteredDuration, duration || 0);
            // live-added segments have @d attribute equals to -1
            if (duration != null && duration < 0) {
                // what? May be to play it safe and avoid adding segments which are
                // not completely generated
                if (start + maxEncounteredDuration < to) {
                    var time = start;
                    var segment = {
                        id: "" + time,
                        time: time,
                        isInit: false,
                        timescale: timescale,
                        number: currentNumber != null ? currentNumber : undefined,
                        mediaURL: replaceSegmentSmoothTokens(media, time),
                    };
                    segments.push(segment);
                }
                return segments;
            }
            var repeat = calculateRepeat(segmentRange, timeline[i + 1]);
            var segmentNumberInCurrentRange = getSegmentNumber(start, up, duration);
            var segmentTime = start + segmentNumberInCurrentRange *
                (duration == null ? 0 : duration);
            while (segmentTime < to && segmentNumberInCurrentRange <= repeat) {
                var time = segmentTime;
                var number = currentNumber != null ?
                    currentNumber + segmentNumberInCurrentRange : undefined;
                var segment = {
                    id: "" + segmentTime,
                    time: time,
                    isInit: false,
                    duration: duration,
                    timescale: timescale,
                    number: number,
                    mediaURL: replaceSegmentSmoothTokens(media, time),
                };
                segments.push(segment);
                // update segment number and segment time for the next segment
                segmentNumberInCurrentRange++;
                segmentTime = start + segmentNumberInCurrentRange * duration;
            }
            if (segmentTime >= to) {
                // we reached ``to``, we're done
                return segments;
            }
            if (currentNumber != null) {
                currentNumber += repeat + 1;
            }
        }
        return segments;
    };
    /**
     * Returns true if, based on the arguments, the index should be refreshed.
     * (If we should re-fetch the manifest)
     * @param {Number} from
     * @param {Number} to
     * @returns {Boolean}
     */
    SmoothRepresentationIndex.prototype.shouldRefresh = function (up, to) {
        if (!this._index.isLive) {
            return false;
        }
        var _a = this._index, timeline = _a.timeline, timescale = _a.timescale;
        var lastSegmentInCurrentTimeline = timeline[timeline.length - 1];
        if (!lastSegmentInCurrentTimeline) {
            return false;
        }
        var repeat = lastSegmentInCurrentTimeline.repeatCount || 0;
        var endOfLastSegmentInCurrentTimeline = lastSegmentInCurrentTimeline.start + (repeat + 1) *
            lastSegmentInCurrentTimeline.duration;
        if (to * timescale < endOfLastSegmentInCurrentTimeline) {
            return false;
        }
        if (up * timescale >= endOfLastSegmentInCurrentTimeline) {
            return true;
        }
        // ----
        var startOfLastSegmentInCurrentTimeline = lastSegmentInCurrentTimeline.start + repeat *
            lastSegmentInCurrentTimeline.duration;
        return (up * timescale) > startOfLastSegmentInCurrentTimeline;
    };
    /**
     * Returns first position in the index.
     *
     * @param {Object} index
     * @returns {Number}
     */
    SmoothRepresentationIndex.prototype.getFirstPosition = function () {
        var index = this._index;
        if (!index.timeline.length) {
            return undefined;
        }
        return index.timeline[0].start / index.timescale;
    };
    /**
     * Returns last position in the index.
     * @param {Object} index
     * @returns {Number}
     */
    SmoothRepresentationIndex.prototype.getLastPosition = function () {
        var index = this._index;
        if (!index.timeline.length) {
            return undefined;
        }
        var lastTimelineElement = index.timeline[index.timeline.length - 1];
        return (getTimelineRangeEnd(lastTimelineElement) / index.timescale);
    };
    /**
     * Checks if the time given is in a discontinuity. That is:
     *   - We're on the upper bound of the current range (end of the range - time
     *     is inferior to the timescale)
     *   - The next range starts after the end of the current range.
     *
     * @param {Number} _time
     * @returns {Number} - If a discontinuity is present, this is the Starting
     * time for the next (discontinuited) range. If not this is equal to -1.
     */
    SmoothRepresentationIndex.prototype.checkDiscontinuity = function (_time) {
        var index = this._index;
        var timeline = index.timeline, _a = index.timescale, timescale = _a === void 0 ? 1 : _a;
        var time = _time * timescale;
        if (time <= 0) {
            return -1;
        }
        var segmentIndex = getSegmentIndex(index, time);
        if (segmentIndex < 0 || segmentIndex >= timeline.length - 1) {
            return -1;
        }
        var range = timeline[segmentIndex];
        if (range.duration === -1) {
            return -1;
        }
        var rangeUp = range.start;
        var rangeTo = getTimelineRangeEnd(range);
        var nextRange = timeline[segmentIndex + 1];
        // when we are actually inside the found range and this range has
        // an explicit discontinuity with the next one
        if (rangeTo !== nextRange.start &&
            time >= rangeUp &&
            time <= rangeTo &&
            (rangeTo - time) < timescale) {
            return nextRange.start / timescale;
        }
        return -1;
    };
    /**
     * Update this RepresentationIndex by a newly downloaded one.
     * Check if the old index had more informations about new segments and
     * re-add them if that's the case.
     * @param {Object} newIndex
     */
    SmoothRepresentationIndex.prototype._update = function (newIndex) {
        var oldTimeline = this._index.timeline;
        var newTimeline = newIndex._index.timeline;
        var oldTimescale = this._index.timescale;
        var newTimescale = newIndex._index.timescale;
        this._index = newIndex._index;
        this._initialLastPosition = newIndex._initialLastPosition;
        this._indexValidityTime = newIndex._indexValidityTime;
        if (!oldTimeline.length || !newTimeline.length || oldTimescale !== newTimescale) {
            return; // don't take risk, if something is off, take the new one
        }
        var lastOldTimelineElement = oldTimeline[oldTimeline.length - 1];
        var lastNewTimelineElement = newTimeline[newTimeline.length - 1];
        var newEnd = getTimelineRangeEnd(lastNewTimelineElement);
        if (getTimelineRangeEnd(lastOldTimelineElement) <= newEnd) {
            return;
        }
        for (var i = 0; i < oldTimeline.length; i++) {
            var oldTimelineRange = oldTimeline[i];
            var oldEnd = getTimelineRangeEnd(oldTimelineRange);
            if (oldEnd === newEnd) { // just add the supplementary segments
                this._index.timeline = this._index.timeline.concat(oldTimeline.slice(i + 1));
                return;
            }
            if (oldEnd > newEnd) { // adjust repeatCount + add supplementary segments
                if (oldTimelineRange.duration !== lastNewTimelineElement.duration) {
                    return;
                }
                var rangeDuration = newEnd - oldTimelineRange.start;
                if (rangeDuration === 0) {
                    log.warn("Smooth Parser: a discontinuity detected in the previous manifest" +
                        " has been resolved.");
                    this._index.timeline = this._index.timeline.concat(oldTimeline.slice(i));
                    return;
                }
                if (rangeDuration < 0 || rangeDuration % oldTimelineRange.duration !== 0) {
                    return;
                }
                var repeatWithOld = (rangeDuration / oldTimelineRange.duration) - 1;
                var relativeRepeat = oldTimelineRange.repeatCount - repeatWithOld;
                if (relativeRepeat < 0) {
                    return;
                }
                lastNewTimelineElement.repeatCount += relativeRepeat;
                var supplementarySegments = oldTimeline.slice(i + 1);
                this._index.timeline = this._index.timeline.concat(supplementarySegments);
                return;
            }
        }
    };
    SmoothRepresentationIndex.prototype._addSegments = function (nextSegments, currentSegment) {
        for (var i = 0; i < nextSegments.length; i++) {
            _addSegmentInfos(this._index, nextSegments[i], currentSegment);
        }
        // clean segments before time shift buffer depth
        if (this._initialLastPosition != null) {
            var timeShiftBufferDepth = this._index.timeShiftBufferDepth;
            var lastPositionEstimate = (performance.now() - this._indexValidityTime) / 1000 +
                this._initialLastPosition;
            if (timeShiftBufferDepth != null) {
                var threshold = (lastPositionEstimate - timeShiftBufferDepth) * this._index.timescale;
                for (var i = 0; i < this._index.timeline.length; i++) {
                    var segment = this._index.timeline[i];
                    if (segment.start + segment.duration >= threshold) {
                        this._index.timeline =
                            this._index.timeline.slice(i, this._index.timeline.length);
                        break;
                    }
                }
            }
        }
    };
    return SmoothRepresentationIndex;
}());
export default SmoothRepresentationIndex;
