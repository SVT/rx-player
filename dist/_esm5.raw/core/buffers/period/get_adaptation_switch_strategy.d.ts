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
import { Period } from "../../../manifest";
import { IBufferType } from "../../source_buffers";
export declare type IAdaptationSwitchStrategy = {
    type: "continue";
    value: undefined;
} | {
    type: "clean-buffer";
    value: Array<{
        start: number;
        end: number;
    }>;
} | {
    type: "needs-reload";
    value: undefined;
};
/**
 * Find out what to do when switching adaptation, based on the current
 * situation.
 * @param {TimeRanges} buffered
 * @param {Object} period
 * @param {string} bufferType
 * @param {Object} clockTick
 * @returns {Object}
 */
export default function getAdaptationSwitchStrategy(buffered: TimeRanges, period: Period, bufferType: IBufferType, clockTick: {
    currentTime: number;
    readyState: number;
}): IAdaptationSwitchStrategy;
