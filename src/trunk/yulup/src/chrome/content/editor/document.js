/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright 2006-2007 Wyona AG Zurich
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

/**
 * Document constructor. Instantiates a new object of
 * type Document.
 *
 * Document is the base class of all documents. If you
 * want to instantiate a new document, always use the
 * type which fits your document best, and only use
 * Document if no other type fits.
 *
 * @constructor
 * @param  {nsIURI}   aLoadURI       the URI from which this document originates
 * @param  {String}   aContentType   the content type of the document, or null if unknown
 * @param  {String}   aScreenName    a description of the document to display e.g. in the window title, or null if unavailable
 * @param  {String}   aFileExtension the extension of the document file name, or null if unavailable
 * @param  {Array}    aSchemaArray   the URIs for schemas associated with this document
 * @param  {Array}    aStyleArray    the URIs for styles associated with this document
 * @param  {Object}   aStyleTemplate the style template associated with this document
 * @return {Document}
 */
function Document(aLoadURI, aContentType, aScreenName, aFileExtension, aSchemaArray, aStyleArray, aStyleTemplate) {
    var loadURL = null;
    var fileURL = null;

    /* DEBUG */ dump("Yulup:document.js:Document(\"" + aLoadURI + "\", \"" + aContentType + "\", \"" + aScreenName + "\", \"" + aFileExtension + "\", \"" + aSchemaArray + "\", \"" + aStyleArray + "\", \"" + aStyleTemplate + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aLoadURI     != null);
    /* DEBUG */ YulupDebug.ASSERT(aContentType != null);
    /* DEBUG */ YulupDebug.ASSERT(aStyleTemplate ? aStyleTemplate.mode != null : true);

    this.contentType = aContentType;

    if (aLoadURI) {
        this.loadURI = aLoadURI;

        loadURL = this.loadURI;
        loadURL.QueryInterface(Components.interfaces.nsIURL);
        this.documentBaseName  = loadURL.fileBaseName;
        this.documentExtension = loadURL.fileExtension;

        try {
            fileURL = this.loadURI.QueryInterface(Components.interfaces.nsIFileURL);

            this.localSavePath = fileURL.file.path;
        } catch (exception) {
            // not a local file, therefore ignore
        }
    }

    if (aScreenName && (aScreenName != ""))
        this.screenName = aScreenName;

    if (aFileExtension && (aFileExtension != ""))
        this.documentExtension = aFileExtension;

    if (aStyleArray || aSchemaArray) {
        this.documentAssociates = new DocumentAssociates(aStyleArray, aStyleTemplate, aSchemaArray);
        if (aStyleTemplate) {
          this.styleTemplateMode = aStyleTemplate.mode;
        }
    }
}

