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
var BITRATE_REBUFFERING_RATIO = config.BITRATE_REBUFFERING_RATIO, MINIMUM_SEGMENT_SIZE = config.MINIMUM_SEGMENT_SIZE;
/**
 * Returns true if the given Segment should be downloaded.
 * false otherwise.
 *
 * @param {Object} segment
 * @param {Object} content - The content the Segment depends on.
 * @param {Object} segmentBookkeeper
 * @param {Object} wantedRange
 * @param {Object} segmentIDsToIgnore
 * @returns {boolean}
 */
export default function shouldDownloadSegment(segment, content, segmentBookkeeper, wantedRange, segmentIDsToIgnore) {
    var period = content.period, adaptation = content.adaptation, representation = content.representation;
    var shouldIgnore = segmentIDsToIgnore.test(segment.id);
    if (shouldIgnore) {
        return false;
    }
    // segment without time info are usually init segments or some
    // kind of metadata segment that we never filter out
    if (segment.isInit || segment.time < 0) {
        return true;
    }
    var time = segment.time, duration = segment.duration, timescale = segment.timescale;
    if (!duration) {
        return true;
    }
    if (duration / timescale < MINIMUM_SEGMENT_SIZE) {
        return false;
    }
    var currentSegment = segmentBookkeeper.hasPlayableSegment(wantedRange, { time: time, duration: duration, timescale: timescale });
    if (!currentSegment) {
        return true;
    }
    if (currentSegment.infos.period.id !== period.id) {
        // segments for later periods have the advantage here
        return period.start >= currentSegment.infos.period.start;
    }
    if (currentSegment.infos.adaptation.id !== adaptation.id) {
        return true;
    }
    // only re-load comparatively-poor bitrates for the same adaptation.
    var bitrateCeil = currentSegment.infos.representation.bitrate *
        BITRATE_REBUFFERING_RATIO;
    return representation.bitrate > bitrateCeil;
}
