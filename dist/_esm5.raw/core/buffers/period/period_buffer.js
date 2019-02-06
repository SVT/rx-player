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
import { concat as observableConcat, EMPTY, merge as observableMerge, of as observableOf, ReplaySubject, } from "rxjs";
import { catchError, ignoreElements, map, mapTo, mergeMap, startWith, switchMap, take, } from "rxjs/operators";
import config from "../../../config";
import log from "../../../log";
import arrayIncludes from "../../../utils/array_includes";
import InitializationSegmentCache from "../../../utils/initialization_segment_cache";
import { getLeftSizeOfRange } from "../../../utils/ranges";
import SourceBuffersManager from "../../source_buffers";
import AdaptationBuffer from "../adaptation";
import EVENTS from "../events_generators";
import createFakeBuffer from "./create_fake_buffer";
import getAdaptationSwitchStrategy from "./get_adaptation_switch_strategy";
var DEFAULT_MAX_PIPELINES_RETRY_ON_ERROR = config.DEFAULT_MAX_PIPELINES_RETRY_ON_ERROR, DEFAULT_MAX_PIPELINES_RETRY_ON_OFFLINE = config.DEFAULT_MAX_PIPELINES_RETRY_ON_OFFLINE;
/**
 * Create single PeriodBuffer Observable:
 *   - Lazily create (or reuse) a SourceBuffer for the given type.
 *   - Create a Buffer linked to an Adaptation each time it changes, to
 *     download and append the corresponding Segments in the SourceBuffer.
 *   - Announce when the Buffer is full or is awaiting new Segments through
 *     events
 * @returns {Observable}
 */
export default function PeriodBuffer(_a) {
    var abrManager = _a.abrManager, bufferType = _a.bufferType, clock$ = _a.clock$, content = _a.content, garbageCollectors = _a.garbageCollectors, segmentBookkeepers = _a.segmentBookkeepers, segmentPipelinesManager = _a.segmentPipelinesManager, sourceBuffersManager = _a.sourceBuffersManager, options = _a.options;
    var period = content.period;
    var wantedBufferAhead$ = options.wantedBufferAhead$;
    // Emits the chosen adaptation for the current type.
    var adaptation$ = new ReplaySubject(1);
    return adaptation$.pipe(switchMap(function (adaptation) {
        if (adaptation == null) {
            log.info("Buffer: Set no " + bufferType + " Adaptation", period);
            var previousQSourceBuffer = sourceBuffersManager.get(bufferType);
            var cleanBuffer$ = void 0;
            if (previousQSourceBuffer != null) {
                log.info("Buffer: Clearing previous " + bufferType + " SourceBuffer");
                cleanBuffer$ = previousQSourceBuffer
                    .removeBuffer(period.start, period.end || Infinity);
            }
            else {
                cleanBuffer$ = observableOf(null);
            }
            return observableConcat(cleanBuffer$.pipe(mapTo(EVENTS.adaptationChange(bufferType, null, period))), createFakeBuffer(clock$, wantedBufferAhead$, bufferType, { period: period }));
        }
        log.info("Buffer: Updating " + bufferType + " adaptation", adaptation, period);
        var newBuffer$ = clock$.pipe(take(1), mergeMap(function (tick) {
            var qSourceBuffer = createOrReuseQueuedSourceBuffer(sourceBuffersManager, bufferType, adaptation, options);
            var strategy = getAdaptationSwitchStrategy(qSourceBuffer.getBuffered(), period, bufferType, tick);
            if (strategy.type === "needs-reload") {
                return observableOf(EVENTS.needsMediaSourceReload());
            }
            var cleanBuffer$ = strategy.type === "clean-buffer" ?
                observableConcat.apply(void 0, strategy.value.map(function (_a) {
                    var start = _a.start, end = _a.end;
                    return qSourceBuffer.removeBuffer(start, end);
                })).pipe(ignoreElements()) : EMPTY;
            var bufferGarbageCollector$ = garbageCollectors.get(qSourceBuffer);
            var adaptationBuffer$ = createAdaptationBuffer(adaptation, qSourceBuffer);
            return observableConcat(cleanBuffer$, observableMerge(adaptationBuffer$, bufferGarbageCollector$));
        }));
        return observableConcat(observableOf(EVENTS.adaptationChange(bufferType, adaptation, period)), newBuffer$);
    }), startWith(EVENTS.periodBufferReady(bufferType, period, adaptation$)));
    /**
     * @param {string} bufferType
     * @param {Object} period
     * @param {Object} adaptation
     * @param {Object} qSourceBuffer
     * @returns {Observable}
     */
    function createAdaptationBuffer(adaptation, qSourceBuffer) {
        var manifest = content.manifest;
        var segmentBookkeeper = segmentBookkeepers.get(qSourceBuffer);
        var pipelineOptions = getPipelineOptions(bufferType, options.segmentRetry, options.offlineRetry);
        var pipeline = segmentPipelinesManager
            .createPipeline(bufferType, pipelineOptions);
        var adaptationBufferClock$ = clock$.pipe(map(function (tick) {
            var buffered = qSourceBuffer.getBuffered();
            return objectAssign({}, tick, {
                bufferGap: getLeftSizeOfRange(buffered, tick.currentTime),
            });
        }));
        return AdaptationBuffer(adaptationBufferClock$, qSourceBuffer, segmentBookkeeper, pipeline, wantedBufferAhead$, { manifest: manifest, period: period, adaptation: adaptation }, abrManager, options).pipe(catchError(function (error) {
            // non native buffer should not impact the stability of the
            // player. ie: if a text buffer sends an error, we want to
            // continue playing without any subtitles
            if (!SourceBuffersManager.isNative(bufferType)) {
                log.error("Buffer: Custom " + bufferType + " buffer crashed. Aborting it.", error);
                sourceBuffersManager.disposeSourceBuffer(bufferType);
                return observableConcat(observableOf(EVENTS.warning(error)), createFakeBuffer(clock$, wantedBufferAhead$, bufferType, { period: period }));
            }
            log.error("Buffer: Native " + bufferType + " buffer crashed. Stopping playback.", error);
            throw error;
        }));
    }
}
/**
 * @param {string} bufferType
 * @param {Object} adaptation
 * @returns {Object}
 */
