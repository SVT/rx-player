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
 * TODO Remove this logic completely from the player
 * @param {Document} doc
 * @returns {string|null}
 */
declare function extractISML(doc: Document): string | null;
/**
 * Returns string corresponding to the token contained in the url's querystring.
 * Empty string if no token is found.
 * @param {string} url
 * @returns {string}
 */
declare function extractToken(url: string): string;
/**
 * Replace/Remove token from the url's querystring
 * @param {string} url
 * @param {string} [token]
 * @returns {string}
 */
declare function replaceToken(url: string, token?: string): string;
/**
 * @param {string} url
 * @returns {string}
 */
declare function resolveManifest(url: string): string;
export { extractISML, extractToken, replaceToken, resolveManifest, };
