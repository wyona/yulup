/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright 2007 Wyona AG Zurich
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

function HTML401StrictValidator(aDocument) {
    /* DEBUG */ YulupDebug.ASSERT(aDocument != null);

    /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictValidator() invoked\n");

    Validator.call(this, aDocument);

    // get a DTD instance
    this.__dtd = new HTML401StrictDTD();
}

HTML401StrictValidator.prototype = {
    __proto__:  Validator.prototype,

    __document: null,
    __dtd     : null,

    get dtd() {
        return this.__dtd;
    },

    NodeEditVAL: function (aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        /* DEBUG */ dump("Yulup:html401strictvalidator.js:NodeEditVAL(\"" + aNode + "\") invoked\n");

        if (aNode instanceof Components.interfaces.nsIDOMNode) {
            return new HTML401StrictNodeEditVAL(this, aNode);
        } else {
            throw new ValidatorInvalidNodeTypeException("Node must be of type nsIDOMNode");
        }
    },

    ElementEditVAL: function (aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        /* DEBUG */ dump("Yulup:html401strictvalidator.js:ElementEditVAL(\"" + aNode + "\") invoked\n");

        if (aNode instanceof Components.interfaces.nsIDOMElement) {
            return new HTML401StrictElementEditVAL(this, aNode);
        } else {
            throw new ValidatorInvalidNodeTypeException("Node must be of type nsIDOMElement");
        }
    },

    CharacterDataEditVAL: function (aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        /* DEBUG */ dump("Yulup:html401strictvalidator.js:CharacterDataEditVAL(\"" + aNode + "\") invoked\n");

        if (aNode instanceof Components.interfaces.nsIDOMCharacterData) {
            return new HTML401StrictCharacterDataEditVAL(this, aNode);
        } else {
            throw new ValidatorInvalidNodeTypeException("Node must be of type nsIDOMCharacterData");
        }
    },

    DocumentEditVAL: function (aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        /* DEBUG */ dump("Yulup:html401strictvalidator.js:DocumentEditVAL(\"" + aNode + "\") invoked\n");

        if (aNode instanceof Components.interfaces.nsIDOMDocument) {
            return new HTML401StrictDocumentEditVAL(this, aNode);
        } else {
            throw new ValidatorInvalidNodeTypeException("Node must be of type nsIDOMDocument");
        }
    }
};


function HTML401StrictNodeEditVAL(aValidator, aNode) {
    /* DEBUG */ YulupDebug.ASSERT(aValidator != null);
    /* DEBUG */ YulupDebug.ASSERT(aNode      != null);

    /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictNodeEditVAL() invoked\n");

    NodeEditVAL.call(this, aValidator, aNode);
}

