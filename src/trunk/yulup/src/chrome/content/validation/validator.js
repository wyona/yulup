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

const DOCTYPE_HTML401_STRICT       = "-//W3C//DTD HTML 4.01//EN";
const DOCTYPE_HTML401_TRANSITIONAL = "-//W3C//DTD HTML 4.01 Transitional//EN";
const DOCTYPE_HTML401_FRAMESET     = "-//W3C//DTD HTML 4.01 Frameset//EN";

const Validation = {
    validatorFactory: function (aDocument, aDocumentType) {
        var validator = null;

        /* DEBUG */ YulupDebug.ASSERT(aDocument     != null);
        /* DEBUG */ YulupDebug.ASSERT(aDocumentType != null);

        /* DEBUG */ dump("Yulup:validator.js:Validation.validatorFactory() invoked\n");

        switch (aDocumentType) {
            case DOCTYPE_HTML401_STRICT:
                validator = new HTML401StrictValidator(aDocument);
                break;
        }

        return validator;
    }
};


function Validator(aDocument) {
    /* DEBUG */ YulupDebug.ASSERT(aDocument != null);

    /* DEBUG */ dump("Yulup:validator.js:Validator() invoked\n");

    this.__document = aDocument;
}

Validator.prototype = {
    __document: null,

    NodeEditVAL: function (aNode) {
        return null;
    },

    ElementEditVAL: function (aNode) {
        return null;
    },

    CharacterDataEditVAL: function (aNode) {
        return null;
    },

    DocumentEditVAL: function (aNode) {
        return null;
    }
};


function NodeEditVAL(aValidator, aNode) {
    /* DEBUG */ YulupDebug.ASSERT(aValidator != null);
    /* DEBUG */ YulupDebug.ASSERT(aNode      != null);

    /* DEBUG */ dump("Yulup:validator.js:NodeEditVAL() invoked\n");

    this.__validator = aValidator;
    this.__node      = aNode;
}

NodeEditVAL.prototype = {
    __validator: null,
    __node     : null,

    VAL_WF        : 1,
    VAL_NS_WF     : 2,
    VAL_INCOMPLETE: 3,
    VAL_SCHEMA    : 4,

    VAL_TRUE   : 5,
    VAL_FALSE  : 6,
    VAL_UNKNOWN: 7,

    defaultValue    : null,
    enumeratedValues: null,

    canInsertBefore: function (aNewChild, aRefChild) {
        return null;
    },

    canRemoveChild: function (aOldChild) {
        return null;
    },

    canReplaceChild: function (aNewChild, aOldChild) {
        return null;
    },

    canAppendChild: function (aNewChild) {
        return null;
    },

    nodeValidity: function (aValType) {
        return null;
    }
};


function ElementEditVAL(aValidator, aNode) {
    /* DEBUG */ YulupDebug.ASSERT(aValidator != null);
    /* DEBUG */ YulupDebug.ASSERT(aNode      != null);

    /* DEBUG */ dump("Yulup:validator.js:ElementEditVAL() invoked\n");

    NodeEditVal.call(this, aValidator, aNode);
}

ElementEditVAL.prototype = {
    __proto__:  NodeEditVAL.prototype,

    VAL_EMPTY_CONTENTTYPE   : 1,
    VAL_ANY_CONTENTTYPE     : 2,
    VAL_MIXED_CONTENTTYPE   : 3,
    VAL_ELEMENTS_CONTENTTYPE: 4,
    VAL_SIMPLE_CONTENTTYPE  : 5,

    allowedChildren        : null,
    allowedFirstChildren   : null,
    allowedParents         : null,
    allowedNextSiblings    : null,
    allowedPreviousSiblings: null,
    allowedAttributes      : null,
    requiredAttributes     : null,
    contentType            : null,

    canSetTextContent: function (aPossibleTextContent) {
        return null;
    },

    canSetAttribute: function (aAttrname, aAttrval) {
        return null;
    },

    canSetAttributeNode: function (aAttrNode) {
        return null;
    },

    canSetAttributesNS: function (aNamespaceURI, aQualifiedName, aLocalName) {
        return null;
    },

    canRemoveAttribute: function (aAttrname) {
        return null;
    },

    canRemoveAttributeNS: function (aNamespaceURI, aLocalName) {
        return null;
    },

    canRemoveAttributeNode: function (aAttrNode) {
        return null;
    },

    isElementDefined: function (aName) {
        return null;
    },

    isElementDefinedNS: function (aNamespaceURI, aName) {
        return null;
    }
};


