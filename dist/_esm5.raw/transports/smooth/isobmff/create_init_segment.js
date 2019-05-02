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
import { createBox, createBoxWithChildren, } from "../../../parsers/containers/isobmff";
import { concat } from "../../../utils/byte_parsing";
import { createDREFBox, createFTYPBox, createHDLRBox, createMDHDBox, createMVHDBox, createPSSHBox, createTKHDBox, createTREXBox, } from "./create_boxes";
/**
 * @param {Uint8Array} mvhd
 * @param {Uint8Array} mvex
 * @param {Uint8Array} trak
 * @param {Object} pssList
 * @returns {Array.<Uint8Array>}
 */
function createMOOVBox(mvhd, mvex, trak, pssList) {
    var children = [mvhd, mvex, trak];
    pssList.forEach(function (pss) {
        var pssh = createPSSHBox(pss.systemId, pss.privateData, pss.keyIds);
        children.push(pssh);
    });
    return createBoxWithChildren("moov", children);
}
/**
 * Create an initialization segment with the informations given.
 * @param {Number} timescale
 * @param {string} type
 * @param {Uint8Array} stsd
 * @param {Uint8Array} mhd
 * @param {Number} width
 * @param {Number} height
 * @param {Array.<Object>} pssList - List of dict, example:
 * {systemId: "DEADBEEF", codecPrivateData: "DEAFBEEF}
 * @returns {Uint8Array}
 */
export default function createInitSegment(timescale, type, stsd, mhd, width, height, pssList) {
    var stbl = createBoxWithChildren("stbl", [
        stsd,
        createBox("stts", new Uint8Array(0x08)),
        createBox("stsc", new Uint8Array(0x08)),
        createBox("stsz", new Uint8Array(0x0c)),
        createBox("stco", new Uint8Array(0x08)),
    ]);
    var url = createBox("url ", new Uint8Array([0, 0, 0, 1]));
    var dref = createDREFBox(url);
    var dinf = createBoxWithChildren("dinf", [dref]);
    var minf = createBoxWithChildren("minf", [mhd, dinf, stbl]);
    var hdlr = createHDLRBox(type);
    var mdhd = createMDHDBox(timescale); // this one is really important
    var mdia = createBoxWithChildren("mdia", [mdhd, hdlr, minf]);
    var tkhd = createTKHDBox(width, height, 1);
    var trak = createBoxWithChildren("trak", [tkhd, mdia]);
    var trex = createTREXBox(1);
    var mvex = createBoxWithChildren("mvex", [trex]);
    var mvhd = createMVHDBox(timescale, 1); // in fact, we don't give a sh** about
    // this value :O
    var moov = createMOOVBox(mvhd, mvex, trak, pssList);
    var ftyp = createFTYPBox("isom", ["isom", "iso2", "iso6", "avc1", "dash"]);
    return concat(ftyp, moov);
}
