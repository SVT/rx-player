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
import { hexToBytes } from "../../../utils/byte_parsing";
import { createAVC1Box, createAVCCBox, createENCVBox, createFRMABox, createSCHMBox, createSTSDBox, createTENCBox, createVMHDBox, } from "./create_boxes";
import createInitSegment from "./create_init_segment";
/**
 * Return full video Init segment as Uint8Array
 * @param {Number} timescale - lowest number, this one will be set into mdhd
 * *10000 in mvhd, e.g. 1000
 * @param {Number} width
 * @param {Number} height
 * @param {Number} hRes
 * @param {Number} vRes
 * @param {Number} nalLength (1, 2 or 4)
 * @param {string} codecPrivateData
 * @param {string} keyId - hex string representing the key Id,
 * 32 chars. eg. a800dbed49c12c4cb8e0b25643844b9b
 * @param {Array.<Object>} [pssList] - List of dict, example:
 * {systemId: "DEADBEEF", codecPrivateData: "DEAFBEEF}
 * @returns {Uint8Array}
 */
export default function createVideoInitSegment(timescale, width, height, hRes, vRes, nalLength, codecPrivateData, keyId, pssList) {
    var _pssList = pssList || [];
    var _a = codecPrivateData.split("00000001"), spsHex = _a[1], ppsHex = _a[2];
    var sps = hexToBytes(spsHex);
    var pps = hexToBytes(ppsHex);
    // TODO NAL length is forced to 4
    var avcc = createAVCCBox(sps, pps, nalLength);
    var stsd;
    if (!_pssList.length || keyId == null) {
        var avc1 = createAVC1Box(width, height, hRes, vRes, "AVC Coding", 24, avcc);
        stsd = createSTSDBox([avc1]);
    }
    else {
        var tenc = createTENCBox(1, 8, keyId);
        var schi = createBoxWithChildren("schi", [tenc]);
        var schm = createSCHMBox("cenc", 65536);
        var frma = createFRMABox("avc1");
        var sinf = createBoxWithChildren("sinf", [frma, schm, schi]);
        var encv = createENCVBox(width, height, hRes, vRes, "AVC Coding", 24, avcc, sinf);
        stsd = createSTSDBox([encv]);
    }
    return createInitSegment(timescale, "video", stsd, createVMHDBox(), width, height, _pssList);
}
