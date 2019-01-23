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
import config from "../../../config";
import assert from "../../../utils/assert";
import idGenerator from "../../../utils/id_generator";
import resolveURL, { normalizeBaseURL, } from "../../../utils/resolve_url";
import checkManifestIDs from "../utils/check_manifest_ids";
import { getAudioCodecs, getVideoCodecs, } from "./get_codecs";
import parseCNodes from "./parse_C_nodes";
import parseProtectionNode from "./parse_protection_node";
import RepresentationIndex from "./representation_index";
import parseBoolean from "./utils/parseBoolean";
import reduceChildren from "./utils/reduceChildren";
import { replaceRepresentationSmoothTokens } from "./utils/tokens";
var generateManifestID = idGenerator();
var DEFAULT_MIME_TYPES = {
    audio: "audio/mp4",
    video: "video/mp4",
    text: "application/ttml+xml",
};
var DEFAULT_CODECS = {
    audio: "mp4a.40.2",
    video: "avc1.4D401E",
};
var MIME_TYPES = {
    AACL: "audio/mp4",
    AVC1: "video/mp4",
    H264: "video/mp4",
    TTML: "application/ttml+xml+mp4",
};
/**
 * @param {Object|undefined} parserOptions
 * @returns {Function}
 */
function createSmoothStreamingParser(parserOptions) {
    if (parserOptions === void 0) { parserOptions = {}; }
    var SUGGESTED_PERSENTATION_DELAY = parserOptions.suggestedPresentationDelay == null ?
        config.DEFAULT_SUGGESTED_PRESENTATION_DELAY.SMOOTH :
        parserOptions.suggestedPresentationDelay;
    var REFERENCE_DATE_TIME = parserOptions.referenceDateTime ||
        Date.UTC(1970, 0, 1, 0, 0, 0, 0) / 1000;
    var MIN_REPRESENTATION_BITRATE = parserOptions.minRepresentationBitrate ||
        0;
    /**
     * @param {Element} q
     * @param {string} streamType
     * @return {Object}
     */
    function parseQualityLevel(q, streamType) {
        /**
         * @param {string} name
         * @returns {string|undefined}
         */
        function getAttribute(name) {
            var attr = q.getAttribute(name);
            return attr == null ? undefined : attr;
        }
        switch (streamType) {
            case "audio": {
                var audiotag = getAttribute("AudioTag");
                var bitrate = getAttribute("Bitrate");
                var bitsPerSample = getAttribute("BitsPerSample");
                var channels = getAttribute("Channels");
                var codecPrivateData = getAttribute("CodecPrivateData");
                var fourCC = getAttribute("FourCC");
                var packetSize = getAttribute("PacketSize");
                var samplingRate = getAttribute("SamplingRate");
                return {
                    audiotag: audiotag !== undefined ? parseInt(audiotag, 10) : audiotag,
                    bitrate: bitrate ? parseInt(bitrate, 10) || 0 : 0,
                    bitsPerSample: bitsPerSample !== undefined ?
                        parseInt(bitsPerSample, 10) : bitsPerSample,
                    channels: channels !== undefined ? parseInt(channels, 10) : channels,
                    codecPrivateData: codecPrivateData || "",
                    mimeType: fourCC !== undefined ? MIME_TYPES[fourCC] : fourCC,
                    packetSize: packetSize !== undefined ?
                        parseInt(packetSize, 10) : packetSize,
                    samplingRate: samplingRate !== undefined ?
                        parseInt(samplingRate, 10) : samplingRate,
                };
            }
            case "video": {
                var bitrate = getAttribute("Bitrate");
                var codecPrivateData = getAttribute("CodecPrivateData");
                var fourCC = getAttribute("FourCC");
                var width = getAttribute("MaxWidth");
                var height = getAttribute("MaxHeight");
                return {
                    bitrate: bitrate ? parseInt(bitrate, 10) || 0 : 0,
                    mimeType: fourCC !== undefined ? MIME_TYPES[fourCC] : fourCC,
                    codecPrivateData: codecPrivateData || "",
                    codecs: getVideoCodecs(codecPrivateData || ""),
                    width: width !== undefined ? parseInt(width, 10) : undefined,
                    height: height !== undefined ? parseInt(height, 10) : undefined,
                };
            }
            case "text": {
                var bitrate = getAttribute("Bitrate");
                var codecPrivateData = getAttribute("CodecPrivateData");
                var fourCC = getAttribute("FourCC");
                return {
                    bitrate: bitrate ? parseInt(bitrate, 10) || 0 : 0,
                    mimeType: fourCC !== undefined ? MIME_TYPES[fourCC] : fourCC,
                    codecPrivateData: codecPrivateData || "",
                };
            }
            default:
                throw new Error("Unrecognized StreamIndex type: " + streamType);
        }
    }
    /**
     * Parse the adaptations (<StreamIndex>) tree containing
     * representations (<QualityLevels>) and timestamp indexes (<c>).
     * Indexes can be quite huge, and this function needs to
     * to be optimized.
     * @param {Object} args
     * @returns {Object}
     */
    function parseAdaptation(args) {
        var root = args.root, timescale = args.timescale, rootURL = args.rootURL, protections = args.protections, timeShiftBufferDepth = args.timeShiftBufferDepth, manifestReceivedTime = args.manifestReceivedTime, isLive = args.isLive;
        var _timescale = root.hasAttribute("Timescale") ?
            +(root.getAttribute("Timescale") || 0) : timescale;
        var adaptationType = root.getAttribute("Type");
        if (adaptationType == null) {
            throw new Error("StreamIndex without type.");
        }
        var subType = root.getAttribute("Subtype");
        var language = root.getAttribute("Language");
        var baseURL = root.getAttribute("Url") || "";
        if (false) {
            assert(baseURL !== "");
        }
        var _a = reduceChildren(root, function (res, _name, node) {
            switch (_name) {
                case "QualityLevel":
                    var qualityLevel = parseQualityLevel(node, adaptationType);
                    if (adaptationType === "audio") {
                        var fourCC = node.getAttribute("FourCC") || "";
                        qualityLevel.codecs = getAudioCodecs(fourCC, qualityLevel.codecPrivateData);
                    }
                    // filter out video qualityLevels with small bitrates
                    if (adaptationType !== "video" ||
                        qualityLevel.bitrate > MIN_REPRESENTATION_BITRATE) {
                        res.qualityLevels.push(qualityLevel);
                    }
                    break;
                case "c":
                    res.cNodes.push(node);
                    break;
            }
            return res;
        }, {
            qualityLevels: [],
            cNodes: [],
        }), qualityLevels = _a.qualityLevels, cNodes = _a.cNodes;
        var index = {
            timeline: parseCNodes(cNodes),
            timescale: _timescale,
        };
        // we assume that all qualityLevels have the same
        // codec and mimeType
        assert(qualityLevels.length !== 0, "adaptation should have at least one representation");
        var adaptationID = adaptationType + (language ? ("_" + language) : "");
        var representations = qualityLevels.map(function (qualityLevel) {
            var path = resolveURL(rootURL, baseURL);
            var repIndex = {
                timeline: index.timeline,
                timescale: index.timescale,
                media: replaceRepresentationSmoothTokens(path, qualityLevel.bitrate),
                isLive: isLive,
                timeShiftBufferDepth: timeShiftBufferDepth,
                manifestReceivedTime: manifestReceivedTime,
            };
            var mimeType = qualityLevel.mimeType || DEFAULT_MIME_TYPES[adaptationType];
            var codecs = qualityLevel.codecs || DEFAULT_CODECS[adaptationType];
            var id = adaptationID + "_" + adaptationType + "-" + mimeType + "-" +
                codecs + "-" + qualityLevel.bitrate;
            var contentProtections = [];
            var firstProtection;
            if (protections.length) {
                firstProtection = protections[0];
                protections.forEach(function (protection) {
                    var keyId = protection.keyId;
                    protection.keySystems.forEach(function (keySystem) {
                        contentProtections.push({
                            keyId: keyId,
                            systemId: keySystem.systemId,
                        });
                    });
                });
            }
            var initSegmentInfos = {
                bitsPerSample: qualityLevel.bitsPerSample,
                channels: qualityLevel.channels,
                codecPrivateData: qualityLevel.codecPrivateData || "",
                packetSize: qualityLevel.packetSize,
                samplingRate: qualityLevel.samplingRate,
                // TODO set multiple protections here instead of the first one
                protection: firstProtection != null ? {
                    keyId: firstProtection.keyId,
                    keySystems: firstProtection.keySystems,
                } : undefined,
            };
            var representation = objectAssign({}, qualityLevel, {
                index: new RepresentationIndex(repIndex, initSegmentInfos),
                mimeType: mimeType,
                codecs: codecs,
                id: id,
            });
            if (contentProtections.length) {
                representation.contentProtections = contentProtections;
            }
            return representation;
        });
        // TODO(pierre): real ad-insert support
        if (subType === "ADVT") {
            return null;
        }
        var parsedAdaptation = {
            id: adaptationID,
            type: adaptationType,
            representations: representations,
            language: language == null ? undefined : language,
        };
        if (adaptationType === "text" && subType === "DESC") {
            parsedAdaptation.closedCaption = true;
        }
        return parsedAdaptation;
    }
    function parseFromDocument(doc, url, manifestReceivedTime) {
        var rootURL = normalizeBaseURL(url);
        var root = doc.documentElement;
        if (!root || root.nodeName !== "SmoothStreamingMedia") {
            throw new Error("document root should be SmoothStreamingMedia");
        }
        if (!/^[2]-[0-2]$/.test(root.getAttribute("MajorVersion") + "-" + root.getAttribute("MinorVersion"))) {
            throw new Error("Version should be 2.0, 2.1 or 2.2");
        }
        var timescale = +(root.getAttribute("Timescale") || 10000000);
        var _a = reduceChildren(root, function (res, name, node) {
            switch (name) {
                case "Protection": {
                    res.protections.push(parseProtectionNode(node, parserOptions.keySystems));
                    break;
                }
                case "StreamIndex":
                    res.adaptationNodes.push(node);
                    break;
            }
            return res;
        }, {
            adaptationNodes: [],
            protections: [],
        }), protections = _a.protections, adaptationNodes = _a.adaptationNodes;
        var initialAdaptations = {};
        var isLive = parseBoolean(root.getAttribute("IsLive"));
        var timeShiftBufferDepth = isLive ?
            +(root.getAttribute("DVRWindowLength") || 0) / timescale :
            undefined;
        var adaptations = adaptationNodes
            .map(function (node) {
            return parseAdaptation({
                root: node,
                rootURL: rootURL,
                timescale: timescale,
                protections: protections,
                isLive: isLive,
                timeShiftBufferDepth: timeShiftBufferDepth,
                manifestReceivedTime: manifestReceivedTime,
            });
        })
            .filter(function (adaptation) { return adaptation != null; })
            .reduce(function (acc, adaptation) {
            var type = adaptation.type;
            if (acc[type] === undefined) {
                acc[type] = [adaptation];
            }
            else {
                (acc[type] || []).push(adaptation);
            }
            return acc;
        }, initialAdaptations);
        var suggestedPresentationDelay;
        var presentationLiveGap;
        var availabilityStartTime;
        var firstVideoAdaptation = adaptations.video ? adaptations.video[0] : undefined;
        var firstAudioAdaptation = adaptations.audio ? adaptations.audio[0] : undefined;
        var firstTimeReference;
        var lastTimeReference;
        if (firstVideoAdaptation || firstAudioAdaptation) {
            var firstTimeReferences = [];
            var lastTimeReferences = [];
            if (firstVideoAdaptation) {
                var firstVideoRepresentation = firstVideoAdaptation.representations[0];
                if (firstVideoRepresentation) {
                    var firstVideoTimeReference = firstVideoRepresentation.index.getFirstPosition();
                    var lastVideoTimeReference = firstVideoRepresentation.index.getLastPosition();
                    if (firstVideoTimeReference != null) {
                        firstTimeReferences.push(firstVideoTimeReference);
                    }
                    if (lastVideoTimeReference != null) {
                        lastTimeReferences.push(lastVideoTimeReference);
                    }
                }
            }
            if (firstAudioAdaptation) {
                var firstAudioRepresentation = firstAudioAdaptation.representations[0];
                if (firstAudioRepresentation) {
                    var firstAudioTimeReference = firstAudioRepresentation.index.getFirstPosition();
                    var lastAudioTimeReference = firstAudioRepresentation.index.getLastPosition();
                    if (firstAudioTimeReference != null) {
                        firstTimeReferences.push(firstAudioTimeReference);
                    }
                    if (lastAudioTimeReference != null) {
                        lastTimeReferences.push(lastAudioTimeReference);
                    }
                }
            }
            if (firstTimeReferences.length) {
                firstTimeReference = Math.max.apply(Math, firstTimeReferences);
            }
            if (lastTimeReferences.length) {
                lastTimeReference = Math.max.apply(Math, lastTimeReferences);
            }
        }
        var duration;
        if (isLive) {
            suggestedPresentationDelay = SUGGESTED_PERSENTATION_DELAY;
            availabilityStartTime = REFERENCE_DATE_TIME;
            presentationLiveGap = Date.now() / 1000 -
                (lastTimeReference != null ?
                    (lastTimeReference + availabilityStartTime) : 10);
            var manifestDuration = root.getAttribute("Duration");
            duration = (manifestDuration != null && +manifestDuration !== 0) ?
                (+manifestDuration / timescale) : undefined;
        }
        else {
            // if non-live and first time reference different than 0. Add first time reference
            // to duration
            var manifestDuration = root.getAttribute("Duration");
            if (manifestDuration != null && +manifestDuration !== 0) {
                duration = lastTimeReference == null ?
                    (+manifestDuration / timescale) + (firstTimeReference || 0) :
                    lastTimeReference;
            }
            else {
                duration = undefined;
            }
        }
        var minimumTime = firstTimeReference != null ?
            firstTimeReference : undefined;
        var manifest = {
            id: "gen-smooth-manifest-" + generateManifestID(),
            availabilityStartTime: availabilityStartTime || 0,
            duration: duration,
            presentationLiveGap: presentationLiveGap,
            suggestedPresentationDelay: suggestedPresentationDelay,
            timeShiftBufferDepth: timeShiftBufferDepth,
            transportType: "smooth",
            isLive: isLive,
            uris: [url],
            minimumTime: minimumTime,
            periods: [{
                    id: "gen-smooth-period-0",
                    duration: duration,
                    adaptations: adaptations,
                    start: 0,
                }],
        };
        checkManifestIDs(manifest);
        return manifest;
    }
    return parseFromDocument;
}
export default createSmoothStreamingParser;
