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
import { defer as observableDefer, of as observableOf, } from "rxjs";
import { mergeMapTo } from "rxjs/operators";
import { setMediaKeys } from "../../compat";
import log from "../../log";
/**
 * @param {Object} mediaKeysInfos
 * @returns {Observable}
 */
export default function disposeMediaKeys(mediaElement, mediaKeysInfos) {
    return observableDefer(function () {
        var currentState = mediaKeysInfos.getState(mediaElement);
        if (!currentState) {
            return observableOf(null);
        }
        log.debug("EME: Disposing of the current MediaKeys");
        var sessionsStore = currentState.sessionsStore;
        mediaKeysInfos.clearState(mediaElement);
        return sessionsStore.closeAllSessions()
            .pipe(mergeMapTo(setMediaKeys(mediaElement, null)));
    });
}
