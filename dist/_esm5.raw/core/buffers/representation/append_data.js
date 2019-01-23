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
import { catchError, mergeMapTo, } from "rxjs/operators";
import { MediaError } from "../../../errors";
import forceGarbageCollection from "./force_garbage_collection";
/**
 * Append buffer to the queuedSourceBuffer.
 * If it leads to a QuotaExceededError, try to run our custom range
 * _garbage collector_.
 *
 * @param {Observable} clock$
 * @param {Object} queuedSourceBuffer
 * @param {Object} dataInfos
 * @returns {Observable}
 */
export default function appendDataToSourceBufferWithRetries(clock$, queuedSourceBuffer, dataInfos) {
    var append$ = queuedSourceBuffer.appendBuffer(dataInfos);
    return append$.pipe(catchError(function (appendError) {
        if (!appendError || appendError.name !== "QuotaExceededError") {
            throw new MediaError("BUFFER_APPEND_ERROR", appendError, true);
        }
        return forceGarbageCollection(clock$, queuedSourceBuffer).pipe(mergeMapTo(append$), catchError(function (forcedGCError) {
            // (weird Typing either due to TypeScript or RxJS bug)
            throw new MediaError("BUFFER_FULL_ERROR", forcedGCError, true);
        }));
    }));
}
