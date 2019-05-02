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
import QueuedSourceBuffer, { IBufferType } from "./queued_source_buffer";
/**
 * Get all currently available buffer types.
 * /!\ This list can evolve at runtime depending on feature switching.
 * @returns {Array.<string>}
 */
export declare function getBufferTypes(): IBufferType[];
export declare type ITextTrackSourceBufferOptions = {
    textTrackMode?: "native";
    hideNativeSubtitle?: boolean;
} | {
    textTrackMode: "html";
    textTrackElement: HTMLElement;
};
export declare type ISourceBufferOptions = ITextTrackSourceBufferOptions;
declare type INativeSourceBufferType = "audio" | "video";
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
export default class SourceBuffersManager {
    /**
     * Returns true if the SourceBuffer is "native" (has to be attached to the
     * mediaSource before playback).
     * @static
     * @param {string} bufferType
     * @returns {Boolean}
     */
    static isNative(bufferType: string): bufferType is INativeSourceBufferType;
    private readonly _mediaElement;
    private readonly _mediaSource;
    private _initializedSourceBuffers;
    /**
     * @param {HTMLMediaElement} mediaElement
     * @param {MediaSource} mediaSource
     * @constructor
     */
    constructor(mediaElement: HTMLMediaElement, mediaSource: MediaSource);
    /**
     * Returns the created QueuedSourceBuffer for the given type.
     * Returns null if no QueuedSourceBuffer were created for the given type.
     *
     * @param {string} bufferType
     * @returns {QueuedSourceBuffer|null}
     */
    get(bufferType: IBufferType): QueuedSourceBuffer<any> | null;
    /**
     * Creates a new QueuedSourceBuffer for the SourceBuffer type.
     * Reuse an already created one if a QueuedSourceBuffer for the given type
     * already exists.
     * @param {string} bufferType
     * @param {string} codec
     * @param {Object|undefined} options
     * @returns {QueuedSourceBuffer}
     */
    createSourceBuffer(bufferType: IBufferType, codec: string, options?: ISourceBufferOptions): QueuedSourceBuffer<any>;
    /**
     * Dispose of the active SourceBuffer for the given type.
     * @param {string} bufferType
     */
    disposeSourceBuffer(bufferType: IBufferType): void;
    /**
     * Dispose of all QueuedSourceBuffer created on this SourceBuffersManager.
     */
    disposeAll(): void;
}
export {};
