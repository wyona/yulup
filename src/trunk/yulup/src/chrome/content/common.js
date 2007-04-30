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

const YULUP_EXTENSION_ID = "yulup@wyona.com";
const YULUP_PREF_BRANCH  = "extensions.yulup.";
const NAMESPACE_XUL      = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const APPLOCALE_FALLBACK = "en";

const YulupPreferences = {
    __branch: null,

    __getBranch: function () {
        var preferences = null;

        if (!YulupPreferences.__branch) {
            YulupPreferences.__branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(YULUP_PREF_BRANCH);
        }

        return YulupPreferences.__branch;
    },

    /**
     * Add a preferences change observer to the specified branch.
     *
     * Note that you have to store the returned branch in a
     * durable place, because a) you have to call removeObserver
     * on that very same object in order to remove the observer,
     * and b) so that that the branch is not garbage collected
     * and the observer destroyed.
     *
     * @param  {String}      aBranch   the branch to add the observer to
     * @param  {nsIObserver} aObserver the observer to add
     * @return {nsIPrefBranch} the branch to which the observer was added
     */
    addObserver: function (aBranch, aObserver) {
        var branch = null;

        /* DEBUG */ dump("Yulup:common.js:YulupPreferences.addObserver(\"" + aBranch + "\", \"" + aObserver + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aBranch   != null);
        /* DEBUG */ YulupDebug.ASSERT(aObserver != null);

        if ((branch = YulupPreferences.__getBranch()) != null) {
            branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
            branch.addObserver(aBranch, aObserver, false);
        }

        return branch;
    },

    getBoolPref: function (aBranch, aItem) {
        var branch = null;

        /* DEBUG */ dump("Yulup:common.js:YulupPreferences.getBoolPref(\"" + aBranch + "\", \"" + aItem + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aBranch != null);
        /* DEBUG */ YulupDebug.ASSERT(aItem   != null);

        try {
            if ((branch = YulupPreferences.__getBranch()) != null) {
                return branch.getBoolPref(aBranch + aItem);
            } else {
                return null;
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupPreferences.getBoolPref", exception);
            /* DEBUG */ Components.utils.reportError(exception);
            return null;
        }
    },

    setBoolPref: function (aBranch, aItem, aValue) {
        var branch = null;

        /* DEBUG */ dump("Yulup:common.js:YulupPreferences.setBoolPref(\"" + aBranch + "\", \"" + aItem + "\", \"" + aValue + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aBranch != null);
        /* DEBUG */ YulupDebug.ASSERT(aItem   != null);
        /* DEBUG */ YulupDebug.ASSERT(aValue  != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aValue) == "boolean");

        try {
            if ((branch = YulupPreferences.__getBranch()) != null) {
                branch.setBoolPref(aBranch + aItem, aValue);
                return true;
            } else {
                return false;
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupPreferences.setBoolPref", exception);
            /* DEBUG */ Components.utils.reportError(exception);
            return false;
        }
    },

    getCharPref: function (aBranch, aItem) {
        var branch = null;

        /* DEBUG */ dump("Yulup:common.js:YulupPreferences.getCharPref(\"" + aBranch + "\", \"" + aItem + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aBranch != null);
        /* DEBUG */ YulupDebug.ASSERT(aItem   != null);

        try {
            if ((branch = YulupPreferences.__getBranch()) != null) {
                return branch.getCharPref(aBranch + aItem);
            } else {
                return null;
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupPreferences.getCharPref", exception);
            /* DEBUG */ Components.utils.reportError(exception);
            return null;
        }
    },

    setCharPref: function (aBranch, aItem, aValue) {
        var branch = null;

        /* DEBUG */ dump("Yulup:common.js:YulupPreferences.setCharPref(\"" + aBranch + "\", \"" + aItem + "\", \"" + aValue + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aBranch != null);
        /* DEBUG */ YulupDebug.ASSERT(aItem   != null);
        /* DEBUG */ YulupDebug.ASSERT(aValue  != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aValue) == "string");

        try {
            if ((branch = YulupPreferences.__getBranch()) != null) {
                branch.setCharPref(aBranch + aItem, aValue);
                return true;
            } else {
                return false;
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupPreferences.setCharPref", exception);
            /* DEBUG */ Components.utils.reportError(exception);
            return false;
        }
    },

    getIntPref: function (aBranch, aItem) {
        var branch = null;

        /* DEBUG */ dump("Yulup:common.js:YulupPreferences.getIntPref(\"" + aBranch + "\", \"" + aItem + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aBranch != null);
        /* DEBUG */ YulupDebug.ASSERT(aItem   != null);

        try {
            if ((branch = YulupPreferences.__getBranch()) != null) {
                return branch.getIntPref(aBranch + aItem);
            } else {
                return null;
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupPreferences.getIntPref", exception);
            /* DEBUG */ Components.utils.reportError(exception);
            return null;
        }
    },

    /**
     * Retrieve arbitrary prefs from the pref tree.
     *
     * @param  {String} aBranch the branch on which the pref lives
     * @param  {String} aItem   the pref item to retrieve
     * @param  {String} aType   the type of the pref (allowed values: "int")
     * @return {Object} the pref or null if the retrieval failed
     */
    getAnyPref: function (aBranch, aItem, aType) {
        var branch = null;
        var pref   = null;

        /* DEBUG */ dump("Yulup:common.js:YulupPreferences.getAnyPref(\"" + aBranch + "\", \"" + aItem + "\", \"" + aType + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aBranch != null);
        /* DEBUG */ YulupDebug.ASSERT(aItem   != null);
        /* DEBUG */ YulupDebug.ASSERT(aType   != null);

        try {
            branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(aBranch);

            if (branch) {
                switch (aType) {
                    case "int":
                        pref = branch.getIntPref(aItem);
                        break;
                    default:
                }
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupPreferences.getAnyPref", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        return pref;
    }
};


const YulupXMLServices = {
    escapeString: function (aString) {
        /* DEBUG */ YulupDebug.ASSERT(aString != null);

        const escapeRegExp = new RegExp('[<&]', "g");

        const escapeTable = {
            '<': "&lt;",
            '&': "&amp;"
        };

        function lookupReplacementChar(aChar) {
            return escapeTable[aChar];
        };

        return aString.replace(escapeRegExp, lookupReplacementChar);
    },

    escapeCDATAString: function (aString) {
        /* DEBUG */ YulupDebug.ASSERT(aString != null);

        var retString = null;

        const escapeRegExp = new RegExp('[<>&]', "g");

        const escapeTable = {
            '<': "&lt;",
            '>': "&gt;",
            '&': "&amp;"
        };

        function lookupReplacementChar(aChar) {
            return escapeTable[aChar];
        };

        return aString.replace(escapeRegExp, lookupReplacementChar);
    },

    /**
     * Check the well-formedness of a given document.
     *
     * @param {String}  aDocument the document to check
     * @return {String} a message containing the result of the check, or null if check successful
     */
    checkWellFormedness: function (aDocument) {
        var domParser              = null;
        var domDocument            = null;
        var rootElement            = null;
        var xmlSerialiser          = null;
        var sourceTextElement      = null;
        var parseErrorString       = null;
        var sourceTextString       = null;
        var parseErrorStringRegExp = null;
        var parseErrorArray        = null;
        var errorLine              = null;
        var errorColumn            = null;

        /* DEBUG */ dump("Yulup:common.js:YulupXMLServices.checkWellFormedness() invoked\n");

        domParser   = new DOMParser();
        domDocument = domParser.parseFromString(aDocument, "text/xml");

        rootElement = domDocument.documentElement;
        if ((rootElement.tagName == "parserError") ||
            (rootElement.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")) {
            xmlSerialiser = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);

            /* DEBUG */ dump("Yulup:common.js:YulupXMLServices.checkWellFormedness: well-formedness error:\n" + xmlSerialiser.serializeToString(rootElement) + "\n");

            // get parser error string
            parseErrorString = "";

            for (var child = rootElement.firstChild; child != null; child = child.nextSibling) {
                if (child.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                    parseErrorString += child.nodeValue;
                } else if (child.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE && child.tagName == "sourcetext") {
                    sourceTextElement = child;
                }
            }

            // extract line number
            parseErrorStringRegExp = new RegExp("[\\d]+[,]");
            parseErrorArray        = parseErrorStringRegExp.exec(parseErrorString);
            errorLine              = parseErrorArray[0].substring(0, parseErrorArray[0].length-1);

            // extract column
            parseErrorStringRegExp = new RegExp("[\\d]+[:]");
            parseErrorArray        = parseErrorStringRegExp.exec(parseErrorString);
            errorColumn            = parseErrorArray[0].substring(0, parseErrorArray[0].length-1);

            // get source text
            sourceTextString = "";

            if (sourceTextElement) {
                for (var child = sourceTextElement.firstChild; child != null; child = child.nextSibling) {
                    if (child.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                        sourceTextString += child.nodeValue;
                    }
                }
            }

            /* DEBUG */ dump("Yulup:common.js:YulupXMLServices.checkWellFormedness: well-formedness error, line number = " + errorLine + ", column = " + errorColumn + ", source text = " + sourceTextString + "\n");

            return { line: errorLine, column: errorColumn, sourceText: sourceTextString };
        } else {
            return null;
        }
    },

    createWellFormednessAlertString: function (aWellFormednessError) {
        var stringBundle = null;

        stringBundle = YulupLocalisationServices.getStringBundle("chrome://yulup/locale/editor.properties");

        return stringBundle.GetStringFromName("editorWellFormednessError0.label") + ": " + aWellFormednessError.line +
            ", " + stringBundle.GetStringFromName("editorWellFormednessError2.label") + ": " + aWellFormednessError.column +
            (aWellFormednessError.sourceText != "" ? "\n" + aWellFormednessError.sourceText : "");
    }
};


const YulupContentServices = {
    /**
     * Determines the content type of the given URI. If the
     * content type could not be determined, the fallback type
     * is returned.
     *
     * If no fallback type is specified, and the type sniffing
     * failed, null is returned.
     *
     * @param  {nsIURI} aURI          the URI for which the content type should be determined
     * @param  {String} aFallbackType  the type to fall back to if the content type could not be determined
     * @return {String}  returns the URI's content type or null if it could not be determined
     */
    getContentTypeFromURI: function (aURI, aFallbackType) {
        var mimeType = null;

        /* DEBUG */ YulupDebug.ASSERT(aURI != null);

        try {
            mimeType = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService).getTypeFromURI(aURI);
        } catch (exception) {
            // could not figure out MIME type, use fall back
            mimeType = aFallbackType;
        }

        return mimeType;
    },

    /**
     * Determines the content type of the given file. If the
     * content type could not be determined, the fallback type
     * is returned.
     *
     * If not fallback type is specified, and the type sniffing
     * failed, null is returned.
     *
     * @param  {nsIFile} aFile          the file for which the content type should be determined
     * @param  {String}  aFallbackType  the type to fall back to if the content type could not be determined
     * @return {String}  returns the file's content type or null if it could not be determined
     */
    getContentTypeFromFile: function (aFile, aFallbackType) {
        var mimeType = null;

        /* DEBUG */ YulupDebug.ASSERT(aFile != null);

        try {
            mimeType = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService).getTypeFromFile(aFile);
        } catch (exception) {
            // could not figure out MIME type, use fall back
            mimeType = aFallbackType;
        }

        return mimeType;
    }
};


const YulupAppServices = {
    getAppLocale: function () {
        var prefService = null;
        var locale      = null;

        const localePref = "general.useragent.locale";

        prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

        // the locale pref may be localised itself
        try {
            locale = prefService.getComplexValue(localePref, Components.interfaces.nsIPrefLocalizedString).data;
        } catch (exception) {
            ///* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupAppServices.getAppLocale", exception);
            ///* DEBUG */ Components.utils.reportError(exception);
        }

        if (locale)
            return locale;

        // the pref was not localised
        try {
            locale = prefService.getCharPref(localePref);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupAppServices.getAppLocale", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        if (locale)
            return locale;

        // we did not get anything out of the prefs
        return APPLOCALE_FALLBACK;
    },

    getMainBrowserWindow: function () {
        return window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIWebNavigation)
            .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
            .rootTreeItem
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindow);
    },

    generateUID: function () {
        return Date.now().toString() + "R" + Math.round(Math.random() * 100000).toString();
    }
};


const YulupLocalisationServices = {
    __stringBundleService: null,

    /**
     * Gets the stringbundle service.
     *
     * @return {nsIStringBundleService}  returns the stringbundle service, or null if an error occurred
     */
    getStringBundleService: function () {
        if (!this.__stringBundleService)
            this.__stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);

        return this.__stringBundleService;
    },

    /**
     * Gets the specified stringbundle.
     *
     * @param  {String} aStringBundleURI  the chrome URI where the stringbundle is located
     * @return {nsIStringBundle}  returns the requested stringbundle, or null if an error occurred
     */
    getStringBundle: function (aStringBundleURI) {
        var stringBundle = null;

        try {
            stringBundle = this.getStringBundleService().createBundle(aStringBundleURI);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupLocalisationServices.getStringBundle", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        return stringBundle;
    }
};


const YulupURIServices = {
    /**
     * Tries to create a relative URI from two absolute URIs. If
     * the URI can not be made relative, the URI is returned as-is.
     * If the given URI is the same as the base URI, the empty string
     * is returned.
     *
     * @param  {nsIURI} aURI      the URI to make relative
     * @param  {nsIURI} aBaseURI  the URI against which aURI should be made relative
     * @return {String} returns a potentially relative URI
     */
    makeRelative: function (aURI, aBaseURI) {
        var retval  = null;
        var baseURI = null;

        /* DEBUG */ dump("Yulup:common.js:YulupURIServices.makeRelative() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI     != null);
        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);

        try {
            baseURI = aBaseURI.QueryInterface(Components.interfaces.nsIURL);

            retval = baseURI.getRelativeSpec(aURI);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupURIServices.makeRelative", exception);
            /* DEBUG */ Components.utils.reportError(exception);

            retval = aURI.spec;
        }

        return retval;
    },

    /**
     * Resolves a given leaf name relative to a URI.
     *
     * @param  {nsIURI} aURI       the URI against which the leaf name should get resolved
     * @param  {String} aLeafName  the leaf name
     * @return {String} returns the resolved URI
     */
    resolveRelative: function (aURI, aLeafName) {
        if (aURI && aLeafName) {
            return aURI.resolve(aLeafName);
        } else {
            return null;
        }
    }
};


/**
 * YulupMessageProxy constructor. Instantiates a new object of
 * type YulupMessageProxy.
 *
 * @constructor
 * @param  {Object} aObject  the object to proxy
 * @return {YulupMessageProxy}
 */
function YulupMessageProxy(aObject) {
    /* DEBUG */ dump("Yulup:common.js:YulupMessageProxy() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aObject != null);

    this.__object   = aObject;
    this.__msgQueue = new Array();
}

YulupMessageProxy.prototype = {
    __ready   : false,
    __object  : null,
    __msgQueue: null,

    /**
     * Dispatches a message to the object bound to this
     * proxy. If the object has not yet signalled its
     * ready state, then the passed message is queued.
     *
     * @param  {String} aMethodName  the name of the method to call
     * @param  {Array}  aParamsArray  the parameters for the call, or null if no parameters
     * @return {Undefined}  does not have a return value
     */
    dispatchMessage: function (aMethodName, aParamsArray) {
        /* DEBUG */ dump("Yulup:common.js:YulupMessageProxy.dispatchMessage() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aMethodName != null);

        // add message to queue
        this.__msgQueue.push({ methodName: aMethodName, params: aParamsArray });

        // flush the queue
        this.flushQueue();
    },

    /**
     * Flushes the message queue. Flushing continues even
     * if one of the call throws an exception.
     *
     * @return {Undefined}  does not have a return value
     */
    flushQueue: function () {
        var message = null;

        /* DEBUG */ dump("Yulup:common.js:YulupMessageProxy.flushQueue() invoked\n");

        if (this.__ready) {
            while (this.__msgQueue.length > 0) {
                message = this.__msgQueue.shift();

                try {
                    // send message to the object
                    this.__object[message.methodName].apply(this.__object, message.params);
                } catch (exception) {
                    /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:common.js:YulupMessageProxy.flushQueue", exception);
                    /* DEBUG */ Components.utils.reportError(exception);
                }
            }
        }
    },

    /**
     * Sets the ready state and starts flushing the queue.
     *
     * @return {Undefined}  does not have a return value
     */
    setReady: function () {
        /* DEBUG */ dump("Yulup:common.js:YulupMessageProxy.setReady() invoked\n");

        this.__ready = true;

        this.flushQueue();
    }
};


function Barrier(aNoOfThreads, aCallback, aContext) {
    /* DEBUG */ dump("Yulup:common.js:Barrier() invoked\n");

    this.noOfThreads = aNoOfThreads;
    this.callback    = aCallback;
    this.context     = aContext;
}

Barrier.prototype = {
    noOfThreads: null,
    callback   : null,
    context    : null,

    arrive: function () {
        /* DEBUG */ dump("Yulup:common.js:Barrier.arrive() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT((this.noOfThreads - 1) >= 0);

        // warning: decrementing and testing is by NO MEANS guarded!
        if (--this.noOfThreads == 0) {
            /* DEBUG */ dump("Yulup:common.js:Barrier.arrive: calling callback\n");
            this.callback(this.context);
        }
    }
};

/**
 * YulupMultiMap constructor. Instantiates a new object of
 * type YulupMultiMap.
 *
 * YulupMultiMap is a map from {key} -> {value1, value2, ...},
 * i.e. the map can contain multiple values for the same key.
 *
 * @constructor
 * @return {YulupMultiMap}
 */
function YulupMultiMap() {
    this.__map = {};
}

YulupMultiMap.prototype = {
    __map: null,

    /**
     * Returns the set of keys.
     *
     * @return {Object}  returns the set of keys
     */
    keySet: function () {
        return this.__map;
    },

    /**
     * Puts a value into the map for the given key. The map
     * can store multiple values for the same key.
     *
     * Note though that the map does not check for duplicate
     * values for the same key.
     *
     * @param  {String} aKey    the key to which the value is associated
     * @param  {Object} aValue  the value to store, can be null
     * @return {Undefined}  does not have a return value
     */
    add: function (aKey, aValue) {
        /* DEBUG */ YulupDebug.ASSERT(aKey != null);

        if (!this.__map.hasOwnProperty(aKey))
            this.__map[aKey] = new Array();

        this.__map[aKey].push(aValue);
    },

    /**
     * Returns the values for the given key.
     *
     * @param  {String} aKey  the given for which the value should be retrieved
     * @return {Array}  returns an array of values, or an empty array if no entries exist for the given key
     */
    lookup: function (aKey) {
        var values = null;

        /* DEBUG */ YulupDebug.ASSERT(aKey != null);

        values = this.__map[aKey];

        return (values ? values : []);
    }
};


const YulupDebug = {
    /**
     * Dumps an exception to stdout, printing its message
     * as well as a stacktrace if available.
     *
     * @param  {String}    aLocation  location identifier from where this method was called
     * @param  {Error}     aException the exception to print
     * @return {Undefined} does not have a return value
     */
    dumpExceptionToConsole: function (aLocation, aException) {
        dump("EXCEPTION: " + aLocation + ": " + aException + "\n");
        if (aException)
            dump("STACKTRACE:" + (aException.stack ? "\n" + aException.stack : " not available") + "\n");
    },

    /**
     * Prints a string to stdout if the passed assertion failed.
     *
     * @param  {Boolean}   aAssertion            the assertion to test
     * @param  {String}    aLocation             where the assertion is stated [optional]
     * @param  {String}    aAssertionDescription a textual description of the assertion [optional]
     * @return {Undefined} does not have a return value
     */
    ASSERT: function (aAssertion, aLocation, aAssertionDescription) {
        var stackFrame = null;

        if (!aAssertion) {
            if (aLocation && aAssertionDescription) {
                dump("################## ASSERTION " + aAssertionDescription + " failed at " + aLocation + " (file: " + Components.stack.caller.filename + ", line: " + Components.stack.caller.lineNumber + ", caller: " +  Components.stack.caller.name + ")! ##################\n");
            } else {
                dump("################## ASSERTION failed at file: " + Components.stack.caller.filename + ", line: " + Components.stack.caller.lineNumber + ", caller: " +  Components.stack.caller.name + "! ##################\n");
            }

            // print call stack
            stackFrame = Components.stack.caller;

            while (stackFrame.caller) {
                stackFrame = stackFrame.caller;
                dump(stackFrame.name + "() at file " + stackFrame.filename + ", line " + stackFrame.lineNumber + "\n");
            }

            dump("\n");
        }
    }
};


const DOMSerialiser = {
    /**
     * Serialises to stdout the tree rooted at the passed node.
     *
     * @param  {nsIDOMNode} aNode the root of the tree to serialise
     * @return {Undefined}  does not have a return value
     */
    serialiseDOMTree: function (aNode) {
        var child = null;

        DOMSerialiser.emitNodeStart(aNode);

        for (child = aNode.firstChild; child != null; child = child.nextSibling) {
            DOMSerialiser.serialiseDOMTree(child);
        }

        DOMSerialiser.emitNodeEnd(aNode);
    },

    /**
     * Emits a textual representation of the passed DOM node.
     *
     * This method should be called before the subtree of the
     * node is visited.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Undefined}  does not have a return value
     */
    emitNodeStart: function (aNode) {
        switch (aNode.nodeType) {
            case 1:
                dump("<" + aNode.nodeName);

                if (aNode.hasAttributes()) {
                    // emit the attributes
                    for (var i = 0; i < aNode.attributes.length; i++) {
                        dump(" " + aNode.attributes.item(i).nodeName + "=\"" + aNode.attributes.item(i).nodeValue + "\"");
                    }
                }

                if (aNode.hasChildNodes()) {
                    dump(">");
                } else {
                    dump("/>");
                }
                break;
            case 3:
                dump(aNode.nodeValue);
                break;
            case 7:
                dump("<?" + aNode.target + " " + aNode.data + "?>");
                break;
            case 8:
                dump("<!--" + aNode.nodeValue + "-->");
                break;
            case 9:
                // the document itself; nothing to emit here
                break;
            case 10:
                // TODO: emit notations (see http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-412266927)
                dump("<!DOCTYPE " + aNode.name + (aNode.publicId ? " PUBLIC \"" + aNode.publicId + "\" " : " ")  + "\"" + aNode.systemId + "\">\n");
                break;
            default:
               dump("UNKNOWN node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered\n");
        }
    },

    /**
     * Emits a textual representation of the passed DOM node.
     *
     * This method should be called after the subtree of the
     * node was visited.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Undefined}  does not have a return value
     */
    emitNodeEnd: function (aNode) {
        switch (aNode.nodeType) {
            case 1:
                if (aNode.hasChildNodes()) {
                    dump("</" + aNode.nodeName + ">");
                }
                break;
            default:
        }
    }
};


/**
 * Instatiates a new object of the type ConfigurableNsResolver
 *
 * @param  {nsIXMLDocument} aDocument the xml document where namespaces and prefixes are read from
 * @return {Undefined}                does not have a return value
 */
function ConfigurableNsResolver(aDocument) {
    var sourceElements = null;
    var prefix         = null;
    var initialized    = false;

    /* DEBUG */ dump("Yulup:common.js:ConfigurableNsResolver() invoked\n");

    this.namespaces = new Array();

    sourceElements = aDocument.getElementsByTagName("*");

    for (var i=0; i < sourceElements.length; i++) {
        if (aDocument.documentElement.isDefaultNamespace(sourceElements.item(i).namespaceURI)) {
            /* DEBUG */ dump("Yulup:common.js:ConfigurableNsResolver: default namespace: " + sourceElements.item(i).namespaceURI + "\n");
        } else if ((prefix = sourceElements.item(i).prefix) != null) {
            if (!this.namespaces[prefix]) {
                this.namespaces[prefix] = sourceElements.item(i).namespaceURI;

                /* DEBUG */ dump("Yulup:common.js:ConfigurableNsResolver: added namespace prefix " + prefix + " with URI " + this.namespaces[prefix] + "\n");
            }
        }
    }
}

ConfigurableNsResolver.prototype = {
    namespaces: null,

    lookupNamespaceURI: function(aPrefix) {
        return this.namespaces[aPrefix] || null;
    }
};


/**
 * YulupException constructor. Instantiates a new object of
 * type YulupException.
 *
 * @constructor
 * @param  {String}         aMessage a descriptive error message
 * @return {YulupException}
 */
function YulupException(aMessage) {
    ///* DEBUG */ dump("Yulup:common.js:YulupException(" + aMessage + ") invoked\n");
    this.message = aMessage;
    this.name    = "YulupException";
}

YulupException.prototype.__proto__  = Error.prototype;


/**
 * YulupEditorException constructor. Instantiates a new object of
 * type YulupEditorException.
 *
 * @constructor
 * @param  {String}               aMessage a descriptive error message
 * @return {YulupEditorException}
 */
function YulupEditorException(aMessage) {
    ///* DEBUG */ dump("Yulup:common.js:YulupEditorException(" + aMessage + ") invoked\n");
    this.message = aMessage;
    this.name    = "YulupEditorException";
}

YulupEditorException.prototype.__proto__  = YulupException.prototype;
