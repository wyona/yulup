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

    this.__attrMap = new Object();
    this.__elemMap = new Object();
}

DTD.prototype = {
    __elemMap: null,
    __attrMap: null,

    __attrGenerators: null,
    __elemGenerators: null,

    __lookupCache: function (aEntryName, aCache, aGeneratorTable) {
        var generator = null;
        var entry     = null;

        /* DEBUG */ YulupDebug.ASSERT(aEntryName      != null);
        /* DEBUG */ YulupDebug.ASSERT(aCache          != null);
        /* DEBUG */ YulupDebug.ASSERT(aGeneratorTable != null);

        /* DEBUG */ dump("Yulup:dtd.js:DTD.__lookupCache() invoked\n");

        if (aCache[aEntryName]) {
            // entry is already in the cache
            return aCache[aEntryName];
        } else {
            // generate a new entry
            generator = aGeneratorTable[aEntryName];

            if (generator) {
                entry = generator.call(this);
                aCache[aEntryName] = entry;

                return entry;
            } else {
                // no generator found for this entry
                return null;
            }
        }
    },

    getElement: function (aElemName) {
        /* DEBUG */ YulupDebug.ASSERT(aElemName != null);

        /* DEBUG */ dump("Yulup:dtd.js:DTD.getElement() invoked\n");

        return this.__lookupCache(aElemName, this.__elemMap, this.__elemGenerators);
    },

    getAttributes: function (aElemName) {
        var generators = null;
        var attributes = null;

        /* DEBUG */ YulupDebug.ASSERT(aElemName != null);

        /* DEBUG */ dump("Yulup:dtd.js:DTD.getAttributes() invoked\n");

        generators = this.__attrGenerators[aElemName];

        if (generators) {
            attributes = new Array();

            for (var attr in generators) {
                attributes.push(generators[attr].call(this));
            }
        }

        return attributes;
    }
};


function DTDDeclaration() {
    /* DEBUG */ dump("Yulup:dtd.js:DTDDeclaration() invoked\n");
}

DTDDeclaration.prototype = {};


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

    get namespaceURI() {
        return null;
    },

    get contentModel() {
        return this.__contentModel.contentSpec;
    },

    getAllChildren: function () {
        /* DEBUG */ dump("Yulup:dtd.js:DTDElementTypeDeclaration.getAllChildren() invoked\n");

        return null;
    },

    getParents: function () {
        /* DEBUG */ dump("Yulup:dtd.js:DTDElementTypeDeclaration.getParents() invoked\n");

        return (this.__parents ? this.__parents : new Array());
    },

    getAttributes: function () {
        /* DEBUG */ dump("Yulup:dtd.js:DTDElementTypeDeclaration.getAttributes() invoked\n");

        return (this.__attributes ? this.__attributes.getAttributes() : new Array());
    }
};


function DTDAttributeDeclaration(aName, aType, aConstraint, aDefaultValue, aInformalType) {
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
    this.__informalType = aInformalType;
}

DTDAttributeDeclaration.prototype = {
    __proto__:  DTDDeclaration.prototype,

    __informalType: null,
    __currentValue: null,

    __name          : null,
    __isRequired    : false,
    __isValueImplied: false,
    __isValueFixed  : false,
    __defaultValue  : "",

    get informalType() {
        return this.__informalType;
    },

    get currentValue() {
        return this.__currentValue;
    },

    set currentValue(aValue) {
        this.__currentValue = aValue;
    },

    get name() {
        return this.__name;
    },

    get namespaceURI() {
        return null;
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
    },

    get allowedValues() {
        if (this.__contentModel instanceof DTDContentSet) {
            return this.__contentModel.toArray();
        } else {
            return null;
        }
    }
};


function DTDNotationDeclaration() {
    /* DEBUG */ dump("Yulup:dtd.js:DTDNotationDeclaration() invoked\n");

    DTDDeclaration.call(this);
}

DTDNotationDeclaration.prototype = {
    __proto__:  DTDDeclaration.prototype
};


function DTDAttrList() {
    /* DEBUG */ dump("Yulup:dtd.js:DTDAttrList() invoked\n");

    this.__attrList = new Array();

    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] instanceof Array) {
            this.__unrollArray(this.__attrList, arguments[i]);
        } else {
            this.__attrList.push(arguments[i]);
        }
    }
}

DTDAttrList.prototype = {
    __attrList: null,

    __unrollArray: function (aTarget, aArray) {
        /* DEBUG */ YulupDebug.ASSERT(aTarget != null);
        /* DEBUG */ YulupDebug.ASSERT(aArray  != null);

        /* DEBUG */ dump("Yulup:dtd.js:DTDAttrList.__unrollArray() invoked\n");

        for (var i = 0; i < aArray.length; i++) {
            aTarget.push(aArray[i]);
        }
    },

    getAttributes: function () {
        /* DEBUG */ dump("Yulup:dtd.js:DTDAttrList.getAttributes() invoked\n");

        return this.__attrList;
    }
};


function DTDContentSet() {
    this.__set = new Array();

    /* DEBUG */ dump("Yulup:dtd.js:DTDContentSet() invoked\n");

    for (var i = 0; i < arguments.length; i++) {
        this.__set.push(arguments[i]);
    }
}

DTDContentSet.prototype = {
    toArray: function () {
        /* DEBUG */ dump("Yulup:dtd.js:DTDContentSet.toArray() invoked\n");

        return this.__set;
    }
};
