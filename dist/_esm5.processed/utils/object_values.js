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
 * @param {Object|Array} o
 * @returns {Array.<*>}
 */
function objectValues(o) {
    return Object.keys(o).map(function (k) { return o[k]; });
}
/* tslint:disable no-unbound-method */
export default typeof Object.values === "function" ?
    Object.values : objectValues;
/* tslint:enable no-unbound-method */
export { objectValues, };
