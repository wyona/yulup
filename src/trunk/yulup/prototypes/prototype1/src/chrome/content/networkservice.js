/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright 2006 Wyona AG Zurich
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

// See "DAV: bind" at http://greenbytes.de/tech/webdav/draft-ietf-webdav-bind-14.html#rfc.section.7.1
const SUPPORTED_NEUTRON_VERSIONS =  "1.0-dev";
// See WWW-Authenticate at http://www.ietf.org/rfc/rfc2617.txt
// See Authorization at http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html
const SUPPORTED_AUTHENTICATION_SCHEMES =  "Neutron-Auth";

var NetworkService = {
    /**
     * Perform a file download over HTTP.
     *
     * @param  {String}    aURI                  the URI of the file to download
     * @param  {nsIFile}   aFile                 the file where the downloaded data gets written
     * @param  {Function}  aCallbackFunction     the function to call when the load has finished of type function(String aDocumentData, Number aResponseStatusCode, Object aContext, Array aResponseHeaders, Error aException)
     * @param  {Object}    aContext              a context, or null if unused by the caller
     * @param  {Boolean}   aHandleAuthentication set to true if authenciation should be handled automatically upon a 401 response, or if the response should simply be passed back to the caller as other responses
     * @return {Undefined} does not have a return value
     */
    httpFetchToFile: function(aURI, aFile, aCallbackFunction, aContext, aHandleAuthentication) {
        var downloader       = null;
        var downloadObserver = null;
        var channel          = null;
        var ioService        = null;
        var request          = null;

        /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.httpFetchToFile(\"" + aURI + "\", \"" + aFile + "\", \"" + /*aCallbackFunction +*/ "\", \"" + /*aContext +*/ "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI                  != null);
        /* DEBUG */ YulupDebug.ASSERT(aFile                 != null);
        /* DEBUG */ YulupDebug.ASSERT(aCallbackFunction     != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aCallbackFunction)     == "function");
        /* DEBUG */ YulupDebug.ASSERT(aHandleAuthentication != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aHandleAuthentication) == "boolean");

        ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

        channel = ioService.newChannel(aURI, "", null);

        // install the notification callback handler
        channel.notificationCallbacks = new ChannelNotificationCallback();

        request = new HTTPRequestFetchToFile(aURI, aFile, aCallbackFunction, aContext, aHandleAuthentication);

        try {
            channel.QueryInterface(Components.interfaces.nsIHttpChannel);
            channel.requestMethod = "GET";
            channel.setRequestHeader("Neutron", SUPPORTED_NEUTRON_VERSIONS, false);
            channel.setRequestHeader("WWW-Authenticate", SUPPORTED_AUTHENTICATION_SCHEMES, false);
        } catch (exception) {
            // if we're loading a local file, we don't have a nsIHttpChannel
        }

        downloadObserver = new DownloadObserver(request, channel);

        downloader = Components.classes["@mozilla.org/network/downloader;1"].createInstance();
        downloader.QueryInterface(Components.interfaces.nsIDownloader);
        downloader.init(downloadObserver, aFile);

        channel.asyncOpen(downloader, aFile);
    },

    /**
     * Perform a file upload over HTTP
     *
     * @param  {String}       aURI                     the target URI of the upload request
     * @param  {nsILocalFile} aFile                    the file to upload
     * @param  {Array}        aHeaderArray             a two-dimensional array, the first dimension containing the header the arrays, the second dimension containing the header name as a string in field 0, and the header value as a string in field 1
     * @param  {String}       aContentType             the content type of the data
     * @param  {Function}     aCallbackFunction        the function to call when the load has finished of type function(String aDocumentData, Number aResponseStatusCode, Object aContext, Array aResponseHeaders, Error aException)
     * @param  {Object}       aContext                 a context, or null if unused by the caller
     * @param  {Boolean}      aRetrieveResponseHeaders set to true if the response headers should be passed to the callback, false otherwise
     * @param  {Boolean}      aHandleAuthentication    set to true if authenciation should be handled automatically upon a 401 response, or if the response should simply be passed back to the caller as other responses
     * @param  {Object}       aProgressListener        an object which can receive progress notifications
     * @return {Undefined} does not have a return value
     * @throws {YulupException}
     */
    httpRequestUploadFile: function (aURI, aFile, aHeaderArray, aContentType, aCallbackFunction, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener) {
        var request             = null;
        var fileInputStream     = null;
        var bufferedInputStream = null;
        var ioService           = null;
        var channel             = null;
        var streamListener      = null;

        /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.httpRequestUploadFile(\"" + aURI + "\", \"" + aFile + "\", \"" + aHeaderArray + "\", \"" + aContentType + "\", \"" + /*aCallbackFunction +*/ "\", \"" + /*aContext +*/ "\", \"" + aRetrieveResponseHeaders + "\", \"" + aHandleAuthentication + "\", \"" + aProgressListener + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI                     != null);
        /* DEBUG */ YulupDebug.ASSERT(aFile                    != null);
        /* DEBUG */ YulupDebug.ASSERT(aContentType             != null);
        /* DEBUG */ YulupDebug.ASSERT(aCallbackFunction        != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aCallbackFunction)        == "function");
        /* DEBUG */ YulupDebug.ASSERT(aRetrieveResponseHeaders != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRetrieveResponseHeaders) == "boolean");
        /* DEBUG */ YulupDebug.ASSERT(aHandleAuthentication    != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aHandleAuthentication)    == "boolean");

        request = new HTTPRequestUploadFile(aURI, aFile, aHeaderArray, aContentType, aCallbackFunction, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener);

        try {
            fileInputStream     = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
            fileInputStream.init(aFile, PR_RDONLY, -1, Components.interfaces.nsIFileInputStream.CLOSE_ON_EOF);

            bufferedInputStream = Components.classes["@mozilla.org/network/buffered-input-stream;1"].createInstance(Components.interfaces.nsIBufferedInputStream);
            bufferedInputStream.init(fileInputStream, 1024);

            ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

            channel = ioService.newChannelFromURI(ioService.newURI(aURI, null, null));

            // install the notification callback handler
            channel.notificationCallbacks = new ChannelNotificationCallback(aProgressListener);

            channel.QueryInterface(Components.interfaces.nsIUploadChannel);
            channel.setUploadStream(bufferedInputStream, aContentType, -1);

            channel.QueryInterface(Components.interfaces.nsIHttpChannel);
            channel.setRequestHeader("Neutron", SUPPORTED_NEUTRON_VERSIONS, false);
            channel.setRequestHeader("WWW-Authenticate", SUPPORTED_AUTHENTICATION_SCHEMES, false);

            if (aHeaderArray) {
                for (var i = 0; i < aHeaderArray.length; i++) {
                    channel.setRequestHeader(aHeaderArray[i][0], aHeaderArray[i][1], false);
                }
            }

            channel.requestMethod = "PUT";

            streamListener = new StreamListener(request, channel);

            channel.asyncOpen(streamListener, null);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:networkservice.js:NetworkService.httpRequestUploadFile", exception);
            Components.utils.reportError(exception);

            throw new YulupException("Yulup:networkservice.js:NetworkService.httpRequestUploadFile: unable to upload file \"" + aFileURI + "\" to \"" + aURI + "\". \"" + exception + "\".");
        }
    },

    /**
     * Perform an HTTP GET request.
     *
     * @param  {String}    aURI                     the target URI of the GET request
     * @param  {Array}     aHeaderArray             a two-dimensional array, the first dimension containing the header the arrays, the second dimension containing the header name as a string in field 0, and the header value as a string in field 1
     * @param  {Function}  aCallbackFunction        the function to call when the load has finished of type function(String aDocumentData, Number aResponseStatusCode, Object aContext, Array aResponseHeaders, Error aException)
     * @param  {Object}    aContext                 a context, or null if unused by the caller
     * @param  {Boolean}   aRetrieveResponseHeaders set to true if the response headers should be passed to the callback, false otherwise
     * @param  {Boolean}   aHandleAuthentication    set to true if authenciation should be handled automatically upon a 401 response, or if the response should simply be passed back to the caller as other responses
     * @param  {Object}    aProgressListener        an object which can receive progress notifications
     * @return {Undefined} does not have a return value
     * @throws {YulupException}
     */
    httpRequestGET: function (aURI, aHeaderArray, aCallbackFunction, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener) {
        var request        = null;
        var ioService      = null;
        var channel        = null;
        var streamListener = null;

        /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.httpRequestGET(\"" + aURI + "\", \"" + aHeaderArray + "\", \"" + /*aCallbackFunction +*/ "\", \"" + /*aContext +*/ "\", \"" + aRetrieveResponseHeaders + "\", \"" + aHandleAuthentication + "\", \"" + aProgressListener + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI                     != null);
        /* DEBUG */ YulupDebug.ASSERT(aCallbackFunction        != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aCallbackFunction)        == "function");
        /* DEBUG */ YulupDebug.ASSERT(aRetrieveResponseHeaders != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRetrieveResponseHeaders) == "boolean");
        /* DEBUG */ YulupDebug.ASSERT(aHandleAuthentication    != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aHandleAuthentication)    == "boolean");

        request = new HTTPRequestGET(aURI, aHeaderArray, aCallbackFunction, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener);

        try {
            ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

            channel = ioService.newChannelFromURI(ioService.newURI(aURI, null, null));

            // install the notification callback handler
            channel.notificationCallbacks = new ChannelNotificationCallback(aProgressListener);

            try {
                channel.QueryInterface(Components.interfaces.nsIHttpChannel);
                channel.setRequestHeader("Neutron", SUPPORTED_NEUTRON_VERSIONS, false);
                channel.setRequestHeader("WWW-Authenticate", SUPPORTED_AUTHENTICATION_SCHEMES, false);

                if (aHeaderArray) {
                    for (var i = 0; i < aHeaderArray.length; i++) {
                        channel.setRequestHeader(aHeaderArray[i][0], aHeaderArray[i][1], false);
                    }
                }
            } catch (exception) {
                // if we're loading a local file, we don't have a nsIHttpChannel
            }

            channel.QueryInterface(Components.interfaces.nsIRequest);
            // don't use a cached version of the document
            channel.loadFlags  = Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
            // don't notify nsIProgressEventSink listeners (keeps the throbber from turning)
            channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BACKGROUND;

            streamListener = new StreamListener(request, channel);

            channel.asyncOpen(streamListener, null);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:networkservice.js:NetworkService.httpRequestGET", exception);
            Components.utils.reportError(exception);

            throw new YulupException("Yulup:networkservice.js:NetworkService.httpRequestGET: unable to load \"" + aURI + "\". \"" + exception + "\".");
        }
    },

    /**
     * Perform an HTTP PUT request.
     *
     * @param  {String}    aURI                     the target URI of the PUT request
     * @param  {Array}     aHeaderArray             a two-dimensional array, the first dimension containing the header the arrays, the second dimension containing the header name as a string in field 0, and the header value as a string in field 1
     * @param  {String}    aDocumentData            the data to PUT
     * @param  {String}    aContentType             the content type of the data
     * @param  {Function}  aCallbackFunction        the function to call when the upload has finished of type function(String aDocumentData, Number aResponseStatusCode, Object aContext, Array aResponseHeaders, Error aException)
     * @param  {Object}    aContext                 a context, or null if unused by the caller
     * @param  {Boolean}   aRetrieveResponseHeaders set to true if the response headers should be passed to the callback, false otherwise
     * @param  {Boolean}   aHandleAuthentication    set to true if authenciation should be handled automatically upon a 401 response, or if the response should simply be passed back to the caller as other responses
     * @param  {Object}    aProgressListener        an object which can receive progress notifications
     * @return {Undefined} does not have a return value
     * @throws {YulupException}
     */
    httpRequestPUT: function (aURI, aHeaderArray, aDocumentData, aContentType, aCallbackFunction, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener) {
        var request = null;

        /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.httpRequestPUT(\"" + aURI + "\", \"" + aHeaderArray + "\", \"" + /*aDocumentData +*/ "\", \"" + aContentType + "\", \"" + /*aCallbackFunction +*/ "\", \"" + /*aContext +*/ "\", \"" + aRetrieveResponseHeaders + "\", \"" + aHandleAuthentication + "\", \"" + aProgressListener + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI                     != null);
        /* DEBUG */ YulupDebug.ASSERT(aDocumentData            != null);
        /* DEBUG */ YulupDebug.ASSERT(aContentType             != null);
        /* DEBUG */ YulupDebug.ASSERT(aCallbackFunction        != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aCallbackFunction)        == "function");
        /* DEBUG */ YulupDebug.ASSERT(aRetrieveResponseHeaders != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRetrieveResponseHeaders) == "boolean");
        /* DEBUG */ YulupDebug.ASSERT(aHandleAuthentication    != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aHandleAuthentication)    == "boolean");

        request = new HTTPRequestPUT(aURI, aHeaderArray, aDocumentData, aContentType, aCallbackFunction, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener);

        try {
            NetworkService.__httpRequestPUTPOST(request, "PUT");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:networkservice.js:NetworkService.httpRequestPUT", exception);
            Components.utils.reportError(exception);

            throw new YulupException("Yulup:networkservice.js:NetworkService.httpRequestPUT: unable to load \"" + aURI + "\". \"" + exception + "\".");
        }
    },

    /**
     * Perform an HTTP POST request.
     *
     * @param  {String}    aURI                     the target URI of the POST request
     * @param  {Array}     aHeaderArray             a two-dimensional array, the first dimension containing the header the arrays, the second dimension containing the header name as a string in field 0, and the header value as a string in field 1
     * @param  {String}    aDocumentData            the data to POST
     * @param  {String}    aContentType             the content type of the data
     * @param  {Function}  aCallbackFunction        the function to call when the upload has finished of type function(String aDocumentData, Number aResponseStatusCode, Object aContext, Array aResponseHeaders, Error aException)
     * @param  {Object}    aContext                 a context, or null if unused by the caller
     * @param  {Boolean}   aRetrieveResponseHeaders set to true if the response headers should be passed to the callback, false otherwise
     * @param  {Boolean}   aHandleAuthentication    set to true if authenciation should be handled automatically upon a 401 response, or if the response should simply be passed back to the caller as other responses
     * @param  {Object}    aProgressListener        an object which can receive progress notifications
     * @return {Undefined} does not have a return value
     * @throws {YulupException}
     */
    httpRequestPOST: function (aURI, aHeaderArray, aDocumentData, aContentType, aCallbackFunction, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener) {
        var request = null;

        /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.httpRequestPOST(\"" + aURI + "\", \"" + aHeaderArray + "\", \"" + /*aDocumentData +*/ "\", \"" + aContentType + "\", \"" + /*aCallbackFunction +*/ "\", \"" + /*aContext +*/ "\", \"" + aRetrieveResponseHeaders + "\", \"" + aHandleAuthentication + "\", \"" + aProgressListener + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI                     != null);
        /* DEBUG */ YulupDebug.ASSERT(aDocumentData            != null);
        /* DEBUG */ YulupDebug.ASSERT(aContentType             != null);
        /* DEBUG */ YulupDebug.ASSERT(aCallbackFunction        != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aCallbackFunction)        == "function");
        /* DEBUG */ YulupDebug.ASSERT(aRetrieveResponseHeaders != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRetrieveResponseHeaders) == "boolean");
        /* DEBUG */ YulupDebug.ASSERT(aHandleAuthentication    != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aHandleAuthentication)    == "boolean");

        request = new HTTPRequestPOST(aURI, aHeaderArray, aDocumentData, aContentType, aCallbackFunction, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener);

        try {
            NetworkService.__httpRequestPUTPOST(request, "POST");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:networkservice.js:NetworkService.httpRequestPOST", exception);
            Components.utils.reportError(exception);

            throw new YulupException("Yulup:networkservice.js:NetworkService.httpRequestPOST: unable to load \"" + aURI + "\". \"" + exception + "\".");
        }
    },

    /**
     * Perform an HTTP PUT or POST request.
     *
     * Note that this is an internal helper function, and should never
     * be called from someone else than httpRequestPUT() and
     * httpRequestPOST().
     *
     * Also note that errors produced by the implementation are not
     * handled here. Instead, httpRequestPUT() and httpRequestPOST()
     * are expected to handle those.
     *
     * @param  {HTTPRequest} aRequest       the request to perform
     * @param  {String}      aRequestMethod the request method, either "PUT" or "POST"
     * @return {Undefined} does not have a return value
     * @throws {YulupException}
     */
    __httpRequestPUTPOST: function (aRequest, aRequestMethod) {
        var ioService         = null;
        var channel           = null;
        var streamListener    = null;
        var stringInputStream = null;
        var unicodeConverter  = null;
        var documentDataUTF8  = null;

        /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.__httpRequestPUTPOST(\"" + aRequest + "\", \"" + aRequestMethod + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aRequest       != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequest instanceof HTTPRequestPUT || aRequest instanceof HTTPRequestPOST);
        /* DEBUG */ YulupDebug.ASSERT(aRequestMethod != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestMethod == "PUT" || aRequestMethod == "POST");

        // make sure that aDocumentData != null, otherwise FF 1.5 crashes (see https://bugzilla.mozilla.org/show_bug.cgi?id=351418)
        if (aRequest.documentData) {
            stringInputStream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
            unicodeConverter  = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

            // convert to UTF-8
            unicodeConverter.charset = "UTF-8";
            documentDataUTF8 = unicodeConverter.ConvertFromUnicode(aRequest.documentData);

            stringInputStream.setData(documentDataUTF8, -1);

            ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

            channel = ioService.newChannelFromURI(ioService.newURI(aRequest.uri, null, null));

            // install the notification callback handler
            channel.notificationCallbacks = new ChannelNotificationCallback(aRequest.progressListener);

            channel.QueryInterface(Components.interfaces.nsIUploadChannel);
            channel.setUploadStream(stringInputStream, aRequest.contentType, -1);

            channel.QueryInterface(Components.interfaces.nsIHttpChannel);
            channel.setRequestHeader("Content-Type", aRequest.contentType + "; charset=UTF-8", false);
            channel.setRequestHeader("Neutron", SUPPORTED_NEUTRON_VERSIONS, false);
            channel.setRequestHeader("WWW-Authenticate", SUPPORTED_AUTHENTICATION_SCHEMES, false);

            if (aRequest.headerArray) {
                for (var i = 0; i < aRequest.headerArray.length; i++) {
                    channel.setRequestHeader(aRequest.headerArray[i][0], aRequest.headerArray[i][1], false);
                }
            }

            channel.requestMethod = aRequestMethod;

            streamListener = new StreamListener(aRequest, channel);

            channel.asyncOpen(streamListener, null);
        } else {
            throw new YulupException("Yulup:networkservice.js:NetworkService.__httpRequestPUTPOST: aDocumentData must not be null.");
        }
    },

    /**
     * Perform an HTTP DELETE request.
     *
     * @param  {String}    aURI                     the target URI of the DELETE request
     * @param  {Array}     aHeaderArray             a two-dimensional array, the first dimension containing the header the arrays, the second dimension containing the header name as a string in field 0, and the header value as a string in field 1
     * @param  {Function}  aCallbackFunction        the function to call when the delete has finished of type function(String aDocumentData, Number aResponseStatusCode, Object aContext, Array aResponseHeaders, Error aException)
     * @param  {Object}    aContext                 a context, or null if unused by the caller
     * @param  {Boolean}   aRetrieveResponseHeaders set to true if the response headers should be passed to the callback, false otherwise
     * @param  {Boolean}   aHandleAuthentication    set to true if authenciation should be handled automatically upon a 401 response, or if the response should simply be passed back to the caller as other responses
     * @param  {Object}    aProgressListener        an object which can receive progress notifications
     * @return {Undefined} does not have a return value
     * @throws {YulupException}
     */
    httpRequestDELETE: function (aURI, aHeaderArray, aCallbackFunction, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener) {
        var request           = null;
        var ioService         = null;
        var channel           = null;
        var streamListener    = null;

        /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.httpRequestDELETE(\"" + aURI + "\", \"" + aHeaderArray + "\", \"" + /*aCallbackFunction +*/ "\", \"" + /*aContext +*/ "\", \"" + aRetrieveResponseHeaders + "\", \"" + aHandleAuthentication + "\", \"" + aProgressListener + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI                     != null);
        /* DEBUG */ YulupDebug.ASSERT(aCallbackFunction        != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aCallbackFunction)        == "function");
        /* DEBUG */ YulupDebug.ASSERT(aRetrieveResponseHeaders != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRetrieveResponseHeaders) == "boolean");
        /* DEBUG */ YulupDebug.ASSERT(aHandleAuthentication    != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aHandleAuthentication)    == "boolean");

        request = new HTTPRequestDELETE(aURI, aHeaderArray, aCallbackFunction, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener);

        try {
            ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

            channel = ioService.newChannelFromURI(ioService.newURI(aURI, null, null));

            // install the notification callback handler
            channel.notificationCallbacks = new ChannelNotificationCallback(aProgressListener);

            channel.QueryInterface(Components.interfaces.nsIHttpChannel);
            channel.setRequestHeader("Neutron", SUPPORTED_NEUTRON_VERSIONS, false);
            channel.setRequestHeader("WWW-Authenticate", SUPPORTED_AUTHENTICATION_SCHEMES, false);

            if (aHeaderArray) {
                for (var i = 0; i < aHeaderArray.length; i++) {
                    channel.setRequestHeader(aHeaderArray[i][0], aHeaderArray[i][1], false);
                }
            }

            channel.requestMethod = "DELETE";

            streamListener = new StreamListener(request, channel);

            channel.asyncOpen(streamListener, null);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:networkservice.js:NetworkService.httpRequestDELETE", exception);
            Components.utils.reportError(exception);

            throw new YulupException("Yulup:networkservice.js:NetworkService.httpRequestDELETE: unable to delete \"" + aURI + "\". \"" + exception + "\".");
        }
    },

    /**
     * Perform an HTTP request specified by the given
     * request object.
     *
     * @param  {HTTPRequest} aRequest the request to perform
     * @return {Undefined} does not have a return value
     * @throws {YulupException}
     */
    performHTTPRequest: function (aRequest) {
        /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.performHTTPRequest(\"" + aRequest + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aRequest != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequest instanceof HTTPRequest);

        // dispatch request
        if (aRequest instanceof HTTPRequestGET) {
            NetworkService.httpRequestGET(aRequest.uri, aRequest.headerArray, aRequest.requestFinishedCallback, aRequest.context, aRequest.retrieveResponseHeaders, aRequest.handleAuthentication, aRequest.progressListener);
            return;
        }

        if (aRequest instanceof HTTPRequestPUT) {
            NetworkService.httpRequestPUT(aRequest.uri, aRequest.headerArray, aRequest.documentData, aRequest.contentType, aRequest.requestFinishedCallback, aRequest.context, aRequest.retrieveResponseHeaders, aRequest.handleAuthentication, aRequest.progressListener);
            return;
        }

        if (aRequest instanceof HTTPRequestPOST) {
            NetworkService.httpRequestPOST(aRequest.uri, aRequest.headerArray, aRequest.documentData, aRequest.contentType, aRequest.requestFinishedCallback, aRequest.context, aRequest.retrieveResponseHeaders, aRequest.handleAuthentication, aRequest.progressListener);
            return;
        }

        if (aRequest instanceof HTTPRequestDELETE) {
            NetworkService.httpRequestDELETE(aRequest.uri, aRequest.headerArray, aRequest.requestFinishedCallback, aRequest.context, aRequest.retrieveResponseHeaders, aRequest.handleAuthentication, aRequest.progressListener);
            return;
        }

        if (aRequest instanceof HTTPRequestFetchToFile) {
            NetworkService.httpFetchToFile(aRequest.uri, aRequest.file, aRequest.requestFinishedCallback, aRequest.context, aRequest.handleAuthentication);
            return;
        }

        if (aRequest instanceof HTTPRequestUploadFile) {
            NetworkService.httpFetchToFile(aRequest.uri, aRequest.file, aRequest.headerArray, aRequest.contentType, aRequest.requestFinishedCallback, aRequest.context, aRequest.retrieveResponseHeaders, aRequest.handleAuthentication, aRequest.progressListener);
            return;
        }

        throw new YulupException("Yulup:networkservice.js:NetworkService.performHTTPRequest: unknown request \"" + aRequest + "\".");
    },

    /**
     * Authenticate according to the given challenge.
     *
     * @param  {HTTPRequest} aRequest         the request which triggered this authentication request
     * @param  {Array}       aResponseHeaders the headers of the response which yielded a 401 Unauthorised response
     * @param  {String}      aDocumentData    the body of the response which yielded a 401 Unauthorised response
     * @param  {Boolean}     aFirstAttempt    is this the first authentication attempt in a logical transaction
     * @return {Undefined} does not have a return value
     * @throws {YulupException}
     */
    authenticate: function (aRequest, aResponseHeaders, aDocumentData, aFirstAttempt) {
        var authScheme      = null;
        var authSchemeIdent = null;

        /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.authenticate(\"" + aRequest + "\", \"" + aResponseHeaders + "\", \"" + aDocumentData + "\", \"" + aFirstAttempt + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aRequest         != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequest         instanceof HTTPRequest);
        /* DEBUG */ YulupDebug.ASSERT(aResponseHeaders != null);
        /* DEBUG */ YulupDebug.ASSERT(aFirstAttempt    != null);

        // check if the header fields could be accessed
        if (aResponseHeaders) {
            // check for availability of the WWW-Authenticate header field
            for (var i = 0; i < aResponseHeaders.length; i++) {
                if (aResponseHeaders[i].header == "WWW-Authenticate") {
                    authScheme = aResponseHeaders[i].value;
                    break;
                }
            }

            if (authScheme && authScheme != "") {
                /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.authenticate: server requested authentication scheme \"" + authScheme + "\"\n");

                // extract the scheme identifier
                authSchemeIdent = authScheme.split(" ", 1);

                switch (authSchemeIdent[0]) {
                    case "NEUTRON-AUTH":
                        /* DEBUG */ dump("Yulup:networkservice.js:NetworkService.authenticate: initiating NEUTRON-AUTH authentication\n");
                        NeutronAuth.authenticate(aDocumentData, aRequest, aFirstAttempt);
                        return;
                    case "Basic":
                    case "Digest":
                        throw new YulupException("Yulup:networkservice.js:NetworkService.authenticate: authentication aborted.");
                    default:
                        throw new YulupException("Yulup:networkservice.js:NetworkService.authenticate: unknown authentication scheme \"" + authScheme + "\".");
                }
            }
        }

        throw new YulupException("Yulup:networkservice.js:NetworkService.authenticate: could not initiate authentication.");
    }
};


