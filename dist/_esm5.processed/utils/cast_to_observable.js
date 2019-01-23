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
import { from as observableFrom, Observable, of as observableOf, } from "rxjs";
function castToObservable(value) {
    if (value instanceof Observable) {
        return value;
    }
    if (value && typeof value.subscribe === "function") {
        var valObsLike_1 = value;
        return new Observable(function (obs) {
            var sub = valObsLike_1.subscribe(function (val) { obs.next(val); }, function (err) { obs.error(err); }, function () { obs.complete(); });
            return function () {
                if (sub && sub.dispose) {
                    sub.dispose();
                }
                else if (sub && sub.unsubscribe) {
                    sub.unsubscribe();
                }
            };
        });
    }
    if (value && typeof value.then === "function") {
        return observableFrom(value);
    }
    return observableOf(value);
}
export default castToObservable;
