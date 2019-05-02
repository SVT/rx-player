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
import arrayFind from "../../../utils/array_find";
import arrayIncludes from "../../../utils/array_includes";
var KNOWN_ADAPTATION_TYPES = ["audio", "video", "text", "image"];
var SUPPORTED_TEXT_TYPES = ["subtitle", "caption"];
/**
 * Infers the type of adaptation from codec and mimetypes found in it.
 *
 * This follows the guidelines defined by the DASH-IF IOP:
 *   - one adaptation set contains a single media type
 *   - The order of verifications are:
 *       1. mimeType
 *       2. Role
 *       3. codec
 *
 * Note: This is based on DASH-IF-IOP-v4.0 with some more freedom.
 * @param {Object} adaptation
 * @returns {string} - "audio"|"video"|"text"|"image"|"metadata"|"unknown"
 */
export default function inferAdaptationType(adaptationMimeType, representationMimeTypes, adaptationCodecs, representationCodecs, adaptationRoles) {
    function fromMimeType(mimeType, roles) {
        var topLevel = mimeType.split("/")[0];
        if (arrayIncludes(KNOWN_ADAPTATION_TYPES, topLevel)) {
            return topLevel;
        }
        if (mimeType === "application/bif") {
            return "image";
        }
        if (mimeType === "application/ttml+xml") {
            return "text";
        }
        // manage DASH-IF mp4-embedded subtitles and metadata
        if (mimeType === "application/mp4") {
            if (roles != null) {
                if (arrayFind(roles, function (role) {
                    return role.schemeIdUri === "urn:mpeg:dash:role:2011" &&
                        arrayIncludes(SUPPORTED_TEXT_TYPES, role.value);
                }) != null) {
                    return "text";
                }
            }
            return "metadata";
        }
    }
    function fromCodecs(codecs) {
        switch (codecs.substring(0, 3)) {
            case "avc":
            case "hev":
            case "hvc":
            case "vp8":
            case "vp9":
            case "av1":
                return "video";
            case "vtt":
                return "text";
            case "bif":
                return "image";
        }
        switch (codecs.substring(0, 4)) {
            case "mp4a":
                return "audio";
            case "wvtt":
            case "stpp":
                return "text";
        }
    }
    if (adaptationMimeType != null) {
        var typeFromMimeType = fromMimeType(adaptationMimeType, adaptationRoles);
        if (typeFromMimeType != null) {
            return typeFromMimeType;
        }
    }
    if (adaptationCodecs != null) {
        var typeFromCodecs = fromCodecs(adaptationCodecs);
        if (typeFromCodecs != null) {
            return typeFromCodecs;
        }
    }
    for (var i = 0; i < representationMimeTypes.length; i++) {
        var representationMimeType = representationMimeTypes[i];
        if (representationMimeType != null) {
            var typeFromMimeType = fromMimeType(representationMimeType, adaptationRoles);
            if (typeFromMimeType != null) {
                return typeFromMimeType;
            }
        }
    }
    for (var i = 0; i < representationCodecs.length; i++) {
        var codecs = representationCodecs[i];
        if (codecs != null) {
            var typeFromMimeType = fromCodecs(codecs);
            if (typeFromMimeType != null) {
                return typeFromMimeType;
            }
        }
    }
    return "unknown";
}
