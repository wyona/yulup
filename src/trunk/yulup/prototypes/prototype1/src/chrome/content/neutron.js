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
 * This module contains the code to communicate with a CMS
 * supporting the Neutron specification (see
 * http://www.wyona.org/osr-101/osr-101.xhtml).
 */

const NEUTRON_10_NAMESPACE = "http://www.wyona.org/neutron/1.0";

var Neutron = {
    /**
     * Fetch introspection file.
     *
     * @param  {String}       aURI     URI of remote host to query for introspection file
     * @param  {nsIURI}       aBaseURI the URI of the document to which the introspection document is associated
     * @return {Undefined}             does not have a return value
     */
    introspection: function (aURI, aBaseURI, aYulup) {
        var context = null;

        /* DEBUG */ dump("Yulup:neutron.js:Neutron.introspection(\"" + aURI + "\", \"" + aBaseURI + "\") invoked\n");

        context = {
            URI:              aURI,
            baseURI:          aBaseURI,
            yulup:            aYulup,
            callbackFunction: Neutron.introspectionLoadFinished
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

        /* DEBUG */ dump("Yulup:neutron.js:Neutron.__requestFinishedHandler() invoked\n");

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
        var xmlSerializer       = null;
        var introspection       = null;
        var aURI                = aContext.URI;
        var aBaseURI            = aContext.baseURI;
        var aYulup              = aContext.yulup;

        /* DEBUG */ dump("Yulup:neutron.js:Neutron.introspectionLoadFinished() invoked\n");

        try {
            if (aDocumentData) {
                /* DEBUG */ dump("Yulup:neutron.js:Neutron.introspection: loading introspection file \"" + aURI + "\" succeeded\n");

                if ((wellFormednessError = checkWellFormedness(aDocumentData)) != null) {
                    throw new YulupException(Neutron.createWellFormednessAlertString(wellFormednessError));
                }

                domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);

                domDocument  = domParser.parseFromString(aDocumentData, "text/xml");

                // instantiate the parser for this version and parse the file
                introspection = Neutron.parserFactory(domDocument, aBaseURI).parseIntrospection();

                introspection.introspectionDocument = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(domDocument);
                introspection.introspectionURI      = aURI;

                // set the global introspection object
                gCurrentNeutronIntrospection = introspection;

                // set the introspection state
                aYulup.introspectionStateChanged("success");

                /* DEBUG */ dump("Yulup:neutron.js:Neutron.introspectionLoadFinished: introspection = \n" + introspection.toString());
            } else {
                /* DEBUG */ dump("Yulup:neutron.js:Neutron.introspectionLoadFinished: failed to load \"" + aURI + "\"). \"" + aException + "\"\n");

                if (aException && (aException instanceof NeutronProtocolException || aException instanceof NeutronAuthException)) {
                    // report error message retrieved from response
                    throw new YulupException(document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadError0.label") + " \"" + aURI + "\".\n" + document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadServerError.label") + ": " + aException.message + ".");
                } else
                    throw new YulupException(document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadError0.label") + " \"" + aURI + "\".");
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:neutron.js:Neutron.introspectionLoadFinished", exception);

            alert(document.getElementById("uiYulupOverlayStringbundle").getString("yulupIntrospectionLoadFailure.label") + "\n\n" + exception.message);

            // set the introspection state
            aYulup.introspectionStateChanged("failed");
        }
    },

    createWellFormednessAlertString: function (aWellFormednessError) {
        return document.getElementById("uiYulupEditorStringbundle").getString("editorWellFormednessError0.label") + ": " + document.getElementById("uiYulupEditorStringbundle").getString("editorWellFormednessError1.label") + ": " + aWellFormednessError.line + ", " + document.getElementById("uiYulupEditorStringbundle").getString("editorWellFormednessError2.label") + ": " + aWellFormednessError.column + (aWellFormednessError.sourceText != "" ? "\n" + aWellFormednessError.sourceText : "");
    },

    /**
     * Parse a Neutron message (like e.g. an exception).
     *
     * The result of the parsing is always returend by throwing
     * an Error object.
     *
     * @param  {String}    aResponse a Neutron message as delivered by a request response
     * @return {Undefined} does not have a return value
     */
    response: function (aResponse) {
        var xmlDocument  = null;
        var documentRoot = null;
        var response     = null;

        /* DEBUG */ dump("Yulup:neutron.js:Neutron.response(\"" + aResponse + "\") invoked\n");

        // parse XML response to DOM
        xmlDocument = (new DOMParser()).parseFromString(aResponse, "text/xml");

        documentRoot = xmlDocument.documentElement;
        if ((documentRoot.tagName == "parserError") || (documentRoot.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")) {
            // problem parsing the response
            throw new NeutronException("Yulup:neutron.js:Neutron.response: Neutron response not well-formed. The response string was = \"" + aResponse + "\".");
        } else {
            // response ok, pass it on to the Neutron parser
            response = Neutron.parserFactory(xmlDocument, null).parseResponse();
        }

    },

    /**
     * Instantiates a parser corresponding to the Neutron version
     * used.
     *
     * @param  {nsIDOMXMLDocument} aDocument the Neutron document to parse
     * @param  {nsIRUI}            aBaseURI  the URI of the document to which the introspection document is associated
     * @return {NeutronParser}     the Neutron parser best matching the used Neutron version
     * @throws {NeutronException}
     */
    parserFactory: function (aDocument, aBaseURI) {
        var namespace     = null;
        var neutronParser = null;

        /* DEBUG */ dump("Yulup:neutron.js:Neutron.parserFactory(\"" + aDocument + "\", \"" + aBaseURI + "\") invoked\n");

        // extract Neutron version
        switch (aDocument.documentElement.namespaceURI) {
            case NEUTRON_10_NAMESPACE:
                // instantiate Neutron 1.0 parser
                neutronParser = new NeutronParser10(aDocument, aBaseURI);
                break;
            default:
                // no parser available for this version
                throw new NeutronException("Yulup:neutron.js:Neutron.parserFactory: Neutron version \"" + aDocument.documentElement.namespaceURI + "\" not supported.");
        }

        return neutronParser;
    },

    /**
     * Save an asset at the indicated path on the server.
     *
     * @param  {Asset}     aAsset the asset to save
     * @param  {String}    aPath  the location on the CMS where the asset should be saved
     * @return {Undefined}
     * @throws {Error}     NeutronTransactionException
     */
    save: function (aAsset, aPath) {
        // ...
    }
};


/* TODO: the Asset type is not used in Yulup, but may be used e.g.
 * in the Thunderbird/Suite/SeaMonkey CMSConnector.
 *
 * Should we retain it here nevertheless? */
/**
 * Asset constructor. Instantiates a new object of type Asset.
 *
 * @constructor
 * @param  {String} aContent   an URI to the file where the content resides
 * @param  {String} aAssetType the asset type of the asset
 * @return {Asset}  a new Asset object
 */
function Asset(aContent, aAssetType) {
    // private instance attributes
    content   = aContent;
    assetType = aAssetType;

    // privileged instance methods

    /**
     * Return the content URI.
     *
     * @return {String} the content URI
     */
    this.getContent = function () {
        return content;
    };

    /**
     * Return the asset type.
     *
     * @return {String} the asset type
     */
    this.getAssetType = function () {
        return assetType;
    };
}

/**
 * Introspection constructor. Instantiates a new object of
 * type Introspection.
 *
 * @constructor
 * @return {Introspection} a new Introspection object
 */
function Introspection() {
    /* DEBUG */ dump("neutron.js:Introspection() invoked\n");

    this.fragments = new Array();
}

Introspection.prototype = {
    introspectionDocument: null,
    introspectionURI:      null,
    fragments:             null,
    newAsset:              null,
    navigation:            null,

    /**
     * Get the introspection document source.
     *
     * @return {String} the Neutron document as retrieved from the remote host
     */
    getIntrospectionDocument: function () {
        return this.introspectionDocument;
    },

    /**
     * Get the URI where this introspection document is
     * located.
     *
     * @return {String} the URI of this introspection document
     */
    getIntrospectionURI: function () {
        return this.introspectionURI;
    },


    /**
     * Create a new fragment and add it to the fragments list.
     *
     * @return {Object} returns the newly created fragment
     */
    createNewFragment: function () {
        var fragment = null;

        fragment = {
            mimeType     : null,
            open         : this.createNewFileOperation(null, null),
            save         : this.createNewFileOperation(null, null),
            checkout     : this.createNewFileOperation(null, null),
            checkin      : this.createNewFileOperation(null, null),
            schemas      : null,
            styles       : null,
            styleTemplate: null,
            widgets      : null
        };

        this.fragments.push(fragment);

        return fragment;
    },

    createNewFileOperation: function (aURI, aMethod) {
        return {
            uri   : aURI,
            method: aMethod
        };
    },

    /**
     * Get the compatibility level of this object.
     *
     * @return {Undefined} does not have a return value
     */
    // THE SPECIFICATION MUST FIRST BE WRITTEN FOR THIS PART
    queryCompatibility: function () {
        // return compatibility level
    },

    /**
     * Get an array of fragments which can be loaded
     * using the Neutron "open" operation.
     *
     * This method returns a two-dimensional array, the
     * first dimension consisting of arrays of fragments.
     * The fragment array consists of the fragment string name
     * in field 0, and the fragment nsIURI in field 1.
     *
     * Note that the fragment order is retained as listed in
     * the introspection document.
     *
     * @return {Array} two-dimensional array containing all framgents which can be opened by the "open" operation
     */
    queryOpenFragments: function () {
        var fragments = new Array();
        var j         = 0;

        for (var i = 0; i < this.fragments.length; i++) {
            // check if fragment i supports open
            if (this.queryFragmentOpenURI(i)) {
                fragments[j] = [this.queryFragmentName(i), this.queryFragmentOpenURI(i)];
                /* DEBUG */ dump("Yulup:neutron.js:Introspection.queryOpenFragments: \"" + fragments[j][0] + "\", \"" + fragments[j][1] + "\"\n");
                j++;
            }
        }

        // return available fragments
        return fragments;
    },

    /**
     * Get an array of fragments which can be loaded
     * using the Neutron "checkout" operation.
     *
     * This method returns a two-dimensional array, the
     * first dimension consisting of arrays of fragments.
     * The fragment array consists of the fragment string name
     * in field 0, and the fragment nsIURI in field 1.
     *
     * Note that the fragment order is retained as listed in
     * the introspection document.
     *
     * @return {Array} two-dimensional array containing all framgents which can be opened by the "checkout" operation
     */
    queryCheckoutFragments: function () {
        var fragments = new Array();
        var j         = 0;

        for (var i = 0; i < this.fragments.length; i++) {
            // check if fragment i supports checkout
            if (this.queryFragmentCheckoutURI(i)) {
                fragments[j] = [this.queryFragmentName(i), this.queryFragmentCheckoutURI(i)];
                /* DEBUG */ dump("Yulup:neutron.js:Introspection.queryCheckoutFragments: \"" + fragments[j][0] + "\", \"" + fragments[j][1] + "\"\n");
                j++;
            }
        }

        // return available fragments
        return fragments;
    },

    /**
     * Return the name of the fragment for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {String}  the fragment name
     */
    queryFragmentName: function (aFragment) {
        // return name for fragment
        return this.fragments[aFragment].name;
    },

    /**
     * Return the MIME type of the fragment for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {String}  the MIME type
     */
    queryFragmentMIMEType: function (aFragment) {
        // return MIME type for fragment
        return this.fragments[aFragment].mimeType;
    },

    /**
     * Return the URI for the "open" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {nsIURI}  the "open" URI
     */
    queryFragmentOpenURI: function (aFragment) {
        // return open URI for fragment
        return this.fragments[aFragment].open.uri;
    },

    /**
     * Return the method for the "open" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {String}  the "open" method
     */
    queryFragmentOpenMethod: function (aFragment) {
        // return open method for fragment
        return this.fragments[aFragment].open.method;
    },

    /**
     * Return the URI for the "save" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {nsIURI}  the "save" URI
     */
    queryFragmentSaveURI: function (aFragment) {
        // return save URI for fragment
        return this.fragments[aFragment].save.uri;
    },

    /**
     * Return the method for the "save" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {String}  the "save" method
     */
    queryFragmentSaveMethod: function (aFragment) {
        // return save method for fragment
        return this.fragments[aFragment].save.method;
    },

    /**
     * Return the URI for the "checkout" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {nsIURI}  the "checkout" URI
     */
    queryFragmentCheckoutURI: function (aFragment) {
        // return checkout URI for fragment
        return this.fragments[aFragment].checkout.uri;
    },

    /**
     * Return the method for the "checkout" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {String}  the "checkout" method
     */
    queryFragmentCheckoutMethod: function (aFragment) {
        // return checkout method for fragment
        return this.fragments[aFragment].checkout.method;
    },

    /**
     * Return the URI for the "checkin" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {nsIURI}  the "checkin" URI
     */
    queryFragmentCheckinURI: function (aFragment) {
        // return checkin URI for fragment
        return this.fragments[aFragment].checkin.uri;
    },

    /**
     * Return the method for the "checkin" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {String}  the "checkin" method
     */
    queryFragmentCheckinMethod: function (aFragment) {
        // return checkin method for fragment
        return this.fragments[aFragment].checkin.method;
    },

    /**
     * Return the schemas associated with the fragment for the given
     * fragment identifier.
     *
     * Returns an array of objects.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {Array}   an array of objects
     */
    queryFragmentSchemas: function (aFragment) {
        // return available schemas for fragment
        return this.fragments[aFragment].schemas;
    },

    /**
     * Return the stylesheets associated with the fragment for the given
     * fragment identifier.
     *
     * Returns an array of objects.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {Array}   an array of objects
     */
    queryFragmentStyles: function (aFragment) {
        // return available style sheets for fragment
        return this.fragments[aFragment].styles;
    },

    /**
     * Return the styles template associated with the fragment for the given
     * fragment identifier.
     *
     * Returns a style template.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return a style template
     */

    queryFragmentStyleTemplate: function (aFragment) {
        // return available style template for fragment
        return this.fragments[aFragment].styleTemplate;
    },


    /**
     * Return a boolean value that determines wheter to load
     * template widgets or not.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {Boolean}           true if template widgets shall be loaded
     */
    queryTemplateWidgets: function (aFragment) {
        // return available widgets for fragment
        return this.fragments[aFragment].templateWidgets;
    },

    /**
     * Return the widgets associated with the fragment for the given
     * fragment identifier.
     *
     * Returns an array of objects.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {Array}   an array of objects
     */
    queryFragmentWidgets: function (aFragment) {
        // return available widgets for fragment
        return this.fragments[aFragment].widgets;
    },

    /**
     * Return the sitetree associated with the navigation.
     *
     * Returns an objects.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {Objrct}  an objects
     */
    queryNavigation: function () {
        // return available widgets for fragment
        return this.navigation;
    },


    /**
     * Return a string representation of this capabilities
     * object.
     *
     * @return {String} a string representation of this object
     */
    toString: function () {
        var objString = "";
        var xmlSerializer = null;

        xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);

        objString += "Introspection URI:    " + this.introspectionURI + "\n\n";

        // for all fragments, convert to string
        for (var i = 0; i < this.fragments.length; i++) {
            objString += "Fragment name:        " + this.fragments[i].name + "\n";
            objString += "Edit MIME-Type:       " + this.fragments[i].mimeType + "\n";
            objString += "Edit Open URI:        " + (this.fragments[i].open.uri ? this.fragments[i].open.uri.spec : this.fragments[i].open.uri) + "\n"; + "\n";
            objString += "Edit Open method:     " + this.fragments[i].open.method + "\n";
            objString += "Edit Save URI:        " + (this.fragments[i].save.uri ? this.fragments[i].save.uri.spec : this.fragments[i].save.uri) + "\n"; + "\n";
            objString += "Edit Save method:     " + this.fragments[i].save.method + "\n";
            objString += "Edit Checkin URI:     " + (this.fragments[i].checkin.uri ? this.fragments[i].checkin.uri.spec : this.fragments[i].checkin.uri) + "\n";
            objString += "Edit Checkin method:  " + this.fragments[i].checkin.method + "\n";
            objString += "Edit Checkout URI:    " + (this.fragments[i].checkout.uri ? this.fragments[i].checkout.uri.spec : this.fragments[i].checkout.uri) + "\n"; + "\n";
            objString += "Edit Checkout method: " + this.fragments[i].checkout.method + "\n";
            objString += "Edit Schemas:         ";
            if (this.fragments[i].schemas) {
                for (var j = 0; j < this.fragments[i].schemas.length; j++) {
                    objString += this.fragments[i].schemas[j].href.spec + " ";
                }
                objString += "\n";
            } else {
                objString += this.fragments[i].schemas + "\n";
            }

            objString += "Edit Styles:          ";
            if (this.fragments[i].styles) {
                for (var j = 0; j < this.fragments[i].styles.length; j++) {
                    objString += this.fragments[i].styles[j].href.spec + " ";
                }
                objString += "\n";
            } else {
                objString += this.fragments[i].styles + "\n";
            }


            objString += "Style Template:          " + (this.fragments[i].styleTemplate ? this.fragments[i].styleTemplate.uri.spec : "") + "\n";

            objString += "Widgets:\n";
            if (this.fragments[i].widgets) {
                for (var j=0; j < this.fragments[i].widgets.length; j++) {
                    if (this.fragments[i].widgets[j].iconURI) {
                        objString += this.fragments[i].widgets[j].iconURI.spec + "\", \"";
                        objString += this.fragments[i].widgets[j].icon + "\"\n";
                    }
                    if (this.fragments[i].widgets[j].attributes) {
                        objString += "Widget attributes: \n"
                        for (var name in this.fragments[i].widgets[j].attributes) {
                            objString += name + "=";
                            objString += this.fragments[i].widgets[j].attributes[name] + "\n";
                        }
                    }

                    if (this.fragments[i].widgets[j].fragmentAttributes) {
                        objString += "Fragment attributes: \n"
                        for (var k=0; k < this.fragments[i].widgets[j].fragmentAttributes.length; k++) {
                            objString += this.fragments[i].widgets[j].fragmentAttributes[k].name + " ";
                            objString += this.fragments[i].widgets[j].fragmentAttributes[k].xpath + "\n";
                        }
                    }

                    if (this.fragments[i].widgets[j].fragment) {
                        objString += "Fragment: \n";
                        objString += xmlSerializer.serializeToString(this.fragments[i].widgets[j].fragment);
                        objString += "\n";
                    }
                }
            }
        }

        if (this.navigation) {
            objString += "Navigation: \n"
            if (this.navigation.sitetree) {
                objString += "Sitetree: URI " + this.navigation.sitetree.uri.spec + " Method " + this.navigation.sitetree.method + "\n";
            }
        }

        return objString + "\n";
    }
};


/**
 * NeutronException constructor. Instantiates a new object of
 * type NeutronException.
 *
 * Exceptions of this type are not exceptions as thrown by the
 * server, but signal error conditions in the actual parser
 * or helper functions.
 *
 * @constructor
 * @param  {String}           aMessage a descriptive error message
 * @return {NeutronException}
 */
function NeutronException(aMessage) {
    this.message = aMessage;
    this.name    = "NeutronException";
}

NeutronException.prototype.__proto__ = Error.prototype;


/**
 * NeutronProtocolException constructor. Instantiates a new object of
 * type NeutronProtocolException.
 *
 * This is the base exception class to map Neutron exceptions thrown
 * by the server and sent via an XML document to an object. Implement
 * the actual exceptions specified in the Neutron protocol as subclasses
 * of this exception.
 *
 * Exception of this base class should not be thrown normally. But if
 * your parser encounters an unknown exception type, extract the message
 * and throw an exception of this type.
 *
 * @constructor
 * @param  {String}                   aMessage a descriptive error message
 * @return {NeutronProtocolException}
 */
function NeutronProtocolException(aMessage) {
    /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronProtocolException(\"" + aMessage + "\") invoked\n");

    this.message = aMessage;
    this.name    = "NeutronProtocolException";
}

NeutronProtocolException.prototype.__proto__ = Error.prototype;


/**
 * NeutronParser constructor. Instantiates a new object of
 * type NeutronParser.
 *
 * Base class for versioned Neutron parsers.
 *
 * @constructor
 * @return {NeutronParser}
 */
function NeutronParser() {}
