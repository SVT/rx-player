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
export interface ISegmentBaseAttributes {
    availabilityTimeComplete?: boolean;
    availabilityTimeOffset?: number;
    duration?: number;
    indexRange?: [number, number];
    indexRangeExact?: boolean;
    initialization?: IParsedInitialization;
    presentationTimeOffset?: number;
    startNumber?: number;
    timeShiftBufferDepth?: number;
    timescale?: number;
}
interface ISegmentBaseSegment {
    start: number;
    duration: number;
    repeatCount: number;
    range?: [number, number];
}
export interface IParsedSegmentBase extends ISegmentBaseAttributes {
    availabilityTimeComplete: boolean;
    indexRangeExact: boolean;
    timeline: ISegmentBaseSegment[];
    timescale: number;
    media?: string;
}
/**
 * @param {Element} root
 * @returns {Object}
 */
export default function parseSegmentBase(root: Element): IParsedSegmentBase;
export {};
