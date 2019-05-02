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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * This file defines the public API for the RxPlayer.
 * It also starts the different sub-parts of the player on various API calls.
 */
import deepEqual from "deep-equal";
import objectAssign from "object-assign";
import { BehaviorSubject, combineLatest as observableCombineLatest, concat as observableConcat, EMPTY, merge as observableMerge, of as observableOf, ReplaySubject, Subject, } from "rxjs";
import { catchError, distinctUntilChanged, filter, map, mapTo, mergeMapTo, publish, share, skipWhile, startWith, switchMapTo, take, takeUntil, } from "rxjs/operators";
import config from "../../config";
import log from "../../log";
import EventEmitter, { fromEvent, } from "../../utils/event_emitter";
import noop from "../../utils/noop";
import PPromise from "../../utils/promise";
import { getLeftSizeOfRange, getPlayedSizeOfRange, getSizeOfRange, } from "../../utils/ranges";
import warnOnce from "../../utils/warn_once";
import { events, exitFullscreen, isFullscreen, requestFullscreen, } from "../../compat";
import { ErrorCodes, ErrorTypes, MediaError, } from "../../errors";
import features from "../../features";
import { clearEMESession, disposeEME, getCurrentKeySystem, } from "../eme";
import initializeMediaSourcePlayback from "../init";
import createClock from "./clock";
import fromWallClockTime from "./from_wallclock_time";
import getPlayerState, { PLAYER_STATES, } from "./get_player_state";
import { parseConstructorOptions, parseLoadVideoOptions, } from "./option_parsers";
import TrackManager from "./track_manager";
var DEFAULT_UNMUTED_VOLUME = config.DEFAULT_UNMUTED_VOLUME;
var isInBackground$ = events.isInBackground$, onEnded$ = events.onEnded$, onFullscreenChange$ = events.onFullscreenChange$, onPlayPause$ = events.onPlayPause$, onSeeking$ = events.onSeeking$, onTextTrackChanges$ = events.onTextTrackChanges$, videoWidth$ = events.videoWidth$;
/**
 * @class Player
 * @extends EventEmitter
 */
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    /**
     * @constructor
     * @param {Object} options
     */
    function Player(options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        var _a = parseConstructorOptions(options), initialAudioBitrate = _a.initialAudioBitrate, initialVideoBitrate = _a.initialVideoBitrate, limitVideoWidth = _a.limitVideoWidth, maxAudioBitrate = _a.maxAudioBitrate, maxBufferAhead = _a.maxBufferAhead, maxBufferBehind = _a.maxBufferBehind, maxVideoBitrate = _a.maxVideoBitrate, preferredAudioTracks = _a.preferredAudioTracks, preferredTextTracks = _a.preferredTextTracks, throttleWhenHidden = _a.throttleWhenHidden, videoElement = _a.videoElement, wantedBufferAhead = _a.wantedBufferAhead, stopAtEnd = _a.stopAtEnd;
        // Workaround to support Firefox autoplay on FF 42.
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1194624
        videoElement.preload = "auto";
        _this.version = /*PLAYER_VERSION*/ "3.12.0";
        _this.log = log;
        _this.state = "STOPPED";
        _this.videoElement = videoElement;
        _this._priv_destroy$ = new Subject();
        /** @deprecated */
        onFullscreenChange$(videoElement)
            .pipe(takeUntil(_this._priv_destroy$))
            /* tslint:disable deprecation */
            .subscribe(function () { return _this.trigger("fullscreenChange", _this.isFullscreen()); });
        /* tslint:enable deprecation */
        /** @deprecated */
        onTextTrackChanges$(videoElement.textTracks)
            .pipe(takeUntil(_this._priv_destroy$), map(function (evt) {
            var target = evt.target;
            var arr = [];
            for (var i = 0; i < target.length; i++) {
                var textTrack = target[i];
                arr.push(textTrack);
            }
            return arr;
        }), 
        // We can have two consecutive textTrackChanges with the exact same
        // payload when we perform multiple texttrack operations before the event
        // loop is freed.
        // In that case we only want to fire one time the observable.
        distinctUntilChanged(function (textTracksA, textTracksB) {
            if (textTracksA.length !== textTracksB.length) {
                return false;
            }
            for (var i = 0; i < textTracksA.length; i++) {
                if (textTracksA[i] !== textTracksB[i]) {
                    return false;
                }
            }
            return true;
        }))
            .subscribe(function (x) { return _this._priv_onNativeTextTracksNext(x); });
        _this._priv_playing$ = new ReplaySubject(1);
        _this._priv_speed$ = new BehaviorSubject(videoElement.playbackRate);
        _this._priv_stopCurrentContent$ = new Subject();
        _this._priv_contentLock$ = new BehaviorSubject(false);
        _this._priv_bufferOptions = {
            wantedBufferAhead$: new BehaviorSubject(wantedBufferAhead),
            maxBufferAhead$: new BehaviorSubject(maxBufferAhead),
            maxBufferBehind$: new BehaviorSubject(maxBufferBehind),
        };
        _this._priv_bitrateInfos = {
            lastBitrates: {
                audio: initialAudioBitrate,
                video: initialVideoBitrate,
            },
            initialMaxAutoBitrates: {
                audio: maxAudioBitrate,
                video: maxVideoBitrate,
            },
            manualBitrates: {
                audio: -1,
                video: -1,
            },
        };
        _this._priv_throttleWhenHidden = throttleWhenHidden;
        _this._priv_limitVideoWidth = limitVideoWidth;
        _this._priv_mutedMemory = DEFAULT_UNMUTED_VOLUME;
        _this._priv_trackManager = null;
        _this._priv_abrManager = null;
        _this._priv_currentError = null;
        _this._priv_contentInfos = null;
        _this._priv_contentEventsMemory = {};
        _this._priv_stopAtEnd = stopAtEnd;
        _this._priv_setPlayerState(PLAYER_STATES.STOPPED);
        _this._priv_preferredAudioTracks = new BehaviorSubject(preferredAudioTracks);
        _this._priv_preferredTextTracks = new BehaviorSubject(preferredTextTracks);
        return _this;
    }
    Object.defineProperty(Player, "ErrorTypes", {
        /**
         * All possible Error types emitted by the RxPlayer.
         * @type {Object}
         */
        get: function () {
            return ErrorTypes;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Player, "ErrorCodes", {
        /**
         * All possible Error codes emitted by the RxPlayer.
         * @type {Object}
         */
        get: function () {
            return ErrorCodes;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Player, "LogLevel", {
        /**
         * Current log level.
         * Update current log level.
         * Should be either (by verbosity ascending):
         *   - "NONE"
         *   - "ERROR"
         *   - "WARNING"
         *   - "INFO"
         *   - "DEBUG"
         * Any other value will be translated to "NONE".
         * @type {string}
         */
        get: function () {
            return log.getLevel();
        },
        set: function (logLevel) {
            log.setLevel(logLevel);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Stop the playback for the current content.
     */
    Player.prototype.stop = function () {
        if (this.state !== PLAYER_STATES.STOPPED) {
            this._priv_stopCurrentContent$.next();
            this._priv_cleanUpCurrentContentState();
            this._priv_setPlayerState(PLAYER_STATES.STOPPED);
        }
    };
    /**
     * Free the resources used by the player.
     * /!\ The player cannot be "used" anymore after this method has been called.
     */
    Player.prototype.dispose = function () {
        // free resources linked to the loaded content
        this.stop();
        if (this.videoElement) {
            // free resources used for EME management
            disposeEME(this.videoElement);
        }
        // free Observables linked to the Player instance
        this._priv_destroy$.next();
        this._priv_destroy$.complete();
        // Complete all subjects
        this._priv_stopCurrentContent$.complete();
        this._priv_playing$.complete();
        this._priv_speed$.complete();
        this._priv_contentLock$.complete();
        this._priv_bufferOptions.wantedBufferAhead$.complete();
        this._priv_bufferOptions.maxBufferAhead$.complete();
        this._priv_bufferOptions.maxBufferBehind$.complete();
        // un-attach video element
        this.videoElement = null;
    };
    /**
     * Load a new video.
     * @param {Object} opts
     * @returns {Observable}
     * @throws Error - throws if no url is given.
     * @throws Error - throws if no transport is given and no default transport
     * has been set.
     * @throws Error - throws if the asked transport does not exist
     */
    Player.prototype.loadVideo = function (opts) {
        var _this = this;
        var options = parseLoadVideoOptions(opts);
        log.info("API: Calling loadvideo", options);
        var autoPlay = options.autoPlay, defaultAudioTrack = options.defaultAudioTrack, defaultTextTrack = options.defaultTextTrack, keySystems = options.keySystems, manualBitrateSwitchingMode = options.manualBitrateSwitchingMode, networkConfig = options.networkConfig, startAt = options.startAt, supplementaryImageTracks = options.supplementaryImageTracks, supplementaryTextTracks = options.supplementaryTextTracks, transport = options.transport, transportOptions = options.transportOptions, url = options.url;
        // Perform multiple checks on the given options
        if (!this.videoElement) {
            throw new Error("the attached video element is disposed");
        }
        // now that every check has passed, stop previous content
        this.stop();
        var isDirectFile = transport === "directfile";
        this._priv_currentError = null;
        this._priv_contentInfos = {
            url: url,
            isDirectFile: isDirectFile,
            thumbnails: null,
            manifest: null,
            currentPeriod: null,
            activeAdaptations: null,
            activeRepresentations: null,
            initialAudioTrack: defaultAudioTrack,
            initialTextTrack: defaultTextTrack,
        };
        // inilialize to false
        this._priv_playing$.next(false);
        // get every properties used from context for clarity
        var videoElement = this.videoElement;
        // Global clock used for the whole application.
        var clock$ = createClock(videoElement, { withMediaSource: !isDirectFile });
        var contentIsStopped$ = observableMerge(this._priv_stopCurrentContent$, this._priv_stopAtEnd ? onEnded$(videoElement) : EMPTY).pipe(take(1));
        var playback$;
        if (!isDirectFile) {
            var transportFn = features.transports[transport];
            if (!transportFn) {
                throw new Error("transport \"" + transport + "\" not supported");
            }
            var pipelines = transportFn(objectAssign({
                supplementaryTextTracks: supplementaryTextTracks,
                supplementaryImageTracks: supplementaryImageTracks,
            }, transportOptions));
            // Options used by the ABR Manager.
            var adaptiveOptions = {
                initialBitrates: this._priv_bitrateInfos.lastBitrates,
                manualBitrates: this._priv_bitrateInfos.manualBitrates,
                maxAutoBitrates: this._priv_bitrateInfos.initialMaxAutoBitrates,
                throttle: this._priv_throttleWhenHidden ? {
                    video: isInBackground$()
                        .pipe(map(function (isBg) { return isBg ? 0 : Infinity; }), takeUntil(this._priv_stopCurrentContent$)),
                } : {},
                limitWidth: this._priv_limitVideoWidth ? {
                    video: videoWidth$(videoElement)
                        .pipe(takeUntil(this._priv_stopCurrentContent$)),
                } : {},
            };
            // Options used by the TextTrack SourceBuffer
            var textTrackOptions = options.textTrackMode === "native" ? {
                textTrackMode: "native",
                hideNativeSubtitle: options.hideNativeSubtitle,
            } : {
                textTrackMode: "html",
                textTrackElement: options.textTrackElement,
            };
            // playback$ Observable, through which the content will be launched.
            playback$ = initializeMediaSourcePlayback({
                adaptiveOptions: adaptiveOptions,
                autoPlay: autoPlay,
                bufferOptions: objectAssign({
                    manualBitrateSwitchingMode: manualBitrateSwitchingMode,
                }, this._priv_bufferOptions),
                clock$: clock$,
                keySystems: keySystems,
                mediaElement: videoElement,
                networkConfig: networkConfig,
                pipelines: pipelines,
                speed$: this._priv_speed$,
                startAt: startAt,
                textTrackOptions: textTrackOptions,
                url: url,
            })
                .pipe(takeUntil(contentIsStopped$))
                .pipe(publish());
        }
        else {
            if (features.directfile == null) {
                throw new Error("DirectFile feature not activated in your build.");
            }
            playback$ = features.directfile({
                autoPlay: autoPlay,
                clock$: clock$,
                keySystems: keySystems,
                mediaElement: videoElement,
                speed$: this._priv_speed$,
                startAt: startAt,
                url: url,
            })
                .pipe(takeUntil(contentIsStopped$))
                .pipe(publish());
        }
        // Emit an object when the player stalls and null when it unstall
        var stalled$ = playback$.pipe(filter(function (evt) { return evt.type === "stalled"; }), map(function (x) { return x.value; }));
        // Emit when the content is considered "loaded".
        var loaded$ = playback$.pipe(filter(function (evt) { return evt.type === "loaded"; }), share());
        // Emit when we "reload" the MediaSource
        var reloading$ = playback$
            .pipe(filter(function (evt) {
            return evt.type === "reloading-media-source";
        }), share());
        // Emit when the media element emits an "ended" event.
        var endedEvent$ = onEnded$(videoElement);
        // Emit when the media element emits a "seeking" event.
        var seekingEvent$ = onSeeking$(videoElement);
        // State updates when the content is considered "loaded"
        var loadedStateUpdates$ = observableCombineLatest(this._priv_playing$, stalled$.pipe(startWith(null)), endedEvent$.pipe(startWith(null)), seekingEvent$.pipe(startWith(null)))
            .pipe(takeUntil(this._priv_stopCurrentContent$), map(function (_a) {
            var isPlaying = _a[0], stalledStatus = _a[1];
            return getPlayerState(videoElement, isPlaying, stalledStatus);
        }));
        // Emit the player state as it changes.
        var playerState$ = observableConcat(observableOf(PLAYER_STATES.LOADING), // Begin with LOADING
        // LOADED as soon as the first "loaded" event is sent
        loaded$.pipe(take(1), mapTo(PLAYER_STATES.LOADED)), observableMerge(loadedStateUpdates$
            .pipe(
        // From the first reload onward, we enter another dynamic (below)
        takeUntil(reloading$), skipWhile(function (state) { return state === PLAYER_STATES.PAUSED; })), 
        // when reloading
        reloading$.pipe(switchMapTo(loaded$.pipe(take(1), // wait for the next loaded event
        mergeMapTo(loadedStateUpdates$), // to update the state as usual
        startWith(PLAYER_STATES.RELOADING) // Starts with "RELOADING" state
        ))))).pipe(distinctUntilChanged());
        var playbackSubscription;
        this._priv_stopCurrentContent$
            .pipe(take(1))
            .subscribe(function () {
            if (playbackSubscription) {
                playbackSubscription.unsubscribe();
            }
        });
        onPlayPause$(videoElement)
            .pipe(takeUntil(this._priv_stopCurrentContent$))
            .subscribe(function (e) { return _this._priv_onPlayPauseNext(e.type === "play"); }, noop);
        clock$
            .pipe(takeUntil(this._priv_stopCurrentContent$))
            .subscribe(function (x) { return _this._priv_triggerTimeChange(x); }, noop);
        playerState$
            .pipe(takeUntil(this._priv_stopCurrentContent$))
            .subscribe(function (x) { return _this._priv_setPlayerState(x); }, noop);
        playback$.subscribe(function (x) { return _this._priv_onPlaybackEvent(x); }, function (err) { return _this._priv_onPlaybackError(err); }, function () { return _this._priv_onPlaybackFinished(); });
        // initialize the content only when the lock is inactive
        this._priv_contentLock$
            .pipe(filter(function (isLocked) { return !isLocked; }), take(1), takeUntil(this._priv_stopCurrentContent$))
            .subscribe(function () {
            playbackSubscription = playback$.connect();
        });
    };
    /**
     * Returns fatal error if one for the current content.
     * null otherwise.
     * @returns {Object|null}
     */
    Player.prototype.getError = function () {
        return this._priv_currentError;
    };
    /**
     * Returns manifest/playlist object.
     * null if the player is STOPPED.
     * @returns {Manifest|null}
     */
    Player.prototype.getManifest = function () {
        return this._priv_contentInfos &&
            this._priv_contentInfos.manifest;
    };
    /**
     * Returns adaptations (tracks) for every currently playing type
     * (audio/video/text...).
     * @returns {Object|null}
     */
    Player.prototype.getCurrentAdaptations = function () {
        if (!this._priv_contentInfos) {
            return null;
        }
        var _a = this._priv_contentInfos, currentPeriod = _a.currentPeriod, activeAdaptations = _a.activeAdaptations;
        if (!currentPeriod || !activeAdaptations) {
            return null;
        }
        return activeAdaptations[currentPeriod.id] || null;
    };
    /**
     * Returns representations (qualities) for every currently playing type
     * (audio/video/text...).
     * @returns {Object|null}
     */
    Player.prototype.getCurrentRepresentations = function () {
        if (!this._priv_contentInfos) {
            return null;
        }
        var _a = this._priv_contentInfos, currentPeriod = _a.currentPeriod, activeRepresentations = _a.activeRepresentations;
        if (!currentPeriod || !activeRepresentations) {
            return null;
        }
        return activeRepresentations[currentPeriod.id] || null;
    };
    /**
     * Returns the media DOM element used by the player.
     * You should not its HTML5 API directly and use the player's method instead,
     * to ensure a well-behaved player.
     * @returns {HTMLMediaElement|null}
     */
    Player.prototype.getVideoElement = function () {
        return this.videoElement;
    };
    /**
     * If one returns the first native text-track element attached to the media element.
     * @deprecated
     * @returns {TextTrack}
     */
    Player.prototype.getNativeTextTrack = function () {
        warnOnce("getNativeTextTrack is deprecated." +
            " Please open an issue if you used this API.");
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        var videoElement = this.videoElement;
        var textTracks = videoElement.textTracks;
        if (textTracks.length > 0) {
            return videoElement.textTracks[0];
        }
        else {
            return null;
        }
    };
    /**
     * Returns the player's current state.
     * @returns {string}
     */
    Player.prototype.getPlayerState = function () {
        return this.state;
    };
    /**
     * Returns true if both:
     *   - a content is loaded
     *   - the content loaded is a live content
     * @returns {Boolean}
     */
    Player.prototype.isLive = function () {
        if (!this._priv_contentInfos) {
            return false;
        }
        var _a = this._priv_contentInfos, isDirectFile = _a.isDirectFile, manifest = _a.manifest;
        if (isDirectFile || manifest == null) {
            return false;
        }
        return manifest.isLive;
    };
    /**
     * Returns the url of the content's manifest
     * @returns {string|undefined}
     */
    Player.prototype.getUrl = function () {
        if (!this._priv_contentInfos) {
            return undefined;
        }
        var _a = this._priv_contentInfos, isDirectFile = _a.isDirectFile, manifest = _a.manifest, url = _a.url;
        if (isDirectFile) {
            return url;
        }
        if (manifest != null) {
            return manifest.getUrl();
        }
        return undefined;
    };
    /**
     * Returns the video duration, in seconds.
     * NaN if no video is playing.
     * @returns {Number}
     */
    Player.prototype.getVideoDuration = function () {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        return this.videoElement.duration;
    };
    /**
     * Returns in seconds the difference between:
     *   - the end of the current contiguous loaded range.
     *   - the current time
     * @returns {Number}
     */
    Player.prototype.getVideoBufferGap = function () {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        var videoElement = this.videoElement;
        return getLeftSizeOfRange(videoElement.buffered, videoElement.currentTime);
    };
    /**
     * Returns in seconds the difference between:
     *   - the end of the current contiguous loaded range.
     *   - the start of the current contiguous loaded range.
     * @returns {Number}
     */
    Player.prototype.getVideoLoadedTime = function () {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        var videoElement = this.videoElement;
        return getSizeOfRange(videoElement.buffered, videoElement.currentTime);
    };
    /**
     * Returns in seconds the difference between:
     *   - the current time.
     *   - the start of the current contiguous loaded range.
     * @returns {Number}
     */
    Player.prototype.getVideoPlayedTime = function () {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        var videoElement = this.videoElement;
        return getPlayedSizeOfRange(videoElement.buffered, videoElement.currentTime);
    };
    /**
     * Get the current position, in s, in wall-clock time.
     * That is:
     *   - for live content, get a timestamp, in s, of the current played content.
     *   - for static content, returns the position from beginning in s.
     *
     * If you do not know if you want to use this method or getPosition:
     *   - If what you want is to display the current time to the user, use this
     *     one.
     *   - If what you want is to interact with the player's API or perform other
     *     actions (like statistics) with the real player data, use getPosition.
     *
     * @returns {Number}
     */
    Player.prototype.getWallClockTime = function () {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        if (!this._priv_contentInfos) {
            return this.videoElement.currentTime;
        }
        var _a = this._priv_contentInfos, isDirectFile = _a.isDirectFile, manifest = _a.manifest;
        if (isDirectFile) {
            return this.videoElement.currentTime;
        }
        if (manifest != null) {
            var currentTime = this.videoElement.currentTime;
            return this.isLive() ?
                (currentTime + (manifest.availabilityStartTime || 0)) :
                currentTime;
        }
        return 0;
    };
    /**
     * Get the current position, in seconds, of the video element.
     *
     * If you do not know if you want to use this method or getWallClockTime:
     *   - If what you want is to display the current time to the user, use
     *     getWallClockTime.
     *   - If what you want is to interact with the player's API or perform other
     *     actions (like statistics) with the real player data, use this one.
     *
     * @returns {Number}
     */
    Player.prototype.getPosition = function () {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        return this.videoElement.currentTime;
    };
    /**
     * Returns the current speed at which the video plays.
     * @returns {Number}
     */
    Player.prototype.getPlaybackRate = function () {
        return this._priv_speed$.getValue();
    };
    /**
     * Update the playback rate of the video.
     * @param {Number} rate
     */
    Player.prototype.setPlaybackRate = function (rate) {
        this._priv_speed$.next(rate);
    };
    /**
     * Returns all available bitrates for the current video Adaptation.
     * @returns {Array.<Number>}
     */
    Player.prototype.getAvailableVideoBitrates = function () {
        if (!this._priv_contentInfos) {
            return [];
        }
        var _a = this._priv_contentInfos, currentPeriod = _a.currentPeriod, activeAdaptations = _a.activeAdaptations;
        if (!currentPeriod || !activeAdaptations) {
            return [];
        }
        var adaptations = activeAdaptations[currentPeriod.id];
        var videoAdaptation = adaptations && adaptations.video;
        if (!videoAdaptation) {
            return [];
        }
        return videoAdaptation.getAvailableBitrates();
    };
    /**
     * Returns all available bitrates for the current audio Adaptation.
     * @returns {Array.<Number>}
     */
    Player.prototype.getAvailableAudioBitrates = function () {
        if (!this._priv_contentInfos) {
            return [];
        }
        var _a = this._priv_contentInfos, currentPeriod = _a.currentPeriod, activeAdaptations = _a.activeAdaptations;
        if (!currentPeriod || !activeAdaptations) {
            return [];
        }
        var adaptations = activeAdaptations[currentPeriod.id];
        var audioAdaptation = adaptations && adaptations.audio;
        if (!audioAdaptation) {
            return [];
        }
        return audioAdaptation.getAvailableBitrates();
    };
    /**
     * Returns the manual audio bitrate set. -1 if in AUTO mode.
     * @returns {Number}
     */
    Player.prototype.getManualAudioBitrate = function () {
        return this._priv_bitrateInfos.manualBitrates.audio;
    };
    /**
     * Returns the manual video bitrate set. -1 if in AUTO mode.
     * @returns {Number}
     */
    Player.prototype.getManualVideoBitrate = function () {
        return this._priv_bitrateInfos.manualBitrates.video;
    };
    /**
     * Returns currently considered bitrate for video segments.
     * @returns {Number|undefined}
     */
    Player.prototype.getVideoBitrate = function () {
        var representations = this.getCurrentRepresentations();
        if (!representations || !representations.video) {
            return undefined;
        }
        return representations.video.bitrate;
    };
    /**
     * Returns currently considered bitrate for audio segments.
     * @returns {Number|undefined}
     */
    Player.prototype.getAudioBitrate = function () {
        var representations = this.getCurrentRepresentations();
        if (!representations || !representations.audio) {
            return undefined;
        }
        return representations.audio.bitrate;
    };
    /**
     * Returns max wanted video bitrate currently set.
     * @returns {Number}
     */
    Player.prototype.getMaxVideoBitrate = function () {
        if (!this._priv_abrManager) {
            return this._priv_bitrateInfos.initialMaxAutoBitrates.video;
        }
        return this._priv_abrManager.getMaxAutoBitrate("video");
    };
    /**
     * Returns max wanted audio bitrate currently set.
     * @returns {Number}
     */
    Player.prototype.getMaxAudioBitrate = function () {
        if (!this._priv_abrManager) {
            return this._priv_bitrateInfos.initialMaxAutoBitrates.audio;
        }
        return this._priv_abrManager.getMaxAutoBitrate("audio");
    };
    /**
     * Play/Resume the current video.
     * @returns {Promise}
     */
    Player.prototype.play = function () {
        var _this = this;
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        var playPromise = this.videoElement.play();
        /* tslint:disable no-unbound-method */
        if (playPromise == null || typeof playPromise.catch !== "function") {
            /* tslint:enable no-unbound-method */
            return PPromise.resolve();
        }
        return playPromise.catch(function (error) {
            if (error.name === "NotAllowedError") {
                var warning = new MediaError("MEDIA_ERR_PLAY_NOT_ALLOWED", error.toString(), false);
                _this.trigger("warning", warning);
            }
            throw error;
        });
    };
    /**
     * Pause the current video.
     */
    Player.prototype.pause = function () {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        this.videoElement.pause();
    };
    /**
     * Seek to a given absolute position.
     * @param {Number|Object} time
     * @returns {Number} - The time the player has seek to
     */
    Player.prototype.seekTo = function (time) {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        if (!this._priv_contentInfos) {
            throw new Error("player: no content loaded");
        }
        var _a = this._priv_contentInfos, isDirectFile = _a.isDirectFile, manifest = _a.manifest;
        if (!isDirectFile && manifest == null) {
            throw new Error("player: the content did not load yet");
        }
        var positionWanted;
        var typeOf = typeof time;
        if (typeOf === "number") {
            positionWanted = time;
        }
        else if (typeOf === "object") {
            var currentTs = this.videoElement.currentTime;
            if (time.relative != null) {
                positionWanted = currentTs + time.relative;
            }
            else if (time.position != null) {
                positionWanted = time.position;
            }
            else if (time.wallClockTime != null) {
                positionWanted = isDirectFile ?
                    time.wallClockTime :
                    fromWallClockTime(time.wallClockTime * 1000, manifest // is TS or I dumb here?
                    );
            }
            else {
                throw new Error("invalid time object. You must set one of the " +
                    "following properties: \"relative\", \"position\" or " +
                    "\"wallClockTime\"");
            }
        }
        if (positionWanted === undefined) {
            throw new Error("invalid time given");
        }
        this.videoElement.currentTime = positionWanted;
        return positionWanted;
    };
    /**
     * Returns true if the media element is full screen.
     * @deprecated
     * @returns {Boolean}
     */
    Player.prototype.isFullscreen = function () {
        warnOnce("isFullscreen is deprecated." +
            " Fullscreen management should now be managed by the application");
        return isFullscreen();
    };
    /**
     * Set/exit fullScreen.
     * @deprecated
     * @param {Boolean} [goFull=true] - if false, exit full screen.
     */
    Player.prototype.setFullscreen = function (goFull) {
        if (goFull === void 0) { goFull = true; }
        warnOnce("setFullscreen is deprecated." +
            " Fullscreen management should now be managed by the application");
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        if (goFull) {
            requestFullscreen(this.videoElement);
        }
        else {
            exitFullscreen();
        }
    };
    /**
     * Exit from full screen mode.
     * @deprecated
     */
    Player.prototype.exitFullscreen = function () {
        warnOnce("exitFullscreen is deprecated." +
            " Fullscreen management should now be managed by the application");
        exitFullscreen();
    };
    /**
     * Returns the current player's audio volume on the media element.
     * From 0 (no audio) to 1 (maximum volume).
     * @returns {Number}
     */
    Player.prototype.getVolume = function () {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        return this.videoElement.volume;
    };
    /**
     * Set the player's audio volume. From 0 (no volume) to 1 (maximum volume).
     * @param {Number} volume
     */
    Player.prototype.setVolume = function (volume) {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        var videoElement = this.videoElement;
        if (volume !== videoElement.volume) {
            videoElement.volume = volume;
            this.trigger("volumeChange", volume);
        }
    };
    /**
     * Returns true if the volume is set to 0. false otherwise.
     * @returns {Boolean}
     */
    Player.prototype.isMute = function () {
        return !this.getVolume();
    };
    /**
     * Set the volume to 0 and save current one for when unmuted.
     */
    Player.prototype.mute = function () {
        this._priv_mutedMemory = this.getVolume();
        this.setVolume(0);
    };
    /**
     * Set the volume back to when it was when mute was last called.
     * If the volume was set to 0, set a default volume instead (see config).
     */
    Player.prototype.unMute = function () {
        var vol = this.getVolume();
        if (vol === 0) {
            this.setVolume(this._priv_mutedMemory || DEFAULT_UNMUTED_VOLUME);
        }
    };
    /**
     * Force the video bitrate to a given value. Act as a ceil.
     * -1 to set it on AUTO Mode
     * @param {Number} btr
     */
    Player.prototype.setVideoBitrate = function (btr) {
        this._priv_bitrateInfos.manualBitrates.video = btr;
        if (this._priv_abrManager) {
            this._priv_abrManager.setManualBitrate("video", btr);
        }
    };
    /**
     * Force the audio bitrate to a given value. Act as a ceil.
     * -1 to set it on AUTO Mode
     * @param {Number} btr
     */
    Player.prototype.setAudioBitrate = function (btr) {
        this._priv_bitrateInfos.manualBitrates.audio = btr;
        if (this._priv_abrManager) {
            this._priv_abrManager.setManualBitrate("audio", btr);
        }
    };
    /**
     * Update the maximum video bitrate the user can switch to.
     * @param {Number} btr
     */
    Player.prototype.setMaxVideoBitrate = function (btr) {
        // set it for the next content loaded
        this._priv_bitrateInfos.initialMaxAutoBitrates.video = btr;
        // set it for the current if one is loaded
        if (this._priv_abrManager) {
            this._priv_abrManager.setMaxAutoBitrate("video", btr);
        }
    };
    /**
     * Update the maximum video bitrate the user can switch to.
     * @param {Number} btr
     */
    Player.prototype.setMaxAudioBitrate = function (btr) {
        // set it for the next content loaded
        this._priv_bitrateInfos.initialMaxAutoBitrates.audio = btr;
        // set it for the current if one is loaded
        if (this._priv_abrManager) {
            this._priv_abrManager.setMaxAutoBitrate("audio", btr);
        }
    };
    /**
     * Set the max buffer size for the buffer behind the current position.
     * Every buffer data before will be removed.
     * @param {Number} depthInSeconds
     */
    Player.prototype.setMaxBufferBehind = function (depthInSeconds) {
        this._priv_bufferOptions.maxBufferBehind$.next(depthInSeconds);
    };
    /**
     * Set the max buffer size for the buffer behind the current position.
     * Every buffer data before will be removed.
     * @param {Number} depthInSeconds
     */
    Player.prototype.setMaxBufferAhead = function (depthInSeconds) {
        this._priv_bufferOptions.maxBufferAhead$.next(depthInSeconds);
    };
    /**
     * Set the max buffer size for the buffer ahead of the current position.
     * The player will stop downloading chunks when this size is reached.
     * @param {Number} sizeInSeconds
     */
    Player.prototype.setWantedBufferAhead = function (sizeInSeconds) {
        this._priv_bufferOptions.wantedBufferAhead$.next(sizeInSeconds);
    };
    /**
     * Returns the max buffer size for the buffer behind the current position.
     * @returns {Number}
     */
    Player.prototype.getMaxBufferBehind = function () {
        return this._priv_bufferOptions.maxBufferBehind$.getValue();
    };
    /**
     * Returns the max buffer size for the buffer behind the current position.
     * @returns {Number}
     */
    Player.prototype.getMaxBufferAhead = function () {
        return this._priv_bufferOptions.maxBufferAhead$.getValue();
    };
    /**
     * Returns the max buffer size for the buffer ahead of the current position.
     * @returns {Number}
     */
    Player.prototype.getWantedBufferAhead = function () {
        return this._priv_bufferOptions.wantedBufferAhead$.getValue();
    };
    /**
     * Returns type of current keysystem (e.g. playready, widevine) if the content
     * is encrypted. null otherwise.
     * @returns {string|null}
     */
    Player.prototype.getCurrentKeySystem = function () {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        return getCurrentKeySystem(this.videoElement);
    };
    /**
     * Returns every available audio tracks for the current Period.
     * @returns {Array.<Object>|null}
     */
    Player.prototype.getAvailableAudioTracks = function () {
        if (!this._priv_contentInfos) {
            return [];
        }
        var currentPeriod = this._priv_contentInfos.currentPeriod;
        if (!this._priv_trackManager || !currentPeriod) {
            return [];
        }
        return this._priv_trackManager.getAvailableAudioTracks(currentPeriod);
    };
    /**
     * Returns every available text tracks for the current Period.
     * @returns {Array.<Object>|null}
     */
    Player.prototype.getAvailableTextTracks = function () {
        if (!this._priv_contentInfos) {
            return [];
        }
        var currentPeriod = this._priv_contentInfos.currentPeriod;
        if (!this._priv_trackManager || !currentPeriod) {
            return [];
        }
        return this._priv_trackManager.getAvailableTextTracks(currentPeriod);
    };
    /**
     * Returns every available video tracks for the current Period.
     * @returns {Array.<Object>|null}
     */
    Player.prototype.getAvailableVideoTracks = function () {
        if (!this._priv_contentInfos) {
            return [];
        }
        var currentPeriod = this._priv_contentInfos.currentPeriod;
        if (!this._priv_trackManager || !currentPeriod) {
            return [];
        }
        return this._priv_trackManager.getAvailableVideoTracks(currentPeriod);
    };
    /**
     * Returns currently chosen audio language for the current Period.
     * @returns {string}
     */
    Player.prototype.getAudioTrack = function () {
        if (!this._priv_contentInfos) {
            return undefined;
        }
        var currentPeriod = this._priv_contentInfos.currentPeriod;
        if (!this._priv_trackManager || !currentPeriod) {
            return undefined;
        }
        return this._priv_trackManager.getChosenAudioTrack(currentPeriod);
    };
    /**
     * Returns currently chosen subtitle for the current Period.
     * @returns {string}
     */
    Player.prototype.getTextTrack = function () {
        if (!this._priv_contentInfos) {
            return undefined;
        }
        var currentPeriod = this._priv_contentInfos.currentPeriod;
        if (!this._priv_trackManager || !currentPeriod) {
            return undefined;
        }
        return this._priv_trackManager.getChosenTextTrack(currentPeriod);
    };
    /**
     * Returns currently chosen video track for the current Period.
     * @returns {string}
     */
    Player.prototype.getVideoTrack = function () {
        if (!this._priv_contentInfos) {
            return undefined;
        }
        var currentPeriod = this._priv_contentInfos.currentPeriod;
        if (!this._priv_trackManager || !currentPeriod) {
            return undefined;
        }
        return this._priv_trackManager.getChosenVideoTrack(currentPeriod);
    };
    /**
     * Update the audio language for the current Period.
     * @param {string} audioId
     * @throws Error - the current content has no TrackManager.
     * @throws Error - the given id is linked to no audio track.
     */
    Player.prototype.setAudioTrack = function (audioId) {
        if (!this._priv_contentInfos) {
            throw new Error("No content loaded");
        }
        var currentPeriod = this._priv_contentInfos.currentPeriod;
        if (!this._priv_trackManager || !currentPeriod) {
            throw new Error("No compatible content launched.");
        }
        try {
            this._priv_trackManager.setAudioTrackByID(currentPeriod, audioId);
        }
        catch (e) {
            throw new Error("player: unknown audio track");
        }
    };
    /**
     * Update the text language for the current Period.
     * @param {string} sub
     * @throws Error - the current content has no TrackManager.
     * @throws Error - the given id is linked to no text track.
     */
    Player.prototype.setTextTrack = function (textId) {
        if (!this._priv_contentInfos) {
            throw new Error("No content loaded");
        }
        var currentPeriod = this._priv_contentInfos.currentPeriod;
        if (!this._priv_trackManager || !currentPeriod) {
            throw new Error("No compatible content launched.");
        }
        try {
            this._priv_trackManager.setTextTrackByID(currentPeriod, textId);
        }
        catch (e) {
            throw new Error("player: unknown text track");
        }
    };
    /**
     * Disable subtitles for the current content.
     */
    Player.prototype.disableTextTrack = function () {
        if (!this._priv_contentInfos) {
            return;
        }
        var currentPeriod = this._priv_contentInfos.currentPeriod;
        if (!this._priv_trackManager || !currentPeriod) {
            return;
        }
        return this._priv_trackManager.disableTextTrack(currentPeriod);
    };
    /**
     * Update the video track for the current Period.
     * @param {string} videoId
     * @throws Error - the current content has no TrackManager.
     * @throws Error - the given id is linked to no video track.
     */
    Player.prototype.setVideoTrack = function (videoId) {
        if (!this._priv_contentInfos) {
            throw new Error("No content loaded");
        }
        var currentPeriod = this._priv_contentInfos.currentPeriod;
        if (!this._priv_trackManager || !currentPeriod) {
            throw new Error("No compatible content launched.");
        }
        try {
            this._priv_trackManager.setVideoTrackByID(currentPeriod, videoId);
        }
        catch (e) {
            throw new Error("player: unknown video track");
        }
    };
    /**
     * Returns the current list of preferred audio tracks, in preference order.
     * @returns {Array.<Object>}
     */
    Player.prototype.getPreferredAudioTracks = function () {
        return this._priv_preferredAudioTracks.getValue();
    };
    /**
     * Returns the current list of preferred text tracks, in preference order.
     * @returns {Array.<Object>}
     */
    Player.prototype.getPreferredTextTracks = function () {
        return this._priv_preferredTextTracks.getValue();
    };
    /**
     * Set the list of preferred audio tracks, in preference order.
     * @param {Array.<Object>} tracks
     */
    Player.prototype.setPreferredAudioTracks = function (tracks) {
        return this._priv_preferredAudioTracks.next(tracks);
    };
    /**
     * Set the list of preferred text tracks, in preference order.
     * @param {Array.<Object>} tracks
     */
    Player.prototype.setPreferredTextTracks = function (tracks) {
        return this._priv_preferredTextTracks.next(tracks);
    };
    /**
     * @returns {Array.<Object>|null}
     */
    Player.prototype.getImageTrackData = function () {
        return this._priv_contentInfos && this._priv_contentInfos.thumbnails;
    };
    /**
     * Get minimum seek-able position.
     * @returns {number}
     */
    Player.prototype.getMinimumPosition = function () {
        if (!this._priv_contentInfos) {
            return null;
        }
        if (this._priv_contentInfos.isDirectFile) {
            return 0;
        }
        var manifest = this._priv_contentInfos.manifest;
        if (manifest != null) {
            return manifest.getMinimumPosition();
        }
        return null;
    };
    /**
     * Get maximum seek-able position.
     * @returns {number}
     */
    Player.prototype.getMaximumPosition = function () {
        if (!this._priv_contentInfos) {
            return null;
        }
        var _a = this._priv_contentInfos, isDirectFile = _a.isDirectFile, manifest = _a.manifest;
        if (isDirectFile) {
            if (!this.videoElement) {
                throw new Error("Disposed player");
            }
            return this.videoElement.duration;
        }
        if (manifest != null) {
            return manifest.getMaximumPosition();
        }
        return null;
    };
    /**
     * Reset all state properties relative to a playing content.
     * @private
     */
    Player.prototype._priv_cleanUpCurrentContentState = function () {
        var _this = this;
        // lock playback of new contents while cleaning up is pending
        this._priv_contentLock$.next(true);
        this._priv_contentInfos = null;
        this._priv_trackManager = null;
        if (this._priv_abrManager) {
            this._priv_abrManager.dispose();
            this._priv_abrManager = null;
        }
        this._priv_contentEventsMemory = {};
        // EME cleaning
        var freeUpContentLock = function () {
            _this._priv_contentLock$.next(false);
        };
        if (this.videoElement) {
            clearEMESession(this.videoElement)
                .pipe(catchError(function () { return EMPTY; }))
                .subscribe(noop, freeUpContentLock, freeUpContentLock);
        }
        else {
            freeUpContentLock();
        }
    };
    /**
     * Store and emit new player state (e.g. text track, videoBitrate...).
     * We check for deep equality to avoid emitting 2 consecutive times the same
     * state.
     * @param {string} eventName
     * @param {*} value - its new value
     * @private
     */
    Player.prototype._priv_triggerContentEvent = function (eventName, value) {
        var prev = this._priv_contentEventsMemory[eventName];
        if (!deepEqual(prev, value)) {
            this._priv_contentEventsMemory[eventName] = value;
            this.trigger(eventName, value);
        }
    };
    /**
     * Triggered each time the playback Observable emits.
     *
     * React to various events.
     *
     * @param {Object} event - payload emitted
     * @private
     */
    Player.prototype._priv_onPlaybackEvent = function (event) {
        switch (event.type) {
            case "activePeriodChanged":
                this._priv_onActivePeriodChanged(event.value);
                break;
            case "periodBufferReady":
                this._priv_onPeriodBufferReady(event.value);
                break;
            case "periodBufferCleared":
                this._priv_onPeriodBufferCleared(event.value);
                break;
            case "reloading-media-source":
                this._priv_onReloadingMediaSource();
                break;
            case "representationChange":
                this._priv_onRepresentationChange(event.value);
                break;
            case "adaptationChange":
                this._priv_onAdaptationChange(event.value);
                break;
            case "bitrateEstimationChange":
                this._priv_onBitrateEstimationChange(event.value);
                break;
            case "manifestReady":
                this._priv_onManifestReady(event.value);
                break;
            case "warning":
                this._priv_onPlaybackWarning(event.value);
                break;
            case "added-segment":
                if (!this._priv_contentInfos) {
                    log.error("API: Added segment while no content is loaded");
                    return;
                }
                // Manage image tracks
                // TODO Better way? Perhaps linked to an ImageSourceBuffer
                // implementation
                var _a = event.value, bufferType = _a.bufferType, segmentData = _a.segmentData;
                if (bufferType === "image") {
                    if (segmentData != null && segmentData.type === "bif") {
                        var imageData = segmentData.data;
                        // TODO merge multiple data from the same track together
                        this._priv_contentInfos.thumbnails = imageData;
                        this.trigger("imageTrackUpdate", {
                            data: this._priv_contentInfos.thumbnails,
                        });
                    }
                }
        }
    };
    /**
     * Triggered when we received a fatal error.
     * Clean-up ressources and signal that the content has stopped on error.
     * @param {Error} error
     * @private
     */
    Player.prototype._priv_onPlaybackError = function (error) {
        this._priv_stopCurrentContent$.next();
        this._priv_cleanUpCurrentContentState();
        this._priv_currentError = error;
        log.error("API: The player stopped because of an error:", error);
        this._priv_setPlayerState(PLAYER_STATES.STOPPED);
        // TODO This condition is here because the eventual callback called when the
        // player state is updated can launch a new content, thus the error will not
        // be here anymore, in which case triggering the "error" event is unwanted.
        // This is very ugly though, and we should probable have a better solution
        if (this._priv_currentError === error) {
            this.trigger("error", error);
        }
    };
    /**
     * Triggered when the playback Observable completes.
     * Clean-up ressources and signal that the content has ended.
     * @private
     */
    Player.prototype._priv_onPlaybackFinished = function () {
        this._priv_stopCurrentContent$.next();
        this._priv_cleanUpCurrentContentState();
        this._priv_setPlayerState(PLAYER_STATES.ENDED);
    };
    /**
     * Triggered when we received a warning event during playback.
     * Trigger the right API event.
     * @param {Error} error
     * @private
     */
    Player.prototype._priv_onPlaybackWarning = function (error) {
        log.warn("API: Sending warning:", error);
        this.trigger("warning", error);
    };
    /**
     * Triggered when the Manifest has been loaded for the current content.
     * Initialize various private properties and emit initial event.
     * @param {Object} value
     * @private
     */
    Player.prototype._priv_onManifestReady = function (value) {
        var _this = this;
        if (!this._priv_contentInfos) {
            log.error("API: The manifest is loaded but no content is.");
            return;
        }
        var manifest = value.manifest, abrManager = value.abrManager;
        this._priv_contentInfos.manifest = manifest;
        this._priv_abrManager = abrManager;
        var _a = this._priv_contentInfos, initialAudioTrack = _a.initialAudioTrack, initialTextTrack = _a.initialTextTrack;
        this._priv_trackManager = new TrackManager({
            preferredAudioTracks: initialAudioTrack === undefined ?
                this._priv_preferredAudioTracks : new BehaviorSubject([initialAudioTrack]),
            preferredTextTracks: initialTextTrack === undefined ?
                this._priv_preferredTextTracks : new BehaviorSubject([initialTextTrack]),
        });
        fromEvent(manifest, "manifestUpdate")
            .pipe(takeUntil(this._priv_stopCurrentContent$))
            .subscribe(function () {
            // Update the tracks chosen if it changed
            if (_this._priv_trackManager) {
                _this._priv_trackManager.update();
            }
        });
    };
    /**
     * Triggered each times the current Period Changed.
     * Store and emit initial state for the Period.
     *
     * @param {Object} value
     * @private
     */
    Player.prototype._priv_onActivePeriodChanged = function (_a) {
        var period = _a.period;
        if (!this._priv_contentInfos) {
            log.error("API: The active period changed but no content is loaded");
            return;
        }
        this._priv_contentInfos.currentPeriod = period;
        this._priv_triggerContentEvent("periodChange", period);
        this._priv_triggerContentEvent("availableAudioTracksChange", this.getAvailableAudioTracks());
        this._priv_triggerContentEvent("availableTextTracksChange", this.getAvailableTextTracks());
        this._priv_triggerContentEvent("availableVideoTracksChange", this.getAvailableVideoTracks());
        // Emit intial events for the Period
        if (this._priv_trackManager) {
            var audioTrack = this._priv_trackManager.getChosenAudioTrack(period);
            var textTrack = this._priv_trackManager.getChosenTextTrack(period);
            var videoTrack = this._priv_trackManager.getChosenVideoTrack(period);
            this._priv_triggerContentEvent("audioTrackChange", audioTrack);
            this._priv_triggerContentEvent("textTrackChange", textTrack);
            this._priv_triggerContentEvent("videoTrackChange", videoTrack);
        }
        else {
            this._priv_triggerContentEvent("audioTrackChange", null);
            this._priv_triggerContentEvent("textTrackChange", null);
            this._priv_triggerContentEvent("videoTrackChange", null);
        }
        this._priv_triggerContentEvent("availableAudioBitratesChange", this.getAvailableAudioBitrates());
        this._priv_triggerContentEvent("availableVideoBitratesChange", this.getAvailableVideoBitrates());
        var activeAudioRepresentations = this.getCurrentRepresentations();
        if (activeAudioRepresentations && activeAudioRepresentations.audio != null) {
            var bitrate = activeAudioRepresentations.audio.bitrate;
            this._priv_triggerContentEvent("audioBitrateChange", bitrate != null ? bitrate : -1);
        }
        else {
            this._priv_triggerContentEvent("audioBitrateChange", -1);
        }
        var activeVideoRepresentations = this.getCurrentRepresentations();
        if (activeVideoRepresentations && activeVideoRepresentations.video != null) {
            var bitrate = activeVideoRepresentations.video.bitrate;
            this._priv_triggerContentEvent("videoBitrateChange", bitrate != null ? bitrate : -1);
        }
        else {
            this._priv_triggerContentEvent("videoBitrateChange", -1);
        }
    };
    /**
     * Triggered each times a new "PeriodBuffer" is ready.
     * Choose the right Adaptation for the Period and emit it.
     * @param {Object} value
     * @private
     */
    Player.prototype._priv_onPeriodBufferReady = function (value) {
        var type = value.type, period = value.period, adaptation$ = value.adaptation$;
        switch (type) {
            case "video":
                if (!this._priv_trackManager) {
                    log.error("API: TrackManager not instanciated for a new video period");
                    adaptation$.next(null);
                }
                else {
                    this._priv_trackManager.addPeriod(type, period, adaptation$);
                    this._priv_trackManager.setInitialVideoTrack(period);
                }
                break;
            case "audio":
                if (!this._priv_trackManager) {
                    log.error("API: TrackManager not instanciated for a new " + type + " period");
                    adaptation$.next(null);
                }
                else {
                    this._priv_trackManager.addPeriod(type, period, adaptation$);
                    this._priv_trackManager.setInitialAudioTrack(period);
                }
                break;
            case "text":
                if (!this._priv_trackManager) {
                    log.error("API: TrackManager not instanciated for a new " + type + " period");
                    adaptation$.next(null);
                }
                else {
                    this._priv_trackManager.addPeriod(type, period, adaptation$);
                    this._priv_trackManager.setInitialTextTrack(period);
                }
                break;
            default:
                var adaptations = period.adaptations[type];
                if (adaptations && adaptations.length) {
                    adaptation$.next(adaptations[0]);
                }
                else {
                    adaptation$.next(null);
                }
                break;
        }
    };
    /**
     * Triggered each times the we "remove" a PeriodBuffer.
     * @param {Object} value
     * @private
     */
    Player.prototype._priv_onPeriodBufferCleared = function (value) {
        var type = value.type, period = value.period;
        // Clean-up track choice from TrackManager
        switch (type) {
            case "audio":
            case "text":
            case "video":
                if (this._priv_trackManager) {
                    this._priv_trackManager.removePeriod(type, period);
                }
                break;
        }
        // Clean-up stored Representation and Adaptation information
        if (this._priv_contentInfos == null) {
            return;
        }
        var _a = this._priv_contentInfos, activeAdaptations = _a.activeAdaptations, activeRepresentations = _a.activeRepresentations;
        if (activeAdaptations && activeAdaptations[period.id]) {
            delete activeAdaptations[period.id];
        }
        if (activeRepresentations && activeRepresentations[period.id]) {
            delete activeRepresentations[period.id];
        }
    };
    /**
     * Triggered each time the content is re-loaded on the MediaSource.
     */
    Player.prototype._priv_onReloadingMediaSource = function () {
        if (this._priv_trackManager) {
            this._priv_trackManager.resetPeriods();
        }
    };
    /**
     * Triggered each times a new Adaptation is considered for the current
     * content.
     * Store given Adaptation and emit it if from the current Period.
     * @param {Object} value
     * @private
     */
    Player.prototype._priv_onAdaptationChange = function (_a) {
        var _b;
        var type = _a.type, adaptation = _a.adaptation, period = _a.period;
        if (!this._priv_contentInfos) {
            log.error("API: The adaptations changed but no content is loaded");
            return;
        }
        // lazily create this._priv_contentInfos.activeAdaptations
        if (!this._priv_contentInfos.activeAdaptations) {
            this._priv_contentInfos.activeAdaptations = {};
        }
        var _c = this._priv_contentInfos, activeAdaptations = _c.activeAdaptations, currentPeriod = _c.currentPeriod;
        var activePeriodAdaptations = activeAdaptations[period.id];
        if (!activePeriodAdaptations) {
            activeAdaptations[period.id] = (_b = {}, _b[type] = adaptation, _b);
        }
        else {
            activePeriodAdaptations[type] = adaptation;
        }
        if (this._priv_trackManager &&
            currentPeriod != null && period != null &&
            period.id === currentPeriod.id) {
            switch (type) {
                case "audio":
                    var audioTrack = this._priv_trackManager.getChosenAudioTrack(currentPeriod);
                    this._priv_triggerContentEvent("audioTrackChange", audioTrack);
                    this._priv_triggerContentEvent("availableAudioBitratesChange", this.getAvailableVideoBitrates());
                    break;
                case "text":
                    var textTrack = this._priv_trackManager.getChosenTextTrack(currentPeriod);
                    this._priv_triggerContentEvent("textTrackChange", textTrack);
                    break;
                case "video":
                    var videoTrack = this._priv_trackManager.getChosenVideoTrack(currentPeriod);
                    this._priv_triggerContentEvent("videoTrackChange", videoTrack);
                    this._priv_triggerContentEvent("availableVideoBitratesChange", this.getAvailableVideoBitrates());
                    break;
            }
        }
    };
    /**
     * Triggered each times a new Representation is considered during playback.
     *
     * Store given Representation and emit it if from the current Period.
     *
     * @param {Object} obj
     * @private
     */
    Player.prototype._priv_onRepresentationChange = function (_a) {
        var _b;
        var type = _a.type, period = _a.period, representation = _a.representation;
        if (!this._priv_contentInfos) {
            log.error("API: The representations changed but no content is loaded");
            return;
        }
        // lazily create this._priv_contentInfos.activeRepresentations
        if (!this._priv_contentInfos.activeRepresentations) {
            this._priv_contentInfos.activeRepresentations = {};
        }
        var _c = this._priv_contentInfos, activeRepresentations = _c.activeRepresentations, currentPeriod = _c.currentPeriod;
        var activePeriodRepresentations = activeRepresentations[period.id];
        if (!activePeriodRepresentations) {
            activeRepresentations[period.id] = (_b = {}, _b[type] = representation, _b);
        }
        else {
            activePeriodRepresentations[type] = representation;
        }
        var bitrate = representation && representation.bitrate;
        if (bitrate != null) {
            this._priv_bitrateInfos.lastBitrates[type] = bitrate;
        }
        if (period != null && currentPeriod != null && currentPeriod.id === period.id) {
            if (type === "video") {
                this._priv_triggerContentEvent("videoBitrateChange", bitrate != null ? bitrate : -1);
            }
            else if (type === "audio") {
                this._priv_triggerContentEvent("audioBitrateChange", bitrate != null ? bitrate : -1);
            }
        }
    };
    /**
     * Triggered each time a bitrate estimate is calculated.
     *
     * Emit it.
     *
     * @param {Object} value
     * @private
     */
    Player.prototype._priv_onBitrateEstimationChange = function (_a) {
        var type = _a.type, bitrate = _a.bitrate;
        this._priv_triggerContentEvent("bitrateEstimationChange", { type: type, bitrate: bitrate });
    };
    /**
     * Triggered each time the videoElement alternates between play and pause.
     *
     * Emit the info through the right Subject.
     *
     * @param {Boolean} isPlaying
     * @private
     */
    Player.prototype._priv_onPlayPauseNext = function (isPlaying) {
        if (!this.videoElement) {
            throw new Error("Disposed player");
        }
        this._priv_playing$.next(isPlaying);
    };
    /**
     * Triggered each time a textTrack is added to the video DOM Element.
     *
     * Trigger the right Player Event.
     *
     * @param {Array.<TextTrackElement>} tracks
     * @private
     */
    Player.prototype._priv_onNativeTextTracksNext = function (tracks) {
        this.trigger("nativeTextTracksChange", tracks);
    };
    /**
     * Triggered each time the player state updates.
     *
     * Trigger the right Player Event.
     *
     * @param {string} newState
     * @private
     */
    Player.prototype._priv_setPlayerState = function (newState) {
        if (this.state !== newState) {
            this.state = newState;
            log.info("API: playerStateChange event", newState);
            this.trigger("playerStateChange", newState);
        }
    };
    /**
     * Triggered each time a new clock tick object is emitted.
     *
     * Trigger the right Player Event
     *
     * @param {Object} clockTick
     * @private
     */
    Player.prototype._priv_triggerTimeChange = function (clockTick) {
        if (!this._priv_contentInfos) {
            log.warn("API: Cannot perform time update: no content loaded.");
            return;
        }
        if (this.state === PLAYER_STATES.RELOADING) {
            return;
        }
        var _a = this._priv_contentInfos, isDirectFile = _a.isDirectFile, manifest = _a.manifest;
        if ((!isDirectFile && manifest == null) || !clockTick) {
            return;
        }
        var positionData = {
            position: clockTick.currentTime,
            duration: clockTick.duration,
            playbackRate: clockTick.playbackRate,
            // TODO fix higher up?
            bufferGap: isFinite(clockTick.bufferGap) ? clockTick.bufferGap : 0,
        };
        if (manifest != null &&
            manifest.isLive &&
            clockTick.currentTime > 0) {
            positionData.wallClockTime =
                clockTick.currentTime + (manifest.availabilityStartTime || 0);
            positionData.liveGap = manifest.getMaximumPosition() - clockTick.currentTime;
        }
        this.trigger("positionUpdate", positionData);
    };
    return Player;
}(EventEmitter));
Player.version = /*PLAYER_VERSION*/ "3.12.0";
export default Player;