HTML401StrictNodeEditVAL.prototype = {
    __proto__:  NodeEditVAL.prototype,

    VAL_WF        : 1,  // check if the node is well formed
    VAL_NS_WF     : 2,  // check if the node is namespace well-formed
    VAL_INCOMPLETE: 3,  // check if the node's immediate children are those excpected by the content model; this node's trailing required children could be missing; it includes VAL_NS_WF
    VAL_SCHEMA    : 4,  // check if the node's entire subtree are those expected by the content model; it includes VAL_NS_WF

    VAL_TRUE   : 5,     // false if the node is invalid with regards to the operation, or if the operation cannot be done
    VAL_FALSE  : 6,     // true if the node is valid with regards to the operation, or if the operation can be done
    VAL_UNKNOWN: 7,     // the validity of the node is unknown

    /**
     * The default value specified in an attribute or an element declaration
     * or null if unspecified. If the schema is a W3C XML schema, this is the
     * canonical lexical representation of the default value.
     *
     * @return {String}
     */
    get defaultValue() {
        return null;
    },

    /**
     * A DOMStringList, as described in DOM Level 3 Core, of distinct values for
     * an attribute or an element declaration or null  if unspecified. If the schema
     * is a W3C XML schema, this is a list of strings which are lexical representations
     * corresponding to the values in the [value] property of the enumeration component
     * for the type of the attribute or element. It is recommended that the canonical
     * lexical representations of the values be used.
     *
     * @return {DOMStringList}
     */
    get enumeratedValues() {
        return null;
    },

    /**
     * Determines whether the Node.insertBefore operation would make this document not
     * compliant with the VAL_INCOMPLETE validity type.
     *
     * @param  {nsIDOMNode} aNewChild node to be inserted
     * @param  {nsIDOMNode} aRefChild reference Node
     * @return {Number} returns a validation state constant
     */
    canInsertBefore: function (aNewChild, aRefChild) {
        return null;
    },

    /**
     * Determines whether the Node.removeChild operation would make this document not
     * compliant with the VAL_INCOMPLETE validity type.
     *
     * @param  {nsIDOMNode} aOldChild node to be removed
     * @return {Number} returns a validation constant
     */
    canRemoveChild: function (aOldChild) {
        return null;
    },

    /**
     * Determines whether the Node.replaceChild operation would make this document not
     * compliant with the VAL_INCOMPLETE validity type.
     *
     * @param {nsIDOMNode} aNewChild new node
     * @param {nsIDOMNode} aOldChild node to be replaced
     * @return {Number} returns a validation constant
     */
    canReplaceChild: function (aNewChild, aOldChild) {
        return null;
    },

    /**
     * Determines whether the Node.appendChild operation would make this document not
     * compliant with the VAL_INCOMPLETE validity type.
     *
     * @param  {nsIDOMNode} aNewChild node to be appended
     * @return {Number} returns a validation constant
     */
    canAppendChild: function (aNewChild) {
        return null;
    },

    /**
     * Determines if the node is valid relative to the validation type specified in
     * valType. This operation doesn't normalize before checking if it is valid. To do
     * so, one would need to explicitly call a normalize method. The difference between
     * this method and the DocumentEditVAL.validateDocument method is that the latter
     * method only checks to determine whether the entire document is valid.
     *
     * @param  {Number} aValType flag to indicate the validation type  checking to be done
     * @return {Number} returns a validation constant
     */
    nodeValidity: function (aValType) {
        return null;
    }
};


function HTML401StrictElementEditVAL(aValidator, aNode) {
    /* DEBUG */ YulupDebug.ASSERT(aValidator != null);
    /* DEBUG */ YulupDebug.ASSERT(aNode      != null);

    /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictElementEditVAL() invoked\n");

    HTML401StrictNodeEditVAL.call(this, aValidator, aNode);
}

