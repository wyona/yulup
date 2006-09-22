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
 * This module contains the code to parse files
 * based on the Neutron specification (see
 * http://www.wyona.org/osr-101/osr-101.xhtml).
 */

/**
 * NeutronParser10 constructor. Instantiates a new object of
 * type NeutronParser10.
 *
 * @constructor
 * @param  {nsIDOMXMLDocument} aDocument the Neutron document to parse
 * @param  {nsIURI}            aBaseURI  the URI of the document to which the introspection document is associated
 * @return {NeutronParser10}
 */
function NeutronParser10(aDocument, aBaseURI) {
    /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronParser10(\"" + aDocument + "\", \"" + aBaseURI + "\") invoked\n");

    this.documentDOM = aDocument;
    this.baseURI     = aBaseURI;
    this.ioService   = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
}

NeutronParser10.prototype = {
    __proto__: NeutronParser,

    documentDOM: null,
    baseURI    : null,
    ioService  : null,

    /**
     * Resolve prefixes used in XPath expressions to
     * namespaces.
     *
     * @param  {String} aPrefix a namespace prefix
     * @return {String} the namespace associated with the passed in prefix
     */
    nsResolver: function (aPrefix) {
        var namespace = null;

        /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronParser10.nsResolver(\"" + aPrefix + "\") invoked\n");

        var namespace = {
            "neutron10" : "http://www.wyona.org/neutron/1.0"
        };

        return namespace[aPrefix] || null;
    },

    /**
     * Parse introspection file.
     *
     * @return {Neutron10Introspection} a Neutron10Introspection object
     */
    parseIntrospection: function () {
        var introspection    = null;
        var elemNode         = null;
        var elemNodeIterator = null;
        var fragment         = 0;

        /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronParser10.parseIntrospection() invoked\n");

        introspection = new Neutron10Introspection();

        if (elemNodeIterator = this.documentDOM.evaluate("neutron10:introspection/neutron10:edit", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)) {
            /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronParser10.parseIntrospection: found one or multiple edit elements\n");
            while (elemNode = elemNodeIterator.iterateNext()) {
                /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronParser10.parseIntrospection: processing edit element #" + (fragment + 1) + "\n");
                // edit element exists
                introspection.fragments[fragment] = this.__parseEdit(this.documentDOM, elemNode);

                // set fragment data
                introspection.fragments[fragment++].name = this.documentDOM.evaluate("attribute::name", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            }
        }

        if (elemNode = this.documentDOM.evaluate("neutron10:introspection/neutron10:new", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
            // new element exists
            introspection.newTemplates = this.__parseNew(this.documentDOM, elemNode);
        }

        if (elemNode = this.documentDOM.evaluate("neutron10:introspection/neutron10:navigation", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
            // navigation element exists
            introspection.navigation = this.parseNavigation(this.documentDOM, elemNode);
        }

        return introspection;
    },

    /**
     * Parse a Neutron message.
     *
     * Note that the result is thrown instead of being
     * passed back via the return value.
     *
     * @return {Undefined} does not have a return value
     */
    parseResponse: function () {
        var elemNode      = null;
        var nodeSet       = null;
        var exceptionType = null;
        var response      = null;

        /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronParser10.parseResponse() invoked\n");

        if (elemNode = this.documentDOM.evaluate("neutron10:exception", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
            // response is of type exception, get exception type
            exceptionType = this.documentDOM.evaluate("attribute::type", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;

            switch (exceptionType) {
                case "checkin":
                    response = new NeutronProtocolCheckinException(this.documentDOM.evaluate("neutron10:message/text()", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue);

                    // TODO: implement parsing of the remaining fields
                    break;
                case "data-not-well-formed":
                    response = new NeutronProtocolDataNotWellFormedException(this.documentDOM.evaluate("neutron10:message/text()", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue);

                    if (elemNode = this.documentDOM.evaluate("neutron10:data-not-well-formed", elemNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
                        response.url        = this.documentDOM.evaluate("attribute::url", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        response.lineNumber = this.documentDOM.evaluate("neutron10:line/attribute::number", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        response.error      = this.documentDOM.evaluate("neutron10:line/attribute::message", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                    }
                    break;
                default:
                    response = new NeutronProtocolException(this.documentDOM.evaluate("neutron10:message/text()", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue);
            }

            /* Because this message is of type exception, we
             * have to throw it here. Since we are also handling
             * other types of messages, the caller would have to
             * look at our return value again to find out that it
             * is an exception. We don't want to put that burden
             * on him. */
            throw response;
        }
    },

    __parseNew: function(aDocument, aNode) {
        var uri = null;

        return {
            uri: ((uri = aDocument.evaluate("attribute::uri", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != "" ? this.ioService.newURI(uri, null, this.baseURI) : null),
            templates: this.__parseTemplates(aDocument, aNode)
        };
    },

    __parseTemplates: function(aDocument, aNode) {
        var templates     = null;
        var template      = null;
        var templateArray = new Array();
        var index         = 0;
        var uri           = null;

        templates = aDocument.evaluate("neutron10:template", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        while (template = templates.iterateNext()) {
            templateArray[index++] = {
                name: aDocument.evaluate("attribute::name", template, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                uri: ((uri = aDocument.evaluate("attribute::uri", template, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != "" ? this.ioService.newURI(uri, null, this.baseURI) : null),
                mimeType: aDocument.evaluate("attribute::mime-type", template, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue
            }
        }

        return (templateArray.length > 0 ? templateArray : null);
    },

    __parseEdit: function (aDocument, aNode) {
        var templateWidgets = null;

        return {
            mimeType: aDocument.evaluate("attribute::mime-type", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
            templateWidgets: ((templateWidgets = aDocument.evaluate("neutron10:widgets/attribute::templates", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) == "false" ? false : true),
            open:     this.__parseFileOperation(aDocument, aNode, "open"),
            save:     this.__parseFileOperation(aDocument, aNode, "save"),
            checkout: this.__parseFileOperation(aDocument, aNode, "checkout"),
            checkin:  this.__parseFileOperation(aDocument, aNode, "checkin"),
            schemas:  this.__parseSchemas(aDocument, aNode),
            styles:   this.__parseStyles(aDocument, aNode),
            styleTemplate: this.__parseStyleTemplate(aDocument, aNode),
            widgets:  this.__parseWidgets(aDocument, aNode)
        };
    },

    __parseFileOperation: function (aDocument, aNode, aOperation) {
        var sourceURI = null;

        sourceURI = aDocument.evaluate("neutron10:" + aOperation + "/attribute::url", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        if (sourceURI != "") {
            sourceURI = this.ioService.newURI(sourceURI, null, this.baseURI);
        } else {
            sourceURI = null;
        }

        /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronParser10.__parseFileOperation: sourceURI = " + sourceURI + "\n");

        return {
            uri:    sourceURI,
            method: aDocument.evaluate("neutron10:" + aOperation + "/attribute::method", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue
        };
    },

    __parseSchemas: function (aDocument, aNode) {
        var schemas     = null;
        var schema      = null;
        var schemaArray = new Array();
        var index       = 0;

        schemas = aDocument.evaluate("neutron10:schemas/neutron10:schema", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        while (schema = schemas.iterateNext()) {
            schemaArray[index++] = {
                href: aDocument.evaluate("attribute::href", schema, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                type: aDocument.evaluate("attribute::type", schema, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue
            }
        }

        return (schemaArray.length > 0 ? schemaArray : null);
    },

    __parseStyles: function (aDocument, aNode) {
        var styles     = null;
        var style      = null;
        var styleArray = new Array();
        var index      = 0;
        var sourceURI  = null;

        styles = aDocument.evaluate("neutron10:styles/neutron10:style", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        while (style = styles.iterateNext()) {
            styleArray[index++] = {
                href: ((sourceURI = aDocument.evaluate("attribute::href", style, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != "" ? this.ioService.newURI(sourceURI, null, this.baseURI) : null)
            }
        }

        return (styleArray.length > 0 ? styleArray : null);
    },


    __parseStyleTemplate: function (aDocument, aNode) {

        var styleTemplate = new Object();

        var href = aDocument.evaluate("neutron10:styles/neutron10:style-template/attribute::href", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        if (href != "") {
           styleTemplate.uri = this.ioService.newURI(href, null, this.baseURI);
            // apply styleTemplate pre or post source transformation
            var mode = aDocument.evaluate("neutron10:styles/neutron10:style-template/attribute::mode", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            if (mode != "") {
              styleTemplate.mode = mode;
            }

           return styleTemplate;
        }
        return null;
    },

    __parseWidgets: function (aDocument, aNode) {
        var widgets     = null;
        var widget      = null;
        var widgetArray = new Array();
        var index       = 0;
        var sourceURI   = null;
        var iconIndex   = null;
        var iconFile    = null;

        widgets = aDocument.evaluate("neutron10:widgets/neutron10:widget", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        while (widget = widgets.iterateNext()) {

            iconFile = aDocument.evaluate("attribute::icon", widget, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            if ((iconIndex = iconFile.lastIndexOf("/")) != -1) {
                iconFile = iconFile.substr(iconIndex+1);
            }

            widgetArray[index++] = {
                attributes:          this.__parseWidgetAttributes(aDocument, widget),
                icon:                iconFile,
                iconURI:             ((sourceURI = aDocument.evaluate("attribute::icon", widget, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != "" ? this.ioService.newURI(sourceURI, null, this.baseURI) : null),
                fragment:            this.__parseWidgetFragment(aDocument, widget),
                fragmentAttributes:  this.__parseWidgetFragmentAttributes(aDocument, widget)
            }
        }

        return (widgetArray.length > 0 ? widgetArray : null);
    },

    __parseWidgetFragment: function(aDocument, aNode) {
        var fragment          = null;
        var fragmentNode      = null;
        var xmlDoc            = null;
        var importNode        = null;

        fragment = aDocument.evaluate("neutron10:fragment/child::*", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        fragmentNode = fragment.iterateNext();

        if (fragmentNode) {
            xmlDoc = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
            importNode = xmlDoc.importNode(fragmentNode, true);
            xmlDoc.appendChild(importNode);
        }

        return xmlDoc;
    },

    __parseWidgetAttributes: function(aDocument, aNode) {
        var attributes        = null;
        var attribute         = null;
        var attributeArray    = new Array();
        var index             = 0;

        attributes = aDocument.evaluate("attribute::*", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        while (attribute = attributes.iterateNext()) {
            index++;
            attributeArray[attribute.name] = attribute.nodeValue;
        }

        return (index > 0 ? attributeArray : null);
    },

    __parseWidgetFragmentAttributes: function(aDocument, aNode) {
        var attributes        = null;
        var attribute         = null;
        var attributeArray    = new Array();
        var index             = 0;

        attributes = aDocument.evaluate("neutron10:attribute", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        while (attribute = attributes.iterateNext()) {
            attributeArray[index++] = {
                name: aDocument.evaluate("attribute::name", attribute, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                xpath: aDocument.evaluate("attribute::xpath", attribute, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue
            }
        }

        return (attributeArray.length > 0 ? attributeArray : null);
    }
};


/**
 * Neutron10Introspection constructor. Instantiates a new
 * object of type Neutron10Introspection.
 *
 * @constructor
 * @return {Neutron10Introspection} a new Neutron10Introspection object
 */
function Neutron10Introspection() {
    /* DEBUG */ dump("Yulup:neutronparser10.js:Neutron10Introspection() invoked\n");

    // call super constructor
    // TODO: why does this call fail??
    this.__proto__.__proto__.constructor.call(this);
    // workaraound
    this.fragments = new Array();
}

Neutron10Introspection.prototype = {
    __proto__:  Introspection.prototype
};


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
    /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronProtocolCheckinException(\"" + aMessage + "\") invoked\n");

    this.__proto__.__proto__.constructor.call(this, aMessage);

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
    /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronProtocolDataNotWellFormedException(\"" + aMessage + "\") invoked\n");

    this.__proto__.__proto__.constructor.call(this, aMessage);

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
}
