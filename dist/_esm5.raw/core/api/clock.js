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
 * This file defines a global clock for the RxPlayer.
 *
 * Each clock tick also pass informations about the current state of the
 * media element to sub-parts of the player.
 */
import objectAssign from "object-assign";
import { Observable, ReplaySubject, } from "rxjs";
import { multicast, refCount, } from "rxjs/operators";
import config from "../../config";
import log from "../../log";
import { getLeftSizeOfRange, getRange, } from "../../utils/ranges";
function isMediaInfoState(state) {
    return state === "init" ||
        state === "canplay" ||
        state === "play" ||
        state === "progress" ||
        state === "seeking" ||
        state === "seeked" ||
        state === "loadedmetadata" ||
        state === "ratechange" ||
        state === "timeupdate";
}
var SAMPLING_INTERVAL_MEDIASOURCE = config.SAMPLING_INTERVAL_MEDIASOURCE, SAMPLING_INTERVAL_NO_MEDIASOURCE = config.SAMPLING_INTERVAL_NO_MEDIASOURCE, RESUME_GAP_AFTER_SEEKING = config.RESUME_GAP_AFTER_SEEKING, RESUME_GAP_AFTER_NOT_ENOUGH_DATA = config.RESUME_GAP_AFTER_NOT_ENOUGH_DATA, RESUME_GAP_AFTER_BUFFERING = config.RESUME_GAP_AFTER_BUFFERING, STALL_GAP = config.STALL_GAP;
/**
 * HTMLMediaElement Events for which timings are calculated and emitted.
 * @type {Array.<string>}
 */
var SCANNED_MEDIA_ELEMENTS_EVENTS = [
    "canplay",
    "play",
    "progress",
    "seeking",
    "seeked",
    "loadedmetadata",
    "ratechange",
];
/**
 * Returns the amount of time in seconds the buffer should have ahead of the
 * current position before resuming playback. Based on the infos of the stall.
 * Waiting time differs between a "seeking" stall and a buffering stall.
 * @param {Object|null} stalled
 * @returns {Number}
 */
function getResumeGap(stalled) {
    if (!stalled) {
        return 0;
    }
    switch (stalled.reason) {
        case "seeking":
            return RESUME_GAP_AFTER_SEEKING;
        case "not-ready":
            return RESUME_GAP_AFTER_NOT_ENOUGH_DATA;
        default:
            return RESUME_GAP_AFTER_BUFFERING;
    }
}
/**
 * @param {Object} currentRange
 * @param {Number} duration
 * @returns {Boolean}
 */
function hasLoadedUntilTheEnd(currentRange, duration) {
    return currentRange != null && (duration - currentRange.end) <= STALL_GAP;
}
/**
 * Generate a basic timings object from the media element and the eventName
 * which triggered the request.
 * @param {HTMLMediaElement} mediaElement
 * @param {string} currentState
 * @returns {Object}
 */
function getMediaInfos(mediaElement, currentState) {
    var buffered = mediaElement.buffered, currentTime = mediaElement.currentTime, duration = mediaElement.duration, ended = mediaElement.ended, paused = mediaElement.paused, playbackRate = mediaElement.playbackRate, readyState = mediaElement.readyState, seeking = mediaElement.seeking;
    return {
        bufferGap: getLeftSizeOfRange(buffered, currentTime),
        buffered: buffered,
        currentRange: getRange(buffered, currentTime),
        currentTime: currentTime,
        duration: duration,
        ended: ended,
        paused: paused,
        playbackRate: playbackRate,
        readyState: readyState,
        seeking: seeking,
        state: currentState,
    };
}
/**
 * Infer stalled status of the media based on:
 *   - the return of the function getMediaInfos
 *   - the previous timings object.
 *
 * @param {Object} prevTimings - Previous timings object. See function to know
 * the different properties needed.
 * @param {Object} currentTimings - Current timings object. This does not need
 * to have every single infos, see function to know which properties are needed.
 * @param {Boolean} withMediaSource - False if the directfile API is used.
 * @returns {Object|null}
 */