Document.prototype = {
    loadURI           : null,
    documentBaseName  : null,
    documentExtension : null,
    screenName        : null,
    localSavePath     : null,
    contentType       : null,
    documentAssociates: null,
    styleTemplateMode : null,

    /**
     * Get the loadURI.
     *
     * @return {nsIURI} returns the URI from which this document was loaded
     */
    getLoadURI: function () {
        return this.loadURI;
    },

    /**
     * Get the base URI of this document.
     *
     * Note that this currently returns the loadURI.
     *
     * @return {nsIURI} returns the base URI of this document
     */
    getBaseURI: function () {
        return this.loadURI;
    },

    /**
     * Get the basename of the document, i.e. the part of the
     * file name in front of the extension.
     *
     * @return {String} the basename of the file
     */
    getDocumentBaseName: function () {
        /* DEBUG */ dump("Yulup:document.js:Document.getDocumentBaseName() invoked\n");
        return this.documentBaseName;
    },

    /**
     * Get the extension of the document, i.e. the part of the
     * file name after the basename and the "." (sometimes also
     * called the filename suffix).
     *
     * @return {Sring} the file name extension
     */
    getDocumentExtension: function () {
        /* DEBUG */ dump("Yulup:document.js:Document.getDocumentExtension() invoked\n");
        return this.documentExtension;
    },

    /**
     * Get the document name, which is either null if not available,
     * the base name of the document if no extension is available,
     * or the base name concatenated with the extension, separated
     * by a dot (".").
     *
     * @return {String} the document name, or null if not available
     */
    getDocumentName: function () {
        /* DEBUG */ dump("Yulup:document.js:Document.getDocumentName() invoked\n");
        if (this.documentBaseName) {
            return (this.documentExtension ? this.documentBaseName + "." + this.documentExtension : this.documentBaseName);
        } else {
            return null;
        }
    },

    /**
     * Get the screen name of the document.
     *
     * @return {String} the document's screen name
     */
    getScreenName: function () {
        /* DEBUG */ dump("Yulup:document.js:Document.getScreenName() invoked\n");
        return (this.screenName ? this.screenName : this.getDocumentName());
    },

    /**
     * Set the local save path. The local save path is the path
     * which results from a "Save As..." operation to the local
     * filesystem.
     *
     * Note that the local save path must be in a platform-specific
     * format.
     *
     * @param  {String}    aLocalPath a local save path
     * @return {Undefined} does not have a return value
     */
    setLocalSavePath: function (aLocalPath) {
        /* DEBUG */ dump("Yulup:document.js:Document.setLocalSavePath(\"" + aLocalPath + "\") invoked\n");
        this.localSavePath = aLocalPath;
    },

    /**
     * Get the local save path.
     *
     * Note that the local save path is platform-specific.
     *
     * @return {String} the local platform-specific save path of this document, or null if unavailable
     */
    getLocalSavePath: function () {
        /* DEBUG */ dump("Yulup:document.js:Document.getLocalSavePath() invoked\n");
        return this.localSavePath;
    },

    /**
     * Get the content type of this document.
     *
     * @return {String} the content type of this document, or null if unavailable
     */
    getContentType: function () {
        /* DEBUG */ dump("Yulup:document.js:Document.getContentType() invoked\n");
        return this.contentType;
    },

    /**
     * Get the document associates.
     *
     * @return {DocumentAssociates} the document associates of this document, or null if unavailable
     */
    getAssociates: function () {
        return this.documentAssociates;
    },

    getStyleTemplateMode: function () {
        return this.styleTemplateMode;
    },


    /**
     * Determine if document has been instantiated with
     * XSLT knowledge.
     *
     * @return {Boolean} returns true if XSLT stylesheet(s) are associated with this document, false otherwise
     */
    hasStyles: function () {
        return (this.documentAssociates && this.documentAssociates.hasStyles());
    },


    /**
     * Determine if document has been instantiated with
     * style template knowledge.
     *
     * @return {Boolean} returns true if a style template is associated with this document, false otherwise
     */
    hasStyleTemplate: function () {
        return (this.documentAssociates && this.documentAssociates.hasStyleTemplate());
    },


    /**
     * Determine if document has been instantiated with
     * Schema knowledge.
     *
     * @return {Boolean} returns true if Schema(s) are associated with this document, false otherwise
     */
    hasSchemas: function () {
        return (this.documentAssociates && this.documentAssociates.hasSchemas());
    },

    /**
     * Determine if the content is of type HTML or XHTML.
     *
     * @return {Boolean} returns true if content is either HTML or XHTML, false otherwise
     */
    isContentHTML: function () {
        return (this.contentType == "text/html" || this.contentType == "application/xhtml+xml");
    },

    /**
     * Determine if the content is of type XML.
     *
     * @return {Boolean} returns true if content is of type XML, false otherwise
     */
    isContentXML: function () {
        return (this.contentType == "text/xml"              ||
                this.contentType == "application/xml"       ||
                this.contentType == "application/xhtml+xml" ||
                this.contentType == "application/atom+xml");
    },

    /**
     * Determine if this document can perform a "Save" operation on
     * the local file system. This is true if a local save path exists,
     * false otherwise.
     *
     * @return {Boolean} true if document can be saved locally, false otherwise
     */
    isSaveable: function () {
        /* DEBUG */ dump("Yulup:document.js:Document.isSaveable() invoked\n");
        return (this.localSavePath ? true : false);
    },

    /**
     * Retarget the document to a new location.
     *
     * @param  {nsIURI}    aURI the new URI of the document
     * @return {Undefined} does not have a return value
     */
    retargetTo: function (aURI) {
        /* DEBUG */ dump("Yulup:document.js:Document.retargetTo(\"" + aURI + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI != null);

        this.loadURI = aURI;

        aURI.QueryInterface(Components.interfaces.nsIURL);
        this.documentBaseName  = aURI.fileBaseName;
        this.documentExtension = aURI.fileExtension;
    },

    /**
     * Load the document from the aLoadURI as specified by the
     * Document constructor.
     *
     * @param  {Function}  aLoadFinishedCallback a callback handler which gets called when the load has finished
     * @return {Undefined} does not have a return value
     */
    loadDocument: function (aLoadFinishedCallback) {
        /* DEBUG */ dump("Yulup:document.js:Document.loadDocument() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aLoadFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aLoadFinishedCallback) == "function");

        NetworkService.httpRequestGET(this.loadURI.spec, null, this.__loadFinishedHandler, aLoadFinishedCallback, false, true);
    },

    /**
     * Upload the document to the target as specified by the aURI
     * in the constructor.
     *
     * @param  {String}    aDocumentData           the document data to upload
     * @param  {Function}  aUploadFinishedCallback the function to call when the upload has finished
     * @return {Undefined} does not have a return value
     */
    uploadDocument: function (aDocumentData, aUploadFinishedCallback) {
        /* DEBUG */ dump("Yulup:document.js:NeutronDocument.uploadDocument() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocumentData                   != null);
        /* DEBUG */ YulupDebug.ASSERT(aUploadFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aUploadFinishedCallback) == "function");

        NetworkService.httpRequestPUT(this.loadURI.spec, null, aDocumentData, this.contentType, this.__uploadFinishedHandler, aUploadFinishedCallback, false, true);
    },

    /**
     * Save the document to a file on the local filesystem.
     *
     * @param  {nsILocalFile} aLocalFile    a file descriptor
     * @param  {String}       aDocumentData the data to save
     * @return {Boolean}      return true on success, false otherwise
     */
    saveDocument: function (aLocalFile, aDocumentData) {
        var fileURI = null;

        /* DEBUG */ dump("Yulup:document.js:Document.saveDocument(\"" + aLocalFile + "\", \"" + aDocumentData + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocumentData != null);

        if (aLocalFile) {
            // we have a path, therefore persist the document
            if (PersistenceService.persistToFile(aLocalFile, aDocumentData)) {
                // create a nsIURI so we can easily retrieve the document name and the suffix
                fileURI  = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newFileURI(aLocalFile);

                // set the local platform-specific save path
                this.localSavePath = aLocalFile.path;

                // downcast to nsIURL
                fileURI.QueryInterface(Components.interfaces.nsIURL);

                // set the new document name and suffix
                this.documentBaseName  = fileURI.fileBaseName;
                this.documentExtension = fileURI.fileExtension;

                /* DEBUG */ dump("Yulup:document.js:Document.saveDocument: saving document to file \"" + aLocalFile.path + "\" succeeded.\n");
                return true;
            }
        }

        // user aborted or an error occurred during saving
        return false;
    },

    /**
     * The handler which gets called via a callback after a load has
     * finished.
     *
     * Calls aRequestFinishedCallback upon completion. If
     * the request succeeded, aRequestFinishedCallback(String, null)
     * is called (where String might be "" if the request was a
     * PUT or POST request). aRequestFinishedCallback(null, NeutronException)
     * if the server threw a Neutron exception during the request.
     * aRequestFinishedCallback(null, Error) if an internal error
     * occurred while fullfilling the request.
     *
     * Don't use "this" inside this method because the callback
     * will not provide a pointer to it. If you need "this", you
     * must wrap this handler in an anonymous function when you
     * pass it to httpRequestGET().
     *
     * @param  {String}   aDocumentData            the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Function} aRequestFinishedCallback a function with the signature function(String, Error)
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __loadFinishedHandler: function (aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:document.js:Document.__loadFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode              != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRequestFinishedCallback) == "function");

        if (aResponseStatusCode == 200) {
            // success, call back to original caller
            aRequestFinishedCallback(aDocumentData, null);
        } else {
            if (aException) {
                aRequestFinishedCallback(null, aException);
            } else {
                try {
                    // parse error message (throws an exeception)
                    Neutron.response(aDocumentData);
                } catch (exception) {
                    aRequestFinishedCallback(null, exception);
                    return;
                }
            }
        }
    },

    /**
     * The handler which gets called via a callback after an upload has
     * finished.
     *
     * Calls aRequestFinishedCallback upon completion. If
     * the request succeeded, aRequestFinishedCallback(String, null)
     * is called (where String might be "" if the request was a
     * PUT or POST request). aRequestFinishedCallback(null, NeutronException)
     * if the server threw a Neutron exception during the request.
     * aRequestFinishedCallback(null, Error) if an internal error
     * occurred while fullfilling the request.
     *
     * Don't use "this" inside this method because the callback
     * will not provide a pointer to it. If you need "this", you
     * must wrap this handler in an anonymous function when you
     * pass it to httpRequestGET().
     *
     * @param  {String}   aDocumentData            the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Function} aRequestFinishedCallback a function with the signature function(String, Error)
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __uploadFinishedHandler: function (aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:document.js:Document.__uploadFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode              != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRequestFinishedCallback) == "function");

        if (NetworkService.isStatusSuccess(aResponseStatusCode)) {
            // success, call back to original caller
            aRequestFinishedCallback(aDocumentData, null);
        } else {
            if (aException) {
                aRequestFinishedCallback(null, aException);
            } else {
                try {
                    // parse error message (throws an exeception)
                    Neutron.response(aDocumentData);
                } catch (exception) {
                    aRequestFinishedCallback(null, exception);
                    return;
                }
            }
        }
    }
};


/**
 * NeutronDocument constructor. Instantiates a new object of
 * type NeutronDocument.
 *
 * NeutronDocument should be used for documents which are
 * retrieved by the means of Neutron introspection.
 *
 * @constructor
 * @param  {nsIURI}          aLoadURI       the URI from which this document originates, as specified by the Neutron introspection
 * @param  {String}          aLoadMethod    the load method, as specified by the Neutron introspection (i.e. "GET", etc.)
 * @param  {nsIURI}          aUploadURI     the URI which should be used to store the document back to the server, as specified by the Neutron introspection
 * @param  {String}          aUploadMethod  the upload method, as specified by the Neutron introspection (i.e. "PUT", "POST", etc.)
 * @param  {nsIURI}          aUnlockURI     the URI which should be used to unlock the document
 * @param  {String}          aUnlockMethod  the unlock method, as specified by the Neutron introspection (i.e. "GET", etc.)
 * @param  {String}          aContentType   the content type of this document, as specified by the Neutron introspection
 * @param  {String}          aFragmentName  the name of the fragment to load, as specified by the Neutron introspection
 * @param  {Array}           aSchemaArray   the URIs for schemas associated with this document, as specified by the Neutron introspection
 * @param  {Array}           aStyleArray    the URIs for styles associated with this document, as specified by the Neutron introspection
 * @param  {Object}          aStyleTemplate the style template associated with this document, as specified by the Neutron introspection
 * @param  {String}          aLoadStyle     the load style used to load this document, i.e. either "open" or "checkout"
 * @return {NeutronDocument}
 */
function NeutronDocument(aLoadURI, aLoadMethod, aUploadURI, aUploadMethod, aUnlockURI, aUnlockMethod, aContentType, aFragmentName, aSchemaArray, aStyleArray, aStyleTemplate, aLoadStyle) {
    /* DEBUG */ dump("Yulup:document.js:NeutronDocument(\"" + aLoadURI + "\", \"" + aLoadMethod + "\", \"" + aUploadURI + "\", \"" + aUploadMethod + "\", \"" + aContentType + "\", \"" + aFragmentName + "\", \"" + aSchemaArray + "\", \"" + aStyleArray + "\", \"" + aStyleTemplate + "\", \"" + aLoadStyle + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aLoadURI      != null);
    /* DEBUG */ YulupDebug.ASSERT(aLoadMethod   != null);
    /* DEBUG */ YulupDebug.ASSERT(aUploadURI    != null);
    /* DEBUG */ YulupDebug.ASSERT(aUploadMethod != null);
    /* DEBUG */ YulupDebug.ASSERT(aContentType  != null);
    /* DEBUG */ YulupDebug.ASSERT(aFragmentName != null);
    /* DEBUG */ YulupDebug.ASSERT(aLoadStyle    != null);

    Document.call(this, aLoadURI, aContentType, aFragmentName, null, aSchemaArray, aStyleArray, aStyleTemplate);

    this.loadMethod     = aLoadMethod;
    this.uploadURI      = aUploadURI;
    this.uploadMethod   = aUploadMethod;
    this.__unlockURI    = aUnlockURI;
    this.__unlockMethod = aUnlockMethod;
    this.loadStyle      = aLoadStyle;

    if (this.loadStyle == "checkout")
        this.__locked = true;
}

NeutronDocument.prototype = {
    __proto__: Document.prototype,

    __locked: null,

    __unlockURI   : null,
    __unlockMethod: null,

    loadMethod: null,

    uploadURI   : null,
    uploadMethod: null,

    loadStyle   : null,
    acquiredLock: false,

    /**
     * Get the load method used to load this document.
     *
     * @return {String} either "open" or "checkout"
     */
    getLoadMethod: function () {
        return this.loadMethod;
    },

    /**
     * Get the URI which indicates where to upload this document
     * upon write-back time.
     *
     * @return {nsIURI} the URI of the upload target
     */
    getUploadURI: function () {
        return this.uploadURI;
    },

    /**
     * Get the method to use when uploading, i.e "PUT", "POST", etc.
     *
     * @return {String} the upload method
     */
    getUploadMethod: function () {
        return this.saveMethod;
    },

    /**
     * Indicates if a lock was acquired at document load. Returns true
     * if a lock was acquired, false otherwise.
     *
     * @return {Boolean} true if a lock was acquired for this document, false otherwise
     */
    getAcquiredLock: function () {
        return this.acquiredLock;
    },

    /**
     * Get the load style of this document, i.e. either "open" or
     * "checkout".
     *
     * @return {String} the document load style
     */
    getLoadStyle: function () {
        return this.loadStyle;
    },

    /**
     * Retarget the document to a new location.
     *
     * @param  {nsIURI}    aURI the new URI of the document
     * @return {Undefined} does not have a return value
     */
    retargetTo: function (aURI) {
        /* DEBUG */ dump("Yulup:document.js:NeutronDocument.retargetTo(\"" + aURI + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI != null);

        this.uploadURI  = aURI;
        this.saveMethod = "PUT";

        // call super method
        Document.prototype.retargetTo.call(this, aURI);
    },

    /**
     * Load the document from the source as specified by the aLoadURI
     * in the constructor.
     *
     * @param  {Function}  aLoadFinishedCallback the function to call when the load has finished
     * @return {Undefined} does not have a return value
     */
    loadDocument: function (aLoadFinishedCallback) {
        /* DEBUG */ dump("Yulup:document.js:NeutronDocument.loadDocument() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aLoadFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aLoadFinishedCallback) == "function");

        if (this.loadMethod == "GET") {
            // we have to proxy this request because it is a Neutron request, i.e. we have to deal with potential Neutron protocol exceptions
            NetworkService.httpRequestGET(this.loadURI.spec, null, this.__loadFinishedHandler, aLoadFinishedCallback, false, true);
        } else {
            // unknown request method
            throw new YulupEditorException("Yulup:document.js:NeutronDocument.loadDocument: request method \"" + this.uploadMethod + "\" unknown.");
        }
    },

    /**
     * Upload the document to the target as specified by the aUploadURI
     * in the constructor.
     *
     * @param  {String}    aDocumentData           the document data to upload
     * @param  {Function}  aUploadFinishedCallback the function to call when the upload has finished
     * @return {Undefined} does not have a return value
     */
    uploadDocument: function (aDocumentData, aUploadFinishedCallback) {
        var me = this;

        /* DEBUG */ dump("Yulup:document.js:NeutronDocument.uploadDocument() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocumentData                   != null);
        /* DEBUG */ YulupDebug.ASSERT(aUploadFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aUploadFinishedCallback) == "function");

        // we have to proxy this request because it is a Neutron request, i.e. we have to deal with potential Neutron protocol exceptions
        switch (this.uploadMethod) {
            case "PUT":
                NetworkService.httpRequestPUT(this.uploadURI.spec, null, aDocumentData, this.contentType,
                                              function(aFinishedDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
                                                  me.__uploadFinishedHandler(aFinishedDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException);
                                              }, aUploadFinishedCallback, false, true);
                break;
            case "POST":
                NetworkService.httpRequestPOST(this.uploadURI.spec, null, aDocumentData, this.contentType,
                                               function(aFinishedDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
                                                   me.__uploadFinishedHandler(aFinishedDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException);
                                               }, aUploadFinishedCallback, false, true);
                break;
            default:
                // unknown request method
                throw new YulupEditorException("Yulup:document.js:NeutronDocument.uploadDocument: request method \"" + this.uploadMethod + "\" unknown.");
        }
    },

    shutdown: function () {
        /* DEBUG */ dump("Yulup:document.js:NeutronDocument.shutdown() invoked\n");

        // if the document is locked, we have to unlock it now
        if (this.__locked && this.__unlockURI) {
            if (this.__unlockMethod == "GET") {
                // we have to proxy this request because it is a Neutron request, i.e. we have to deal with potential Neutron protocol exceptions
                NetworkService.httpRequestGET(this.__unlockURI.spec, null, this.__unlockFinishedHandler, null, false, true, null);
            } else {
                // unknown request method
                throw new YulupEditorException("Yulup:document.js:NeutronDocument.shutdown: request method \"" + this.__unlockMethod + "\" unknown.");
            }
        }
    },

    /**
     * Checks if the document needs to be unlocked.
     *
     * @return {String}  returns the URI to unlock the document with, or null if it is not in need of unlocking
     */
    shouldUnlock: function () {
        if (this.__locked && this.__unlockURI) {
            return this.__unlockURI.spec;
        } else {
            return null;
        }
    },

    /**
     * The handler which gets called via a callback after a load has
     * finished.
     *
     * Calls aRequestFinishedCallback upon completion. If
     * the request succeeded, aRequestFinishedCallback(String, null)
     * is called (where String might be "" if the request was a
     * PUT or POST request). aRequestFinishedCallback(null, NeutronException)
     * if the server threw a Neutron exception during the request.
     * aRequestFinishedCallback(null, Error) if an internal error
     * occurred while fullfilling the request.
     *
     * Don't use "this" inside this method because the callback
     * will not provide a pointer to it. If you need "this", you
     * must wrap this handler in an anonymous function when you
     * pass it to httpRequestGET().
     *
     * @param  {String}   aDocumentData            the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Function} aRequestFinishedCallback a function with the signature function(String, Error)
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __loadFinishedHandler: function (aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:document.js:NeutronDocument.__loadFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode              != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRequestFinishedCallback) == "function");

        if (aResponseStatusCode == 200) {
            // success, call back to original caller
            aRequestFinishedCallback(aDocumentData, null);
        } else {
            if (aException) {
                aRequestFinishedCallback(null, aException);
            } else {
                try {
                    // parse error message (throws an exeception)
                    Neutron.response(aDocumentData);
                } catch (exception) {
                    aRequestFinishedCallback(null, exception);
                    return;
                }
            }
        }
    },

    /**
     * The handler which gets called via a callback after an upload has
     * finished.
     *
     * Calls aRequestFinishedCallback upon completion. If
     * the request succeeded, aRequestFinishedCallback(String, null)
     * is called (where String might be "" if the request was a
     * PUT or POST request). aRequestFinishedCallback(null, NeutronException)
     * if the server threw a Neutron exception during the request.
     * aRequestFinishedCallback(null, Error) if an internal error
     * occurred while fullfilling the request.
     *
     * Don't use "this" inside this method because the callback
     * will not provide a pointer to it. If you need "this", you
     * must wrap this handler in an anonymous function when you
     * pass it to httpRequestGET().
     *
     * @param  {String}   aDocumentData            the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Function} aRequestFinishedCallback a function with the signature function(String, Error)
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __uploadFinishedHandler: function (aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:document.js:NeutronDocument.__uploadFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode              != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRequestFinishedCallback) == "function");

        if (NetworkService.isStatusSuccess(aResponseStatusCode)) {
            // success
            if (this.loadStyle == "checkout")
                this.__locked = false;

            // call back to original caller
            aRequestFinishedCallback(aDocumentData, null);
        } else {
            if (aException) {
                aRequestFinishedCallback(null, aException);
            } else {
                try {
                    // parse error message (throws an exeception)
                    Neutron.response(aDocumentData);
                } catch (exception) {
                    aRequestFinishedCallback(null, exception);
                    return;
                }
            }
        }
    },

    /**
     * The handler which gets called via a callback after unlock has
     * finished.
     *
     * Calls aRequestFinishedCallback upon completion. If
     * the request succeeded, aRequestFinishedCallback(String, null)
     * is called (where String might be "" if the request was a
     * PUT or POST request). aRequestFinishedCallback(null, NeutronException)
     * if the server threw a Neutron exception during the request.
     * aRequestFinishedCallback(null, Error) if an internal error
     * occurred while fullfilling the request.
     *
     * Don't use "this" inside this method because the callback
     * will not provide a pointer to it. If you need "this", you
     * must wrap this handler in an anonymous function when you
     * pass it to httpRequestGET().
     *
     * @param  {String}   aDocumentData            the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Function} aRequestFinishedCallback a function with the signature function(String, Error)
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __unlockFinishedHandler: function (aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:document.js:NeutronDocument.__unlockFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode              != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback ? typeof(aRequestFinishedCallback) == "function" : true);

        if (aRequestFinishedCallback) {
            if (aResponseStatusCode == 200) {
                // success, call back to original caller
                aRequestFinishedCallback(aDocumentData, null);
            } else {
                if (aException) {
                    aRequestFinishedCallback(null, aException);
                } else {
                    try {
                        // parse error message (throws an exeception)
                        Neutron.response(aDocumentData);
                    } catch (exception) {
                        aRequestFinishedCallback(null, exception);
                        return;
                    }
                }
            }
        }
    }
};


/**
 * DocumentAssociates constructor. Instantiates a new object of
 * type DocumentAssociates.
 *
 * DocumentAssociates should be used as an aggregate type for
 * e.g. NeutronDocument.
 *
 * @constructor
 * @return {DocumentAssociates}
 */
function DocumentAssociates(aStyleArray, aStyleTemplate, aSchemaArray) {
    /* DEBUG */ dump("Yulup:document.js:DocumentAssociates(\"" + aStyleArray + "\", \"" + aSchemaArray + "\") invoked\n");

    if (aStyleArray) {
        this.styles = new Array();

        for (var i = 0; i < aStyleArray.length; i++) {
            this.styles[i] = new XMLDocument(aStyleArray[i].href);
            /* DEBUG */ dump("Yulup:document.js:DocumentAssociates: style[" + i + "] = \"" + this.styles[i] + "\"\n");
        }
    }

    if (aStyleTemplate) {
      this.styleTemplate = new XMLDocument(aStyleTemplate.uri);
    }

    if (aSchemaArray) {
        this.schemas = new Array();

        for (var i = 0; i < aSchemaArray.length; i++) {
            this.schemas[i] = new XMLDocument(aSchemaArray[i].href);
        }
    }

    /* DEBUG */ dump("Yulup:document.js:DocumentAssociates: constructor finished\n");
};

DocumentAssociates.prototype = {
    styles       : null,
    styleTemplate: null,
    schemas      : null,

    hasStyles: function () {
        return (this.styles ? true : false);
    },

    hasStyleTemplate: function () {
        return (this.styleTemplate ? true : false);
    },

    hasSchemas: function () {
        return (this.schemas ? true : false);
    },

    getStyle: function (aStyleID) {
        /* DEBUG */ dump("Yulup:document.js:DocumentAssociates.getStyle(\"" + aStyleID + "\") invoked\n");

        // TODO: check for index-out-of-bound conditions
        return this.styles[aStyleID];
    },

    getStyleTemplate: function () {
      return this.styleTemplate;
    },

    getSchema: function (aSchemaID) {
        // TODO: check for index-out-of-bound conditions
        return this.schemas[aSchemaID];
    },

    loadAssociates: function () {
        // walk through all associates and load them
        if (this.styles) {
            for (var i = 0; i < this.styles.length; i++) {
                this.styles[i].loadDocument();
            }
        }

        if (this.styleTemplate) {
           this.styleTemplate.loadDocument();
        }

        if (this.schemas) {
            for (var i = 0; i < this.schemas.length; i++) {
                this.schemas[i].loadDocument();
            }
        }
    }
};


/**
 * XMLDocument constructor. Instantiates a new object of
 * type XMLDocument.
 *
 * XMLDocument should be used for e.g. XSLT documents
 * and Schemas.
 *
 * @constructor
 * @return {XMLDocument}
 */
function XMLDocument(aLoadURI) {
    /* DEBUG */ dump("Yulup:document.js:XMLDocument(\"" + aLoadURI + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aLoadURI != null);

    Document.call(this, aLoadURI, "text/xml", null, null, null, null, null);
}

XMLDocument.prototype = {
    __proto__: Document.prototype,

    loadStatus  : 0,
    documentData: null,
    documentDOM : null,

    // load status flag (mutually exclusive)
    NOT_LOADED     : 0,
    LOADING        : 1,
    LOAD_SUCCESSFUL: 2,
    LOAD_FAILED    : 3,

    /**
     * Returns a DOM representation of the document. The DOM is
     * computed dynamically from the string representation when
     * this method is called.
     *
     * @return {nsIDOMNode} a DOM representation of the current model
     */
    getDocumentDOM: function () {
        var domParser    = null;
        var documentRoot = null;

        /* DEBUG */ dump("Yulup:document.js:XMLDocument.getDocumentDOM() invoked\n");

        // TODO: check that documentData was indeed sucessfully loaded

        /* Create the DOM representation lazily from the string representation. We only
         * need to do this once because the document cannot change. */
        if (!this.documentDOM) {
            domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);

            this.documentDOM = domParser.parseFromString(this.documentData, "text/xml");

            documentRoot = this.documentDOM.documentElement;
            if ((documentRoot.tagName == "parserError") || (documentRoot.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")) {
                // string representation does not seem to be well-formed
                throw new NeutronException("document.js:XMLDocument.getDocumentDOM: document not well-formed.");
            }
        }

        return this.documentDOM;
    },

    /**
     * Load the document from the aLoadURI as specified by the
     * XMLDocument constructor.
     *
     * @return {Undefined} does not have a return value
     */
    loadDocument: function () {
        var xmlDocument   = null;
        var xmlSerializer = null;

        /* DEBUG */ dump("Yulup:document.js:XMLDocument.loadDocument() invoked\n");

        this.loadStatus = XMLDocument.LOADING;

        //NetworkService.httpRequestGET(this.loadURI.spec, null, this.__loadFinishedHandler);

        // TODO: use asynch loading via networkservice instead of nsIDOMXMLDocument
        xmlDocument = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
        xmlDocument.async = false;

        /* DEBUG */ dump("Yulup:document.js:XMLDocument.loadDocument: loading file \"" + this.loadURI.spec + "\"\n");

        if (!xmlDocument.load(this.loadURI.spec)) {
            this.loadStatus = XMLDocument.LOAD_FAILED;

            throw new YulupEditorException("document.js:XMLDocument.loadDocument: loading file \"" + this.loadURI.spec + "\" failed.");
        } else {
            this.loadStatus = XMLDocument.LOAD_SUCCESSFUL;

            xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);
            this.documentData = xmlSerializer.serializeToString(xmlDocument);

            /* DEBUG */ dump("Yulup:document.js:XMLDocument.loadDocument: load successful. Document data =\n" + this.documentData + "\n");
        }
    },

    __loadFinishedHandler: function (aDocumentData, aResponseStatusCode, aSelf) {
        /* DEBUG */ dump("Yulup:document.js:XMLDocument.__loadFinishedHandler(\"" + aDocumentData + "\", \"" + aResponseStatusCode + "\", \"" + aSelf + "\") invoked\n");

        if (aResponseStatusCode == 200) {
            // success, set document data
            aSelf.documentData = aDocumentData;
            aSelf.loadStatus = XMLDocument.LOAD_SUCCESSFUL;
        } else {
            // load failed, set load status flag accordingly
            aSelf.loadStatus = XMLDocument.LOAD_FAILED;
        }
    }
};


/**
 * AtomDocument constructor. Instantiates a new object of
 * type AtomDocument.
 *
 * AtomDocument should be used for documents which are
 * retrieved by the means of Atom introspection.
 *
 * @constructor
 * @param  {nsIURI}       aEditURI       the URI to update this entry
 * @param  {nsIURI}       aFeedURI       the URI to create this entry
 * @param  {String}       aContentType   the content type of this document
 * @param  {Array}        aSchemaArray   the URIs for schemas associated with this document
 * @param  {Array}        aStyleArray    the URIs for styles associated with this document
 * @param  {Object}       aStyleTemplate the style template associated with this document
 * @return {AtomDocument}
 */
function AtomDocument(aEditURI, aFeedURI, aContentType, aSchemaArray, aStyleArray, aStyleTemplate) {
    /* DEBUG */ dump("Yulup:document.js:AtomDocument(\"" + aEditURI + "\", \"" + aFeedURI + "\", \"" + aContentType + "\", \"" + aSchemaArray + "\", \"" + aStyleArray + "\", \"" + aStyleTemplate + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditURI ? true : aFeedURI != null);
    /* DEBUG */ YulupDebug.ASSERT(aContentType != null);

    Document.call(this, aEditURI, aContentType, null, null, aSchemaArray, aStyleArray, aStyleTemplate);

    this.feedURI = aFeedURI;
}

AtomDocument.prototype = {
    __proto__: Document.prototype,

    feedURI: null,

    /**
     * Get the URI which which references the collection
     * this entry belongs to.
     *
     * @return {nsIURI} the URI of the containing collection
     */
    getFeedURI: function () {
        return this.feedURI;
    },

    /**
     * Load the document from the source as specified by the aEditURI
     * in the constructor.
     *
     * @param  {Function}  aLoadFinishedCallback the function to call when the load has finished
     * @return {Undefined} does not have a return value
     */
    loadDocument: function (aLoadFinishedCallback) {
        /* DEBUG */ dump("Yulup:document.js:AtomDocument.loadDocument() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aLoadFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aLoadFinishedCallback) == "function");

        if (this.loadURI) {
            NetworkService.httpRequestGET(this.loadURI.spec, null, this.__loadFinishedHandler, aLoadFinishedCallback, false, true);
        } else {
            // we can't load that document
            throw new YulupEditorException("Yulup:document.js:AtomDocument.loadDocument: no URI to load this entry.");
        }
    },

    /**
     * Upload the document to the target as specified by the aFeedURI if
     * if no edit URI is present, or the aEditURI otherwise.
     *
     * @param  {String}    aDocumentData           the document data to upload
     * @param  {Function}  aUploadFinishedCallback the function to call when the upload has finished
     * @return {Undefined} does not have a return value
     */
    uploadDocument: function (aDocumentData, aUploadFinishedCallback) {
        var __this = this;

        /* DEBUG */ dump("Yulup:document.js:AtomDocument.uploadDocument() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocumentData                   != null);
        /* DEBUG */ YulupDebug.ASSERT(aUploadFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aUploadFinishedCallback) == "function");

        if (this.loadURI && this.loadURI.scheme != "jar"){
            // the resource already exists, therefore PUT to member URI
            NetworkService.httpRequestPUT(this.loadURI.spec, null, aDocumentData, this.contentType, this.__updateFinishedHandler, aUploadFinishedCallback, false, true);
        } else if (this.feedURI) {
            // this is a new entry, therefore POST to collection URI
            NetworkService.httpRequestPOST(this.feedURI.spec, null, aDocumentData, this.contentType,
                                           function (aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
                                               __this.__createFinishedHandler(aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException);
                                           },
                                           aUploadFinishedCallback, true, true);
        } else {
            throw new YulupEditorException("Yulup:document.js:AtomDocument.uploadDocument: no URI to store this entry.");
        }
    },

    /**
     * The handler which gets called via a callback after a load has
     * finished.
     *
     * Calls aRequestFinishedCallback upon completion. If
     * the request succeeded, aRequestFinishedCallback(String, null)
     * is called. aRequestFinishedCallback(null, Error) if an internal error
     * occurred while fullfilling the request.
     *
     * Don't use "this" inside this method because the callback
     * will not provide a pointer to it. If you need "this", you
     * must wrap this handler in an anonymous function when you
     * pass it to httpRequestGET().
     *
     * @param  {String}   aDocumentData            the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Function} aRequestFinishedCallback a function with the signature function(String, Error)
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __loadFinishedHandler: function (aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:document.js:AtomDocument.__loadFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode              != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRequestFinishedCallback) == "function");

        if (aResponseStatusCode == 200) {
            // success, call back to original caller
            aRequestFinishedCallback(aDocumentData, null);
        } else {
            aRequestFinishedCallback(null, aException);
        }
    },

    /**
     * The handler which gets called via a callback after a create
     * request has finished.
     *
     * Calls aRequestFinishedCallback upon completion. If
     * the request succeeded, aRequestFinishedCallback(String, null)
     * is called (where String might be "" if the request was a
     * PUT or POST request). aRequestFinishedCallback(null, Error) if an
     * internal error occurred while fullfilling the request.
     *
     * Don't use "this" inside this method because the callback
     * will not provide a pointer to it. If you need "this", you
     * must wrap this handler in an anonymous function when you
     * pass it to httpRequest*().
     *
     * @param  {String}   aDocumentData            the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Function} aRequestFinishedCallback a function with the signature function(String, Error)
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __createFinishedHandler: function (aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:document.js:AtomDocument.__createFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode              != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRequestFinishedCallback) == "function");

        if (aResponseStatusCode == 201) {
            // successfully created a new resource, extract and set the member URI
            for (var i = 0; i < aResponseHeaders.length; i++) {
                if (aResponseHeaders[i].header == "Location") {
                    // TODO: we should do something sensible somehow if this fails
                    this.loadURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(aResponseHeaders[i].value, null, null);
                    break;
                }
            }
            // call back to original caller
            aRequestFinishedCallback(aDocumentData, null);
        } else {
            /* DEBUG */ dump("Yulup:document.js:AtomDocument.__createFinishedHandler: could not create new Atom resource.\n");

            aRequestFinishedCallback(null, aException);
        }
    },

    /**
     * The handler which gets called via a callback after an update
     * request has finished.
     *
     * Calls aRequestFinishedCallback upon completion. If
     * the request succeeded, aRequestFinishedCallback(String, null)
     * is called (where String might be "" if the request was a
     * PUT or POST request). aRequestFinishedCallback(null, Error) if an
     * internal error occurred while fullfilling the request.
     *
     * Don't use "this" inside this method because the callback
     * will not provide a pointer to it. If you need "this", you
     * must wrap this handler in an anonymous function when you
     * pass it to httpRequest*().
     *
     * @param  {String}   aDocumentData            the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Function} aRequestFinishedCallback a function with the signature function(String, Error)
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __updateFinishedHandler: function (aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:document.js:AtomDocument.__updateFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode              != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRequestFinishedCallback) == "function");

        if (aResponseStatusCode == 200) {
            // success, call back to original caller
            aRequestFinishedCallback(aDocumentData, null);
        } else {
            aRequestFinishedCallback(null, aException);
        }
    }
};
