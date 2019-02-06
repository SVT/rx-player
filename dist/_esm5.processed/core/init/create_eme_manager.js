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
import { map } from "rxjs/operators";
import { events, hasEMEAPIs, } from "../../compat/";
import { EncryptedMediaError } from "../../errors";
import features from "../../features";
import log from "../../log";
var onEncrypted$ = events.onEncrypted$;
/**
 * Create EMEManager if possible (has the APIs and configuration).
 * Else, return an Observable throwing at the next encrypted event encountered.
 * @param {HTMLMediaElement} mediaElement
 * @param {Array.<Object>} keySystems
 * @returns {Observable}
 */
export default function createEMEManager(mediaElement, keySystems) {
    if (features.emeManager == null) {
        return onEncrypted$(mediaElement).pipe(map(function () {
            log.error("Init: Encrypted event but EME feature not activated");
            var err = new Error("EME feature not activated");
            throw new EncryptedMediaError("MEDIA_IS_ENCRYPTED_ERROR", err, true);
        }));
    }
    if (!keySystems || !keySystems.length) {
        return onEncrypted$(mediaElement).pipe(map(function () {
            log.error("Init: Ciphered media and no keySystem passed");
            var err = new Error("Media is encrypted and no `keySystems` given");
            throw new EncryptedMediaError("MEDIA_IS_ENCRYPTED_ERROR", err, true);
        }));
    }
    if (!hasEMEAPIs()) {
        return onEncrypted$(mediaElement).pipe(map(function () {
            log.error("Init: Encrypted event but no EME API available");
            var err = new Error("Encryption APIs not found.");
            throw new EncryptedMediaError("MEDIA_IS_ENCRYPTED_ERROR", err, true);
        }));
    }
    log.debug("Init: Creating EMEManager");
    return features.emeManager(mediaElement, keySystems);
}
