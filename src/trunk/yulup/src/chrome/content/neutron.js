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
 * This module contains the code to communicate with a CMS
 * supporting the Neutron specification (see
 * http://www.wyona.org/osr-101/osr-101.xhtml).
 */

const NEUTRON_10_NAMESPACE = "http://www.wyona.org/neutron/1.0";
const NEUTRON_20_NAMESPACE = "http://www.wyona.org/neutron/2.0";

var Neutron = {
    /**
     * Fetch introspection file.
     *
     * @param  {String}  aURI           the URI of the introspection document
     * @param  {nsIURI}  aAssociatedURI the URI of the document to which the introspection document is associated
     * @param  {Object}  aYulup         the Yulup object
     * @param  {Boolean} aAuthenticate  if authentication should take place during introspection document load, or we should fail
     * @return {Undefined}  does not have a return value
     */
    introspection: function (aURI, aAssociatedURI, aYulup, aAuthenticate) {
        var context = null;

        /* DEBUG */ dump("Yulup:neutron.js:Neutron.introspection(\"" + aURI + "\", \"" + aAssociatedURI + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI           != null);
        /* DEBUG */ YulupDebug.ASSERT(aAssociatedURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aYulup         != null);
        /* DEBUG */ YulupDebug.ASSERT(aAuthenticate  != null);

        context = {
            URI:              aURI,
            associatedURI:    aAssociatedURI,
            yulup:            aYulup,
            callbackFunction: Neutron.introspectionLoadFinished
        };

        NetworkService.httpRequestGET(aURI, null, this.__requestFinishedHandler, context, false, aAuthenticate, null);
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
    __requestFinishedHandler: function (aDocumentData, aResponseStatusCode, aContext, aResponseHeaders) {

        /* DEBUG */ dump("Yulup:neutron.js:Neutron.__requestFinishedHandler() invoked\n");

        if (NetworkService.isStatusSuccess(aResponseStatusCode)) {
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
    introspectionLoadFinished: function (aDocumentData, aException, aContext) {
        var wellFormednessError = null;
        var domParser           = null;
        var xmlSerializer       = null;
        var introspection       = null;
        var uri                 = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(aContext.URI, null, null);
        var associatedURI       = aContext.associatedURI;
        var yulup               = aContext.yulup;

        /* DEBUG */ dump("Yulup:neutron.js:Neutron.introspectionLoadFinished() invoked\n");

        try {
            if (aDocumentData) {
                /* DEBUG */ dump("Yulup:neutron.js:Neutron.introspection: loading introspection file \"" + uri.spec + "\" succeeded\n");

                if ((wellFormednessError = YulupXMLServices.checkWellFormedness(aDocumentData)) != null) {
                    throw new YulupException(YulupXMLServices.createWellFormednessAlertString(wellFormednessError));
                }

                domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);

                domDocument  = domParser.parseFromString(aDocumentData, "text/xml");

                // instantiate the parser for this version and parse the file
                introspection = Neutron.parserFactory(domDocument, uri).parseIntrospection();

                introspection.introspectionDocument = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(domDocument);
                introspection.associatedWithURI     = associatedURI;

                // set the global introspection object
                yulup.currentNeutronIntrospection = introspection;

                // set the introspection state
                yulup.introspectionStateChanged("success");

                /* DEBUG */ dump("Yulup:neutron.js:Neutron.introspectionLoadFinished: introspection object = \n" + introspection.toString());
            } else {
                /* DEBUG */ dump("Yulup:neutron.js:Neutron.introspectionLoadFinished: failed to load introspection document \"" + uri.spec + "\". \"" + aException + "\"\n");

                // set the introspection state
                if (aException instanceof NeutronProtocolException) {
                    yulup.introspectionStateChanged("auth-required", uri.spec);
                } else {
                    yulup.introspectionStateChanged("failed");
                }
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:neutron.js:Neutron.introspectionLoadFinished", exception);

            // set the introspection state
            yulup.introspectionStateChanged("failed");
        }
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

    parseWorkflowResponse: function (aResponse, aIntrospectionRoot, aResource) {
        var xmlDocument  = null;
        var documentRoot = null;
        var response     = null;

        /* DEBUG */ dump("Yulup:neutron.js:Neutron.parseWorkflowResponse(\"" + aResponse + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponse          != null);
        /* DEBUG */ YulupDebug.ASSERT(aIntrospectionRoot != null);
        /* DEBUG */ YulupDebug.ASSERT(aResource          != null);

        // parse XML response to DOM
        xmlDocument = (new DOMParser()).parseFromString(aResponse, "text/xml");

        documentRoot = xmlDocument.documentElement;
        if ((documentRoot.tagName == "parserError") || (documentRoot.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")) {
            // problem parsing the response
            throw new NeutronException("Yulup:neutron.js:Neutron.parseWorkflowResponse: Neutron response not well-formed. The response string was = \"" + aResponse + "\".");
        } else {
            // response ok, pass it on to the Neutron parser
            response = Neutron.parserFactory(xmlDocument, aIntrospectionRoot.associatedWithURI).parseWorkflowResponse(aIntrospectionRoot, aResource);
        }

        return response;
    },

    /**
     * Instantiates a parser corresponding to the Neutron version
     * used.
     *
     * @param  {nsIDOMXMLDocument} aDocument the Neutron document to parse
     * @param  {nsIRUI}            aBaseURI  the URI of the Neutron document
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
            case NEUTRON_20_NAMESPACE:
                // instantiate Neutron 2.0 parser
                neutronParser = new NeutronParser20(aDocument, aBaseURI);
                break;
            default:
                // no parser available for this version
                throw new NeutronException("Yulup:neutron.js:Neutron.parserFactory: Neutron version \"" + aDocument.documentElement.namespaceURI + "\" not supported.");
        }

        return neutronParser;
    }
};


/**
 * NeutronIntrospection constructor. Instantiates a new object of
 * type NeutronIntrospection.
 *
 * @constructor
 * @param  {nsIURI} aURI                 the URI of the introspection document
 * @param  {String} aCompatibilityLevel  the namespace associated with the introspection document
 * @return {NeutronIntrospection} returns a new NeutronIntrospection object
 */
function NeutronIntrospection(aURI, aCompatibilityLevel) {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronIntrospection(\"" + aURI + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aURI                != null);
    /* DEBUG */ YulupDebug.ASSERT(aCompatibilityLevel != null);

    this.introspectionURI   = aURI.spec;
    this.compatibilityLevel = aCompatibilityLevel;

    this.fragments = new Array();
}

NeutronIntrospection.prototype = {
    associatedWithURI    : null,
    compatibilityLevel   : null,
    introspectionDocument: null,
    introspectionURI     : null,
    fragments            : null,
    newAsset             : null,
    navigation           : null,

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
     * Get the compatibility level of this object.
     *
     * @return {Undefined} does not have a return value
     */
    queryCompatibility: function () {
        return this.compatibilityLevel;
    },

    hasSitetreeURI: function () {
        if (this.queryNavigation()          &&
            this.queryNavigation().sitetree &&
            this.queryNavigation().sitetree.uri)
            return true;

        return false;
    },

    getSitetreeURI: function () {
        return this.queryNavigation().sitetree.uri;
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
                /* DEBUG */ dump("Yulup:neutron.js:NeutronIntrospection.queryOpenFragments: \"" + fragments[j][0] + "\", \"" + fragments[j][1] + "\"\n");
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
                /* DEBUG */ dump("Yulup:neutron.js:NeutronIntrospection.queryCheckoutFragments: \"" + fragments[j][0] + "\", \"" + fragments[j][1] + "\"\n");
                j++;
            }
        }

        // return available fragments
        return fragments;
    },

    /**
     * Get an array of fragments which can be deleted
     * using the Neutron "delete" operation.
     *
     * This method returns a two-dimensional array, the
     * first dimension consisting of arrays of fragments.
     * The fragment array consists of the fragment string name
     * in field 0, and the fragment nsIURI in field 1.
     *
     * Note that the fragment order is retained as listed in
     * the introspection document.
     *
     * @return {Array} two-dimensional array containing all framgents which can be deleted by the "delete" operation
     */
    queryDeleteFragments: function () {
        var fragments = new Array();
        var j         = 0;

        for (var i = 0; i < this.fragments.length; i++) {
            // check if fragment i supports checkout
            if (this.queryFragmentDeleteURI(i)) {
                fragments[j] = [this.queryFragmentName(i), this.queryFragmentDeleteURI(i)];
                /* DEBUG */ dump("Yulup:neutron.js:NeutronIntrospection.queryDeleteFragments: \"" + fragments[j][0] + "\", \"" + fragments[j][1] + "\"\n");
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
     * Return the URI for the "release-lock" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {nsIURI}  the "release-lock" URI
     */
    queryFragmentReleaseLockURI: function (aFragment) {
        // return release-lock URI for fragment
        return (this.fragments[aFragment].releaseLock ? this.fragments[aFragment].releaseLock.uri : null);
    },

    /**
     * Return the method for the "release-lock" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {String}  the "release-lock" method
     */
    queryFragmentReleaseLockMethod: function (aFragment) {
        // return release-lock method for fragment
        return (this.fragments[aFragment].releaseLock ? this.fragments[aFragment].releaseLock.method : null);
    },

    /**
     * Return the URI for the "delete" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {nsIURI}  the "delete" URI
     */
    queryFragmentDeleteURI: function (aFragment) {
        // return delete URI for fragment
        return (this.fragments[aFragment].remove ? this.fragments[aFragment].remove.uri : null);
    },

    /**
     * Return the method for the "delete" operation for the given
     * fragment identifier.
     *
     * @param  {Integer} aFragment a fragment identifier
     * @return {String}  the "delete" method
     */
    queryFragmentDeleteMethod: function (aFragment) {
        // return delete method for fragment
        return (this.fragments[aFragment].remove ? this.fragments[aFragment].remove.method : null);
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
    __requestFinishedHandler: function (aDocumentData, aResponseStatusCode, aContext, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:neutron.js:NeutronIntrospection.__requestFinishedHandler() invoked\n");

        if (aException) {
            aContext.callbackFunction(null, aException, aContext);
            return;
        }

        if (NetworkService.isStatusSuccess(aResponseStatusCode)) {
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
     * Return a string representation of this capabilities
     * object.
     *
     * @return {String} a string representation of this object
     */
    toString: function () {
        var objString = "";

        objString += "Introspection URI:    " + this.introspectionURI + "\n\n";

        // for all fragments, convert to string
        for (var i = 0; i < this.fragments.length; i++) {
            objString += this.fragments[i].toString();
        }

        objString += "Navigation: \n";
        if (this.navigation) {
            if (this.navigation.sitetree) {
                objString += "Sitetree URI:         " + (this.navigation.sitetree.uri ? this.navigation.sitetree.uri.spec : this.navigation.sitetree.uri) + "\n";
                objString += "Sitetree method:      " + this.navigation.sitetree.method + "\n";
            }
        }

        return objString + "\n";
    }
};


/**
 * NeutronResource constructor. Instantiates a new object of
 * type NeutronResource.
 *
 * @constructor
 * @return {NeutronResource}
 */
function NeutronResource() {
    this.versions = new Array();
}

NeutronResource.prototype = {
    name           : null,
    mimeType       : null,
    open           : null,
    save           : null,
    checkout       : null,
    checkin        : null,
    releaseLock    : null,
    remove         : null,
    schemas        : null,
    styles         : null,
    styleTemplate  : null,
    widgets        : null,
    templateWidgets: null,
    versions       : null,

    toString: function () {
        var objString = "";

        objString += "Resource name:            " + this.name + "\n";
        objString += "Edit MIME-Type:           " + this.mimeType + "\n";
        if (this.open) {
            objString += "Edit Open URI:            " + (this.open.uri ? this.open.uri.spec : this.open.uri) + "\n"; + "\n";
            objString += "Edit Open method:         " + this.open.method + "\n";
        }
        if (this.save) {
            objString += "Edit Save URI:            " + (this.save.uri ? this.save.uri.spec : this.save.uri) + "\n"; + "\n";
            objString += "Edit Save method:         " + this.save.method + "\n";
        }
        if (this.checkin) {
            objString += "Edit Checkin URI:         " + (this.checkin.uri ? this.checkin.uri.spec : this.checkin.uri) + "\n";
            objString += "Edit Checkin method:      " + this.checkin.method + "\n";
        }
        if (this.checkout) {
            objString += "Edit Checkout URI:        " + (this.checkout.uri ? this.checkout.uri.spec : this.checkout.uri) + "\n"; + "\n";
            objString += "Edit Checkout method:     " + this.checkout.method + "\n";
        }
        if (this.releaseLock) {
            objString += "Edit Release Lock URI:    " + (this.releaseLock.uri ? this.releaseLock.uri.spec : this.releaseLock.uri) + "\n"; + "\n";
            objString += "Edit Release Lock method: " + this.releaseLock.method + "\n";
        }
        objString += "Edit Schemas:             ";
        if (this.schemas) {
            for (var i = 0; i < this.schemas.length; i++) {
                objString += this.schemas[i].href.spec + " ";
            }
            objString += "\n";
        } else {
            objString += this.schemas + "\n";
        }

        objString += "Edit Styles:          ";
        if (this.styles) {
            for (var i = 0; i < this.styles.length; i++) {
                objString += this.styles[i].href.spec + " ";
            }
            objString += "\n";
        } else {
            objString += this.styles + "\n";
        }

        objString += "Style Template:       " + (this.styleTemplate ? this.styleTemplate.uri.spec : this.styleTemplate) + "\n";

        objString += "Widgets:\n";
        if (this.widgets) {
            for (var i = 0; i < this.widgets.length; i++) {
                objString += this.widgets[i].toString();
            }
        }

        objString += "Versions:\n";
        if (this.versions) {
            for (var i = 0; i < this.versions.length; i++) {
                objString += this.versions[i].toString();
            }
        }

        if (this.remove) {
            objString += "Delete URI:               " + (this.remove.uri ? this.remove.uri.spec : this.remove.uri) + "\n"; + "\n";
            objString += "Delete method:            " + this.remove.method + "\n";
        }

        return objString;
    }
};


/**
 * NeutronWidget constructor. Instantiates a new object of
 * type NeutronWidget.
 *
 * Base class for versioned Neutron widgets.
 *
 * @constructor
 * @return {NeutronWidget}
 */
function NeutronWidget() {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronWidget() invoked\n");

    this.id = YulupAppServices.generateUID();
}

NeutronWidget.prototype = {
    id: null,

    __name     : null,
    __nameCache: null,
    __desc     : null,
    __descCache: null,

    icon    : null,
    iconURI : null,
    surround: null,
    insert  : null,

    set name(aValue) {
        var name = {};

        if (aValue) {
            for (var i = 0; i < aValue.length; i++) {
                name[aValue[i][0]] = aValue[i][1];
            }
        }

        this.__name = name;
    },

    get name() {
        if (!this.__nameCache)
            this.__nameCache = YulupLocalisationServices.getByLang(this.__name, YulupAppServices.getAppLocale());

        return this.__nameCache;
    },

    set description(aValue) {
        var desc = {};

        if (aValue) {
            for (var i = 0; i < aValue.length; i++) {
                desc[aValue[i][0]] = aValue[i][1];
            }
        }

        this.__desc = desc;
    },

    get description() {
        if (!this.__descCache)
            this.__descCache = YulupLocalisationServices.getByLang(this.__desc, YulupAppServices.getAppLocale());

        return this.__descCache;
    },

    supportsActionSurround: function () {
        return (this.surround != null);
    },

    supportsActionInsert: function () {
        return (this.insert != null);
    },

    getSurroundActionFragment: function () {
        if (!this.surround)
            return null;

        return this.surround.fragment;
    },

    getInsertActionFragment: function () {
        if (!this.insert)
            return null;

        return this.insert.fragment;
    },

    toString: function () {
        var objString = null;

        objString = "Widget \"" + this.name + "\" (" + this.description + ")\n";

        objString += "Icon URI: " + (this.iconURI ? this.iconURI.spec : this.iconURI) + "\n";
        objString += "Icon:     " + this.icon + "\n";

        objString += "Surround action:\n"
        if (this.surround) {
            objString += this.surround.toString();
        } else {
            objString += this.surround + "\n";
        }

        objString += "Insert action:\n"
        if (this.insert) {
            objString += this.insert.toString();
        } else {
            objString += this.insert + "\n";
        }

        return objString;
    }
};


/**
 * NeutronWidgetGroup constructor. Instantiates a new object of
 * type NeutronWidgetGroup.
 *
 * Base class for versioned Neutron widget groups.
 *
 * @constructor
 * @return {NeutronWidgetGroup}
 */
function NeutronWidgetGroup() {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronWidgetGroup() invoked\n");

    this.widgets = new Array();
}

NeutronWidgetGroup.prototype = {
    __name     : null,
    __nameCache: null,
    __desc     : null,
    __descCache: null,

    widgets: null,

    set name(aValue) {
        var name = {};

        if (aValue) {
            for (var i = 0; i < aValue.length; i++) {
                name[aValue[i][0]] = aValue[i][1];
            }
        }

        this.__name = name;
    },

    get name() {
        if (!this.__nameCache)
            this.__nameCache = YulupLocalisationServices.getByLang(this.__name, YulupAppServices.getAppLocale());

        return this.__nameCache;
    },

    set description(aValue) {
        var desc = {};

        if (aValue) {
            for (var i = 0; i < aValue.length; i++) {
                desc[aValue[i][0]] = aValue[i][1];
            }
        }

        this.__desc = desc;
    },

    get description() {
        if (!this.__descCache)
            this.__descCache = YulupLocalisationServices.getByLang(this.__desc, YulupAppServices.getAppLocale());

        return this.__descCache;
    },

    toString: function () {
        var objString = "";

        objString += "WidgetGroup \"" + this.name + "\" (" + this.description + ")\n";
        for (var i = 0; i < this.widgets.length; i++) {
            objString += this.widgets[i].toString();
        }

        return objString;
    }
};


/**
 * NeutronWidgetAction constructor. Instantiates a new object of
 * type NeutronWidgetAction.
 *
 * Base class for versioned Neutron widget actions.
 *
 * @constructor
 * @return {NeutronWidgetAction}
 */
function NeutronWidgetAction() {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronWidgetAction() invoked\n");
}

NeutronWidgetAction.prototype = {
    parameters: null,
    fragment  : null,

    toString: function () {
        var objString     = "";
        var xmlSerializer = null;

        xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);

        objString += "Action parameters:\n"
        if (this.parameters) {
            for (var i = 0; i < this.parameters.length; i++) {
                objString += this.parameters[i].toString();
            }
        } else {
            objString += this.parameters + "\n";
        }

        objString += "Fragment:\n";
        if (this.fragment) {
            objString += xmlSerializer.serializeToString(this.fragment);
            objString += "\n";
        } else {
            objString += this.fragment + "\n";
        }

        return objString;
    }
};


/**
 * NeutronWidgetActionParameter constructor. Instantiates a new object of
 * type NeutronWidgetActionParameter.
 *
 * Base class for versioned Neutron widget action parameters.
 *
 * @constructor
 * @return {NeutronWidgetActionParameter}
 */
function NeutronWidgetActionParameter() {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronWidgetActionParameter() invoked\n");

    this.id = YulupAppServices.generateUID();
}

NeutronWidgetActionParameter.prototype = {
    id: null,

    __name     : null,
    __nameCache: null,
    __desc     : null,
    __descCache: null,

    xpath: null,
    type : null,

    set name(aValue) {
        var name = {};

        if (aValue) {
            for (var i = 0; i < aValue.length; i++) {
                name[aValue[i][0]] = aValue[i][1];
            }
        }

        this.__name = name;
    },

    get name() {
        if (!this.__nameCache)
            this.__nameCache = YulupLocalisationServices.getByLang(this.__name, YulupAppServices.getAppLocale());

        return this.__nameCache;
    },

    set description(aValue) {
        var desc = {};

        if (aValue) {
            for (var i = 0; i < aValue.length; i++) {
                desc[aValue[i][0]] = aValue[i][1];
            }
        }

        this.__desc = desc;
    },

    get description() {
        if (!this.__descCache)
            this.__descCache = YulupLocalisationServices.getByLang(this.__desc, YulupAppServices.getAppLocale());

        return this.__descCache;
    },

    toString: function () {
        var objString = "";

        objString += "Action parameter \"" + this.name + "\" (" + this.description + ")\n";
        objString += "XPath: " + this.xpath + "\n";
        objString += "Type:  " + this.type + "\n";

        return objString;
    }
};


/**
 * NeutronResourceVersion constructor. Instantiates a new object of
 * type NeutronResourceVersion.
 *
 * Base class for versioned Neutron resource versions.
 *
 * @constructor
 * @return {NeutronResourceVersion}
 */
function NeutronResourceVersion(aResource) {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronResourceVersion() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aResource != null);

    this.resource = aResource;
}

NeutronResourceVersion.prototype = {
    resource           : null,
    url                : null,
    comment            : null,
    date               : null,
    user               : null,
    revision           : null,
    workflowState      : null,
    workflowTransitions: null,
    workflowHistory    : null,

    getWorkflowState: function () {
        return this.workflowState;
    },

    getWorkflowTransitions: function () {
        if (this.workflowTransitions && this.workflowTransitions.length > 0)
            return this.workflowTransitions;

        return null;
    },

    getWorkflowHistory: function () {
        if (this.workflowHistory && this.workflowHistory.length > 0)
            return this.workflowHistory;

        return null;
    },

    toString: function () {
        var objString = null;

        objString = "Version (\"" + (this.url ? this.url.spec : this.url) + "\")\n";

        objString += "Comment:  " + this.comment + "\n";
        objString += "Date:     " + this.date + "\n";
        objString += "User:     " + this.user + "\n";
        objString += "Revision: " + this.revision + "\n";

        objString += "Workflow state:\n"
        if (this.workflowState) {
            objString += this.workflowState.toString();
        } else {
            objString += this.workflowState + "\n";
        }

        objString += "Workflow transitions:\n"
        if (this.workflowTransitions) {
            for (var i = 0; i < this.workflowTransitions.length; i++) {
                objString += this.workflowTransitions[i].toString();
            }
        } else {
            objString += this.workflowTransitions + "\n";
        }

        objString += "Workflow history:\n"
        if (this.workflowHistory) {
            for (var i = 0; i < this.workflowHistory.length; i++) {
                objString += this.workflowHistory[i].toString();
            }
        } else {
            objString += this.workflowHistory + "\n";
        }

        return objString;
    }
};


/**
 * NeutronWorkflowState constructor. Instantiates a new object of
 * type NeutronWorkflowState.
 *
 * Base class for versioned Neutron workflow states.
 *
 * @constructor
 * @return {NeutronWorkflowState}
 */
function NeutronWorkflowState() {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronWorkflowState() invoked\n");
}

NeutronWorkflowState.prototype = {
    state: null,
    date : null,

    toString: function () {
        return "State: \"" + this.state + "\" (" + this.date + ")\n";
    }
};


/**
 * NeutronWorkflowTransition constructor. Instantiates a new object of
 * type NeutronWorkflowTransition.
 *
 * Base class for versioned Neutron workflow transitions.
 *
 * @constructor
 * @return {NeutronWorkflowTransition}
 */
function NeutronWorkflowTransition(aIntrospectionRoot, aVersion) {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronWorkflowTransition() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aIntrospectionRoot != null);
    /* DEBUG */ YulupDebug.ASSERT(aVersion           != null);

    this.__introspectionRoot = aIntrospectionRoot;
    this.__version           = aVersion;
}

NeutronWorkflowTransition.prototype = {
    __introspectionRoot: null,
    __version          : null,
    __desc             : null,
    __descCache        : null,

    id    : null,
    to    : null,
    url   : null,
    method: null,

    set description(aValue) {
        var desc = {};

        if (aValue) {
            for (var i = 0; i < aValue.length; i++) {
                desc[aValue[i][0]] = aValue[i][1];
            }
        }

        this.__desc = desc;
    },

    get description() {
        if (!this.__descCache)
            this.__descCache = YulupLocalisationServices.getByLang(this.__desc, YulupAppServices.getAppLocale());

        return this.__descCache;
    },

    /**
     * Performs a workflow transition.
     *
     * @return {Undefined} does not have a return value
     */
    execute: function () {
        var context = null;
        var request = null;
        var me      = this;

        /* DEBUG */ dump("Yulup:neutron.js:NeutronWorkflowTransition.execute() invoked\n");

        request = this.__introspectionRoot.generateWorkflowRequest(this, this.__version);

        context = {
            callbackFunction: function (aDocumentData, aException, aContext) {
                me.__workflowTransitionFinishedHandler(aDocumentData, aException, aContext);
            },
            transition      : this
        };

        switch (this.method) {
            case "PUT":
                NetworkService.httpRequestPUT(this.url.spec, null, request, "application/xml", this.__introspectionRoot.__requestFinishedHandler, context, false, true, null);
                break;
            case "POST":
                NetworkService.httpRequestPOST(this.url.spec, null, request, "application/xml", this.__introspectionRoot.__requestFinishedHandler, context, false, true, null);
                break;
            default:
        }
    },

    __workflowTransitionFinishedHandler: function (aDocumentData, aException, aContext) {
        var stringBundle = null;

        /* DEBUG */ dump("Yulup:neutron.js:NeutronWorkflowTransition.__workflowTransitionFinishedHandler() invoked\n");

        stringBundle = YulupLocalisationServices.getStringBundle("chrome://yulup/locale/neutron.properties");

        if (aException) {
            // an error occurred

            if (aException instanceof NeutronProtocolException) {
                // show intended state
                alert(stringBundle.formatStringFromName("transitionFailed.label", [aContext.transition.to, aException.message], 2));
            } else {
                // show intended state
                alert(stringBundle.formatStringFromName("transitionFailed.label", [aContext.transition.to, aException], 2));
            }
        } else {
            try {
                // replace old workflow element with response from server
                Neutron.parseWorkflowResponse(aDocumentData, this.__introspectionRoot, this.__version.resource);
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:neutron.js:NeutronWorkflowTransition.__workflowTransitionFinishedHandler", exception);
                /* DEBUG */ Components.utils.reportError(exception);

                alert(stringBundle.formatStringFromName("transitionFailed.label", [aContext.transition.to, exception], 2));

                return;
            }

            // success, show actual new state
            alert(stringBundle.GetStringFromName("transitionSucceeded.label"));
        }
    },

    toString: function () {
        return "Transition: id = \"" + this.id + "\", to = \"" + this.to + "\", description = \"" + this.description + "\", url = \"" + (this.url ? this.url.spec : this.url) + "\", method = \"" + this.method + "\"\n";
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
    /* DEBUG */ dump("Yulup:neutron.js:NeutronProtocolException(\"" + aMessage + "\") invoked\n");

    this.message = aMessage;
    this.name    = "NeutronProtocolException";
}

NeutronProtocolException.prototype.__proto__ = Error.prototype;


/**
 * NeutronProtocolCheckinException constructor.
 * Instantiates a new object of type
 * NeutronProtocolCheckinException.
 *
 * @constructor
 * @param  {String}                          aMessage a descriptive error message
 * @return {NeutronProtocolCheckinException}
 */
function NeutronProtocolCheckinException(aMessage) {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronProtocolCheckinException(\"" + aMessage + "\") invoked\n");

    NeutronProtocolException.call(this, aMessage);

    this.name = "NeutronProtocolCheckinException";
}

/**
 * @field {String} aURL       the URI of the document on which the error occurred
 * @field {String} aLockedBy  the name of the user who holds the current lock
 * @field {String} aBreakLock a URI to GET which breaks the current lock
 */
NeutronProtocolCheckinException.prototype = {
    __proto__: NeutronProtocolException.prototype,

    url:       null,
    lockedBy:  null,
    breakLock: null
};


/**
 * NeutronProtocolDataNotWellFormedException constructor.
 * Instantiates a new object of type
 * NeutronProtocolDataNotWellFormedException.
 *
 * @constructor
 * @param  {String}                                    aMessage a descriptive error message
 * @return {NeutronProtocolDataNotWellFormedException}
 */
function NeutronProtocolDataNotWellFormedException(aMessage) {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronProtocolDataNotWellFormedException(\"" + aMessage + "\") invoked\n");

    NeutronProtocolException.call(this, aMessage);

    this.name = "NeutronProtocolDataNotWellFormedException";
}

/**
 * @field {String} aURL        the URI of the document on which the error occurred
 * @field {String} aLineNumber the line number on which the error occurred
 * @field {String} aError      the actual problem in the document as reported by the validator
 */
NeutronProtocolDataNotWellFormedException.prototype = {
    __proto__: NeutronProtocolException.prototype,

    url:        null,
    lineNumber: null,
    error:      null
};


/**
 * NeutronProtocolWorkflowException constructor.
 * Instantiates a new object of type
 * NeutronProtocolWorkflowException.
 *
 * @constructor
 * @param  {String}                           aMessage  a descriptive error message
 * @return {NeutronProtocolWorkflowException}
 */
function NeutronProtocolWorkflowException(aMessage) {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronProtocolWorkflowException(\"" + aMessage + "\") invoked\n");

    NeutronProtocolException.call(this, aMessage);

    this.name = "NeutronProtocolWorkflowException";
}

NeutronProtocolWorkflowException.prototype = {
    __proto__: NeutronProtocolException.prototype
};


/**
 * NeutronParser constructor. Instantiates a new object of
 * type NeutronParser.
 *
 * Base class for versioned Neutron parsers.
 *
 * @constructor
 * @return {NeutronParser}
 */
function NeutronParser() {
    /* DEBUG */ dump("Yulup:neutron.js:NeutronParser() invoked\n");
}

NeutronParser.prototype = {};
