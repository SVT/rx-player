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
import log from "../../log";
/**
 * Simple RepresentationIndex implementation for static files.
 * @class StaticRepresentationIndex
 */
var StaticRepresentationIndex = /** @class */ (function () {
    /**
     * @param {Object} infos
     */
    function StaticRepresentationIndex(infos) {
        this._media = infos.media;
    }
    /**
     * Static contents do not have any initialization segments.
     * Just return null.
     * @returns {null}
     */
    StaticRepresentationIndex.prototype.getInitSegment = function () {
        return null;
    };
    /**
     * Returns the only Segment available here.
     * @returns {Array.<Object>}
     */
    StaticRepresentationIndex.prototype.getSegments = function () {
        return [{
                id: "0",
                isInit: false,
                number: 0,
                time: 0,
                duration: Number.MAX_VALUE,
                timescale: 1,
                mediaURL: this._media,
            }];
    };
    /**
     * Returns first position in index.
     * @returns {undefined}
     */
    StaticRepresentationIndex.prototype.getFirstPosition = function () {
        return;
        /* tslint:enable return-undefined */
    };
    /**
     * Returns last position in index.
     * @returns {undefined}
     */
    StaticRepresentationIndex.prototype.getLastPosition = function () {
        return;
    };
    /**
     * Returns false as a static file never need to be refreshed.
     * @returns {Boolean}
     */
    StaticRepresentationIndex.prototype.shouldRefresh = function () {
        return false;
    };
    /**
     * @returns {Number}
     */
    StaticRepresentationIndex.prototype.checkDiscontinuity = function () {
        return -1;
    };
    StaticRepresentationIndex.prototype._addSegments = function () {
        log.warn("Tried add Segments to a static RepresentationIndex");
    };
    StaticRepresentationIndex.prototype._update = function () {
        log.warn("Tried to update a static RepresentationIndex");
    };
    return StaticRepresentationIndex;
}());
export default StaticRepresentationIndex;
