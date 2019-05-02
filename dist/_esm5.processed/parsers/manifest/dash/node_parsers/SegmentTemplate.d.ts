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
import { IParsedInitialization } from "./Initialization";
import { IParsedSegmentBase } from "./SegmentBase";
import { IParsedTimeline } from "./SegmentTimeline";
export interface IParsedSegmentTemplate extends IParsedSegmentBase {
    indexType: "template";
    duration: number;
    availabilityTimeComplete: boolean;
    indexRangeExact: boolean;
    timescale: number;
    presentationTimeOffset?: number;
    availabilityTimeOffset?: number;
    indexRange?: [number, number];
    initialization?: IParsedInitialization;
    startNumber?: number;
    timeShiftBufferDepth?: number;
    media?: string;
    index?: string;
    bitstreamSwitching?: boolean;
}
export interface IParsedSegmentTimeline {
    indexType: "timeline";
    timeline: IParsedTimeline;
    availabilityTimeComplete: boolean;
    indexRangeExact: boolean;
    timescale: number;
    presentationTimeOffset?: number;
    availabilityTimeOffset?: number;
    duration?: number;
    indexRange?: [number, number];
    initialization?: IParsedInitialization;
    startNumber?: number;
    timeShiftBufferDepth?: number;
    media?: string;
    index?: string;
    bitstreamSwitching?: boolean;
}
/**
 * @param {Element} root
 * @returns {Object}
 */
export default function parseSegmentTemplate(root: Element): IParsedSegmentTemplate | IParsedSegmentTimeline;
