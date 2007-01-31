/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright 2007 Wyona AG Zurich
 *
 * This file is part of Yulup.
 *
 * Yulup is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Yulup is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Yulup; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * ***** END LICENSE BLOCK *****
 */

/**
 * @author Andreas Wuest
 *
 */

var WebDAVService = {
    /**
     * Retrieve WebDAV properties via a WebDAV PROPFIND.
     *
     * @param  {String}    aURI                     the target URI of the PROPFIND request
     * @param  {String}    aDepth                   the depth of the PROPFIND request (allowed values are "0", "1", "infinity", or null)
     * @param  {Function}  aCallbackFunction        the function to call when the load has finished of type function(String aDocumentData, Number aResponseStatusCode, Object aContext, Array aResponseHeaders, Error aException)
     * @param  {Object}    aContext                 a context, or null if unused by the caller
     * @param  {Object}    aProgressListener        an object which can receive progress notifications
     * @return {Undefined} does not have a return value
     * @throws {YulupException}
     */
    propfind: function (aURI, aDepth, aCallbackFunction, aContext, aProgressListener) {
        var headerArray = null;
        var context     = null;

        /* DEBUG */ dump("Yulup:webdavservice.js:WebDAVService.propfind(\"" + aURI + "\", \"" + /*aCallbackFunction +*/ "\", \"" + /*aContext +*/ "\", \"" + aProgressListener + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI                     != null);
        /* DEBUG */ YulupDebug.ASSERT(aCallbackFunction        != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aCallbackFunction)        == "function");

        if (aDepth) {
            // add Depth header
            headerArray = [["Depth", aDepth]];
        }

        context = {
            originalContext : aContext,
            callbackFunction: aCallbackFunction
        };

        NetworkService.httpRequestPROPFIND(aURI, headerArray, this.__requestFinishedHandler, context, false, true, aProgressListener);
    },

    __requestFinishedHandler: function (aDocumentData, aResponseStatusCode, aContext, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:webdavservice.js:WebDAVService.__requestFinishedHandler(\"" + aDocumentData + "\", \"" + aResponseStatusCode + "\", \"" + aContext + "\", \"" + aResponseHeaders + "\", \"" + aException + "\") invoked\n");

        aContext.callbackFunction(aDocumentData, aResponseStatusCode, aContext.originalContext, aResponseHeaders, aException);
    }
}
