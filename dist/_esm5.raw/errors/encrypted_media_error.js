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
import { ErrorCodes, ErrorTypes, } from "./error_codes";
import errorMessage from "./error_message";
/**
 * Error linked to the encryption of the media.
 *
 * @class EncryptedMediaError
 * @extends Error
 */
var EncryptedMediaError = /** @class */ (function (_super) {
    __extends(EncryptedMediaError, _super);
    /**
     * @param {string} code
     * @param {Object} [reason]
     * @Param {Boolean} [fatal]
     */
    function EncryptedMediaError(code, reason, fatal) {
        var _this = _super.call(this) || this;
        // @see https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        Object.setPrototypeOf(_this, EncryptedMediaError.prototype);
        _this.name = "EncryptedMediaError";
        _this.type = ErrorTypes.ENCRYPTED_MEDIA_ERROR;
        _this.reason = reason;
        _this.code = ErrorCodes.hasOwnProperty(code) ?
            ErrorCodes[code] : "";
        _this.fatal = !!fatal;
        _this.message = errorMessage(_this.name, _this.code, _this.reason);
        return _this;
    }
    return EncryptedMediaError;
}(Error));
export default EncryptedMediaError;
