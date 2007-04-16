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

/**
 * SchemaComponent constructor. Instantiates a new object of
 * type SchemaComponent.
 *
 * Implements nsISchemaComponent.
 *
 * @constructor
 */
function SchemaComponent() {
    /* DEBUG */ dump("Yulup:schema.js:SchemaComponent() invoked\n");
}

SchemaComponent.prototype = {
    __targetNamespace: null,

    /**
     * Returns the target namespace.
     *
     * @return {String}
     */
    get targetNamespace() {
        return this.__targetNamespace;
    },

    /**
     * Clear.
     *
     * @return {Undefined}  does not have a return value
     */
    clear: function () {

    },

    /**
     * Resolve.
     *
     * @return {Undefined}  does not have a return value
     */
    resolve: function (aErrorHandler) {

    }
};


/**
 * Schema constructor. Instantiates a new object of
 * type Schema.
 *
 * Implements nsISchema.
 *
 * @constructor
 * @param {nsIURI} aURI  the schema URI
 */
function Schema(aURI) {
    /* DEBUG */ dump("Yulup:schema.js:Schema() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aURI != null);

    NetworkService.httpRequestGET(this.loadURI.spec, null, this.__loadFinishedHandler, null, false, true, null);
}

Schema.prototype = {
    __proto__: SchemaComponent.prototype,

    __attributeCount     : null,
    __attributeGroupCount: null,
    __collection         : null,
    __elementCount       : null,
    __modelGroupCount    : null,
    __schemaNamespace    : null,
    __typeCount          : null,

    /**
     * Returns the attribute count.
     *
     * @return {Number}
     */
    get attributeCount() {
        return this.__attributeCount;
    },

    /**
     * Returns the attribute group count.
     *
     * @return {Number}
     */
    get attributeGroupCount() {
        return this.__attributeGroupCount;
    },

    /**
     * Returns a schema collection.
     *
     * @return {nsISchemaCollection}
     */
    get collection() {
        return this.__collection;
    },

    /**
     * Returns the element count.
     *
     * @return {Number}
     */
    get elementCount() {
        return this.__elementCount;
    },

    /**
     * Returns the model group count.
     *
     * @return {Number}
     */
    get modelGroupCount() {
        return this.__modelGroupCount;
    },

    /**
     * Returns the namespace of the schema.
     *
     * @return {String}
     */
    get schemaNamespace() {
        return this.__schemaNamespace;
    },

    /**
     * Returns the type count.
     *
     * @return {Number}
     */
    get typeCount() {
        return this.__typeCount;
    },

    /**
     * Returns an attribute by index.
     *
     * @param  {Number} aIndex  the index of the attribute
     * @return {nsISchemaAttribute}
     */
    getAttributeByIndex: function (aIndex) {

    },

    /**
     * Returns an attribute by name.
     *
     * @param  {String} aName  the name of the attribute
     * @return {nsISchemaAttribute}
     */
    getAttributeByName: function (aName) {

    },

    /**
     * Returns an attribute group by index.
     *
     * @param  {Number} aIndex  the index of the attribute group
     * @return {nsISchemaAttributeGroup}
     */
    getAttributeGroupByIndex: function (aIndex) {

    },

    /**
     * Returns an attribute group by name.
     *
     * @param  {String} aName  the name of the attribute group
     * @return {nsISchemaAttributeGroup}
     */
    getAttributeGroupByName: function (aName) {

    },

    /**
     * Returns an element by index.
     *
     * @param  {Number} aIndex  the index of the element
     * @return {nsISchemaElement}
     */
    getElementByIndex: function (aIndex) {

    },

    /**
     * Returns an element by name.
     *
     * @param  {String} aName  the name of the element
     * @return {nsISchemaElement}
     */
    getElementByName: function (aName) {

    },

    /**
     * Returns a model group by index.
     *
     * @param  {Number} aIndex  the index of the model group
     * @return {nsISchemaModelGroup}
     */
    getModelGroupByIndex: function (aIndex) {

    },

    /**
     * Returns a model group by name.
     *
     * @param  {String} aName  the name of the model group
     * @return {nsISchemaModelGroup}
     */
    getModelGroupByName: function (aName) {

    },

    /**
     * Returns a type by index.
     *
     * @param  {Number} aIndex  the index of the type
     * @return {nsISchemaType}
     */
    getTypeByIndex: function (aIndex) {

    },

    /**
     * Returns a type by name.
     *
     * @param  {String} aName  the name of the type
     * @return {nsISchemaType}
     */
    getTypeByName: function (aName) {

    }
};


/**
 * SchemaAttributeComponent constructor. Instantiates a new object of
 * type SchemaAttributeComponent.
 *
 * Implements nsISchemaAttributeComponent.
 *
 * @constructor
 */
function SchemaAttributeComponent() {
    /* DEBUG */ dump("Yulup:schema.js:SchemaAttributeComponent() invoked\n");
}

SchemaAttributeComponent.COMPONENT_TYPE_ATTRIBUTE = 1;
SchemaAttributeComponent.COMPONENT_TYPE_GROUP     = 2;
SchemaAttributeComponent.COMPONENT_TYPE_ANY       = 3;

SchemaAttributeComponent.prototype = {
    __proto__: SchemaComponent.prototype,

    __componentType: null,
    __name         : null,

    /**
     * Returns the component type.
     *
     * @return {Number}
     */
    get componentType() {
        return this.__componentType;
    },

    /**
     * Returns the name.
     *
     * @return {String}
     */
    get name() {
        return this.__name;
    }
};


/**
 * SchemaAttribute constructor. Instantiates a new object of
 * type SchemaAttribute.
 *
 * Implements nsISchemaAttribute.
 *
 * @constructor
 */
function SchemaAttribute() {
    /* DEBUG */ dump("Yulup:schema.js:SchemaAttribute() invoked\n");
}

SchemaAttribute.USE_OPTIONAL   = 1;
SchemaAttribute.USE_PROHIBITED = 2;
SchemaAttribute.USE_REQUIRED   = 3;

SchemaAttribute.prototype = {
    __proto__: SchemaAttributeComponent.prototype,

    __defaultValue: null,
    __fixedValue  : null,
    __type        : null,
    __use         : null,

    /**
     * Returns the default value.
     *
     * @return {String}
     */
    get defaultValue() {
        return this.__defaultValue;
    },

    /**
     * Returns the fixed value.
     *
     * @return {String}
     */
    get fixedValue() {
        return this.__fixedValue;
    },

    /**
     * Returns the type.
     *
     * @return {nsISchemaSimpleType}
     */
    get type() {
        return this.__type;
    },

    /**
     * Returns the use.
     *
     * @return {Number}
     */
    get use() {
        return this.__use;
    }
};


/**
 * SchemaType constructor. Instantiates a new object of
 * type SchemaType.
 *
 * Implements nsISchemaType.
 *
 * @constructor
 */
function SchemaType() {
    /* DEBUG */ dump("Yulup:schema.js:SchemaType() invoked\n");
}

SchemaType.SCHEMA_TYPE_SIMPLE      = 1;
SchemaType.SCHEMA_TYPE_COMPLEX     = 2;
SchemaType.SCHEMA_TYPE_PLACEHOLDER = 3;

SchemaType.prototype = {
    __proto__: SchemaComponent.prototype,

    __name      : null,
    __schemaType: null,

    /**
     * Returns the name.
     *
     * @return {String}
     */
    get name() {
        return this.__name;
    },

    /**
     * Returns the schema type.
     *
     * @return {Number}
     */
    get schemaType() {
        return this.__schemaType;
    }
};


/**
 * SchemaSimpleType constructor. Instantiates a new object of
 * type SchemaSimpleType.
 *
 * Implements nsISchemaSimpleType.
 *
 * @constructor
 */
function SchemaSimpleType() {
    /* DEBUG */ dump("Yulup:schema.js:SchemaSimpleType() invoked\n");
}

SchemaSimpleType.SIMPLE_TYPE_BUILTIN     = 1;
SchemaSimpleType.SIMPLE_TYPE_LIST        = 2;
SchemaSimpleType.SIMPLE_TYPE_UNION       = 3;
SchemaSimpleType.SIMPLE_TYPE_RESTRICTION = 4;

SchemaSimpleType.prototype = {
    __proto__: SchemaType.prototype,

    __simpleType: null,

    /**
     * Returns the type.
     *
     * @return {Number}
     */
    get simpleType() {
        return this.__simpleType;
    }
};
