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
 * This module contains the code to communicate with a server
 * supporting the APP (see http://bitworking.org/projects/atom/draft-ietf-atompub-protocol-09.html)
 * and the Atom specification (see http://www.ietf.org/rfc/rfc4287.txt).
 */

const APP_09_NAMESPACE  = "http://www.w3.org/2007/app";
const ATOM_10_NAMESPACE = "http://www.w3.org/2005/Atom";

var APP = {
    /**
     * Fetch introspection file.
     *
     * @param  {String}       aURI     URI of remote host to query for introspection file
     * @param  {nsIURI}       aBaseURI the URI of the document to which the introspection document is associated
     * @param  {Yulup}        aYulup   a reference to the active yulup instance
     * @return {Undefined}             does not have a return value
     */
    fetchIntrospection: function (aURI, aBaseURI, aYulup) {
        var context = null;

        /* DEBUG */ dump("Yulup:atom.js:APP.fetchIntrospection(\"" + aURI + "\", \"" + aBaseURI + "\") invoked\n");

        context = {
            URI:              aURI,
            baseURI:          aBaseURI,
            yulup:            aYulup,
            callbackFunction: APP.introspectionLoadFinished
        };

        NetworkService.httpRequestGET(aURI, null, this.__requestFinishedHandler, context, false, true);
    },

    /**
     * Callback function that gets called when the introspection load
     * request finished.
     *
     * @param  {String}   aDocumentData            the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Object}   aContext                 context object containing the callback function and it's parameters
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __requestFinishedHandler: function(aDocumentData, aResponseStatusCode, aContext, aResponseHeaders) {
        /* DEBUG */ dump("Yulup:atom.js:APP.__requestFinishedHandler() invoked\n");

        if (aResponseStatusCode == 200) {
            // success, call back to original caller
            aContext.callbackFunction(aDocumentData, null, aContext);
        } else {
            try {
                // parse error message (throws an exeception)
                Neutron.response(aDocumentData);
            } catch (exception) {
                aContext.callbackFunction(null, exception, aContext);
                return;
            }
        }
    },

    /**
     * Callback function that gets called when the introspection request
     * finished and after parsing a possible exception.
     *
     * @param  {String}    aDocumentData the document data retrieved by the request
     * @param  {Exception} aException    the exception
     * @param  {Object}    aContext      context object containing the function parameters
     * @return {Undefined}               does not have a return value
     */
    introspectionLoadFinished: function(aDocumentData, aException, aContext) {
        var wellFormednessError = null;
        var domParser           = null;
        var xmlDocument         = null;
        var xmlSerializer       = null;
        var introspection       = null;
        var uri                 = aContext.URI;
        var baseURI             = aContext.baseURI;
        var yulup               = aContext.yulup;

        /* DEBUG */ dump("Yulup:atom.js:APP.introspectionLoadFinished() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(uri     != null);
        /* DEBUG */ YulupDebug.ASSERT(baseURI != null);

        try {
            if (aDocumentData) {
                // load successful
                if ((wellFormednessError = YulupXMLServices.checkWellFormedness(aDocumentData)) != null) {
                    throw new YulupException(YulupXMLServices.createWellFormednessAlertString(wellFormednessError));
                }

                domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);

                xmlDocument  = domParser.parseFromString(aDocumentData, "text/xml");

                ///* DEBUG */ dump("Yulup:atom.js:APP.introspectionLoadFinished: loading introspection file \"" + uri + "\" succeeded\n");
                ///* DEBUG */ dump("Yulup:atom.js:APP.introspectionLoadFinished: introspection document =\n" + Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(xmlDocument) + "\n");

                // instantiate the parser for this version and parse the file
                introspection = APP.parserFactory(xmlDocument, uri).parseIntrospection();

                introspection.sourceString = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(xmlDocument);
                introspection.introspectionURI = uri;

                // set the global introspection object
                yulup.currentAPPIntrospection = introspection;

                // set the introspection state
                yulup.introspectionStateChanged("success");

                /* DEBUG */ dump("Yulup:atom.js:APP.introspectionLoadFinished: introspection object = \n" + introspection.toString());
            } else {
                /* DEBUG */ dump("Yulup:atom.js:APP.introspectionLoadFinished: failed to load introspection document \"" + uri + "\"). \"" + aException + "\"\n");

                // set the introspection state
                yulup.introspectionStateChanged("failed");
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:atom.js:APP.introspectionLoadFinished", exception);

            // set the introspection state
            yulup.introspectionStateChanged("failed");
        }
    },

    /**
     * Instantiates a parser corresponding to the APP version
     * used.
     *
     * @param  {nsIDOMXMLDocument} aDocument the APP introspection document to parse
     * @param  {String}            aBaseURI  the URI of the introspection document
     * @return {APPParser}         the Atom Publishing Protocol parser best matching the used APP version
     * @throws {AtomException}
     */
    parserFactory: function (aDocument, aBaseURI) {
        var namespace = null;
        var appParser = null;

        /* DEBUG */ dump("Yulup:atom.js:APP.parserFactory(\"" + aDocument + "\", \"" + aBaseURI + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocument != null);
        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);

        // extract APP version
        switch (aDocument.documentElement.namespaceURI) {
            case APP_09_NAMESPACE:
                // instantiate APP 0.9 parser
                appParser = new APPParser09(aDocument, aBaseURI);
                break;
            default:
                // no parser available for this version
                throw new AtomException("Yulup:atom.js:APP.parserFactory: APP version \"" + aDocument.documentElement.namespaceURI + "\" not supported.");
        }

        return appParser;
    }
};


var Atom = {
    /**
     * Parse the feed information part of an Atom Feed.
     *
     * @param  {nsIDOMXMLDocument}   aFeedDocument the feed DOM document
     * @param  {String}              aBaseURI      the URI of the feed document
     * @param  {Boolean}             aStrict       indicates if the parser should be strict about validity errors or not
     * @param  {Function}            aErrorHandler an error handler with signature function (Error aError) [optional]
     * @return {AtomFeedInformation} a AtomFeedInformation object
     */
    parseFeedInformation: function (aFeedDocument, aBaseURI, aStrict, aErrorHandler) {
        var atomFeedInfo = null;

        /* DEBUG */ dump("Yulup:atom.js:Atom.parseFeedInformation(\"" + aFeedDocument + "\", \"" + aBaseURI + "\", \"" + aStrict + "\", \"" + aErrorHandler + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aFeedDocument != null);
        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aStrict != null);

        // instantiate the parser for this version and parse the document
        atomFeedInfo = Atom.parserFactory(aFeedDocument, aBaseURI, aStrict, aErrorHandler).parseFeedInformation();

        return atomFeedInfo;
    },

    /**
     * Instantiates a parser corresponding to the Atom version
     * used.
     *
     * @param  {nsIDOMXMLDocument} aDocument     the Atom feed document to parse
     * @param  {String}            aBaseURI      the URI of the feed document
     * @param  {Boolean}           aStrict       indicates if the parser should be strict about validity errors or not
     * @param  {Function}          aErrorHandler an error handler with signature function (Error aError) [optional]
     * @return {AtomParser}        the Atom parser best matching the used Atom version
     * @throws {AtomException}
     */
    parserFactory: function (aDocument, aBaseURI, aStrict, aErrorHandler) {
        var namespace  = null;
        var atomParser = null;

        /* DEBUG */ dump("Yulup:atom.js:Atom.parserFactory(\"" + aDocument + "\", \"" + aBaseURI + "\", \"" + aStrict + "\", \"" + aErrorHandler + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocument != null);
        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aStrict != null);

        // extract Atom version
        switch (aDocument.documentElement.namespaceURI) {
            case ATOM_10_NAMESPACE:
                // instantiate Atom 1.0 parser
                atomParser = new AtomParser10(aDocument, aBaseURI, aStrict, aErrorHandler);
                break;
            default:
                // no parser available for this version
                throw new AtomException("Yulup:atom.js:Atom.parserFactory: Atom version \"" + aDocument.documentElement.namespaceURI + "\" not supported.");
        }

        return atomParser;
    }
};