/**
 * DownloadObserver constructor. Instantiates a new Object of the type DownloadObserver.
 *
 * Implements the nsIDownloadObserver interface.
 *
 * @constructor
 * @param  {HTTPRequestFetchToFile} aRequest the request with which this download observer is associated
 * @param  {nsIChannel}             aChannel the channel which originates the request
 * @return {DownloadObserver}
 */
function DownloadObserver(aRequest, aChannel) {

    /* DEBUG */ dump("Yulup:networkservice.js:DownloadObserver(\"" + aRequest + "\", \"" + aChannel + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aRequest != null);
    /* DEBUG */ YulupDebug.ASSERT(aRequest instanceof HTTPRequestFetchToFile);
    /* DEBUG */ YulupDebug.ASSERT(aChannel != null);

    this.request = aRequest;
    this.channel = aChannel;
}

DownloadObserver.prototype = {
    request: null,
    channel: null,

    /**
     * Download has completed.
     *
     * @param  {nsIDownloader} aDownloader
     * @param  {nsIRequest}    aRequest
     * @param  {nsISupports}   aContext
     * @param  {nsresult}      aStatusCode
     * @param  {nsIFile}       aResult
     * @return {Undefined} does not have a return value
     */
    onDownloadComplete: function (aDownloader, aRequest, aContext, aStatusCode, aResult) {
        var responseStatusCode    = null;
        var responseHeaderVisitor = null;
        var responseHeaders       = null;
        var fileURI               = null;
        var xmlDoc                = null;
        var location              = null;

        /* DEBUG */ dump("Yulup:networkservice.js:DownloadObserver.onDownloadComplete(\"" + aDownloader + "\", \"" + aRequest + "\", \"" + aContext + "\", \"" + aStatusCode + "\", \"" + aResult + "\") invoked\n");

        try {
            this.channel.QueryInterface(Components.interfaces.nsIHttpChannel);
            responseStatusCode = this.channel.responseStatus;
        } catch (exception) {
            // not a HTTP channel (e.g. when opening from local file)
            responseStatusCode = 200;
        }

        /* DEBUG */ dump("Yulup:networkservice.js:DownloadObserver.onDownloadComplete: status code = \"" + responseStatusCode + "\"\n");

        /* Retrieve HTTP response headers the response status is 301 and we therefore
         * have to retrieve the Location header, or the response status is 401 and we
         * do authentication. */
        if (responseStatusCode == 301 ||
            (responseStatusCode == 401 && this.request.handleAuthentication)) {
            try {
                this.channel.QueryInterface(Components.interfaces.nsIHttpChannel);

                responseHeaderVisitor = new HTTPResponseHeaderVisitor();
                this.channel.visitResponseHeaders(responseHeaderVisitor);

                responseHeaders = responseHeaderVisitor.headers;
            } catch (exception) {
                // not a HTTP channel or not ready
                responseHeaders = null;
            }
        }

        // check if request was successful
        if (Components.isSuccessCode(aStatusCode)) {
            switch (responseStatusCode) {
                case 301:
                    // moved permanently
                    if (responseHeaders) {
                        // check for availability of the Location header field
                        for (var i = 0; i < responseHeaders.length; i++) {
                            if (responseHeaders[i].header == "Location") {
                                location = responseHeaders[i].value;
                                break;
                            }
                        }
                    }

                    if (location && location != "") {
                        try {
                            // set new URI
                            this.request.uri = location;

                            // restart request
                            NetworkService.performHTTPRequest(this.request);
                        } catch (exception) {
                            // failed to restart request
                            this.request.requestFinishedCallback(null, responseStatusCode, this.request.context, exception);
                            return;
                        }
                    } else {
                        // no location header or no headers available at all; bail out
                        this.request.requestFinishedCallback(null, responseStatusCode, this.request.context, new YulupException("Yulup:networkservice.js:DownloadObserver.onDownloadComplete: request failed, return code is \"" + aStatusCode + "\""));
                        return;
                    }
                    break;

                case 401:
                    // unauthorized
                    if (this.request.handleAuthentication) {
                        /* DEBUG */ dump("Yulup:networkservice.js:DownloadObserver.onDownloadComplete: we have to authenticate\n");

                        // get an nsIURI object for the response file
                        fileURI = Components.classes["@mozilla.org/network/io-service;1"]. getService(Components.interfaces.nsIIOService).newFileURI(aResult);

                        xmlDoc = new XMLDocument(fileURI);
                        xmlDoc.loadDocument();

                        try {
                            NetworkService.authenticate(this.request, responseHeaders, xmlDoc.documentData, true);
                        } catch (exception) {
                            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:networkservice.js:DownloadObserver.onDownloadComplete", exception);
                            /* We should authenticate but the server did not tell us how, the
                             * headers were not accessible, or the specified authentication
                             * scheme is unknown. Bail out. */
                            this.request.requestFinishedCallback(null, responseStatusCode, this.request.context, exception);
                            return;
                        }
                    } else {
                        /* We received a 401, but the caller did not order us to authenticate,
                         * therefore he is expecting a potential authentication failure. */
                        this.request.requestFinishedCallback(aResult, responseStatusCode, this.request.context, null);
                        return;
                    }
                    break;

                default:
                    /* Everything went fine (even if we received 401, but the caller did not order
                     * us to authenticate, therefore he is expecting a potential authentication failure). */
                    this.request.requestFinishedCallback(aResult, responseStatusCode, this.request.context, null);
                    return;
            }
        } else {
            // request failed
            /* DEBUG */ dump("Yulup:networkservice.js:DownloadObserver.onDownloadComplete: load failed\n");

            this.request.requestFinishedCallback(null, responseStatusCode, this.request.context, new YulupException("Yulup:networkservice.js:DownloadObserver.onDownloadComplete: request failed, return code is \"" + aStatusCode + "\""));
            return;
        }
    }
};

