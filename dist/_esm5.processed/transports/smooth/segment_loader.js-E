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
import assert from "../../utils/assert";
import request from "../../utils/request";
import byteRange from "../utils/byte_range";
import { createAudioInitSegment, createVideoInitSegment, } from "./isobmff";
/**
 * Segment loader triggered if there was no custom-defined one in the API.
 * @param {Object} opt
 * @returns {Observable}
 */
function regularSegmentLoader(_a) {
    var url = _a.url, segment = _a.segment;
    var headers;
    var range = segment.range;
    if (range) {
        headers = {
            Range: byteRange(range),
        };
    }
    return request({
        url: url,
        responseType: "arraybuffer",
        headers: headers,
    });
}
/**
 * Defines the url for the request, load the right loader (custom/default
 * one).
 */
var generateSegmentLoader = function (customSegmentLoader) { return function (_a) {
    var segment = _a.segment, representation = _a.representation, adaptation = _a.adaptation, period = _a.period, manifest = _a.manifest;
    if (segment.isInit) {
        if (!segment.privateInfos || segment.privateInfos.smoothInit == null) {
            throw new Error("Smooth: Invalid segment format");
        }
        var smoothInitPrivateInfos = segment.privateInfos.smoothInit;
        var responseData = void 0;
        var protection = smoothInitPrivateInfos.protection;
        switch (adaptation.type) {
            case "video":
                responseData = createVideoInitSegment(segment.timescale, representation.width || 0, representation.height || 0, 72, 72, 4, // vRes, hRes, nal
                smoothInitPrivateInfos.codecPrivateData || "", protection && protection.keyId, // keyId
                protection && protection.keySystems // pssList
                );
                break;
            case "audio":
                responseData = createAudioInitSegment(segment.timescale, smoothInitPrivateInfos.channels || 0, smoothInitPrivateInfos.bitsPerSample || 0, smoothInitPrivateInfos.packetSize || 0, smoothInitPrivateInfos.samplingRate || 0, smoothInitPrivateInfos.codecPrivateData || "", protection && protection.keyId, // keyId
                protection && protection.keySystems // pssList
                );
                break;
            default:
                if (__DEV__) {
                    assert(false, "responseData should have been set");
                }
                responseData = new Uint8Array(0);
        }
        return observableOf({
            type: "data",
            value: { responseData: responseData },
        });
    }
    else if (segment.mediaURL == null) {
        return observableOf({
            type: "data",
            value: { responseData: null },
        });
    }
    else {
        var url = segment.mediaURL;
        var args_1 = {
            adaptation: adaptation,
            manifest: manifest,
            period: period,
            representation: representation,
            segment: segment,
            transport: "smooth",
            url: url,
        };
        if (!customSegmentLoader) {
            return regularSegmentLoader(args_1);
        }
        return new Observable(function (obs) {
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
            var fallback = function () {
                hasFallbacked = true;
                regularSegmentLoader(args_1).subscribe(obs);
            };
            var callbacks = { reject: reject, resolve: resolve, fallback: fallback };
            var abort = customSegmentLoader(args_1, callbacks);
            return function () {
                if (!hasFinished && !hasFallbacked && typeof abort === "function") {
                    abort();
                }
            };
        });
    }
}; };
export default generateSegmentLoader;
