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
import { ICompatMediaKeySystemAccess, ICustomMediaKeySystemAccess } from "../../compat";
import MediaKeysInfosStore from "./media_keys_infos_store";
import { IKeySystemOption } from "./types";
export interface IReuseMediaKeySystemAccessEvent {
    type: "reuse-media-key-system-access";
    value: {
        mediaKeySystemAccess: ICompatMediaKeySystemAccess | ICustomMediaKeySystemAccess;
        options: IKeySystemOption;
    };
}
export interface ICreateMediaKeySystemAccessEvent {
    type: "create-media-key-system-access";
    value: {
        mediaKeySystemAccess: ICompatMediaKeySystemAccess | ICustomMediaKeySystemAccess;
        options: IKeySystemOption;
    };
}
export declare type IFoundMediaKeySystemAccessEvent = IReuseMediaKeySystemAccessEvent | ICreateMediaKeySystemAccessEvent;
/**
 * Try to find a compatible key system from the keySystems array given.
 *
 * Returns an Observable which, when subscribed to, will request a
 * MediaKeySystemAccess based on the various keySystems provided. This
 * Observable will:
 *   - emit the MediaKeySystemAccess and the keySystems as an object, when
 *     found. The object is under this form:
 *     {
 *       keySystemAccess {MediaKeySystemAccess}
 *       keySystem {Object}
 *     }
 *   - complete immediately after emitting.
 *   - throw if no  compatible key system has been found.
 *
 * @param {Array.<Object>} keySystems - The keySystems you want to test.
 * @param {Object} currentMediaKeysInfos
 * @returns {Observable}
 */
export default function getMediaKeySystemAccess(mediaElement: HTMLMediaElement, keySystemsConfigs: IKeySystemOption[], currentMediaKeysInfos: MediaKeysInfosStore): Observable<IFoundMediaKeySystemAccessEvent>;
