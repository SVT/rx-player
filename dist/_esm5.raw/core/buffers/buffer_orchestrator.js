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
import { concat as observableConcat, EMPTY, merge as observableMerge, of as observableOf, Subject, } from "rxjs";
import { exhaustMap, filter, ignoreElements, map, mergeMap, share, take, takeUntil, tap, } from "rxjs/operators";
import config from "../../config";
import { MediaError } from "../../errors";
import log from "../../log";
import SortedList from "../../utils/sorted_list";
import WeakMapMemory from "../../utils/weak_map_memory";
import { BufferGarbageCollector, getBufferTypes, } from "../source_buffers";
import ActivePeriodEmitter from "./active_period_emitter";
import areBuffersComplete from "./are_buffers_complete";
import EVENTS from "./events_generators";
import PeriodBuffer from "./period";
import SegmentBookkeeper from "./segment_bookkeeper";
var MAXIMUM_MAX_BUFFER_AHEAD = config.MAXIMUM_MAX_BUFFER_AHEAD, MAXIMUM_MAX_BUFFER_BEHIND = config.MAXIMUM_MAX_BUFFER_BEHIND;
/**
 * Create and manage the various Buffer Observables needed for the content to
 * play:
 *
 *   - Create or dispose SourceBuffers depending on the chosen adaptations.
 *
 *   - Concatenate Buffers for adaptation from separate Periods at the right
 *     time, to allow smooth transitions between periods.
 *
 *   - Emit events as Period or Adaptations change or as new Period are
 *     prepared.
 *
 * Here multiple buffers can be created at the same time to allow smooth
 * transitions between periods.
 * To do this, we dynamically create or destroy buffers as they are needed.
 * @param {Object} content
 * @param {Observable} clock$ - Emit position informations
 * @param {Object} abrManager - Emit bitrate estimation and best Representation
 * to play.
 * @param {Object} sourceBuffersManager - Will be used to lazily create
 * SourceBuffer instances associated with the current content.
 * @param {Object} segmentPipelinesManager - Download segments
 * @param {Object} options
 * @returns {Observable}
 *
 * TODO Special case for image Buffer, where we want data for EVERY active
 * periods.
 */
