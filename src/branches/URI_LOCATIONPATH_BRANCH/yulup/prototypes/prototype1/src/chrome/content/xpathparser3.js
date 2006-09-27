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

    /**
     * Parse the source string as given to the constructor.
     *
     * Note that this parser is not a complete XPath parser, but
     * creates an AST which is less detailed than the XPath itself.
     *
     * The parser returns an array consisting of slashes and steps.
     *
     * @return {Array} array consisting of slashes and steps, both as strings
     */
    parse: function () {
        var symbol      = null;
        var symbolArray = new Array();
        var result      = new XPathParserResult();

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.parse() invoked\n");

        while ((symbol = this.__xpathLexer.getSymbol()) != null) {
            symbolArray.push(symbol);
        }

        for (var i = 0; i < symbolArray.length; i++) {
            if (symbolArray[i].type == XPathToken.TYPE_IDENT &&
                i + 1 < symbolArray.length                   &&
                symbolArray[i + 1].type == XPathToken.TYPE_COLON) {
                result.push(new XPathParserResultNode(XPathParserResultNode.TYPE_PREFIX, symbolArray[i].value));
            } else {
                result.push(new XPathParserResultNode(XPathParserResultNode.TYPE_NORMAL, symbolArray[i].value));
            }
        }

        return result;
    }
};


function XPathParserResult() {
    this.__resultNodes = new Array();
}

XPathParserResult.prototype = {
    __resultNodes: null,

    push: function (aXPathResultNode) {
        /* DEBUG */ YulupDebug.ASSERT(aXPathResultNode != null);
        /* DEBUG */ YulupDebug.ASSERT(aXPathResultNode ? aXPathResultNode instanceof XPathParserResultNode : true);

        this.__resultNodes.push(aXPathResultNode);
    },

    toObjectString: function () {
        var resultString = "";

        for (var i = 0; i < this.__resultNodes.length; i++) {
            resultString += this.__resultNodes[i].toString();
        }

        return resultString;
    },

    toString: function () {
        var resultString = "";

        for (var i = 0; i < this.__resultNodes.length; i++) {
            resultString += this.__resultNodes[i].getValue();
        }

        return resultString;
    }
};

function XPathParserResultNode(aType, aValue) {
    /* DEBUG */ YulupDebug.ASSERT(aType  != null);
    /* DEBUG */ YulupDebug.ASSERT(aValue != null);

    this.__type  = aType;
    this.__value = aValue;
}

XPathParserResultNode.TYPE_NORMAL = 0;
XPathParserResultNode.TYPE_PREFIX = 1;

