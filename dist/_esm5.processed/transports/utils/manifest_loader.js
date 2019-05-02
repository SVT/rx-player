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
import { Observable } from "rxjs";
import request from "../../utils/request";
/**
 * Manifest loader triggered if there was no custom-defined one in the API.
 * @param {string} url
 */
function regularManifestLoader(url, ignoreProgressEvents) {
    return request({
        url: url,
        responseType: "document",
        ignoreProgressEvents: ignoreProgressEvents,
    });
}
/**
 * Generate a manifest loader for the application
 * @param {Function} [customManifestLoader]
 * @returns {Function}
 */
var manifestPreLoader = function (options) { return function (url) {
    var customManifestLoader = options.customManifestLoader, ignoreProgressEvents = options.ignoreProgressEvents;
    if (!customManifestLoader) {
        return regularManifestLoader(url, ignoreProgressEvents);
    }
    var timeAPIsDelta = Date.now() - performance.now();
    return new Observable(function (obs) {
        var hasFinished = false;
        var hasFallbacked = false;
        /**
         * Callback triggered when the custom manifest loader has a response.
         * @param {Object} args - Which contains:
         *   - data {*} - The manifest data
         *   - size {Number} - The manifest size
         *   - duration {Number} - The duration of the request, in ms
         */
        var resolve = function (_args) {
            if (!hasFallbacked) {
                hasFinished = true;
                var receivedTime = _args.receivingTime != null ?
                    _args.receivingTime - timeAPIsDelta : undefined;
                var sendingTime = _args.sendingTime != null ?
                    _args.sendingTime - timeAPIsDelta : undefined;
                obs.next({
                    type: "response",
                    value: {
                        responseData: _args.data,
                        size: _args.size,
                        duration: _args.duration,
                        url: _args.url,
                        receivedTime: receivedTime,
                        sendingTime: sendingTime,
                    },
                });
                obs.complete();
            }
        };
        /**
         * Callback triggered when the custom manifest loader fails
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
         * Callback triggered when the custom manifest loader wants to fallback to
         * the "regular" implementation
         */
        var fallback = function () {
            hasFallbacked = true;
            regularManifestLoader(url).subscribe(obs);
        };
        var callbacks = { reject: reject, resolve: resolve, fallback: fallback };
        var abort = customManifestLoader(url, callbacks);
        return function () {
            if (!hasFinished && !hasFallbacked && typeof abort === "function") {
                abort();
            }
        };
    });
}; };
export default manifestPreLoader;
