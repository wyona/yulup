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
 * This module contains the code to parse files
 * based on the Neutron 2 specification (see
 * http://www.wyona.org/osr-101/osr-101.xhtml).
 */

/**
 * NeutronParser20 constructor. Instantiates a new object of
 * type NeutronParser20.
 *
 * @constructor
 * @param  {nsIDOMXMLDocument} aDocument the Neutron document to parse
 * @param  {nsIURI}            aBaseURI  the URI of the document to which the introspection document is associated
 * @return {NeutronParser20}
 */
function NeutronParser20(aDocument, aBaseURI) {
    /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20(\"" + aDocument + "\", \"" + aBaseURI + "\") invoked\n");

     // call super constructor
    NeutronParser.call(this);

    this.documentDOM = aDocument;
    this.baseURI     = aBaseURI;
    this.ioService   = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
}

NeutronParser20.prototype = {
    __proto__: NeutronParser.prototype,

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

        /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.nsResolver(\"" + aPrefix + "\") invoked\n");

        var namespace = {
            "neutron20": "http://www.wyona.org/neutron/2.0",
            "D"        : "DAV",
            "xml"      : "http://www.w3.org/XML/1998/namespace"
        };

        return namespace[aPrefix] || null;
    },


    /**
     * Parse sitetree file.
     *
     *
     */
    parseSitetree: function() {
        var sitetree     = null;
        var elemNode     = null;
        var elemIterator = null;
        var resource     = 0;

        /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.parseSitetree() invoked\n");

        sitetree = new Neutron20Sitetree();

        if (elemNodeIterator = this.documentDOM.evaluate("D:multistatus/D:response", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)) {
            /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.parseSitetree: found one or multiple response elements\n");

            while (elemNode = elemNodeIterator.iterateNext()) {
                sitetree.resources[resource++] = this.__parseResponse(this.documentDOM, elemNode);
            }
        }

        return sitetree;
    },

    __parseResponse: function(aDocument, aNode) {
        var uri = null;

        return {
            href: ((uri = aDocument.evaluate("D:href/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != null ? this.ioService.newURI(uri, null, this.baseURI) : null),
            properties: this.__parseProperties(aDocument, aNode)
        };
    },

    __parseProperties: function(aDocument, aNode) {

        return {
            displayname: aDocument.evaluate("D:propstat/D:prop/D:displayname/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
            lastmodified: aDocument.evaluate("D:propstat/D:prop/D:lastmodified/text()", aNode,  this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
            contenttype: aDocument.evaluate("D:propstat/D:prop/D:contenttype/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
            resourcetype: this.__parseResourceType(aDocument, aNode)
        };
    },

    __parseResourceType: function(aDocument, aNode) {
        var collection = null;

        if (collection = aDocument.evaluate("D:propstat/D:prop/D:resourcetype/D:collection", aNode, this.nsResolver, XPathResult.UNORDERER_NODE_ITERATOR_TYPE, null).iterateNext()) {
            // it's a collection
            return "collection";
        } else {
            return "resource";
        }
    },

    /**
     * Parse introspection file.
     *
     * @return {Neutron20Introspection} a Neutron20Introspection object
     */
    parseIntrospection: function () {
        var introspection    = null;
        var elemNode         = null;
        var elemNodeIterator = null;
        var fragment         = 0;

        /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.parseIntrospection() invoked\n");

        introspection = new Neutron20Introspection(this.baseURI);

        if (elemNodeIterator = this.documentDOM.evaluate("neutron20:introspection/neutron20:edit", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)) {
            /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.parseIntrospection: found one or multiple edit elements\n");
            while (elemNode = elemNodeIterator.iterateNext()) {
                /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.parseIntrospection: processing edit element #" + fragment + "\n");
                // edit element exists
                introspection.fragments[fragment++] = this.__parseEdit(this.documentDOM, elemNode);
            }
        }

        if (elemNode = this.documentDOM.evaluate("neutron20:introspection/neutron20:new", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
            // new element exists
            introspection.newTemplates = this.__parseNew(this.documentDOM, elemNode);
        }

        if (elemNode = this.documentDOM.evaluate("neutron20:introspection/neutron20:navigation", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
            // navigation element exists
            introspection.navigation = this.__parseNavigation(this.documentDOM, elemNode);
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

        /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.parseResponse() invoked\n");

        if (elemNode = this.documentDOM.evaluate("neutron20:exception", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
            // response is of type exception, get exception type
            exceptionType = this.documentDOM.evaluate("attribute::type", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;

            switch (exceptionType) {
                case "checkin":
                    response = new NeutronProtocolCheckinException(this.documentDOM.evaluate("neutron20:message/text()", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue);

                    // TODO: implement parsing of the remaining fields
                    break;
                case "data-not-well-formed":
                    response = new NeutronProtocolDataNotWellFormedException(this.documentDOM.evaluate("neutron20:message/text()", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue);

                    if (elemNode = this.documentDOM.evaluate("neutron20:data-not-well-formed", elemNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
                        response.url        = this.documentDOM.evaluate("attribute::url", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        response.lineNumber = this.documentDOM.evaluate("neutron20:line/attribute::number", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                        response.error      = this.documentDOM.evaluate("neutron20:line/attribute::message", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                    }
                    break;
                default:
                    response = new NeutronProtocolException(this.documentDOM.evaluate("neutron20:message/text()", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue);
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

    __parseNavigation: function(aDocument, aNode) {

        return {
          sitetree: this.__parseSitetree(aDocument, aNode)
        };
    },

    __parseSitetree: function(aDocument, aNode) {
        var sitetree = null;
        var uri      = null;

        sitetree = aDocument.evaluate("neutron20:sitetree", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext();

        if (sitetree) {
            return {
                uri: ((uri = aDocument.evaluate("attribute::href", sitetree, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != "" ? this.ioService.newURI(uri, null, this.baseURI) : null),
                method: aDocument.evaluate("attribute::method", sitetree, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue
            };
        } else {
            return null;
        }
    },

    __parseTemplates: function(aDocument, aNode) {
        var templates     = null;
        var template      = null;
        var templateArray = new Array();
        var uri           = null;

        templates = aDocument.evaluate("neutron20:template", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        while (template = templates.iterateNext()) {
            templateArray.push({
                name: aDocument.evaluate("attribute::name", template, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                uri: ((uri = aDocument.evaluate("attribute::uri", template, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != "" ? this.ioService.newURI(uri, null, this.baseURI) : null),
                mimeType: aDocument.evaluate("attribute::mime-type", template, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue
            });
        }

        return (templateArray.length > 0 ? templateArray : null);
    },

    __parseEdit: function (aDocument, aNode) {
        var fragment        = null;
        var templateWidgets = null;

        fragment = new Neutron20Fragment();

        fragment.name            = aDocument.evaluate("attribute::name", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        fragment.mimeType        = aDocument.evaluate("attribute::mime-type", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        fragment.open            = this.__parseFileOperation(aDocument, aNode, "open");
        fragment.save            = this.__parseFileOperation(aDocument, aNode, "save");
        fragment.checkout        = this.__parseFileOperation(aDocument, aNode, "checkout");
        fragment.checkin         = this.__parseFileOperation(aDocument, aNode, "checkin");
        fragment.schemas         = this.__parseSchemas(aDocument, aNode);
        fragment.styles          = this.__parseStyles(aDocument, aNode);
        fragment.styleTemplate   = this.__parseStyleTemplate(aDocument, aNode);
        fragment.widgets         = this.__parseWidgets(aDocument, aNode);
        fragment.templateWidgets = ((templateWidgets = aDocument.evaluate("neutron20:widgets/attribute::templates", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) == "false" ? false : true);

        return fragment;
    },

    __parseFileOperation: function (aDocument, aNode, aOperation) {
        var sourceURI = null;

        sourceURI = aDocument.evaluate("neutron20:" + aOperation + "/attribute::url", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        if (sourceURI != "") {
            sourceURI = this.ioService.newURI(sourceURI, null, this.baseURI);
        } else {
            sourceURI = null;
        }

        /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.__parseFileOperation: sourceURI = " + sourceURI + "\n");

        return {
            uri:    sourceURI,
            method: aDocument.evaluate("neutron20:" + aOperation + "/attribute::method", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue
        };
    },

    __parseSchemas: function (aDocument, aNode) {
        var schemas     = null;
        var schema      = null;
        var schemaArray = new Array();

        schemas = aDocument.evaluate("neutron20:schemas/neutron20:schema", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        while (schema = schemas.iterateNext()) {
            schemaArray.push({
                href: aDocument.evaluate("attribute::href", schema, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                type: aDocument.evaluate("attribute::type", schema, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue
            });
        }

        return (schemaArray.length > 0 ? schemaArray : null);
    },

    __parseStyles: function (aDocument, aNode) {
        var styles     = null;
        var style      = null;
        var styleArray = new Array();
        var sourceURI  = null;

        styles = aDocument.evaluate("neutron20:styles/neutron20:style", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        while (style = styles.iterateNext()) {
            styleArray.push({
                href: ((sourceURI = aDocument.evaluate("attribute::href", style, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != "" ? this.ioService.newURI(sourceURI, null, this.baseURI) : null)
            });
        }

        return (styleArray.length > 0 ? styleArray : null);
    },


    __parseStyleTemplate: function (aDocument, aNode) {

        var styleTemplate = new Object();

        var href = aDocument.evaluate("neutron20:styles/neutron20:style-template/attribute::href", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        if (href != "") {
           styleTemplate.uri = this.ioService.newURI(href, null, this.baseURI);
            // apply styleTemplate pre or post source transformation
            var mode = aDocument.evaluate("neutron20:styles/neutron20:style-template/attribute::mode", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
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

        widgets = aDocument.evaluate("neutron20:widgets/*[self::neutron20:widget or self::neutron20:widgetgroup]", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        while (widget = widgets.iterateNext()) {
            switch (widget.localName) {
                case "widget":
                    widgetArray.push(this.__parseWidget(aDocument, widget));
                    break;
                case "widgetgroup":
                    widgetArray.push(this.__parseWidgetGroup(aDocument, widget));
                    break;
                default:
            }
        }

        return (widgetArray.length > 0 ? widgetArray : null);
    },

    __parseWidget: function (aDocument, aNode) {
        var widget    = null;
        var sourceURI = null;
        var iconIndex = null;
        var iconFile  = null;

        widget = new Neutron20Widget();

        iconFile = aDocument.evaluate("attribute::icon", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        if ((iconIndex = iconFile.lastIndexOf("/")) != -1) {
            iconFile = iconFile.substr(iconIndex+1);
        }

        widget.icon               = iconFile;
        widget.iconURI            = ((sourceURI = aDocument.evaluate("attribute::icon", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != "" ? this.ioService.newURI(sourceURI, null, this.baseURI) : null);
        widget.name               = this.__parseWidgetNames(aDocument, aNode);
        widget.description        = this.__parseWidgetDescriptions(aDocument, aNode);
        widget.surround           = this.__parseWidgetSurroundAction(aDocument, aNode);
        widget.insert             = this.__parseWidgetInsertAction(aDocument, aNode);

        return widget;
    },

    __parseWidgetGroup: function (aDocument, aNode) {
        var widgetGroup = null;
        var widgets     = null;
        var widget      = null;

        widgetGroup = new Neutron20WidgetGroup();

        widgetGroup.name        = this.__parseWidgetNames(aDocument, aNode);
        widgetGroup.description = this.__parseWidgetDescriptions(aDocument, aNode);

        widgets = aDocument.evaluate("neutron20:widget", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        while (widget = widgets.iterateNext()) {
            widgetGroup.widgets.push(this.__parseWidget(aDocument, widget));
        }

        return widgetGroup;
    },

    __parseWidgetNames: function (aDocument, aNode) {
        var names     = null;
        var name      = null;
        var nameArray = new Array();

        names = aDocument.evaluate("neutron20:name", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        while (name = names.iterateNext()) {
            nameArray.push(this.__parseWidgetNameAlikes(aDocument, name));
        }

        return (nameArray.length > 0 ? nameArray : null);
    },

    __parseWidgetDescriptions: function (aDocument, aNode) {
        var descriptions = null;
        var description  = null;
        var descArray    = new Array();

        descriptions = aDocument.evaluate("neutron20:description", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        while (description = descriptions.iterateNext()) {
            descArray.push(this.__parseWidgetNameAlikes(aDocument, description));
        }

        return (descArray.length > 0 ? descArray : null);
    },

    __parseWidgetNameAlikes: function (aDocument, aNode) {
        var lang = null;
        var text = null;

        lang = aDocument.evaluate("attribute::xml:lang", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        text = aDocument.evaluate("child::text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        return [lang, text];
    },

    __parseWidgetSurroundAction: function (aDocument, aNode) {
        var action = null;

        if (action = aDocument.evaluate("neutron20:surround", aNode, this.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
            return this.__parseWidgetAction(aDocument, action);
        }

        return null;
    },

    __parseWidgetInsertAction: function (aDocument, aNode) {
        var action = null;

        if (action = aDocument.evaluate("neutron20:insert", aNode, this.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
            return this.__parseWidgetAction(aDocument, action);
        }

        return null;
    },

    __parseWidgetAction: function (aDocument, aNode) {
        var action = null;

        action = new Neutron20WidgetAction();

        action.parameters = this.__parseWidgetActionParameters(aDocument, aNode);
        action.fragment   = this.__parseWidgetFragment(aDocument, aNode);

        return action;
    },

    __parseWidgetActionParameters: function(aDocument, aNode) {
        var parameters        = null;
        var parameter         = null;
        var widgetActionParam = null;
        var parameterArray    = new Array();

        parameters = aDocument.evaluate("neutron20:parameter", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        while (parameter = parameters.iterateNext()) {
            widgetActionParam = new Neutron20WidgetActionParameter();

            widgetActionParam.xpath       = aDocument.evaluate("attribute::xpath", parameter, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            widgetActionParam.type        = aDocument.evaluate("attribute::type", parameter, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            widgetActionParam.name        = this.__parseWidgetNames(aDocument, parameter);
            widgetActionParam.description = this.__parseWidgetDescriptions(aDocument, parameter);

            parameterArray.push(widgetActionParam);
        }

        return (parameterArray.length > 0 ? parameterArray : null);
    },

    __parseWidgetFragment: function(aDocument, aNode) {
        var fragmentNode = null;
        var xmlDoc       = null;
        var importNode   = null;

        fragmentNode = aDocument.evaluate("neutron20:fragment/child::*", aNode, this.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (fragmentNode) {
            xmlDoc = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
            importNode = xmlDoc.importNode(fragmentNode, true);
            xmlDoc.appendChild(importNode);
        }

        return xmlDoc;
    }
};


/**
 * Neutron20Introspection constructor. Instantiates a new
 * object of type Neutron20Introspection.
 *
 * @constructor
 * @param  {nsIURI}                 aAssociatedWithURI the URI of the document this introspection object is associated with
 * @return {Neutron20Introspection} a new Neutron20Introspection object
 */
function Neutron20Introspection(aAssociatedWithURI) {
    /* DEBUG */ dump("Yulup:neutronparser20.js:Neutron20Introspection(\"" + aAssociatedWithURI + "\") invoked\n");

    // call super constructor
    NeutronIntrospection.call(this, aAssociatedWithURI, NEUTRON_10_NAMESPACE);
}

Neutron20Introspection.prototype = {
    __proto__:  NeutronIntrospection.prototype
};


/**
 * Neutron20Fragment constructor. Instantiates a new
 * object of type Neutron20Fragment.
 *
 * @constructor
 * @return {Neutron20Fragment} a new Neutron20Fragment object
 */
function Neutron20Fragment() {
    /* DEBUG */ dump("Yulup:neutronparser20.js:Neutron20Fragment() invoked\n");

    // call super constructor
    NeutronResource.call(this);
}

Neutron20Fragment.prototype = {
    __proto__:  NeutronResource.prototype
};


/**
 * Neutron20Sitetree constructor. Instantiates a new
 * object of type Neutron20Sitetree.
 *
 * @constructor
 * @return {Neutron20Sitetree} a new Neutron20Sitetree object
 */
function Neutron20Sitetree() {
    /* DEBUG */ dump("Yulup:neutronparser20.js:Neutron20Sitetree() invoked\n");

    this.resources = new Array();
}

Neutron20Sitetree.prototype = {
    resources: null
};


function Neutron20Widget() {
    // call super constructor
    NeutronWidget.call(this);
}

Neutron20Widget.prototype = {
    __proto__: NeutronWidget.prototype
};


function Neutron20WidgetGroup() {
    // call super constructor
    NeutronWidgetGroup.call(this);
}

Neutron20WidgetGroup.prototype = {
    __proto__: NeutronWidgetGroup.prototype
};


function Neutron20WidgetAction() {
    // call super constructor
    NeutronWidgetAction.call(this);
}

Neutron20WidgetAction.prototype = {
    __proto__: NeutronWidgetAction.prototype
};


function Neutron20WidgetActionParameter() {
    // call super constructor
    NeutronWidgetActionParameter.call(this);
}

Neutron20WidgetActionParameter.prototype = {
    __proto__: NeutronWidgetActionParameter.prototype
};
