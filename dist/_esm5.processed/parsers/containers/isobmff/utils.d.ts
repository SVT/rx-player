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
import { getPlayReadyKIDFromPrivateData } from "./drm";
interface IISOBMFFKeySystem {
    systemId: string;
    privateData: Uint8Array;
}
export interface ISidxSegment {
    time: number;
    duration: number;
    count: 0;
    timescale: number;
    range: [number, number];
}
/**
 * Parse the sidx part (segment index) of the isobmff.
 * Returns null if not found.
 *
 * @param {Uint8Array} buf
 * @param {Number} initialOffset
 * @returns {Object|null} {Array.<Object>} - Informations about each subsegment.
 * Contains those keys:
 *   - time {Number}: starting _presentation time_ for the subsegment,
 *     timescaled
 *   - duration {Number}: duration of the subsegment, timescaled
 *   - timescale {Number}: the timescale in which the time and duration are set
 *   - count {Number}: always at 0
 *   - range {Array.<Number>}: first and last bytes in the media file
 *     from the anchor point (first byte after the sidx box) for the
 *     concerned subsegment.
 */
declare function getSegmentsFromSidx(buf: Uint8Array, initialOffset: number): ISidxSegment[] | null;
/**
 * Parse track Fragment Decode Time to get a precize initial time for this
 * segment (in the media timescale).
 * Stops at the first tfdt encountered from the beginning of the file.
 * Returns this time. -1 if not found.
 * @param {Uint8Array} buffer
 * @returns {Number}
 */
declare function getTrackFragmentDecodeTime(buffer: Uint8Array): number;
/**
 * @param {Uint8Array} buffer
 * @returns {number}
 */
declare function getDurationFromTrun(buffer: Uint8Array): number;
/**
 * Get various informations from a movie header box. Found in init segments.
 * null if not found or not parsed.
 *
 * This timescale is the default timescale used for segments.
 * @param {Uint8Array} buffer
 * @returns {Number}
 */
declare function getMDHDTimescale(buffer: Uint8Array): number;
/**
 * Update ISOBMFF given to add a "pssh" box in the "moov" box for every content
 * protection in the pssList array given.
 * @param {Uint8Array} buf - the ISOBMFF file
 * @param {Array.<Object>} pssList - The content protections under the form of
 * objects containing two properties:
 *   - systemId {string}: The uuid code. Should only contain 32 hexadecimal
 *     numbers and hyphens
 *   - privateData {Uint8Array} private data associated.
 * @returns {Uint8Array} - The new ISOBMFF generated.
 */
declare function patchPssh(buf: Uint8Array, pssList: IISOBMFFKeySystem[]): Uint8Array;
export { getMDHDTimescale, getPlayReadyKIDFromPrivateData, getTrackFragmentDecodeTime, getDurationFromTrun, getSegmentsFromSidx, patchPssh, };
