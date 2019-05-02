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
import log from "../log";
import arrayFind from "../utils/array_find";
/**
 * Update oldPeriod attributes with the one from newPeriod (e.g. when updating
 * the Manifest).
 * @param {Object} oldPeriod
 * @param {Object} newPeriod
 */
export default function updatePeriodInPlace(oldPeriod, newPeriod) {
    oldPeriod.start = newPeriod.start;
    oldPeriod.end = newPeriod.end;
    oldPeriod.duration = newPeriod.duration;
    var oldAdaptations = oldPeriod.getAdaptations();
    var newAdaptations = newPeriod.getAdaptations();
    var _loop_1 = function (j) {
        var oldAdaptation = oldAdaptations[j];
        var newAdaptation = arrayFind(newAdaptations, function (a) { return a.id === oldAdaptation.id; });
        if (!newAdaptation) {
            log.warn("Manifest: Adaptation \"" + oldAdaptations[j].id + "\" not found when merging.");
        }
        else {
            var oldRepresentations = oldAdaptations[j].representations;
            var newRepresentations = newAdaptation.representations;
            var _loop_2 = function (k) {
                var oldRepresentation = oldRepresentations[k];
                var newRepresentation = arrayFind(newRepresentations, function (representation) { return representation.id === oldRepresentation.id; });
                if (!newRepresentation) {
                    /* tslint:disable:max-line-length */
                    log.warn("Manifest: Representation \"" + oldRepresentations[k].id + "\" not found when merging.");
                    /* tslint:enable:max-line-length */
                }
                else {
                    oldRepresentation.index._update(newRepresentation.index);
                }
            };
            for (var k = 0; k < oldRepresentations.length; k++) {
                _loop_2(k);
            }
        }
    };
    for (var j = 0; j < oldAdaptations.length; j++) {
        _loop_1(j);
    }
}