function createOrReuseQueuedSourceBuffer(sourceBuffersManager, bufferType, adaptation, options) {
    var currentQSourceBuffer = sourceBuffersManager.get(bufferType);
    if (currentQSourceBuffer != null) {
        log.info("Buffer: Reusing a previous SourceBuffer for the type", bufferType);
        return currentQSourceBuffer;
    }
    var codec = getFirstDeclaredMimeType(adaptation);
    var sbOptions = bufferType === "text" ? options.textTrackOptions : undefined;
    return sourceBuffersManager.createSourceBuffer(bufferType, codec, sbOptions);
}
/**
 * @param {string} bufferType
 * @param {number|undefined} retry
 * @param {number|undefined} offlineRetry
 * @returns {Object} - Options to give to the Pipeline
 */
function getPipelineOptions(bufferType, retry, offlineRetry) {
    var cache = arrayIncludes(["audio", "video"], bufferType) ?
        new InitializationSegmentCache() : undefined;
    var maxRetry;
    var maxRetryOffline;
    if (bufferType === "image") {
        maxRetry = 0; // Deactivate BIF fetching if it fails
    }
    else {
        maxRetry = retry != null ?
            retry : DEFAULT_MAX_PIPELINES_RETRY_ON_ERROR;
    }
    maxRetryOffline = offlineRetry != null ?
        offlineRetry : DEFAULT_MAX_PIPELINES_RETRY_ON_OFFLINE;
    return { cache: cache, maxRetry: maxRetry, maxRetryOffline: maxRetryOffline };
}
/**
 * Get mimetype string of the first representation declared in the given
 * adaptation.
 * @param {Adaptation} adaptation
 * @returns {string}
 */
function getFirstDeclaredMimeType(adaptation) {
    var representations = adaptation.representations;
    return (representations[0] && representations[0].getMimeTypeString()) || "";
}
