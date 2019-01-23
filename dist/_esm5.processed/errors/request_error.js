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
/**
 * Errors linked to the XHR implentation done in the RxPlayer.
 *
 * @class RequestError
 * @extends Error
 */
var RequestError = /** @class */ (function (_super) {
    __extends(RequestError, _super);
    /**
     * @param {XMLHttpRequest} xhr
     * @param {string} url
     * @param {string} type
     */
    function RequestError(xhr, url, type) {
        var _this = _super.call(this) || this;
        // @see https://stackoverflow.com/questions/41102060/typescript-extending-error-class
        Object.setPrototypeOf(_this, RequestError.prototype);
        _this.name = "RequestError";
        _this.url = url;
        _this.xhr = xhr;
        _this.status = xhr.status;
        _this.type = type;
        _this.message = type;
        return _this;
    }
    return RequestError;
}(Error));
export default RequestError;
