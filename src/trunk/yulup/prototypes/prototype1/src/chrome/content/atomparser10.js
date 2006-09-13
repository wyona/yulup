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
 * This module contains the code to parse Atom feeds
 * adhering to the Atom 1.0 specification (see
 * http://www.ietf.org/rfc/rfc4287.txt).
 */

/**
 * AtomParser10 constructor. Instantiates a new object of
 * type AtomParser10.
 *
 * You can set aStrict to true if you want the parser to fail
 * if it encounters a validity error. If you want to be lax
 * about errors, set it to false. If set to true, an
 * AtomInvalidException will be thrown.
 *
 * Furthermore, you can pass in an error handler. If strict
 * mode is turned off, then this error handler is called
 * if the parser encounters a validity error. If you do not
 * specify an error handler with strict mode turned off, then
 * the parser will simply continue.
 *
 * @constructor
 * @param  {nsIDOMXMLDocument} aDocument     the Atom feed document to parse
 * @param  {String}            aBaseURI      the URI of the feed document
 * @param  {Boolean}           aStrict       indicates if the parser should fail if it encounters a validity error
 * @param  {Function}          aErrorHandler an error handler with signature function (Error aError) [optional]
 * @return {AtomParser10}
 */
function AtomParser10(aDocument, aBaseURI, aStrict, aErrorHandler) {
    /* DEBUG */ dump("Yulup:atomparser10.js:AtomParser10(\"" + aDocument + "\", \"" + aBaseURI + "\", \"" + aStrict + "\", \"" + aErrorHandler + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aDocument != null, "Yulup:atomparser10.js:AtomParser10", "aDocument != null");
    /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null, "Yulup:atomparser10.js:AtomParser10", "aBaseURI != null");
    /* DEBUG */ YulupDebug.ASSERT(aStrict != null, "Yulup:atomparser10.js:AtomParser10", "aStrict != null");
    /* DEBUG */ YulupDebug.ASSERT((aErrorHandler ? aErrorHandler instanceof Function : true), "Yulup:atomparser10.js:AtomParser10", "aErrorHandler instanceof Function");

    // call super constructor
    APPParser.call(this);

    this.ioService     = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    this.xmlSerialiser = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);
    this.documentDOM   = aDocument;
    this.baseURI       = this.ioService.newURI(aBaseURI, null, null);
    this.strict        = aStrict;
    this.errorHandler  = aErrorHandler;
}

