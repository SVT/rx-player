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
import { concat as observableConcat, interval as observableInterval, merge as observableMerge, of as observableOf, Subject, } from "rxjs";
import { mapTo, startWith, switchMapTo, takeUntil, } from "rxjs/operators";
import { events } from "../../../../compat";
import config from "../../../../config";
import log from "../../../../log";
import AbstractSourceBuffer from "../../abstract_source_buffer";
import TextBufferManager from "./buffer_manager";
import parseTextTrackToElements from "./parsers";
var onEnded$ = events.onEnded$, onSeeked$ = events.onSeeked$, onSeeking$ = events.onSeeking$;
var MAXIMUM_HTML_TEXT_TRACK_UPDATE_INTERVAL = config.MAXIMUM_HTML_TEXT_TRACK_UPDATE_INTERVAL;
/**
 * Generate the clock at which TextTrack HTML Cues should be refreshed.
 * @param {HTMLMediaElement} videoElement
 * @returns {Observable}
 */
function generateClock(videoElement) {
    var seeking$ = onSeeking$(videoElement);
    var seeked$ = onSeeked$(videoElement);
    var ended$ = onEnded$(videoElement);
    var manualRefresh$ = observableMerge(seeked$, ended$);
    var autoRefresh$ = observableInterval(MAXIMUM_HTML_TEXT_TRACK_UPDATE_INTERVAL)
        .pipe(startWith(null));
    return manualRefresh$.pipe(startWith(null), switchMapTo(observableConcat(autoRefresh$
        .pipe(mapTo(true), takeUntil(seeking$)), observableOf(false))));
}
/**
 * @param {Element} element
 * @param {Element|null} [child]
 */
function safelyRemoveChild(element, child) {
    if (child) {
        try {
            element.removeChild(child);
        }
        catch (e) {
            log.warn("HTSB: Can't remove text track: not in the element.");
        }
    }
}
/**
 * SourceBuffer to display TextTracks in the given HTML element.
 * @class HTMLTextSourceBuffer
 */
var HTMLTextSourceBuffer = /** @class */ (function (_super) {
    __extends(HTMLTextSourceBuffer, _super);
    /**
     * @param {HTMLMediaElement} videoElement
     * @param {HTMLElement} textTrackElement
     */
    function HTMLTextSourceBuffer(videoElement, textTrackElement) {
        var _this = this;
        log.debug("HTSB: Creating html text track SourceBuffer");
        _this = _super.call(this) || this;
        _this._videoElement = videoElement;
        _this._textTrackElement = textTrackElement;
        _this._destroy$ = new Subject();
        _this._buffer = new TextBufferManager();
        _this._currentElement = null;
        generateClock(_this._videoElement)
            .pipe(takeUntil(_this._destroy$))
            .subscribe(function (shouldDisplay) {
            if (!shouldDisplay) {
                safelyRemoveChild(textTrackElement, _this._currentElement);
                _this._currentElement = null;
                return;
            }
            // to spread the time error, we divide the regular chosen interval.
            // As the clock is also based on real video events, we cannot just
            // divide by two the regular interval.
            var time = Math.max(_this._videoElement.currentTime -
                MAXIMUM_HTML_TEXT_TRACK_UPDATE_INTERVAL / 2000, 0);
            var cue = _this._buffer.get(time);
            if (!cue) {
                safelyRemoveChild(textTrackElement, _this._currentElement);
                _this._currentElement = null;
                return;
            }
            else if (_this._currentElement === cue.element) {
                return;
            }
            safelyRemoveChild(textTrackElement, _this._currentElement);
            _this._currentElement = cue.element;
            textTrackElement.appendChild(_this._currentElement);
        });
        return _this;
    }
    /**
     * Append text tracks.
     * @param {Object} data
     */
    HTMLTextSourceBuffer.prototype._append = function (data) {
        log.debug("HTSB: Appending new html text tracks", data);
        var timescale = data.timescale, // timescale for the start and end
        timescaledStart = data.start, // exact beginning to which the track applies
        timescaledEnd = data.end, // exact end to which the track applies
        dataString = data.data, // text track content. Should be a string
        type = data.type, // type of texttracks (e.g. "ttml" or "vtt")
        language = data.language;
        if (timescaledEnd && timescaledEnd - timescaledStart <= 0) {
            // this is accepted for error resilience, just skip that case.
            /* tslint:disable:max-line-length */
            log.warn("HTSB: Invalid text track appended: the start time is inferior or equal to the end time.");
            /* tslint:enable:max-line-length */
            return;
        }
        var startTime = timescaledStart / timescale;
        var endTime = timescaledEnd != null ?
            timescaledEnd / timescale : undefined;
        var cues = parseTextTrackToElements(type, dataString, this.timestampOffset, language);
        var start = startTime;
        var end = endTime != null ? endTime : cues[cues.length - 1].end;
        this._buffer.insert(cues, start, end);
        this.buffered.insert(start, end);
    };
    /**
     * @param {Number} from
     * @param {Number} to
     */
    HTMLTextSourceBuffer.prototype._remove = function (from, to) {
        log.debug("HTSB: Removing html text track data", from, to);
        this._buffer.remove(from, to);
        this.buffered.remove(from, to);
    };
    /**
     * Free up ressources from this sourceBuffer
     */
    HTMLTextSourceBuffer.prototype._abort = function () {
        log.debug("HTSB: Aborting html text track SourceBuffer");
        this._destroy$.next();
        this._destroy$.complete();
        safelyRemoveChild(this._textTrackElement, this._currentElement);
    };
    return HTMLTextSourceBuffer;
}(AbstractSourceBuffer));
export default HTMLTextSourceBuffer;
