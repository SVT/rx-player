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
var SEGMENT_PRIORITIES_STEPS = config.SEGMENT_PRIORITIES_STEPS;
/**
 * Calculate the priority number of the Segment, in function of the distance
 * with the current time.
 *
 * The lower is this number, the higher should be the priority of the request.
 *
 * @param {Object} segment
 * @param {Object} clockTick
 * @returns {number}
 */
export default function getSegmentPriority(segment, clockTick) {
    var currentTime = clockTick.currentTime + clockTick.wantedTimeOffset;
    var segmentStart = segment.time / segment.timescale;
    var distance = segmentStart - currentTime;
    for (var priority = 0; priority < SEGMENT_PRIORITIES_STEPS.length; priority++) {
        if (distance < SEGMENT_PRIORITIES_STEPS[priority]) {
            return priority;
        }
    }
    return SEGMENT_PRIORITIES_STEPS.length;
}
