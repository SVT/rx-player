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
 * Store the MediaKeys infos attached to a media element.
 * @class MediaKeysInfosStore
 */
var MediaKeysInfosStore = /** @class */ (function () {
    function MediaKeysInfosStore() {
        this._state = new WeakMap();
    }
    MediaKeysInfosStore.prototype.setState = function (mediaElement, state) {
        this._state.set(mediaElement, state);
    };
    MediaKeysInfosStore.prototype.getState = function (mediaElement) {
        return this._state.get(mediaElement) || null;
    };
    MediaKeysInfosStore.prototype.clearState = function (mediaElement) {
        this._state.set(mediaElement, null);
    };
    return MediaKeysInfosStore;
}());
export default MediaKeysInfosStore;
