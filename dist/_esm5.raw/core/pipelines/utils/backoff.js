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
import { timer as observableTimer, } from "rxjs";
import { catchError, mergeMap, } from "rxjs/operators";
import { isOffline } from "../../../compat";
import { RequestError, RequestErrorTypes, } from "../../../errors";
import { getFuzzedDelay } from "../../../utils/backoff_delay";
/**
 * Called on a pipeline's loader error.
 * Returns whether the loader request should be retried.
 * @param {Error} error
 * @returns {Boolean}
 */
function shouldRetry(error) {
    if (!(error instanceof RequestError)) {
        return false;
    }
    if (error.type === RequestErrorTypes.ERROR_HTTP_CODE) {
        return error.status >= 500 || error.status === 404;
    }
    return (error.type === RequestErrorTypes.TIMEOUT ||
        error.type === RequestErrorTypes.ERROR_EVENT);
}
/**
 * Returns true if we're pretty sure that the current error is due to the
 * user being offline.
 * @param {Error} error
 * @returns {Boolean}
 */
function isOfflineRequestError(error) {
    return error.type === RequestErrorTypes.ERROR_EVENT && isOffline();
}
/**
 * Specific exponential backoff algorithm used for segments/manifest
 * downloading.
 *
 * The specificty here in comparaison to a "regular" backoff algorithm is
 * the separation between type of errors:
 *   - "offline" errors
 *   - other xhr errors
 * Both have their own counters which are resetted if the error type changes.
 * @param {Observable} obs$
 * @param {Object} options - Configuration options.
 * @returns {Observable}
 */
function downloadingBackoff(obs$, options) {
    var baseDelay = options.baseDelay, maxDelay = options.maxDelay, maxRetryRegular = options.maxRetryRegular, maxRetryOffline = options.maxRetryOffline, onRetry = options.onRetry;
    var retryCount = 0;
    var ERROR_TYPES = {
        NONE: 0,
        REGULAR: 1,
        OFFLINE: 2,
    };
    var lastError = ERROR_TYPES.NONE;
    return obs$
        .pipe(catchError(function (error, source) {
        if (!shouldRetry(error)) {
            throw error;
        }
        var currentError = error instanceof RequestError &&
            isOfflineRequestError(error) ? ERROR_TYPES.OFFLINE : ERROR_TYPES.REGULAR;
        var maxRetry = currentError === ERROR_TYPES.OFFLINE ?
            maxRetryOffline : maxRetryRegular;
        if (currentError !== lastError) {
            retryCount = 0;
            lastError = currentError;
        }
        if (++retryCount > maxRetry) {
            throw error;
        }
        if (onRetry) {
            onRetry(error, retryCount);
        }
        var delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
        var fuzzedDelay = getFuzzedDelay(delay);
        return observableTimer(fuzzedDelay).pipe(mergeMap(function () { return source; }));
    }));
}
export default downloadingBackoff;
