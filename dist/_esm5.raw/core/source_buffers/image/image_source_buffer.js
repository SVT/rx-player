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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * /!\ This file is feature-switchable.
 * It always should be imported through the `features` object.
 */
import log from "../../../log";
import AbstractSourceBuffer from "../abstract_source_buffer";
/**
 * Image SourceBuffer implementation.
 * @class ImageSourceBuffer
 */
var ImageSourceBuffer = /** @class */ (function (_super) {
    __extends(ImageSourceBuffer, _super);
    function ImageSourceBuffer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} data
     */
    ImageSourceBuffer.prototype._append = function (data) {
        log.debug("ImageSourceBuffer: appending new data.");
        var start = data.start, end = data.end, timescale = data.timescale;
        this.buffered.insert(start / timescale, end == null ? Number.MAX_VALUE : end / timescale);
    };
    /**
     * @param {Number} from
     * @param {Number} to
     */
    ImageSourceBuffer.prototype._remove = function (from, to) {
        log.info("ImageSourceBuffer: ignored image data remove order", from, to);
        // TODO once a better strategy for image cleaning has been set (surely done
        // when we will work for live thumbnails), restore this implementation.
        // log.debug("ImageSourceBuffer: removing image data", from, to);
        // this.buffered.remove(from, to);
    };
    ImageSourceBuffer.prototype._abort = function () {
        log.debug("ImageSourceBuffer: aborting image SourceBuffer");
        this._remove(0, Infinity);
    };
    return ImageSourceBuffer;
}(AbstractSourceBuffer));
export default ImageSourceBuffer;
