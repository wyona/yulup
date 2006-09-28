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

    this.__xpathLexer  = new XPathLexer(aXPath);
    this.__symbolArray = new Array();

}

XPathParser.prototype = {
    __xpathLexer : null,
    __symbolArray: null,

    /**
     * Parse the source string as given to the constructor.
     *
     * @return {Array} array consisting of slashes and steps, both as strings
     */
    parse: function () {
        var symbol = null;
        var result = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.parse() invoked\n");

        // get all symbols (could be optimised to do this on-line with one symbol look-ahead)
        while ((symbol = this.__xpathLexer.getSymbol()) != null) {
            this.__symbolArray.push(symbol);
        }

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.parse: number of scanned tokens = " + this.__symbolArray.length + ", token stream =\n");
        for (var i = 0; i < this.__symbolArray.length; i++) {
            dump(this.__symbolArray[i]);
        }
        dump("\n");

        result = this.__ruleLocationPath(0);

        if (!result.astNode) {
            /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.parse: no matching rule\n");
            return null;
        } else {
            return result.astNode;
        }
    },

    __getSymbolValue: function (aPos) {
        /* DEBUG */ YulupDebug.ASSERT(aPos        != null);
        /* DEBUG */ YulupDebug.ASSERT(aPos ? aPos >= 0 : true);
        /* DEBUG */ YulupDebug.ASSERT(aPos ? aPos < this.__symbolArray.length : true);

        return this.__symbolArray[aPos].value;
    },

    __matchSymbol: function (aPos, aSymbolType) {
        /* DEBUG */ YulupDebug.ASSERT(aPos        != null);
        /* DEBUG */ YulupDebug.ASSERT(aPos ? aPos >= 0 : true);
        /* DEBUG */ YulupDebug.ASSERT(aSymbolType != null);

        if (aPos < this.__symbolArray.length) {
            return (this.__symbolArray[aPos].type == aSymbolType);
        } else {
            return false;
        }
    },

    __matchAxisName: function (aPos) {
        /* DEBUG */ YulupDebug.ASSERT(aPos        != null);
        /* DEBUG */ YulupDebug.ASSERT(aPos ? aPos >= 0 : true);

        if (aPos < this.__symbolArray.length) {
            if (this.__symbolArray[aPos].type == XPathToken.TYPE_IDENT) {
                switch (this.__symbolArray[aPos].value) {
                    case "ancestor":
                    case "ancestor-or-self":
                    case "attribute":
                    case "child":
                    case "descendant":
                    case "descendant-or-self":
                    case "following":
                    case "following-sibling":
                    case "namespace":
                    case "parent":
                    case "preceding":
                    case "preceding-sibling":
                    case "self":
                        return true;
                    default:
                        return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    __matchProcessingInstruction: function (aPos) {
        /* DEBUG */ YulupDebug.ASSERT(aPos        != null);
        /* DEBUG */ YulupDebug.ASSERT(aPos ? aPos >= 0 : true);

        if (aPos < this.__symbolArray.length) {
            if (this.__symbolArray[aPos].type == XPathToken.TYPE_IDENT && this.__symbolArray[aPos].value == "processing-instruction") {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    __matchNodeType: function (aPos) {
        /* DEBUG */ YulupDebug.ASSERT(aPos        != null);
        /* DEBUG */ YulupDebug.ASSERT(aPos ? aPos >= 0 : true);

        if (aPos < this.__symbolArray.length) {
            if (this.__symbolArray[aPos].type == XPathToken.TYPE_IDENT) {
                switch (this.__symbolArray[aPos].value) {
                    case "comment":
                    case "text":
                    case "processing-instruction":
                    case "node":
                        return true;
                    default:
                        return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    __matchAnd: function (aPos) {
        /* DEBUG */ YulupDebug.ASSERT(aPos        != null);
        /* DEBUG */ YulupDebug.ASSERT(aPos ? aPos >= 0 : true);

        if (aPos < this.__symbolArray.length) {
            if (this.__symbolArray[aPos].type == XPathToken.TYPE_IDENT && this.__symbolArray[aPos].value == "and") {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    __matchOr: function (aPos) {
        /* DEBUG */ YulupDebug.ASSERT(aPos        != null);
        /* DEBUG */ YulupDebug.ASSERT(aPos ? aPos >= 0 : true);

        if (aPos < this.__symbolArray.length) {
            if (this.__symbolArray[aPos].type == XPathToken.TYPE_IDENT && this.__symbolArray[aPos].value == "or") {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    __matchMultiplicativeOperator: function (aPos) {
        /* DEBUG */ YulupDebug.ASSERT(aPos        != null);
        /* DEBUG */ YulupDebug.ASSERT(aPos ? aPos >= 0 : true);

        if (aPos < this.__symbolArray.length) {
            if (this.__symbolArray[aPos].type == XPathToken.TYPE_STAR) {
                return true;
            } else if (this.__symbolArray[aPos].type == XPathToken.TYPE_IDENT) {
                switch (this.__symbolArray[aPos].value) {
                case "div":
                case "mod":
                    return true;
                default:
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    },

    /**
     * Applies the locationPath production.
     *
     * locationPath ::= absoluteLocationPath
     *                | relativeLocationPath
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleLocationPath: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleLocationPath(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: absoluteLocationPath
        if ((evalResult = this.__ruleAbsoluteLocationPath(aPos)) != null) {
            return evalResult;
        }

        // alt2: relativeLocationPath
        if ((evalResult = this.__ruleRelativeLocationPath(aPos)) != null) {
            return evalResult;
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the absoluteLocationPath production.
     *
     * absoluteLocationPath ::= SLASH (relativeLocationPath)?
     *                        | DOUBLESLASH relativeLocationPath
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleAbsoluteLocationPath: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleAbsoluteLocationPath(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: SLASH (relativeLocationPath)?
        if (this.__matchSymbol(aPos, XPathToken.TYPE_SLASH)) {
            astNode = new ASTNode(ASTNode.TYPE_ABSOLUTELOCATIONPATH, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleRelativeLocationPath(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);
            }

            return new RuleEvalResult(evalResult.pos, astNode);
        }

        // alt2: DOUBLESLASH relativeLocationPath
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DOUBLESLASH)) {
            astNode = new ASTNode(ASTNode.TYPE_ABSOLUTELOCATIONPATH, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleRelativeLocationPath(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                return new RuleEvalResult(evalResult.pos, astNode);
            }
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the relativeLocationPath production.
     *
     * relativeLocationPath ::= step (relativeLocationPath2)?
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleRelativeLocationPath: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleRelativeLocationPath(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: step (relativeLocationPath2)?
        if ((evalResult = this.__ruleStep(aPos)) != null) {
            astNode = evalResult.astNode;
            currPos = evalResult.pos;

            if ((evalResult = this.__ruleRelativeLocationPath2(currPos)) != null) {
                astNode.concatenate(evalResult.astNode);

                currPos = evalResult.pos;
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the relativeLocationPath2 production.
     *
     * relativeLocationPath2 ::= SLASH step relativeLocationPath2
     *                         | DOUBLECOLON step relativeLocationPath2
     *                         | ()
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleRelativeLocationPath2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleRelativeLocationPath2(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: SLASH step relativeLocationPath2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_SLASH)) {
            astNode = new ASTNode(ASTNode.TYPE_RELATIVELOCATIONPATH2, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleStep(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if ((evalResult = this.__ruleRelativeLocationPath2(evalResult.pos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt2: DOUBLECOLON step relativeLocationPath2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DOUBLECOLON)) {
            astNode = new ASTNode(ASTNode.TYPE_RELATIVELOCATIONPATH2, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleStep(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if ((evalResult = this.__ruleRelativeLocationPath2(evalResult.pos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt3: ()
        return new RuleEvalResult(aPos, new ASTNode(ASTNode.TYPE_EPSILON, null));

        // no applicable rule
        return null;
    },

    /**
     * Applies the step production.
     *
     * step ::= axisSpecifier nodeTest (predicate)*
     *        | PERIOD
     *        | DOUBLEPERIOD
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleStep: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleStep(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: axisSpecifier nodeTest (predicate)*
        if ((evalResult = this.__ruleAxisSpecifier(aPos)) != null) {
            astNode = evalResult.astNode;

            if ((evalResult = this.__ruleNodeTest(evalResult.pos)) != null) {
                astNode.concatenate(evalResult.astNode);

                currPos = evalResult.pos;

                while ((evalResult = this.__rulePredicate(currPos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    currPos = evalResult.pos;
                }

                return new RuleEvalResult(currPos, astNode);
            }
        }

        // alt2: PERIOD
        if (this.__matchSymbol(aPos, XPathToken.TYPE_PERIOD)) {
            astNode = new ASTNode(ASTNode.TYPE_CURRENTNODE, this.__getSymbolValue(aPos));

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // alt3: DOUBLEPERIOD
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DOUBLEPERIOD)) {
            astNode = new ASTNode(ASTNode.TYPE_PARENTNODE, this.__getSymbolValue(aPos));

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the axisSpecifier production.
     *
     * axisSpecifier ::= AXISNAME DOUBLECOLON
     *                 | (AT)?
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleAxisSpecifier: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleAxisSpecifier(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: AXISNAME DOUBLECOLON
        if (this.__matchAxisName(aPos)) {
            /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleAxisSpecifier: alt1 AXISNAME matched\n");

            astNode = new ASTNode(ASTNode.TYPE_AXISNAME, this.__getSymbolValue(aPos));

            if (this.__matchSymbol(aPos + 1, XPathToken.TYPE_DOUBLECOLON)) {
                /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleAxisSpecifier: alt1 AXISNAME DOUBLECOLON matched\n");

                astNode.concatenate(new ASTNode(ASTNode.TYPE_AXISDELIMITER, this.__getSymbolValue(aPos + 1)));

                return new RuleEvalResult(aPos + 2, astNode);
            }
        }

        // alt2: (AT)?
        if (this.__matchSymbol(aPos, XPathToken.TYPE_AT)) {
            /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleAxisSpecifier: alt2 AT matched\n");

            astNode = new ASTNode(ASTNode.TYPE_AT, this.__getSymbolValue(aPos));

            return new RuleEvalResult(aPos + 1, astNode);
        } else {
            /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleAxisSpecifier: alt2 () matched\n");

            astNode = new ASTNode(ASTNode.TYPE_EPSILON, null);

            return new RuleEvalResult(aPos, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the nodeTest production.
     *
     * nodeTest ::= nameTest
     *            | "processing-instruction" LPAREN literal RPAREN
     *            | nodeType LPAREN RPAREN
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleNodeTest: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleNodeTest(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: nameTest
        if ((evalResult = this.__ruleNameTest(aPos)) != null) {
            return evalResult;
        }

        // alt2: "processing-instruction" LPAREN literal RPAREN
        if (this.__matchProcessingInstruction(aPos)) {
            astNode = new ASTNode(ASTNode.TYPE_NODETEST, this.__getSymbolValue(aPos));

            if (this.__matchSymbol(aPos + 1, XPathToken.TYPE_LPAREN)) {
                astNode.concatenate(new ASTNode(ASTNode.TYPE_NODETEST, this.__getSymbolValue(aPos + 1)));

                if ((evalResult = this.__ruleLiteral(aPos + 2)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_RPAREN)) {
                        astNode.concatenate(new ASTNode(ASTNode.TYPE_NODETEST, this.__getSymbolValue(evalResult.pos)));

                        return new RuleEvalResult(evalResult.pos, astNode);
                    }
                }
            }
        }

        // alt3: nodeType LPAREN RPAREN
        if ((evalResult = this.__ruleNodeType(aPos)) != null) {
            astNode = evalResult.astNode;

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_LPAREN)) {
                astNode.concatenate(new ASTNode(ASTNode.TYPE_NODETEST, this.__getSymbolValue(evalResult.pos)));

                if (this.__matchSymbol(evalResult.pos + 1, XPathToken.TYPE_RPAREN)) {
                    astNode.concatenate(new ASTNode(ASTNode.TYPE_NODETEST, this.__getSymbolValue(evalResult.pos + 1)));

                    return new RuleEvalResult(evalResult.pos + 2, astNode);
                }
            }
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the predicate production.
     *
     * predicate ::= LBRACKET orExpr RBRACKET
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __rulePredicate: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__rulePredicate(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: LBRACKET orExpr RBRACKET
        if (this.__matchSymbol(aPos, XPathToken.TYPE_LBRACKET)) {
            astNode = new ASTNode(ASTNode.TYPE_PREDICATE, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleOrExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_RBRACKET)) {
                    astNode.concatenate(new ASTNode(ASTNode.TYPE_PREDICATE, this.__getSymbolValue(evalResult.pos)));

                    return new RuleEvalResult(evalResult.pos + 1, astNode);
                }
            }
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the primaryExpr production.
     *
     * primaryExpr ::= DOLLAR qName
     *               | LPAREN orExpr RPAREN
     *               | literal
     *               | number
     *               | functionCall
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __rulePrimaryExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__rulePrimaryExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: DOLLAR qName
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DOLLAR)) {
            astNode = new ASTNode(ASTNode.TYPE_PRIMARYEXPR, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleQName(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                return new RuleEvalResult(evalResult.pos, astNode);
            }
        }

        // alt2: LPAREN orExpr RPAREN
        if (this.__matchSymbol(aPos, XPathToken.TYPE_LPAREN)) {
            astNode = new ASTNode(ASTNode.TYPE_PRIMARYEXPR, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleOrExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_RPAREN)) {
                    astNode.concatenate(new ASTNode(ASTNode.TYPE_PRIMARYEXPR, this.__getSymbolValue(evalResult.pos)));

                    return new RuleEvalResult(evalResult.pos + 1, astNode);
                }
            }
        }

        // alt3: literal
        if ((evalResult = this.__ruleLiteral(aPos)) != null) {
            return evalResult;
        }

        // alt4: number
        if ((evalResult = this.__ruleNumber(aPos)) != null) {
            return evalResult;
        }

        // alt5: functionCall
        if ((evalResult = this.__ruleFunctionCall(aPos)) != null) {
            return evalResult;
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the functionCall production.
     *
     * functionCall ::= qName LPAREN (orExpr (arg)*)? RPAREN
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleFunctionCall: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleFunctionCall(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: qName LPAREN (orExpr (arg)*)? RPAREN
        if ((evalResult = this.__ruleQName(aPos)) != null) {
            astNode = evalResult.astNode;

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_LPAREN)) {
                astNode.concatenate(new ASTNode(ASTNode.TYPE_FUNCTIONCALL, this.__getSymbolValue(evalResult.pos)));

                currPos = evalResult.pos + 1;

                if ((evalResult = this.__ruleOrExpr(currPos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    currPos = evalResult.pos;

                    while ((evalResult = this.__ruleArg(currPos)) != null) {
                        astNode.concatenate(evalResult.astNode);

                        currPos = evalResult.pos;
                    }
                }

                if (this.__matchSymbol(currPos + 1, XPathToken.TYPE_RPAREN)) {
                    astNode.concatenate(new ASTNode(ASTNode.TYPE_FUNCTIONCALL, this.__getSymbolValue(currPos + 1)));

                    return new RuleEvalResult(currPos + 2, astNode);
                }
            }
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the arg production.
     *
     * arg ::= COMMA orExpr
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleArg: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleArg(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: COMMA orExpr
        if (this.__matchSymbol(aPos, XPathToken.TYPE_COMMA)) {
            astNode = new ASTNode(ASTNode.TYPE_ARG, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleOrExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                return new RuleEvalResult(evalResult.pos, astNode);
            }
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the unionExpr production.
     *
     * unionExpr ::= pathExpr (unionExpr2)?
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleUnionExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleUnionExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: pathExpr (unionExpr2)?
        if ((evalResult = this.__rulePathExpr(aPos)) != null) {
            astNode = evalResult.astNode;
            currPos = evalResult.pos;

            if ((evalResult = this.__ruleUnionExpr2(currPos)) != null) {
                astNode.concatenate(evalResult.astNode);

                currPos = evalResult.pos;
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the unionExpr2 production.
     *
     * unionExpr2 ::= BAR pathExpr unionExpr2
     *              | ()
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleUnionExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleUnionExpr2(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: BAR pathExpr unionExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_BAR)) {
            astNode = new ASTNode(ASTNode.TYPE_UNIONEXPR2, this.__getSymbolValue(aPos));

            if ((evalResult = this.__rulePathExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if ((evalResult = this.__ruleUnionExpr2(evalResult.pos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt2: ()
        return new RuleEvalResult(aPos, new ASTNode(ASTNode.TYPE_EPSILON, null));

        // no applicable rule
        return null;
    },

    /**
     * Applies the pathExpr production.
     *
     * pathExpr ::= locationPath
     *            | filterExpr
     *            | filterExpr SLASH relativeLocationPath
     *            | filterExpr DOUBLESLASH relativeLocationPath
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __rulePathExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__rulePathExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: locationPath
        if ((evalResult = this.__ruleLocationPath(aPos)) != null) {
            return evalResult;
        }

        // alt2: filterExpr
        if ((evalResult = this.__ruleFilterExpr(aPos)) != null) {
            return evalResult;
        }

        // alt3: filterExpr SLASH relativeLocationPath
        if ((evalResult = this.__ruleFilterExpr(aPos)) != null) {
            astNode = evalResult.astNode;

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_SLASH)) {
                astNode.concatenate(new ASTNode(ASTNode.TYPE_PATHEXPR, this.__getSymbolValue(evalResult.pos)));

                if ((evalResult = this.__ruleRelativeLocationPath(evalResult.pos + 1)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt4: filterExpr DOUBLESLASH relativeLocationPath
        if ((evalResult = this.__ruleFilterExpr(aPos)) != null) {
            astNode = evalResult.astNode;

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_DOUBLESLASH)) {
                astNode.concatenate(new ASTNode(ASTNode.TYPE_PATHEXPR, this.__getSymbolValue(evalResult.pos)));

                if ((evalResult = this.__ruleRelativeLocationPath(evalResult.pos + 1)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the filterExpr production.
     *
     * filterExpr ::= primaryExpr (filterExpr2)?
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleFilterExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleFilterExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: primaryExpr (filterExpr2)?
        if ((evalResult = this.__rulePrimaryExpr(aPos)) != null) {
            astNode = evalResult.astNode;
            currPos = evalResult.pos;

            if ((evalResult = this.__ruleFilterExpr2(currPos)) != null) {
                astNode.concatenate(evalResult.astNode);

                currPos = evalResult.pos;
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the filterExpr2 production.
     *
     * filterExpr2 ::= predicate filterExpr2
     *               | ()
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleFilterExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleFilterExpr2(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: predicate filterExpr2
        if ((evalResult = this.__rulePredicate(aPos)) != null) {
            astNode = evalResult.astNode;

            if ((evalResult = this.__ruleFilterExpr2(evalResult.pos)) != null) {
                astNode.concatenate(evalResult.astNode);

                return new RuleEvalResult(evalResult.pos, astNode);
            }

        }

        // alt2: ()
        return new RuleEvalResult(aPos, new ASTNode(ASTNode.TYPE_EPSILON, null));

        // no applicable rule
        return null;
    },

    /**
     * Applies the orExpr production.
     *
     * orExpr ::= andExpr (orExpr2)?
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleOrExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleOrExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: andExpr (orExpr2)?
        if ((evalResult = this.__ruleAndExpr(aPos)) != null) {
            astNode = evalResult.astNode;
            currPos = evalResult.pos;

            if ((evalResult = this.__ruleOrExpr2(currPos)) != null) {
                astNode.concatenate(evalResult.astNode);

                currPos = evalResult.pos;
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the orExpr2 production.
     *
     * orExpr2 ::= OR andExpr orExpr2
     *           | ()
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleOrExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleOrExpr2(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: OR andExpr orExpr2
        if (this.__matchOr(aPos)) {
            astNode = new ASTNode(ASTNode.TYPE_OREXPR2, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleAndExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if ((evalResult = this.__ruleOrExpr2(evalResult.pos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt2: ()
        return new RuleEvalResult(aPos, new ASTNode(ASTNode.TYPE_EPSILON, null));

        // no applicable rule
        return null;
    },

    /**
     * Applies the andExpr production.
     *
     * andExpr ::= equalityExpr (andExpr2)?
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleAndExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleAndExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: equalityExpr (andExpr2)?
        if ((evalResult = this.__ruleEqualityExpr(aPos)) != null) {
            astNode = evalResult.astNode;
            currPos = evalResult.pos;

            if ((evalResult = this.__ruleAndExpr2(currPos)) != null) {
                astNode.concatenate(evalResult.astNode);

                currPos = evalResult.pos;
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the andExpr2 production.
     *
     * andExpr2 ::= AND equalityExpr andExpr2
     *            | ()
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleAndExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleAndExpr2(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: AND equalityExpr andExpr2
        if (this.__matchAnd(aPos)) {
            astNode = new ASTNode(ASTNode.TYPE_ANDEXPR2, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleEqualityExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if ((evalResult = this.__ruleAndExpr2(evalResult.pos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt2: ()
        return new RuleEvalResult(aPos, new ASTNode(ASTNode.TYPE_EPSILON, null));

        // no applicable rule
        return null;
    },

    /**
     * Applies the equalityExpr production.
     *
     * equalityExpr ::= relationalExpr (equalityExpr2)?
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleEqualityExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleEqualityExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: relationalExpr (equalityExpr2)?
        if ((evalResult = this.__ruleRelationalExpr(aPos)) != null) {
            astNode = evalResult.astNode;
            currPos = evalResult.pos;

            if ((evalResult = this.__ruleEqualityExpr2(currPos)) != null) {
                astNode.concatenate(evalResult.astNode);

                currPos = evalResult.pos;
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the equalityExpr2 production.
     *
     * equalityExpr2 ::= EQUALITYOPERATOR relationalExpr equalityExpr2
     *                 | ()
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleEqualityExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleEqualityExpr2(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: EQUALITYOPERATOR relationalExpr equalityExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_EQUALITYOPERATOR)) {
            astNode = new ASTNode(ASTNode.TYPE_EQUALITYOPERATOR, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleRelationalExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if ((evalResult = this.__ruleEqualityExpr2(evalResult.pos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt2: ()
        return new RuleEvalResult(aPos, new ASTNode(ASTNode.TYPE_EPSILON, null));

        // no applicable rule
        return null;
    },

    /**
     * Applies the relationalExpr production.
     *
     * relationalExpr ::= additiveExpr (relationalExpr2)?
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleRelationalExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleRelationalExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: additiveExpr (relationalExpr2)?
        if ((evalResult = this.__ruleAdditiveExpr(aPos)) != null) {
            astNode = evalResult.astNode;
            currPos = evalResult.pos;

            if ((evalResult = this.__ruleRelationalExpr2(currPos)) != null) {
                astNode.concatenate(evalResult.astNode);

                currPos = evalResult.pos;
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the relationalExpr2 production.
     *
     * relationalExpr2 ::= RELATIONALOPERATOR additiveExpr relationalExpr2
     *                   | ()
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleRelationalExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleRelationalExpr2(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: RELATIONALOPERATOR additiveExpr relationalExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_RELATIONALOPERATOR)) {
            astNode = new ASTNode(ASTNode.TYPE_RELATIONALOPERATOR, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleAdditiveExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if ((evalResult = this.__ruleRelationalExpr2(evalResult.pos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt2: ()
        return new RuleEvalResult(aPos, new ASTNode(ASTNode.TYPE_EPSILON, null));

        // no applicable rule
        return null;
    },

    /**
     * Applies the additiveExpr production.
     *
     * additiveExpr ::= multiplicativeExpr (additiveExpr2)?
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleAdditiveExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleAdditiveExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: multiplicativeExpr (additiveExpr2)?
        if ((evalResult = this.__ruleMultiplicativeExpr(aPos)) != null) {
            astNode = evalResult.astNode;
            currPos = evalResult.pos;

            if ((evalResult = this.__ruleAdditiveExpr2(currPos)) != null) {
                astNode.concatenate(evalResult.astNode);

                currPos = evalResult.pos;
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the additiveExpr2 production.
     *
     * additiveExpr2 ::= PLUS multiplicativeExpr additiveExpr2
     *                 | MINUS multiplicativeExpr additiveExpr2
     *                 | ()
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleAdditiveExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleAdditiveExpr2(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: PLUS multiplicativeExpr additiveExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_PLUS)) {
            astNode = new ASTNode(ASTNode.TYPE_PLUS, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleMultiplicativeExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if ((evalResult = this.__ruleAdditiveExpr2(evalResult.pos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt1: MINUS multiplicativeExpr additiveExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_MINUS)) {
            astNode = new ASTNode(ASTNode.TYPE_MINUS, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleMultiplicativeExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if ((evalResult = this.__ruleAdditiveExpr2(evalResult.pos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt3: ()
        return new RuleEvalResult(aPos, new ASTNode(ASTNode.TYPE_EPSILON, null));

        // no applicable rule
        return null;
    },

    /**
     * Applies the multiplicativeExpr production.
     *
     * multiplicativeExpr ::= unaryExpr (multiplicativeExpr2)?
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleMultiplicativeExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleMultiplicativeExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: unaryExpr (multiplicativeExpr2)?
        if ((evalResult = this.__ruleUnaryExpr(aPos)) != null) {
            astNode = evalResult.astNode;
            currPos = evalResult.pos;

            if ((evalResult = this.__ruleMultiplicativeExpr2(currPos)) != null) {
                astNode.concatenate(evalResult.astNode);

                currPos = evalResult.pos;
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the multiplicativeExpr2 production.
     *
     * multiplicativeExpr2 ::= MULTIPLICATIVEOPERATOR unaryExpr multiplicativeExpr2
     *                       | ()
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleMultiplicativeExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleMultiplicativeExpr2(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: MULTIPLICATIVEOPERATOR unaryExpr multiplicativeExpr2
        if (this.__matchMultiplicativeOperator(aPos)) {
            astNode = new ASTNode(ASTNode.TYPE_MULTIPLICATIVEOPERATOR, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleUnaryExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                if ((evalResult = this.__ruleMultiplicativeExpr2(evalResult.pos)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt2: ()
        return new RuleEvalResult(aPos, new ASTNode(ASTNode.TYPE_EPSILON, null));

        // no applicable rule
        return null;
    },

    /**
     * Applies the unaryExpr production.
     *
     * unaryExpr ::= unionExpr
     *             | MINUS unaryExpr
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleUnaryExpr: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleUnaryExpr(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: unionExpr
        if ((evalResult = this.__ruleUnionExpr(aPos)) != null) {
            return evalResult;
        }

        // alt2: MINUS unaryExpr
        if (this.__matchSymbol(aPos, XPathToken.TYPE_MINUS)) {
            astNode = new ASTNode(ASTNode.TYPE_MINUS, this.__getSymbolValue(aPos));

            if ((evalResult = this.__ruleUnaryExpr(aPos + 1)) != null) {
                astNode.concatenate(evalResult.astNode);

                return new RuleEvalResult(evalResult.pos, astNode);
            }
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the literal production.
     *
     * literal ::= DOUBLEQUOTELITERAL
     *           | SINGLEQUOTELITERAL
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleLiteral: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleLiteral(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: DOUBLEQUOTELITERAL
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DOUBLEQUOTELITERAL)) {
            astNode = new ASTNode(ASTNode.TYPE_DOUBLEQUOTELITERAL, this.__getSymbolValue(aPos));

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // alt2: SINGLEQUOTELITERAL
        if (this.__matchSymbol(aPos, XPathToken.TYPE_SINGLEQUOTELITERAL)) {
            astNode = new ASTNode(ASTNode.TYPE_SINGLEQUOTELITERAL, this.__getSymbolValue(aPos));

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the number production.
     *
     * number ::= DIGITS (PERIOD (DIGITS)?)?
     *          | PERIOD DIGITS
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleNumber: function (aPos) {
        var evalResult = null;
        var astNode    = null;
        var currPos    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleNumber(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: DIGITS (PERIOD (DIGITS)?)?
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DIGITS)) {
            astNode = new ASTNode(ASTNode.TYPE_DIGITS, this.__getSymbolValue(aPos));
            currPos = aPos + 1;

            if (this.__matchSymbol(currPos, XPathToken.TYPE_PERIOD)) {
                astNode.concatenate(new ASTNode(ASTNode.TYPE_PERIOD, this.__getSymbolValue(currPos)));

                currPos++;

                if (this.__matchSymbol(currPos, XPathToken.TYPE_DIGITS)) {
                    astNode.concatenate(new ASTNode(ASTNode.TYPE_DIGITS, this.__getSymbolValue(currPos)));

                    currPos++;
                }
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // alt2: PERIOD DIGITS
        if (this.__matchSymbol(aPos, XPathToken.TYPE_PERIOD)) {
            astNode = new ASTNode(ASTNode.TYPE_PERIOD, this.__getSymbolValue(aPos));

            if (this.__matchSymbol(aPos + 1, XPathToken.TYPE_DIGITS)) {
                astNode.concatenate(new ASTNode(ASTNode.TYPE_DIGITS, this.__getSymbolValue(aPos + 1)));

                return new RuleEvalResult(aPos + 2, astNode);
            }
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the nameTest production.
     *
     * nameTest ::= STAR
     *            | qName
     *            | prefix COLON STAR
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleNameTest: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleNameTest(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: STAR
        if (this.__matchSymbol(aPos, XPathToken.TYPE_STAR)) {
            astNode = new ASTNode(ASTNode.TYPE_STAR, this.__getSymbolValue(aPos));

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // alt2: qName
        if ((evalResult = this.__ruleQName(aPos)) != null) {
            return evalResult;
        }

        // alt3: prefix COLON STAR
        if ((evalResult = this.__rulePrefix(aPos)) != null) {
            astNode = evalResult.astNode;

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_COLON)) {
                astNode.concatenate(new ASTNode(ASTNode.TYPE_COLON, this.__getSymbolValue(evalResult.pos)));

                if (this.__matchSymbol(evalResult.pos + 1, XPathToken.TYPE_STAR)) {
                    astNode.concatenate(new ASTNode(ASTNode.TYPE_STAR, this.__getSymbolValue(evalResult.pos + 1)));

                    return new RuleEvalResult(evalResult.pos + 2, astNode);
                }
            }
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the qName production.
     *
     * qName ::= prefix COLON ncName
     *         | ncName
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleQName: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleQName(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: prefix COLON ncName
        if ((evalResult = this.__rulePrefix(aPos)) != null) {
            astNode = evalResult.astNode;

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_COLON)) {
                astNode.concatenate(new ASTNode(ASTNode.TYPE_COLON, this.__getSymbolValue(evalResult.pos)));

                if ((evalResult = this.__ruleNCName(evalResult.pos + 1)) != null) {
                    astNode.concatenate(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt2: ncName
        if ((evalResult = this.__ruleNCName(aPos)) != null) {
            return evalResult;
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the prefix production.
     *
     * prefix ::= ncName
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __rulePrefix: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__rulePrefix(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: ncName
        if ((evalResult = this.__ruleNCName(aPos)) != null) {
            // rewrite AST node type to indicate that this NCName is indeed a prefix
            evalResult.astNode.nodeType = ASTNode.TYPE_PREFIX;

            return evalResult;
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the ncName production.
     *
     * ncName ::= IDENT
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleNCName: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleNCName(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: IDENT
        if (this.__matchSymbol(aPos, XPathToken.TYPE_IDENT)) {
            astNode = new ASTNode(ASTNode.TYPE_IDENT, this.__getSymbolValue(aPos));

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // no applicable rule
        return null;
    },

    /**
     * Applies the nodeType production.
     *
     * nodeType ::= NODETYPE
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleNodeType: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__ruleNodeType(\"" + aPos + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: NODETYPE
        if (this.__matchNodeType(aPos)) {
            astNode = new ASTNode(ASTNode.TYPE_NODETYPE, this.__getSymbolValue(aPos));

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // no applicable rule
        return null;
    }
};


function ASTNode(aNodeType, aValue) {
    /* DEBUG */ YulupDebug.ASSERT(aNodeType != null);
    /* DEBUG */ YulupDebug.ASSERT(aNodeType != ASTNode.TYPE_EPSILON ? aValue != null : !aValue);

    /* DEBUG */ dump("Yulup:xpathparser.js:ASTNode(\"" + aNodeType + "\", \"" + aValue + "\") invoked\n");

    this.nodeType = aNodeType;
    this.value    = aValue;
}

ASTNode.TYPE_LOCATIONPATH = 0;
ASTNode.TYPE_ABSOLUTELOCATIONPATH = 1;
ASTNode.TYPE_RELATIVELOCATIONPATH = 2;
ASTNode.TYPE_RELATIVELOCATIONPATH2 = 3;
ASTNode.TYPE_STEP = 4;
ASTNode.TYPE_CURRENTNODE = 5;
ASTNode.TYPE_PARENTNODE = 6;
ASTNode.TYPE_AXISSPECIFIER = 7;
ASTNode.TYPE_AXISNAME = 8;
ASTNode.TYPE_AT = 9;
ASTNode.TYPE_NODETEST = 10;
ASTNode.TYPE_PREDICATE = 11;
ASTNode.TYPE_PRIMARYEXPR = 12;
ASTNode.TYPE_FUNCTIONCALL = 13;
ASTNode.TYPE_ARG = 14;
ASTNode.TYPE_UNIONEXPR = 15;
ASTNode.TYPE_UNIONEXPR2 = 16;
ASTNode.TYPE_PATHEXPR = 17;
ASTNode.TYPE_FILTEREXPR = 18;
ASTNode.TYPE_FILTEREXPR2 = 19;
ASTNode.TYPE_OREXPR = 20;
ASTNode.TYPE_OREXPR2 = 21;
ASTNode.TYPE_ANDEXPR = 22;
ASTNode.TYPE_ANDEXPR2 = 23;
ASTNode.TYPE_EQUALITYEXPR = 24;
ASTNode.TYPE_EQUALITYEXPR2 = 25;
ASTNode.TYPE_EQUALITYOPERATOR = 26;
ASTNode.TYPE_RELATIONALEXPR = 27;
ASTNode.TYPE_RELATIONALEXPR2 = 28;
ASTNode.TYPE_RELATIONALOPERATOR = 29;
ASTNode.TYPE_ADDITIVEEXPR = 30;
ASTNode.TYPE_ADDITIVEEXPR2 = 31;
ASTNode.TYPE_PLUS = 32;
ASTNode.TYPE_MINUS = 33;
ASTNode.TYPE_MULTIPLICATIVEEXPR = 34;
ASTNode.TYPE_MULTIPLICATIVEEXPR2 = 35;
ASTNode.TYPE_MULTIPLICATIVEOPERATOR = 36;
ASTNode.TYPE_UNARYEXPR = 37;
ASTNode.TYPE_LITERAL = 38;
ASTNode.TYPE_DOUBLEQUOTELITERAL = 39;
ASTNode.TYPE_SINGLEQUOTELITERAL = 40;
ASTNode.TYPE_NUMBER = 41;
ASTNode.TYPE_DIGITS = 42;
ASTNode.TYPE_PERIOD = 43;
ASTNode.TYPE_NAMETEST = 44;
ASTNode.TYPE_STAR = 45;
ASTNode.TYPE_COLON = 46;
ASTNode.TYPE_QNAME = 47;
ASTNode.TYPE_PREFIX = 48;
ASTNode.TYPE_NCNAME = 49;
ASTNode.TYPE_IDENT = 50;
ASTNode.TYPE_NODETYPE = 51;
ASTNode.TYPE_AXISDELIMITER = 52;
ASTNode.TYPE_LOCALNAME = 53;
ASTNode.TYPE_EPSILON = 54;

ASTNode.prototype = {
    __next    : null,

    nodeType: null,
    value    : null,

    getNext: function () {
        return this.__next;
    },

    getType: function () {
        return this.nodeType;
    },

    setType: function (aType) {
        /* DEBUG */ YulupDebug.ASSERT(aType != null);

        this.nodeType = aType;
    },

    getValue: function () {
        return this.value;
    },

    setValue: function (aValue) {
        /* DEBUG */ YulupDebug.ASSERT(aValue != null);

        this.value = aValue;
    },

    /**
     * Adds the given node to the end of the (potential) chain
     * started by this node (i.e., if this node already has
     * a successor, the given node is concatenated with that
     * successor, instead of this node, recursively).
     *
     * Note that if the given successor is of type epsilon, then
     * the chain starting from that successor is searched until
     * either the end is reached, or a node of type not epsilon
     * is found. This guarantees that no epsilon nodes end up
     * in the AST chain.
     *
     * @param  {ASTNode}   aSuccessor the node to append
     * @return {Undefined} does not have a return value
     */
    concatenate: function (aSuccessor) {
        var successor = null;

        /* DEBUG */ YulupDebug.ASSERT(aSuccessor != null);
        /* DEBUG */ YulupDebug.ASSERT(aSuccessor ? aSuccessor instanceof ASTNode : true);

        successor = aSuccessor;

        while (successor != null && successor.nodeType == ASTNode.TYPE_EPSILON) {
            successor = successor.getNext();
        }

        if (successor) {
            if (this.__next) {
                this.__next.concatenate(successor);
            } else {
                this.__next = successor;
            }
        }
    },

    toObjectString: function () {
        return "{" + this.nodeType + ", \"" + this.value + "\"}" + (this.__next ? this.__next.toObjectString() : "");
    },

    toString: function () {
        return (this.nodeType != ASTNode.TYPE_EPSILON ? this.value : "") + (this.__next ? this.__next.toString() : "");
    }
};


function RuleEvalResult(aPos, aASTNode) {
    /* DEBUG */ YulupDebug.ASSERT(aPos     != null);
    /* DEBUG */ YulupDebug.ASSERT(aASTNode != null);
    /* DEBUG */ YulupDebug.ASSERT(aASTNode ? aASTNode instanceof ASTNode : true);

    this.pos     = aPos;
    this.astNode = aASTNode;
}

RuleEvalResult.prototpye = {
    pos    : null,
    astNode: null
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

    this.__whitespaceChars = [String.fromCharCode(32), String.fromCharCode(9), String.fromCharCode(13), String.fromCharCode(10)];
    this.__nonNameChars    = ["/", ":", ".", ",", "@", "|", "$", "*", "=", "!", "<", ">", "[", "]", "\"", "'"];
    this.__digitChars      = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
}

XPathLexer.prototype = {
    __whitespaceChars: null,
    __nonNameChars   : null,
    __digitChars     : null,
    __sourceString   : null,
    __readPos        : null,

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

        for (var i = 0; i < this.__whitespaceChars.length; i++) {
            if (aChar == this.__whitespaceChars[i])
                return true;
        }

        return false;
    },

    __isNameChar: function (aChar) {
        /* DEBUG */ YulupDebug.ASSERT(aChar != null);

        for (var i = 0; i < this.__nonNameChars.length; i++) {
            if (aChar == this.__nonNameChars[i])
                return false;
        }

        return true;
    },

    __isDigitChar: function (aChar) {
        /* DEBUG */ YulupDebug.ASSERT(aChar != null);

        for (var i = 0; i < this.__digitChars.length; i++) {
            if (aChar == this.__digitChars[i])
                return true;
        }

        return false;
    },

    getSymbol: function () {
        var char = null;
        var name = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathLexer.getSymbol() invoked\n");

        while ((char = this.__readChar()) != null && this.__isWhitespaceChar(char));

        if (char != null) {
            switch (char) {
                case "/":
                    if ((char = this.__readChar()) == "/") {
                        return new XPathToken(XPathToken.TYPE_DOUBLESLASH, "//");
                    }

                    if (char != null)
                        this.__putBack(1);

                    return new XPathToken(XPathToken.TYPE_SLASH, "/");
                case ":":
                    if ((char = this.__readChar()) == ":") {
                        return new XPathToken(XPathToken.TYPE_DOUBLECOLON, "::");
                    }

                    if (char != null)
                        this.__putBack(1);

                    return new XPathToken(XPathToken.TYPE_COLON, ":");
                case ".":
                    if ((char = this.__readChar()) == ".") {
                        return new XPathToken(XPathToken.TYPE_DOUBLEPERIOD, "..");
                    }

                    if (char != null)
                        this.__putBack(1);

                    return new XPathToken(XPathToken.TYPE_PERIOD, ".");
                case ",":
                    return new XPathToken(XPathToken.TYPE_COMMA, ",");
                case "@":
                    return new XPathToken(XPathToken.TYPE_AT, "@");
                case "|":
                    return new XPathToken(XPathToken.TYPE_BAR, "|");
                case "$":
                    return new XPathToken(XPathToken.TYPE_DOLLAR, "$");
                case "*":
                    return new XPathToken(XPathToken.TYPE_STAR, "*");
                case "=":
                    return new XPathToken(XPathToken.TYPE_EQUALITYOPERATOR, "=");
                case "!":
                    if (this.__readChar() == "=") {
                        return new XPathToken(XPathToken.TYPE_EQUALITYOPERATOR, "!=");
                    } else {
                        throw new YulupXPathParserInvalidCharacterException();
                    }
                case "<":
                    if ((char = this.__readChar()) == "=") {
                        return new XPathToken(XPathToken.TYPE_RELATIONALOPERATOR, "<=");
                    }

                    if (char != null)
                        this.__putBack(1);

                    return new XPathToken(XPathToken.TYPE_RELATIONALOPERATOR, "<");
                case ">":
                    if ((char = this.__readChar()) == "=") {
                        return new XPathToken(XPathToken.TYPE_RELATIONALOPERATOR, ">=");
                    }

                    if (char != null)
                        this.__putBack(1);

                    return new XPathToken(XPathToken.TYPE_RELATIONALOPERATOR, ">");
                case "[":
                    return new XPathToken(XPathToken.TYPE_LBRACKET, "[");
                case "]":
                    return new XPathToken(XPathToken.TYPE_RBRACKET, "]");
                case "(":
                    return new XPathToken(XPathToken.TYPE_LPAREN, "(");
                case ")":
                    return new XPathToken(XPathToken.TYPE_RPAREN, ")");
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
                case "0": case "1": case "2": case "3": case "4": case "5": case "6": case "7": case "8": case "9":
                    name = "";

                    do {
                        name += char;
                    } while ((char = this.__readChar()) != null && !this.__isWhitespaceChar(char) && this.__isDigitChar(char));

                    if (char != null)
                        this.__putBack(1);

                    return new XPathToken(XPathToken.TYPE_DIGITS, name);
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
 * @param  {String}     aValue the value of the token
 * @return {XPathToken}
 */
function XPathToken(aType, aValue) {
    /* DEBUG */ YulupDebug.ASSERT(aType  != null);
    /* DEBUG */ YulupDebug.ASSERT(aValue != null);

    this.type  = aType;
    this.value = aValue;
}

XPathToken.TYPE_SLASH                  = 0;
XPathToken.TYPE_DOUBLESLASH            = 1;
XPathToken.TYPE_COLON                  = 2;
XPathToken.TYPE_DOUBLECOLON            = 3;
XPathToken.TYPE_PERIOD                 = 4;
XPathToken.TYPE_DOUBLEPERIOD           = 5;
XPathToken.TYPE_COMMA                  = 6;
XPathToken.TYPE_AT                     = 7;
XPathToken.TYPE_BAR                    = 8;
XPathToken.TYPE_DOLLAR                 = 9;
XPathToken.TYPE_STAR                   = 10;
XPathToken.TYPE_EQUALITYOPERATOR       = 11;
XPathToken.TYPE_RELATIONALOPERATOR     = 12;
XPathToken.TYPE_MULTIPLICATIVEOPERATOR = 13;
XPathToken.TYPE_PLUS                   = 14;
XPathToken.TYPE_MINUS                  = 15;
XPathToken.TYPE_LBRACKET               = 16;
XPathToken.TYPE_RBRACKET               = 17;
XPathToken.TYPE_LPAREN                 = 18;
XPathToken.TYPE_RPAREN                 = 19;
XPathToken.TYPE_DOUBLEQUOTELITERAL     = 20;
XPathToken.TYPE_SINGLEQUOTELITERAL     = 21;
XPathToken.TYPE_DIGITS                 = 22;
XPathToken.TYPE_IDENT                  = 23;

XPathToken.prototype = {
    type : null,
    value: null,

    toString: function () {
        return "{" + this.type + ", \"" + this.value + "\"}";
    }
};
