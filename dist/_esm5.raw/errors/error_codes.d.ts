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
declare const ErrorTypes: {
    NETWORK_ERROR: string;
    MEDIA_ERROR: string;
    ENCRYPTED_MEDIA_ERROR: string;
    OTHER_ERROR: string;
};
declare const RequestErrorTypes: {
    TIMEOUT: string;
    ERROR_EVENT: string;
    ERROR_HTTP_CODE: string;
    PARSE_ERROR: string;
};
declare const ErrorCodes: {
    PIPELINE_RESOLVE_ERROR: string;
    PIPELINE_LOAD_ERROR: string;
    PIPELINE_PARSING_ERROR: string;
    MANIFEST_PARSE_ERROR: string;
    MANIFEST_INCOMPATIBLE_CODECS_ERROR: string;
    MANIFEST_UNSUPPORTED_ADAPTATION_TYPE: string;
    MEDIA_STARTING_TIME_NOT_FOUND: string;
    MEDIA_TIME_BEFORE_MANIFEST: string;
    MEDIA_TIME_AFTER_MANIFEST: string;
    MEDIA_TIME_NOT_FOUND: string;
    MEDIA_IS_ENCRYPTED_ERROR: string;
    KEY_ERROR: string;
    KEY_STATUS_CHANGE_ERROR: string;
    KEY_UPDATE_ERROR: string;
    KEY_LOAD_ERROR: string;
    KEY_LOAD_TIMEOUT: string;
    KEY_GENERATE_REQUEST_ERROR: string;
    INCOMPATIBLE_KEYSYSTEMS: string;
    LICENSE_SERVER_CERTIFICATE_ERROR: string;
    BUFFER_APPEND_ERROR: string;
    BUFFER_FULL_ERROR: string;
    BUFFER_TYPE_UNKNOWN: string;
    MEDIA_ERR_BLOCKED_AUTOPLAY: string;
    MEDIA_ERR_PLAY_NOT_ALLOWED: string;
    MEDIA_ERR_NOT_LOADED_METADATA: string;
    MEDIA_ERR_ABORTED: string;
    MEDIA_ERR_NETWORK: string;
    MEDIA_ERR_DECODE: string;
    MEDIA_ERR_SRC_NOT_SUPPORTED: string;
    MEDIA_ERR_UNKNOWN: string;
    MEDIA_SOURCE_NOT_SUPPORTED: string;
    MEDIA_KEYS_NOT_SUPPORTED: string;
};
export { ErrorTypes, RequestErrorTypes, ErrorCodes, };
