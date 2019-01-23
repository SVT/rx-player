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
import { concat as observableConcat, of as observableOf, ReplaySubject, } from "rxjs";
import { catchError, filter, mapTo, mergeMap, multicast, refCount, take, tap, } from "rxjs/operators";
import { events, play$, shouldValidateMetadata } from "../../compat";
import log from "../../log";
// XXX TODO Are we sure we shouldn't use whenLoadedMetadata here?
var onLoadedMetadata$ = events.onLoadedMetadata$;
/**
 * Emit once a "can-play" message as soon as the clock$ anounce that the content
 * can begin to be played.
 *
 * Warn you if the metadata is not yet loaded metadata by emitting a
 * "not-loaded-metadata" message first.
 * @param {Observable} clock$
 * @returns {Observable}
 */
function canPlay(clock$, mediaElement) {
    var isLoaded$ = clock$.pipe(filter(function (tick) {
        var seeking = tick.seeking, stalled = tick.stalled, readyState = tick.readyState, currentRange = tick.currentRange;
        return !seeking &&
            stalled == null &&
            (readyState === 4 || readyState === 3 && currentRange != null) &&
            (!shouldValidateMetadata() || mediaElement.duration > 0);
    }), take(1), mapTo("can-play"));
    if (shouldValidateMetadata() && mediaElement.duration === 0) {
        return observableConcat(observableOf("not-loaded-metadata"), isLoaded$);
    }
    return isLoaded$;
}
/**
 * Try to play content then handle autoplay errors.
 * @param {HTMLMediaElement} - mediaElement
 * @returns {Observable}
 */
function autoPlay$(mediaElement) {
    return play$(mediaElement).pipe(mapTo("autoplay"), catchError(function (error) {
        if (error.name === "NotAllowedError") {
            // auto-play was probably prevented.
            log.warn("Init: Media element can't play." +
                " It may be due to browser auto-play policies.");
            return observableOf("autoplay-blocked");
        }
        else {
            throw error;
        }
    }));
}
/**
 * Returns two Observables:
 *
 *   - seek$: when subscribed, will seek to the wanted started time as soon as
 *     it can. Emit and complete when done.
 *
 *   - load$: when subscribed, will play if and only if the `mustAutoPlay`
 *     option is set as soon as it can. Emit and complete when done.
 *     When this observable emits, it also means that the content is `loaded`
 *     and can begin to play the current content.
 *
 * @param {HTMLMediaElement} mediaElement
 * @param {number|Function} startTime - Initial starting position. As seconds
 * or as a function returning seconds.
 * @param {boolean} autoPlay - Whether the player should auto-play
 * @returns {object}
 */
export default function seekAndLoadOnMediaEvents(clock$, mediaElement, startTime, mustAutoPlay) {
    var seek$ = onLoadedMetadata$(mediaElement).pipe(tap(function () {
        log.info("Init: Set initial time", startTime);
        mediaElement.currentTime = typeof startTime === "function" ?
            startTime() : startTime;
    }), 
    // equivalent to a sane shareReplay:
    // https://github.com/ReactiveX/rxjs/issues/3336
    // XXX TODO Replace it when that issue is resolved
    multicast(function () { return new ReplaySubject(1); }), refCount());
    var load$ = seek$.pipe(mergeMap(function () {
        return canPlay(clock$, mediaElement).pipe(tap(function () { return log.info("Init: Can begin to play content"); }), mergeMap(function (evt) {
            if (evt === "can-play") {
                if (!mustAutoPlay) {
                    return observableOf("loaded");
                }
                return autoPlay$(mediaElement);
            }
            return observableOf(evt);
        }));
    }), 
    // equivalent to a sane shareReplay:
    // https://github.com/ReactiveX/rxjs/issues/3336
    // XXX TODO Replace it when that issue is resolved
    multicast(function () { return new ReplaySubject(1); }), refCount());
    return { seek$: seek$, load$: load$ };
}
