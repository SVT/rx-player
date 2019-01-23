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
import { getMDAT, getTRAF } from "../../parsers/containers/isobmff";
export interface IISOBMFFBasicSegment {
    time: number;
    duration: number;
}
declare const _default: {
    getMdat: typeof getMDAT;
    getTraf: typeof getTRAF;
    /**
     * @param {Uint8Array} traf
     * @returns {Array.<Object>}
     */
    parseTfrf(traf: Uint8Array): IISOBMFFBasicSegment[];
    /**
     * @param {Uint8Array} traf
     * @returns {Object|undefined}
     */
    parseTfxd(traf: Uint8Array): IISOBMFFBasicSegment | undefined;
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
    createVideoInitSegment(timescale: number, width: number, height: number, hRes: number, vRes: number, nalLength: number, codecPrivateData: string, keyId?: string | undefined, pssList?: {
        systemId: string;
        privateData?: Uint8Array | undefined;
        keyIds?: Uint8Array | undefined;
    }[] | undefined): Uint8Array;
    /**
     * Return full audio Init segment as Uint8Array
     * @param {Number} timescale
     * @param {Number} channelsCount
     * @param {Number} sampleSize
     * @param {Number} packetSize
     * @param {Number} sampleRate
     * @param {string} codecPrivateData
     * @param {string} keyId - hex string representing the key Id, 32 chars.
     * eg. a800dbed49c12c4cb8e0b25643844b9b
     * @param {Array.<Object>} [pssList] - List of dict, example:
     * {systemId: "DEADBEEF", codecPrivateData: "DEAFBEEF"}
     * @returns {Uint8Array}
     */
    createAudioInitSegment(timescale: number, channelsCount: number, sampleSize: number, packetSize: number, sampleRate: number, codecPrivateData: string, keyId?: string | undefined, pssList?: {
        systemId: string;
        privateData?: Uint8Array | undefined;
        keyIds?: Uint8Array | undefined;
    }[] | undefined): Uint8Array;
    /**
     * Add decodeTime info in a segment (tfdt box)
     * @param {Uint8Array} segment
     * @param {Number} decodeTime
     * @return {Uint8Array}
     */
    patchSegment(segment: Uint8Array, decodeTime: number): Uint8Array;
};
export default _default;
