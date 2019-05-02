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
 * Normalized Representation structure.
 * @class Representation
 */
var Representation = /** @class */ (function () {
    /**
     * @constructor
     * @param {Object} args
     */
    function Representation(args) {
        this.id = args.id;
        this.bitrate = args.bitrate;
        this.codec = args.codecs;
        if (args.height != null) {
            this.height = args.height;
        }
        if (args.width != null) {
            this.width = args.width;
        }
        if (args.mimeType != null) {
            this.mimeType = args.mimeType;
        }
        if (args.contentProtections) {
            this.contentProtections = args.contentProtections;
        }
        if (args.frameRate) {
            this.frameRate = args.frameRate;
        }
        this.index = args.index;
    }
    /**
     * Returns "mime-type string" which includes both the mime-type and the codec,
     * which is often needed when interacting with the browser's APIs.
     * @returns {string}
     */
    Representation.prototype.getMimeTypeString = function () {
        return this.mimeType + ";codecs=\"" + this.codec + "\"";
    };
    return Representation;
}());
export default Representation;
