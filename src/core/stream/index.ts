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

import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import config from "../../config";
import log from "../../utils/log";
import {
  retryableFuncWithBackoff,
  retryFuncWithBackoff
} from "../../utils/retry";
import throttle from "../../utils/rx-throttle";
import WeakMapMemory from "../../utils/weak_map_memory";

import {
  getTotalPlaybackTime,
  getVideoPlaybackQuality,
} from "../../compat";
import { onSourceOpen$ } from "../../compat/events";
import {
  CustomError,
  isKnownError,
  MediaError,
  OtherError,
} from "../../errors";
import Manifest, {
  ISupplementaryImageTrack,
  ISupplementaryTextTrack,
} from "../../manifest";
import { ITransportPipelines } from "../../net";
import ABRManager, {
  IABRMetric,
  IABRRequest,
} from "../abr";
import BufferManager from "../buffer";
import EMEManager, {
  IKeySystemOption,
} from "../eme";
import {
  createManifestPipeline,
  IPipelineOptions,
  SegmentPipelinesManager,
} from "../pipelines";
import SourceBufferManager, {
  ITextTrackSourceBufferOptions,
  QueuedSourceBuffer,
  SupportedBufferTypes ,
} from "../source_buffers";
import BuffersHandler from "./buffers_handler";
import createBufferClock, {
  IStreamClockTick,
} from "./clock";
import createMediaSource, {
  setDurationToMediaSource,
} from "./create_media_source";
import BufferGarbageCollector from "./garbage_collector";
import getInitialTime, {
  IInitialTimeOptions,
} from "./get_initial_time";
import liveEventsHandler from "./live_events_handler";
import createMediaErrorHandler from "./media_error_handler";
import SegmentBookkeeper from "./segment_bookkeeper";
import SpeedManager from "./speed_manager";
import StallingManager from "./stalling_manager";
import EVENTS, {
  IStreamEvent,
} from "./stream_events";
import handleInitialVideoEvents from "./video_events";

function getManifestPipelineOptions(
  networkConfig: {
    manifestRetry? : number;
    offlineRetry? : number;
  }
) : IPipelineOptions<any, any> {
  return {
    maxRetry: networkConfig.manifestRetry != null ?
      networkConfig.manifestRetry : config.DEFAULT_MAX_MANIFEST_REQUEST_RETRY,
    maxRetryOffline: networkConfig.offlineRetry != null ?
      networkConfig.offlineRetry : config.DEFAULT_MAX_PIPELINES_RETRY_ON_ERROR,
  };
}

export interface IStreamOptions {
  adaptiveOptions: {
    initialBitrates : Partial<Record<SupportedBufferTypes, number>>;
    manualBitrates : Partial<Record<SupportedBufferTypes, number>>;
    maxAutoBitrates : Partial<Record<SupportedBufferTypes, number>>;
    throttle : Partial<Record<SupportedBufferTypes, Observable<number>>>;
    limitWidth : Partial<Record<SupportedBufferTypes, Observable<number>>>;
  };
  autoPlay : boolean;
  bufferOptions : {
    wantedBufferAhead$ : Observable<number>;
    maxBufferAhead$ : Observable<number>;
    maxBufferBehind$ : Observable<number>;
  };
  clock$ : Observable<IStreamClockTick>;
  keySystems : IKeySystemOption[];
  networkConfig: {
    manifestRetry? : number;
    offlineRetry? : number;
    segmentRetry? : number;
  };
  speed$ : Observable<number>;
  startAt? : IInitialTimeOptions;
  supplementaryImageTracks : ISupplementaryImageTrack[];
  supplementaryTextTracks : ISupplementaryTextTrack[];
  textTrackOptions : ITextTrackSourceBufferOptions;
  transport : ITransportPipelines;
  url : string;
  videoElement : HTMLMediaElement;
}

/**
 * Central part of the player. Play a given stream described by the given
 * manifest with given options.
 *
 * On subscription:
 *  - Creates the MediaSource and attached sourceBuffers instances.
 *  - download the content's manifest
 *  - Perform EME management if needed
 *  - get Buffers for each active adaptations.
 *  - give choice of the adaptation to the caller (e.g. to choose a language)
 *  - returns Observable emitting notifications about the stream lifecycle.
 *
 * @param {Object} args
 * @returns {Observable}
 */
