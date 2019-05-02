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
 * This file allows to create RepresentationBuffers.
 *
 * A RepresentationBuffer downloads and push segment for a single
 * Representation (e.g. a single video stream of a given quality).
 * It chooses which segments should be downloaded according to the current
 * position and what is currently buffered.
 */
import nextTick from "next-tick";
import { combineLatest as observableCombineLatest, concat as observableConcat, defer as observableDefer, EMPTY, merge as observableMerge, of as observableOf, ReplaySubject, Subject, } from "rxjs";
import { finalize, map, mapTo, mergeMap, share, startWith, switchMap, take, takeWhile, tap, } from "rxjs/operators";
import log from "../../../log";
import SimpleSet from "../../../utils/simple_set";
import EVENTS from "../events_generators";
import appendDataInSourceBuffer from "./append_data";
import getBufferPaddings from "./get_buffer_paddings";
import getSegmentPriority from "./get_segment_priority";
import getSegmentsNeeded from "./get_segments_needed";
import getWantedRange from "./get_wanted_range";
import segmentFilter from "./segment_filter";
/**
 * Build up buffer for a single Representation.
 *
 * Download and push segments linked to the given Representation according
 * to what is already in the SourceBuffer and where the playback currently is.
 *
 * Multiple RepresentationBuffer observables can run on the same SourceBuffer.
 * This allows for example smooth transitions between multiple periods.
 *
 * @param {Object} args
 * @returns {Observable}
 */
