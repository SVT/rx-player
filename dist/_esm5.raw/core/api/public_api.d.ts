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
import EventEmitter from "../../utils/event_emitter";
import Logger from "../../utils/logger";
import { ICustomError } from "../../errors";
import Manifest, { Adaptation, Period, Representation } from "../../manifest";
import { IBifThumbnail } from "../../parsers/images/bif";
import { IBufferType } from "../source_buffers";
import { IConstructorOptions, ILoadVideoOptions } from "./option_parsers";
import { IAudioTrackPreference, ITextTrackPreference, ITMAudioTrack, ITMAudioTrackListItem, ITMTextTrack, ITMTextTrackListItem, ITMVideoTrack, ITMVideoTrackListItem } from "./track_manager";
interface IPositionUpdateItem {
    position: number;
    duration: number;
    playbackRate: number;
    bufferGap: number;
    wallClockTime?: number;
    liveGap?: number;
}
interface IBitrateEstimate {
    type: IBufferType;
    bitrate: number | undefined;
}
interface IPublicAPIEvent {
    playerStateChange: string;
    positionUpdate: IPositionUpdateItem;
    audioTrackChange: ITMAudioTrack | null;
    textTrackChange: ITMTextTrack | null;
    videoTrackChange: ITMVideoTrack | null;
    audioBitrateChange: number;
    videoBitrateChange: number;
    imageTrackUpdate: {
        data: IBifThumbnail[];
    };
    fullscreenChange: boolean;
    bitrateEstimationChange: IBitrateEstimate;
    volumeChange: number;
    error: ICustomError | Error;
    warning: ICustomError | Error;
    nativeTextTracksChange: TextTrack[];
    periodChange: Period;
    availableAudioBitratesChange: number[];
    availableVideoBitratesChange: number[];
    availableAudioTracksChange: ITMAudioTrackListItem[];
    availableTextTracksChange: ITMTextTrackListItem[];
    availableVideoTracksChange: ITMVideoTrackListItem[];
}
/**
 * @class Player
 * @extends EventEmitter
 */
