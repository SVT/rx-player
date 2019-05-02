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
import { from as observableFrom } from "rxjs";
import { concatAll, mergeMap, take, } from "rxjs/operators";
import config from "../../../config";
import log from "../../../log";
import { getInnerAndOuterTimeRanges } from "../../../utils/ranges";
var GC_GAP_CALM = config.BUFFER_GC_GAPS.CALM;
var GC_GAP_BEEFY = config.BUFFER_GC_GAPS.BEEFY;
/**
 * Run the garbage collector.
 *
 * Try to clean up buffered ranges from a low gcGap at first.
 * If it does not succeed to clean up space, use a higher gcCap.
 *
 * @param {Observable} timings$
 * @param {Object} bufferingQueue
 * @returns {Observable}
 */
export default function forceGarbageCollection(timings$, bufferingQueue) {
    // wait for next timing event
    return timings$.pipe(take(1), mergeMap(function (timing) {
        log.warn("Buffer: Running garbage collector");
        var buffered = bufferingQueue.getBuffered();
        var cleanedupRanges = selectGCedRanges(timing.currentTime, buffered, GC_GAP_CALM);
        // more aggressive GC if we could not find any range to clean
        if (cleanedupRanges.length === 0) {
            cleanedupRanges =
                selectGCedRanges(timing.currentTime, buffered, GC_GAP_BEEFY);
        }
        log.debug("Buffer: GC cleaning", cleanedupRanges);
        return observableFrom(cleanedupRanges.map(function (_a) {
            var start = _a.start, end = _a.end;
            return bufferingQueue.removeBuffer(start, end);
        })).pipe(concatAll());
    }));
}
/**
 * Buffer garbage collector algorithm.
 *
 * Tries to free up some part of the ranges that are distant from the current
 * playing time.
 * See: https://w3c.github.io/media-source/#sourcebuffer-prepare-append
 *
 * @param {Number} currentTime
 * @param {TimeRanges} buffered - current buffered ranges
 * @param {Number} gcGap - delta gap from current timestamp from which we
 * should consider cleaning up.
 * @returns {Array.<Object>} - Ranges selected for clean up
 */
function selectGCedRanges(currentTime, buffered, gcGap) {
    var _a = getInnerAndOuterTimeRanges(buffered, currentTime), innerRange = _a.innerRange, outerRanges = _a.outerRanges;
    var cleanedupRanges = [];
    // start by trying to remove all ranges that do not contain the
    // current time and respect the gcGap
    // respect the gcGap? FIXME?
    for (var i = 0; i < outerRanges.length; i++) {
        var outerRange = outerRanges[i];
        if (currentTime - gcGap < outerRange.end) {
            cleanedupRanges.push(outerRange);
        }
        else if (currentTime + gcGap > outerRange.start) {
            cleanedupRanges.push(outerRange);
        }
    }
    // try to clean up some space in the current range
    if (innerRange) {
        log.debug("Buffer: GC removing part of inner range", cleanedupRanges);
        if (currentTime - gcGap > innerRange.start) {
            cleanedupRanges.push({
                start: innerRange.start,
                end: currentTime - gcGap,
            });
        }
        if (currentTime + gcGap < innerRange.end) {
            cleanedupRanges.push({
                start: currentTime + gcGap,
                end: innerRange.end,
            });
        }
    }
    return cleanedupRanges;
}
