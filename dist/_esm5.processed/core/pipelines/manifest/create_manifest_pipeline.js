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
import { catchError, filter, map, mergeMap, share, tap, } from "rxjs/operators";
import config from "../../../config";
import { isKnownError, NetworkError, OtherError, RequestError, } from "../../../errors";
import tryCatch from "../../../utils/rx-try_catch";
import downloadingBackoff from "../utils/backoff";
import createLoader from "../utils/create_loader";
var MAX_BACKOFF_DELAY_BASE = config.MAX_BACKOFF_DELAY_BASE, INITIAL_BACKOFF_DELAY_BASE = config.INITIAL_BACKOFF_DELAY_BASE;
/**
 * Generate a new error from the infos given.
 * @param {string} code
 * @param {Error} error
 * @param {Boolean} fatal - Whether the error is fatal to the content's
 * playback.
 * @returns {Error}
 */
function errorSelector(code, error, fatal) {
    if (!isKnownError(error)) {
        if (error instanceof RequestError) {
            return new NetworkError(code, error, fatal);
        }
        return new OtherError(code, error.toString(), fatal);
    }
    return error;
}
/**
 * Create function allowing to easily fetch and parse the manifest from its URL.
 *
 * @example
 * ```js
 * const manifestPipeline = createManifestPipeline(transport, options, warning$);
 * manifestPipeline(manifestURL)
 *  .subscribe(manifest => console.log("Manifest:", manifest));
 * ```
 *
 * @param {Object} transport
 * @param {Subject} warning$
 * @param {Array.<Object>|undefined} supplementaryTextTracks
 * @param {Array.<Object>|undefined} supplementaryImageTrack
 * @returns {Function}
 */
export default function createManifestPipeline(pipelines, pipelineOptions, warning$) {
    var loader = createLoader(pipelines.manifest, pipelineOptions);
    var parser = pipelines.manifest.parser;
    /**
     * Allow the parser to schedule a new request.
     * @param {Object} transportPipeline
     * @param {Object} options
     * @returns {Function}
     */
    function scheduleRequest(request) {
        var maxRetry = pipelineOptions.maxRetry, maxRetryOffline = pipelineOptions.maxRetryOffline;
        var backoffOptions = {
            baseDelay: INITIAL_BACKOFF_DELAY_BASE,
            maxDelay: MAX_BACKOFF_DELAY_BASE,
            maxRetryRegular: maxRetry,
            maxRetryOffline: maxRetryOffline,
            onRetry: function (error) {
                warning$.next(errorSelector("PIPELINE_LOAD_ERROR", error, false));
            },
        };
        return downloadingBackoff(tryCatch(request, undefined), backoffOptions).pipe(catchError(function (error) {
            throw errorSelector("PIPELINE_LOAD_ERROR", error, true);
        }));
    }
    /**
     * Fetch and parse the manifest corresponding to the URL given.
     * @param {Object} options
     * @returns {Observable}
     */
    return function fetchManifest(_a) {
        var url = _a.url, hasClockSynchronization = _a.hasClockSynchronization;
        return loader({ url: url }).pipe(tap(function (arg) {
            if (arg.type === "error") {
                warning$.next(arg.value);
            }
        }), filter(function (arg) {
            return arg.type === "response";
        }), mergeMap(function (_a) {
            var value = _a.value;
            var sendingTime = value.sendingTime;
            return parser({
                response: value,
                url: url,
                hasClockSynchronization: hasClockSynchronization,
                scheduleRequest: scheduleRequest,
            }).pipe(catchError(function (error) {
                var formattedError = isKnownError(error) ?
                    error : new OtherError("PIPELINE_PARSING_ERROR", error.toString(), true);
                throw formattedError;
            }), map(function (_a) {
                var manifest = _a.manifest;
                var warnings = manifest.parsingErrors;
                for (var i = 0; i < warnings.length; i++) {
                    warning$.next(warnings[i]); // TODO not through warning$
                }
                return { manifest: manifest, sendingTime: sendingTime };
            }));
        }), share());
    };
}
