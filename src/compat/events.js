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

import {
  HTMLElement_,
  BROWSER_PREFIXES,
} from "./constants.js";

import config from "../config.js";
import { merge } from "rxjs/observable/merge";
import { IntervalObservable } from "rxjs/observable/IntervalObservable";

import log from "../utils/log";
import { FromEventObservable } from "rxjs/observable/FromEventObservable";
import { NeverObservable } from "rxjs/observable/NeverObservable";
import { on } from "../utils/rx-utils";

const fromEvent = FromEventObservable.create;
const never = NeverObservable.create;
const interval = IntervalObservable.create;

const INACTIVITY_DELAY = config.INACTIVITY_DELAY;
const pixelRatio = window.devicePixelRatio || 1;

function isEventSupported(element, eventNameSuffix) {
  const clone = document.createElement(element.tagName);
  const eventName = "on" + eventNameSuffix;
  if (eventName in clone) {
    return true;
  } else {
    clone.setAttribute(eventName, "return;");
    return typeof clone[eventName] == "function";
  }
}

function findSupportedEvent(element, eventNames) {
  return eventNames
    .filter((name) => isEventSupported(element, name))[0];
}

function eventPrefixed(eventNames, prefixes) {
  return eventNames.reduce((parent, name) =>
    parent
      .concat((prefixes || BROWSER_PREFIXES)
      .map((p) => p + name)), []);
}

function compatibleListener(eventNames, prefixes) {
  let mem;
  eventNames = eventPrefixed(eventNames, prefixes);
  return (element) => {
    // if the element is a HTMLElement we can detect
    // the supported event, and memoize it in `mem`
    if (element instanceof HTMLElement_) {
      if (typeof mem == "undefined") {
        mem = findSupportedEvent(element, eventNames) || null;
      }

      if (mem) {
        return fromEvent(element, mem);
      } else {
        if (__DEV__) {
          log.warn(
            `compat: element <${element.tagName}> does not support any of these events: ${eventNames.join(", ")}`
          );
        }
        return never();
      }
    }

    // otherwise, we need to listen to all the events
    // and merge them into one observable sequence
    return on(element, eventNames);
  };
}

/**
 * Returns an observable:
 *   - emitting true when the visibility of document changes to hidden
 *   - emitting false when the visibility of document changes to visible
 * @returns {Observable}
 */
const visibilityChange = () => {
  let prefix;
  if (document.hidden != null) {
    prefix = "";
  } else if (document.mozHidden != null) {
    prefix = "moz";
  } else if (document.msHidden != null) {
    prefix = "ms";
  } else if (document.webkitHidden != null) {
    prefix = "webkit";
  }

  const hidden = prefix ? prefix + "Hidden" : "hidden";
  const visibilityChangeEvent = prefix + "visibilitychange";

  return on(document, visibilityChangeEvent)
    .map(() => document[hidden]);
};

const videoSizeChange = () => on(window, "resize");

const isVisible = visibilityChange() // emit false when visible
  .filter((x) => x === false);

// Emit true if the visibility changed to hidden since 60s
const isHidden = visibilityChange()
  .debounceTime(INACTIVITY_DELAY)
  .filter((x) => x === true);

const inBackground = () => merge(isVisible, isHidden)
  .startWith(false);

const videoWidth = videoElement => {
  return merge(
    interval(20000),
    videoSizeChange().debounceTime(500)
  )
    .startWith("init") // emit on subscription
    .map(() => videoElement.clientWidth * pixelRatio)
    .distinctUntilChanged();

};

const loadedMetadata = compatibleListener(["loadedmetadata"]);
const fullscreenChange = compatibleListener(
  ["fullscreenchange", "FullscreenChange"],

  // On IE11, fullscreen change events is called MSFullscreenChange
  BROWSER_PREFIXES.concat("MS")
);
const sourceOpen = compatibleListener(["sourceopen", "webkitsourceopen"]);
const onEncrypted = compatibleListener(["encrypted", "needkey"]);
const onKeyMessage = compatibleListener(["keymessage", "message"]);
const onKeyAdded = compatibleListener(["keyadded", "ready"]);
const onKeyError = compatibleListener(["keyerror", "error"]);
const onKeyStatusesChange = compatibleListener(["keystatuseschange"]);

export {
  inBackground,
  videoWidth,
  loadedMetadata,
  fullscreenChange,
  sourceOpen,
  onEncrypted,
  onKeyMessage,
  onKeyAdded,
  onKeyError,
  onKeyStatusesChange,
};
