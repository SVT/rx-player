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
export interface IScheme {
    schemeIdUri?: string;
    value?: string;
}
/**
 * Parse MPD boolean attributes.
 * @param {string} str
 * @returns {Boolean}
 */
declare function parseBoolean(str: string): boolean;
/**
 * Parse some MPD attributes.
 * @param {string} str
 * @returns {Boolean|Number}
 */
declare function parseIntOrBoolean(str: string): boolean | number;
/**
 * Parse MPD date attributes.
 * @param {string} str
 * @returns {Date}
 */
declare function parseDateTime(str: string): number;
/**
 * Parse MPD ISO8601 duration attributes into seconds.
 * @param {string} date
 * @returns {Number}
 */
declare function parseDuration(date: string): number;
/**
 * Parse MPD byterange attributes into arrays of two elements: the start and
 * the end.
 * @param {string} str
 * @returns {Array.<Number>}
 */
declare function parseByteRange(str: string): [number, number] | null;
/**
 * @param {Element} root
 * @returns {Object}
 */
declare function parseScheme(root: Element): IScheme;
export { parseBoolean, parseByteRange, parseDateTime, parseDuration, parseIntOrBoolean, parseScheme, };
