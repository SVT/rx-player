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
import { createBoxWithChildren } from "../../../parsers/containers/isobmff";
import { createENCABox, createESDSBox, createFRMABox, createMP4ABox, createSCHMBox, createSMHDBox, createSTSDBox, createTENCBox, } from "./create_boxes";
import createInitSegment from "./create_init_segment";
import getAacesHeader from "./get_aaces_header";
/**
 * Return full audio initialization segment as Uint8Array.
 * @param {Number} timescale
 * @param {Number} channelsCount
 * @param {Number} sampleSize
 * @param {Number} packetSize
 * @param {Number} sampleRate
 * @param {string} codecPrivateData
 * @param {string} keyId - hex string representing the key Id, 32 chars.
 * eg. a800dbed49c12c4cb8e0b25643844b9b
 * @param {Array.<Object>} [pssList]
 * @returns {Uint8Array}
 */
export default function createAudioInitSegment(timescale, channelsCount, sampleSize, packetSize, sampleRate, codecPrivateData, keyId, pssList) {
    if (pssList === void 0) { pssList = []; }
    var _codecPrivateData = codecPrivateData ||
        getAacesHeader(2, sampleRate, channelsCount);
    var esds = createESDSBox(1, _codecPrivateData);
    var stsd = (function () {
        if (!pssList.length || keyId == null) {
            var mp4a = createMP4ABox(1, channelsCount, sampleSize, packetSize, sampleRate, esds);
            return createSTSDBox([mp4a]);
        }
        var tenc = createTENCBox(1, 8, keyId);
        var schi = createBoxWithChildren("schi", [tenc]);
        var schm = createSCHMBox("cenc", 65536);
        var frma = createFRMABox("mp4a");
        var sinf = createBoxWithChildren("sinf", [frma, schm, schi]);
        var enca = createENCABox(1, channelsCount, sampleSize, packetSize, sampleRate, esds, sinf);
        return createSTSDBox([enca]);
    })();
    return createInitSegment(timescale, "audio", stsd, createSMHDBox(), 0, 0, pssList);
}