HTML401StrictElementEditVAL.prototype = {
    __proto__:  HTML401StrictNodeEditVAL.prototype,

    VAL_EMPTY_CONTENTTYPE   : 1,  // the content model does not allow any content; if the schema is a W3C XML schema, this corresponds to the empty content type; and if the schema is a DTD, this corresponds to the EMPTY content model
    VAL_ANY_CONTENTTYPE     : 2,  // the content model contains unordered child information item(s), i.e., element, processing instruction, unexpanded entity reference, character, and comment information items as defined in the XML Information Set; if the schema is a DTD, this corresponds to the ANY content model
    VAL_MIXED_CONTENTTYPE   : 3,  // the content model contains a sequence of ordered element information items  optionally interspersed with character data; if the schema is a W3C XML schema, this corresponds to the mixed  content type
    VAL_ELEMENTS_CONTENTTYPE: 4,  // the content model contains a sequence of element information items optionally separated by whitespace; if the schema is a DTD, this is the element content content model; and if the schema is a W3C XML schema, this is the element-only content type.
    VAL_SIMPLE_CONTENTTYPE  : 5,  // the content model contains character information items; if the schema is a W3C XML schema, then the element has a content type of VAL_SIMPLE_CONTENTTYPE if the type of the element is a simple type definition, or the type of the element is a complexType whose {content type} is a simple type definition

    __lookupElem: function (aElemName) {
        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictElementEditVAL.__lookupElem(\"" + aElemName + "\") invoked\n");

        return this.__validator.dtd.elementMap[aElemName];
    },

    /**
     * A NameList, as described in DOM Level 3 Core, of all possible attribute information
     * items or wildcards that can appear as attributes of this element, or null if this
     * element has no context or schema. Duplicate pairs of {namespaceURI, name} are eliminated.
     *
     * @return {NameList}
     */
    get allowedChildren() {
        var elem     = null;
        var children = null;
        var map      = null;

        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictElementEditVAL.allowedChildren() invoked\n");

        map = new ValidatorNameList();

        elem = this.__lookupElem(this.__node.localName);

        if (!elem)
            return null;

        children = elem.getAllChildren();

        for (var i = 0; i < children.length; i++) {
            map.addNameNS(children[i].namespaceURI, children[i].name);
        }

        return map;
    },

    /**
     * A NameList, as described in DOM Level 3 Core, of all possible element information
     * items or wildcards that can appear as a first child of this element, or null if this
     * element has no context or schema. Duplicate pairs of {namespaceURI, name} are eliminated.
     *
     * @return {NameList}
     */
    get allowedFirstChildren() {
        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictElementEditVAL.allowedFirstChildren() invoked\n");

        return null;
    },

    /**
     * A NameList, as described in DOM Level 3 Core, of all possible element information items
     * that can appear as a parent this element, or null if this element has no context or schema.
     *
     * @return {NameList}
     */
    get allowedParents() {
        var elem    = null;
        var parents = null;
        var map     = null;

        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictElementEditVAL.allowedParents() invoked\n");

        map = new ValidatorNameList();

        elem = this.__lookupElem(this.__node.localName);

        if (!elem)
            return null;

        parents = elem.getParents();

        for (var i = 0; i < parents.length; i++) {
            map.addNameNS(parents[i].namespaceURI, parents[i].name);
        }

        return map;
    },

    /**
     * A NameList, as described in DOM Level 3 Core, of all element information items or wildcards
     * that can be inserted as a next sibling of this element, or null  if this element has no
     * context or schema. Duplicate pairs of {namespaceURI, name} are eliminated.
     *
     * @return {NameList}
     */
    get allowedNextSiblings() {
        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictElementEditVAL.allowedNextSiblings() invoked\n");

        return null;
    },

    /**
     * A NameList, as described in DOM Level 3 Core, of all element information items or wildcards
     * that can be inserted as a previous sibling of this element, or null if this element has no
     * context or schema.
     *
     * @return {NameList}
     */
    get allowedPreviousSiblings() {
        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictElementEditVAL.allowedPreviousSiblings() invoked\n");

        return null;
    },

    /**
     * A NameList, as described in DOM Level 3 Core, of all possible attribute information items or
     * wildcards that can appear as attributes of this element, or null  if this element has no context
     * or schema. Duplicate pairs of {namespaceURI, name} are eliminated.
     *
     * @return {NameList}
     */
    get allowedAttributes() {
        var elem  = null;
        var attrs = null;
        var map   = null;

        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictElementEditVAL.allowedAttributes() invoked\n");

        map = new ValidatorNameList();

        elem = this.__lookupElem(this.__node.localName);

        if (!elem)
            return null;

        attrs = elem.getAttributes();

        for (var i = 0; i < attrs.length; i++) {
            map.addNameNS(attrs[i].namespaceURI, attrs[i].name);
        }

        return map;
    },

    /**
     * A NameList, as described in DOM Level 3 Core, of required attribute information items that must
     * appear on this element, or null if this element has no context or schema.
     *
     * @return {NameList}
     */
    get requiredAttributes() {
        var elem  = null;
        var attrs = null;
        var map   = null;

        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictElementEditVAL.requiredAttributes() invoked\n");

        map = new ValidatorNameList();

        elem = this.__lookupElem(this.__node.localName);

        if (!elem)
            return null;

        attrs = elem.getAttributes();

        for (var i = 0; i < attrs.length; i++) {
            if (attrs[i].isRequired)
                map.addNameNS(attrs[i].namespaceURI, attrs[i].name);
        }

        return map;
    },

    /**
     * The content type of an element as defined above.
     *
     * @return {Number}
     */
    get contentType() {
        var elem        = null;
        var contentType = null;

        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictElementEditVAL.contentType() invoked\n");

        elem = this.__lookupElem(this.__node.localName);

        if (!elem)
            return null;

        switch (elem.contentModel) {
            case DTDElementTypeDeclaration.CONTENT_MODEL_EMPTY:
                contentType = this.VAL_EMPTY_CONTENTTYPE;
                break;
            case DTDElementTypeDeclaration.CONTENT_MODEL_ANY:
                contentType = this.VAL_ANY_CONTENTTYPE;
                break;
            case DTDElementTypeDeclaration.CONTENT_MODEL_MIXED:
                contentType = this.VAL_MIXED_CONTENTTYPE;
                break;
            case DTDElementTypeDeclaration.CONTENT_MODEL_ELEMENT_CONTENT:
                contentType = this.VAL_ELEMENTS_CONTENTTYPE;
                break;
        }

        return contentType;
    },

    /**
     * Determines if the text content of this node and its descendants can be set to the string
     * passed in.
     *
     * @param  {String} aPossibleTextContent possible text content
     * @return {Number} returns a validation state constant
     */
    canSetTextContent: function (aPossibleTextContent) {
        return null;
    },

    /**
     * Determines if the value for specified attribute can be set.
     *
     * @param  {String} aAttrname name of attribute
     * @param  {String} aAttrval  value to be assigned to the attribute
     * @return {Number} returns a validation state constant
     */
    canSetAttribute: function (aAttrname, aAttrval) {
        return null;
    },

    /**
     * Determines if an attribute node can be added.
     *
     * @param  {nsIDOMNode} aAttrNode node in which the attribute can possibly be set
     * @return {Number} returns a validation state constant
     */
    canSetAttributeNode: function (aAttrNode) {
        return null;
    },

    /**
     * Determines if the attribute with given namespace and qualified name can be created
     * if not already present in the attribute list of the element. If the attribute with
     * the same qualified name and namespaceURI is already present in the element's attribute
     * list, it tests whether the value of the attribute and its prefix can be set to the
     * new value.
     *
     * @param  {String} aNamespaceURI  namespaceURI of namespace
     * @param  {String} aQualifiedName qualified name of attribute
     * @param  {String} aLocalName     value to be assigned to the attribute
     * @return {Number} returns a validation state constant
     */
    canSetAttributesNS: function (aNamespaceURI, aQualifiedName, aLocalName) {
        return null;
    },

    /**
     * Verifies if an attribute by the given name can be removed.
     *
     * @param  {String} aAttrname name of attribute
     * @return {Number} returns a validation state constant
     */
    canRemoveAttribute: function (aAttrname) {
        return null;
    },

    /**
     * Verifies if an attribute by the given local name and namespace can be removed.
     *
     * @param  {String} aNamespaceURI the namespace URI of the attribute to remove
     * @param  {String} aLocalName    local name of the attribute to be removed
     * @return {Number} returns a validation state constant
     */
    canRemoveAttributeNS: function (aNamespaceURI, aLocalName) {
        return null;
    },

    /**
     * Determines if an attribute node can be removed.
     *
     * @param  {nsIDOMNode} aAttrNode the attribute node to remove from the attribute list
     * @return {Number} returns a validation state constant
     */
    canRemoveAttributeNode: function (aAttrNode) {
        return null;
    },

    /**
     * Determines if name is defined in the schema. This only applies to global declarations.
     * This method is for non-namespace aware schemas.
     *
     * @param  {String} aName name of element
     * @return {Number} returns a validation state constant
     */
    isElementDefined: function (aName) {
        return null;
    },

    /**
     * Determines if name in this namespace is defined in the current context. Thus not only
     * does this apply to global declarations. but depending on the content, this may also
     * apply to local definitions. This method is for namespace aware schemas.
     *
     * @param  {String} aNamespaceURI namespaceURI of namespace
     * @param  {String} aName         name of element
     * @return {Number} returns a validation state constant
     */
    isElementDefinedNS: function (aNamespaceURI, aName) {
        return null;
    }
};


