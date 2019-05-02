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
 * This file provides browser-agnostic event listeners under the form of
 * RxJS Observables
 */
import { fromEvent as observableFromEvent, interval as observableInterval, merge as observableMerge, NEVER, } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, map, startWith, } from "rxjs/operators";
import config from "../config";
import log from "../log";
import { HTMLElement_, } from "./browser_compatibility_types";
var BROWSER_PREFIXES = ["", "webkit", "moz", "ms"];
var INACTIVITY_DELAY = config.INACTIVITY_DELAY;
var pixelRatio = window.devicePixelRatio || 1;
/**
 * Find the first supported event from the list given.
 * @param {HTMLElement} element
 * @param {string} eventNameSuffix
 * @returns {Boolean}
 */
function isEventSupported(element, eventNameSuffix) {
    var clone = document.createElement(element.tagName);
    var eventName = "on" + eventNameSuffix;
    if (eventName in clone) {
        return true;
    }
    else {
        clone.setAttribute(eventName, "return;");
        return typeof clone[eventName] === "function";
    }
}
/**
 * Find the first supported event from the list given.
 * @param {HTMLElement} element
 * @param {Array.<string>} eventNames
 * @returns {string|undefined}
 */
function findSupportedEvent(element, eventNames) {
    return eventNames
        .filter(function (name) { return isEventSupported(element, name); })[0];
}
/**
 * @param {Array.<string>} eventNames
 * @param {Array.<string>|undefined} prefixes
 * @returns {Array.<string>}
 */
function eventPrefixed(eventNames, prefixes) {
    return eventNames.reduce(function (parent, name) {
        return parent
            .concat((prefixes || BROWSER_PREFIXES)
            .map(function (p) { return p + name; }));
    }, []);
}
/**
 * @param {Array.<string>} eventNames
 * @param {Array.<string>|undefined} prefixes
 * @returns {Observable}
 */
function compatibleListener(eventNames, prefixes) {
    var mem;
    var prefixedEvents = eventPrefixed(eventNames, prefixes);
    return function (element) {
        // if the element is a HTMLElement we can detect
        // the supported event, and memoize it in `mem`
        if (element instanceof HTMLElement_) {
            if (typeof mem === "undefined") {
                mem = findSupportedEvent(element, prefixedEvents);
            }
            if (mem) {
                return observableFromEvent(element, mem);
            }
            else {
                if (__DEV__) {
                    /* tslint:disable:max-line-length */
                    log.warn("compat: element <" + element.tagName + "> does not support any of these events: " + prefixedEvents.join(", ")
                    /* tslint:enable:max-line-length */
                    );
                }
                return NEVER;
            }
        }
        // otherwise, we need to listen to all the events
        // and merge them into one observable sequence
        return observableMerge.apply(void 0, prefixedEvents
            .map(function (eventName) { return observableFromEvent(element, eventName); }));
    };
}
/**
 * Returns an observable:
 *   - emitting true when the visibility of document changes to hidden
 *   - emitting false when the visibility of document changes to visible
 * @returns {Observable}
 */
function visibilityChange() {
    var prefix;
    var doc = document;
    if (doc.hidden != null) {
        prefix = "";
    }
    else if (doc.mozHidden != null) {
        prefix = "moz";
    }
    else if (doc.msHidden != null) {
        prefix = "ms";
    }
    else if (doc.webkitHidden != null) {
        prefix = "webkit";
    }
    var hidden = prefix ? prefix + "Hidden" : "hidden";
    var visibilityChangeEvent = prefix + "visibilitychange";
    return observableFromEvent(document, visibilityChangeEvent)
        .pipe(map(function () { return document[hidden]; }));
}
/**
 * @returns {Observable}
 */
function videoSizeChange() {
    return observableFromEvent(window, "resize");
}
var isVisible$ = visibilityChange()
    .pipe(filter(function (x) { return !x; })); // emit false when visible
// Emit true if the visibility changed to hidden since 60s
var isHidden$ = visibilityChange()
    .pipe(debounceTime(INACTIVITY_DELAY), filter(function (x) { return x; }));
