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
import { ICustomMediaKeySession } from "../../../compat";
import { IPersistedSessionData, IPersistedSessionStorage } from "../types";
/**
 * Set representing persisted licenses. Depends on a simple local-
 * storage implementation with a `save`/`load` synchronous interface
 * to persist informations on persisted sessions.
 *
 * This set is used only for a cdm/keysystem with license persistency
 * supported.
 * @class PersistedSessionsStore
 */
export default class PersistedSessionsStore {
    private readonly _storage;
    private _entries;
    /**
     * @param {Object} storage
     */
    constructor(storage: IPersistedSessionStorage);
    /**
     * Retrieve entry (sessionId + initData) based on its initData.
     * @param {Uint8Array}  initData
     * @param {string|undefined} initDataType
     * @returns {Object|null}
     */
    get(initData: Uint8Array, initDataType: string | undefined): IPersistedSessionData | null;
    /**
     * Add a new entry in the storage.
     * @param {Uint8Array}  initData
     * @param {string|undefined} initDataType
     * @param {MediaKeySession} session
     */
    add(initData: Uint8Array, initDataType: string | undefined, session: MediaKeySession | ICustomMediaKeySession): void;
    /**
     * Delete entry (sessionId + initData) based on its initData.
     * @param {Uint8Array}  initData
     * @param {string|undefined} initDataType
     */
    delete(initData: Uint8Array, initDataType: string | undefined): void;
    /**
     * Delete all saved entries.
     */
    dispose(): void;
    /**
     * Use the given storage to store the current entries.
     */
    private _save;
}
