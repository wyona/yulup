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

    /* DEBUG */ YulupDebug.ASSERT(aDocument != null);
    /* DEBUG */ YulupDebug.ASSERT(aBaseURI  != null);

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
     * Constructs an nsIURI.
     *
     * @param  {String} aURI     a URI
     * @param  {nsIURI} aBaseURI a base URI
     * @return {nsIURI} the URI constructed from aURI and aBaseURI (if aURI is relative), or null if aURI is null or empty
     */
    __constructURI: function (aURI, aBaseURI) {
        var uri = null;

        /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.__constructURI(\"" + aURI + "\", \"" + aBaseURI + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null, "Yulup:neutronparser20.js:NeutronParser20.__constructURI", "aBaseURI != null");

        if (aURI && aURI != "") {
            uri = this.ioService.newURI(aURI, null, aBaseURI);
        }

        /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.__constructURI: constructed uri = \"" + uri + "\"\n");
        return uri;
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
        return {
            href      : this.__constructURI(aDocument.evaluate("D:href/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue, this.baseURI),
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

        if (elemNodeIterator = this.documentDOM.evaluate("neutron20:introspection/neutron20:resource", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)) {
            /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.parseIntrospection: found one or multiple resource elements\n");
            while (elemNode = elemNodeIterator.iterateNext()) {
                /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.parseIntrospection: processing resource element #" + fragment + "\n");
                // edit element exists
                introspection.fragments[fragment++] = this.__parseResource(this.documentDOM, elemNode, introspection);
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
                case "workflow":
                    response = new NeutronProtocolWorkflowException(this.documentDOM.evaluate("neutron20:message/text()", elemNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue);
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

    parseWorkflowResponse: function (aIntrospectionRoot, aVersion) {
        var workflow = null;
        var state    = null;

        /* DEBUG */ dump("Yulup:neutronparser20.js:NeutronParser20.parseWorkflowResponse() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aIntrospectionRoot != null);
        /* DEBUG */ YulupDebug.ASSERT(aVersion           != null);

        workflow = this.documentDOM.evaluate("neutron20:workflow", this.documentDOM, this.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (workflow) {
            state = this.documentDOM.evaluate("neutron20:state", workflow, this.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (state)
                aVersion.workflowState = this.__parseWorkflowState(this.documentDOM, state);

            aVersion.workflowTransitions = this.__parseWorkflowTransitions(this.documentDOM, workflow, aIntrospectionRoot, aVersion);
            aVersion.workflowHistory     = this.__parseWorkflowHistory(this.documentDOM, workflow);
        } else
            throw new NeutronException("Yulup:neutronparser20.js:NeutronParser20.parseWorkflowResponse: not a valid workflow response");

        return aVersion;
    },

    __parseNew: function(aDocument, aNode) {
        return {
            uri      : this.__constructURI(aDocument.evaluate("attribute::uri", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue, this.baseURI),
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

        sitetree = aDocument.evaluate("neutron20:sitetree", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext();

        if (sitetree) {
            return {
                uri   : this.__constructURI(aDocument.evaluate("attribute::href", sitetree, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue, this.baseURI),
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

        templates = aDocument.evaluate("neutron20:template", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        while (template = templates.iterateNext()) {
            templateArray.push({
                    name    : aDocument.evaluate("attribute::name", template, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                    uri     : this.__constructURI(aDocument.evaluate("attribute::uri", template, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue, this.baseURI),
                    mimeType: aDocument.evaluate("attribute::mime-type", template, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue
            });
        }

        return (templateArray.length > 0 ? templateArray : null);
    },

    __parseResource: function (aDocument, aNode, aIntrospectionRoot) {
        var resource         = null;
        var elemNodeIterator = null;
        var elemNode         = null;

        resource = new Neutron20Resource();

        resource.name = aDocument.evaluate("attribute::name", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        // get edit element
        elemNode = aDocument.evaluate("neutron20:edit", aNode, this.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE , null).singleNodeValue;

        if (elemNode) {
            // edit element exists
            this.__parseEdit(aDocument, elemNode, resource);
        }

        // get versions
        if (elemNodeIterator = aDocument.evaluate("neutron20:versions/neutron20:version", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)) {
            while (elemNode = elemNodeIterator.iterateNext()) {
                resource.versions.push(this.__parseVersion(this.documentDOM, elemNode, aIntrospectionRoot));
            }
        }

        return resource;
    },

    __parseEdit: function (aDocument, aNode, aResource) {
        var templateWidgets = null;

        aResource.mimeType        = aDocument.evaluate("attribute::mime-type", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        aResource.open            = this.__parseFileOperation(aDocument, aNode, "open");
        aResource.save            = this.__parseFileOperation(aDocument, aNode, "save");
        aResource.checkout        = this.__parseFileOperation(aDocument, aNode, "checkout");
        aResource.checkin         = this.__parseFileOperation(aDocument, aNode, "checkin");
        aResource.schemas         = this.__parseSchemas(aDocument, aNode);
        aResource.styles          = this.__parseStyles(aDocument, aNode);
        aResource.styleTemplate   = this.__parseStyleTemplate(aDocument, aNode);
        aResource.widgets         = this.__parseWidgets(aDocument, aNode);
        aResource.templateWidgets = ((templateWidgets = aDocument.evaluate("neutron20:widgets/attribute::templates", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) == "false" ? false : true);

        return aResource;
    },

    __parseFileOperation: function (aDocument, aNode, aOperation) {
        return {
            uri   : this.__constructURI(aDocument.evaluate("neutron20:" + aOperation + "/attribute::url", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue, this.baseURI),
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

        styles = aDocument.evaluate("neutron20:styles/neutron20:style", aNode, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

        while (style = styles.iterateNext()) {
            styleArray.push({
                href: this.__constructURI(aDocument.evaluate("attribute::href", style, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue, this.baseURI)
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
        var iconIndex = null;
        var iconFile  = null;

        widget = new Neutron20Widget();

        iconFile = aDocument.evaluate("attribute::icon", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        if ((iconIndex = iconFile.lastIndexOf("/")) != -1) {
            iconFile = iconFile.substr(iconIndex+1);
        }

        widget.icon               = iconFile;
        widget.iconURI            = this.__constructURI(aDocument.evaluate("attribute::icon", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue, this.baseURI);
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
    },

    __parseVersion: function(aDocument, aNode, aIntrospectionRoot) {
        var version  = null;
        var workflow = null;
        var state    = null;

        version = new Neutron20ResourceVersion();

        version.url                 = this.__constructURI(aDocument.evaluate("attribute::url", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue, this.baseURI);
        version.comment             = this.__parseSingleStringValue(aDocument, aNode, "comment");
        version.date                = this.__parseSingleStringValue(aDocument, aNode, "date");
        version.user                = this.__parseSingleStringValue(aDocument, aNode, "user");
        version.revision            = this.__parseSingleStringValue(aDocument, aNode, "revision");

        workflow = aDocument.evaluate("neutron20:workflow", aNode, this.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (workflow) {
            state = aDocument.evaluate("neutron20:state", workflow, this.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (state)
                version.workflowState = this.__parseWorkflowState(aDocument, state);

            version.workflowTransitions = this.__parseWorkflowTransitions(aDocument, workflow, aIntrospectionRoot, version);
            version.workflowHistory     = this.__parseWorkflowHistory(aDocument, workflow);
        }

        return version;
    },

    __parseSingleStringValue: function (aDocument, aNode, aElemName) {
        var elem   = null;
        var retval = null;

        elem = aDocument.evaluate("neutron20:" + aElemName, aNode, this.nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (elem) {
            retval = aDocument.evaluate("text()", elem, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        }

        return retval;
    },

    __parseWorkflowState: function (aDocument, aNode) {
        var state = null;

        state = new Neutron20WorkflowState();

        state.state = aDocument.evaluate("text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        state.date  = aDocument.evaluate("attribute::date", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        return state;
    },

    __parseWorkflowTransitions: function (aDocument, aNode, aIntrospectionRoot, aVersion) {
        var transitions = null;
        var transition  = null;
        var transArray  = null;
        var trans       = null;

        transitions = aDocument.evaluate("neutron20:transitions/neutron20:transition", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        transArray = new Array();

        while (transition = transitions.iterateNext()) {
            trans = new Neutron20WorkflowTransition(aIntrospectionRoot, aVersion);

            trans.id     = aDocument.evaluate("attribute::id", transition, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            trans.to     = aDocument.evaluate("attribute::to", transition, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;
            trans.url    = this.__constructURI(aDocument.evaluate("attribute::url", transition, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue, this.baseURI);
            trans.method = aDocument.evaluate("attribute::method", transition, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue;

            transArray.push(trans);
        }

        return transArray;
    },

    __parseWorkflowHistory: function (aDocument, aNode) {
        var states     = null;
        var state      = null;
        var stateArray = null;

        states = aDocument.evaluate("neutron20:history/neutron20:state", aNode, this.nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        stateArray = new Array();

        while (state = states.iterateNext()) {
            stateArray.push(this.__parseWorkflowState(aDocument, state));
        }

        return stateArray;
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
    NeutronIntrospection.call(this, aAssociatedWithURI, NEUTRON_20_NAMESPACE);
}

Neutron20Introspection.prototype = {
    __proto__:  NeutronIntrospection.prototype,

    generateWorkflowRequest: function (aWorkflowTransition, aVersion) {
        var retval = null;

        /* DEBUG */ YulupDebug.ASSERT(aWorkflowTransition != null);
        /* DEBUG */ YulupDebug.ASSERT(aVersion            != null);

        // TODO: create a central XML handler which wraps document creation
        retval  = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        retval += "<workflow xmlns=\"" + NEUTRON_20_NAMESPACE + "\">";
        retval += "<transition id=\"" + aWorkflowTransition.id + "\"" + (aVersion.revision ? " revision=\"" + aVersion.revision + "\"" : "") + "/>";
        retval += "</workflow>";

        return retval;
    }
};


/**
 * Neutron20Resource constructor. Instantiates a new
 * object of type Neutron20Resource.
 *
 * @constructor
 * @return {Neutron20Resource} a new Neutron20Resource object
 */
function Neutron20Resource() {
    /* DEBUG */ dump("Yulup:neutronparser20.js:Neutron20Resource() invoked\n");

    // call super constructor
    NeutronResource.call(this);
}

Neutron20Resource.prototype = {
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


function Neutron20ResourceVersion() {
    // call super constructor
    NeutronResourceVersion.call(this);
}

Neutron20ResourceVersion.prototype = {
    __proto__: NeutronResourceVersion.prototype
};


function Neutron20WorkflowState() {
    // call super constructor
    NeutronWorkflowState.call(this);
}

Neutron20WorkflowState.prototype = {
    __proto__: NeutronWorkflowState.prototype
};


function Neutron20WorkflowTransition(aIntrospectionRoot, aVersion) {
    /* DEBUG */ YulupDebug.ASSERT(aIntrospectionRoot != null);
    /* DEBUG */ YulupDebug.ASSERT(aVersion           != null);

    // call super constructor
    NeutronWorkflowTransition.call(this, aIntrospectionRoot, aVersion);
}

Neutron20WorkflowTransition.prototype = {
    __proto__: NeutronWorkflowTransition.prototype
};
