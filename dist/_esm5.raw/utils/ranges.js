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
/**
 * This file contains functions helping with TimeRanges management.
 *
 * For simplicity/performance reasons, many of those work with a simplified
 * "Range" object, which is an object with two keys:
 *   - start {Number}
 *   - end {Number}
 *
 * Those two corresponds to what is returned by the start and end methods of a
 * TimeRanges Object.
 *
 * You can convert from TimeRanges to Range object(s) with the getRange/
 * convertToRanges methods.
 */
// Factor for rounding errors
var EPSILON = 1 / 60;
/**
 * Check equality with a tolerance of EPSILON.
 * Used for various functions with this sort of tolerance regarding the
 * start/end of contiguous ranges.
 * @param {Number} a
 * @param {Number} b
 * @returns {Boolean}
 */
function nearlyEqual(a, b) {
    return Math.abs(a - b) < EPSILON;
}
/**
 * Construct a new range which will have, as start/end, the min/max
 * of both the range given, and the given bitrate.
 * @param {Object} range1
 * @param {Object} range2
 * @returns {Object}
 */
function createRangeUnion(range1, range2) {
    var start = Math.min(range1.start, range2.start);
    var end = Math.max(range1.end, range2.end);
    return { start: start, end: end };
}
/**
 * Clean array ranges from "empty" ranges.
 * That is, range objects which have their start equal to their end.
 * /!\ Mutate the array of ranges.
 * @param {Array<Object>} ranges
 * @returns {Array<Object>}
 */
function removeEmptyRanges(ranges) {
    for (var index = 0; index < ranges.length; index++) {
        var range = ranges[index];
        if (range.start === range.end) {
            ranges.splice(index++, 1);
        }
    }
    return ranges;
}
/**
 * /!\ Mutate the array of ranges.
 * @param {Array<Object>} ranges
 * @returns {Array<Object>}
 */
function mergeContiguousRanges(ranges) {
    for (var index = 1; index < ranges.length; index++) {
        var prevRange = ranges[index - 1];
        var currRange = ranges[index];
        if (areRangesNearlyContiguous(prevRange, currRange)) {
            var unionRange = createRangeUnion(prevRange, currRange);
            ranges.splice(--index, 2, unionRange);
        }
    }
    return ranges;
}
/**
 * True if range1 is considered _after_ range2.
 * @param {Object} range1
 * @param {Object} range2
 * @returns {Boolean}
 */
function isAfter(range1, range2) {
    return range1.start >= range2.end;
}
/**
 * True if range1 is considered _before_ range2.
 * @param {Object} range1
 * @param {Object} range2
 * @returns {Boolean}
 */
function isBefore(range1, range2) {
    return range1.end <= range2.start;
}
/**
 * Returns true if the time given can be considered as part of the given range.
 * @param {Object} range1
 * @param {Number} Time
 * @returns {Boolean}
 */
function isTimeInRange(_a, time) {
    var start = _a.start, end = _a.end;
    return start <= time && time < end;
}
/**
 * Returns true if the two ranges given are overlapping.
 * @param {Object} range1
 * @param {Object} range2
 * @returns {Boolean}
 */
function areRangesOverlapping(range1, range2) {
    return isTimeInRange(range1, range2.start) ||
        range1.start < range2.end && range2.end < range1.end ||
        isTimeInRange(range2, range1.start);
}
/**
 * Returns true if the two ranges given can be considered contiguous.
 * @param {Object} range1
 * @param {Object} range2
 * @returns {Boolean}
 */
function areRangesNearlyContiguous(range1, range2) {
    return nearlyEqual(range2.start, range1.end) ||
        nearlyEqual(range2.end, range1.start);
}
/**
 * Convert from a TimeRanges object to an array of Ranges.
 * @param {TimeRanges} timeRanges
 * @returns {Array.<Object>}
 */
function convertToRanges(timeRanges) {
    var ranges = [];
    for (var i = 0; i < timeRanges.length; i++) {
        ranges.push({
            start: timeRanges.start(i),
            end: timeRanges.end(i),
        });
    }
    return ranges;
}
/**
 * Get range object of a specific time in a TimeRanges object.
 * @param {TimeRanges} timeRanges
 * @returns {Object}
 */
function getRange(timeRanges, time) {
    for (var i = timeRanges.length - 1; i >= 0; i--) {
        var start = timeRanges.start(i);
        if (time >= start) {
            var end = timeRanges.end(i);
            if (time < end) {
                return {
                    start: start,
                    end: end,
                };
            }
        }
    }
    return null;
}
/**
 * Get gap from a specific time until the start of the next Range.
 * @param {TimeRanges} timeRanges
 * @param {Number} time
 * @returns {Number}
 */
function getNextRangeGap(timeRanges, time) {
    var len = timeRanges.length;
    for (var i = 0; i < len; i++) {
        var start = timeRanges.start(i);
        if (time < start) {
            return start - time;
        }
    }
    return Infinity;
}
/**
 * @param {TimeRanges} timeRanges
 * @param {Number} time
 * @returns {Object} - Object with two properties:
 *   - outerRanges {Array.<Object>}: every ranges which does not contain the
 *     given time.
 *   - innerRange {Object|null}: the range which contain the given time.
 */