export default function BufferOrchestrator(content, clock$, abrManager, sourceBuffersManager, segmentPipelinesManager, options) {
    var manifest = content.manifest, initialPeriod = content.initialPeriod;
    var maxBufferAhead$ = options.maxBufferAhead$, maxBufferBehind$ = options.maxBufferBehind$;
    // Keep track of a unique BufferGarbageCollector created per
    // QueuedSourceBuffer.
    var garbageCollectors = new WeakMapMemory(function (qSourceBuffer) {
        var bufferType = qSourceBuffer.bufferType;
        var defaultMaxBehind = MAXIMUM_MAX_BUFFER_BEHIND[bufferType] != null ?
            MAXIMUM_MAX_BUFFER_BEHIND[bufferType] : Infinity;
        var defaultMaxAhead = MAXIMUM_MAX_BUFFER_AHEAD[bufferType] != null ?
            MAXIMUM_MAX_BUFFER_AHEAD[bufferType] : Infinity;
        return BufferGarbageCollector({
            queuedSourceBuffer: qSourceBuffer,
            clock$: clock$.pipe(map(function (tick) { return tick.currentTime; })),
            maxBufferBehind$: maxBufferBehind$
                .pipe(map(function (val) { return Math.min(val, defaultMaxBehind); })),
            maxBufferAhead$: maxBufferAhead$
                .pipe(map(function (val) { return Math.min(val, defaultMaxAhead); })),
        });
    });
    // Keep track of a unique segmentBookkeeper created per
    // QueuedSourceBuffer.
    var segmentBookkeepers = new WeakMapMemory(function () {
        return new SegmentBookkeeper();
    });
    var addPeriodBuffer$ = new Subject();
    var removePeriodBuffer$ = new Subject();
    var bufferTypes = getBufferTypes();
    // Every PeriodBuffers for every possible types
    var buffersArray = bufferTypes.map(function (bufferType) {
        return manageEveryBuffers(bufferType, initialPeriod).pipe(tap(function (evt) {
            if (evt.type === "periodBufferReady") {
                addPeriodBuffer$.next(evt.value);
            }
            else if (evt.type === "periodBufferCleared") {
                removePeriodBuffer$.next(evt.value);
            }
        }), share());
    });
    // Emits the activePeriodChanged events every time the active Period changes.
    var activePeriodChanged$ = ActivePeriodEmitter(bufferTypes, addPeriodBuffer$, removePeriodBuffer$).pipe(filter(function (period) { return !!period; }), map(function (period) {
        log.info("Buffer: New active period", period);
        return EVENTS.activePeriodChanged(period);
    }));
    // Emits an "end-of-stream" event once every PeriodBuffer are complete.
    // Emits a 'resume-stream" when it's not
    var endOfStream$ = areBuffersComplete.apply(void 0, buffersArray).pipe(map(function (areComplete) {
        return areComplete ? EVENTS.endOfStream() : EVENTS.resumeStream();
    }));
    return observableMerge.apply(void 0, [activePeriodChanged$].concat(buffersArray, [endOfStream$]));
    /**
     * Manage creation and removal of Buffers for every Periods.
     *
     * Works by creating consecutive buffers through the
     * manageConsecutivePeriodBuffers function, and restarting it when the clock
     * goes out of the bounds of these buffers.
     * @param {string} bufferType - e.g. "audio" or "video"
     * @param {Period} basePeriod - Initial Period downloaded.
     * @returns {Observable}
     */
    function manageEveryBuffers(bufferType, basePeriod) {
        // Each Period currently considered, chronologically
        var periodList = new SortedList(function (a, b) { return a.start - b.start; });
        /**
         * Returns true if the given time is either:
         *   - less than the start of the chronologically first Period
         *   - more than the end of the chronologically last Period
         * @param {number} time
         * @returns {boolean}
         */
        function isOutOfPeriodList(time) {
            var head = periodList.head();
            var last = periodList.last();
            if (head == null || last == null) { // if no period
                return true;
            }
            return head.start > time || (last.end || Infinity) < time;
        }
        // Destroy the current set of consecutive buffers.
        // Used when the clocks goes out of the bounds of those, e.g. when the user
        // seeks.
        // We can then re-create consecutive buffers, from the new point in time.
        var destroyCurrentBuffers = new Subject();
        // trigger warnings when the wanted time is before or after the manifest's
        // segments
        var outOfManifest$ = clock$.pipe(mergeMap(function (_a) {
            var currentTime = _a.currentTime, wantedTimeOffset = _a.wantedTimeOffset;
            var position = wantedTimeOffset + currentTime;
            if (position < manifest.getMinimumPosition()) {
                var warning = new MediaError("MEDIA_TIME_BEFORE_MANIFEST", null, false);
                return observableOf(EVENTS.warning(warning));
            }
            else if (position > manifest.getMaximumPosition()) {
                var warning = new MediaError("MEDIA_TIME_AFTER_MANIFEST", null, false);
                return observableOf(EVENTS.warning(warning));
            }
            return EMPTY;
        }));
        // Restart the current buffer when the wanted time is in another period
        // than the ones already considered
        var restartBuffers$ = clock$.pipe(filter(function (_a) {
            var currentTime = _a.currentTime, wantedTimeOffset = _a.wantedTimeOffset;
            return !!manifest.getPeriodForTime(wantedTimeOffset + currentTime) &&
                isOutOfPeriodList(wantedTimeOffset + currentTime);
        }), take(1), tap(function (_a) {
            var currentTime = _a.currentTime, wantedTimeOffset = _a.wantedTimeOffset;
            log.info("Buffer: Current position out of the bounds of the active periods," +
                "re-creating buffers.", bufferType, currentTime + wantedTimeOffset);
            destroyCurrentBuffers.next();
        }), mergeMap(function (_a) {
            var currentTime = _a.currentTime, wantedTimeOffset = _a.wantedTimeOffset;
            var newInitialPeriod = manifest
                .getPeriodForTime(currentTime + wantedTimeOffset);
            if (newInitialPeriod == null) {
                throw new MediaError("MEDIA_TIME_NOT_FOUND", null, true);
            }
            else {
                // Note: For this to work, manageEveryBuffers should always emit the
                // "periodBufferReady" event for the new InitialPeriod synchronously
                return manageEveryBuffers(bufferType, newInitialPeriod);
            }
        }));
        var currentBuffers$ = manageConsecutivePeriodBuffers(bufferType, basePeriod, destroyCurrentBuffers).pipe(tap(function (message) {
            if (message.type === "periodBufferReady") {
                periodList.add(message.value.period);
            }
            else if (message.type === "periodBufferCleared") {
                periodList.removeElement(message.value.period);
            }
        }), share() // as always, with side-effects
        );
        return observableMerge(currentBuffers$, restartBuffers$, outOfManifest$);
    }
    /**
     * Create lazily consecutive PeriodBuffers:
     *
     * It first creates the PeriodBuffer for `basePeriod` and - once it becomes
     * full - automatically creates the next chronological one.
     * This process repeats until the PeriodBuffer linked to the last Period is
     * full.
     *
     * If an "old" PeriodBuffer becomes active again, it destroys all PeriodBuffer
     * coming after it (from the last chronological one to the first).
     *
     * To clean-up PeriodBuffers, each one of them are also automatically
     * destroyed once the clock anounce a time superior or equal to the end of
     * the concerned Period.
     *
     * A "periodBufferReady" event is sent each times a new PeriodBuffer is
     * created. The first one (for `basePeriod`) should be sent synchronously on
     * subscription.
     *
     * A "periodBufferCleared" event is sent each times a PeriodBuffer is
     * destroyed.
     * @param {string} bufferType - e.g. "audio" or "video"
     * @param {Period} basePeriod - Initial Period downloaded.
     * @param {Observable} destroy$ - Emit when/if all created Buffers from this
     * point should be destroyed.
     * @returns {Observable}
     */
    function manageConsecutivePeriodBuffers(bufferType, basePeriod, destroy$) {
        log.info("Buffer: Creating new Buffer for", bufferType, basePeriod);
        // Emits the Period of the next Period Buffer when it can be created.
        var createNextPeriodBuffer$ = new Subject();
        // Emits when the Buffers for the next Periods should be destroyed, if
        // created.
        var destroyNextBuffers$ = new Subject();
        // Emits when the current position goes over the end of the current buffer.
        var endOfCurrentBuffer$ = clock$
            .pipe(filter(function (_a) {
            var currentTime = _a.currentTime, wantedTimeOffset = _a.wantedTimeOffset;
            return !!basePeriod.end && (currentTime + wantedTimeOffset) >= basePeriod.end;
        }));
        // Create Period Buffer for the next Period.
        var nextPeriodBuffer$ = createNextPeriodBuffer$
            .pipe(exhaustMap(function (nextPeriod) {
            return manageConsecutivePeriodBuffers(bufferType, nextPeriod, destroyNextBuffers$);
        }));
        // Allows to destroy each created Buffer, from the newest to the oldest,
        // once destroy$ emits.
        var destroyAll$ = destroy$.pipe(take(1), tap(function () {
            // first complete createNextBuffer$ to allow completion of the
            // nextPeriodBuffer$ observable once every further Buffers have been
            // cleared.
            createNextPeriodBuffer$.complete();
            // emit destruction signal to the next Buffer first
            destroyNextBuffers$.next();
            destroyNextBuffers$.complete(); // we do not need it anymore
        }), share() // share side-effects
        );
        // Will emit when the current buffer should be destroyed.
        var killCurrentBuffer$ = observableMerge(endOfCurrentBuffer$, destroyAll$);
        var periodBuffer$ = PeriodBuffer({
            abrManager: abrManager,
            bufferType: bufferType,
            clock$: clock$,
            content: { manifest: manifest, period: basePeriod },
            garbageCollectors: garbageCollectors,
            segmentBookkeepers: segmentBookkeepers,
            segmentPipelinesManager: segmentPipelinesManager,
            sourceBuffersManager: sourceBuffersManager,
            options: options,
        }).pipe(mergeMap(function (evt) {
            var type = evt.type;
            if (type === "full-buffer") {
                var nextPeriod = manifest.getPeriodAfter(basePeriod);
                if (nextPeriod == null) {
                    return observableOf(EVENTS.bufferComplete(bufferType));
                }
                else {
                    // current buffer is full, create the next one if not
                    createNextPeriodBuffer$.next(nextPeriod);
                }
            }
            else if (type === "active-buffer") {
                // current buffer is active, destroy next buffer if created
                destroyNextBuffers$.next();
            }
            return observableOf(evt);
        }), share());
        // Buffer for the current Period.
        var currentBuffer$ = observableConcat(periodBuffer$.pipe(takeUntil(killCurrentBuffer$)), observableOf(EVENTS.periodBufferCleared(bufferType, basePeriod))
            .pipe(tap(function () {
            log.info("Buffer: Destroying buffer for", bufferType, basePeriod);
        })));
        return observableMerge(currentBuffer$, nextPeriodBuffer$, destroyAll$.pipe(ignoreElements()));
    }
}
