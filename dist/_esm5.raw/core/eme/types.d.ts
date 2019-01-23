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
import { ICompatMediaKeySystemAccess, ICustomMediaKeys, ICustomMediaKeySession, ICustomMediaKeySystemAccess } from "../../compat";
import { ICustomError } from "../../errors";
import SessionsStore from "./utils/open_sessions_store";
import PersistedSessionsStore from "./utils/persisted_session_store";
export interface IEMEWarningEvent {
    type: "warning";
    value: ICustomError | Error;
}
export interface IKeySystemAccessInfos {
    keySystemAccess: ICompatMediaKeySystemAccess | ICustomMediaKeySystemAccess;
    keySystemOptions: IKeySystemOption;
}
export interface IMediaKeysInfos {
    mediaKeySystemAccess: ICompatMediaKeySystemAccess | ICustomMediaKeySystemAccess;
    keySystemOptions: IKeySystemOption;
    mediaKeys: MediaKeys | ICustomMediaKeys;
    sessionsStore: SessionsStore;
    sessionStorage: PersistedSessionsStore | null;
}
export interface IPersistedSessionData {
    sessionId: string;
    initData: number;
    initDataType: string | undefined;
}
export interface IPersistedSessionStorage {
    load(): IPersistedSessionData[];
    save(x: IPersistedSessionData[]): void;
}
declare type TypedArray = Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;
export interface IKeySystemOption {
    type: string;
    getLicense: (message: Uint8Array, messageType: string) => Promise<TypedArray | ArrayBuffer | null> | TypedArray | ArrayBuffer | null;
    serverCertificate?: ArrayBuffer | TypedArray;
    persistentLicense?: boolean;
    licenseStorage?: IPersistedSessionStorage;
    persistentStateRequired?: boolean;
    distinctiveIdentifierRequired?: boolean;
    closeSessionsOnStop?: boolean;
    onKeyStatusesChange?: (evt: Event, session: MediaKeySession | ICustomMediaKeySession) => Promise<TypedArray | ArrayBuffer | null> | TypedArray | ArrayBuffer | null;
    videoRobustnesses?: Array<string | undefined>;
    audioRobustnesses?: Array<string | undefined>;
    throwOnLicenseExpiration?: boolean;
}
export declare const KEY_STATUS_ERRORS: Partial<Record<string, boolean>>;
export {};
