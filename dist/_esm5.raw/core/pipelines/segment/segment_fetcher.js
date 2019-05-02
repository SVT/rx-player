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
import { Subject, } from "rxjs";
import { catchError, filter, finalize, map, share, tap, } from "rxjs/operators";
import { isKnownError, OtherError, } from "../../../errors";
import idGenerator from "../../../utils/id_generator";
import createLoader from "../utils/create_loader";
var generateRequestID = idGenerator();
/**
 * Create a function which will fetch segments.
 *
 * This function will:
 *   - only emit the resulting data
 *   - dispatch the other infos through the right subjects.
 *
 * @param {string} bufferType
 * @param {Object} transport
 * @param {Subject} network$ - Subject through which network metrics will be
 * sent, for the ABR.
 * @param {Subject} requests$ - Subject through which requests infos will be
 * sent, for the ABR.
 * @param {Subject} warning$ - Subject through which minor requests error will
 * be sent.
 * @param {Object} options
 * @returns {Function}
 */
export default function createSegmentFetcher(bufferType, transport, network$, requests$, warning$, options) {
    var segmentLoader = createLoader(transport[bufferType], options);
    var segmentParser = transport[bufferType].parser; // deal with it
    var request$;
    var id;
    /**
     * Process a pipeline observable to adapt it to the the rest of the code:
     *   - use the network$ subject for network metrics (bandwitdh mesure)
     *   - use the requests subject for network requests and their progress
     *   - use the warning$ subject for retries' error messages
     *   - only emit the data
     * @param {string} pipelineType
     * @param {Observable} pipeline$
     * @returns {Observable}
     */
    return function fetchSegment(content) {
        return segmentLoader(content).pipe(tap(function (arg) {
            switch (arg.type) {
                case "error":
                    warning$.next(objectAssign(arg.value, { pipelineType: bufferType }));
                    break;
                case "metrics": {
                    var value = arg.value;
                    var size = value.size, duration = value.duration; // unwrapping for TS
                    // format it for ABR Handling
                    if (size != null && duration != null) {
                        network$.next({
                            type: bufferType,
                            value: {
                                size: size,
                                duration: duration,
                            },
                        });
                    }
                    break;
                }
                case "request": {
                    var value = arg.value;
                    // format it for ABR Handling
                    var segment = value && value.segment;
                    if (segment != null && segment.duration != null) {
                        request$ = new Subject();
                        requests$.next(request$);
                        var duration = segment.duration / segment.timescale;
                        var time = segment.time / segment.timescale;
                        id = generateRequestID();
                        request$.next({
                            type: bufferType,
                            event: "requestBegin",
                            value: {
                                duration: duration,
                                time: time,
                                requestTimestamp: performance.now(),
                                id: id,
                            },
                        });
                    }
                    break;
                }
                case "progress": {
                    var value = arg.value;
                    if (value.totalSize != null &&
                        value.size < value.totalSize &&
                        id != null &&
                        request$ != null) {
                        request$.next({
                            type: bufferType,
                            event: "progress",
                            value: {
                                duration: value.duration,
                                size: value.size,
                                totalSize: value.totalSize,
                                timestamp: performance.now(),
                                id: id,
                            },
                        });
                    }
                    break;
                }
            }
        }), filter(function (arg) {
            return arg.type === "response";
        }), finalize(function () {
            if (request$ != null) {
                if (id != null) {
                    request$.next({
                        type: bufferType,
                        event: "requestEnd",
                        value: { id: id },
                    });
                }
                request$.complete();
            }
        }), map(function (response) {
            return {
                /**
                 * Parse the loaded data.
                 * @param {Object} [init]
                 * @returns {Observable}
                 */
                parse: function (init) {
                    var parserArg = objectAssign({ response: response.value, init: init }, content);
                    return segmentParser(parserArg)
                        .pipe(catchError(function (error) {
                        var formattedError = isKnownError(error) ?
                            error : new OtherError("PIPELINE_PARSING_ERROR", error.toString(), true);
                        throw formattedError;
                    }));
                },
            };
        }), share() // avoid multiple side effects if multiple subs
        );
    };
}
