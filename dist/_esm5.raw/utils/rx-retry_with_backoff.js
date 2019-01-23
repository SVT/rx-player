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
import { getBackedoffDelay } from "./backoff_delay";
/**
 * Simple debounce implementation.
 * @param {Function} fn
 * @param {Number} delay - delay in ms
 * @returns {Function}
 */
function debounce(fn, delay) {
    var timer = 0;
    return function () {
        if (timer) {
            clearTimeout(timer);
        }
        timer = window.setTimeout(fn, delay);
    };
}
/**
 * Retry the given observable (if it triggers an error) with an exponential
 * backoff.
 * The backoff behavior can be tweaked through the options given.
 *
 * @param {Observable} obs$
 * @param {Object} options - Configuration object.
 * This object contains the following properties:
 *
 *   - retryDelay {Number} - The initial delay, in ms.
 *     This delay will be fuzzed to fall under the range +-30% each time a new
 *     retry is done.
 *     Then, this delay will be multiplied by 2^(n-1), n being the counter of
 *     retry we performed (beginning at 1 for the first retry).
 *
 *   - totalRetry {Number} - The amount of time we should retry. 0
 *     means no retry, 1 means a single retry, Infinity means infinite retry
 *     etc.
 *     If the observable still fails after this number of retry, the error will
 *     be throwed through this observable.
 *
 *   - resetDelay {Number|undefined} - Delay in ms since a retry after which the
 *     counter of retry will be reset if the observable wasn't retried a new
 *     time. 0 / undefined means no delay will be applied.
 *
 *   - shouldRetry {Function|undefined} -  Function which will receive the
 *     observable error each time it fails, and should return a boolean. If this
 *     boolean is false, the error will be directly thrown (without anymore
 *     retry).
 *
 *   - onRetry {Function|undefined} - Function which will be triggered at
 *     each retry. Will receive two arguments:
 *       1. The observable error
 *       2. The current retry count, beginning at 1 for the first retry
 *
 *   - errorSelector {Function|undefined} - If and when the observable will
 *     definitely throw (without retrying), this function will be called with
 *     two arguments:
 *       1. The observable error
 *       2. The final retry count, beginning at 1 for the first retry
 *     The returned value will be what will be thrown by the observable.
 *
 * @returns {Observable}
 * TODO Take errorSelector out. Should probably be entirely managed in the
 * calling code via a catch (much simpler to use and to understand).
 */
export default function retryObsWithBackoff(obs$, options) {
    var retryDelay = options.retryDelay, totalRetry = options.totalRetry, shouldRetry = options.shouldRetry, resetDelay = options.resetDelay, errorSelector = options.errorSelector, onRetry = options.onRetry;
    var retryCount = 0;
    var debounceRetryCount;
    if (resetDelay != null && resetDelay > 0) {
        debounceRetryCount = debounce(function () { retryCount = 0; }, resetDelay);
    }
    return obs$.pipe(catchError(function (error, source) {
        var wantRetry = !shouldRetry || shouldRetry(error);
        if (!wantRetry || retryCount++ >= totalRetry) {
            if (errorSelector) {
                throw errorSelector(error, retryCount);
            }
            else {
                throw error;
            }
        }
        if (onRetry) {
            onRetry(error, retryCount);
        }
        var fuzzedDelay = getBackedoffDelay(retryDelay, retryCount);
        return observableTimer(fuzzedDelay)
            .pipe(mergeMap(function () {
            if (debounceRetryCount) {
                debounceRetryCount();
            }
            return source;
        }));
    }));
}
