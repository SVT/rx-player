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
import assert from "../../utils/assert";
import { getDurationFromTrun, getTrackFragmentDecodeTime, } from "../../parsers/containers/isobmff";
/**
 * Get precize start and duration of a segment from ISOBMFF.
 *   1. get start from tfdt
 *   2. get duration from trun
 *   3. if at least one is missing, get both informations from sidx
 *   4. As a fallback take segment infos.
 * @param {Object} segment
 * @param {UInt8Array} buffer - The entire isobmff container
 * @param {Array.<Object>|undefined} sidxSegments - Segments from sidx. Here
 * pre-parsed for performance reasons as it is usually available when
 * this function is called.
 * @param {Object} initInfos
 * @returns {Object}
 */
function getISOBMFFTimingInfos(segment, buffer, sidxSegments, initInfos) {
    var _sidxSegments = sidxSegments || [];
    var startTime;
    var duration;
    var baseDecodeTime = getTrackFragmentDecodeTime(buffer);
    var trunDuration = getDurationFromTrun(buffer);
    var timescale = initInfos && initInfos.timescale ?
        initInfos.timescale : segment.timescale;
    // we could always make a mistake when reading a container.
    // If the estimate is too far from what the segment seems to imply, take
    // the segment infos instead.
    var maxDecodeTimeDelta;
    // Scaled start time and duration as announced in the segment data
    var segmentDuration;
    var segmentStart;
    if (timescale === segment.timescale) {
        maxDecodeTimeDelta = Math.min(timescale * 0.9, segment.duration != null ? segment.duration / 4 : 0.25);
        segmentStart = segment.time;
        segmentDuration = segment.duration;
    }
    else {
        maxDecodeTimeDelta = Math.min(timescale * 0.9, segment.duration != null ?
            ((segment.duration / segment.timescale) * timescale) / 4 : 0.25);
        segmentStart = ((segment.time || 0) / segment.timescale) * timescale;
        segmentDuration = segment.duration != null ?
            (segment.duration / segment.timescale) * timescale : undefined;
    }
    if (baseDecodeTime >= 0) {
        startTime = segment.timestampOffset != null ?
            baseDecodeTime + (segment.timestampOffset * timescale) :
            baseDecodeTime;
    }
    if (trunDuration >= 0 &&
        (segmentDuration == null ||
            Math.abs(trunDuration - segmentDuration) <= maxDecodeTimeDelta)) {
        duration = trunDuration;
    }
    if (startTime == null) {
        if (_sidxSegments.length === 0) {
            startTime = segmentStart;
        }
        else {
            var sidxStart = _sidxSegments[0].time;
            if (sidxStart >= 0) {
                var sidxTimescale = _sidxSegments[0].timescale;
                var baseStartTime = sidxTimescale != null && sidxTimescale !== timescale ?
                    (sidxStart / sidxTimescale) * timescale : sidxStart;
                startTime = segment.timestampOffset != null ?
                    baseStartTime + (segment.timestampOffset * timescale) :
                    baseStartTime;
            }
            else {
                startTime = segmentStart;
            }
        }
    }
    if (duration == null) {
        if (_sidxSegments.length) {
            var sidxDuration = _sidxSegments.reduce(function (a, b) { return a + (b.duration || 0); }, 0);
            duration = sidxDuration >= 0 ? sidxDuration : segmentDuration;
        }
        else {
            duration = segmentDuration;
        }
    }
    if (false) {
        assert(startTime != null);
        assert(duration != null);
    }
    return {
        timescale: timescale,
        time: startTime || 0,
        duration: duration || 0,
    };
}
export default getISOBMFFTimingInfos;
