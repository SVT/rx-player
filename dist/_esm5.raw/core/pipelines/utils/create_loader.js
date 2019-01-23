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
import objectAssign from "object-assign";
import { concat as observableConcat, EMPTY, merge as observableMerge, Observable, of as observableOf, Subject, } from "rxjs";
import { catchError, finalize, map, mergeMap, tap, } from "rxjs/operators";
import config from "../../../config";
import { isKnownError, NetworkError, OtherError, RequestError, } from "../../../errors";
import castToObservable from "../../../utils/cast_to_observable";
import tryCatch from "../../../utils/rx-try_catch";
import downloadingBackoff from "./backoff";
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
        return new OtherError(code, error, fatal);
    }
    return error;
}
/**
 * Returns function allowing to download the wanted data through a
 * resolver -> loader pipeline.
 *
 * (The data can be for example: the manifest, audio and video segments, text,
 * images...)
 *
 * The function returned takes the initial data in arguments and returns an
 * Observable which will emit:
 *
 *   - each time a request begins (type "request").
 *     This is not emitted if the value is retrieved from a local js cache.
 *     This one emit the payload as a value.
 *
 *   - as the request progresses (type "progress").
 *
 *   - each time a request ends (type "metrics").
 *     This one contains informations about the metrics of the request.
 *
 *   - each time a minor request error is encountered (type "error").
 *     With the error as a value.
 *
 *   - Lastly, with the fetched data (type "response").
 *
 *
 * Each of these but "error" can be emitted at most one time.
 *
 * This observable will throw if, following the options given, the request and
 * possible retry all failed.
 *
 * This observable will complete after emitting the data.
 *
 * Type parameters:
 *   T: Argument given to the loader
 *   U: ResponseType of the request
 *
 * @param {Object} transportPipeline
 * @param {Object} options
 * @returns {Function}
 */
export default function createLoader(transportPipeline, options) {
    var cache = options.cache, maxRetry = options.maxRetry, maxRetryOffline = options.maxRetryOffline;
    var loader = transportPipeline.loader;
    // TODO Remove the resolver completely
    var resolver = transportPipeline.resolver != null ?
        transportPipeline.resolver : observableOf.bind(Observable);
    // Subject that will emit non-fatal errors.
    var retryErrorSubject = new Subject();
    // Backoff options given to the backoff retry done with the loader function.
    var backoffOptions = {
        baseDelay: INITIAL_BACKOFF_DELAY_BASE,
        maxDelay: MAX_BACKOFF_DELAY_BASE,
        maxRetryRegular: maxRetry,
        maxRetryOffline: maxRetryOffline,
        onRetry: function (error) {
            retryErrorSubject
                .next(errorSelector("PIPELINE_LOAD_ERROR", error, false));
        },
    };
    /**
     * Call the transport's resolver - if it exists - with the given data.
     *
     * Throws with the right error if it fails.
     * @param {Object} resolverArgument
     * @returns {Observable}
     */
    function callResolver(resolverArgument) {
        return tryCatch(resolver, resolverArgument)
            .pipe()
            .pipe(catchError(function (error) {
            throw errorSelector("PIPELINE_RESOLVE_ERROR", error, true);
        }));
    }
    /**
     * Load wanted data:
     *   - get it from cache if present
     *   - call the transport loader - with an exponential backoff - if not
     *
     * @param {Object} loaderArgument - Input given to the loader
     * @returns {Observable}
     */
    function loadData(loaderArgument) {
        /**
         * Call the Pipeline's loader with an exponential Backoff.
         * @returns {Observable}
         */
        function startLoaderWithBackoff() {
            var request$ = downloadingBackoff(tryCatch(loader, loaderArgument), backoffOptions).pipe(catchError(function (error) {
                throw errorSelector("PIPELINE_LOAD_ERROR", error, true);
            }), tap(function (arg) {
                if (arg.type === "response" && cache) {
                    cache.add(loaderArgument, arg.value);
                }
            }));
            return observableConcat(observableOf({ type: "request", value: loaderArgument }), request$);
        }
        var dataFromCache = cache ? cache.get(loaderArgument) : null;
        if (dataFromCache != null) {
            return castToObservable(dataFromCache).pipe(map(function (response) {
                return {
                    type: "cache",
                    value: response,
                };
            }), catchError(startLoaderWithBackoff));
        }
        return startLoaderWithBackoff();
    }
    /**
     * Load the corresponding data.
     * @param {Object} pipelineInputData
     * @returns {Observable}
     */
    return function startPipeline(pipelineInputData) {
        var pipeline$ = callResolver(pipelineInputData).pipe(mergeMap(function (resolverResponse) {
            return loadData(resolverResponse).pipe(mergeMap(function (arg) {
                // "cache": data taken from cache by the pipeline
                // "data": the data is available but no request has been done
                // "response": data received through a request
                switch (arg.type) {
                    case "cache":
                    case "data":
                    case "response":
                        var response$ = observableOf({
                            type: "response",
                            value: objectAssign({}, resolverResponse, {
                                url: arg.type === "response" ? arg.value.url : undefined,
                                responseData: arg.value.responseData,
                                sendingTime: arg.type === "response" ?
                                    arg.value.sendingTime : undefined,
                                receivedTime: arg.type === "response" ?
                                    arg.value.receivedTime : undefined,
                            }),
                        });
                        var metrics$ = arg.type !== "response" ?
                            EMPTY : observableOf({
                            type: "metrics",
                            value: {
                                size: arg.value.size,
                                duration: arg.value.duration,
                            },
                        });
                        return observableConcat(response$, metrics$);
                    default:
                        return observableOf(arg);
                }
            }));
        }), finalize(function () { retryErrorSubject.complete(); }));
        var retryError$ = retryErrorSubject
            .pipe(map(function (error) { return ({ type: "error", value: error }); }));
        return observableMerge(pipeline$, retryError$);
    };
}
