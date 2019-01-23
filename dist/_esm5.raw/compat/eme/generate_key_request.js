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
import { defer as observableDefer, } from "rxjs";
import log from "../../log";
import { be4toi, concat, } from "../../utils/byte_parsing";
import castToObservable from "../../utils/cast_to_observable";
import { isIEOrEdge } from "../browser_detection";
import { PSSH_TO_INTEGER } from "./constants";
/**
 * Some browsers have problems when the CENC PSSH box is the first managed PSSH
 * encountered (for the moment just Edge was noted with this behavior).
 *
 * This function tries to move CENC PSSH boxes at the end of the given init
 * data.
 *
 * If the initData is unrecognized or if a CENC PSSH is not found, this function
 * throws.
 * @param {Uint8Array} initData
 * @returns {Uint8Array}
 */
export function patchInitData(initData) {
    var initialLength = initData.byteLength;
    log.info("Compat: Trying to move CENC PSSH from init data at the end of it.");
    var cencs = new Uint8Array();
    var resInitData = new Uint8Array();
    var offset = 0;
    while (offset < initData.length) {
        if (initData.length < offset + 8 ||
            be4toi(initData, offset + 4) !== PSSH_TO_INTEGER) {
            log.warn("Compat: unrecognized initialization data. Cannot patch it.");
            throw new Error("Compat: unrecognized initialization data. Cannot patch it.");
        }
        var len = be4toi(new Uint8Array(initData), offset);
        if (offset + len > initData.length) {
            log.warn("Compat: unrecognized initialization data. Cannot patch it.");
            throw new Error("Compat: unrecognized initialization data. Cannot patch it.");
        }
        var currentPSSH = initData.subarray(offset, offset + len);
        if (
        // yep
        initData[offset + 12] === 0x10 &&
            initData[offset + 13] === 0x77 &&
            initData[offset + 14] === 0xef &&
            initData[offset + 15] === 0xec &&
            initData[offset + 16] === 0xc0 &&
            initData[offset + 17] === 0xb2 &&
            initData[offset + 18] === 0x4d &&
            initData[offset + 19] === 0x02 &&
            initData[offset + 20] === 0xac &&
            initData[offset + 21] === 0xe3 &&
            initData[offset + 22] === 0x3c &&
            initData[offset + 23] === 0x1e &&
            initData[offset + 24] === 0x52 &&
            initData[offset + 25] === 0xe2 &&
            initData[offset + 26] === 0xfb &&
            initData[offset + 27] === 0x4b) {
            log.info("Compat: CENC PSSH found.");
            cencs = concat(cencs, currentPSSH);
        }
        else {
            resInitData = concat(resInitData, currentPSSH);
        }
        offset += len;
    }
    if (offset !== initData.length) {
        log.warn("Compat: unrecognized initialization data. Cannot patch it.");
        throw new Error("Compat: unrecognized initialization data. Cannot patch it.");
    }
    if (resInitData.byteLength === initialLength) {
        log.warn("Compat: CENC PSSH not found. Cannot patch it");
        throw new Error("Compat: unrecognized initialization data. Cannot patch it.");
    }
    return concat(resInitData, cencs);
}
/**
 * Generate a request from session.
 * @param {MediaKeySession} session
 * @param {Uint8Array} initData
 * @param {string} initDataType
 * @param {string} sessionType
 * @returns {Observable}
 */
export default function generateKeyRequest(session, initData, initDataType) {
    return observableDefer(function () {
        log.debug("Compat: Calling generateRequest on the MediaKeySession");
        var patchedInit;
        if (isIEOrEdge) {
            try {
                patchedInit = patchInitData(initData);
            }
            catch (_e) {
                patchedInit = initData;
            }
        }
        else {
            patchedInit = initData;
        }
        return castToObservable(session.generateRequest(initDataType || "", patchedInit));
    });
}