XPathParserResultNode.prototype = {
    __type : null,
    __value: null,

    getType: function () {
        return this.__type;
    },

    getValue: function () {
        return this.__value;
    },

    toString: function () {
        var typeString   = null;

        switch (this.getType()) {
        case XPathParserResultNode.TYPE_NORMAL:
            typeString = "TYPE_NORMAL";
            break;
        case XPathParserResultNode.TYPE_PREFIX:
            typeString = "TYPE_PREFIX";
            break;
        default:
            typeString = "UNKNOWN";
        }

        return "{" + typeString + ", \"" + this.getValue() + "\"}";
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
    /* DEBUG */ dump("Yulup:xpathparser.js:XPathLexer(\"" + aXPath + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aXPath != null);

    this.__sourceString = aXPath;
    this.__readPos      = 0;

    this.__whitespace = [String.fromCharCode(32), String.fromCharCode(9), String.fromCharCode(13), String.fromCharCode(10)];
    this.__symbols    = ["/", "[", "]", "(", ")", ".", "@", "$", ":", "*", "|", "<", ">", "=", "!", "\"", "'"];
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

    __isWhitespaceChar: function (aChar) {
        /* DEBUG */ YulupDebug.ASSERT(aChar != null);

        for (var i = 0; i < this.__whitespace.length; i++) {
            if (aChar == this.__whitespace[i])
                return true;
        }

        return false;
    },

    __isNameChar: function (aChar) {
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

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathLexer.getSymbol() invoked\n");

        while ((char = this.__readChar()) != null && this.__isWhitespaceChar(char));

        if (char != null) {
            switch (char) {
                case "/":
                    return new XPathToken(XPathToken.TYPE_SLASH, "/");
                case "[":
                    return new XPathToken(XPathToken.TYPE_LBRACKET, "[");
                case "]":
                    return new XPathToken(XPathToken.TYPE_RBRACKET, "]");
                case "(":
                    return new XPathToken(XPathToken.TYPE_LPAREN, "(");
                case ")":
                    return new XPathToken(XPathToken.TYPE_RPAREN, ")");
                case ".":
                    return new XPathToken(XPathToken.TYPE_PERIOD, ".");
                case ",":
                    return new XPathToken(XPathToken.TYPE_COMMA, ",");
                case "@":
                    return new XPathToken(XPathToken.TYPE_AT, "@");
                case "$":
                    return new XPathToken(XPathToken.TYPE_DOLLAR, "$");
                case ":":
                    if (this.__readChar() == ":") {
                        return new XPathToken(XPathToken.TYPE_DOUBLECOLON, "::");
                    } else {
                        this.__putBack(1);
                        return new XPathToken(XPathToken.TYPE_COLON, ":");
                    }
                case "*":
                    return new XPathToken(XPathToken.TYPE_STAR, "*");
                case "|":
                    return new XPathToken(XPathToken.TYPE_BAR, "|");
                case "<":
                    return new XPathToken(XPathToken.TYPE_LESSTHAN, "<");
                case ">":
                    return new XPathToken(XPathToken.TYPE_GREATERTHAN, ">");
                case "=":
                    return new XPathToken(XPathToken.TYPE_EQUAL, "=");
                case "!":
                    return new XPathToken(XPathToken.TYPE_NOT, "!");
                case "\"":
                    name = "";

                    do {
                        name += char;
                    } while ((char = this.__readChar()) != null && char != "\"");

                    if (char == null) {
                        throw new YulupXPathLexerMalformedException();
                    } else {
                        name += char;
                    }

                    return new XPathToken(XPathToken.TYPE_DOUBLEQUOTELITERAL, name);
                case "'":
                    name = "";

                    do {
                        name += char;
                    } while ((char = this.__readChar()) != null && char != "'");

                    if (char == null) {
                        throw new YulupXPathLexerMalformedException();
                    } else {
                        name += char;
                    }

                    return new XPathToken(XPathToken.TYPE_SINGLEQUOTELITERAL, name);
                default:
                    name = "";

                    do {
                        name += char;
                    } while ((char = this.__readChar()) != null && !this.__isWhitespaceChar(char) && this.__isNameChar(char));

                    if (char != null)
                        this.__putBack(1);

                    return new XPathToken(XPathToken.TYPE_IDENT, name);
            }
        } else {
            return null;
        }
    }
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
    /* DEBUG */ dump("Yulup:xpathparser.js:XPathToken(\"" + aType + "\", \"" + aValue + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aType  != null);
    /* DEBUG */ YulupDebug.ASSERT(aValue != null);

    this.type  = aType;
    this.value = aValue;
}

XPathToken.TYPE_SLASH              = 0;
XPathToken.TYPE_LBRACKET           = 1;
XPathToken.TYPE_RBRACKET           = 2;
XPathToken.TYPE_LPAREN             = 3;
XPathToken.TYPE_RPAREN             = 4;
XPathToken.TYPE_PERIOD             = 5;
XPathToken.TYPE_COMMA              = 6;
XPathToken.TYPE_AT                 = 7;
XPathToken.TYPE_DOLLAR             = 8;
XPathToken.TYPE_DOUBLECOLON        = 9;
XPathToken.TYPE_COLON              = 10;
XPathToken.TYPE_STAR               = 11;
XPathToken.TYPE_BAR                = 12;
XPathToken.TYPE_LESSTHAN           = 13;
XPathToken.TYPE_GREATERTHAN        = 14;
XPathToken.TYPE_EQUAL              = 15;
XPathToken.TYPE_NOT                = 16;
XPathToken.TYPE_DOUBLEQUOTELITERAL = 17;
XPathToken.TYPE_SINGLEQUOTELITERAL = 18;
XPathToken.TYPE_IDENT              = 19;

XPathToken.prototype = {
    type : null,
    value: null
};
