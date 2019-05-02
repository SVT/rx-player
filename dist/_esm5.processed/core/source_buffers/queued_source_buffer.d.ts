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
import { Observable } from "rxjs";
import { ICustomSourceBuffer } from "../../compat";
import ICustomTimeRanges from "./time_ranges";
export declare type IBufferType = "audio" | "video" | "text" | "image";
export interface IAppendBufferInfos<T> {
    initSegment: T | null;
    segment: T | null;
    codec: string;
    timestampOffset: number;
}
/**
 * Wrap a SourceBuffer and append/remove segments in it in a queue.
 *
 * Wait for the previous buffer action to be finished (updateend event) to
 * perform the next in the queue.
 *
 * To work correctly, only a single QueuedSourceBuffer per SourceBuffer should
 * be created.
 *
 * @class QueuedSourceBuffer
 */
export default class QueuedSourceBuffer<T> {
    /**
     * "Type" of the buffer.
     * e.g. "audio", "video", "text", "image"
     * @type {string}
     */
    readonly bufferType: IBufferType;
    /**
     * SourceBuffer implementation.
     * @private
     * @type {Object}
     */
    private readonly _sourceBuffer;
    /**
     * Subject triggered when this QueuedSourceBuffer is disposed.
     * Helps to clean-up Observables created at its creation.
     * @type {Subject}
     */
    private _destroy$;
    /**
     * Queue of awaited buffer orders.
     * The first element in this array will be the first performed.
     * @private
     * @type {Array.<Object>}
     */
    private _queue;
    /**
     * Informations about the current order processed by the QueuedSourceBuffer.
     * If equal to null, it means that no order from the queue is currently
     * being processed.
     * @private
     * @type {Object|null}
     */
    private _currentOrder;
    /**
     * Keep track of the latest init segment pushed in the linked SourceBuffer.
     * @private
     * @type {*}
     */
    private _lastInitSegment;
    /**
     * Current `type` of the underlying SourceBuffer.
     * Might be changed for codec-switching purposes.
     * @private
     * @type {string}
     */
    private _currentCodec;
    /**
     * Public access to the SourceBuffer's current codec.
     * @returns {string}
     */
    readonly codec: string;
    /**
     * @constructor
     * @param {SourceBuffer} sourceBuffer
     */
    constructor(bufferType: IBufferType, codec: string, sourceBuffer: ICustomSourceBuffer<T>);
    /**
     * Append media segment to the attached SourceBuffer, in a FIFO queue.
     *
     * Depending on the type of data appended, this might need an associated
     * initialization segment.
     *
     * Such initialization segment will be pushed in the SourceBuffer if the
     * last segment pushed was associated to another initialization segment.
     * This detection is entirely reference-based so make sure that the same
     * initSegment argument given share the same reference.
     *
     * You can deactivate the usage of initialization segment by setting the
     * infos.initSegment argument to null.
     *
     * You can also only push an initialization segment by setting the
     * infos.segment argument to null.
     *
     * @param {string} codec
     * @param {Object} infos
     * @returns {Observable}
     */
    appendBuffer(infos: IAppendBufferInfos<T>): Observable<unknown>;
    /**
     * Remove data from the attached SourceBuffer, in a FIFO queue.
     * @param {number} start - start position, in seconds
     * @param {number} end - end position, in seconds
     * @returns {Observable}
     */
    removeBuffer(start: number, end: number): Observable<unknown>;
    /**
     * Returns the currently buffered data, in a TimeRanges object.
     * @returns {TimeRanges}
     */
    getBuffered(): TimeRanges | ICustomTimeRanges;
    /**
     * Dispose of the resources used by this QueuedSourceBuffer.
     *
     * /!\ You won't be able to use the QueuedSourceBuffer after calling this
     * function.
     * @private
     */
    dispose(): void;
    /**
     * Abort the linked SourceBuffer.
     *
     * /!\ You won't be able to use the QueuedSourceBuffer after calling this
     * function.
     * @private
     */
    abort(): void;
    /**
     * Callback used for the 'error' event from the SourceBuffer.
     * @private
     * @param {Event} error
     */
    private _onError;
    /**
     * Handle error events from SourceBuffers.
     * @private
     * @param {Error|Event} err
     */
    private _onErrorEvent;
    /**
     * When the returned observable is subscribed:
     *   1. Add your order to the queue.
     *   2. Begin the queue if not pending.
     *
     * Cancel queued order on unsubscription.
     * @private
     * @param {Object} order
     * @returns {Observable}
     */
    private _addToQueue;
    /**
     * Perform next task if one.
     * @private
     */
    private _flush;
}
