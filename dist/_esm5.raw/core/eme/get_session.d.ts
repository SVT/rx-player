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
import { ICustomMediaKeySession } from "../../compat";
import { IMediaKeysInfos } from "./types";
import InitDataStore from "./utils/init_data_store";
export interface IHandledEncryptedEvent {
    type: "created-session" | "loaded-open-session" | "loaded-persistent-session";
    value: {
        mediaKeySession: MediaKeySession | ICustomMediaKeySession;
        sessionType: MediaKeySessionType;
        initData: Uint8Array;
        initDataType: string | undefined;
    };
}
/**
 * Handle MediaEncryptedEvents sent by a HTMLMediaElement:
 * Either create a session, skip the event if it is already handled or
 * recuperate a previous session and returns it.
 * @param {Event} encryptedEvent
 * @param {Object} handledInitData
 * @param {Object} mediaKeysInfos
 * @returns {Observable}
 */
export default function getSession(encryptedEvent: MediaEncryptedEvent, handledInitData: InitDataStore, mediaKeysInfos: IMediaKeysInfos): Observable<IHandledEncryptedEvent>;
