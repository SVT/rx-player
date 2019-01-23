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
/**
 * Errors linked to the XHR implentation done in the RxPlayer.
 *
 * @class RequestError
 * @extends Error
 */
export default class RequestError extends Error {
    readonly name: "RequestError";
    readonly type: string;
    readonly message: string;
    readonly xhr: XMLHttpRequest;
    readonly url: string;
    readonly status: number;
    /**
     * @param {XMLHttpRequest} xhr
     * @param {string} url
     * @param {string} type
     */
    constructor(xhr: XMLHttpRequest, url: string, type: string);
}
