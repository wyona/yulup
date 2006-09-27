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
 */

/**
 * XPathParser constructor. Instantiates a new object of
 * type XPathParser.
 *
 * @constructor
 * @return {XPathParser}
 */
function XPathParser(aXPath) {
    /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aXPath != null);

    this.__xpathLexer = new XPathLexer(aXPath);

}

XPathParser.prototype = {
    __xpathLexer: null,

    __STATE_LOCATIONPATH      : 0,
    __STATE_STEP              : 1,
    __STATE_EXPRESSION        : 2,
    __STATE_OPAQUEDOUBLESTRING: 3,
    __STATE_OPAQUESINGLESTRING: 4,

    /**
     * Parse the source string as given to the constructor.
     *
     * Note that this parser is not a complete XPath parser, but
     * creates an AST which is less detailed than the XPath itself.
     *
     * This parser creates expressions following this grammar:
     *   LocationPath         ::= RelativeLocationPath | AbsoluteLocationPath
     *   RelativeLocationPath ::= Step | RelativeLocationPath '/' Step
     *   AbsoluteLocationPath ::= '/' RelativeLocationPath?
     *   Step                 ::= STRING | STRING '[' Expression Expression? ']' | null
     *   Expression           ::= STRING | STRING? '"' STRING? '"' STRING? | STRING? ''' STRING? ''' STRING? | null
     *
     * The parser returns an array consisting of slashes and steps.
     *
     * @return {Array} array consisting of slashes and steps, both as strings
     */
    parse: function () {
        return this.__drive(new Array(), this.__STATE_LOCATIONPATH, 0, this.__xpathLexer.getSymbol());
    }
};


function XPathResultNode(aType) {
    /* DEBUG */ YulupDebug.ASSERT(aType != null);

    this.__type = aType;

    this.__value = "";
}

XPathResultNode.TYPE_STEPDELIM = 0;
XPathResultNode.TYPE_STEP      = 1;

XPathResultNode.prototype = {
    __type : null,
    __value: null,

    getType: function () {
        return this.__type;
    },

    getValue: function () {
        return this.__value;
    },

    concatValue: function (aValue) {
        /* DEBUG */ YulupDebug.ASSERT(aValue != null);

        this.__value += aValue;
    }
};


/**
 * XPathLexer constructor. Instantiates a new object of
 * type XPathLexer.
 *
 * @constructor
 * @param  {String}     aXPath the XPath to tokenise
 * @return {XPathLexer}
 */
function XPathLexer(aXPath) {
    /* DEBUG */ YulupDebug.ASSERT(aXPath != null);

    this.__sourceString = aXPath;
    this.__readPos      = 0;

    this.__whitespace = [String.fromCharCode(32), String.fromCharCode(9), String.fromCharCode(13), String.fromCharCode(10)];
    this.__symbols    = ["/", "[", "]", "\"", "'"];
}

XPathLexer.prototype = {
    __whitespace  : null,
    __symbols     : null,
    __sourceString: null,
    __readPos     : null,

    __readChar: function () {
        if (this.__readPos != this.__sourceString.length) {
            return this.__sourceString.charAt(this.__readPos++);
        } else {
            return null;
        }
    },

    __putBack: function (aNoOfChars) {
        /* DEBUG */ YulupDebug.ASSERT(aNoOfChars != null);
        /* DEBUG */ YulupDebug.ASSERT((this.__readPos - aNoOfChars) >= 0);

        this.__readPos -= aNoOfChars;
    },

    __isWhitespace: function (aChar) {
        /* DEBUG */ YulupDebug.ASSERT(aChar != null);

        for (var i = 0; i < this.__whitespace.length; i++) {
            if (aChar == this.__whitespace[i])
                return true;
        }

        return false;
    },

    __isName: function (aChar) {
        /* DEBUG */ YulupDebug.ASSERT(aChar != null);

        for (var i = 0; i < this.__symbols.length; i++) {
            if (aChar == this.__symbols[i])
                return false;
        }

        return true;
    },

    getSymbol: function () {
        var char = null;
        var name = null;

        while ((char = this.__readChar()) != null && this.__isWhitespace(char));

        if (char != null) {
            switch (char) {
                case "/":
                    return new XPathToken(XPathToken.TYPE_SLASH, null);
                case "[":
                    return new XPathToken(XPathToken.TYPE_LSQUAREBRACKET, "[");
                case "]":
                    return new XPathToken(XPathToken.TYPE_RSQUAREBRACKET, "]");
                case "\"":
                    return new XPathToken(XPathToken.TYPE_DOUBLEQUOTE, "\"");
                case "'":
                    return new XPathToken(XPathToken.TYPE_SINGLEQUOTE, "'");
                default:
                    name = "";

                    do {
                        name += char;
                    } while ((char = this.__readChar()) != null && !this.__isWhitespace(char) && this.__isName(char));

                    if (char != null)
                        this.__putBack(1);

                    return new XPathToken(XPathToken.TYPE_NAME, name);
            }
        } else {
            return null;
        }
    }
};


/**
 * LocationPathLexer constructor. Instantiates a new object of
 * type LocationPathLexer.
 *
 * @constructor
 * @param  {String}     aLocationPath the location path to tokenise
 * @return {XPathLexer}
 */
function LocationPathLexer(aLocationPath) {
    /* DEBUG */ YulupDebug.ASSERT(aLocationPath != null);

    XPathLexer.call(this, aLocationPath);
}

LocationPathLexer.prototype = {
    __proto__: XPathLexer
};


/**
 * XPathToken constructor. Instantiates a new object of
 * type XPathToken.
 *
 * @constructor
 * @param  {Number}     aType  the type of the token
 * @param  {String}     aValue the value of the token, or null if of valueless type
 * @return {XPathToken}
 */
function XPathToken(aType, aValue) {
    /* DEBUG */ YulupDebug.ASSERT(aType != null);

    this.type  = aType;
    this.value = aValue;
}

XPathToken.TYPE_SLASH          = 0;
XPathToken.TYPE_LSQUAREBRACKET = 1;
XPathToken.TYPE_RSQUAREBRACKET = 2;
XPathToken.TYPE_DOUBLEQUOTE    = 3;
XPathToken.TYPE_SINGLEQUOTE    = 4;
XPathToken.TYPE_NAME           = 5;

XPathToken.prototype = {
    type : null,
    value: null
};
