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
import hashBuffer from "../../../utils/hash_buffer";
import SimpleSet from "../../../utils/simple_set";
/**
 * Memorize initialization data with straightforward methods.
 * @class InitDataStore
 */
var InitDataStore = /** @class */ (function () {
    function InitDataStore() {
        this._namedTypeData = {};
        this._unnamedTypeData = new SimpleSet();
    }
    /**
     * Returns true if this instance has the given initData stored.
     * @param {Uint8Array} initData
     * @param {string|undefined} initDataType
     * @returns {boolean}
     */
    InitDataStore.prototype.has = function (initData, initDataType) {
        if (!initDataType) {
            return this._unnamedTypeData.test(hashBuffer(initData));
        }
        if (!this._namedTypeData[initDataType]) {
            return false;
        }
        return this._namedTypeData[initDataType].test(hashBuffer(initData));
    };
    /**
     * Add initialization data to this memory.
     * @param {Uint8Array} initData
     * @param {string|undefined} initDataType
     */
    InitDataStore.prototype.add = function (initData, initDataType) {
        if (this.has(initData, initDataType)) {
            return;
        }
        if (!initDataType) {
            this._unnamedTypeData.add(hashBuffer(initData));
            return;
        }
        if (!this._namedTypeData[initDataType]) {
            this._namedTypeData[initDataType] = new SimpleSet();
        }
        this._namedTypeData[initDataType].add(hashBuffer(initData));
    };
    /**
     * Remove the initialization data from this memory.
     * Returns true if this instance had the given initData stored.
     * @param {Uint8Array} initData
     * @param {string|undefined} initDataType
     * @returns {boolean}
     */
    InitDataStore.prototype.remove = function (initData, initDataType) {
        if (!initDataType) {
            var hashed = hashBuffer(initData);
            if (this._unnamedTypeData.test(hashed)) {
                this._unnamedTypeData.remove(hashed);
                return true;
            }
            return false;
        }
        else {
            if (!this._namedTypeData[initDataType]) {
                return false;
            }
            var hashed = hashBuffer(initData);
            var simpleSet = this._namedTypeData[initDataType];
            if (simpleSet.test(hashed)) {
                simpleSet.remove(hashed);
                return true;
            }
            return false;
        }
    };
    return InitDataStore;
}());
export default InitDataStore;
