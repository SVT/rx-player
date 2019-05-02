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
import { combineLatest as observableCombineLatest, } from "rxjs";
import { distinctUntilChanged, filter, map, startWith, } from "rxjs/operators";
/**
 * Returns an Observable which emits ``true`` when all PeriodBuffers given are
 * _complete_.
 * Returns false otherwise.
 *
 * A PeriodBuffer for a given type is considered _complete_ when both of these
 * conditions are true:
 *   - it is the last PeriodBuffer in the content for the given type
 *   - it has finished downloading segments (it is _full_)
 *
 * Simply put a _complete_ PeriodBuffer for a given type means that every
 * segments needed for this Buffer have been downloaded.
 *
 * When the Observable returned here emits, every Buffer are finished.
 * @param {...Observable} buffers
 * @returns {Observable}
 */
export default function areBuffersComplete() {
    var buffers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        buffers[_i] = arguments[_i];
    }
    /**
     * Array of Observables linked to the Array of Buffers which emit:
     *   - true when the corresponding buffer is considered _complete_.
     *   - false when the corresponding buffer is considered _active_.
     * @type {Array.<Observable>}
     */
    var isCompleteArray = buffers
        .map(function (buffer) {
        return buffer.pipe(filter(function (evt) {
            return evt.type === "complete-buffer" || evt.type === "active-buffer";
        }), map(function (evt) { return evt.type === "complete-buffer"; }), startWith(false), distinctUntilChanged());
    });
    return observableCombineLatest.apply(void 0, isCompleteArray).pipe(map(function (areComplete) { return areComplete.every(function (isComplete) { return isComplete; }); }), distinctUntilChanged());
}
