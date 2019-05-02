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
import { MediaError } from "../../errors";
import features from "../../features";
import log from "../../log";
import QueuedSourceBuffer from "./queued_source_buffer";
var POSSIBLE_BUFFER_TYPES = ["audio", "video", "text", "image"];
/**
 * Get all currently available buffer types.
 * /!\ This list can evolve at runtime depending on feature switching.
 * @returns {Array.<string>}
 */
export function getBufferTypes() {
    var bufferTypes = ["audio", "video"];
    if (features.nativeTextTracksBuffer != null ||
        features.htmlTextTracksBuffer != null) {
        bufferTypes.push("text");
    }
    if (features.imageBuffer != null) {
        bufferTypes.push("image");
    }
    return bufferTypes;
}
/**
 * Allows to easily create and dispose SourceBuffers.
 *
 * Only one SourceBuffer per type is allowed at the same time:
 *
 *   - source buffers for native types (which depends on the native
 *     SourceBuffer implementation), are reused if one is re-created.
 *
 *   - source buffers for custom types are aborted each time a new one of the
 *     same type is created.
 *
 * The returned SourceBuffer is actually a QueuedSourceBuffer instance which
 * wrap a SourceBuffer implementation to queue all its actions.
 *
 * @class SourceBuffersManager
 */
var SourceBuffersManager = /** @class */ (function () {
    /**
     * @param {HTMLMediaElement} mediaElement
     * @param {MediaSource} mediaSource
     * @constructor
     */
    function SourceBuffersManager(mediaElement, mediaSource) {
        this._mediaElement = mediaElement;
        this._mediaSource = mediaSource;
        this._initializedSourceBuffers = {};
    }
    /**
     * Returns true if the SourceBuffer is "native" (has to be attached to the
     * mediaSource before playback).
     * @static
     * @param {string} bufferType
     * @returns {Boolean}
     */
    SourceBuffersManager.isNative = function (bufferType) {
        return shouldHaveNativeSourceBuffer(bufferType);
    };
    /**
     * Returns the created QueuedSourceBuffer for the given type.
     * Returns null if no QueuedSourceBuffer were created for the given type.
     *
     * @param {string} bufferType
     * @returns {QueuedSourceBuffer|null}
     */
    SourceBuffersManager.prototype.get = function (bufferType) {
        return this._initializedSourceBuffers[bufferType] || null;
    };
    /**
     * Creates a new QueuedSourceBuffer for the SourceBuffer type.
     * Reuse an already created one if a QueuedSourceBuffer for the given type
     * already exists.
     * @param {string} bufferType
     * @param {string} codec
     * @param {Object|undefined} options
     * @returns {QueuedSourceBuffer}
     */
    SourceBuffersManager.prototype.createSourceBuffer = function (bufferType, codec, options) {
        if (options === void 0) { options = {}; }
        var memorizedSourceBuffer = this._initializedSourceBuffers[bufferType];
        if (shouldHaveNativeSourceBuffer(bufferType)) {
            if (memorizedSourceBuffer) {
                if (memorizedSourceBuffer.codec !== codec) {
                    log.warn("SB: Reusing native SourceBuffer with codec", memorizedSourceBuffer.codec, "for codec", codec);
                }
                else {
                    log.info("SB: Reusing native SourceBuffer with codec", codec);
                }
                return memorizedSourceBuffer;
            }
            log.info("SB: Adding native SourceBuffer with codec", codec);
            var nativeSourceBuffer = createNativeQueuedSourceBuffer(bufferType, this._mediaSource, codec);
            this._initializedSourceBuffers[bufferType] = nativeSourceBuffer;
            return nativeSourceBuffer;
        }
        if (memorizedSourceBuffer) {
            log.info("SB: Reusing a previous custom SourceBuffer for the type", bufferType);
            return memorizedSourceBuffer;
        }
        if (bufferType === "text") {
            log.info("SB: Creating a new text SourceBuffer with codec", codec);
            var sourceBuffer = void 0;
            if (options.textTrackMode === "html") {
                if (features.htmlTextTracksBuffer == null) {
                    throw new Error("HTML Text track feature not activated");
                }
                sourceBuffer = new features
                    .htmlTextTracksBuffer(this._mediaElement, options.textTrackElement);
            }
            else {
                if (features.nativeTextTracksBuffer == null) {
                    throw new Error("Native Text track feature not activated");
                }
                sourceBuffer = new features
                    .nativeTextTracksBuffer(this._mediaElement, !!options.hideNativeSubtitle);
            }
            var queuedSourceBuffer = new QueuedSourceBuffer("text", codec, sourceBuffer);
            this._initializedSourceBuffers.text = queuedSourceBuffer;
            return queuedSourceBuffer;
        }
        else if (bufferType === "image") {
            if (features.imageBuffer == null) {
                throw new Error("Image buffer feature not activated");
            }
            log.info("SB: Creating a new image SourceBuffer with codec", codec);
            var sourceBuffer = new features.imageBuffer();
            var queuedSourceBuffer = new QueuedSourceBuffer("image", codec, sourceBuffer);
            this._initializedSourceBuffers.image = queuedSourceBuffer;
            return queuedSourceBuffer;
        }
        log.error("SB: Unknown buffer type:", bufferType);
        throw new MediaError("BUFFER_TYPE_UNKNOWN", "The player wants to create a SourceBuffer of an unknown type.", true);
    };
    /**
     * Dispose of the active SourceBuffer for the given type.
     * @param {string} bufferType
     */
    SourceBuffersManager.prototype.disposeSourceBuffer = function (bufferType) {
        var memorizedSourceBuffer = this._initializedSourceBuffers[bufferType];
        if (memorizedSourceBuffer == null) {
            log.warn("SB: Trying to dispose a SourceBuffer that does not exist");
            return;
        }
        log.info("SB: Aborting SourceBuffer", bufferType);
        memorizedSourceBuffer.dispose();
        if (!shouldHaveNativeSourceBuffer(bufferType) ||
            this._mediaSource.readyState === "open") {
            try {
                memorizedSourceBuffer.abort();
            }
            catch (e) {
                log.warn("SB: Failed to abort a " + bufferType + " SourceBuffer:", e);
            }
        }
        delete this._initializedSourceBuffers[bufferType];
    };
    /**
     * Dispose of all QueuedSourceBuffer created on this SourceBuffersManager.
     */
    SourceBuffersManager.prototype.disposeAll = function () {
        var _this = this;
        POSSIBLE_BUFFER_TYPES.forEach(function (bufferType) {
            if (_this.get(bufferType) != null) {
                _this.disposeSourceBuffer(bufferType);
            }
        });
    };
    return SourceBuffersManager;
}());
export default SourceBuffersManager;
/**
 * Adds a SourceBuffer to the MediaSource.
 * @param {MediaSource} mediaSource
 * @param {string} codec
 * @returns {SourceBuffer}
 */
function createNativeQueuedSourceBuffer(bufferType, mediaSource, codec) {
    var sourceBuffer = mediaSource.addSourceBuffer(codec);
    return new QueuedSourceBuffer(bufferType, codec, sourceBuffer);
}
/**
 * Returns true if the given buffeType is a native buffer, false otherwise.
 * "Native" SourceBuffers are directly added to the MediaSource.
 * @param {string} bufferType
 * @returns {Boolean}
 */
function shouldHaveNativeSourceBuffer(bufferType) {
    return bufferType === "audio" || bufferType === "video";
}