function CharacterDataEditVAL(aValidator, aNode) {
    /* DEBUG */ YulupDebug.ASSERT(aValidator != null);
    /* DEBUG */ YulupDebug.ASSERT(aNode      != null);

    /* DEBUG */ dump("Yulup:validator.js:CharacterDataEditVAL() invoked\n");

    NodeEditVal.call(this, aValidator, aNode);
}

CharacterDataEditVAL.prototype = {
    __proto__:  NodeEditVAL.prototype,

    isWhitespaceOnly: function () {
        return null;
    },

    canSetData: function (aArg) {
        return null;
    },

    canAppendData: function (aArg) {
        return null;
    },

    canReplaceData: function (aOffset, aCount, aArg) {
        return null;
    },

    canInsertData: function (aOffset, aArg) {
        return null;
    },

    canDeleteData: function (aOfffset, aCount) {
        return null;
    }
};


function DocumentEditVAL(aValidator, aNode) {
    /* DEBUG */ YulupDebug.ASSERT(aValidator != null);
    /* DEBUG */ YulupDebug.ASSERT(aNode      != null);

    /* DEBUG */ dump("Yulup:validator.js:DocumentEditVAL() invoked\n");

    NodeEditVal.call(this, aValidator, aNode);
}

DocumentEditVAL.prototype = {
    __proto__:  NodeEditVAL.prototype,

    continuousValidityChecking: null,
    domConfig                 : null,

    getDefinedElements: function (namespaceURI) {
        return null;
    },

    validateDocument: function () {
        return null;
    }
};


function ValidatorNameList() {
    /* DEBUG */ dump("Yulup:validator.js:ValidatorNameList() invoked\n");

    this.__nameArray = new Array();
}

ValidatorNameList.prototype = {
    __nameArray: null,

    addNameNS: function (aNamespaceURI, aName) {
        var nameNSPair = {};

        nameNSPair.name         = aName;
        nameNSPair.namespaceURI = aNamespaceURI;

        this.__nameArray.push(nameNSPair);
    },

    // nsIDOMNameList members
    get length() {
        return this.__nameArray.length;
    },

    getName: function (aIndex) {
        return this.__nameArray[aIndex].name;
    },

    getNamespaceURI: function (aIndex) {
        return this.__nameArray[aIndex].namespaceURI;
    },

    contains: function (aStr) {
        // TODO: implement me
    },

    containsNS: function (aNamespaceURI, aName) {
        // TODO: implement me
    }
};


function ExceptionVAL(aCode) {
    /* DEBUG */ YulupDebug.ASSERT(aCode != null);

    /* DEBUG */ dump("Yulup:validator.js:ExceptionVAL() invoked\n");

    this.code = aCode;
}

ExceptionVAL.prototype = {
    __proto__: Error.prototype,

    NO_SCHEMA_AVAILABLE_ERR: 71,

    code: null
};


function ValidatorInvalidNodeTypeException(aMessage) {
    /* DEBUG */ YulupDebug.ASSERT(aMessage != null);

    /* DEBUG */ dump("Yulup:validator.js:ValidatorInvalidNodeTypeException(\"" + aMessage + "\") invoked\n");

    this.message = aMessage;
    this.name    = "ValidatorInvalidNodeTypeException";
}

ValidatorInvalidNodeTypeException.prototype.__proto__ = Error.prototype;