/**
 * AtomException constructor. Instantiates a new object of
 * type AtomException.
 *
 * Exceptions of this type are not exceptions as thrown by the
 * server, but signal error conditions in the actual parser
 * or helper functions.
 *
 * @constructor
 * @param  {String}        aMessage a descriptive error message
 * @return {AtomException}
 */
function AtomException(aMessage) {
    /* DEBUG */ dump("Yulup:atom.js:AtomException(\"" + aMessage + "\") invoked\n");

    this.message = aMessage;
    this.name    = "AtomException";
}

AtomException.prototype.__proto__ = Error.prototype;


/**
 * APPException constructor. Instantiates a new object of
 * type APPException.
 *
 * Exceptions of this type are not exceptions as thrown by the
 * server, but signal error conditions in the actual parser
 * or helper functions.
 *
 * @constructor
 * @param  {String}       aMessage a descriptive error message
 * @return {APPException}
 */
function APPException(aMessage) {
    this.message = aMessage;
    this.name    = "APPException";
}

APPException.prototype.__proto__ = Error.prototype;


/**
 * APPCommon constructor. Instantiates a new object of
 * type APPCommon.
 *
 * @constructor
 * @param  {nsIURI}    aBaseURI a xml base URI
 * @param  {String}    aLang    a xml lang
 * @return {APPCommon} a new APPCommon object
 */
function APPCommon(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:APPCommon(\"" + aBaseURI + "\", \"" + aLang + "\") invoked\n");
    /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null, "Yulup:atom.js:APPCommon", "aBaseURI != null");
    /* DEBUG */ YulupDebug.ASSERT((aBaseURI ? aBaseURI.spec != null : false), "Yulup:atom.js:APPCommon", "aBaseURI.spec != null");

    this.base = aBaseURI;
    this.lang = aLang;
}

APPCommon.prototype = {
    base: null,
    lang: null,

    /**
     * Return a string representation of this
     * object.
     *
     * @return {String} a string representation of this object
     */
    toString: function () {
        var objString = "";

        objString += "base: " + this.base + "\n";
        objString += "lang: " + this.lang + "\n";

        return objString + "\n";
    }
};