function HTML401StrictCharacterDataEditVAL(aValidator, aNode) {
    /* DEBUG */ YulupDebug.ASSERT(aValidator != null);
    /* DEBUG */ YulupDebug.ASSERT(aNode      != null);

    /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictCharacterDataEditVAL() invoked\n");

    HTML401StrictNodeEditVal.call(this, aValidator, aNode);
}

HTML401StrictCharacterDataEditVAL.prototype = {
    __proto__:  HTML401StrictNodeEditVAL.prototype,

    /**
     * Determines if character data is only whitespace.
     *
     * @return {Number} returns a validation state constant
     */
    isWhitespaceOnly: function () {
        return null;
    },

    /**
     * Determines if character data can be set.
     *
     * @param  {String} aArg argument to be set
     * @return {Number} returns a validation state constant
     */
    canSetData: function (aArg) {
        return null;
    },

    /**
     * Determines if character data can be appended.
     *
     * @param  {String} aArg data to be appended
     * @return {Number} returns a validation state constant
     */
    canAppendData: function (aArg) {
        return null;
    },

    /**
     * Determines if character data can be replaced.
     *
     * @param  {Number} aOffset offset
     * @param  {Number} aCount  replacement
     * @param  {String} aArg    argument to be set
     * @return {Number} returns a validation state constant
     * @throws {DOMException} INDEX_SIZE_ERR: raised if the specified offset is negative or greater than the number of 16-bit units in data, or if the specified count is negative
     */
    canReplaceData: function (aOffset, aCount, aArg) {
        return null;
    },

    /**
     * Determines if character data can be inserted.
     *
     * @param  {Number} aOffset offset
     * @param  {String} aArg    argument to be set
     * @return {Number} returns a validation state constant
     * @throws {DOMException} INDEX_SIZE_ERR: raised if the specified offset is negative or greater than the number of 16-bit units in data
     */
    canInsertData: function (aOffset, aArg) {
        return null;
    },

    /**
     * Determines if character data can be deleted.
     *
     * @param  {Number} aOffset offset
     * @param  {Number} aCount  number of 16-bit units to delete
     * @return {Number} returns a validation state constant
     * @throws {DOMException} INDEX_SIZE_ERR: raised if the specified offset is negative or greater than the number of 16-bit units in data, or if the specified count is negative
     */
    canDeleteData: function (aOfffset, aCount) {
        return null;
    }
};


