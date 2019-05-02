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
import { combineLatest as observableCombineLatest, EMPTY, from as observableFrom, } from "rxjs";
import { concatAll, ignoreElements, mergeMap, } from "rxjs/operators";
import log from "../../log";
import { getInnerAndOuterTimeRanges } from "../../utils/ranges";
/**
 * Perform cleaning of the buffer according to the values set by the user
 * at each clock tick and each times the maxBufferBehind/maxBufferAhead values
 * change.
 *
 * @param {Object} opt
 * @returns {Observable}
 */
export default function BufferGarbageCollector(_a) {
    var queuedSourceBuffer = _a.queuedSourceBuffer, clock$ = _a.clock$, maxBufferBehind$ = _a.maxBufferBehind$, maxBufferAhead$ = _a.maxBufferAhead$;
    return observableCombineLatest(clock$, maxBufferBehind$, maxBufferAhead$).pipe(mergeMap(function (_a) {
        var currentTime = _a[0], maxBufferBehind = _a[1], maxBufferAhead = _a[2];
        return clearBuffer(queuedSourceBuffer, currentTime, maxBufferBehind, maxBufferAhead);
    }));
}
/**
 * Remove buffer from the browser's memory based on the user's
 * maxBufferAhead / maxBufferBehind settings.
 *
 * Normally, the browser garbage-collect automatically old-added chunks of
 * buffer date when memory is scarce. However, you might want to control
 * the size of memory allocated. This function takes the current position
 * and a "depth" behind and ahead wanted for the buffer, in seconds.
 *
 * Anything older than the depth will be removed from the buffer.
 * @param {QueuedSourceBuffer} qSourceBuffer
 * @param {Number} position - The current position
 * @param {Number} maxBufferBehind
 * @param {Number} maxBufferAhead
 * @returns {Observable}
 */
function clearBuffer(qSourceBuffer, position, maxBufferBehind, maxBufferAhead) {
    if (!isFinite(maxBufferBehind) && !isFinite(maxBufferAhead)) {
        return EMPTY;
    }
    var cleanedupRanges = [];
    var _a = getInnerAndOuterTimeRanges(qSourceBuffer.getBuffered(), position), innerRange = _a.innerRange, outerRanges = _a.outerRanges;
    var collectBufferBehind = function () {
        if (!isFinite(maxBufferBehind)) {
            return;
        }
        // begin from the oldest
        for (var i = 0; i < outerRanges.length; i++) {
            var outerRange = outerRanges[i];
            if (position - maxBufferBehind >= outerRange.end) {
                cleanedupRanges.push(outerRange);
            }
            else if (position >= outerRange.end &&
                position - maxBufferBehind > outerRange.start &&
                position - maxBufferBehind < outerRange.end) {
                cleanedupRanges.push({
                    start: outerRange.start,
                    end: position - maxBufferBehind,
                });
            }
        }
        if (innerRange) {
            if (position - maxBufferBehind > innerRange.start) {
                cleanedupRanges.push({
                    start: innerRange.start,
                    end: position - maxBufferBehind,
                });
            }
        }
    };
    var collectBufferAhead = function () {
        if (!isFinite(maxBufferAhead)) {
            return;
        }
        // begin from the oldest
        for (var i = 0; i < outerRanges.length; i++) {
            var outerRange = outerRanges[i];
            if (position + maxBufferAhead <= outerRange.start) {
                cleanedupRanges.push(outerRange);
            }
            else if (position <= outerRange.start &&
                position + maxBufferAhead < outerRange.end &&
                position + maxBufferAhead > outerRange.start) {
                cleanedupRanges.push({
                    start: position + maxBufferAhead,
                    end: outerRange.end,
                });
            }
        }
        if (innerRange) {
            if (position + maxBufferAhead < innerRange.end) {
                cleanedupRanges.push({
                    start: position + maxBufferAhead,
                    end: innerRange.end,
                });
            }
        }
    };
    collectBufferBehind();
    collectBufferAhead();
    var clean$ = observableFrom(cleanedupRanges.map(function (range) {
        log.debug("GC: cleaning range from SourceBuffer", range);
        return qSourceBuffer.removeBuffer(range.start, range.end);
    })).pipe(concatAll(), ignoreElements());
    return clean$;
}