/**
 * APPIntrospection constructor. Instantiates a new object of
 * type APPIntrospection.
 *
 * Invariant: workspaces is always != null, even if there are
 * no workspaces.
 *
 * @constructor
 * @param  {nsIURI}           aBaseURI a xml base URI
 * @param  {String}           aLang    a xml lang
 * @return {APPIntrospection} a new APPIntrospection object
 */
function APPIntrospection(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:APPIntrospection(\"" + aBaseURI + "\", \"" + aLang + "\") invoked\n");

    // call super constructor
    APPCommon.call(this, aBaseURI, aLang);

    this.workspaces = new Array();
}

APPIntrospection.prototype = {
    __proto__:  APPCommon.prototype,

    sourceString    : null,
    introspectionURI: null,

    workspaces: null,

    /**
     * Return the titles of all workspaces in document order.
     *
     * @return {Array} the titles of the workspaces
     */
    getWorkspaces: function () {
        var workspaceTitles = null;

        /* DEBUG */ dump("Yulup:atom.js:APPIntrospection.getWorkspaces() invoked.\n");

        workspaceTitles = new Array();

        for (var i = 0; i < this.workspaces.length; i++) {
            workspaceTitles.push(this.workspaces[i].title);
        }

        return workspaceTitles;
    },

    /**
     * Return the titles of all collections in document order
     * for a given workspace as indexed by a number (starting
     * from 0).
     *
     * @param  {Number} aWorkspaceIndex the index of the workspace
     * @return {Array}  the titles of all collections for the given workspace
     */
    getCollectionsForWorkspace: function (aWorkspaceIndex) {
        var collectionTitles = null;

        /* DEBUG */ dump("Yulup:atom.js:APPIntrospection.getCollectionsForWorkspace(\"" + aWorkspaceIndex + "\") invoked\n");

        collectionTitles = new Array();

        if (aWorkspaceIndex >= 0 && aWorkspaceIndex < this.workspaces.length) {
            // we are in bounds
            for (var i = 0; i < this.workspaces[aWorkspaceIndex].collections.length; i++) {
                collectionTitles.push(this.workspaces[aWorkspaceIndex].collections[i].title);
            }
        }

        return collectionTitles;
    },

    /**
     * Get the feed URI for the given collection, identified
     * by the workspace index and its collection index (both
     * starting from 0).
     *
     * @param {Number}  aWorkspaceIndex the selected workspace
     * @param {Number}  aCollectionIndex the selected collection in the selected workspace
     * @return {nsIURI} returns the feed URI for the given collection
     */
    getFeedForCollection: function (aWorkspaceIndex, aCollectionIndex) {
        /* DEBUG */ dump("Yulup:atom.js:APPIntrospection.getFeedForCollection(\"" + aWorkspaceIndex + "\", \"" + aCollectionIndex + "\") invoked\n");

        if (aWorkspaceIndex  >= 0 && aWorkspaceIndex  < this.workspaces.length &&
            aCollectionIndex >= 0 && aCollectionIndex < this.workspaces[aWorkspaceIndex].collections.length) {
            // we are in bounds
            return this.workspaces[aWorkspaceIndex].collections[aCollectionIndex].getFeed();
        } else {
            return null;
        }
    },

    /**
     * Return a string representation of this
     * object.
     *
     * @return {String} a string representation of this object
     */
    toString: function () {
        var objString = "";

        objString += "APPIntrospection introspection URI: " + this.introspectionURI + "\n";
        objString += "APPIntrospection base             : " + this.base + "\n";
        objString += "APPIntrospection lang             : " + this.lang + "\n";

        if (this.workspaces) {
            for (var i = 0; i < this.workspaces.length; i++) {
                objString += "APPIntrospection workspaces[" + i + "]    :\n" + this.workspaces[i].toString();
            }
        } else {
            objString += "APPIntrospection workspaces[" + i + "]    : " + this.workspaces;
        }

        return objString;
    }
};


/**
 * APPWorkspace constructor. Instantiates a new object of
 * type APPWorkspace.
 *
 * Invariant: collections is always != null, even if there are
 * no collections.
 *
 * @constructor
 * @param  {nsIURI}       aBaseURI a xml base URI
 * @param  {String}       aLang    a xml lang
 * @return {APPWorkspace} a new APPWorkspace object
 */
function APPWorkspace(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:APPWorkspace(\"" + aBaseURI + "\", \"" + aLang + "\") invoked\n");

    // call super constructor
    APPCommon.call(this, aBaseURI, aLang);

    this.collections = new Array();
}

APPWorkspace.prototype = {
    __proto__:  APPCommon.prototype,

    title      : null,
    collections: null,

    /**
     * Return a string representation of this
     * object.
     *
     * @return {String} a string representation of this object
     */
    toString: function () {
        var objString = "";

        objString += "";

        objString += "APPWorkspace base          : " + this.base + "\n";
        objString += "APPWorkspace lang          : " + this.lang + "\n";
        objString += "APPWorkspace title         : " + this.title + "\n";

        if (this.collections) {
            for (var i = 0; i < this.collections.length; i++) {
                objString += "APPWorkspace collections[" + i + "]:\n" + this.collections[i].toString();
            }
        } else {
            objString += "APPWorkspace collections[" + i + "]: " + this.collections;
        }

        return objString;
    }
};


