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
 * Simple hash-based set.
 * @class SimpleSet
 */
var SimpleSet = /** @class */ (function () {
    function SimpleSet() {
        this._hashes = {};
    }
    /**
     * Add a new hash entry in the set.
     * Do not have any effect on already-added hashes
     * @param {string|number} x
     */
    SimpleSet.prototype.add = function (x) {
        this._hashes[x] = true;
    };
    /**
     * Remove an hash entry from the set.
     * Do not have any effect on already-removed or inexistant hashes
     * @param {string|number} x
     */
    SimpleSet.prototype.remove = function (x) {
        delete this._hashes[x];
    };
    /**
     * Test if the given hash has an entry in the set.
     * @param {string|number} x
     * @returns {boolean}
     */
    SimpleSet.prototype.test = function (x) {
        return !!this._hashes[x];
    };
    /**
     * Returns true if there's currently no hash in this set.
     * @returns {boolean}
     */
    SimpleSet.prototype.isEmpty = function () {
        return !Object.keys(this._hashes).length;
    };
    return SimpleSet;
}());
export default SimpleSet;
