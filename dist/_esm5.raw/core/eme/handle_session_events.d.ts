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
import { IEMEWarningEvent, IKeySystemOption } from "./types";
declare type TypedArray = Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;
export declare type ILicense = TypedArray | ArrayBuffer;
export interface IMediaKeySessionHandledEvents {
    type: MediaKeyMessageType | "key-status-change";
    value: {
        session: MediaKeySession | ICustomMediaKeySession;
        license: ILicense;
    };
}
/**
 * listen to "message" events from session containing a challenge
 * blob and map them to licenses using the getLicense method from
 * selected keySystem.
 * @param {MediaKeySession} session
 * @param {Object} keySystem
 * @returns {Observable}
 */
export default function handleSessionEvents(session: MediaKeySession | ICustomMediaKeySession, keySystem: IKeySystemOption): Observable<IMediaKeySessionHandledEvents | IEMEWarningEvent>;
export {};
