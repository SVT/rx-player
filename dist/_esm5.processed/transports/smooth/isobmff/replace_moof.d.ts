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
 * Replace a moof in a segment by a new one.
 * @param {Uint8Array} segment
 * @param {Uint8Array} newMoof
 * @param {Array.<number>} moofOffsets
 * @param {number} trunOffsetInMoof
 * @returns {Uint8Array}
 */
export default function replaceMoofInSegment(segment: Uint8Array, newMoof: Uint8Array, moofOffsets: [number, number], trunOffsetInMoof: number): Uint8Array;
