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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { ErrorCodes, ErrorTypes, RequestErrorTypes, } from "./error_codes";
import errorMessage from "./error_message";
/**
 * Error linked to network interactions (requests).
 *
 * @class NetworkError
 * @extends Error
 */
var NetworkError = /** @class */ (function (_super) {
    __extends(NetworkError, _super);
    /**
     * @param {string} code
     * @param {Error} requestError
     * @param {Boolean} fatal
     */
    function NetworkError(code, requestError, fatal) {
        var _this = _super.call(this) || this;
        // @see https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        Object.setPrototypeOf(_this, NetworkError.prototype);
        _this.name = "NetworkError";
        _this.type = ErrorTypes.NETWORK_ERROR;
        _this.xhr = requestError.xhr;
        _this.url = requestError.url;
        _this.status = requestError.status;
        _this.errorType = requestError.type;
        _this.code = ErrorCodes.hasOwnProperty(code) ?
            ErrorCodes[code] : "";
        _this.fatal = !!fatal;
        _this.message = errorMessage(_this.name, _this.code, requestError.message);
        return _this;
    }
    /**
     * Returns true if the NetworkError is due to the given http error code
     * @param {number} httpErrorCode
     * @returns {Boolean}
     */
    NetworkError.prototype.isHttpError = function (httpErrorCode) {
        return (this.errorType === RequestErrorTypes.ERROR_HTTP_CODE &&
            this.status === httpErrorCode);
    };
    return NetworkError;
}(Error));
export default NetworkError;