/**
 * @returns {Observable}
 */
function isInBackground$() {
    return observableMerge(isVisible$, isHidden$)
        .pipe(startWith(false));
}
/**
 * @param {HTMLMediaElement} mediaElement
 * @returns {Observable}
 */
function videoWidth$(mediaElement) {
    return observableMerge(observableInterval(20000), videoSizeChange().pipe(debounceTime(500))).pipe(startWith(null), // emit on subscription
    map(function () { return mediaElement.clientWidth * pixelRatio; }), distinctUntilChanged());
}
/**
 * @param {HTMLMediaElement} mediaElement
 * @returns {Observable}
 */
var onLoadedMetadata$ = compatibleListener(["loadedmetadata"]);
/**
 * @param {HTMLMediaElement} mediaElement
 * @returns {Observable}
 */
var onSeeking$ = compatibleListener(["seeking"]);
/**
 * @param {HTMLMediaElement} mediaElement
 * @returns {Observable}
 */
var onSeeked$ = compatibleListener(["seeked"]);
/**
 * @param {HTMLMediaElement} mediaElement
 * @returns {Observable}
 */
var onEnded$ = compatibleListener(["ended"]);
/**
 * @param {HTMLMediaElement} mediaElement
 * @returns {Observable}
 */
var onTimeUpdate$ = compatibleListener(["timeupdate"]);
/**
 * @param {HTMLElement} element
 * @returns {Observable}
 */
var onFullscreenChange$ = compatibleListener(["fullscreenchange", "FullscreenChange"], 
// On IE11, fullscreen change events is called MSFullscreenChange
BROWSER_PREFIXES.concat("MS"));
/**
 * @param {HTMLMediaElement} mediaElement
 * @returns {Observable}
 */
var onPlayPause$ = function (mediaElement) {
    return observableMerge(compatibleListener(["play"])(mediaElement), compatibleListener(["pause"])(mediaElement));
};
/**
 * @param {HTMLMediaElement} mediaElement
 * @returns {Observable}
 */
var onTextTrackChanges$ = function (textTrackList) {
    return observableMerge(compatibleListener(["addtrack"])(textTrackList), compatibleListener(["removetrack"])(textTrackList));
};
/**
 * @param {MediaSource} mediaSource
 * @returns {Observable}
 */
var onSourceOpen$ = compatibleListener(["sourceopen", "webkitsourceopen"]);
/**
 * @param {SourceBuffer} sourceBuffer
 * @returns {Observable}
 */
var onUpdate$ = compatibleListener(["update"]);
/**
 * @param {MediaSource} mediaSource
 * @returns {Observable}
 */
var onRemoveSourceBuffers$ = compatibleListener(["onremovesourcebuffer"]);
/**
 * @param {HTMLMediaElement} mediaElement
 * @returns {Observable}
 */
var onEncrypted$ = compatibleListener(["encrypted", "needkey"]);
/**
 * @param {MediaKeySession} mediaKeySession
 * @returns {Observable}
 */
var onKeyMessage$ = compatibleListener(["keymessage", "message"]);
/**
 * @param {MediaKeySession} mediaKeySession
 * @returns {Observable}
 */
var onKeyAdded$ = compatibleListener(["keyadded", "ready"]);
/**
 * @param {MediaKeySession} mediaKeySession
 * @returns {Observable}
 */
var onKeyError$ = compatibleListener(["keyerror", "error"]);
/**
 * @param {MediaKeySession} mediaKeySession
 * @returns {Observable}
 */
var onKeyStatusesChange$ = compatibleListener(["keystatuseschange"]);
export { isInBackground$, videoWidth$, onPlayPause$, onTextTrackChanges$, onLoadedMetadata$, onSeeking$, onSeeked$, onEnded$, onTimeUpdate$, onFullscreenChange$, onSourceOpen$, onUpdate$, onRemoveSourceBuffers$, onEncrypted$, onKeyMessage$, onKeyAdded$, onKeyError$, onKeyStatusesChange$, };