function getInnerAndOuterTimeRanges(timeRanges, time) {
    var innerRange = null;
    var outerRanges = [];
    for (var i = 0; i < timeRanges.length; i++) {
        var start = timeRanges.start(i);
        var end = timeRanges.end(i);
        if (time < start || time >= end) {
            outerRanges.push({ start: start, end: end });
        }
        else {
            innerRange = { start: start, end: end };
        }
    }
    return { outerRanges: outerRanges, innerRange: innerRange };
}
/**
 * Get "size" (difference between end and start) of the range containing the
 * given time. 0 if the range is not found.
 * @param {TimeRanges} timeRanges
 * @param {Number} currentTime
 * @returns {Number}
 */
function getSizeOfRange(timeRanges, currentTime) {
    var range = getRange(timeRanges, currentTime);
    return range
        ? range.end - range.start
        : 0;
}
/**
 * Get "currently played" (difference between time given and start) of the
 * range containing the given time. 0 if the range is not found.
 * @param {TimeRanges} timeRanges
 * @param {Number} currentTime
 * @returns {Number}
 */
function getPlayedSizeOfRange(timeRanges, currentTime) {
    var range = getRange(timeRanges, currentTime);
    return range
        ? currentTime - range.start
        : 0;
}
/**
 * Get "left to play" (difference between end and time given) of the range
 * containing the given time. Infinity if the range is not found.
 * @param {TimeRanges} timeRanges
 * @param {Number} currentTime
 * @returns {Number}
 */
function getLeftSizeOfRange(timeRanges, currentTime) {
    var range = getRange(timeRanges, currentTime);
    return range
        ? range.end - currentTime
        : Infinity;
}
/**
 * Insert a range object into an array of ranges objects, at the right place.
 * /!\ Mutate the array of ranges.
 * @param {Array.<Object>} ranges
 * @param {Object} rangeToAddArg
 * @returns {Array.<Object>}
 */
function insertInto(ranges, rangeToAddArg) {
    if (rangeToAddArg.start === rangeToAddArg.end) {
        return ranges;
    }
    var rangeToAdd = rangeToAddArg;
    // For each present range check if we need to:
    // - In case we are overlapping or contiguous:
    //   - if added range has the same bitrate as the overlapped or
    //     contiguous one, we can merge themcurrentRange
    //   - if added range has a different bitrate we need to insert it
    //     in place
    // - Need to insert in place, we we are completely, not overlapping
    //   and not contiguous in between two ranges.
    var index = 0;
    for (; index < ranges.length; index++) {
        var range = ranges[index];
        var overlapping = areRangesOverlapping(rangeToAdd, range);
        var contiguous = areRangesNearlyContiguous(rangeToAdd, range);
        // We assume ranges are ordered and two ranges can not be
        // completely overlapping.
        if (overlapping || contiguous) {
            rangeToAdd = createRangeUnion(rangeToAdd, range);
            ranges.splice(index--, 1);
        }
        else {
            // Check the case for which there is no more to do
            if (index === 0) {
                if (isBefore(rangeToAdd, ranges[0])) {
                    // First index, and we are completely before that range (and
                    // not contiguous, nor overlapping). We just need to be
                    // inserted here.
                    break;
                }
            }
            else {
                if (isBefore(ranges[index - 1], rangeToAdd)
                    && isBefore(rangeToAdd, range)) {
                    // We are exactly after the current previous range, and
                    // before the current range, while not overlapping with none
                    // of them. Insert here.
                    break;
                }
            }
        }
    }
    // Now that we are sure we don't overlap with any range, just add it.
    ranges.splice(index, 0, rangeToAdd);
    return mergeContiguousRanges(removeEmptyRanges(ranges));
}
/**
 * Returns range, from a range objects array overlapping with a range given
 * in argument. null if none is found.
 * @param {Object} range
 * @param {Array.<Object>} ranges
 * @returns {Array.<Object>}
 */
function findOverlappingRanges(range, ranges) {
    var resultingRanges = [];
    for (var i = 0; i < ranges.length; i++) {
        if (areRangesOverlapping(range, ranges[i])) {
            resultingRanges.push(ranges[i]);
        }
    }
    return resultingRanges;
}
/**
 * Returns only the intersection between the two ranges, from the first
 * ranges argument given.
 * @param {Array.<Range>} ranges1
 * @param {Array.<Range>} ranges2
 * @returns {Array.<Range>}
 */
function keepRangeIntersection(ranges1, ranges2) {
    var result = [];
    for (var i = 0; i < ranges1.length; i++) {
        var range = ranges1[i];
        var overlappingRanges = findOverlappingRanges(range, ranges2);
        if (overlappingRanges.length) {
            for (var j = 0; j < overlappingRanges.length; j++) {
                var overlappingRange = overlappingRanges[j];
                result.push({
                    start: Math.max(range.start, overlappingRange.start),
                    end: Math.min(range.end, overlappingRange.end),
                });
            }
        }
    }
    return result;
}
export { convertToRanges, getInnerAndOuterTimeRanges, getLeftSizeOfRange, getNextRangeGap, getPlayedSizeOfRange, getRange, getSizeOfRange, insertInto, isAfter, isBefore, isTimeInRange, keepRangeIntersection, mergeContiguousRanges, removeEmptyRanges, };
