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
export interface INewSessionCreatedEvent {
    type: "created-session";
    value: {
        mediaKeySession: MediaKeySession | ICustomMediaKeySession;
        sessionType: MediaKeySessionType;
    };
}
export interface IPersistentSessionRecoveryEvent {
    type: "loaded-persistent-session";
    value: {
        mediaKeySession: MediaKeySession | ICustomMediaKeySession;
        sessionType: MediaKeySessionType;
    };
}
export declare type ICreateSessionEvent = INewSessionCreatedEvent | IPersistentSessionRecoveryEvent;
/**
 * Create a new Session on the given MediaKeys, corresponding to the given
 * initializationData.
 * If session creating fails, remove the oldest MediaKeySession loaded and
 * retry.
 *
 * /!\ This only creates new sessions.
 * It will fail if sessionsStore already has a MediaKeySession with
 * the given initializationData.
 * @param {Uint8Array} initData
 * @param {string|undefined} initDataType
 * @param {Object} mediaKeysInfos
 * @returns {Observable}
 */
export default function createSession(initData: Uint8Array, initDataType: string | undefined, mediaKeysInfos: IMediaKeysInfos): Observable<ICreateSessionEvent>;