AtomParser10.prototype = {
    __proto__: AtomParser,

    ioService    : null,
    xmlSerialiser: null,
    documentDOM  : null,
    baseURI      : null,
    strict       : null,
    errorHandler : null,

    /**
     * Parse the feed information part of an Atom feed document.
     *
     * @return {Atom10FeedInformation} an Atom10FeedInformation object
     * @throws {AtomInvalidException}
     */
    parseFeedInformation: function () {
        var feed            = null;
        var feedInformation = null;
        var nodeIterator    = null;
        var node            = null;

        /* DEBUG */ dump("Yulup:atomparser10.js:AtomParser10.parseFeedInformation() invoked\n");

        // check if we are indeed dealing with an Atom feed document
        if (feed = this.documentDOM.evaluate("atom10:feed", this.documentDOM, this.__nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
            feedInformation = new Atom10FeedInformation(this.__parseCommonAttributeBase(feed, this.baseURI), this.__parseCommonAttributeLang(feed));

            // iterate over all authors*
            if (nodeIterator = this.documentDOM.evaluate("atom10:author", feed, this.__nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)) {
                while (node = nodeIterator.iterateNext()) {
                    feedInformation.authors.push(this.__parsePersonConstruct(this.baseURI, node));
                }
                node = null;
            }
            nodeIterator = null;

            // iterate over all categories*
            if (nodeIterator = this.documentDOM.evaluate("atom10:category", feed, this.__nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)) {
                while (node = nodeIterator.iterateNext()) {
                    feedInformation.categories.push(this.__parseCategory(this.baseURI, node));
                }
                node = null;
            }
            nodeIterator = null;

            // iterate over all contributors*
            if (nodeIterator = this.documentDOM.evaluate("atom10:contributor", feed, this.__nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)) {
                while (node = nodeIterator.iterateNext()) {
                    feedInformation.contributors.push(this.__parsePersonConstruct(this.baseURI, node));
                }
                node = null;
            }
            nodeIterator = null;

            // parse generator?
            if (node = this.documentDOM.evaluate("atom10:generator", feed, this.__nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
                feedInformation.generator = this.__parseGenerator(this.baseURI, node);
                node = null;
            }

            // parse icon?
            if (node = this.documentDOM.evaluate("atom10:icon", feed, this.__nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
                feedInformation.icon = this.__parseIcon(this.baseURI, node);
                node = null;
            }

            // parse id
            if (node = this.documentDOM.evaluate("atom10:id", feed, this.__nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
                feedInformation.id = this.__parseId(this.baseURI, node);
                node = null;
            } else {
                // atom:feed element MUST contain one atom:id element
                this.__reportError(new AtomInvalidException("The feed document must contain an <id> element.\n\n" + this.__serialiseNode(this.documentDOM)));
            }

            // iterate over all links*
            if (nodeIterator = this.documentDOM.evaluate("atom10:link", feed, this.__nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)) {
                while (node = nodeIterator.iterateNext()) {
                    feedInformation.links.push(this.__parseLink(this.baseURI, node));
                }
                node = null;
            }
            nodeIterator = null;

            // parse logo?
            if (node = this.documentDOM.evaluate("atom10:logo", feed, this.__nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
                feedInformation.logo = this.__parseLogo(this.baseURI, node);
                node = null;
            }

            // parse rights?
            if (node = this.documentDOM.evaluate("atom10:rights", feed, this.__nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
                feedInformation.rights = this.__parseTextConstruct(this.baseURI, node);
                node = null;
            }

            // parse subtitle?
            if (node = this.documentDOM.evaluate("atom10:subtitle", feed, this.__nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
                feedInformation.subtitle = this.__parseTextConstruct(this.baseURI, node);
                node = null;
            }

            // parse title
            if (node = this.documentDOM.evaluate("atom10:title", feed, this.__nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
                feedInformation.title = this.__parseTextConstruct(this.baseURI, node);
                node = null;
            } else {
                // atom:feed element MUST contain one atom:title element
                this.__reportError(new AtomInvalidException("The feed document must contain a <title> element.\n\n" + this.__serialiseNode(this.documentDOM)));
            }

            // parse updated
            if (node = this.documentDOM.evaluate("atom10:updated", feed, this.__nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) {
                feedInformation.updated = this.__parseDateConstruct(this.baseURI, node);
                node = null;
            } else {
                // atom:feed element MUST contain one atom:updated element
                this.__reportError(new AtomInvalidException("The feed document must contain an <updated> element.\n\n" + this.__serialiseNode(this.documentDOM)));
            }
        } else {
            /* An Atom feed document must have a atom:feed element as its root node.
             * This is fatal, so we don't distinguish between strict and lax parsing. */
            throw new AtomInvalidException("The feed document must contain a <feed> element as its root node.\n\n" + this.__serialiseNode(this.documentDOM));
        }

        return feedInformation;
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

        /* DEBUG */ dump("Yulup:atomparser10.js:AtomParser10.__nsResolver(\"" + aPrefix + "\") invoked\n");

        var namespace = {
            "atom10" : ATOM_10_NAMESPACE
        };

        return namespace[aPrefix] || null;
    },

    /**
     * Serialise the given node to a string. If no node
     * is passed in, null is returned.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {String} the serialisation of aNode, or null if aNode is null
     */
    __serialiseNode: function (aNode) {
        return (aNode ? this.xmlSerialiser.serializeToString(aNode) : null);
    },

    /**
     * Report an error, either by throwing the given
     * aError object, or by calling an error handler
     * with aError as its parameter.
     *
     * An error is thrown if the parser was set set
     * to strict mode during initialisation, otherwise
     * the error handler is called, if present.
     *
     * @param  {Error}     aError an Error object indicating the nature of the exceptional condition
     * @return {Undefined} does not have a return value
     * @throws {Error}
     */
    __reportError: function (aError) {
        /* DEBUG */ YulupDebug.ASSERT(aError != null);

        if (this.strict) {
            throw aError;
        } else if (this.errorHandler) {
            this.errorHandler(aError);
        }
    },

    /**
     * Parse the xml:base attribute of an Atom node.
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

        /* DEBUG */ YulupDebug.ASSERT(aNode != null, "Yulup:atomparser10.js:AtomParser10.__parseCommonAttributeBase", "aNode != null");
        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null, "Yulup:atomparser10.js:AtomParser10.__parseCommonAttributeBase", "aBaseURI != null");

        if (aNode) {
            xmlBase = aNode.getAttribute("base");
        }

        return (xmlBase ? this.ioService.newURI(xmlBase, null, null) : aBaseURI);
    },

    /**
     * Parse the xml:lang attribute of an Atom node.
     *
     * @param  {nsIDOMNode} aNode the node to operate on
     * @return {String}     the content of the xml:lang attribute or null if nonexistant
     */
    __parseCommonAttributeLang: function (aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null, "Yulup:atomparser10.js:AtomParser10.__parseCommonAttributeLang", "aNode != null");

        return aNode.getAttribute("lang");
    },

    /**
     * Construct an nsIURI.
     *
     * @param  {String} aURI     a URI
     * @param  {nsIURI} aBaseURI a base URI
     * @return {nsIURI} the URI constructed from aURI and aBaseURI (if aURI is relative), or null if aURI is null or empty
     */
    __constructURI: function (aURI, aBaseURI) {
        var uri = null;

        /* DEBUG */ dump("Yulup:atomparser10.js:AtomParser10.__constructURI(\"" + aURI + "\", \"" + aBaseURI + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null, "Yulup:atomparser10.js:AtomParser10.__constructURI", "aBaseURI != null");

        if (aURI && aURI != "") {
            uri = this.ioService.newURI(aURI, null, aBaseURI);
        }

        /* DEBUG */ dump("Yulup:atomparser10.js:AtomParser10.__constructURI: constructed uri = \"" + uri + "\"\n");
        return uri;
    },

    /**
     * Parse an atomPersonConstruct node.
     *
     * @param  {nsIURI}               aBaseURI         the parent base URI
     * @param  {nsIDOMNode}           aPersonConstruct the node to operate on
     * @return {Atom10Person}
     * @throws {AtomInvalidException}
     */
    __parsePersonConstruct: function (aBaseURI, aPersonConstruct) {
        var person = null;

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aPersonConstruct != null);

        person = new Atom10Person(this.__parseCommonAttributeBase(aPersonConstruct, aBaseURI), this.__parseCommonAttributeLang(aPersonConstruct));

        if (!(person.name = this.documentDOM.evaluate("atom10:name/text()", aPersonConstruct, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue))
            this.__reportError(new AtomInvalidException("A person construct must contain a <name> element.\n\n" + this.__serialiseNode(aPersonConstruct)));

        person.uri   = this.__constructURI(this.documentDOM.evaluate("atom10:uri/text()", aPersonConstruct, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue, person.base);
        person.email = this.documentDOM.evaluate("atom10:email/text()", aPersonConstruct, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        return person;
    },

    /**
     * Parse an atom:category node.
     *
     * @param  {nsIURI}               aBaseURI  the parent base URI
     * @param  {nsIDOMNode}           aCategory the node to operate on
     * @return {Atom10Category}
     * @throws {AtomInvalidException}
     */
    __parseCategory: function (aBaseURI, aCategory) {
        var category = null;

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aCategory != null);

        category = new Atom10Category(this.__parseCommonAttributeBase(aCategory, aBaseURI), this.__parseCommonAttributeLang(aCategory));

        if (!(category.term = this.documentDOM.evaluate("attribute::term", aCategory, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue))
            this.__reportError(new AtomInvalidException("A category element must contain a term attribute.\n\n" + this.__serialiseNode(aCategory)));

        category.scheme = this.documentDOM.evaluate("attribute::scheme", aCategory, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        category.label  = this.documentDOM.evaluate("attribute::label", aCategory, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        return category;
    },

    /**
     * Parse an atom:generator node.
     *
     * @param  {nsIURI}          aBaseURI  the parent base URI
     * @param  {nsIDOMNode}      aGenerator the node to operate on
     * @return {Atom10Generator}
     */
    __parseGenerator: function (aBaseURI, aGenerator) {
        var generator = null;

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aGenerator != null);

        generator = new Atom10Generator(this.__parseCommonAttributeBase(aGenerator, aBaseURI), this.__parseCommonAttributeLang(aGenerator));

        generator.uri     = this.__constructURI(this.documentDOM.evaluate("attribute::uri", aGenerator, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue, generator.base);
        generator.version = this.documentDOM.evaluate("attribute::version", aGenerator, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        generator.text    = this.documentDOM.evaluate("text()", aGenerator, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        return generator;
    },

    /**
     * Parse an atom:icon node.
     *
     * @param  {nsIURI}     aBaseURI the parent base URI
     * @param  {nsIDOMNode} aIcon    the node to operate on
     * @return {Atom10Icon}
     */
    __parseIcon: function (aBaseURI, aIcon) {
        var icon = null;

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aIcon != null);

        icon = new Atom10Icon(this.__parseCommonAttributeBase(aIcon, aBaseURI), this.__parseCommonAttributeLang(aIcon));

        icon.uri = this.__constructURI(this.documentDOM.evaluate("text()", aIcon, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue, icon.base);

        return icon;
    },

    /**
     * Parse an atom:id node.
     *
     * @param  {nsIURI}     aBaseURI the parent base URI
     * @param  {nsIDOMNode} aId      the node to operate on
     * @return {Atom10Id}
     */
    __parseId: function (aBaseURI, aId) {
        var id = null;

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aId != null);

        id = new Atom10Id(this.__parseCommonAttributeBase(aId, aBaseURI), this.__parseCommonAttributeLang(aId));

        id.uri = this.documentDOM.evaluate("text()", aId, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        return id;
    },

    /**
     * Parse an atom:link node.
     *
     * @param  {nsIURI}               aBaseURI  the parent base URI
     * @param  {nsIDOMNode}           aLink     the node to operate on
     * @return {Atom10Link}
     * @throws {AtomInvalidException}
     */
    __parseLink: function (aBaseURI, aLink) {
        var link = null;

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aLink != null);

        link = new Atom10Link(this.__parseCommonAttributeBase(aLink, aBaseURI), this.__parseCommonAttributeLang(aLink));

        if (!(link.href = this.__constructURI(this.documentDOM.evaluate("attribute::href", aLink, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue, link.base)))
            this.__reportError(new AtomInvalidException("A link element must contain a href attribute.\n\n" + this.__serialiseNode(aLink)));

        link.rel      = this.documentDOM.evaluate("attribute::rel", aLink, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        link.type     = this.documentDOM.evaluate("attribute::type", aLink, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        link.hreflang = this.documentDOM.evaluate("attribute::hreflang", aLink, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        link.title    = this.documentDOM.evaluate("attribute::title", aLink, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        link.length   = this.documentDOM.evaluate("attribute::length", aLink, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        return link;
    },

    /**
     * Parse an atom:logo node.
     *
     * @param  {nsIURI}     aBaseURI the parent base URI
     * @param  {nsIDOMNode} aLogo    the node to operate on
     * @return {Atom10Id}
     */
    __parseLogo: function (aBaseURI, aLogo) {
        var logo = null;

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aLogo != null);

        logo = new Atom10Logo(this.__parseCommonAttributeBase(aLogo, aBaseURI), this.__parseCommonAttributeLang(aLogo));

        logo.uri = this.__constructURI(this.documentDOM.evaluate("text()", aLogo, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue, logo.base);

        return logo;
    },

    /**
     * Parse an atomTextConstruct node.
     *
     * @param  {nsIURI}     aBaseURI       the parent base URI
     * @param  {nsIDOMNode} aTextConstruct the node to operate on
     * @return {AtomText}
     */
    __parseTextConstruct: function (aBaseURI, aTextConstruct) {
        var text = null;
        var type = null;

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aTextConstruct != null);

        switch (aTextConstruct.getAttribute("type")) {
        case "xhtml":
            text = new Atom10XHTMLText(this.__parseCommonAttributeBase(aTextConstruct, aBaseURI), this.__parseCommonAttributeLang(aTextConstruct));
            text.xhtmlDiv = this.__serialiseNode(aTextConstruct.firstChild);
            break;
        case "html":
            text = new Atom10PlainText(this.__parseCommonAttributeBase(aTextConstruct, aBaseURI), this.__parseCommonAttributeLang(aTextConstruct));
            text.text = "";

            for (var node = aTextConstruct.firstChild; node != null; node = node.nextSibling) {
                text.text += this.__serialiseNode(node);
            }

            break;
        case "text":
            // fall through
        default:
            // assume plaintext
            text = new Atom10PlainText(this.__parseCommonAttributeBase(aTextConstruct, aBaseURI), this.__parseCommonAttributeLang(aTextConstruct));
            text.text = this.documentDOM.evaluate("text()", aTextConstruct, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        }

        return text;
    },

    /**
     * Parse an atomDateConstruct node.
     *
     * @param  {nsIURI}     aBaseURI       the parent base URI
     * @param  {nsIDOMNode} aDateConstruct the node to operate on
     * @return {Atom10Date}
     */
    __parseDateConstruct: function (aBaseURI, aDateConstruct) {
        var date = null;

        /* DEBUG */ YulupDebug.ASSERT(aBaseURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aDateConstruct != null);

        date = new Atom10Date(this.__parseCommonAttributeBase(aDateConstruct, aBaseURI), this.__parseCommonAttributeLang(aDateConstruct));

        date.date = this.documentDOM.evaluate("text()", aDateConstruct, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        return date;
    }
};


/**
 * AtomInvalidException constructor. Instantiates a new object of
 * type AtomInvalidException.
 *
 * Exceptions of this type are not exceptions as thrown by the
 * server, but signal error conditions in the actual parser
 * or helper functions.
 *
 * @constructor
 * @param  {String}               aMessage a descriptive error message
 * @return {AtomInvalidException}
 */
function AtomInvalidException(aMessage) {
    // call super constructor
    AtomException.call(this, aMessage);

    this.name = "AtomInvalidException";
}

AtomInvalidException.prototype.__proto__ = AtomException.prototype;


/**
 * Atom10FeedInformation constructor. Instantiates a new object of
 * type Atom10FeedInformation.
 *
 * @constructor
 * @param  {nsIURI}                aBaseURI a xml base URI
 * @param  {String}                aLang    a xml lang
 * @return {Atom10FeedInformation} a new Atom10FeedInformation object
 */
function Atom10FeedInformation(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10FeedInformation() invoked\n");

    // call super constructor
    AtomFeedInformation.call(this, aBaseURI, aLang);
}

Atom10FeedInformation.prototype = {
    __proto__:  AtomFeedInformation.prototype
};


/**
 * Atom10PlainText constructor. Instantiates a new object of
 * type Atom10PlainText.
 *
 * @constructor
 * @param  {nsIURI}          aBaseURI a xml base URI
 * @param  {String}          aLang    a xml lang
 * @return {Atom10PlainText} a new Atom10PlainText object
 */
function Atom10PlainText(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10PlainText() invoked\n");

    // call super constructor
    AtomPlainText.call(this, aBaseURI, aLang);
}

Atom10PlainText.prototype = {
    __proto__:  AtomPlainText.prototype
};


/**
 * Atom10XHTMLText constructor. Instantiates a new object of
 * type Atom10XHTMLText.
 *
 * @constructor
 * @param  {nsIURI}          aBaseURI a xml base URI
 * @param  {String}          aLang    a xml lang
 * @return {Atom10XHTMLText} a new Atom10XHTMLText object
 */
function Atom10XHTMLText(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10XHTMLText() invoked\n");

    // call super constructor
    AtomXHTMLText.call(this, aBaseURI, aLang);
}

Atom10XHTMLText.prototype = {
    __proto__:  AtomXHTMLText.prototype
};


/**
 * Atom10Person constructor. Instantiates a new object of
 * type Atom10Person.
 *
 * @constructor
 * @param  {nsIURI}       aBaseURI a xml base URI
 * @param  {String}       aLang    a xml lang
 * @return {Atom10Person} a new Atom10Person object
 */
function Atom10Person(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10Person() invoked\n");

    // call super constructor
    AtomPerson.call(this, aBaseURI, aLang);
}

Atom10Person.prototype = {
    __proto__:  AtomPerson.prototype
};


/**
 * Atom10Category constructor. Instantiates a new object of
 * type Atom10Category.
 *
 * @constructor
 * @param  {nsIURI}         aBaseURI a xml base URI
 * @param  {String}         aLang    a xml lang
 * @return {Atom10Category} a new Atom10Category object
 */
function Atom10Category(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10Category() invoked\n");

    // call super constructor
    AtomCategory.call(this, aBaseURI, aLang);
}

Atom10Category.prototype = {
    __proto__:  AtomCategory.prototype
};


/**
 * Atom10Date constructor. Instantiates a new object of
 * type Atom10Date.
 *
 * @constructor
 * @param  {nsIURI}     aBaseURI a xml base URI
 * @param  {String}     aLang    a xml lang
 * @return {Atom10Date} a new Atom10Date object
 */
function Atom10Date(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10Date() invoked\n");

    // call super constructor
    AtomDate.call(this, aBaseURI, aLang);
}

Atom10Date.prototype = {
    __proto__:  AtomDate.prototype
};


/**
 * Atom10Generator constructor. Instantiates a new object of
 * type Atom10Generator.
 *
 * @constructor
 * @param  {nsIURI}          aBaseURI a xml base URI
 * @param  {String}          aLang    a xml lang
 * @return {Atom10Generator} a new Atom10Generator object
 */
function Atom10Generator(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10Generator() invoked\n");

    // call super constructor
    AtomCategory.call(this, aBaseURI, aLang);
}

Atom10Generator.prototype = {
    __proto__:  AtomCategory.prototype
};


/**
 * Atom10Icon constructor. Instantiates a new object of
 * type Atom10Icon.
 *
 * @constructor
 * @param  {nsIURI}     aBaseURI a xml base URI
 * @param  {String}     aLang    a xml lang
 * @return {Atom10Icon} a new Atom10Icon object
 */
function Atom10Icon(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10Icon() invoked\n");

    // call super constructor
    AtomIcon.call(this, aBaseURI, aLang);
}

Atom10Icon.prototype = {
    __proto__:  AtomIcon.prototype
};


/**
 * Atom10Id constructor. Instantiates a new object of
 * type Atom10Id.
 *
 * @constructor
 * @param  {nsIURI}   aBaseURI a xml base URI
 * @param  {String}   aLang    a xml lang
 * @return {Atom10Id} a new Atom10Id object
 */
function Atom10Id(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10Id() invoked\n");

    // call super constructor
    AtomId.call(this, aBaseURI, aLang);
}

Atom10Id.prototype = {
    __proto__:  AtomId.prototype
};


/**
 * Atom10Logo constructor. Instantiates a new object of
 * type Atom10Logo.
 *
 * @constructor
 * @param  {nsIURI}     aBaseURI a xml base URI
 * @param  {String}     aLang    a xml lang
 * @return {Atom10Logo} a new Atom10Logo object
 */
function Atom10Logo(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10Logo() invoked\n");

    // call super constructor
    AtomId.call(this, aBaseURI, aLang);
}

Atom10Logo.prototype = {
    __proto__:  AtomId.prototype
};


/**
 * Atom10Link constructor. Instantiates a new object of
 * type Atom10Link.
 *
 * @constructor
 * @param  {nsIURI}     aBaseURI a xml base URI
 * @param  {String}     aLang    a xml lang
 * @return {Atom10Link} a new Atom10Link object
 */
function Atom10Link(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10Link() invoked\n");

    // call super constructor
    AtomLink.call(this, aBaseURI, aLang);
}

Atom10Link.prototype = {
    __proto__:  AtomLink.prototype
};


/**
 * Atom10Source constructor. Instantiates a new object of
 * type Atom10Source.
 *
 * @constructor
 * @param  {nsIURI}       aBaseURI a xml base URI
 * @param  {String}       aLang    a xml lang
 * @return {Atom10Source} a new Atom10Source object
 */
function Atom10Source(aBaseURI, aLang) {
    /* DEBUG */ dump("Yulup:atomparser10.js:Atom10Source() invoked\n");

    // call super constructor
    AtomSource.call(this, aBaseURI, aLang);
}

Atom10Source.prototype = {
    __proto__:  AtomSource.prototype
};
