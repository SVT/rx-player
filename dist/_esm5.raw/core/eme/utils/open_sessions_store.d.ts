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
import { ICustomMediaKeys, ICustomMediaKeySession } from "../../../compat";
export interface IStoreSessionData {
    session: MediaKeySession | ICustomMediaKeySession;
    sessionType: MediaKeySessionType;
}
/**
 * Create and store MediaKeySessions linked to a single MediaKeys
 * instance.
 *
 * Keep track of sessionTypes and of the initialization data each
 * MediaKeySession is created for.
 * @class MediaKeySessionsStore
 */
export default class MediaKeySessionsStore {
    private readonly _mediaKeys;
    private _entries;
    constructor(mediaKeys: MediaKeys | ICustomMediaKeys);
    /**
     * @returns {Array.<Object>}
     */
    getAll(): IStoreSessionData[];
    /**
     * Returns an entry in this cache with the initData and initDataType given.
     * null if no such session is stored.
     *
     * @param {Uint8Array} initData
     * @param {string|undefined} initDataType
     * @returns {Object|null}
     */
    get(initData: Uint8Array, initDataType: string | undefined): IStoreSessionData | null;
    /**
     * @param {Uint8Array} initData
     * @param {string|undefined} initDataType
     * @param {string} sessionType
     * @returns {MediaKeySession}
     * @throws {EncryptedMediaError}
     */
    createSession(initData: Uint8Array, initDataType: string | undefined, sessionType: MediaKeySessionType): MediaKeySession | ICustomMediaKeySession;
    /**
     * Close a MediaKeySession and remove its entry if it's found in the store.
     * @param {MediaKeySession} session
     * @returns {Observable}
     */
    deleteAndCloseSession(session: MediaKeySession | ICustomMediaKeySession): Observable<unknown>;
    /**
     * Close all sessions in this store.
     * Emit null when done
     * @returns {Observable}
     */
    closeAllSessions(): Observable<null>;
    /**
     * Remove a MediaKeySession from the Cache, without closing it.
     * Returns the entry if found, null otherwise.
     * @param {MediaKeySession} session
     * @returns {number} - index of the session in the cache. -1 of not found.
     */
    private _delete;
}
