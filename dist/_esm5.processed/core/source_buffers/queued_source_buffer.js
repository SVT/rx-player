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
import { Observable, Subject, } from "rxjs";
import { tryToChangeSourceBufferType, } from "../../compat";
import log from "../../log";
var SourceBufferAction;
(function (SourceBufferAction) {
    SourceBufferAction[SourceBufferAction["Append"] = 0] = "Append";
    SourceBufferAction[SourceBufferAction["Remove"] = 1] = "Remove";
})(SourceBufferAction || (SourceBufferAction = {}));
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
var QueuedSourceBuffer = /** @class */ (function () {
    /**
     * @constructor
     * @param {SourceBuffer} sourceBuffer
     */
    function QueuedSourceBuffer(bufferType, codec, sourceBuffer) {
        this.bufferType = bufferType;
        this._sourceBuffer = sourceBuffer;
        this._queue = [];
        this._currentOrder = null;
        this._lastInitSegment = null;
        this._currentCodec = codec;
        this.__onError = this._onError.bind(this);
        this.__onUpdateEnd = this._onUpdateEnd.bind(this);
        this._sourceBuffer.addEventListener("error", this.__onError);
        this._sourceBuffer.addEventListener("updateend", this.__onUpdateEnd);
    }
    Object.defineProperty(QueuedSourceBuffer.prototype, "codec", {
        /**
         * Public access to the SourceBuffer's current codec.
         * @returns {string}
         */
        get: function () {
            return this._currentCodec;
        },
        enumerable: true,
        configurable: true
    });
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
    QueuedSourceBuffer.prototype.appendBuffer = function (infos) {
        return this._addToQueue({ type: SourceBufferAction.Append, value: infos });
    };
    /**
     * Remove data from the attached SourceBuffer, in a FIFO queue.
     * @param {number} start - start position, in seconds
     * @param {number} end - end position, in seconds
     * @returns {Observable}
     */
    QueuedSourceBuffer.prototype.removeBuffer = function (start, end) {
        return this._addToQueue({ type: SourceBufferAction.Remove, value: { start: start, end: end } });
    };
    /**
     * Returns the currently buffered data, in a TimeRanges object.
     * @returns {TimeRanges}
     */
    QueuedSourceBuffer.prototype.getBuffered = function () {
        return this._sourceBuffer.buffered;
    };
    /**
     * Dispose of the resources used by this QueuedSourceBuffer.
     *
     * /!\ You won't be able to use the QueuedSourceBuffer after calling this
     * function.
     * @private
     */
    QueuedSourceBuffer.prototype.dispose = function () {
        this._sourceBuffer.removeEventListener("error", this.__onError);
        this._sourceBuffer.removeEventListener("updateend", this.__onUpdateEnd);
        if (this._currentOrder != null) {
            this._currentOrder.subject.complete();
            this._currentOrder = null;
        }
        while (this._queue.length) {
            var nextElement = this._queue.shift();
            if (nextElement != null) {
                nextElement.subject.complete();
            }
        }
    };
    /**
     * Abort the linked SourceBuffer.
     *
     * /!\ You won't be able to use the QueuedSourceBuffer after calling this
     * function.
     * @private
     */
    QueuedSourceBuffer.prototype.abort = function () {
        this._sourceBuffer.abort();
    };
    /**
     * Callback used for the 'updateend' event, as a segment has been added/removed.
     * @private
     */
    QueuedSourceBuffer.prototype._onUpdateEnd = function () {
        this._flush();
    };
    /**
     * Callback used for the 'error' event from the SourceBuffer.
     * @private
     * @param {Event} error
     */
    QueuedSourceBuffer.prototype._onError = function (error) {
        this._lastInitSegment = null; // initialize init segment as a security
        if (this._currentOrder != null) {
            this._currentOrder.subject.error(error);
        }
    };
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
    QueuedSourceBuffer.prototype._addToQueue = function (order) {
        var _this = this;
        return new Observable(function (obs) {
            var shouldRestartQueue = _this._queue.length === 0 && _this._currentOrder == null;
            var queueItem;
            var subject = new Subject();
            if (order.type === SourceBufferAction.Append) {
                var _a = order.value, segment = _a.segment, initSegment = _a.initSegment, timestampOffset = _a.timestampOffset, codec = _a.codec;
                if (initSegment === null && segment === null) {
                    log.warn("QSB: no segment to append.", _this.bufferType);
                    obs.next(null);
                    obs.complete();
                    return undefined;
                }
                queueItem = {
                    type: SourceBufferAction.Append,
                    value: { initSegment: initSegment, segment: segment, timestampOffset: timestampOffset, codec: codec },
                    subject: subject,
                };
            }
            else if (order.type === SourceBufferAction.Remove) {
                queueItem = {
                    type: SourceBufferAction.Remove,
                    value: order.value,
                    subject: subject,
                };
            }
            else {
                throw new Error("QSB: unrecognized order");
            }
            _this._queue.push(queueItem);
            var subscription = subject.subscribe(obs);
            if (shouldRestartQueue) {
                _this._flush();
            }
            return function () {
                subscription.unsubscribe();
                var index = _this._queue.indexOf(queueItem);
                if (index >= 0) {
                    _this._queue.splice(index, 1);
                }
            };
        });
    };
    /**
     * Perform next task if one.
     * @private
     */
    QueuedSourceBuffer.prototype._flush = function () {
        if (this._sourceBuffer.updating) {
            return;
        }
        if (this._currentOrder == null) {
            if (this._queue.length === 0) {
                return;
            }
            // TODO TypeScrypt do not get the previous length check? Find solution /
            // open issue
            var newQueueItem = this._queue.shift();
            var tasks = [];
            if (newQueueItem.type === SourceBufferAction.Append) {
                if (newQueueItem.value.initSegment !== null) {
                    tasks.push({
                        type: SourceBufferAction.Append,
                        value: {
                            isInit: true,
                            segment: newQueueItem.value.initSegment,
                            codec: newQueueItem.value.codec,
                            timestampOffset: newQueueItem.value.timestampOffset,
                        },
                    });
                }
                else if (newQueueItem.value.segment === null) {
                    newQueueItem.subject.next();
                    newQueueItem.subject.complete();
                }
                if (newQueueItem.value.segment !== null) {
                    tasks.push({
                        type: SourceBufferAction.Append,
                        value: {
                            segment: newQueueItem.value.segment,
                            isInit: false,
                            codec: newQueueItem.value.codec,
                            timestampOffset: newQueueItem.value.timestampOffset,
                        },
                    });
                }
            }
            else {
                tasks.push({ type: SourceBufferAction.Remove, value: newQueueItem.value });
            }
            this._currentOrder = { tasks: tasks, subject: newQueueItem.subject };
        }
        var task = this._currentOrder.tasks.shift();
        if (task == null) {
            var subject = this._currentOrder.subject;
            this._currentOrder = null;
            subject.next();
            subject.complete();
            if (this._queue.length > 0) {
                this._flush();
            }
            return;
        }
        try {
            switch (task.type) {
                case SourceBufferAction.Append:
                    var _a = task.value, segment = _a.segment, isInit = _a.isInit, _b = _a.timestampOffset, timestampOffset = _b === void 0 ? 0 : _b, codec = _a.codec;
                    if (isInit && this._lastInitSegment === segment) {
                        this._flush(); // nothing to do
                        return;
                    }
                    if (this._currentCodec !== codec) {
                        log.debug("QSB: updating codec");
                        var couldUpdateType = tryToChangeSourceBufferType(this._sourceBuffer, codec);
                        if (couldUpdateType) {
                            this._currentCodec = codec;
                        }
                        else {
                            log.warn("QSB: could not update codec", codec, this._currentCodec);
                        }
                    }
                    if (this._sourceBuffer.timestampOffset !== timestampOffset) {
                        var newTimestampOffset = timestampOffset || 0;
                        log.debug("QSB: updating timestampOffset", this.bufferType, this._sourceBuffer.timestampOffset, newTimestampOffset);
                        this._sourceBuffer.timestampOffset = newTimestampOffset;
                    }
                    log.debug("QSB: pushing new data to SourceBuffer", this.bufferType);
                    if (isInit) {
                        this._lastInitSegment = segment;
                    }
                    this._sourceBuffer.appendBuffer(segment);
                    break;
                case SourceBufferAction.Remove:
                    var _c = task.value, start = _c.start, end = _c.end;
                    log.debug("QSB: removing data from SourceBuffer", this.bufferType, start, end);
                    this._sourceBuffer.remove(start, end);
                    break;
            }
        }
        catch (e) {
            this._onError(e);
        }
    };
    return QueuedSourceBuffer;
}());
export default QueuedSourceBuffer;
