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
import { combineLatest as observableCombineLatest, of as observableOf, } from "rxjs";
import { filter, map, mergeMap, } from "rxjs/operators";
import features from "../../features";
import Manifest from "../../manifest";
import { getMDHDTimescale, getSegmentsFromSidx, } from "../../parsers/containers/isobmff";
import { getSegmentsFromCues, getTimeCodeScale, } from "../../parsers/containers/matroska";
import dashManifestParser from "../../parsers/manifest/dash";
import request from "../../utils/request";
import generateManifestLoader from "../utils/manifest_loader";
import getISOBMFFTimingInfos from "./isobmff_timing_infos";
import { loader as TextTrackLoader, parser as TextTrackParser, } from "./pipelines_text";
import generateSegmentLoader from "./segment_loader";
/**
 * Request external "xlink" ressource from a MPD.
 * @param {string} xlinkURL
 * @returns {Observable}
 */
function requestXLink(xlinkURL) {
    return request({
        url: xlinkURL,
        responseType: "text",
        ignoreProgressEvents: true,
    }).pipe(filter(function (e) { return e.type === "response"; }), map(function (e) { return e.value.responseData; }));
}
function requestHttpIso(url) {
    return request({
        url: url,
        responseType: "text",
        ignoreProgressEvents: true,
    }).pipe(filter(function (e) { return e.type === "response"; }), map(function (e) { return e.value.responseData; }));
}
/**
 * Returns pipelines used for DASH streaming.
 * @param {Object} options
 * implementation. Used for each generated http request.
 * @returns {Object}
 */
export default function (options) {
    if (options === void 0) { options = {}; }
    var manifestLoader = generateManifestLoader({
        customManifestLoader: options.manifestLoader,
    });
    var segmentLoader = generateSegmentLoader(options.segmentLoader);
    var manifestPipeline = {
        loader: function (_a) {
            var url = _a.url;
            return manifestLoader(url);
        },
        parser: function (_a) {
            var response = _a.response, loaderURL = _a.url, scheduleRequest = _a.scheduleRequest;
            var url = response.url == null ? loaderURL : response.url;
            var data = typeof response.responseData === "string" ?
                new DOMParser().parseFromString(response.responseData, "text/xml") :
                response.responseData;
            var parsedManifest = dashManifestParser(data, url);
            return loadExternalResources(parsedManifest);
            function loadExternalResources(parserResponse) {
                if (parserResponse.type === "done") {
                    var manifest = new Manifest(parserResponse.value, options);
                    return observableOf({ manifest: manifest, url: url });
                }
                var _a = parserResponse.value, ressources = _a.ressources, continueParsing = _a.continue;
                var externalResources$ = ressources
                    .map(function (resource) { return scheduleRequest(function () { return resource.type === 'xlink' ? requestXLink(resource.url) : requestHttpIso(resource.url); }); });
                return observableCombineLatest(externalResources$)
                    .pipe(mergeMap(function (loadedResources) {
                    return loadExternalResources(continueParsing(loadedResources));
                }));
            }
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
            var segment = _a.segment, representation = _a.representation, response = _a.response, init = _a.init;
            var responseData = response.responseData;
            if (responseData == null) {
                return observableOf({
                    segmentData: null,
                    segmentInfos: null,
                    segmentOffset: 0,
                });
            }
            var segmentData = responseData instanceof Uint8Array ?
                responseData :
                new Uint8Array(responseData);
            var indexRange = segment.indexRange;
            var isWEBM = representation.mimeType === "video/webm" ||
                representation.mimeType === "audio/webm";
            var nextSegments = isWEBM ?
                getSegmentsFromCues(segmentData, 0) :
                getSegmentsFromSidx(segmentData, indexRange ? indexRange[0] : 0);
            if (!segment.isInit) {
                var segmentInfos = isWEBM ?
                    {
                        time: segment.time,
                        duration: segment.duration,
                        timescale: segment.timescale,
                    } :
                    getISOBMFFTimingInfos(segment, segmentData, nextSegments, init);
                var segmentOffset = segment.timestampOffset || 0;
                return observableOf({ segmentData: segmentData, segmentInfos: segmentInfos, segmentOffset: segmentOffset });
            }
            if (nextSegments) {
                representation.index._addSegments(nextSegments);
            }
            var timescale = isWEBM ?
                getTimeCodeScale(segmentData, 0) :
                getMDHDTimescale(segmentData);
            return observableOf({
                segmentData: segmentData,
                segmentInfos: timescale && timescale > 0 ?
                    { time: -1, duration: 0, timescale: timescale } : null,
                segmentOffset: segment.timestampOffset || 0,
            });
        },
    };
    var textTrackPipeline = {
        loader: TextTrackLoader,
        parser: TextTrackParser,
    };
    var imageTrackPipeline = {
        loader: function (_a) {
            var segment = _a.segment;
            if (segment.isInit || segment.mediaURL == null) {
                return observableOf({
                    type: "data",
                    value: { responseData: null },
                });
            }
            var mediaURL = segment.mediaURL;
            return request({ url: mediaURL, responseType: "arraybuffer" });
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
                    segmentOffset: segment.timestampOffset || 0,
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
                segmentOffset: segment.timestampOffset || 0,
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