/**
 * APPCollection constructor. Instantiates a new object of
 * type APPCollection.
 *
 * @constructor
 * @param  {nsIURI}        aBaseURI a xml base URI
 * @param  {String}        aLang    a xml lang
 * @return {APPCollection} a new APPCollection object
 */
function APPCollection(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:APPCollection(\"" + aBaseURI + "\", \"" + aLang + "\") invoked\n");

    // call super constructor
    APPCommon.call(this, aBaseURI, aLang);
}

APPCollection.prototype = {
    __proto__:  APPCommon.prototype,

    __uri   : null,
    title   : null,
    accept  : null,
    atomFeed: null,

    get uri() {
        return this.__uri;
    },

    set uri(aURI) {
        /* DEBUG */ dump("Yulup:atom.js:APPCollection.uri[setter]: aURI = \"" + aURI + "\", this.base = \"" + this.base.spec + "\"\n");
        if (aURI) {
            this.__uri = (Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService)).newURI(aURI, null, this.base);
        }
    },

    /**
     * Return the feed for this collection.
     *
     * Fetches the feed lazily, i.e. only actually
     * downloads the feed on the first invocation.
     *
     * Afterwards, the same feed is returned except
     * refreshFeed() was called in between.
     *
     * Throws an AtomException if the feed could not
     * be loaded.
     *
     * @return {AtomFeed} returns the Atom feed for this collection
     * @throws {AtomException}
     */
    getFeed: function () {
        if (!this.atomFeed)
            this.atomFeed = new AtomFeed(this.uri);

        return this.atomFeed;
    },

    /**
     * Invalidates the currently loaded feed, if any.
     *
     * When getFeed() is invoked the next time after a
     * call to this method, the feed pointed to by this
     * collection is refetched.
     *
     * @return {Undefined} does not have a return value
     */
    refreshFeed: function () {
        this.atomFeed = null;
    },

    /**
     * Return a string representation of this
     * object.
     *
     * @return {String} a string representation of this object
     */
    toString: function () {
        var objString = "";

        objString += "";

        objString += "APPCollection base  : " + this.base + "\n";
        objString += "APPCollection lang  : " + this.lang + "\n";
        objString += "APPCollection title : " + this.title + "\n";
        objString += "APPCollection uri   : " + this.uri.spec + "\n";

        if (this.accept) {
            objString += "APPCollection accept:\n" + this.accept.toString();
        } else {
            objString += "APPCollection accept: " + this.accept + "\n";
        }

        return objString;
    }
};


/**
 * APPAccept constructor. Instantiates a new object of
 * type APPAccept.
 *
 * @constructor
 * @param  {nsIURI}    aBaseURI a xml base URI
 * @param  {String}    aLang    a xml lang
 * @return {APPAccept} a new APPAccept object
 */
function APPAccept(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:APPAccept(\"" + aBaseURI + "\", \"" + aLang + "\") invoked\n");

    // call super constructor
    APPCommon.call(this, aBaseURI, aLang);
}

APPAccept.prototype = {
    __proto__:  APPCommon.prototype,

    mediaRanges: null,

    /**
     * Return a string representation of this
     * object.
     *
     * @return {String} a string representation of this object
     */
    toString: function () {
        var objString = "";

        objString += "";

        objString += "APPAccept base          : " + this.base + "\n";
        objString += "APPAccept lang          : " + this.lang + "\n";

        if (this.mediaRanges) {
            for (var i = 0; i < this.mediaRanges.length; i++) {
                objString += "APPAccept mediaRanges[" + i + "]: " + this.mediaRanges[i];
            }
        } else {
            objString += "APPAccept mediaRanges[" + i + "]: " + this.mediaRanges;
        }

        return objString + "\n";
    }
};


/**
 * AtomCommon constructor. Instantiates a new object of
 * type AtomCommon.
 *
 * @constructor
 * @param  {nsIURI}     aBaseURI a xml base URI
 * @param  {String}     aLang    a xml lang
 * @return {AtomCommon} a new AtomCommon object
 */
function AtomCommon(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomCommon(\"" + aBaseURI + "\", \"" + aLang + "\") invoked\n");
    /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null, "Yulup:atom.js:AtomCommon", "aBaseURI != null");
    /* DEBUG */ YulupDebug.ASSERT((aBaseURI ? aBaseURI.spec != null : false), "Yulup:atom.js:AtomCommon", "aBaseURI.spec != null");

    this.base = aBaseURI;
    this.lang = aLang;
}

AtomCommon.prototype = {
    base: null,
    lang: null
};


/**
 * AtomFeedInformation constructor. Instantiates a new object of
 * type AtomFeedInformation.
 *
 * This class is intended to act as a container, holding all the
 * elements of a feed except the entries. This container is needed
 * to transport the results of the parseFeedInformation step.
 *
 * @constructor
 * @param  {nsIURI}              aBaseURI a xml base URI
 * @param  {String}              aLang    a xml lang
 * @return {AtomFeedInformation} a new AtomFeedInformation object
 */
