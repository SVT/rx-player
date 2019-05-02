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
import { concat, itobe4, strToBytes, } from "../../../utils/byte_parsing";
/**
 * Speed up string to bytes conversion by memorizing the result
 *
 * The keys here are ISOBMFF box names. The values are the corresponding
 * bytes conversion for putting as an ISOBMFF boxes.
 *
 * Used by the boxName method.
 * @type {Object}
 */
var boxNamesMem = {};
/**
 * Convert the string name of an ISOBMFF box into the corresponding bytes.
 * Has a memorization mechanism to speed-up if you want to translate the
 * same string multiple times.
 * @param {string} str
 * @returns {Uint8Array}
 */
function boxName(str) {
    if (boxNamesMem[str]) {
        return boxNamesMem[str];
    }
    var nameInBytes = strToBytes(str);
    boxNamesMem[str] = nameInBytes;
    return nameInBytes;
}
/**
 * Create a new ISOBMFF "box" with the given name.
 * @param {string} name - name of the box you want to create, must always
 * be 4 characters (uuid boxes not supported)
 * @param {Uint8Array} buff - content of the box
 * @returns {Uint8Array} - The entire ISOBMFF box (length+name+content)
 */
function createBox(name, buff) {
    var len = buff.length + 8;
    return concat(itobe4(len), boxName(name), buff);
}
/**
 * @param {string} name
 * @param {Array.<Uint8Array>} children
 * @returns {Uint8Array}
 */
function createBoxWithChildren(name, children) {
    return createBox(name, concat.apply(void 0, children));
}
export { createBox, createBoxWithChildren, };