function getStalledStatus(prevTimings, currentTimings, withMediaSource) {
    var currentState = currentTimings.state, currentTime = currentTimings.currentTime, bufferGap = currentTimings.bufferGap, currentRange = currentTimings.currentRange, duration = currentTimings.duration, paused = currentTimings.paused, readyState = currentTimings.readyState, ended = currentTimings.ended;
    var prevStalled = prevTimings.stalled, prevState = prevTimings.state, prevTime = prevTimings.currentTime;
    var fullyLoaded = hasLoadedUntilTheEnd(currentRange, duration);
    var canStall = (readyState >= 1 &&
        currentState !== "loadedmetadata" &&
        !prevStalled &&
        !(fullyLoaded || ended));
    var shouldStall;
    var shouldUnstall;
    if (withMediaSource) {
        if (canStall &&
            (bufferGap <= STALL_GAP || bufferGap === Infinity || readyState === 1)) {
            shouldStall = true;
        }
        else if (prevStalled &&
            readyState > 1 &&
            bufferGap < Infinity &&
            (bufferGap > getResumeGap(prevStalled) || fullyLoaded || ended)) {
            shouldUnstall = true;
        }
    }
    // when using a direct file, the media will stall and unstall on its
    // own, so we only try to detect when the media timestamp has not changed
    // between two consecutive timeupdates
    else {
        if (canStall &&
            (!paused && currentState === "timeupdate" &&
                prevState === "timeupdate" && currentTime === prevTime ||
                currentState === "seeking" && bufferGap === Infinity)) {
            shouldStall = true;
        }
        else if (prevStalled &&
            (currentState !== "seeking" && currentTime !== prevTime ||
                currentState === "canplay" ||
                bufferGap < Infinity &&
                    (bufferGap > getResumeGap(prevStalled) || fullyLoaded || ended))) {
            shouldUnstall = true;
        }
    }
    if (shouldStall) {
        var reason = void 0;
        if (currentState === "seeking" || currentTimings.seeking) {
            reason = "seeking";
        }
        else if (readyState === 1) {
            reason = "not-ready";
        }
        else {
            reason = "buffering";
        }
        return {
            reason: reason,
            timestamp: performance.now(),
        };
    }
    else if (shouldUnstall) {
        return null;
    }
    else {
        return prevStalled;
    }
}
/**
 * Timings observable.
 *
 * This Observable samples snapshots of player's current state:
 *   * time position
 *   * playback rate
 *   * current buffered range
 *   * gap with current buffered range ending
 *   * media duration
 *
 * In addition to sampling, this Observable also reacts to "seeking" and "play"
 * events.
 *
 * Observable is shared for performance reason: reduces the number of event
 * listeners and intervals/timeouts but also limit access to the media element
 * properties and gap calculations.
 *
 * The sampling is manual instead of based on "timeupdate" to reduce the
 * number of events.
 * @param {HTMLMediaElement} mediaElement
 * @param {Object} options
 * @returns {Observable}
 */
function createClock(mediaElement, _a) {
    var withMediaSource = _a.withMediaSource;
    return Observable.create(function (obs) {
        var lastTimings = objectAssign(getMediaInfos(mediaElement, "init"), { stalled: null });
        /**
         * Emit timings sample.
         * Meant to be used as a callback on various async events.
         * @param {Event} [evt] - The Event which triggered the callback, if one.
         */
        function emitSample(evt) {
            var state = evt && isMediaInfoState(evt.type) ?
                evt.type : "timeupdate";
            var mediaTimings = getMediaInfos(mediaElement, state);
            var stalledState = getStalledStatus(lastTimings, mediaTimings, withMediaSource);
            // /!\ Mutate mediaTimings
            lastTimings = objectAssign(mediaTimings, { stalled: stalledState });
            log.debug("API: new clock tick", lastTimings);
            obs.next(lastTimings);
        }
        var interval = withMediaSource
            ? SAMPLING_INTERVAL_MEDIASOURCE
            : SAMPLING_INTERVAL_NO_MEDIASOURCE;
        var intervalID = setInterval(emitSample, interval);
        SCANNED_MEDIA_ELEMENTS_EVENTS.forEach(function (eventName) {
            return mediaElement.addEventListener(eventName, emitSample);
        });
        obs.next(lastTimings);
        return function () {
            clearInterval(intervalID);
            SCANNED_MEDIA_ELEMENTS_EVENTS.forEach(function (eventName) {
                return mediaElement.removeEventListener(eventName, emitSample);
            });
        };
    }).pipe(multicast(function () { return new ReplaySubject(1); }), // Always emit the last
    refCount());
}
export default createClock;
