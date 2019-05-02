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
// Keys are the different key statuses possible.
// Values are ``true`` if such key status defines an error
/* tslint:disable no-object-literal-type-assertion */
export var KEY_STATUS_ERRORS = {
    "internal-error": true,
    expired: false,
    released: false,
    "output-restricted": false,
    "output-downscaled": false,
    "status-pending": false,
};
/* tslint:enable no-object-literal-type-assertion */
