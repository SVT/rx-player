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
 * This file helps to keep track of the currently active Periods.
 * That is, Periods for which at least a single Buffer is currently active.
 *
 * It also keep track of the currently active period:
 * The first chronological period for which all types of buffers are active.
 */
import { Observable } from "rxjs";
import { Period } from "../../manifest";
import { IBufferType } from "../source_buffers";
export interface IPeriodBufferInfos {
    period: Period;
    type: IBufferType;
}
/**
 * Emit the active Period each times it changes.
 *
 * The active Period is the first Period (in chronological order) which has
 * a PeriodBuffer for every defined BUFFER_TYPES.
 *
 * Emit null if no Period has PeriodBuffers for all types.
 *
 * @example
 * For 4 BUFFER_TYPES: "AUDIO", "VIDEO", "TEXT" and "IMAGE":
 * ```
 *                     +-------------+
 *         Period 1    | Period 2    | Period 3
 * AUDIO   |=========| | |===      | |
 * VIDEO               | |=====    | |
 * TEXT    |(NO TEXT)| | |(NO TEXT)| | |====    |
 * IMAGE   |=========| | |=        | |
 *                     +-------------+
 *
 * The active Period here is Period 2 as Period 1 has no video PeriodBuffer.
 *
 * If we are missing a or multiple PeriodBuffers in the first chronological
 * Period, like that is the case here, it generally means that we are
 * currently switching between Periods.
 *
 * For here we are surely switching from Period 1 to Period 2 beginning by the
 * video PeriodBuffer. As every PeriodBuffer is ready for Period 2, we can
 * already inform that it is the current Period.
 * ```
 *
 * @param {Array.<string>} bufferTypes - Every buffer types in the content.
 * @param {Observable} addPeriodBuffer$ - Emit PeriodBuffer informations when
 * one is added.
 * @param {Observable} removePeriodBuffer$ - Emit PeriodBuffer informations when
 * one is removed.
 * @returns {Observable}
 */
export default function ActivePeriodEmitter(bufferTypes: IBufferType[], addPeriodBuffer$: Observable<IPeriodBufferInfos>, removePeriodBuffer$: Observable<IPeriodBufferInfos>): Observable<Period | null>;