function AtomFeedInformation(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomFeedInformation() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);

    this.authors      = new Array();
    this.categories   = new Array();
    this.contributors = new Array();
    this.links        = new Array();
}

AtomFeedInformation.prototype = {
    __proto__:  AtomCommon.prototype,

    authors     : null,
    categories  : null,
    contributors: null,
    generator   : null,
    icon        : null,
    id          : null,
    links       : null,
    logo        : null,
    rights      : null,
    subtitle    : null,
    title       : null,
    updated     : null
};


/**
 * AtomFeed constructor. Instantiates a new object of
 * type AtomFeed.
 *
 * @constructor
 * @param  {nsIURI}   aFeedURI the URI of the feed
 * @return {AtomFeed} a new AtomFeed object
 */
function AtomFeed(aFeedURI) {
    /* DEBUG */ dump("Yulup:atom.js:AtomFeed(\"" + aFeedURI + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aFeedURI);
    /* DEBUG */ YulupDebug.ASSERT(aFeedURI ? aFeedURI.spec : false);

    /* Call super constructor (the real xml:base and xml:lang attributes
     * are going to be resolved after the feed was loaded. Up until then
     * (or if there is no xml:base attribute present on the <feed> element),
     * we use the URI of the feed location). */
    AtomCommon.call(this, aFeedURI, null);

    this.feedID       = YulupAppServices.generateUID();
    this.feedURI      = aFeedURI;

    this.authors      = new Array();
    this.categories   = new Array();
    this.contributors = new Array();
    this.links        = new Array();

    this.__entryCache = new Array();
    this.__loading    = false;
}

