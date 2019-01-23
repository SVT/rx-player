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
declare type TypedArray = Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;
/**
 * Convert a simple string to an Uint8Array containing the corresponding
 * UTF-8 code units.
 * /!\ its implementation favors simplicity and performance over accuracy.
 * Each character having a code unit higher than 255 in UTF-16 will be
 * truncated (real value % 256).
 * Please take that into consideration when calling this function.
 * @param {string} str
 * @returns {Uint8Array}
 */
declare function strToBytes(str: string): Uint8Array;
/**
 * construct string from the code units given
 * @param {Uint16Array|Uint8Array} bytes
 * @returns {string}
 */
declare function bytesToStr(bytes: TypedArray): string;
/**
 * construct string from the code units given.
 * Only use every other byte for each UTF-16 character.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
declare function bytesToUTF16Str(bytes: TypedArray): string;
/**
 * Convert hex codes in a string form into the corresponding bytes.
 * @param {string} str
 * @returns {Uint8Array}
 * @throws TypeError - str.length is odd
 */
declare function hexToBytes(str: string): Uint8Array;
/**
 * Convert bytes into the corresponding hex string, with the possibility
 * to add a separator.
 * @param {Uint8Array} bytes
 * @param {string} [sep=""] - separator. Separate each two hex character.
 * @returns {string}
 */
declare function bytesToHex(bytes: Uint8Array, sep?: string): string;
/**
 * Returns a Uint8Array from the arguments given, in order:
 *   - if the next argument given is a number N set the N next bytes to 0.
 *   - else set the next bytes to the argument given.
 * @param {...(Number|Uint8Array)} args
 * @returns {Uint8Array}
 */
declare function concat(...args: Array<TypedArray | number[] | number>): Uint8Array;
/**
 * Translate groups of 2 big-endian bytes to Integer (from 0 up to 65535).
 * @param {Uint8Array} bytes
 * @param {Number} offset - The offset (from the start of the given array)
 * @returns {Number}
 */
declare function be2toi(bytes: Uint8Array, offset: number): number;
/**
 * Translate groups of 3 big-endian bytes to Integer.
 * @param {Uint8Array} bytes
 * @param {Number} offset - The offset (from the start of the given array)
 * @returns {Number}
 */
declare function be3toi(bytes: Uint8Array, offset: number): number;
/**
 * Translate groups of 4 big-endian bytes to Integer.
 * @param {Uint8Array} bytes
 * @param {Number} offset - The offset (from the start of the given array)
 * @returns {Number}
 */
declare function be4toi(bytes: Uint8Array, offset: number): number;
/**
 * Translate groups of 8 big-endian bytes to Integer.
 * @param {Uint8Array} bytes
 * @param {Number} offset - The offset (from the start of the given array)
 * @returns {Number}
 */
declare function be8toi(bytes: Uint8Array, offset: number): number;
/**
 * Translate Integer (from 0 up to 65535) to a Uint8Array of length 2 of
 * the corresponding big-endian bytes.
 * @param {Number} num
 * @returns {Uint8Array}
 */
declare function itobe2(num: number): Uint8Array;
/**
 * Translate Integer to a Uint8Array of length 4 of the corresponding big-endian
 * bytes.
 * @param {Number} num
 * @returns {Uint8Array}
 */
declare function itobe4(num: number): Uint8Array;
/**
 * Translate Integer to a Uint8Array of length 8 of the corresponding big-endian
 * bytes.
 * /!\ If the top-most bytes are set, this might go over MAX_SAFE_INTEGER, thus
 * leading to a "bad" value.
 * @param {Number} num
 * @returns {Uint8Array}
 */
declare function itobe8(num: number): Uint8Array;
/**
 * Translate groups of 2 little-endian bytes to Integer (from 0 up to 65535).
 * @param {Uint8Array} bytes
 * @param {Number} offset - The offset (from the start of the given array)
 * @returns {Number}
 */
declare function le2toi(bytes: Uint8Array, offset: number): number;
/**
 * Translate groups of 4 little-endian bytes to Integer.
 * @param {Uint8Array} bytes
 * @param {Number} offset - The offset (from the start of the given array)
 * @returns {Number}
 */
declare function le4toi(bytes: Uint8Array, offset: number): number;
/**
 * Translate groups of 8 little-endian bytes to Integer.
 * @param {Uint8Array} bytes
 * @param {Number} offset - The offset (from the start of the given array)
 * @returns {Number}
 */
declare function le8toi(bytes: Uint8Array, offset: number): number;
/**
 * Translate Integer (from 0 up to 65535) to a Uint8Array of length 2 of
 * the corresponding little-endian bytes.
 * @param {Number} num
 * @returns {Uint8Array}
 */
declare function itole2(num: number): Uint8Array;
/**
 * Translate Integer to a Uint8Array of length 4 of the corresponding
 * little-endian bytes.
 * @param {Number} num
 * @returns {Uint8Array}
 */
declare function itole4(num: number): Uint8Array;
/**
 * @param {string} uuid
 * @returns {string}
 * @throws AssertionError - The uuid length is not 16
 */
declare function guidToUuid(uuid: string): string;
export { strToBytes, bytesToStr, bytesToUTF16Str, hexToBytes, bytesToHex, concat, be2toi, be3toi, be4toi, be8toi, le2toi, le4toi, le8toi, itobe2, itobe4, itobe8, itole2, itole4, guidToUuid, };