function HTML401StrictDocumentEditVAL(aValidator, aNode) {
    /* DEBUG */ YulupDebug.ASSERT(aValidator != null);
    /* DEBUG */ YulupDebug.ASSERT(aNode      != null);

    /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictDocumentEditVAL() invoked\n");

    HTML401StrictNodeEditVAL.call(this, aValidator, aNode);
}

HTML401StrictDocumentEditVAL.prototype = {
    __proto__:  HTML401StrictNodeEditVAL.prototype,

    /**
     * An attribute specifying whether the validity of the document is continuously enforced.
     * When the attribute is set to true, the implementation may raise certain exceptions,
     * depending on the situation (see the following). This attribute is false by default.
     *
     * @return {Boolean}
     */
    get continuousValidityChecking() {
    },

    /**
     * An attribute specifying whether the validity of the document is continuously enforced.
     * When the attribute is set to true, the implementation may raise certain exceptions,
     * depending on the situation (see the following). This attribute is false by default.
     *
     * @param {Boolean} aValue
     * @throw {DOMException} NOT_SUPPORTED_ERR: raised if the implementation does not support setting this attribute to true
     * @throw {DOMException} VALIDATION_ERR: raised if an operation makes this document not compliant with the VAL_INCOMPLETE validity type or the document is invalid, and this attribute is set to true
     * @throw {ExceptionVAL} NO_SCHEMA_AVAILABLE_ERR: raised if this attribute is set to true  and a schema is unavailable
     */
    set continuousValidityChecking(aValue) {
    },

    /**
     * This allows the setting of the error handler, as described in the DOM Level 3 Core
     * DOMConfiguration interface. An object implementing this DocumentEditVAL interface and
     * the DOM Level 3 Core Document interface, which also has a domConfig attribute, needs to
     * only implement this attribute once.
     *
     * @return {DOMConfiguration}
     */
    get domConfig() {
    },

    /**
     * Returns list of all element information item names of global declaration, belonging to
     * the specified namespace.
     *
     * @param  {String} aNamespaceURI namespaceURI of namespace; for DTDs, this is null
     * @return {NameList} returns a list of all element information item names belonging to the specified namespace or null if no schema is available
     */
    getDefinedElements: function (aNamespaceURI) {
        return null;
    },

    /**
     * Validates the document against the schema, e.g., a DTD or an W3C XML schema or another.
     * Any attempt to modify any part of the document while validating results in
     * implementation-dependent behavior. In addition, the validation operation itself cannot
     * modify the document, e.g., for default attributes. This method makes use of the error handler,
     * as described in the DOM Level 3 Core DOMConfiguration interface, with all errors being
     * SEVERITY_ERROR as defined in the DOMError interface.
     *
     * @return {Number} returns a validation state constant
     */
    validateDocument: function () {
        return null;
    }
};


