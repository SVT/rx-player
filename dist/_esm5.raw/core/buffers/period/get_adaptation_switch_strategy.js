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
import config from "../../../config";
import { convertToRanges, isTimeInRange, keepRangeIntersection, } from "../../../utils/ranges";
var ADAPTATION_SWITCH_BUFFER_PADDINGS = config.ADAPTATION_SWITCH_BUFFER_PADDINGS;
/**
 * Find out what to do when switching adaptation, based on the current
 * situation.
 * @param {TimeRanges} buffered
 * @param {Object} period
 * @param {string} bufferType
 * @param {Object} clockTick
 * @returns {Object}
 */
export default function getAdaptationSwitchStrategy(buffered, period, bufferType, clockTick) {
    if (!buffered.length) {
        return { type: "continue", value: undefined };
    }
    var bufferedRanges = convertToRanges(buffered);
    var start = period.start;
    var end = period.end || Infinity;
    var intersection = keepRangeIntersection(bufferedRanges, [{ start: start, end: end }]);
    if (!intersection.length) {
        return { type: "continue", value: undefined };
    }
    var currentTime = clockTick.currentTime;
    if (bufferType === "video" &&
        clockTick.readyState > 1 &&
        isTimeInRange({ start: start, end: end }, currentTime)) {
        return { type: "needs-reload", value: undefined };
    }
    var paddingBefore = ADAPTATION_SWITCH_BUFFER_PADDINGS[bufferType].before || 0;
    var paddingAfter = ADAPTATION_SWITCH_BUFFER_PADDINGS[bufferType].after || 0;
    if (!paddingAfter && !paddingBefore ||
        (currentTime - paddingBefore) >= end ||
        (currentTime + paddingAfter) <= start) {
        return { type: "clean-buffer", value: [{ start: start, end: end }] };
    }
    if (currentTime - paddingBefore <= start) {
        return {
            type: "clean-buffer",
            value: [{ start: currentTime + paddingAfter, end: end }],
        };
    }
    if (currentTime + paddingAfter >= end) {
        return {
            type: "clean-buffer",
            value: [{ start: start, end: currentTime - paddingBefore }],
        };
    }
    return {
        type: "clean-buffer",
        value: [
            { start: start, end: currentTime - paddingBefore },
            { start: currentTime + paddingAfter, end: end },
        ],
    };
}
