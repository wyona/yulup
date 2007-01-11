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
 * This module contains the code to communicate with a
 * server supporting the APP specification (see
 * http://bitworking.org/projects/atom/draft-ietf-atompub-protocol-09.html).
 */

/**
 * APPParser09 constructor. Instantiates a new object of
 * type APPParser09.
 *
 * @constructor
 * @param  {nsIDOMXMLDocument} aDocument the APP introspection document to parse
 * @param  {String}            aBaseURI  the URI of the introspection document
 * @return {APPParser09}
 */
function APPParser09(aDocument, aBaseURI) {
    /* DEBUG */ dump("Yulup:appparser09.js:APPParser09(\"" + aDocument + "\", \"" + aBaseURI + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aDocument != null, "Yulup:appparser09.js:APPParser09", "aDocument != null");
    /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null, "Yulup:appparser09.js:APPParser09", "aBaseURI != null");

    // call super constructor
    APPParser.call(this);

    this.ioService     = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    this.xmlSerialiser = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);
    this.documentDOM   = aDocument;
    this.baseURI       = this.ioService.newURI(aBaseURI, null, null);
}

APPParser09.prototype = {
    __proto__: APPParser,

    ioService    : null,
    xmlSerialiser: null,
    documentDOM  : null,
    baseURI      : null,

    /**
     * Resolve prefixes used in XPath expressions to
     * namespaces.
     *
     * @param  {String} aPrefix a namespace prefix
     * @return {String} the namespace associated with the passed in prefix
     */
    nsResolver: function (aPrefix) {
        var namespace = null;

        /* DEBUG */ dump("Yulup:appparser09.js:APPParser09.nsResolver(\"" + aPrefix + "\") invoked\n");

        var namespace = {
            "app09" : APP_09_NAMESPACE
        };

        return namespace[aPrefix] || null;
    },

    __serialiseNode: function (aNode) {
        return this.xmlSerialiser.serializeToString(aNode);
    },

    /**
     * Parse the APP service document.
     *
     * @return {APP09Introspection} a APP09Introspection object
     * @throws {APPInvalidException}
     */
    parseIntrospection: function () {
        var service       = null;
        var workspaces    = null;
        var workspace     = null;
        var introspection = null;

        /* DEBUG */ dump("Yulup:appparser09.js:APPParser09.parseIntrospection() invoked\n");

        // check if we are indeed dealing with an APP introspection document
        if (service = this.documentDOM.evaluate("app09:service", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
            introspection = new APP09Introspection(this.__parseCommonAttributeBase(service, this.baseURI), this.__parseCommonAttributeLang(service));

            // iterate over all workspaces
            if (workspaces = this.documentDOM.evaluate("app09:workspace", service, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)) {
                while (workspace = workspaces.iterateNext()) {
                    introspection.workspaces.push(this.__parseWorkspace(this.baseURI, this.documentDOM, workspace));
                }
            } else {
                // app:service element MUST contain one or more app:workspace elements
                throw new APPInvalidException("The introspection document must contain one or more workspace elements.\n\n" + this.__serialiseNode(this.documentDOM));
            }
        } else {
            // an APP introspection document must have a app:service element as its root node
            throw new APPInvalidException("The introspection document must contain a service element as its root node.\n\n" + this.__serialiseNode(this.documentDOM));
        }

        return introspection;
    },

    /**
     * Parse the xml:base attribute of an APP node.
     *
     * If the aNode does not itself have an xml:base
     * attribute, then the aBaseURI is returned.
     *
     * Note that the xml:base attribute of aNode must
     * not be a relative URI.
     *
     * @param  {nsIDOMNode} aNode the node to operate on
     * @param  {nsIURI}     aBaseURI the parent base URI
     * @return {nsIURI}     the base URI of this node
     */
    __parseCommonAttributeBase: function (aNode, aBaseURI) {
        var xmlBase = null;

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null, "Yulup:appparser09.js:APPParser09.__parseCommonAttributeBase", "aBaseURI != null");

        if (aNode) {
            xmlBase = aNode.getAttribute("base");
        }

        return (xmlBase ? this.ioService.newURI(xmlBase, null, null) : aBaseURI);
    },

    /**
     * Parse the xml:lang attribute of an APP node.
     *
     * @param  {nsIDOMNode} aNode the node to operate on
     * @return {String}     the content of the xml:lang attribute or null if nonexistant
     */
    __parseCommonAttributeLang: function (aNode) {
        return aNode.getAttribute("lang");
    },

    /**
     * Parse an app:workspace node.
     *
     * @param  {nsIURI}            aBaseURI   the parent base URI
     * @param  {nsIDOMXMLDocument} aDocument  the containing document of aWorkspace
     * @param  {nsIDOMNode}        aWorkspace the node to operate on
     * @return {APP09Workspace}
     * @throws {APPInvalidException}
     */
    __parseWorkspace: function (aBaseURI, aDocument, aWorkspace) {
        var collections = null;
        var collection  = null;
        var workspace   = null;

        workspace = new APP09Workspace(this.__parseCommonAttributeBase(aWorkspace, aBaseURI), this.__parseCommonAttributeLang(aWorkspace));

        if (!(workspace.title = aDocument.evaluate("attribute::title", aWorkspace, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue))
            throw new APPInvalidException("The workspace element must contain a title attribute.\n\n" + this.__serialiseNode(aWorkspace));

        if (collections = aDocument.evaluate("app09:collection", aWorkspace, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)) {
            while (collection = collections.iterateNext()) {
                workspace.collections.push(this.__parseCollection(aBaseURI, this.documentDOM, collection));
            }
        }

        return workspace;
    },

    /**
     * Parse an app:collection node.
     *
     * @param  {nsIURI}            aBaseURI    the parent base URI
     * @param  {nsIDOMXMLDocument} aDocument   the containing document of aCollection
     * @param  {nsIDOMNode}        aCollection the node to operate on
     * @return {APP09Collection}
     * @throws {APPInvalidException}
     */
    __parseCollection: function (aBaseURI, aDocument, aCollection) {
        var accepts    = null;
        var accept     = null;
        var collection = null;

        collection = new APP09Collection(this.__parseCommonAttributeBase(aCollection, aBaseURI), this.__parseCommonAttributeLang(aCollection));

        if (!(collection.title = aDocument.evaluate("attribute::title", aCollection, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue))
            throw new APPInvalidException("The collection element must contain a title attribute.\n\n" + this.__serialiseNode(aCollection));

        // we can't pack the assignment directly into the if condition because collection.uri is a setter
        collection.uri = aDocument.evaluate("attribute::href", aCollection, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        if (!collection.uri)
            throw new APPInvalidException("The collection element must contain a href attribute.\n\n" + this.__serialiseNode(aCollection));

        if (accepts = aDocument.evaluate("app09:collection", aCollection, this.nsResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)) {
            if (accepts.snapshotLength == 1) {
                collection.accept = this.__parseAccept(aBaseURI, aDocument, accepts.snapshotItem(0));
            } else if (accepts.snapshotLength == 0) {
                // no app:accept element, must assume "entry"
                collection.accept = new APP09Accept(this.__parseCommonAttributeBase(null, aBaseURI), null);
                collection.accept.mediaRanges = ["entry"];
            } else {
                // app:collection element MAY contain one "app:accept" element
                throw new APPInvalidException("The collection element must contain at most one accept element.\n\n" + this.__serialiseNode(aCollection));
            }
        }

        return collection;
    },

    /**
     * Parse an app:accept node.
     *
     * @param  {nsIURI}            aBaseURI  the parent base URI
     * @param  {nsIDOMXMLDocument} aDocument the containing document of aAccept
     * @param  {nsIDOMNode}        aAccept   the node to operate on
     * @return {APP09Accept}
     */
    __parseAccept: function (aBaseURI, aDocument, aAccept) {
        var acceptString = null;
        var accept       = null;

        acceptString = aDocument.evaluate("text()", aAccept, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        accept       = new APP09Accept(this.__parseCommonAttributeBase(aAccept, aBaseURI), this.__parseCommonAttributeLang(aAccept));

        if (acceptString) {
            accept.mediaRanges = acceptString.split(new RegExp("\s*,\s*"));
        } else {
            // app:accept element is empty, must assume "entry"
            accept.mediaRanges = ["entry"];
        }

        return accept;
    }
};


/**
 * APPInvalidException constructor. Instantiates a new object of
 * type APPInvalidException.
 *
 * Exceptions of this type are not exceptions as thrown by the
 * server, but signal error conditions in the actual parser
 * or helper functions.
 *
 * @constructor
 * @param  {String}              aMessage a descriptive error message
 * @return {APPInvalidException}
 */
function APPInvalidException(aMessage) {
    // call super constructor
    APPException.call(this, aMessage);

    this.name = "APPInvalidException";
}

APPInvalidException.prototype.__proto__ = APPException.prototype;


/**
 * APP09Introspection constructor. Instantiates a new
 * object of type APP09Introspection.
 *
 * @constructor
 * @param  {nsIURI}             aBaseURI a xml base URI
 * @param  {String}             aLang    a xml lang
 * @return {APP09Introspection} a new APP09Introspection object
 */
function APP09Introspection(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:appparser09.js:APP09Introspection(\"" + aBaseURI + "\", \"" + aLang + "\") invoked\n");

    // call super constructor
    APPIntrospection.call(this, aBaseURI, aLang);
}

APP09Introspection.prototype = {
    __proto__:  APPIntrospection.prototype
};


/**
 * APP09Workspace constructor. Instantiates a new
 * object of type APP09Workspace.
 *
 * @constructor
 * @param  {nsIURI}         aBaseURI a xml base URI
 * @param  {String}         aLang    a xml lang
 * @return {APP09Workspace} a new APP09Workspace object
 */
function APP09Workspace(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:appparser09.js:APP09Workspace(\"" + aBaseURI + "\", \"" + aLang + "\") invoked\n");

    // call super constructor
    APPWorkspace.call(this, aBaseURI, aLang);

}

APP09Workspace.prototype = {
    __proto__:  APPWorkspace.prototype
};


/**
 * APP09Collection constructor. Instantiates a new
 * object of type APP09Collection.
 *
 * @constructor
 * @param  {nsIURI}          aBaseURI a xml base URI
 * @param  {String}          aLang    a xml lang
 * @return {APP09Collection} a new APP09Collection object
 */
function APP09Collection(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:appparser09.js:APP09Collection(\"" + aBaseURI + "\", \"" + aLang + "\") invoked\n");

    // call super constructor
    APPCollection.call(this, aBaseURI, aLang);

}

APP09Collection.prototype = {
    __proto__:  APPCollection.prototype
};


/**
 * APP09Accept constructor. Instantiates a new
 * object of type APP09Accept.
 *
 * @constructor
 * @param  {nsIURI}      aBaseURI a xml base URI
 * @param  {String}      aLang    a xml lang
 * @return {APP09Accept} a new APP09Accept object
 */
function APP09Accept(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:appparser09.js:APP09Accept(\"" + aBaseURI + "\", \"" + aLang + "\") invoked\n");

    // call super constructor
    APPAccept.call(this, aBaseURI, aLang);
}

APP09Accept.prototype = {
    __proto__:  APPAccept.prototype
};