export default function RepresentationBuffer(_a) {
    var clock$ = _a.clock$, // emit current playback informations
    content = _a.content, // all informations about the content we want to play
    queuedSourceBuffer = _a.queuedSourceBuffer, // allows to interact with the SourceBuffer
    segmentBookkeeper = _a.segmentBookkeeper, // keep track of what segments already are in the SourceBuffer
    segmentFetcher = _a.segmentFetcher, // allows to download new segments
    terminate$ = _a.terminate$, // signal the RepresentationBuffer that it should terminate
    wantedBufferAhead$ = _a.wantedBufferAhead$;
    var manifest = content.manifest, period = content.period, adaptation = content.adaptation, representation = content.representation;
    var codec = representation.getMimeTypeString();
    var bufferType = adaptation.type;
    var initSegment = representation.index.getInitSegment();
    // Compute paddings, then used to calculate the wanted range of Segments
    // wanted.
    var paddings = getBufferPaddings(adaptation);
    // Saved initSegment state for this representation.
    var initSegmentObject = initSegment == null ?
        { segmentData: null, segmentInfos: null, segmentOffset: 0 } : null;
    // Subject to start/restart a Buffer Queue.
    var startQueue$ = new ReplaySubject(1);
    // Segments queued for download in the BufferQueue.
    var downloadQueue = [];
    // Emit when the current queue of download is finished
    var finishedDownloadQueue$ = new Subject();
    // Keep track of the informations about the pending Segment request.
    // null if no request is pending.
    var currentSegmentRequest = null;
    // Keep track of downloaded segments currently awaiting to be appended to the
    // SourceBuffer.
    var sourceBufferWaitingQueue = new SimpleSet();
    var status$ = observableCombineLatest(clock$, wantedBufferAhead$, terminate$.pipe(take(1), mapTo(true), startWith(false)), finishedDownloadQueue$.pipe(startWith(undefined))).pipe(map(function getCurrentStatus(_a) {
        var timing = _a[0], bufferGoal = _a[1], terminate = _a[2];
        var buffered = queuedSourceBuffer.getBuffered();
        segmentBookkeeper.synchronizeBuffered(buffered);
        var neededRange = getWantedRange(period, buffered, timing, bufferGoal, paddings);
        var discontinuity = !timing.stalled || !manifest.isLive ?
            -1 : representation.index.checkDiscontinuity(timing.currentTime);
        var shouldRefreshManifest = representation.index
            .shouldRefresh(neededRange.start, neededRange.end);
        var neededSegments = getSegmentsNeeded(representation, neededRange)
            .filter(function (segment) { return shouldDownloadSegment(segment, neededRange); })
            .map(function (segment) { return ({
            priority: getSegmentPriority(segment, timing),
            segment: segment,
        }); });
        if (initSegment != null && initSegmentObject == null) {
            neededSegments = [
                {
                    segment: initSegment,
                    priority: getSegmentPriority(initSegment, timing),
                }
            ].concat(neededSegments);
        }
        var isFull = !neededSegments.length && period.end != null &&
            neededRange.end >= period.end;
        return {
            discontinuity: discontinuity,
            isFull: isFull,
            terminate: terminate,
            neededSegments: neededSegments,
            shouldRefreshManifest: shouldRefreshManifest,
        };
    }), mergeMap(function handleStatus(status) {
        var neededSegments = status.neededSegments;
        var mostNeededSegment = neededSegments[0];
        if (status.terminate) {
            downloadQueue = [];
            if (currentSegmentRequest == null) {
                log.debug("Buffer: no request, terminate.", bufferType);
                startQueue$.complete(); // complete the downloading queue
                return observableOf({ type: "terminated" });
            }
            else if (mostNeededSegment == null ||
                currentSegmentRequest.segment.id !== mostNeededSegment.segment.id) {
                log.debug("Buffer: cancel request and terminate.", bufferType);
                startQueue$.next(); // interrupt the current request
                startQueue$.complete(); // complete the downloading queue
                return observableOf({ type: "terminated" });
            }
            else if (currentSegmentRequest.priority !== mostNeededSegment.priority) {
                var request$ = currentSegmentRequest.request$;
                segmentFetcher.updatePriority(request$, mostNeededSegment.priority);
                currentSegmentRequest.priority = mostNeededSegment.priority;
            }
            log.debug("Buffer: terminate after request.", bufferType);
            return EMPTY;
        }
        var neededActions = [];
        if (status.discontinuity > 1) {
            neededActions
                .push(EVENTS.discontinuityEncountered(bufferType, status.discontinuity + 1));
        }
        if (status.shouldRefreshManifest) {
            neededActions.push(EVENTS.needsManifestRefresh(bufferType));
        }
        if (mostNeededSegment == null) {
            if (currentSegmentRequest) {
                log.debug("Buffer: interrupt segment request.", bufferType);
            }
            downloadQueue = [];
            startQueue$.next(); // (re-)start with an empty queue
            return observableConcat(observableOf.apply(void 0, neededActions), status.isFull ? observableOf(EVENTS.fullBuffer(bufferType)) : EMPTY);
        }
        if (!currentSegmentRequest) {
            log.debug("Buffer: start downloading queue.", bufferType);
            downloadQueue = neededSegments;
            startQueue$.next(); // restart the queue
        }
        else if (currentSegmentRequest.segment.id !== mostNeededSegment.segment.id) {
            log.debug("Buffer: restart download queue.", bufferType);
            downloadQueue = neededSegments;
            startQueue$.next(); // restart the queue
        }
        else if (currentSegmentRequest.priority !== mostNeededSegment.priority) {
            log.debug("Buffer: update request priority.", bufferType);
            var request$ = currentSegmentRequest.request$;
            segmentFetcher.updatePriority(request$, mostNeededSegment.priority);
            currentSegmentRequest.priority = mostNeededSegment.priority;
        }
        else {
            log.debug("Buffer: update downloading queue", bufferType);
            // Update the previous queue to be all needed segments but the first one,
            // for which a request is already pending
            downloadQueue = neededSegments.slice().splice(1, neededSegments.length);
        }
        return observableConcat(observableOf.apply(void 0, neededActions), observableOf(EVENTS.activeBuffer(bufferType)));
    }), takeWhile(function (e) {
        return e.type !== "terminated";
    }));
    // Buffer Queue:
    //   - download every segments queued sequentially
    //   - append them to the SourceBuffer
    var bufferQueue$ = startQueue$.pipe(switchMap(function () { return downloadQueue.length ? loadSegmentsFromQueue() : EMPTY; }), mergeMap(appendSegment));
    return observableMerge(status$, bufferQueue$).pipe(share());
    /**
     * Request every Segment in the ``downloadQueue`` on subscription.
     * Emit the data of a segment when a request succeeded.
     *
     * Important side-effects:
     *   - Mutates `currentSegmentRequest` when doing and finishing a request.
     *   - Will emit from finishedDownloadQueue$ Subject after it's done.
     * @returns {Observable}
     */
    function loadSegmentsFromQueue() {
        var requestNextSegment$ = observableDefer(function () {
            var currentNeededSegment = downloadQueue.shift();
            if (currentNeededSegment == null) {
                nextTick(function () { finishedDownloadQueue$.next(); });
                return EMPTY;
            }
            var segment = currentNeededSegment.segment, priority = currentNeededSegment.priority;
            var context = { manifest: manifest, period: period, adaptation: adaptation, representation: representation, segment: segment };
            var request$ = segmentFetcher.createRequest(context, priority);
            currentSegmentRequest = { segment: segment, priority: priority, request$: request$ };
            var response$ = request$.pipe(mergeMap(function (fetchedSegment) {
                currentSegmentRequest = null;
                var initInfos = initSegmentObject &&
                    initSegmentObject.segmentInfos || undefined;
                return fetchedSegment.parse(initInfos);
            }), map(function (args) { return ({ segment: segment, value: args }); }));
            return observableConcat(response$, requestNextSegment$);
        });
        return requestNextSegment$
            .pipe(finalize(function () { currentSegmentRequest = null; }));
    }
    /**
     * Append the given segment to the SourceBuffer.
     * Emit the right event when it succeeds.
     * @param {Object} loadedSegment
     * @returns {Observable}
     */
    function appendSegment(loadedSegment) {
        return observableDefer(function () {
            var segment = loadedSegment.segment;
            if (segment.isInit) {
                initSegmentObject = loadedSegment.value;
            }
            var _a = loadedSegment.value, segmentInfos = _a.segmentInfos, segmentData = _a.segmentData, segmentOffset = _a.segmentOffset;
            if (segmentData == null) {
                // no segmentData to add here (for example, a text init segment)
                // just complete directly without appending anything
                return EMPTY;
            }
            var append$ = appendDataInSourceBuffer(clock$, queuedSourceBuffer, {
                initSegment: initSegmentObject && initSegmentObject.segmentData,
                segment: segment.isInit ? null : segmentData,
                timestampOffset: segmentOffset,
                codec: codec,
            });
            sourceBufferWaitingQueue.add(segment.id);
            return append$.pipe(mapTo(EVENTS.addedSegment(bufferType, segment, segmentData)), tap(function () {
                if (segment.isInit) {
                    return;
                }
                var _a = segmentInfos != null ?
                    segmentInfos : segment, time = _a.time, duration = _a.duration, timescale = _a.timescale;
                var start = time / timescale;
                var end = duration && (time + duration) / timescale;
                segmentBookkeeper
                    .insert(period, adaptation, representation, segment, start, end);
            }), finalize(function () {
                sourceBufferWaitingQueue.remove(segment.id);
            }));
        });
    }
    /**
     * Return true if the given segment should be downloaded. false otherwise.
     * @param {Object} segment
     * @param {Array.<Object>} neededRange
     * @returns {Boolean}
     */
    function shouldDownloadSegment(segment, neededRange) {
        return segmentFilter(segment, content, segmentBookkeeper, neededRange, sourceBufferWaitingQueue);
    }
}
