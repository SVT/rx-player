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
import { concat as observableConcat, defer as observableDefer, merge as observableMerge, of as observableOf, } from "rxjs";
import { catchError, ignoreElements, } from "rxjs/operators";
import { createSession, } from "../../../compat";
import { EncryptedMediaError } from "../../../errors";
import log from "../../../log";
import arrayFind from "../../../utils/array_find";
import castToObservable from "../../../utils/cast_to_observable";
import hashBuffer from "../../../utils/hash_buffer";
/**
 * Create and store MediaKeySessions linked to a single MediaKeys
 * instance.
 *
 * Keep track of sessionTypes and of the initialization data each
 * MediaKeySession is created for.
 * @class MediaKeySessionsStore
 */
var MediaKeySessionsStore = /** @class */ (function () {
    function MediaKeySessionsStore(mediaKeys) {
        this._mediaKeys = mediaKeys;
        this._entries = [];
    }
    /**
     * @returns {Array.<Object>}
     */
    MediaKeySessionsStore.prototype.getAll = function () {
        return this._entries.map(function (entry) { return ({
            session: entry.session,
            sessionType: entry.sessionType,
        }); });
    };
    /**
     * Returns an entry in this cache with the initData and initDataType given.
     * null if no such session is stored.
     *
     * @param {Uint8Array} initData
     * @param {string|undefined} initDataType
     * @returns {Object|null}
     */
    MediaKeySessionsStore.prototype.get = function (initData, initDataType) {
        var initDataHash = hashBuffer(initData);
        var foundEntry = arrayFind(this._entries, function (entry) { return (entry.initData === initDataHash &&
            entry.initDataType === initDataType); });
        if (foundEntry) {
            var session = foundEntry.session, sessionType = foundEntry.sessionType;
            return { session: session, sessionType: sessionType };
        }
        return null;
    };
    /**
     * @param {Uint8Array} initData
     * @param {string|undefined} initDataType
     * @param {string} sessionType
     * @returns {MediaKeySession}
     * @throws {EncryptedMediaError}
     */
    MediaKeySessionsStore.prototype.createSession = function (initData, initDataType, sessionType) {
        var _this = this;
        if (this.get(initData, initDataType)) {
            throw new EncryptedMediaError("MULTIPLE_SESSIONS_SAME_INIT_DATA", "This initialization data was already stored.", true);
        }
        var session = createSession(this._mediaKeys, sessionType);
        var entry = {
            session: session,
            sessionType: sessionType,
            initData: hashBuffer(initData),
            initDataType: initDataType,
        };
        if (session.closed !== null) {
            session.closed
                .then(function () {
                _this._delete(session);
            })
                .catch(function (e) {
                log.warn("EME-MKSS: session.closed rejected: " + e);
            });
        }
        log.debug("EME-MKSS: Add session", entry);
        this._entries.push(entry);
        return session;
    };
    /**
     * Close a MediaKeySession and remove its entry if it's found in the store.
     * @param {MediaKeySession} session
     * @returns {Observable}
     */
    MediaKeySessionsStore.prototype.deleteAndCloseSession = function (session) {
        var _this = this;
        return observableDefer(function () {
            _this._delete(session);
            log.debug("EME-MKSS: Close session", session);
            return castToObservable(session.close())
                .pipe(catchError(function () { return observableOf(null); }));
        });
    };
    /**
     * Close all sessions in this store.
     * Emit null when done
     * @returns {Observable}
     */
    MediaKeySessionsStore.prototype.closeAllSessions = function () {
        var _this = this;
        return observableDefer(function () {
            var previousEntries = _this._entries;
            _this._entries = []; // clean completely the cache first
            var disposed = previousEntries
                .map(function (entry) { return _this.deleteAndCloseSession(entry.session); });
            return observableConcat(observableMerge.apply(void 0, disposed).pipe(ignoreElements()), observableOf(null));
        });
    };
    /**
     * Remove a MediaKeySession from the Cache, without closing it.
     * Returns the entry if found, null otherwise.
     * @param {MediaKeySession} session
     * @returns {number} - index of the session in the cache. -1 of not found.
     */
    MediaKeySessionsStore.prototype._delete = function (session) {
        var entry = arrayFind(this._entries, function (e) { return e.session === session; });
        if (!entry) {
            return -1;
        }
        log.debug("EME-MKSS: delete session", entry);
        var idx = this._entries.indexOf(entry);
        this._entries.splice(idx, 1);
        return idx;
    };
    return MediaKeySessionsStore;
}());
export default MediaKeySessionsStore;
