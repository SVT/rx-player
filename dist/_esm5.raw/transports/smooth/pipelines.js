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
import { of as observableOf, } from "rxjs";
import { map } from "rxjs/operators";
import features from "../../features";
import log from "../../log";
import Manifest from "../../manifest";
import { getMDAT } from "../../parsers/containers/isobmff";
import createSmoothManifestParser from "../../parsers/manifest/smooth";
import assert from "../../utils/assert";
import request from "../../utils/request";
import stringFromUTF8 from "../../utils/string_from_utf8";
import warnOnce from "../../utils/warn_once";
import generateManifestLoader from "../utils/manifest_loader";
import extractTimingsInfos from "./extract_timings_infos";
import mp4Utils from "./mp4_utils";
import generateSegmentLoader from "./segment_loader";
import { extractISML, extractToken, replaceToken, resolveManifest, } from "./utils";
var patchSegment = mp4Utils.patchSegment;
var WSX_REG = /\.wsx?(\?token=\S+)?/;
/**
 * @param {Object} adaptation
 * @param {Object} dlSegment
 * @param {Object} nextSegments
 */
function addNextSegments(adaptation, nextSegments, dlSegment) {
    log.debug("Smooth Parser: update segments informations.");
    var representations = adaptation.representations;
    for (var i = 0; i < representations.length; i++) {
        var representation = representations[i];
        representation.index._addSegments(nextSegments, dlSegment);
    }
}
export default function (options) {
    if (options === void 0) { options = {}; }
    var smoothManifestParser = createSmoothManifestParser(options);
    var segmentLoader = generateSegmentLoader(options.segmentLoader);
    var manifestLoaderOptions = {
        customManifestLoader: options.manifestLoader,
        ignoreProgressEvents: true,
    };
    var manifestLoader = generateManifestLoader(manifestLoaderOptions);
    var manifestPipeline = {
        resolver: function (_a) {
            var url = _a.url;
            var resolving;
            var token = extractToken(url);
            // TODO Remove WSX logic
            if (WSX_REG.test(url)) {
                warnOnce("Giving WSX URL to loadVideo is deprecated." +
                    " You should only give Manifest URLs.");
                resolving = request({
                    url: replaceToken(url, ""),
                    responseType: "document",
                    ignoreProgressEvents: true,
                }).pipe(map(function (_a) {
                    var value = _a.value;
                    var extractedURL = extractISML(value.responseData);
                    if (!extractedURL) {
                        throw new Error("Invalid ISML");
                    }
                    return extractedURL;
                }));
            }
            else {
                resolving = observableOf(url);
            }
            return resolving
                .pipe(map(function (_url) { return ({
                url: replaceToken(resolveManifest(_url), token),
            }); }));
        },
        loader: function (_a) {
            var url = _a.url;
            return manifestLoader(url);
        },
        parser: function (_a) {
            var response = _a.response, reqURL = _a.url;
            var url = response.url == null ? reqURL : response.url;
            var data = typeof response.responseData === "string" ?
                new DOMParser().parseFromString(response.responseData, "text/xml") :
                response.responseData;
            var manifestReceivedTime = response.receivedTime;
            var parserResult = smoothManifestParser(data, url, manifestReceivedTime);
            var manifest = new Manifest(parserResult, {
                representationFilter: options.representationFilter,
                supplementaryImageTracks: options.supplementaryImageTracks,
                supplementaryTextTracks: options.supplementaryTextTracks,
            });
            return observableOf({ manifest: manifest, url: url });
        },
    };
    var segmentPipeline = {
        loader: function (_a) {
            var adaptation = _a.adaptation, manifest = _a.manifest, period = _a.period, representation = _a.representation, segment = _a.segment;
            return segmentLoader({
                adaptation: adaptation,
                manifest: manifest,
                period: period,
                representation: representation,
                segment: segment,
            });
        },
        parser: function (_a) {
            var segment = _a.segment, response = _a.response, adaptation = _a.adaptation, manifest = _a.manifest;
            var responseData = response.responseData;
            if (responseData == null) {
                return observableOf({ segmentData: null, segmentInfos: null, segmentOffset: 0 });
            }
            if (segment.isInit) {
                // smooth init segments are crafted by hand. Their timescale is the one
                // from the manifest.
                var initSegmentInfos = {
                    timescale: segment.timescale,
                    time: -1,
                    duration: 0,
                };
                return observableOf({
                    segmentData: responseData,
                    segmentInfos: initSegmentInfos,
                    segmentOffset: 0,
                });
            }
            var responseBuffer = responseData instanceof Uint8Array ?
                responseData : new Uint8Array(responseData);
            var _b = extractTimingsInfos(responseBuffer, segment, manifest.isLive), nextSegments = _b.nextSegments, segmentInfos = _b.segmentInfos;
            var segmentData = patchSegment(responseBuffer, segmentInfos.time);
            if (nextSegments) {
                addNextSegments(adaptation, nextSegments, segmentInfos);
            }
            return observableOf({ segmentData: segmentData, segmentInfos: segmentInfos, segmentOffset: 0 });
        },
    };
    var textTrackPipeline = {
        loader: function (_a) {
            var segment = _a.segment, representation = _a.representation;
            if (segment.isInit || segment.mediaURL == null) {
                return observableOf({
                    type: "data",
                    value: { responseData: null },
                });
            }
            var responseType = isMP4EmbeddedTrack(representation) ? "arraybuffer" : "text";
            return request({ url: segment.mediaURL, responseType: responseType });
        },
        parser: function (_a) {
            var response = _a.response, segment = _a.segment, representation = _a.representation, adaptation = _a.adaptation, manifest = _a.manifest;
            var language = adaptation.language;
            var _b = representation.mimeType, mimeType = _b === void 0 ? "" : _b, _c = representation.codec, codec = _c === void 0 ? "" : _c;
            if (__DEV__) {
                if (segment.isInit) {
                    assert(response.responseData === null);
                }
                else {
                    assert(typeof response.responseData === "string" ||
                        response.responseData instanceof ArrayBuffer);
                }
            }
            var responseData = response.responseData;
            if (responseData === null) {
                return observableOf({
                    segmentData: null,
                    segmentInfos: segment.timescale > 0 ? {
                        duration: segment.isInit ? 0 : segment.duration,
                        time: segment.isInit ? -1 : segment.time,
                        timescale: segment.timescale,
                    } : null,
                    segmentOffset: 0,
                });
            }
            var parsedResponse;
            var nextSegments;
            var segmentInfos = null;
            var isMP4 = mimeType.indexOf("mp4") >= 0;
            // segmentData components
            var _sdStart;
            var _sdEnd;
            var _sdTimescale;
            var _sdData;
            var _sdType;
            if (isMP4) {
                if (__DEV__) {
                    assert(responseData instanceof ArrayBuffer);
                }
                parsedResponse = new Uint8Array(responseData);
                var timings = extractTimingsInfos(parsedResponse, segment, manifest.isLive);
                nextSegments = timings.nextSegments;
                segmentInfos = timings.segmentInfos;
                _sdStart = segmentInfos.time;
                _sdEnd = segmentInfos.duration != null ?
                    segmentInfos.time + segmentInfos.duration : undefined;
                if (__DEV__) {
                    assert(typeof segmentInfos.timescale === "number");
                }
                _sdTimescale = segmentInfos.timescale;
            }
            else {
                if (__DEV__) {
                    assert(typeof responseData === "string");
                }
                parsedResponse = responseData;
                var segmentTime = segment.time || 0;
                // vod is simple WebVTT or TTML text
                _sdStart = segmentTime;
                _sdEnd = segment.duration != null ?
                    segmentTime + segment.duration : undefined;
                _sdTimescale = segment.timescale;
            }
            if (isMP4) {
                var lcCodec = codec.toLowerCase();
                if (mimeType === "application/ttml+xml+mp4" ||
                    lcCodec === "stpp" ||
                    lcCodec === "stpp.ttml.im1t") {
                    _sdType = "ttml";
                }
                else if (lcCodec === "wvtt") {
                    _sdType = "vtt";
                }
                else {
                    throw new Error("could not find a text-track parser for the type " + mimeType);
                }
                var mdat = getMDAT(parsedResponse);
                _sdData = stringFromUTF8(mdat);
            }
            else {
                switch (mimeType) {
                    case "application/x-sami":
                    case "application/smil": // TODO SMIL should be its own format, no?
                        _sdType = "sami";
                        break;
                    case "application/ttml+xml":
                        _sdType = "ttml";
                        break;
                    case "text/vtt":
                        _sdType = "vtt";
                        break;
                }
                if (!_sdType) {
                    var lcCodec = codec.toLowerCase();
                    if (lcCodec === "srt") {
                        _sdType = "srt";
                    }
                    else {
                        throw new Error("could not find a text-track parser for the type " + mimeType);
                    }
                }
                _sdData = responseData;
            }
            if (segmentInfos != null && nextSegments) {
                addNextSegments(adaptation, nextSegments, segmentInfos);
            }
            return observableOf({
                segmentData: {
                    type: _sdType,
                    data: _sdData,
                    language: language,
                    timescale: _sdTimescale,
                    start: _sdStart,
                    end: _sdEnd,
                },
                segmentInfos: segmentInfos,
                segmentOffset: _sdStart / _sdTimescale,
            });
        },
    };
    var imageTrackPipeline = {
        loader: function (_a) {
            var segment = _a.segment;
            if (segment.isInit || segment.mediaURL == null) {
                // image do not need an init segment. Passthrough directly to the parser
                return observableOf({
                    type: "data",
                    value: { responseData: null },
                });
            }
            return request({ url: segment.mediaURL, responseType: "arraybuffer" });
        },
        parser: function (_a) {
            var response = _a.response, segment = _a.segment;
            var responseData = response.responseData;
            // TODO image Parsing should be more on the sourceBuffer side, no?
            if (responseData === null || features.imageParser == null) {
                return observableOf({
                    segmentData: null,
                    segmentInfos: segment.timescale > 0 ? {
                        duration: segment.isInit ? 0 : segment.duration,
                        time: segment.isInit ? -1 : segment.time,
                        timescale: segment.timescale,
                    } : null,
                    segmentOffset: 0,
                });
            }
            var bifObject = features.imageParser(new Uint8Array(responseData));
            var data = bifObject.thumbs;
            return observableOf({
                segmentData: {
                    data: data,
                    start: 0,
                    end: Number.MAX_VALUE,
                    timescale: 1,
                    type: "bif",
                },
                segmentInfos: {
                    time: 0,
                    duration: Number.MAX_VALUE,
                    timescale: bifObject.timescale,
                },
                segmentOffset: 0,
            });
        },
    };
    return {
        manifest: manifestPipeline,
        audio: segmentPipeline,
        video: segmentPipeline,
        text: textTrackPipeline,
        image: imageTrackPipeline,
    };
}
/**
 * Returns true if the given texttrack segment represents a textrack embedded
 * in a mp4 file.
 * @param {Representation} representation
 * @returns {Boolean}
 */
function isMP4EmbeddedTrack(representation) {
    return !!representation.mimeType && representation.mimeType.indexOf("mp4") >= 0;
}