AtomFeed.prototype = {
    __proto__:  AtomCommon.prototype,

    feedID : null,
    feedURI: null,
    feed   : null,

    authors     : null,
    categories  : null,
    contributors: null,
    generator   : null,
    icon        : null,
    id          : null,
    links       : null,
    logo        : null,
    rights      : null,
    subtitle    : null,
    title       : null,
    updated     : null,

    feedInformation: null,

    __entryCache     : null,
    __loading        : null,

    /**
     * Check if the feed was loaded and is correct.
     *
     * @return {Boolean} returns true if the feed is ok and ready to be read, false otherwise
     */
    isFeedOk: function () {
        return (this.feed ? true : false);
    },

    loadFeed: function (aCallback, aContext) {
        /* DEBUG */ dump("Yulup:atom.js:AtomFeed.loadFeed(\"" + aCallback + "\", \"" + aContext + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aCallback) == "function");

        if (!this.isFeedOk()) {
            // check if feed is currently loading
            if (!this.__loading) {
                /* DEBUG */ dump("Yulup:atom.js:AtomFeed: load feed \"" + this.feedURI.spec + "\"\n");
                NetworkService.httpRequestGET(this.feedURI.spec, null, this.__loadFinishedHandler, { target: this, callback: aCallback, context: aContext }, false, true);
                this.__loading = true;
            } else {
                /* DEBUG */ dump("Yulup:atom.js:AtomFeed: feed \"" + this.feedURI.spec + "\" is currently loading. Not going to load twice.\n");
                // don't call back, because our feed is not ok but also not invalid
            }
        } else {
            /* DEBUG */ dump("Yulup:atom.js:AtomFeed: feed \"" + this.feedURI.spec + "\" already loaded. Not going to load twice.\n");
            aCallback.call(aContext, this);
        }
    },

    __loadFinishedHandler: function (aDocumentData, aResponseStatusCode, aContext, aResponseHeaders, aException) {
        var domParser    = null;
        var documentRoot = null;
        var feedDOM      = null;
        var xmlBase      = null;
        var xmlLang      = null;

        /* DEBUG */ dump("Yulup:atom.js:AtomFeed.__loadFinishedHandler(\"" + aDocumentData + "\", \"" + aResponseStatusCode + "\", \"" + aContext + "\", \"" + aResponseHeaders + "\", \"" + aException + "\") invoked\n");

        // we finished loading
        aContext.target.__loading = false;

        if (!aException) {
            try {
                if (aResponseStatusCode == 200) {
                    // success, set document
                    domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);

                    feedDOM = domParser.parseFromString(aDocumentData, "text/xml");

                    documentRoot = feedDOM.documentElement;
                    if (!((documentRoot.tagName == "parserError") || (documentRoot.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml"))) {
                        // all is well
                        aContext.target.feed = feedDOM;

                        // extract base and lang common attributes
                        xmlBase = documentRoot.getAttribute("base");
                        xmlLang = documentRoot.getAttribute("lang");

                        try {
                            if (xmlBase) {
                                aContext.target.base = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).ioService.newURI(xmlBase, null, null);
                            }
                        } catch (exception) {
                            /* DEBUG */ dump("Yulup:atom.js:AtomFeed.__loadFinishedHandler: there was a problem parsing the base URI \"" + xmlBase + "\". We ignore it and use the feed URI as base URI for the descendants instead (if present).\n");
                            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:atom.js:AtomFeed.__loadFinishedHandler", exception);
                            Components.utils.reportError(exception);
                        }

                        aContext.target.lang = xmlLang;

                        aContext.callback.call(aContext.context, aContext.target);

                        return;
                    }
                }
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:atom.js:AtomFeed.__loadFinishedHandler", exception);
                Components.utils.reportError(exception);

                aContext.target.feed = null;
                aContext.callback.call(aContext.context, aContext.target);
            }
        }

        // there is a problem with the feed
        aContext.target.feed = null;
        aContext.callback.call(aContext.context, aContext.target);
    },

    getFeedInformation: function () {
        if (!this.feedInformation) {
            this.feedInformation = Atom.parseFeedInformation(this.feed, this.base.spec, true, null);
        }

        return this.feedInformation;
    },

    /**
     * Return the total number of entries contained
     * in this feed.
     *
     * @return {Number} returns the number of entries for this feed
     */
    getNumberOfEntries: function () {
        /* DEBUG */ dump("Yulup:atom.js:AtomFeed.getNumberOfEntries() invoked\n");

        if (this.feed) {
            return this.feed.evaluate("count(atom10:feed/atom10:entry)", this.feed, this.__nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
        } else
            return 0;
    },

    getEntry: function (aEntry) {
        ///* DEBUG */ dump("Yulup:atom.js:AtomFeed.getEntry(\"" + aEntry + "\") invoked\n");

        // make sure we don't cache anything above 2^32 - 1 (the maximum array size)
        if (aEntry < 4294967295) {
            if (this.__entryCache[aEntry]) {
                return this.__entryCache[aEntry];
            } else {
                return (this.__entryCache[aEntry] = new AtomEntry(this, this.feed.evaluate("atom10:feed/atom10:entry[" + (aEntry + 1) + "]", this.feed, this.__nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue));
            }
        } else {
            return new AtomEntry(this, this.feed.evaluate("atom10:feed/atom10:entry[" + (aEntry + 1) + "]", this.feed, this.__nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue);
        }
    },

    /**
     * Resolve prefixes used in XPath expressions to
     * namespaces.
     *
     * @param  {String} aPrefix a namespace prefix
     * @return {String} the namespace associated with the passed in prefix
     */
    __nsResolver: function (aPrefix) {
        var namespace = null;

        /* DEBUG */ dump("Yulup:atom.js:AtomFeed.__nsResolver(\"" + aPrefix + "\") invoked\n");

        var namespace = {
            "atom10" : ATOM_10_NAMESPACE
        };

        return namespace[aPrefix] || null;
    }
};


/**
 * AtomText constructor. Instantiates a new object of
 * type AtomText.
 *
 * @constructor
 * @param  {nsIURI}   aBaseURI a xml base URI
 * @param  {String}   aLang    a xml lang
 * @return {AtomText} a new AtomText object
 */
function AtomText(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomText() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);
}

AtomText.prototype = {
    __proto__:  AtomCommon.prototype
};


/**
 * AtomPlainText constructor. Instantiates a new object of
 * type AtomPlainText.
 *
 * @constructor
 * @param  {nsIURI}        aBaseURI a xml base URI
 * @param  {String}        aLang    a xml lang
 * @return {AtomPlainText} a new AtomPlainText object
 */
function AtomPlainText(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomPlainText() invoked\n");

    // call super constructor
    AtomText.call(this, aBaseURI, aLang);
}

AtomPlainText.prototype = {
    __proto__:  AtomText.prototype,

    type: null,
    text: null
};


/**
 * AtomXHTMLText constructor. Instantiates a new object of
 * type AtomXHTMLText.
 *
 * @constructor
 * @param  {nsIURI}        aBaseURI a xml base URI
 * @param  {String}        aLang    a xml lang
 * @return {AtomXHTMLText} a new AtomXHTMLText object
 */
function AtomXHTMLText(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomXHTMLText() invoked\n");

    // call super constructor
    AtomText.call(this, aBaseURI, aLang);
}

AtomXHTMLText.prototype = {
    __proto__:  AtomText.prototype,

    type    : null,
    xhtmlDiv: null
};


/**
 * AtomPerson constructor. Instantiates a new object of
 * type AtomPerson.
 *
 * @constructor
 * @param  {nsIURI}     aBaseURI a xml base URI
 * @param  {String}     aLang    a xml lang
 * @return {AtomPerson} a new AtomPerson object
 */
function AtomPerson(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomPerson() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);
}

AtomPerson.prototype = {
    __proto__:  AtomCommon.prototype,

    name : null,
    uri  : null,
    email: null
};


/**
 * AtomCategory constructor. Instantiates a new object of
 * type AtomCategory.
 *
 * @constructor
 * @param  {nsIURI}       aBaseURI a xml base URI
 * @param  {String}       aLang    a xml lang
 * @return {AtomCategory} a new AtomCategory object
 */
function AtomCategory(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomCategory() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);
}

AtomCategory.prototype = {
    __proto__:  AtomCommon.prototype,

    term  : null,
    scheme: null,
    label : null
};


/**
 * AtomDate constructor. Instantiates a new object of
 * type AtomDate.
 *
 * @constructor
 * @param  {nsIURI}   aBaseURI a xml base URI
 * @param  {String}   aLang    a xml lang
 * @return {AtomDate} a new AtomDate object
 */
