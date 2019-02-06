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
/**
 * Returns the content of a box based on its name.
 * `null` if not found.
 * /!\ does not work with UUID boxes
 * @param {Uint8Array} buf - the isobmff structure
 * @param {Number} boxName - the 4-letter 'name' of the box (e.g. 'sidx' or
 * 'moov'), hexa encoded
 * @returns {UInt8Array|null}
 */
declare function getBoxContent(buf: Uint8Array, boxName: number): Uint8Array | null;
/**
 * Returns an ISOBMFF box based on its name.
 * `null` if not found.
 * /!\ does not work with UUID boxes
 * @param {Uint8Array} buf - the isobmff structure
 * @param {Number} boxName - the 4-letter 'name' of the box (e.g. 'sidx' or
 * 'moov'), hexa encoded
 * @returns {UInt8Array|null}
 */
declare function getBox(buf: Uint8Array, boxName: number): Uint8Array | null;
/**
 * Returns start and end offset for a given box.
 * `null` if not found.
 * /!\ does not work with UUID boxes
 * @param {Uint8Array} buf - the isobmff structure
 * @param {Number} boxName - the 4-letter 'name' of the box (e.g. 'sidx' or
 * 'moov'), hexa encoded
 * @returns {Array.<number>|null}
 */
declare function getBoxOffsets(buf: Uint8Array, boxName: number): [number, number] | null;
/**
 * Returns TRAF Box from the whole ISOBMFF File.
 * Returns null if not found.
 * @param {Uint8Array} buffer
 * @returns {Uint8Array|null}
 */
declare function getTRAF(buffer: Uint8Array): Uint8Array | null;
/**
 * Returns MDAT Box from the whole ISOBMFF File.
 * Returns null if not found.
 * @param {Uint8Array} buffer
 * @returns {Uint8Array|null}
 */
declare function getMDAT(buf: Uint8Array): Uint8Array | null;
/**
 * Returns MDIA Box from the whole ISOBMFF File.
 * Returns null if not found.
 * @param {Uint8Array} buffer
 * @returns {Uint8Array|null}
 */
declare function getMDIA(buf: Uint8Array): Uint8Array | null;
export { getBox, getBoxContent, getBoxOffsets, getTRAF, getMDAT, getMDIA, };