function HTML401StrictDTD() {
    /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictDTD() invoked\n");

    DTD.call(this);
}

HTML401StrictDTD.prototype = {
    __proto__:  DTD.prototype,

    // TODO: complete me
    /*
    elementMap: {
        TT      : this.elemTT,
        I       : this.elemI,
        B       : this.elemB,
        BIG     : this.elemBIG,
        SMALL   : this.elemSMALL,
        EM      : this.elemEM,
        STRONG  : this.elemSTRONG,
        DFN     : this.elemDFN,
        CODE    : this.elemCODE,
        SAMP    : this.elemSAMP,
        KBD     : this.elemKBD,
        VAR     : this.elemVAR,
        CITE    : this.elemCITE,
        ABBR    : this.elemABBR,
        ACRONYM : this.elemACRONYM,
        A       : this.elemA,
        IMG     : this.elemIMG,
        OBJECT  : this.elemOBJECT,
        BR      : this.elemBR,
        SCRIPT  : this.elemSCRIPT,
        MAP     : this.elemMAP,
        Q       : this.elemQ,
        SUB     : this.elemSUB,
        SUP     : this.elemSUP,
        SPAN    : this.elemSPAN,
        BDO     : this.elemBDO,
        INPUT   : this.elemINPUT,
        SELECT  : this.elemSELECT,
        TEXTAREA: this.elemTEXTAREA,
        LABEL   : this.elemLABEL,
        BUTTON  : this.elemBUTTON
    },
    */

    get elementMap() {
        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictDTD.elementMap() invoked\n");

        return {
            A: this.elemA
        }
    },

    __elemA: null,
    get elemA() {
        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictDTD.elemA() invoked\n");

        if (!this.__elemA) {
            this.__elemA = new DTDElementTypeDeclaration("A",
                                                         null,
                                                         null,
                                                         new DTDAttrList(this.attrCharset,
                                                                         this.attrType,
                                                                         this.attrName,
                                                                         this.attrHref)
                                                         );
        }

        return this.__elemA;
    },

    __attrCharset: null,
    get attrCharset() {
        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictDTD.attrCharset() invoked\n");

        if (!this.__attrCharset) {
            this.__attrCharset = new DTDAttributeDeclaration("charset", "CDATA", "#IMPLIED", null);
        }

        return this.__attrCharset;
    },

    __attrType: null,
    get attrType() {
        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictDTD.attrType() invoked\n");

        if (!this.__attrType) {
            this.__attrType = new DTDAttributeDeclaration("type", "CDATA", "#IMPLIED", null);
        }

        return this.__attrType;
    },

    __attrName: null,
    get attrName() {
        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictDTD.attrName() invoked\n");

        if (!this.__attrName) {
            this.__attrName = new DTDAttributeDeclaration("name", "CDATA", "#IMPLIED", null);
        }

        return this.__attrName;
    },

    __attrHref: null,
    get attrHref() {
        /* DEBUG */ dump("Yulup:html401strictvalidator.js:HTML401StrictDTD.attrHref() invoked\n");

        if (!this.__attrHref) {
            this.__attrHref = new DTDAttributeDeclaration("href", "CDATA", "#IMPLIED", null);
        }

        return this.__attrHref;
    }
};