function AtomDate(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomDate() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);
}

AtomDate.prototype = {
    __proto__:  AtomCommon.prototype,

    date: null
};


/**
 * AtomGenerator constructor. Instantiates a new object of
 * type AtomGenerator.
 *
 * @constructor
 * @param  {nsIURI}        aBaseURI a xml base URI
 * @param  {String}        aLang    a xml lang
 * @return {AtomGenerator} a new AtomGenerator object
 */
function AtomGenerator(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomGenerator() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);
}

AtomGenerator.prototype = {
    __proto__:  AtomCommon.prototype,

    uri    : null,
    version: null,
    text   : null
};


/**
 * AtomIcon constructor. Instantiates a new object of
 * type AtomIcon.
 *
 * @constructor
 * @param  {nsIURI}   aBaseURI a xml base URI
 * @param  {String}   aLang    a xml lang
 * @return {AtomIcon} a new AtomIcon object
 */
function AtomIcon(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomIcon() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);
}

AtomIcon.prototype = {
    __proto__:  AtomCommon.prototype,

    uri: null
};


/**
 * AtomId constructor. Instantiates a new object of
 * type AtomId.
 *
 * @constructor
 * @param  {nsIURI} aBaseURI a xml base URI
 * @param  {String} aLang    a xml lang
 * @return {AtomId} a new AtomId object
 */
function AtomId(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomId() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);
}

AtomId.prototype = {
    __proto__:  AtomCommon.prototype,

    uri: null
};


/**
 * AtomLogo constructor. Instantiates a new object of
 * type AtomLogo.
 *
 * @constructor
 * @param  {nsIURI}   aBaseURI a xml base URI
 * @param  {String}   aLang    a xml lang
 * @return {AtomLogo} a new AtomLogo object
 */
function AtomLogo(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomLogo() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);
}

AtomLogo.prototype = {
    __proto__:  AtomCommon.prototype,

    uri: null
};


/**
 * AtomLink constructor. Instantiates a new object of
 * type AtomLink.
 *
 * @constructor
 * @param  {nsIURI}   aBaseURI a xml base URI
 * @param  {String}   aLang    a xml lang
 * @return {AtomLink} a new AtomLink object
 */
function AtomLink(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomLink() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);
}

AtomLink.prototype = {
    __proto__:  AtomCommon.prototype,

    href    : null,
    rel     : null,
    type    : null,
    hreflang: null,
    title   : null,
    length  : null
};


/**
 * AtomSource constructor. Instantiates a new object of
 * type AtomSource.
 *
 * @constructor
 * @param  {nsIURI}     aBaseURI a xml base URI
 * @param  {String}     aLang    a xml lang
 * @return {AtomSource} a new AtomSource object
 */
function AtomSource(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atom.js:AtomSource() invoked\n");

    // call super constructor
    AtomCommon.call(this, aBaseURI, aLang);

    this.authors      = new Array();
    this.categories   = new Array();
    this.contributors = new Array();
    this.links        = new Array();
}

AtomSource.prototype = {
    __proto__:  AtomCommon.prototype,

    authors     : null,
    categories  : null,
    contributors: null,
    generator   : null,
    icon        : null,
    id          : null,
    links       : null,
    logo        : null,
    rights      : null,
    subtitle    : null,
    title       : null,
    updated     : null
};


/**
 * AtomEntry constructor. Instantiates a new object of
 * type AtomEntry.
 *
 * @constructor
 * @return {AtomEntry} a new AtomEntry object
 */
function AtomEntry(aAtomFeed, aAtomEntryNode) {
    var xmlBase = null;
    var xmlLang = null;

    /* DEBUG */ dump("Yulup:atom.js:AtomEntry(\"" + aAtomFeed + "\", \"" + aAtomEntryNode + "\") invoked\n");

    // derive base URI and lang
    xmlBase = aAtomEntryNode.getAttribute("base");
    xmlLang = aAtomEntryNode.getAttribute("lang");

    try {
        if (xmlBase) {
            xmlBase = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(xmlBase, null, null);
        } else {
            xmlBase = aAtomFeed.base;
        }
    } catch (exception) {
        /* DEBUG */ dump("Yulup:atom.js:AtomEntry: there was a problem parsing the base URI \"" + xmlBase + "\". We ignore it and use the base URI of the containing feed as base URI for the descendants instead.\n");

        xmlBase = aAtomFeed.base;

        /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:atom.js:AtomEntry", exception);
        Components.utils.reportError(exception);
    }

    // call super constructor
    AtomCommon.call(this, xmlBase, xmlLang);

    this.__feed = aAtomFeed;
    this.__node = aAtomEntryNode;

    this.authors      = new Array();
    this.categories   = new Array();
    this.contributors = new Array();
}

