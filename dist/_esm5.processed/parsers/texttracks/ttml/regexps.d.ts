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
 * @type {RegExp}
 * @example 00:00:40:07 (7 frames) or 00:00:40:07.1 (7 frames, 1 subframe)
 */
declare const REGXP_TIME_COLON_FRAMES: RegExp;
/**
 * @type {RegExp}
 * @example 00:00:40:07 (7 frames) or 00:00:40:07.1 (7 frames, 1 subframe)
 */
declare const REGXP_TIME_COLON: RegExp;
/**
 * @type {RegExp}
 * @example 01:02:43.0345555 or 02:43.03
 */
declare const REGXP_TIME_COLON_MS: RegExp;
/**
 * @type {RegExp}
 * @example 75f or 75.5f
 */
declare const REGXP_TIME_FRAMES: RegExp;
/**
 * @type {RegExp}
 * @example 50t or 50.5t
 */
declare const REGXP_TIME_TICK: RegExp;
/**
 * @type {RegExp}
 * @example 3.45h, 3m or 4.20s
 */
declare const REGXP_TIME_HMS: RegExp;
/**
 * @type {RegExp}
 * @example 50% 10%
 */
declare const REGXP_PERCENT_VALUES: RegExp;
declare const REGXP_8_HEX_COLOR: RegExp;
declare const REGXP_4_HEX_COLOR: RegExp;
export { REGXP_PERCENT_VALUES, REGXP_TIME_COLON, REGXP_TIME_COLON_FRAMES, REGXP_TIME_COLON_MS, REGXP_TIME_FRAMES, REGXP_TIME_HMS, REGXP_TIME_TICK, REGXP_4_HEX_COLOR, REGXP_8_HEX_COLOR, };
