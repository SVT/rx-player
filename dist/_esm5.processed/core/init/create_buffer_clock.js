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
import objectAssign from "object-assign";
import { combineLatest as observableCombineLatest, merge as observableMerge, } from "rxjs";
import { ignoreElements, map, take, tap, } from "rxjs/operators";
/**
 * Create clock Observable for the Buffers part of the code.
 * @param {Object} manifest
 * @param {Observable} initClock$
 * @param {Observable} initialSeek$
 * @param {Number} startTime
 * @returns {Observable}
 */
export default function createBufferClock(manifest, initClock$, initialSeek$, speed$, startTime) {
    /**
     * wantedTimeOffset is an offset to add to the timing's current time to have
     * the "real" wanted position.
     * For now, this is seen when the media element has not yet seeked to its
     * initial position, the currentTime will most probably be 0 where the
     * effective starting position will be _startTime_.
     * Thus we initially set a wantedTimeOffset equal to startTime.
     * @type {Number}
     */
    var wantedTimeOffset = startTime;
    var updateTimeOffset$ = initialSeek$.pipe(take(1), tap(function () { wantedTimeOffset = 0; }), // (initial seek performed)
    ignoreElements());
    var clock$ = observableCombineLatest(initClock$, speed$)
        .pipe(map(function (_a) {
        var tick = _a[0], speed = _a[1];
        return objectAssign({
            isLive: manifest.isLive,
            liveGap: manifest.isLive ?
                manifest.getMaximumPosition() - tick.currentTime :
                Infinity,
            wantedTimeOffset: wantedTimeOffset,
            speed: speed,
        }, tick);
    }));
    return observableMerge(clock$, updateTimeOffset$);
}
