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
import { Observable, of as observableOf, } from "rxjs";
import request from "../../utils/request";
import byteRange from "../utils/byte_range";
/**
 * Segment loader triggered if there was no custom-defined one in the API.
 * @param {Object} opt
 * @returns {Observable}
 */
function regularSegmentLoader(_a) {
    var url = _a.url, segment = _a.segment;
    var range = segment.range, indexRange = segment.indexRange;
    // fire a single time for init and index ranges
    if (range != null && indexRange != null) {
        return request({
            url: url,
            responseType: "arraybuffer",
            headers: {
                Range: byteRange([
                    Math.min(range[0], indexRange[0]),
                    Math.max(range[1], indexRange[1]),
                ]),
            },
        });
    }
    return request({
        url: url,
        responseType: "arraybuffer",
        headers: range ? { Range: byteRange(range) } : null,
    });
}
/**
 * Generate a segment loader for the application
 * @param {Function} [customSegmentLoader]
 * @returns {Function}
 */
var segmentPreLoader = function (customSegmentLoader) { return function (_a) {
    var adaptation = _a.adaptation, manifest = _a.manifest, period = _a.period, representation = _a.representation, segment = _a.segment;
    var mediaURL = segment.mediaURL;
    if (mediaURL == null) {
        return observableOf({
            type: "data",
            value: { responseData: null },
        });
    }
    var args = {
        adaptation: adaptation,
        manifest: manifest,
        period: period,
        representation: representation,
        segment: segment,
        transport: "dash",
        url: mediaURL,
    };
    if (!customSegmentLoader) {
        return regularSegmentLoader(args);
    }
    return Observable.create(function (obs) {
        var hasFinished = false;
        var hasFallbacked = false;
        /**
         * Callback triggered when the custom segment loader has a response.
         * @param {Object} args
         */
        var resolve = function (_args) {
            if (!hasFallbacked) {
                hasFinished = true;
                obs.next({
                    type: "response",
                    value: {
                        responseData: _args.data,
                        size: _args.size,
                        duration: _args.duration,
                    },
                });
                obs.complete();
            }
        };
        /**
         * Callback triggered when the custom segment loader fails
         * @param {*} err - The corresponding error encountered
         */
        var reject = function (err) {
            if (err === void 0) { err = {}; }
            if (!hasFallbacked) {
                hasFinished = true;
                obs.error(err);
            }
        };
        /**
         * Callback triggered when the custom segment loader wants to fallback to
         * the "regular" implementation
         */
        var fallback = function () {
            hasFallbacked = true;
            regularSegmentLoader(args).subscribe(obs);
        };
        var callbacks = { reject: reject, resolve: resolve, fallback: fallback };
        var abort = customSegmentLoader(args, callbacks);
        return function () {
            if (!hasFinished && !hasFallbacked && typeof abort === "function") {
                abort();
            }
        };
    });
}; };
export default segmentPreLoader;
