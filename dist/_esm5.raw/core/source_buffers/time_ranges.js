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
import assert from "../../utils/assert";
import { insertInto, keepRangeIntersection, } from "../../utils/ranges";
/**
 * Simulate TimeRanges as returned by SourceBuffer.prototype.buffered.
 * Add an "insert" and "remove" methods to manually update it.
 * @class ManualTimeRanges
 */
var ManualTimeRanges = /** @class */ (function () {
    function ManualTimeRanges() {
        this._ranges = [];
        this.length = 0;
    }
    ManualTimeRanges.prototype.insert = function (start, end) {
        if (__DEV__) {
            assert(start >= 0, "invalid start time");
            assert(end - start > 0, "invalid end time");
        }
        insertInto(this._ranges, { start: start, end: end });
        this.length = this._ranges.length;
    };
    ManualTimeRanges.prototype.remove = function (start, end) {
        if (__DEV__) {
            assert(start >= 0, "invalid start time");
            assert(end - start > 0, "invalid end time");
        }
        var rangesToIntersect = [];
        if (start > 0) {
            rangesToIntersect.push({ start: 0, end: start });
        }
        if (end < Infinity) {
            rangesToIntersect.push({ start: end, end: Infinity });
        }
        this._ranges = keepRangeIntersection(this._ranges, rangesToIntersect);
        this.length = this._ranges.length;
    };
    ManualTimeRanges.prototype.start = function (index) {
        if (index >= this._ranges.length) {
            throw new Error("INDEX_SIZE_ERROR");
        }
        return this._ranges[index].start;
    };
    ManualTimeRanges.prototype.end = function (index) {
        if (index >= this._ranges.length) {
            throw new Error("INDEX_SIZE_ERROR");
        }
        return this._ranges[index].end;
    };
    return ManualTimeRanges;
}());
export default ManualTimeRanges;
