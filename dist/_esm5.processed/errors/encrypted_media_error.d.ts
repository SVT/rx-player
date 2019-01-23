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
declare type IEncryptedMediaErrorReason = Error | Event | string | null;
/**
 * Error linked to the encryption of the media.
 *
 * @class EncryptedMediaError
 * @extends Error
 */
export default class EncryptedMediaError extends Error {
    readonly name: "EncryptedMediaError";
    readonly type: string;
    readonly message: string;
    readonly code: string;
    readonly reason?: IEncryptedMediaErrorReason;
    fatal: boolean;
    /**
     * @param {string} code
     * @param {Object} [reason]
     * @Param {Boolean} [fatal]
     */
    constructor(code: string, reason?: IEncryptedMediaErrorReason, fatal?: boolean);
}
export {};