/**
 * StreamListener constructor. Instantiates a new object of
 * type StreamListener.
 *
 * Note that this type implements the nsISupports, nsISupportsWeakReference,
 * nsIStreamListener, nsIRequestObserver and the nsIChannelEventSink
 * interfaces.
 *
 * @constructor
 * @param  {HTTPRequest}    aRequest the request with which this stream listener is associated
 * @param  {nsIChannel}     aChannel the channel which originates the request
 * @return {StreamListener}
 */
function StreamListener(aRequest, aChannel) {
    /* DEBUG */ dump("Yulup:networkservice.js:StreamListener(\"" + aRequest + "\", \"" + aChannel + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aRequest != null);
    /* DEBUG */ YulupDebug.ASSERT(aRequest instanceof HTTPRequest);
    /* DEBUG */ YulupDebug.ASSERT(aChannel != null);

    this.request = aRequest;
    this.channel = aChannel;
}

StreamListener.prototype = {
    request     : null,
    channel     : null,
    documentData: null,

    /**
     * The nsISupports QueryInterface method.
     */
    QueryInterface: function (aUUID) {
        /* DEBUG */ dump("Yulup:networkservice.js:StreamListener.QueryInterface(\"" + aUUID + "\") invoked\n");

        if (aUUID.equals(Components.interfaces.nsISupports) ||
            aUUID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aUUID.equals(Components.interfaces.nsIStreamListener) ||
            aUUID.equals(Components.interfaces.nsIRequestObserver) ||
            aUUID.equals(Components.interfaces.nsIChannelEventSink)) {
            return this;
        } else {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    /**
     * The nsISupportsWeakReference GetWeakReference() method.
     */
    GetWeakReference: function () {
        /* DEBUG */ dump("Yulup:networkservice.js:StreamListener.GetWeakReference() invoked\n");

        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    },

    /**
     * The nsIRequestObserver onStartRequest() method.
     *
     * Initialises the document data buffer.
     *
     * @param  {nsIRequest}  aRequest the request being observed
     * @param  {nsISupports} aContext the user defined context
     * @return {Undefined} does not have a return value
     */
    onStartRequest: function (aRequest, aContext) {
        /* DEBUG */ dump("Yulup:networkservice.js:StreamListener.onStartRequest(\"" + aRequest + "\", \"" + aContext + "\") invoked\n");

        this.documentData = "";
    },

    /**
     * The nsIRequestObserver onStopRequest() method.
     *
     * Checks the HTTP response status code and calls the
     * function defined by the callback field of the request
     * parameter as passed to the constructor. The callback is
     * also passed the aContext as specified by the constructor.
     *
     * @param  {nsIRequest}  aRequest the request being observed
     * @param  {nsISupports} aContext the user defined context
     * @param  {nsresult}    aStatusCode a return code
     * @return {Undefined} does not have a return value
     */
    onStopRequest: function (aRequest, aContext, aStatusCode) {
        var responseStatusCode    = null;
        var responseHeaderVisitor = null;
        var responseHeaders       = null;
        var unicodeConverter      = null;
        var unicodeDoc            = null;
        var location              = null;

        /* DEBUG */ dump("Yulup:networkservice.js:StreamListener.onStopRequest(\"" + aRequest + "\", \"" + aContext + "\", \"" + aStatusCode + "\") invoked\n");

        // retrieve HTTP response status code
        try {
            this.channel.QueryInterface(Components.interfaces.nsIHttpChannel);
            responseStatusCode = this.channel.responseStatus;
        } catch (exception) {
            // not a HTTP channel (e.g. when opening from local file)
            responseStatusCode = 200;
        }

        /* DEBUG */ dump("Yulup:networkservice.js:StreamListener.onStopRequest: status code = \"" + responseStatusCode + "\"\n");

        /* Retrieve HTTP response headers if the caller wants us to,
         * the response status is 301 and we therefore have to retrieve the
         * Location header, or the response status is 401 and we do authentication. */
        if (this.request.retrieveResponseHeaders ||
            responseStatusCode == 301            ||
            (responseStatusCode == 401 && this.request.handleAuthentication)) {
            try {
                this.channel.QueryInterface(Components.interfaces.nsIHttpChannel);

                responseHeaderVisitor = new HTTPResponseHeaderVisitor();
                this.channel.visitResponseHeaders(responseHeaderVisitor);

                responseHeaders = responseHeaderVisitor.headers;
            } catch (exception) {
                // not a HTTP channel or not ready
                responseHeaders = null;
            }
        }

        if (Components.isSuccessCode(aStatusCode)) {
            // request was successful
            try {
                unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

                unicodeConverter.charset = "UTF-8";
                unicodeDoc = unicodeConverter.ConvertToUnicode(this.documentData);
            } catch (exception) {
                // conversion failed; bail out
                if (this.request.progressListener)
                    this.request.progressListener.requestFinished();
                this.request.requestFinishedCallback(null, responseStatusCode, this.request.context, responseHeaders, exception);
                return;
            }

            /* DEBUG */ dump("Yulup:networkservice.js:StreamListener.onStopRequest: document data =\n" + unicodeDoc + "\n");

            switch (responseStatusCode) {
                case 301:
                    // moved permanently
                    if (responseHeaders) {
                        // check for availability of the Location header field
                        for (var i = 0; i < responseHeaders.length; i++) {
                            if (responseHeaders[i].header == "Location") {
                                location = responseHeaders[i].value;
                                break;
                            }
                        }
                    }

                    if (location && location != "") {
                        try {
                            // set new URI
                            this.request.uri = location;

                            // restart request
                            NetworkService.performHTTPRequest(this.request);
                        } catch (exception) {
                            // failed to restart request
                            if (this.request.progressListener)
                                this.request.progressListener.requestFinished();
                            this.request.requestFinishedCallback(null, responseStatusCode, this.request.context, responseHeaders, exception);
                            return;
                        }
                    } else {
                        // no location header or no headers available at all; bail out
                        if (this.request.progressListener)
                            this.request.progressListener.requestFinished();
                        this.request.requestFinishedCallback(null, responseStatusCode, this.request.context, responseHeaders, new YulupException("Yulup:networkservice.js:StreamListener.onStopRequest: request failed, return code is \"" + aStatusCode + "\""));
                        return;
                    }
                    break;

                case 401:
                    // unauthorized
                    if (this.request.handleAuthentication) {
                        /* DEBUG */ dump("Yulup:networkservice.js:StreamListener.onStopRequest: we have to authenticate\n");

                        try {
                            NetworkService.authenticate(this.request, responseHeaders, unicodeDoc, true);
                        } catch (exception) {
                            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:networkservice.js:StreamListener.onStopRequest", exception);
                            /* We should authenticate but the server did not tell us how, the
                             * headers were not accessible, or the specified authentication
                             * scheme is unknown. Bail out. */
                            if (this.request.progressListener)
                                this.request.progressListener.requestFinished();
                            this.request.requestFinishedCallback(null, responseStatusCode, this.request.context, responseHeaders, exception);
                            return;
                        }
                    } else {
                        /* We received a 401, but the caller did not order us to authenticate,
                         * therefore he is expecting a potential authentication failure. */
                        if (this.request.progressListener)
                            this.request.progressListener.requestFinished();
                        this.request.requestFinishedCallback(unicodeDoc, responseStatusCode, this.request.context, responseHeaders, null);
                        return;
                    }
                    break;

                default:
                    // everything went fine
                    if (this.request.progressListener)
                        this.request.progressListener.requestFinished();
                    this.request.requestFinishedCallback(unicodeDoc, responseStatusCode, this.request.context, responseHeaders, null);
                    return;
            }
        } else {
            // request failed
            /* DEBUG */ dump("Yulup:networkservice.js:StreamListener.onStopRequest: load failed\n");

            if (this.request.progressListener)
                this.request.progressListener.requestFinished();
            this.request.requestFinishedCallback(null, responseStatusCode, this.request.context, responseHeaders, new YulupException("Yulup:networkservice.js:StreamListener.onStopRequest: request failed, return code is \"" + aStatusCode + "\""));
            return;
        }
    },

    /**
     * The nsIStreamListener onDataAvailable() method.
     *
     * If data becomes available on the stream, copies this data
     * to the data buffer.
     *
     * @param  {nsIRequest}     aRequest     the request being observed
     * @param  {nsISupports}    aContext     the user defined context
     * @param  {nsIInputStream} aInputStream the input stream containing the chunk of data
     * @param  {Number}         aOffset      an offset into the stream, i.e. the current stream position
     * @param  {Number}         aCount       the number of bytes available in the stream
     * @return {Undefined} does not have a return value
     */
    onDataAvailable: function (aRequest, aContext, aInputStream, aOffset, aCount) {
        var scriptableInputStream = null;

        /* DEBUG */ dump("Yulup:networkservice.js:StreamListener.onDataAvailable(\"" + aRequest + "\", \"" + aContext + "\", \"" + aInputStream + "\", \"" + aOffset + "\", \"" + aCount + "\") invoked\n");

        scriptableInputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
        scriptableInputStream.init(aInputStream);

        // read aCount bytes from the stream
        this.documentData += scriptableInputStream.read(aCount);
    },

    /**
     * The nsIChannelEventSink onChannelRedirect() method.
     *
     * If the request was redirected, we are informed about the new channel.
     *
     * @param  {nsIChannel} aOldChannel the channel which is being redirected
     * @param  {nsIChannel} aNewChannel the channel to which we are redirected
     * @param  {Number}     aFlags      the type of redirect
     * @return {Undefined} does not have a return value
     */
    onChannelRedirect: function (aOldChannel, aNewChannel, aFlags) {
        /* DEBUG */ dump("Yulup:networkservice.js:StreamListener.onChannelRedirect(\"" + aOldChannel + "\", \"" + aNewChannel + "\", \"" + aFlags + "\") invoked\n");

        // make sure that this is something which belongs to our request
        if (this.channel == aOldChannel) {
            // if redirecting, store the new channel
            this.channel = aNewChannel;

            // make sure we have the notification callback handler installed in the new channel as well
            this.channel.notificationCallbacks = new ChannelNotificationCallback();
        }
    }
};


function ChannelNotificationCallback(aProgressListener) {
    /* DEBUG */ dump("Yulup:networkservice.js:ChannelNotificationCallback() invoked\n");

    this.__progressListener = aProgressListener;

    this.__authPrompter = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher).getNewAuthPrompter(null);
}

ChannelNotificationCallback.prototype = {
    __progressListener: null,
    __authPrompter    : null,

    /**
     * The nsISupports QueryInterface method.
     */
    QueryInterface: function (aUUID) {
        /* DEBUG */ dump("Yulup:networkservice.js:ChannelNotificationCallback.QueryInterface(\"" + aUUID + "\") invoked\n");

        if (aUUID.equals(Components.interfaces.nsISupports) ||
            aUUID.equals(Components.interfaces.nsIInterfaceRequestor) ||
            aUUID.equals(Components.interfaces.nsIProgressEventSink)) {
            return this;
        } else if (aUUID.equals(Components.interfaces.nsIAuthPrompt)) {
            return this.__authPrompter;
        } else {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    /**
     * The nsIInterfaceRequestor getInterface method.
     */
    getInterface: function (aUUID) {
        /* DEBUG */ dump("Yulup:networkservice.js:ChannelNotificationCallback.getInterface(\"" + aUUID + "\") invoked\n");

        try {
            return this.QueryInterface(aUUID);
        } catch (exception) {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    /**
     * The nsIProgressEventSink onProgress method.
     */
    onProgress: function (aRequest, aContext, aProgress, aProgressMax) {
        try {
            if (this.__progressListener)
                this.__progressListener.onProgress(aProgress, aProgressMax);
        } catch (exception) {
            // we don't want to fail here
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:networkservice.js:ChannelNotificationCallback.onProgress", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }
    },

    /**
     * The nsIProgressEventSink onStatus method.
     */
    onStatus: function (aRequest, aContext, aStatus, aStatusArg) {
        // not implemented
    }
};


/**
 * HTTPResponseHeaderVisitor constructor. Instantiates a new object of
 * type HTTPResponseHeaderVisitor.
 *
 * Contains an array of objects of type { header, value }, where
 * header is the name of the header and value its value. Access this
 * array via the headers member.
 *
 * Note that this type implements the nsIHttpHeaderVisitor interface.
 *
 * @constructor
 * @return {HTTPResponseHeaderVisitor}
 */
function HTTPResponseHeaderVisitor() {
    this.headers = new Array();
}

HTTPResponseHeaderVisitor.prototype = {
    headers: null,

    visitHeader: function (aHeaderName, aHeaderValue) {
        /* DEBUG */ dump("Yulup:networkservice.js:HTTPResponseHeaderVisitor.visitHeader(\"" + aHeaderName + "\", \"" + aHeaderValue + "\") invoked\n");
        this.headers.push({ header: aHeaderName, value: aHeaderValue });
    }
};


/**
 * The base class for all HTTP requests.
 *
 * Note that you must not instantiate this
 * class directly, but use the appropriate
 * subclass according to the request.
 *
 * @constructor
 * @param  {String}    aURI                     the target URI of the GET request
 * @param  {Function}  aRequestFinishedCallback the function to call when the load has finished of type function(String aDocumentData, Number aResponseStatusCode, Object aContext, Array aResponseHeaders, Error aException)
 * @param  {Object}    aContext                 a context, or null if unused by the caller
 * @param  {Boolean}   aHandleAuthentication    set to true if authenciation should be handled automatically upon a 401 response, or if the response should simply be passed back to the caller as other responses
 * @param  {Object}    aProgressListener        an object which can receive progress notifications
 * @return {HTTPRequest}
 */
function HTTPRequest(aURI, aRequestFinishedCallback, aContext, aHandleAuthentication, aProgressListener) {
    /* DEBUG */ YulupDebug.ASSERT(aURI                     != null);
    /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback != null);
    /* DEBUG */ YulupDebug.ASSERT(typeof(aRequestFinishedCallback) == "function");
    /* DEBUG */ YulupDebug.ASSERT(aHandleAuthentication    != null);
    /* DEBUG */ YulupDebug.ASSERT(typeof(aHandleAuthentication)    == "boolean");

    this.uri                     = aURI;
    this.requestFinishedCallback = aRequestFinishedCallback;
    this.context                 = aContext;
    this.handleAuthentication    = aHandleAuthentication;
    this.progressListener        = aProgressListener;
}

HTTPRequest.prototype = {
    uri                    : null,
    requestFinishedCallback: null,
    context                : null,
    handleAuthentication   : false,
    progressListener       : null
};


function HTTPRequestFetchToFile(aURI, aFile, aRequestFinishedCallback, aContext, aHandleAuthentication) {
    /* DEBUG */ YulupDebug.ASSERT(aFile != null);

    HTTPRequest.call(this, aURI, aRequestFinishedCallback, aContext, aHandleAuthentication, null);

    this.file = aFile;
}

HTTPRequestFetchToFile.prototype = {
    __proto__:  HTTPRequest.prototype,

    file: null
};


function HTTPRequestUploadFile(aURI, aFile, aHeaderArray, aContentType, aRequestFinishedCallback, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener) {
    /* DEBUG */ YulupDebug.ASSERT(aFile                            != null);
    /* DEBUG */ YulupDebug.ASSERT(aContentType                     != null);
    /* DEBUG */ YulupDebug.ASSERT(aRetrieveResponseHeaders         != null);
    /* DEBUG */ YulupDebug.ASSERT(typeof(aRetrieveResponseHeaders) == "boolean");

    HTTPRequest.call(this, aURI, aRequestFinishedCallback, aContext, aHandleAuthentication, aProgressListener);

    this.file                    = aFile;
    this.headerArray             = aHeaderArray;
    this.contentType             = aContentType;
    this.retrieveResponseHeaders = aRetrieveResponseHeaders;
}

HTTPRequestUploadFile.prototype = {
    __proto__:  HTTPRequest.prototype,

    file                   : null,
    headerArray            : null,
    contentType            : null,
    retrieveResponseHeaders: false
};


function HTTPRequestGET(aURI, aHeaderArray, aRequestFinishedCallback, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener) {
    /* DEBUG */ YulupDebug.ASSERT(aRetrieveResponseHeaders         != null);
    /* DEBUG */ YulupDebug.ASSERT(typeof(aRetrieveResponseHeaders) == "boolean");

    HTTPRequest.call(this, aURI, aRequestFinishedCallback, aContext, aHandleAuthentication, aProgressListener);

    this.headerArray             = aHeaderArray;
    this.retrieveResponseHeaders = aRetrieveResponseHeaders;
}

HTTPRequestGET.prototype = {
    __proto__:  HTTPRequest.prototype,

    headerArray            : null,
    retrieveResponseHeaders: false
};


function HTTPRequestPUT(aURI, aHeaderArray, aDocumentData, aContentType, aRequestFinishedCallback, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener) {
    /* DEBUG */ YulupDebug.ASSERT(aDocumentData                    != null);
    /* DEBUG */ YulupDebug.ASSERT(aContentType                     != null);
    /* DEBUG */ YulupDebug.ASSERT(aRetrieveResponseHeaders         != null);
    /* DEBUG */ YulupDebug.ASSERT(typeof(aRetrieveResponseHeaders) == "boolean");

    HTTPRequest.call(this, aURI, aRequestFinishedCallback, aContext, aHandleAuthentication, aProgressListener);

    this.headerArray             = aHeaderArray;
    this.documentData            = aDocumentData;
    this.contentType             = aContentType;
    this.retrieveResponseHeaders = aRetrieveResponseHeaders;
}

HTTPRequestPUT.prototype = {
    __proto__:  HTTPRequest.prototype,

    headerArray            : null,
    documentData           : null,
    contentType            : null,
    retrieveResponseHeaders: false
};


function HTTPRequestPOST(aURI, aHeaderArray, aDocumentData, aContentType, aRequestFinishedCallback, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener) {
    /* DEBUG */ YulupDebug.ASSERT(aDocumentData                    != null);
    /* DEBUG */ YulupDebug.ASSERT(aContentType                     != null);
    /* DEBUG */ YulupDebug.ASSERT(aRetrieveResponseHeaders         != null);
    /* DEBUG */ YulupDebug.ASSERT(typeof(aRetrieveResponseHeaders) == "boolean");

    HTTPRequest.call(this, aURI, aRequestFinishedCallback, aContext, aHandleAuthentication, aProgressListener);

    this.headerArray             = aHeaderArray;
    this.documentData            = aDocumentData;
    this.contentType             = aContentType;
    this.retrieveResponseHeaders = aRetrieveResponseHeaders;
}

HTTPRequestPOST.prototype = {
    __proto__:  HTTPRequest.prototype,

    headerArray            : null,
    documentData           : null,
    contentType            : null,
    retrieveResponseHeaders: false
};


function HTTPRequestDELETE(aURI, aHeaderArray, aRequestFinishedCallback, aContext, aRetrieveResponseHeaders, aHandleAuthentication, aProgressListener) {
    /* DEBUG */ YulupDebug.ASSERT(aRetrieveResponseHeaders         != null);
    /* DEBUG */ YulupDebug.ASSERT(typeof(aRetrieveResponseHeaders) == "boolean");

    HTTPRequest.call(this, aURI, aRequestFinishedCallback, aContext, aHandleAuthentication, aProgressListener);

    this.headerArray             = aHeaderArray;
    this.retrieveResponseHeaders = aRetrieveResponseHeaders;
}

HTTPRequestDELETE.prototype = {
    __proto__:  HTTPRequest.prototype,

    headerArray            : null,
    retrieveResponseHeaders: false
};
