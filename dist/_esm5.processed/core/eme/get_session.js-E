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
import { concat as observableConcat, defer as observableDefer, EMPTY, merge as observableMerge, of as observableOf, } from "rxjs";
import { ignoreElements, map, mergeMap, } from "rxjs/operators";
import { getInitData, } from "../../compat";
import config from "../../config";
import log from "../../log";
import createSession from "./create_session";
import isSessionUsable from "./utils/is_session_usable";
var MAX_SESSIONS = config.EME_MAX_SIMULTANEOUS_MEDIA_KEY_SESSIONS;
/**
 * Handle MediaEncryptedEvents sent by a HTMLMediaElement:
 * Either create a session, skip the event if it is already handled or
 * recuperate a previous session and returns it.
 * @param {Event} encryptedEvent
 * @param {Object} handledInitData
 * @param {Object} mediaKeysInfos
 * @returns {Observable}
 */
export default function getSession(encryptedEvent, handledInitData, mediaKeysInfos) {
    return observableDefer(function () {
        var _a = getInitData(encryptedEvent), initData = _a.initData, initDataType = _a.initDataType;
        if (handledInitData.has(initData, initDataType)) {
            log.debug("EME: Init data already received. Skipping it.");
            return EMPTY; // Already handled, quit
        }
        handledInitData.add(initData, initDataType);
        // possible previous loaded session with the same initialization data
        var previousLoadedSession = null;
        var sessionsStore = mediaKeysInfos.sessionsStore;
        var entry = sessionsStore.get(initData, initDataType);
        if (entry != null) {
            previousLoadedSession = entry.session;
            if (isSessionUsable(previousLoadedSession)) {
                log.debug("EME: Reuse loaded session", previousLoadedSession.sessionId);
                return observableOf({
                    type: "loaded-open-session",
                    value: {
                        mediaKeySession: previousLoadedSession,
                        sessionType: entry.sessionType,
                        initData: initData,
                        initDataType: initDataType,
                    },
                });
            }
            else if (mediaKeysInfos.sessionStorage) {
                mediaKeysInfos.sessionStorage.delete(new Uint8Array(initData), initDataType);
            }
        }
        return (previousLoadedSession ?
            sessionsStore.deleteAndCloseSession(previousLoadedSession) :
            observableOf(null)).pipe(mergeMap(function () {
            var cleaningOldSessions$ = [];
            var entries = sessionsStore.getAll().slice();
            if (MAX_SESSIONS > 0 && MAX_SESSIONS <= entries.length) {
                for (var i = 0; i < (MAX_SESSIONS - entries.length + 1); i++) {
                    cleaningOldSessions$.push(sessionsStore.deleteAndCloseSession(entries[i].session));
                }
            }
            return observableConcat(observableMerge.apply(void 0, cleaningOldSessions$).pipe(ignoreElements()), createSession(initData, initDataType, mediaKeysInfos)
                .pipe(map(function (evt) { return ({
                type: evt.type,
                value: {
                    mediaKeySession: evt.value.mediaKeySession,
                    sessionType: evt.value.sessionType,
                    initData: initData,
                    initDataType: initDataType,
                },
            }); })));
        }));
    });
}