AtomEntry.prototype = {
    __proto__:  AtomCommon.prototype,

    __feed: null,
    __node: null,

    authors     : null,
    categories  : null,
    content     : null,
    contributors: null,
    id          : null,
    links       : null,
    published   : null,
    rights      : null,
    source      : null,
    summary     : null,
    title       : null,
    updated     : null,

    __parseLinks: function () {
        var links     = null;
        var link      = null;
        var ioService = null;

        /* DEBUG */ dump("Yulup:atom.js:AtomEntry.__parseLinks() invoked\n");

        links     = new Object();
        ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

        link = this.__feed.feed.evaluate("atom10:link[attribute::rel='edit']/attribute::href", this.__node, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        if (link != "") {
            links.edit = ioService.newURI(link, null, this.__feed.feedURI);
        }

        /* DEBUG */ dump("Yulup:atom.js:AtomEntry.__parseTitle: links.edit = \"" + links.edit + "\"\n");

        this.links = links;
    },

    __parseTitle: function () {
        var title = null;

        /* DEBUG */ dump("Yulup:atom.js:AtomEntry.__parseTitle() invoked\n");

        title = this.__feed.feed.evaluate("atom10:title/text()", this.__node, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        /* DEBUG */ dump("Yulup:atom.js:AtomEntry.__parseTitle: title = \"" + title + "\"\n");

        this.title = title;
    },

    getEditURI: function () {
        if (!this.links) {
            this.__parseLinks();
        }

        return this.links.edit;
    },

    getTitle: function () {
        if (!this.title) {
            this.__parseTitle();
        }

        return this.title;
    },

    isEditable: function () {
        return (this.getEditURI() != null);
    },

    deleteEntry: function (aDeleteFinishedCallback) {
        var editURI = null;
        var __this  = this;

        /* DEBUG */ YulupDebug.ASSERT(aDeleteFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aDeleteFinishedCallback) == "function");

        if ((editURI = this.getEditURI()) && editURI.spec) {
            NetworkService.httpRequestDELETE(editURI.spec,
                                             null,
                                             function (aDocumentData, aResponseStatusCode, aDeleteFinishedCallback, aResponseHeaders, aException) {
                                                 __this.__deleteFinishedHandler(aDocumentData, aResponseStatusCode, aDeleteFinishedCallback, aResponseHeaders, aException);
                                             },
                                             aDeleteFinishedCallback,
                                             false,
                                             true);
        } else {
            throw new AtomException("Yulup:atom.js:AtomEntry.deleteEntry: failed to delete Atom resource. No URI to delete this entry.");
        }
    },

    __deleteFinishedHandler: function (aDocumentData, aResponseStatusCode, aDeleteFinishedCallback, aResponseHeaders, aException) {
        var __this = this;

        /* DEBUG */ dump("Yulup:atom.js:AtomEntry.__deleteFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode             != null);
        /* DEBUG */ YulupDebug.ASSERT(aDeleteFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aDeleteFinishedCallback) == "function");

        if (aResponseStatusCode == 200 ||
            aResponseStatusCode == 202 ||
            aResponseStatusCode == 204) {
            // successfully deleted, call back original caller
            aDeleteFinishedCallback(aDocumentData, null);
        } else {
            /* DEBUG */ dump("Yulup:atom.js:AtomEntry.__deleteFinishedHandler: failed to delete Atom resource. Response status code = \"" + aResponseStatusCode + "\".\n");

            aDeleteFinishedCallback(aDocumentData, aException);
        }
    },

    __redeleteEntry: function (aDocumentData, aException, aDeleteFinishedCallback) {
        /* DEBUG */ dump("Yulup:atom.js:AtomEntry.__redeleteEntry(\"" + aDocumentData + "\", \"" + aException + "\", \"" + aDeleteFinishedCallback + "\") invoked\n");

        if (aException) {
            // something went wrong
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:atom.js:AtomEntry.__redeleteEntry", aException);
            aDeleteFinishedCallback(aDocumentData, new AtomException("Yulup:atom.js:AtomEntry.__redeleteEntry: failed to delete Atom resource: \"" + aException + "\"."));
        } else {
            // authentication successful
            try {
                // retry delete operation
                this.deleteEntry(aDeleteFinishedCallback);
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:atom.js:AtomEntry.__redeleteEntry", exception);
                aDeleteFinishedCallback(aDocumentData, new AtomException("Yulup:atom.js:AtomEntry.__redeleteEntry: failed to delete Atom resource: \"" + exception + "\"."));
            }
        }
    },

    /**
     * Resolve prefixes used in XPath expressions to
     * namespaces.
     *
     * @param  {String} aPrefix a namespace prefix
     * @return {String} the namespace associated with the passed in prefix
     */
    __nsResolver: function (aPrefix) {
        var namespace = null;

        /* DEBUG */ dump("Yulup:atom.js:AtomEntry.__nsResolver(\"" + aPrefix + "\") invoked\n");

        var namespace = {
            "atom10" : ATOM_10_NAMESPACE
        };

        return namespace[aPrefix] || null;
    }
};


/**
 * APPParser constructor. Instantiates a new object of
 * type APPParser.
 *
 * Base class for versioned APP parsers.
 *
 * @constructor
 * @return {APPParser}
 */
function APPParser() {}


/**
 * AtomParser constructor. Instantiates a new object of
 * type AtomParser.
 *
 * Base class for versioned Atom parsers.
 *
 * @constructor
 * @return {AtomParser}
 */
function AtomParser() {}