declare class Player extends EventEmitter<IPublicAPIEvent> {
    /**
     * Current version of the RxPlayer.
     * @type {string}
     */
    static version: string;
    /**
     * Current version of the RxPlayer.
     * @type {string}
     */
    readonly version: string;
    /**
     * Media element attached to the RxPlayer.
     * @type {HTMLMediaElement|null}
     */
    videoElement: HTMLMediaElement | null;
    /**
     * Logger the RxPlayer uses.
     * @type {Object}
     */
    readonly log: Logger;
    /**
     * Current state of the RxPlayer.
     * Please use `getPlayerState()` instead.
     * @type {string}
     */
    state: string;
    /**
     * Emit when the player is disposed to perform clean-up.
     * The player will be unusable after that.
     * @private
     * @type {Subject}
     */
    private readonly _priv_destroy$;
    /**
     * Emit to stop the current content and clean-up all related ressources.
     * @private
     * @type {Subject}
     */
    private readonly _priv_stopCurrentContent$;
    /**
     * Emit true when the previous content is cleaning-up, false when it's done.
     * A new content cannot be launched until it emits false.
     * @private
     * @type {BehaviorSubject}
     */
    private readonly _priv_contentLock$;
    /**
     * Changes on "play" and "pause" events from the media elements.
     * Switches to ``true`` whent the "play" event was the last received.
     * Switches to ``false`` whent the "pause" event was the last received.
     *
     * ``false`` if no such event was received for the current loaded content.
     * @private
     * @type {ReplaySubject}
     */
    private readonly _priv_playing$;
    /**
     * Last speed set by the user.
     * Used instead of videoElement.playbackRate to allow more flexibility.
     * @private
     * @type {BehaviorSubject>}
     */
    private readonly _priv_speed$;
    /**
     * Store buffer-related options used needed when initializing a content.
     * @private
     * @type {Object}
     */
    private readonly _priv_bufferOptions;
    /**
     * Informations on the current bitrate settings.
     * @private
     * @type {Object}
     */
    private readonly _priv_bitrateInfos;
    /**
     * Current fatal error which STOPPED the player.
     * @type {Error|null}
     */
    private _priv_currentError;
    /**
     * Informations about the current content being played.
     * null when no content is launched.
     * @private
     * @type {Object|null}
     */
    private _priv_contentInfos;
    /**
     * List of favorite audio tracks, in preference order.
     * @type {Array.<Object>}
     */
    private _priv_preferredAudioTracks;
    /**
     * List of favorite text tracks, in preference order.
     * @type {Array.<Object>}
     */
    private _priv_preferredTextTracks;
    /**
     * TrackManager instance linked to the current content.
     * Null if no content has been loaded or if the current content loaded
     * has no TrackManager.
     * @private
     * @type {Object|null}
     */
    private _priv_trackManager;
    /**
     * ABRManager instance linked to the current content.
     * Null if no content has been loaded or if the current content loaded
     * has no ABRManager.
     * @private
     * @type {Object|null}
     */
    private _priv_abrManager;
    /**
     * Store wanted configuration for the limitVideoWidth option.
     * @private
     * @type {boolean}
     */
    private readonly _priv_limitVideoWidth;
    /**
     * Store wanted configuration for the throttleWhenHidden option.
     * @private
     * @type {boolean}
     */
    private readonly _priv_throttleWhenHidden;
    /**
     * Store volume when mute is called, to restore it on unmute.
     * @private
     * @type {Number}
     */
    private _priv_mutedMemory;
    /**
     * Store last state of various values sent as events, to avoid re-triggering
     * them multiple times in a row.
     *
     * All those events are linked to the content being played and can be cleaned
     * on stop.
     *
     * @private
     * @type {Object}
     */
    private _priv_contentEventsMemory;
    /**
     * Determines whether or not player should stop at the end of video playback.
     * @private
     */
    private readonly _priv_stopAtEnd;
    /**
     * All possible Error types emitted by the RxPlayer.
     * @type {Object}
     */
    static readonly ErrorTypes: Partial<Record<string, string>>;
    /**
     * All possible Error codes emitted by the RxPlayer.
     * @type {Object}
     */
    static readonly ErrorCodes: Partial<Record<string, string>>;
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
    static LogLevel: string;
    /**
     * @constructor
     * @param {Object} options
     */
    constructor(options?: IConstructorOptions);
    /**
     * Stop the playback for the current content.
     */
    stop(): void;
    /**
     * Free the resources used by the player.
     * /!\ The player cannot be "used" anymore after this method has been called.
     */
    dispose(): void;
    /**
     * Load a new video.
     * @param {Object} opts
     * @returns {Observable}
     * @throws Error - throws if no url is given.
     * @throws Error - throws if no transport is given and no default transport
     * has been set.
     * @throws Error - throws if the asked transport does not exist
     */
    loadVideo(opts: ILoadVideoOptions): void;
    /**
     * Returns fatal error if one for the current content.
     * null otherwise.
     * @returns {Object|null}
     */
    getError(): Error | null;
    /**
     * Returns manifest/playlist object.
     * null if the player is STOPPED.
     * @returns {Manifest|null}
     */
    getManifest(): Manifest | null;
    /**
     * Returns adaptations (tracks) for every currently playing type
     * (audio/video/text...).
     * @returns {Object|null}
     */
    getCurrentAdaptations(): Partial<Record<IBufferType, Adaptation | null>> | null;
    /**
     * Returns representations (qualities) for every currently playing type
     * (audio/video/text...).
     * @returns {Object|null}
     */
    getCurrentRepresentations(): Partial<Record<IBufferType, Representation | null>> | null;
    /**
     * Returns the media DOM element used by the player.
     * You should not its HTML5 API directly and use the player's method instead,
     * to ensure a well-behaved player.
     * @returns {HTMLMediaElement|null}
     */
    getVideoElement(): HTMLMediaElement | null;
    /**
     * If one returns the first native text-track element attached to the media element.
     * @deprecated
     * @returns {TextTrack}
     */
    getNativeTextTrack(): TextTrack | null;
    /**
     * Returns the player's current state.
     * @returns {string}
     */
    getPlayerState(): string | undefined;
    /**
     * Returns true if both:
     *   - a content is loaded
     *   - the content loaded is a live content
     * @returns {Boolean}
     */
    isLive(): boolean;
    /**
     * Returns the url of the content's manifest
     * @returns {string|undefined}
     */
    getUrl(): string | undefined;
    /**
     * Returns the video duration, in seconds.
     * NaN if no video is playing.
     * @returns {Number}
     */
    getVideoDuration(): number;
    /**
     * Returns in seconds the difference between:
     *   - the end of the current contiguous loaded range.
     *   - the current time
     * @returns {Number}
     */
    getVideoBufferGap(): number;
    /**
     * Returns in seconds the difference between:
     *   - the end of the current contiguous loaded range.
     *   - the start of the current contiguous loaded range.
     * @returns {Number}
     */
    getVideoLoadedTime(): number;
    /**
     * Returns in seconds the difference between:
     *   - the current time.
     *   - the start of the current contiguous loaded range.
     * @returns {Number}
     */
    getVideoPlayedTime(): number;
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
    getWallClockTime(): number;
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
    getPosition(): number;
    /**
     * Returns the current speed at which the video plays.
     * @returns {Number}
     */
    getPlaybackRate(): number;
    /**
     * Update the playback rate of the video.
     * @param {Number} rate
     */
    setPlaybackRate(rate: number): void;
    /**
     * Returns all available bitrates for the current video Adaptation.
     * @returns {Array.<Number>}
     */
    getAvailableVideoBitrates(): number[];
    /**
     * Returns all available bitrates for the current audio Adaptation.
     * @returns {Array.<Number>}
     */
    getAvailableAudioBitrates(): number[];
    /**
     * Returns the manual audio bitrate set. -1 if in AUTO mode.
     * @returns {Number}
     */
    getManualAudioBitrate(): number;
    /**
     * Returns the manual video bitrate set. -1 if in AUTO mode.
     * @returns {Number}
     */
    getManualVideoBitrate(): number;
    /**
     * Returns currently considered bitrate for video segments.
     * @returns {Number|undefined}
     */
    getVideoBitrate(): number | undefined;
    /**
     * Returns currently considered bitrate for audio segments.
     * @returns {Number|undefined}
     */
    getAudioBitrate(): number | undefined;
    /**
     * Returns max wanted video bitrate currently set.
     * @returns {Number}
     */
    getMaxVideoBitrate(): number | undefined;
    /**
     * Returns max wanted audio bitrate currently set.
     * @returns {Number}
     */
    getMaxAudioBitrate(): number | undefined;
    /**
     * Play/Resume the current video.
     * @returns {Promise}
     */
    play(): Promise<void>;
    /**
     * Pause the current video.
     */
    pause(): void;
    /**
     * Seek to a given absolute position.
     * @param {Number|Object} time
     * @returns {Number} - The time the player has seek to
     */
    seekTo(time: number | {
        relative: number;
    } | {
        position: number;
    } | {
        wallClockTime: number;
    }): number;
    /**
     * Returns true if the media element is full screen.
     * @deprecated
     * @returns {Boolean}
     */
    isFullscreen(): boolean;
    /**
     * Set/exit fullScreen.
     * @deprecated
     * @param {Boolean} [goFull=true] - if false, exit full screen.
     */
    setFullscreen(goFull?: boolean): void;
    /**
     * Exit from full screen mode.
     * @deprecated
     */
    exitFullscreen(): void;
    /**
     * Returns the current player's audio volume on the media element.
     * From 0 (no audio) to 1 (maximum volume).
     * @returns {Number}
     */
    getVolume(): number;
    /**
     * Set the player's audio volume. From 0 (no volume) to 1 (maximum volume).
     * @param {Number} volume
     */
    setVolume(volume: number): void;
    /**
     * Returns true if the volume is set to 0. false otherwise.
     * @returns {Boolean}
     */
    isMute(): boolean;
    /**
     * Set the volume to 0 and save current one for when unmuted.
     */
    mute(): void;
    /**
     * Set the volume back to when it was when mute was last called.
     * If the volume was set to 0, set a default volume instead (see config).
     */
    unMute(): void;
    /**
     * Force the video bitrate to a given value. Act as a ceil.
     * -1 to set it on AUTO Mode
     * @param {Number} btr
     */
    setVideoBitrate(btr: number): void;
    /**
     * Force the audio bitrate to a given value. Act as a ceil.
     * -1 to set it on AUTO Mode
     * @param {Number} btr
     */
    setAudioBitrate(btr: number): void;
    /**
     * Update the maximum video bitrate the user can switch to.
     * @param {Number} btr
     */
    setMaxVideoBitrate(btr: number): void;
    /**
     * Update the maximum video bitrate the user can switch to.
     * @param {Number} btr
     */
    setMaxAudioBitrate(btr: number): void;
    /**
     * Set the max buffer size for the buffer behind the current position.
     * Every buffer data before will be removed.
     * @param {Number} depthInSeconds
     */
    setMaxBufferBehind(depthInSeconds: number): void;
    /**
     * Set the max buffer size for the buffer behind the current position.
     * Every buffer data before will be removed.
     * @param {Number} depthInSeconds
     */
    setMaxBufferAhead(depthInSeconds: number): void;
    /**
     * Set the max buffer size for the buffer ahead of the current position.
     * The player will stop downloading chunks when this size is reached.
     * @param {Number} sizeInSeconds
     */
    setWantedBufferAhead(sizeInSeconds: number): void;
    /**
     * Returns the max buffer size for the buffer behind the current position.
     * @returns {Number}
     */
    getMaxBufferBehind(): number;
    /**
     * Returns the max buffer size for the buffer behind the current position.
     * @returns {Number}
     */
    getMaxBufferAhead(): number;
    /**
     * Returns the max buffer size for the buffer ahead of the current position.
     * @returns {Number}
     */
    getWantedBufferAhead(): number;
    /**
     * Returns type of current keysystem (e.g. playready, widevine) if the content
     * is encrypted. null otherwise.
     * @returns {string|null}
     */
    getCurrentKeySystem(): string | null;
    /**
     * Returns every available audio tracks for the current Period.
     * @returns {Array.<Object>|null}
     */
    getAvailableAudioTracks(): ITMAudioTrackListItem[];
    /**
     * Returns every available text tracks for the current Period.
     * @returns {Array.<Object>|null}
     */
    getAvailableTextTracks(): ITMTextTrackListItem[];
    /**
     * Returns every available video tracks for the current Period.
     * @returns {Array.<Object>|null}
     */
    getAvailableVideoTracks(): ITMVideoTrackListItem[];
    /**
     * Returns currently chosen audio language for the current Period.
     * @returns {string}
     */
    getAudioTrack(): ITMAudioTrack | null | undefined;
    /**
     * Returns currently chosen subtitle for the current Period.
     * @returns {string}
     */
    getTextTrack(): ITMTextTrack | null | undefined;
    /**
     * Returns currently chosen video track for the current Period.
     * @returns {string}
     */
    getVideoTrack(): ITMVideoTrack | null | undefined;
    /**
     * Update the audio language for the current Period.
     * @param {string} audioId
     * @throws Error - the current content has no TrackManager.
     * @throws Error - the given id is linked to no audio track.
     */
    setAudioTrack(audioId: string): void;
    /**
     * Update the text language for the current Period.
     * @param {string} sub
     * @throws Error - the current content has no TrackManager.
     * @throws Error - the given id is linked to no text track.
     */
    setTextTrack(textId: string): void;
    /**
     * Disable subtitles for the current content.
     */
    disableTextTrack(): void;
    /**
     * Update the video track for the current Period.
     * @param {string} videoId
     * @throws Error - the current content has no TrackManager.
     * @throws Error - the given id is linked to no video track.
     */
    setVideoTrack(videoId: string): void;
    /**
     * Returns the current list of preferred audio tracks, in preference order.
     * @returns {Array.<Object>}
     */
    getPreferredAudioTracks(): IAudioTrackPreference[];
    /**
     * Returns the current list of preferred text tracks, in preference order.
     * @returns {Array.<Object>}
     */
    getPreferredTextTracks(): ITextTrackPreference[];
    /**
     * Set the list of preferred audio tracks, in preference order.
     * @param {Array.<Object>} tracks
     */
    setPreferredAudioTracks(tracks: IAudioTrackPreference[]): void;
    /**
     * Set the list of preferred text tracks, in preference order.
     * @param {Array.<Object>} tracks
     */
    setPreferredTextTracks(tracks: ITextTrackPreference[]): void;
    /**
     * @returns {Array.<Object>|null}
     */
    getImageTrackData(): IBifThumbnail[] | null;
    /**
     * Get minimum seek-able position.
     * @returns {number}
     */
    getMinimumPosition(): number | null;
    /**
     * Get maximum seek-able position.
     * @returns {number}
     */
    getMaximumPosition(): number | null;
    /**
     * Reset all state properties relative to a playing content.
     * @private
     */
    private _priv_cleanUpCurrentContentState;
    /**
     * Store and emit new player state (e.g. text track, videoBitrate...).
     * We check for deep equality to avoid emitting 2 consecutive times the same
     * state.
     * @param {string} eventName
     * @param {*} value - its new value
     * @private
     */
    private _priv_triggerContentEvent;
    /**
     * Triggered each time the playback Observable emits.
     *
     * React to various events.
     *
     * @param {Object} event - payload emitted
     * @private
     */
    private _priv_onPlaybackEvent;
    /**
     * Triggered when we received a fatal error.
     * Clean-up ressources and signal that the content has stopped on error.
     * @param {Error} error
     * @private
     */
    private _priv_onPlaybackError;
    /**
     * Triggered when the playback Observable completes.
     * Clean-up ressources and signal that the content has ended.
     * @private
     */
    private _priv_onPlaybackFinished;
    /**
     * Triggered when we received a warning event during playback.
     * Trigger the right API event.
     * @param {Error} error
     * @private
     */
    private _priv_onPlaybackWarning;
    /**
     * Triggered when the Manifest has been loaded for the current content.
     * Initialize various private properties and emit initial event.
     * @param {Object} value
     * @private
     */
    private _priv_onManifestReady;
    /**
     * Triggered each times the current Period Changed.
     * Store and emit initial state for the Period.
     *
     * @param {Object} value
     * @private
     */
    private _priv_onActivePeriodChanged;
    /**
     * Triggered each times a new "PeriodBuffer" is ready.
     * Choose the right Adaptation for the Period and emit it.
     * @param {Object} value
     * @private
     */
    private _priv_onPeriodBufferReady;
    /**
     * Triggered each times the we "remove" a PeriodBuffer.
     * @param {Object} value
     * @private
     */
    private _priv_onPeriodBufferCleared;
    /**
     * Triggered each time the content is re-loaded on the MediaSource.
     */
    private _priv_onReloadingMediaSource;
    /**
     * Triggered each times a new Adaptation is considered for the current
     * content.
     * Store given Adaptation and emit it if from the current Period.
     * @param {Object} value
     * @private
     */
    private _priv_onAdaptationChange;
    /**
     * Triggered each times a new Representation is considered during playback.
     *
     * Store given Representation and emit it if from the current Period.
     *
     * @param {Object} obj
     * @private
     */
    private _priv_onRepresentationChange;
    /**
     * Triggered each time a bitrate estimate is calculated.
     *
     * Emit it.
     *
     * @param {Object} value
     * @private
     */
    private _priv_onBitrateEstimationChange;
    /**
     * Triggered each time the videoElement alternates between play and pause.
     *
     * Emit the info through the right Subject.
     *
     * @param {Boolean} isPlaying
     * @private
     */
    private _priv_onPlayPauseNext;
    /**
     * Triggered each time a textTrack is added to the video DOM Element.
     *
     * Trigger the right Player Event.
     *
     * @param {Array.<TextTrackElement>} tracks
     * @private
     */
    private _priv_onNativeTextTracksNext;
    /**
     * Triggered each time the player state updates.
     *
     * Trigger the right Player Event.
     *
     * @param {string} newState
     * @private
     */
    private _priv_setPlayerState;
    /**
     * Triggered each time a new clock tick object is emitted.
     *
     * Trigger the right Player Event
     *
     * @param {Object} clockTick
     * @private
     */
    private _priv_triggerTimeChange;
}
export default Player;
