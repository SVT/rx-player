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
import { combineLatest as observableCombineLatest, concat as observableConcat, EMPTY, merge as observableMerge, of as observableOf, ReplaySubject, Subject, timer as observableTimer, } from "rxjs";
import { ignoreElements, map, mergeMap, share, startWith, switchMap, takeUntil, tap, } from "rxjs/operators";
import config from "../../config";
import log from "../../log";
import throttle from "../../utils/rx-throttle";
import ABRManager from "../abr";
import { createManifestPipeline, SegmentPipelinesManager, } from "../pipelines";
import createEMEManager from "./create_eme_manager";
import openMediaSource from "./create_media_source";
import EVENTS from "./events_generators";
import getInitialTime from "./get_initial_time";
import createMediaSourceLoader from "./load_on_media_source";
import throwOnMediaError from "./throw_on_media_error";
/**
 * Returns pipeline options based on the global config and the user config.
 * @param {Object} networkConfig
 * @returns {Object}
 */
function getManifestPipelineOptions(networkConfig) {
    return {
        maxRetry: networkConfig.manifestRetry != null ?
            networkConfig.manifestRetry : config.DEFAULT_MAX_MANIFEST_REQUEST_RETRY,
        maxRetryOffline: networkConfig.offlineRetry != null ?
            networkConfig.offlineRetry : config.DEFAULT_MAX_PIPELINES_RETRY_ON_ERROR,
    };
}
/**
 * Central part of the player.
 *
 * Play a content described by the given Manifest.
 *
 * On subscription:
 *  - Creates the MediaSource and attached sourceBuffers instances.
 *  - download the content's manifest
 *  - Perform EME management if needed
 *  - get Buffers for each active adaptations.
 *  - give choice of the adaptation to the caller (e.g. to choose a language)
 *  - returns Observable emitting notifications about the content lifecycle.
 * @param {Object} args
 * @returns {Observable}
 */
export default function InitializeOnMediaSource(_a) {
    var adaptiveOptions = _a.adaptiveOptions, autoPlay = _a.autoPlay, bufferOptions = _a.bufferOptions, clock$ = _a.clock$, keySystems = _a.keySystems, mediaElement = _a.mediaElement, networkConfig = _a.networkConfig, speed$ = _a.speed$, startAt = _a.startAt, textTrackOptions = _a.textTrackOptions, pipelines = _a.pipelines, url = _a.url;
    // Subject through which warnings will be sent
    var warning$ = new Subject();
    // Fetch and parse the manifest from the URL given.
    // Throttled to avoid doing multiple simultaneous requests.
    var fetchManifest = throttle(createManifestPipeline(pipelines, getManifestPipelineOptions(networkConfig), warning$));
    // Subject through which network metrics will be sent by the segment
    // pipelines to the ABR manager.
    var network$ = new Subject();
    // Subject through which each request progression will be sent by the
    // segment pipelines to the ABR manager.
    var requestsInfos$ = new Subject();
    // Creates pipelines for downloading segments.
    var segmentPipelinesManager = new SegmentPipelinesManager(pipelines, requestsInfos$, network$, warning$);
    // Create ABR Manager, which will choose the right "Representation" for a
    // given "Adaptation".
    var abrManager = new ABRManager(requestsInfos$, network$, adaptiveOptions);
    // Create EME Manager, an observable which will manage every EME-related
    // issue.
    var emeManager$ = createEMEManager(mediaElement, keySystems);
    // Translate errors coming from the media element into RxPlayer errors
    // through a throwing Observable.
    var mediaError$ = throwOnMediaError(mediaElement);
    // Emit each time the manifest is refreshed.
    var manifestRefreshed$ = new ReplaySubject(1);
    var loadContent$ = observableCombineLatest(openMediaSource(mediaElement), fetchManifest(url)).pipe(mergeMap(function (_a) {
        var mediaSource = _a[0], _b = _a[1], manifest = _b.manifest, sendingTime = _b.sendingTime;
        /**
         * Refresh the manifest on subscription.
         * @returns {Observable}
         */
        function refreshManifest() {
            var refreshURL = manifest.getUrl();
            if (!refreshURL) {
                log.warn("Init: Cannot refresh the manifest: no url");
                return EMPTY;
            }
            return fetchManifest(refreshURL).pipe(tap(function (_a) {
                var newManifest = _a.manifest, newSendingTime = _a.sendingTime;
                manifest.update(newManifest);
                manifestRefreshed$.next({ manifest: manifest, sendingTime: newSendingTime });
            }), ignoreElements(), share() // share the previous side-effect
            );
        }
        var loadOnMediaSource = createMediaSourceLoader({
            mediaElement: mediaElement,
            manifest: manifest,
            clock$: clock$,
            speed$: speed$,
            abrManager: abrManager,
            segmentPipelinesManager: segmentPipelinesManager,
            bufferOptions: objectAssign({
                textTrackOptions: textTrackOptions,
                offlineRetry: networkConfig.offlineRetry,
                segmentRetry: networkConfig.segmentRetry,
            }, bufferOptions),
        });
        log.debug("Init: Calculating initial time");
        var initialTime = getInitialTime(manifest, startAt);
        log.debug("Init: Initial time calculated:", initialTime);
        var reloadMediaSource$ = new Subject();
        var onEvent = createEventListener(reloadMediaSource$, refreshManifest);
        var handleReloads$ = reloadMediaSource$.pipe(switchMap(function () {
            var currentPosition = mediaElement.currentTime;
            var isPaused = mediaElement.paused;
            return openMediaSource(mediaElement).pipe(mergeMap(function (newMS) { return loadOnMediaSource(newMS, currentPosition, !isPaused); }), mergeMap(onEvent), startWith(EVENTS.reloadingMediaSource()));
        }));
        var loadOnMediaSource$ = observableConcat(observableOf(EVENTS.manifestReady(abrManager, manifest)), loadOnMediaSource(mediaSource, initialTime, autoPlay).pipe(takeUntil(reloadMediaSource$), mergeMap(onEvent)));
        // Emit when the manifest should be refreshed due to its lifetime being expired
        var manifestAutoRefresh$ = manifestRefreshed$.pipe(startWith({ manifest: manifest, sendingTime: sendingTime }), switchMap(function (_a) {
            var newManifest = _a.manifest, newSendingTime = _a.sendingTime;
            if (newManifest.lifetime) {
                var timeSinceRequest = newSendingTime == null ?
                    0 : performance.now() - newSendingTime;
                var updateTimeout = newManifest.lifetime * 1000 - timeSinceRequest;
                return observableTimer(updateTimeout);
            }
            return EMPTY;
        })).pipe(mergeMap(refreshManifest));
        return observableMerge(loadOnMediaSource$, handleReloads$, manifestAutoRefresh$);
    }));
    return observableMerge(loadContent$, mediaError$, emeManager$, warning$.pipe(map(EVENTS.warning)));
}
/**
 * Generate function reacting to playback events.
 * @param {Subject} reloadMediaSource$
 * @param {Function} refreshManifest
 * @returns {Function}
 */
function createEventListener(reloadMediaSource$, refreshManifest) {
    /**
     * React to playback events.
     * @param {Object} evt
     * @returns {Observable}
     */
    return function onEvent(evt) {
        switch (evt.type) {
            case "needs-media-source-reload":
                reloadMediaSource$.next();
                break;
            case "needs-manifest-refresh":
                return refreshManifest();
        }
        return observableOf(evt);
    };
}
