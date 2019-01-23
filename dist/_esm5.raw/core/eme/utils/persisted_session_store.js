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
import log from "../../../log";
import arrayFind from "../../../utils/array_find";
import assert, { assertInterface, } from "../../../utils/assert";
import hashBuffer from "../../../utils/hash_buffer";
function checkStorage(storage) {
    assert(storage != null, "no licenseStorage given for keySystem with persistentLicense");
    assertInterface(storage, { save: "function", load: "function" }, "licenseStorage");
}
/**
 * Set representing persisted licenses. Depends on a simple local-
 * storage implementation with a `save`/`load` synchronous interface
 * to persist informations on persisted sessions.
 *
 * This set is used only for a cdm/keysystem with license persistency
 * supported.
 * @class PersistedSessionsStore
 */
var PersistedSessionsStore = /** @class */ (function () {
    /**
     * @param {Object} storage
     */
    function PersistedSessionsStore(storage) {
        checkStorage(storage);
        this._entries = [];
        this._storage = storage;
        try {
            this._entries = this._storage.load();
            assert(Array.isArray(this._entries));
        }
        catch (e) {
            log.warn("EME-PSS: Could not get entries from license storage", e);
            this.dispose();
        }
    }
    /**
     * Retrieve entry (sessionId + initData) based on its initData.
     * @param {Uint8Array}  initData
     * @param {string|undefined} initDataType
     * @returns {Object|null}
     */
    PersistedSessionsStore.prototype.get = function (initData, initDataType) {
        var hash = hashBuffer(initData);
        var entry = arrayFind(this._entries, function (e) {
            return e.initData === hash &&
                e.initDataType === initDataType;
        });
        return entry || null;
    };
    /**
     * Add a new entry in the storage.
     * @param {Uint8Array}  initData
     * @param {string|undefined} initDataType
     * @param {MediaKeySession} session
     */
    PersistedSessionsStore.prototype.add = function (initData, initDataType, session) {
        var sessionId = session && session.sessionId;
        if (!sessionId) {
            return;
        }
        var currentEntry = this.get(initData, initDataType);
        if (currentEntry && currentEntry.sessionId === sessionId) {
            return;
        }
        else if (currentEntry) { // currentEntry has a different sessionId
            this.delete(initData, initDataType);
        }
        log.info("EME-PSS: Add new session", sessionId, session);
        this._entries.push({
            sessionId: sessionId,
            initData: hashBuffer(initData),
            initDataType: initDataType,
        });
        this._save();
    };
    /**
     * Delete entry (sessionId + initData) based on its initData.
     * @param {Uint8Array}  initData
     * @param {string|undefined} initDataType
     */
    PersistedSessionsStore.prototype.delete = function (initData, initDataType) {
        var hash = hashBuffer(initData);
        var entry = arrayFind(this._entries, function (e) {
            return e.initData === hash &&
                e.initDataType === initDataType;
        });
        if (entry) {
            log.warn("EME-PSS: Delete session from store", entry);
            var idx = this._entries.indexOf(entry);
            this._entries.splice(idx, 1);
            this._save();
        }
    };
    /**
     * Delete all saved entries.
     */
    PersistedSessionsStore.prototype.dispose = function () {
        this._entries = [];
        this._save();
    };
    /**
     * Use the given storage to store the current entries.
     */
    PersistedSessionsStore.prototype._save = function () {
        try {
            this._storage.save(this._entries);
        }
        catch (e) {
            log.warn("EME-PSS: Could not save licenses in localStorage");
        }
    };
    return PersistedSessionsStore;
}());
export default PersistedSessionsStore;
