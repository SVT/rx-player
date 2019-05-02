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
import { of as observableOf } from "rxjs";
import assert from "../../utils/assert";
import stringFromUTF8 from "../../utils/string_from_utf8";
import { getMDAT, getMDHDTimescale, getSegmentsFromSidx, } from "../../parsers/containers/isobmff";
import request from "../../utils/request";
import byteRange from "../utils/byte_range";
import isMP4EmbeddedTrack from "./is_mp4_embedded_track";
import getISOBMFFTimingInfos from "./isobmff_timing_infos";
/**
 * Perform requests for "text" segments
 * @param {Object} infos
 * @returns {Observable.<Object>}
 */
function TextTrackLoader(_a) {
    var segment = _a.segment, representation = _a.representation;
    var mediaURL = segment.mediaURL, range = segment.range, indexRange = segment.indexRange;
    // ArrayBuffer when in mp4 to parse isobmff manually, text otherwise
    var responseType = isMP4EmbeddedTrack(representation) ? "arraybuffer" : "text";
    // init segment without initialization media/range/indexRange:
    // we do nothing on the network
    if (mediaURL == null) {
        return observableOf({
            type: "data",
            value: { responseData: null },
        });
    }
    // fire a single time for init and index ranges
    if (range != null && indexRange != null) {
        return request({
            url: mediaURL,
            responseType: responseType,
            headers: {
                Range: byteRange([
                    Math.min(range[0], indexRange[0]),
                    Math.max(range[1], indexRange[1]),
                ]),
            },
        });
    }
    return request({
        url: mediaURL,
        responseType: responseType,
        headers: range ? {
            Range: byteRange(range),
        } : null,
    });
}
/**
 * Parse TextTrack data.
 * @param {Object} infos
 * @returns {Observable.<Object>}
 */
function TextTrackParser(_a) {
    var response = _a.response, segment = _a.segment, adaptation = _a.adaptation, representation = _a.representation, init = _a.init;
    var language = adaptation.language;
    var isInit = segment.isInit, indexRange = segment.indexRange;
    if (response.responseData == null) {
        return observableOf({
            segmentData: null,
            segmentInfos: segment.timescale > 0 ? {
                duration: segment.isInit ? 0 : segment.duration,
                time: segment.isInit ? -1 : segment.time,
                timescale: segment.timescale,
            } : null,
            segmentOffset: segment.timestampOffset || 0,
        });
    }
    var responseData;
    var nextSegments;
    var segmentInfos;
    var segmentData;
    var isMP4 = isMP4EmbeddedTrack(representation);
    if (isMP4) {
        assert(response.responseData instanceof ArrayBuffer);
        responseData = new Uint8Array(response.responseData);
        var sidxSegments = getSegmentsFromSidx(responseData, indexRange ? indexRange[0] : 0);
        if (sidxSegments) {
            nextSegments = sidxSegments;
        }
        segmentInfos = isInit ?
            { time: -1, duration: 0, timescale: segment.timescale } :
            getISOBMFFTimingInfos(segment, responseData, sidxSegments, init);
    }
    else { // if not MP4
        assert(typeof response.responseData === "string");
        responseData = response.responseData;
        if (isInit) {
            segmentInfos = { time: -1, duration: 0, timescale: segment.timescale };
        }
        else {
            segmentInfos = {
                time: segment.time,
                duration: segment.duration,
                timescale: segment.timescale,
            };
        }
    }
    if (isInit) {
        if (isMP4) {
            var timescale = getMDHDTimescale(responseData);
            if (timescale > 0) {
                segmentInfos = {
                    time: -1,
                    duration: 0,
                    timescale: timescale,
                };
            }
        }
        segmentData = null;
    }
    else { // if not init
        assert(segmentInfos != null);
        var segmentDataBase = {
            start: segmentInfos.time,
            end: segmentInfos.time + (segmentInfos.duration || 0),
            language: language,
            timescale: segmentInfos.timescale,
        };
        if (isMP4) {
            var _b = representation.codec, codec = _b === void 0 ? "" : _b;
            var type = void 0;
            switch (codec.toLowerCase()) {
                case "stpp": // stpp === TTML in MP4
                case "stpp.ttml.im1t":
                    type = "ttml";
                    break;
                case "wvtt": // wvtt === WebVTT in MP4
                    type = "vtt";
            }
            if (!type) {
                throw new Error("The codec used for the subtitles, \"" + codec + "\", is not managed yet.");
            }
            segmentData = objectAssign({
                data: stringFromUTF8(getMDAT(responseData)),
                type: type,
            }, { timescale: 1 }, segmentDataBase);
        }
        else { // not MP4: check for plain text subtitles
            var type = void 0;
            var _c = representation.mimeType, mimeType = _c === void 0 ? "" : _c;
            switch (representation.mimeType) {
                case "application/ttml+xml":
                    type = "ttml";
                    break;
                case "application/x-sami":
                case "application/smil":
                    type = "sami";
                    break;
                case "text/vtt":
                    type = "vtt";
            }
            if (!type) {
                var _d = representation.codec, codec = _d === void 0 ? "" : _d;
                var codeLC = codec.toLowerCase();
                if (codeLC === "srt") {
                    type = "srt";
                }
                else {
                    throw new Error("could not find a text-track parser for the type " + mimeType);
                }
            }
            segmentData = objectAssign({
                data: responseData,
                type: type,
            }, { timescale: 1 }, segmentDataBase);
        }
    }
    if (nextSegments) {
        representation.index._addSegments(nextSegments, segmentInfos);
    }
    return observableOf({
        segmentData: segmentData,
        segmentInfos: segmentInfos,
        segmentOffset: segment.timestampOffset || 0,
    });
}
export { TextTrackLoader as loader, TextTrackParser as parser, };
