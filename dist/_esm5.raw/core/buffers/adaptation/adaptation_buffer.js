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
 * This file allows to create AdaptationBuffers.
 *
 * An AdaptationBuffer downloads and push segment for a single Adaptation (e.g.
 * a single audio or text track).
 * It chooses which Representation to download mainly thanks to the
 * ABRManager, and orchestrates the various RepresentationBuffer, which will
 * download and push segments for a single Representation.
 */
import objectAssign from "object-assign";
import { concat as observableConcat, defer as observableDefer, merge as observableMerge, of as observableOf, ReplaySubject, Subject, } from "rxjs";
import { distinctUntilChanged, filter, map, multicast, refCount, takeUntil, tap, } from "rxjs/operators";
import log from "../../../log";
import concatMapLatest from "../../../utils/concat_map_latest";
import EVENTS from "../events_generators";
import RepresentationBuffer from "../representation";
/**
 * Create new Buffer Observable linked to the given Adaptation.
 *
 * It will rely on the ABRManager to choose at any time the best Representation
 * for this Adaptation and then run the logic to download and push the
 * corresponding segments in the SourceBuffer.
 *
 * It will emit various events to report its status to the caller.
 *
 * @param {Observable} clock$ - Clock at which the Buffer will check for
 * segments download
 * @param {QueuedSourceBuffer} queuedSourceBuffer - QueuedSourceBuffer used
 * to push segments and know about the current real buffer's health.
 * @param {SegmentBookkeeper} segmentBookkeeper - Used to synchronize and
 * retrieve the Segments currently present in the QueuedSourceBuffer
 * @param {Function} segmentFetcher - Function used to download segments
 * @param {Observable} wantedBufferAhead$ - Emits the buffer goal
 * @param {Object} content - Content to download
 * @param {Object} abrManager
 * @returns {Observable}
 */
export default function AdaptationBuffer(clock$, queuedSourceBuffer, segmentBookkeeper, segmentFetcher, wantedBufferAhead$, content, abrManager, options) {
    var directManualBitrateSwitching = options.manualBitrateSwitchingMode === "direct";
    var manifest = content.manifest, period = content.period, adaptation = content.adaptation;
    // Keep track of the currently considered representation to add informations
    // to the ABR clock.
    var currentRepresentation = null;
    var abrClock$ = clock$.pipe(map(function (tick) {
        var downloadBitrate = currentRepresentation ?
            currentRepresentation.bitrate : undefined;
        return objectAssign({ downloadBitrate: downloadBitrate }, tick);
    }));
    var abr$ = abrManager.get$(adaptation.type, abrClock$, adaptation.representations).pipe(
    // equivalent to a sane shareReplay:
    // https://github.com/ReactiveX/rxjs/issues/3336
    // XXX TODO Replace it when that issue is resolved
    multicast(function () { return new ReplaySubject(1); }), refCount());
    // emit when the current RepresentationBuffer should be stopped right now
    var killCurrentBuffer$ = new Subject();
    // emit when the current RepresentationBuffer should stop making new downloads
    var terminateCurrentBuffer$ = new Subject();
    // Emit at each bitrate estimate done by the ABRManager
    var bitrateEstimate$ = abr$.pipe(filter(function (_a) {
        var bitrate = _a.bitrate;
        return bitrate != null;
    }), distinctUntilChanged(function (old, current) { return old.bitrate === current.bitrate; }), map(function (_a) {
        var bitrate = _a.bitrate;
        log.debug("Buffer: new " + adaptation.type + " bitrate estimation", bitrate);
        return EVENTS.bitrateEstimationChange(adaptation.type, bitrate);
    }));
    var adaptationBuffer$ = abr$.pipe(distinctUntilChanged(function (a, b) {
        return a.manual === b.manual && a.representation.id === b.representation.id;
    }), tap(function (estimation) {
        if (estimation.urgent) {
            log.info("Buffer: urgent Representation switch", adaptation.type);
            killCurrentBuffer$.next();
        }
        else {
            log.info("Buffer: slow Representation switch", adaptation.type);
            terminateCurrentBuffer$.next();
        }
    }), concatMapLatest(function (estimate, i) {
        var representation = estimate.representation;
        currentRepresentation = representation;
        // Manual switch needs an immediate feedback.
        // To do that properly, we need to reload the MediaSource
        if (directManualBitrateSwitching && estimate.manual && i !== 0) {
            return observableOf(EVENTS.needsMediaSourceReload());
        }
        var representationChange$ = observableOf(EVENTS.representationChange(adaptation.type, period, representation));
        var representationBuffer$ = createRepresentationBuffer(representation)
            .pipe(takeUntil(killCurrentBuffer$));
        return observableConcat(representationChange$, representationBuffer$);
    }));
    return observableMerge(adaptationBuffer$, bitrateEstimate$);
    /**
     * Create and returns a new RepresentationBuffer Observable, linked to the
     * given Representation.
     * @param {Representation} representation
     * @returns {Observable}
     */
    function createRepresentationBuffer(representation) {
        return observableDefer(function () {
            log.info("Buffer: changing representation", adaptation.type, representation);
            return RepresentationBuffer({
                clock$: clock$,
                content: {
                    representation: representation,
                    adaptation: adaptation,
                    period: period,
                    manifest: manifest,
                },
                queuedSourceBuffer: queuedSourceBuffer,
                segmentBookkeeper: segmentBookkeeper,
                segmentFetcher: segmentFetcher,
                terminate$: terminateCurrentBuffer$,
                wantedBufferAhead$: wantedBufferAhead$,
            });
        });
    }
}
