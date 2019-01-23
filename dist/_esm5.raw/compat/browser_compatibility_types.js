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
import { MediaError } from "../errors";
var win = window;
var HTMLElement_ = win.HTMLElement;
var VTTCue_ = win.VTTCue ||
    win.TextTrackCue;
var MediaSource_ = win.MediaSource ||
    win.MozMediaSource ||
    win.WebKitMediaSource ||
    win.MSMediaSource;
var MediaKeys_ = win.MediaKeys ||
    win.MozMediaKeys ||
    win.WebKitMediaKeys ||
    win.MSMediaKeys || /** @class */ (function () {
    function class_1() {
        var noMediaKeys = function () {
            throw new MediaError("MEDIA_KEYS_NOT_SUPPORTED", null, true);
        };
        this.create = noMediaKeys;
        this.createSession = noMediaKeys;
        this.isTypeSupported = noMediaKeys;
        this.setServerCertificate = noMediaKeys;
    }
    return class_1;
}());
var READY_STATES = {
    HAVE_NOTHING: 0,
    HAVE_METADATA: 1,
    HAVE_CURRENT_DATA: 2,
    HAVE_FUTURE_DATA: 3,
    HAVE_ENOUGH_DATA: 4,
};
export { HTMLElement_, MediaKeys_, MediaSource_, READY_STATES, VTTCue_, };
