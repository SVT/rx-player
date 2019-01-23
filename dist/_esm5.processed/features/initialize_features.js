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
import features from "./index";
/**
 * Selects the features to include based on environment variables.
 *
 * @param {Object} features
 */
export default function initializeFeaturesObject() {
    /* tslint:disable no-var-requires */
    if (false) {
        features.emeManager = require("../core/eme/index.js").default;
    }
    /* tslint:enable no-var-requires */
    /* tslint:disable no-var-requires */
    if (false) {
        features.imageBuffer = require("../core/source_buffers/image/index.js").default;
        features.imageParser = require("../parsers/images/bif.js").default;
    }
    /* tslint:enable no-var-requires */
    // Feature switching the Native TextTrack implementation
    var HAS_NATIVE_MODE = false ||
        false ||
        false ||
        false;
    /* tslint:disable no-var-requires */
    if (false) {
        features.transports.smooth = require("../transports/smooth/index.js").default;
    }
    if (false) {
        features.transports.dash = require("../transports/dash/index.js").default;
    }
    /* tslint:enable no-var-requires */
    /* tslint:disable no-var-requires */
    if (HAS_NATIVE_MODE) {
        features.nativeTextTracksBuffer =
            require("../core/source_buffers/text/native/index.js").default;
        if (false) {
            features.nativeTextTracksParsers.vtt =
                require("../parsers/texttracks/webvtt/native.js").default;
        }
        if (false) {
            features.nativeTextTracksParsers.ttml =
                require("../parsers/texttracks/ttml/native/index.js").default;
        }
        if (false) {
            features.nativeTextTracksParsers.sami =
                require("../parsers/texttracks/sami/native.js").default;
        }
        if (false) {
            features.nativeTextTracksParsers.srt =
                require("../parsers/texttracks/srt/native.js").default;
        }
    }
    /* tslint:enable no-var-requires */
    // Feature switching the HTML TextTrack implementation
    var HAS_HTML_MODE = false ||
        false ||
        false ||
        false;
    /* tslint:disable no-var-requires */
    if (HAS_HTML_MODE) {
        features.htmlTextTracksBuffer =
            require("../core/source_buffers/text/html/index.js").default;
        if (false) {
            features.htmlTextTracksParsers.sami =
                require("../parsers/texttracks/sami/html.js").default;
        }
        if (false) {
            features.htmlTextTracksParsers.ttml =
                require("../parsers/texttracks/ttml/html/index.js").default;
        }
        if (false) {
            features.htmlTextTracksParsers.srt =
                require("../parsers/texttracks/srt/html.js").default;
        }
        if (false) {
            features.htmlTextTracksParsers.vtt =
                require("../parsers/texttracks/webvtt/html/index.js").default;
        }
        /* tslint:enable no-var-requires */
    }
    /* tslint:disable no-var-requires */
    if (false) {
        features.directfile = require("../core/init/directfile.js").default;
    }
    /* tslint:enable no-var-requires */
}
