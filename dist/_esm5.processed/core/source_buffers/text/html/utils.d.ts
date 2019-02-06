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
import { ICuesGroup, IHTMLCue } from "./types";
/**
 * @see MAX_DELTA_BUFFER_TIME
 * @param {Number} a
 * @param {Number} b
 * @returns {Boolean}
 */
export declare function areNearlyEqual(a: number, b: number): boolean;
/**
 * Get all cues strictly before the given time.
 * @param {Object} cues
 * @param {Number} time
 * @returns {Array.<Object>}
 */
export declare function getCuesBefore(cues: IHTMLCue[], time: number): IHTMLCue[];
/**
 * Get all cues strictly after the given time.
 * @param {Object} cues
 * @param {Number} time
 * @returns {Array.<Object>}
 */
export declare function getCuesAfter(cues: IHTMLCue[], time: number): IHTMLCue[];
/**
 * @param {Object} cuesInfos
 * @param {Number} start
 * @param {Number} end
 * @returns {Array.<Object>}
 */
export declare function removeCuesInfosBetween(cuesInfos: ICuesGroup, start: number, end: number): [ICuesGroup, ICuesGroup];