export default function Stream({
  adaptiveOptions,
  autoPlay,
  bufferOptions,
  clock$,
  keySystems,
  networkConfig,
  speed$,
  startAt,
  supplementaryImageTracks, // eventual manually added images
  supplementaryTextTracks, // eventual manually added subtitles
  textTrackOptions,
  transport,
  url,
  videoElement,
} : IStreamOptions) : Observable<IStreamEvent> {

  const {
    wantedBufferAhead$,
    maxBufferAhead$,
    maxBufferBehind$,
  } = bufferOptions;

  /**
   * Observable through which all warning events will be sent.
   * @type {Subject}
   */
  const warning$ = new Subject<Error|CustomError>();

  /**
   * Fetch and parse the manifest from the URL given.
   * Throttled to avoid doing multiple simultaneous requests.
   * @param {string} url - the manifest url
   * @returns {Observable} - the parsed manifest
   */
  const fetchManifest = throttle(createManifestPipeline(
    transport,
    getManifestPipelineOptions(networkConfig),
    warning$,
    supplementaryTextTracks,
    supplementaryImageTracks
  ));

  /**
   * Keep track of a unique BufferGarbageCollector created per
   * QueuedSourceBuffer.
   * @type {WeakMapMemory}
   */
  const garbageCollectors =
    new WeakMapMemory((qSourceBuffer : QueuedSourceBuffer<any>) =>
      BufferGarbageCollector({
        queuedSourceBuffer: qSourceBuffer,
        clock$: clock$.map(tick => tick.currentTime),
        maxBufferBehind$,
        maxBufferAhead$,
      })
    );

  /**
   * Keep track of a unique segmentBookkeeper created per
   * QueuedSourceBuffer.
   * @type {WeakMapMemory}
   */
  const segmentBookkeepers =
    new WeakMapMemory<QueuedSourceBuffer<any>, SegmentBookkeeper>(() =>
      new SegmentBookkeeper()
    );

  /**
   * Retry the stream if ended for an unknown or non-fatal error.
   * TODO working? remove?
   * @see retryWithBackoff
   */
  const streamRetryOptions = {
    totalRetry: 3,
    retryDelay: 250,
    resetDelay: 60 * 1000,

    /**
     * Only retry if the error is unknown or non-fatal
     * @param {Error|CustomError}
     * @returns {Boolean}
     */
    shouldRetry: (error : Error|CustomError) : boolean => {
      if (isKnownError(error)) {
        return !error.fatal;
      }
      return true;
    },

    /**
     * Called when the stream truly throws
     * @param {Error|CustomError}
     * @returns {CustomError}
     */
    errorSelector: (error : Error|CustomError) : CustomError => {
      if (!isKnownError(error)) {
        return new OtherError("NONE", error, true);
      }
      error.fatal = true;
      return error;
    },

    onRetry: (error : Error|CustomError, tryCount : number) : void => {
      log.warn("stream retry", error, tryCount);
      warning$.next(error);
    },
  };

  /**
   * On subscription:
   *   - load the manifest (through its pipeline)
   *   - wiat for the given mediasource to be open
   * Once those are done, initialize the source duration and creates every
   * SourceBuffers and Buffers instances.
   *
   * This Observable can be retried on the basis of the streamRetryOptions
   * defined here.
   * @param {Object} params
   * @param {string} params.url
   * @param {MediaSource|null} params.mediaSource
   * @returns {Observable}
   */
  const startStreamWithRetry =
    retryableFuncWithBackoff<any, IStreamEvent>(startStream, streamRetryOptions);

  const stream$ = createMediaSource(videoElement)
    .mergeMap(startStreamWithRetry);

  const warningEvents$ = warning$.map(EVENTS.warning);

  return Observable.merge(stream$, warningEvents$);

  /**
   * Begin the stream logic, starting by fetching the manifest and waiting for
   * the MediaSource to emit its open event.
   * @param {MediaSource} mediaSource
   * @returns {Observable}
   */
  function startStream(mediaSource : MediaSource) {
    return Observable.combineLatest(
      fetchManifest(url),
      onSourceOpen$(mediaSource).take(1)
    )
      .mergeMap(([manifest]) => initialize(mediaSource, manifest));
  }

  /**
   * Initialize stream playback by merging all observable that are required to
   * make the system cooperate.
   * @param {MediaSource} mediaSource
   * @param {Object} manifest
   * @returns {Observable}
   */
  function initialize(
    mediaSource : MediaSource,
    manifest : Manifest
  ): Observable<IStreamEvent> {
    setDurationToMediaSource(mediaSource, manifest.getDuration());

    log.debug("calculating initial time");
    const initialTime = getInitialTime(manifest, startAt);
    log.debug("initial time calculated:", initialTime);

    const firstPeriodToPlay = manifest.getPeriodForTime(initialTime);
    if (firstPeriodToPlay == null) {
      throw new MediaError("MEDIA_STARTING_TIME_NOT_FOUND", null, true);
    }

    const {
      initialSeek$,
      loadAndPlay$,
    } = handleInitialVideoEvents(videoElement, initialTime, autoPlay);

    const {
      clock$: bufferClock$,
      seekings$,
    } = createBufferClock(manifest, clock$, initialSeek$, initialTime);

    /**
     * Measure two video playback qualities far from a significant interval
     * (equivalent to a second) then return the ratio of dropped frames on
     * total playback frames.
     */
    const droppedFrameRatio$ =
      clock$
        .map(() => getVideoPlaybackQuality(videoElement))
        .exhaustMap((oldPlaybackQuality) => {
          return clock$
            .map(() => getVideoPlaybackQuality(videoElement))
            .distinctUntilChanged()
            .filter((newPlaybackQuality) => {
              const totalPlaybackTime = getTotalPlaybackTime(videoElement);
              const fps = newPlaybackQuality.totalVideoFrames / totalPlaybackTime;
              return ((
                newPlaybackQuality.totalVideoFrames -
                oldPlaybackQuality.totalVideoFrames
              ) >= fps && fps !== 0);
            })
            .map((newPlaybackQuality) => {
              const currentTotalFrames =
                newPlaybackQuality.totalVideoFrames -
                oldPlaybackQuality.totalVideoFrames;
              const currentDroppedFrames =
                newPlaybackQuality.droppedVideoFrames -
                oldPlaybackQuality.droppedVideoFrames;
              return currentDroppedFrames / currentTotalFrames;
            })
            .take(1);
        })
      .startWith(0)
      .takeUntil(endOfPlay);

    /**
     * Subject through which network metrics will be sent by the segment
     * pipelines to the ABR manager.
     * @type {Subject}
     */
    const network$ = new Subject<IABRMetric>();

    /**
     * Subject through which each request progression will be sent by the
     * segment pipelines to the ABR manager.
     * @type {Subject}
     */
    const requestsInfos$ = new Subject<Subject<IABRRequest>>();

    /**
     * Creates pipelines for downloading segments.
     * @type {SegmentPipelinesManager}
     */
    const segmentPipelinesManager = new SegmentPipelinesManager(
      transport, requestsInfos$, network$, warning$);

    /**
     * Create ABR Manager, which will choose the right "Representation" for a
     * given "Adaptation".
     * @type {ABRManager}
     */
    const abrManager = new ABRManager(
      requestsInfos$,
      network$,
      adaptiveOptions,
      droppedFrameRatio$
    );

    /**
     * Creates BufferManager allowing to easily create a Buffer linked to any
     * Adaptation from the current content.
     * @type {BufferManager}
     */
    const bufferManager = new BufferManager(abrManager, clock$, speed$, seekings$);

    /**
     * Creates SourceBufferManager allowing to create and keep track of a single
     * SourceBuffer per type.
     * @type {SourceBufferManager}
     */
    const sourceBufferManager = new SourceBufferManager(videoElement, mediaSource);

    /**
     * Creates Observable which will manage every Buffer for the given Content.
     * @type {Observable}
     */
    const handledBuffers$ = BuffersHandler(
      { manifest, period: firstPeriodToPlay }, // content
      bufferClock$,
      wantedBufferAhead$,
      bufferManager,
      sourceBufferManager,
      segmentPipelinesManager,
      segmentBookkeepers,
      garbageCollectors,
      {
        maxRetry: networkConfig.segmentRetry,
        maxRetryOffline: networkConfig.offlineRetry,
        textTrackOptions,
      },
      warning$
    ).mergeMap((evt) => {
      if (evt.type === "end-of-stream") {
        log.info("Triggering end of stream.");
        return retryFuncWithBackoff(
          () => mediaSource.endOfStream(),
          {
            totalRetry: 10,
            retryDelay: 100,
            shouldRetry: () => mediaSource.readyState !== "ended",
          }
        ).ignoreElements() as Observable<never>;
      }
      return Observable.of(evt);
    });

    /**
     * Add management of events linked to live Playback.
     * @type {Observable}
     */
    const buffers$ = (manifest.isLive ?
      handledBuffers$
        .mergeMap(liveEventsHandler(videoElement, manifest, fetchManifest)) :
      handledBuffers$);

    /**
     * Create EME Manager, an observable which will manage every EME-related
     * issue.
     * @type {Observable}
     */
    const emeManager$ = EMEManager(videoElement, keySystems, warning$);

    /**
     * Translate errors coming from the video element into RxPlayer errors
     * through a throwing Observable.
     * @type {Observable}
     */
    const mediaErrorHandler$ = createMediaErrorHandler(videoElement);

    /**
     * Create Speed Manager, an observable which will set the speed set by the
     * user on the video element while pausing a little longer while the buffer
     * is stalled.
     * @type {Observable}
     */
    const speedManager$ = SpeedManager(videoElement, speed$, clock$, {
      pauseWhenStalled: true,
    }).map(EVENTS.speedChanged);

    /**
     * Create Stalling Manager, an observable which will try to get out of
     * various infinite stalling issues
     * @type {Observable}
     */
    const stallingManager$ = StallingManager(videoElement, clock$)
      .map(EVENTS.stalled);

    // Single lifecycle events
    const manifestReadyEvent$ = Observable
      .of(EVENTS.manifestReady(abrManager, manifest));
    const loadedEvent$ = loadAndPlay$.mapTo(EVENTS.loaded());

    return Observable.merge(
      manifestReadyEvent$,
      loadedEvent$,
      buffers$,
      emeManager$,
      mediaErrorHandler$ as Observable<any>, // TODO RxJS Bug?
      speedManager$,
      stallingManager$
    ).finally(() => {
      // clean-up every created SourceBuffers
      sourceBufferManager.disposeAll();
    });
  }
}

export {
  IStreamEvent,
  SegmentBookkeeper,
};
