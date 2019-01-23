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
import { ISegment } from "../../manifest";
import { ISidxSegment } from "../../parsers/containers/isobmff";
import { ISegmentTimingInfos } from "../types";
/**
 * Get precize start and duration of a segment from ISOBMFF.
 *   1. get start from tfdt
 *   2. get duration from trun
 *   3. if at least one is missing, get both informations from sidx
 *   4. As a fallback take segment infos.
 * @param {Object} segment
 * @param {UInt8Array} buffer - The entire isobmff container
 * @param {Array.<Object>|undefined} sidxSegments - Segments from sidx. Here
 * pre-parsed for performance reasons as it is usually available when
 * this function is called.
 * @param {Object} initInfos
 * @returns {Object}
 */
declare function getISOBMFFTimingInfos(segment: ISegment, buffer: Uint8Array, sidxSegments: ISidxSegment[] | null, initInfos?: ISegmentTimingInfos): ISegmentTimingInfos;
export default getISOBMFFTimingInfos;
