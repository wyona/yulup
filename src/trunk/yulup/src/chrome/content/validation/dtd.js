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

function DTD() {
    /* DEBUG */ dump("Yulup:dtd.js:DTD() invoked\n");
}

DTD.prototype = {};


function DTDDeclaration() {
    /* DEBUG */ dump("Yulup:dtd.js:DTDDeclaration() invoked\n");
}

DTDDeclaration.prototype = {

};


function DTDElementTypeDeclaration(aName, aParentList, aContentModel, aAttributeList) {
    /* DEBUG */ YulupDebug.ASSERT(aName          != null);
    /* DEBUG */ YulupDebug.ASSERT(aParentList    != null);
    /* DEBUG */ YulupDebug.ASSERT(aContentModel  != null);
    /* DEBUG */ YulupDebug.ASSERT(aAttributeList != null);

    /* DEBUG */ dump("Yulup:dtd.js:DTDElementTypeDeclaration() invoked\n");

    DTDDeclaration.call(this);

    this.__name         = aName;
    this.__parents      = aParentList;
    this.__contentModel = aContentModel;
    this.__attributes   = aAttributeList;
}

DTDElementTypeDeclaration.prototype = {
    __proto__:  DTDDeclaration.prototype,

    __name        : null,
    __contentModel: null,
    __attributes  : null,
    __parents     : null,

    CONTENT_MODEL_EMPTY          : 1,
    CONTENT_MODEL_ANY            : 2,
    CONTENT_MODEL_MIXED          : 3,
    CONTENT_MODEL_ELEMENT_CONTENT: 4,

    get name() {
        return this.__name;
    },

    get contentModel() {
        return this.__contentModel.contentSpec;
    },

    getAllChildren: function () {
        return null;
    },

    getParents: function () {
        return this.__parents;
    },

    getAttributes: function () {
        return this.__attributes;
    }
};


function DTDAttributeDeclaration(aName, aType, aConstraint, aDefaultValue) {
    /* DEBUG */ YulupDebug.ASSERT(aName != null);
    /* DEBUG */ YulupDebug.ASSERT(aType != null);

    /* DEBUG */ dump("Yulup:dtd.js:DTDAttributeDeclaration() invoked\n");

    DTDDeclaration.call(this);

    this.__name = aName;
    this.__type = aType;

    switch (aConstraint) {
        case "#REQUIRED":
            this.__isRequired     = true;
            break;
        case "#IMPLIED":
            this.__isValueImplied = false;
            break;
        case "#FIXED":
            this.__isValueFixed   = true;
            break;
    }

    this.__defaultValue = aDefaultValue;
}

DTDAttributeDeclaration.prototype = {
    __proto__:  DTDDeclaration.prototype,

    __name          : null,
    __type          : null,
    __isRequired    : false,
    __isValueImplied: false,
    __isValueFixed  : false,
    __defaultValue  : "",

    get name() {
        return this.__name;
    },

    get type() {
        return this.__type;
    },

    get isRequired() {
        return this.__isRequired;
    },

    get isValueImplied() {
        return this.__isValueImplied;
    },

    get isValueFixed() {
        return this.__isValueFixed;
    },

    get defaultValue() {
        return this.__defaultValue;
    }
};


function DTDNotationDeclaration() {
    /* DEBUG */ dump("Yulup:dtd.js:DTDNotationDeclaration() invoked\n");

    DTDDeclaration.call(this);
}

DTDNotationDeclaration.prototype = {
    __proto__:  DTDDeclaration.prototype
};
