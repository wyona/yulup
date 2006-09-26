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
    __xpathLexer : null,
    __resultStack: null,

    /**
     * Parse the source string as given to the constructor.
     *
     * @return {Array} array consisting of slashes and steps, both as strings
     */
    parse: function () {
        return this.__drive(new Array(), this.__STATE_LOCATIONPATH, 0, this.__xpathLexer.getSymbol());
    },

    /**
     * Applies the locationPath production.
     *
     * locationPath ::= relativeLocationPath
     *                | absoluteLocationPath
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleLocationPath: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: relativeLocationPath
        if ((evalResult = this.__ruleRelativeLocationPath(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_LOCATIONPATH, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
        }

        // alt2: absoluteLocationPath
        if ((evalResult = this.__ruleAbsoluteLocationPath(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_LOCATIONPATH, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: SLASH (relativeLocationPath)?
        if (this.__matchSymbol(aPos, XPathToken.TYPE_SLASH)) {
            astNode = new ASTNode(ASTNode.TYPE_LOCATIONPATH, aPos);

            if ((evalResult = this.__ruleRelativeLocationPath(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);
            }

            return new RuleEvalResult(evalResult.pos, astNode);
        }

        // alt2: DOUBLESLASH relativeLocationPath
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DOUBLESLASH)) {
            astNode = new ASTNode(ASTNode.TYPE_LOCATIONPATH, aPos);

            if ((evalResult = this.__ruleRelativeLocationPath(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: step (relativeLocationPath2)?
        if ((evalResult = this.__ruleStep(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_RELATIVELOCATIONPATH, aPos);
            astNode.addChild(evalResult.astNode);

            currPos = evalResult.pos;

            if ((evalResult = this.__ruleRelativeLocationPath2(currPos)) != null) {
                astNode.addChild(evalResult.astNode);

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
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleRelativeLocationPath2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: SLASH step relativeLocationPath2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_SLASH)) {
            astNode = new ASTNode(ASTNode.TYPE_RELATIVELOCATIONPATH2, aPos);

            if ((evalResult = this.__ruleStep(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if ((evalResult = this.__ruleRelativeLocationPath2(evalResult.pos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt2: DOUBLECOLON step relativeLocationPath2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DOUBLECOLON)) {
            astNode = new ASTNode(ASTNode.TYPE_RELATIVELOCATIONPATH2, aPos);

            if ((evalResult = this.__ruleStep(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if ((evalResult = this.__ruleRelativeLocationPath2(evalResult.pos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: axisSpecifier nodeTest (predicate)*
        if ((evalResult = this.__ruleAxisSpecifier(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_STEP, aPos);
            astNode.addChild(evalResult.astNode);

            if ((evalResult = this.__ruleNodeTest(evalResult.pos)) != null) {
                astNode.addChild(evalResult.astNode);

                currPos = evalResult.pos;

                while ((evalResult = this.__rulePredicate(currPos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    currPos = evalResult.pos;
                }

                return new RuleEvalResult(currPos, astNode);
            }
        }

        // alt2: PERIOD
        if (this.__matchSymbol(aPos, XPathToken.TYPE_PERIOD)) {
            astNode = new ASTNode(ASTNode.TYPE_STEP, aPos);
            astNode.addChild(new ASTNode(ASTNode.TYPE_CURRENTNODE));

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // alt3: DOUBLEPERIOD
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DOUBLEPERIOD)) {
            astNode = new ASTNode(ASTNode.TYPE_STEP, aPos);
            astNode.addChild(new ASTNode(ASTNode.TYPE_PARENTNODE));

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: AXISNAME DOUBLECOLON
        if (this.__matchSymbol(aPos, XPathToken.TYPE_AXISNAME)) {
            astNode = new ASTNode(ASTNode.TYPE_AXISSPECIFIER, aPos);
            astNode.addChild(new ASTNode(ASTNode.TYPE_AXISNAME));

            if (this.__matchSymbol(aPos + 1, XPathToken.TYPE_DOUBLECOLON)) {
                return new RuleEvalResult(aPos + 2, astNode);
            }
        }

        // alt2: (AT)?
        if (this.__matchSymbol(aPos, XPathToken.TYPE_AT)) {
            astNode = new ASTNode(ASTNode.TYPE_AXISSPECIFIER, aPos);
            astNode.addChild(new ASTNode(ASTNode.TYPE_AT));

            return new RuleEvalResult(aPos + 1, astNode);
        } else {
            astNode = new ASTNode(ASTNode.TYPE_AXISSPECIFIER, aPos);

            return new RuleEvalResult(aPos + 1, astNode);
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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: nameTest
        if ((evalResult = this.__ruleNameTest(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_NODETEST, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
        }

        // alt2: "processing-instruction" LPAREN literal RPAREN
        if (this.__matchSymbol(aPos, XPathToken.TYPE_PROCESSINGINSTRUCTION)) {
            astNode = new ASTNode(ASTNode.TYPE_NODETEST, aPos);

            if (this.__matchSymbol(aPos + 1, XPathToken.TYPE_LPAREN)) {
                if ((evalResult = this.__ruleLiteral(aPos + 3)) != null) {
                    astNode.addChild(evalResult.astNode);

                    if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_RPAREN)) {
                        return new RuleEvalResult(evalResult.pos, astNode);
                    }
                }
            }
        }

        // alt3: nodeType LPAREN RPAREN
        if ((evalResult = this.__ruleNodeType(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_NODETEST, aPos);
            astNode.addChild(evalResult.astNode);

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_LPAREN)) {
                if (this.__matchSymbol(evalResult.pos + 1, XPathToken.TYPE_RPAREN)) {
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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: LBRACKET orExpr RBRACKET
        if (this.__matchSymbol(aPos, XPathToken.TYPE_LBRACKET)) {
            astNode = new ASTNode(ASTNode.TYPE_PREDICATE, aPos);

            if ((evalResult = this.__ruleOrExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_RBRACKET)) {
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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: DOLLAR qName
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DOLLAR)) {
            astNode = new ASTNode(ASTNode.TYPE_PRIMARYEXPR, aPos);

            if ((evalResult = this.__ruleQName(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                return new RuleEvalResult(evalResult.pos, astNode);
            }
        }

        // alt2: LPAREN orExpr RPAREN
        if (this.__matchSymbol(aPos, XPathToken.TYPE_LPAREN)) {
            astNode = new ASTNode(ASTNode.TYPE_PRIMARYEXPR, aPos);

            if ((evalResult = this.__ruleOrExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_RPAREN)) {
                    return new RuleEvalResult(evalResult.pos + 1, astNode);
                }
            }
        }

        // alt3: literal
        if ((evalResult = this.__ruleLiteral(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_PRIMARYEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
        }

        // alt4: number
        if ((evalResult = this.__ruleNumber(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_PRIMARYEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
        }

        // alt5: functionCall
        if ((evalResult = this.__ruleFunctionCall(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_PRIMARYEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: qName LPAREN (orExpr (arg)*)? RPAREN
        if ((evalResult = this.__ruleQName(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_FUNCTIONCALL, aPos);
            astNode.addChild(evalResult.astNode);

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_LPAREN)) {
                currPos = evalResult.pos + 1;

                if ((evalResult = this.__ruleOrExpr(currPos)) != null) {
                    astNode.addChild(new ASTNode(ASTNode.TYPE_OREXPR));

                    currPos = evalResult.pos;

                    while ((evalResult = this.__ruleArg(currPos)) != null) {
                        astNode.addChild(evalResult.astNode);

                        currPos = evalResult.pos;
                    }
                }

                if (this.__matchSymbol(currPos + 1, XPathToken.TYPE_RPAREN)) {
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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: COMMA orExpr
        if (this.__matchSymbol(aPos, XPathToken.TYPE_COMMA)) {
            astNode = new ASTNode(ASTNode.TYPE_ARG, aPos);

            if ((evalResult = this.__ruleOrExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: pathExpr (unionExpr2)?
        if ((evalResult = this.__rulePathExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_UNIONEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            currPos = evalResult.pos;

            if ((evalResult = this.__ruleUnionExpr2(currPos)) != null) {
                astNode.addChild(evalResult.astNode);

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
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleUnionExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: BAR pathExpr unionExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_BAR)) {
            astNode = new ASTNode(ASTNode.TYPE_UNIONEXPR2, aPos);

            if ((evalResult = this.__rulePathExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if ((evalResult = this.__ruleUnionExpr2(evalResult.pos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: locationPath
        if ((evalResult = this.__ruleLocationPath(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_PATHEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
        }

        // alt2: filterExpr
        if ((evalResult = this.__ruleFilterExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_PATHEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
        }

        // alt3: filterExpr SLASH relativeLocationPath
        if ((evalResult = this.__ruleFilterExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_PATHEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_SLASH)) {
                if ((evalResult = this.__ruleRelativeLocationPath(evalResult.pos + 1)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt4: filterExpr DOUBLESLASH relativeLocationPath
        if ((evalResult = this.__ruleFilterExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_PATHEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_DOUBLESLASH)) {
                if ((evalResult = this.__ruleRelativeLocationPath(evalResult.pos + 1)) != null) {
                    astNode.addChild(evalResult.astNode);

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: primaryExpr (filterExpr2)?
        if ((evalResult = this.__rulePrimaryExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_FILTEREXPR, aPos);
            astNode.addChild(evalResult.astNode);

            currPos = evalResult.pos;

            if ((evalResult = this.__ruleFilterExpr2(currPos)) != null) {
                astNode.addChild(evalResult.astNode);

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
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleFilterExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: predicate filterExpr2
        if ((evalResult = this.__rulePredicate(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_FILTEREXPR2, aPos);
            astNode.addChild(evalResult.astNode);

            if ((evalResult = this.__ruleFilterExpr2(evalResult.pos)) != null) {
                astNode.addChild(evalResult.astNode);

                return new RuleEvalResult(evalResult.pos, astNode);
            }

        }

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: andExpr (orExpr2)?
        if ((evalResult = this.__ruleAndExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_OREXPR, aPos);
            astNode.addChild(evalResult.astNode);

            currPos = evalResult.pos;

            if ((evalResult = this.__ruleOrExpr2(currPos)) != null) {
                astNode.addChild(evalResult.astNode);

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
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleOrExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: OR andExpr orExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_OR)) {
            astNode = new ASTNode(ASTNode.TYPE_OREXPR2, aPos);

            if ((evalResult = this.__ruleAndExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if ((evalResult = this.__ruleOrExpr2(evalResult.pos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: equalityExpr (andExpr2)?
        if ((evalResult = this.__ruleEqualityExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_ANDEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            currPos = evalResult.pos;

            if ((evalResult = this.__ruleAndExpr2(currPos)) != null) {
                astNode.addChild(evalResult.astNode);

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
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleAndExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: AND equalityExpr andExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_AND)) {
            astNode = new ASTNode(ASTNode.TYPE_ANDEXPR2, aPos);

            if ((evalResult = this.__ruleEqualityExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if ((evalResult = this.__ruleAndExpr2(evalResult.pos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: relationalExpr (equalityExpr2)?
        if ((evalResult = this.__ruleRelationalExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_EQUALITYEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            currPos = evalResult.pos;

            if ((evalResult = this.__ruleEqualityExpr2(currPos)) != null) {
                astNode.addChild(evalResult.astNode);

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
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleEqualityExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: EQUALITYOPERATOR relationalExpr equalityExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_EQUALITYOPERATOR)) {
            astNode = new ASTNode(ASTNode.TYPE_EQUALITYEXPR2, aPos);
            astNode.addChild(new ASTNode.TYPE_EQUALITYOPERATOR);

            if ((evalResult = this.__ruleRelationalExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if ((evalResult = this.__ruleEqualityExpr2(evalResult.pos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: additiveExpr (relationalExpr2)?
        if ((evalResult = this.__ruleAdditiveExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_RELATIONALEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            currPos = evalResult.pos;

            if ((evalResult = this.__ruleRelationalExpr2(currPos)) != null) {
                astNode.addChild(evalResult.astNode);

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
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleRelationalExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: RELATIONALOPERATOR additiveExpr relationalExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_RELATIONALOPERATOR)) {
            astNode = new ASTNode(ASTNode.TYPE_RELATIONALEXPR2, aPos);
            astNode.addChild(new ASTNode.TYPE_RELATIONALOPERATOR);

            if ((evalResult = this.__ruleAdditiveExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if ((evalResult = this.__ruleRelationalExpr2(evalResult.pos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: multiplicativeExpr (additiveExpr2)?
        if ((evalResult = this.__ruleMultiplicativeExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_ADDITIVEEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            currPos = evalResult.pos;

            if ((evalResult = this.__ruleAdditiveExpr2(currPos)) != null) {
                astNode.addChild(evalResult.astNode);

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
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleAdditiveExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: PLUS multiplicativeExpr additiveExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_PLUS)) {
            astNode = new ASTNode(ASTNode.TYPE_ADDITIVEEXPR2, aPos);
            astNode.addChild(new ASTNode.TYPE_PLUS);

            if ((evalResult = this.__ruleMultiplicativeExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if ((evalResult = this.__ruleAdditiveExpr2(evalResult.pos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt1: MINUS multiplicativeExpr additiveExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_MINUS)) {
            astNode = new ASTNode(ASTNode.TYPE_ADDITIVEEXPR2, aPos);
            astNode.addChild(new ASTNode.TYPE_MINUS);

            if ((evalResult = this.__ruleMultiplicativeExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if ((evalResult = this.__ruleAdditiveExpr2(evalResult.pos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: unaryExpr (multiplicativeExpr2)?
        if ((evalResult = this.__ruleUnaryExpr(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_MULTIPLICATIVEEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            currPos = evalResult.pos;

            if ((evalResult = this.__ruleMultiplicativeExpr2(currPos)) != null) {
                astNode.addChild(evalResult.astNode);

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
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleMultiplicativeExpr2: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: MULTIPLICATIVEOPERATOR unaryExpr multiplicativeExpr2
        if (this.__matchSymbol(aPos, XPathToken.TYPE_MULTIPLICATIVEOPERATOR)) {
            astNode = new ASTNode(ASTNode.TYPE_MULTIPLICATIVEEXPR2, aPos);
            astNode.addChild(new ASTNode.TYPE_MULTIPLICATIVEOPERATOR);

            if ((evalResult = this.__ruleUnaryExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

                if ((evalResult = this.__ruleMultiplicativeExpr2(evalResult.pos)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: unionExpr
        if ((evalResult = this.__ruleUnionExpr(evalResult.pos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_UNARYEXPR, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
        }

        // alt2: MINUS unaryExpr
        if (this.__matchSymbol(aPos, XPathToken.TYPE_MINUS)) {
            astNode = new ASTNode(ASTNode.TYPE_UNARYEXPR, aPos);
            astNode.addChild(new ASTNode.TYPE_MINUS);

            if ((evalResult = this.__ruleUnaryExpr(aPos + 1)) != null) {
                astNode.addChild(evalResult.astNode);

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: DOUBLEQUOTELITERAL
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DOUBLEQUOTELITERAL)) {
            astNode = new ASTNode(ASTNode.TYPE_LITERAL, aPos);
            astNode.addChild(new ASTNode.TYPE_DOUBLEQUOTELITERAL);

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // alt2: SINGLEQUOTELITERAL
        if (this.__matchSymbol(aPos, XPathToken.TYPE_SINGLEQUOTELITERAL)) {
            astNode = new ASTNode(ASTNode.TYPE_LITERAL, aPos);
            astNode.addChild(new ASTNode.TYPE_SINGLEQUOTELITERAL);

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: DIGITS (PERIOD (DIGITS)?)?
        if (this.__matchSymbol(aPos, XPathToken.TYPE_DIGITS)) {
            astNode = new ASTNode(ASTNode.TYPE_NUMBER, aPos);
            astNode.addChild(new ASTNode.TYPE_DIGITS);

            currPos = aPos + 1;

            if (this.__matchSymbol(currPos, XPathToken.TYPE_PERIOD)) {
                astNode.addChild(new ASTNode.TYPE_PERIOD);

                currPos++;

                if (this.__matchSymbol(currPos, XPathToken.TYPE_DIGITS)) {
                    astNode.addChild(new ASTNode.TYPE_DIGITS);

                    currPos++;
                }
            }

            return new RuleEvalResult(currPos, astNode);
        }

        // alt2: PERIOD DIGITS
        if (this.__matchSymbol(aPos, XPathToken.TYPE_PERIOD)) {
            astNode = new ASTNode(ASTNode.TYPE_NUMBER, aPos);
            astNode.addChild(new ASTNode.TYPE_PERIOD);

            if (this.__matchSymbol(aPos + 1, XPathToken.TYPE_DIGITS)) {
                astNode.addChild(new ASTNode.TYPE_DIGITS);

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
     *            | ncName COLON STAR
     *
     * @param  {Number}         aPos curent position in the input stream
     * @result {RuleEvalResult} result of rule application, or null if rule did not match
     */
    __ruleNameTest: function (aPos) {
        var evalResult = null;
        var astNode    = null;

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: STAR
        if (this.__matchSymbol(aPos, XPathToken.TYPE_STAR)) {
            astNode = new ASTNode(ASTNode.TYPE_NAMETEST, aPos);
            astNode.addChild(new ASTNode.TYPE_STAR);

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // alt2: qName
        if ((evalResult = this.__ruleQName(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_NAMETEST, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
        }

        // alt3: ncName COLON STAR
        if ((evalResult = this.__ruleNCName(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_NAMETEST, aPos);
            astNode.addChild(evalResult.astNode);

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_COLON)) {
                astNode.addChild(new ASTNode.TYPE_COLON);

                if (this.__matchSymbol(evalResult.pos + 1, XPathToken.TYPE_STAR)) {
                    astNode.addChild(new ASTNode.TYPE_STAR);

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: prefix COLON ncName
        if ((evalResult = this.__rulePrefix(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_QNAME, aPos);
            astNode.addChild(evalResult.astNode);

            if (this.__matchSymbol(evalResult.pos, XPathToken.TYPE_COLON)) {
                astNode.addChild(new ASTNode.TYPE_COLON);

                if ((evalResult = this.__ruleNCName(evalResult.pos + 1)) != null) {
                    astNode.addChild(evalResult.astNode);

                    return new RuleEvalResult(evalResult.pos, astNode);
                }
            }
        }

        // alt2: ncName
        if ((evalResult = this.__ruleNCName(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_QNAME, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: ncName
        if ((evalResult = this.__ruleNCName(aPos)) != null) {
            astNode = new ASTNode(ASTNode.TYPE_PREFIX, aPos);
            astNode.addChild(evalResult.astNode);

            return new RuleEvalResult(evalResult.pos, astNode);
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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: IDENT
        if (this.__matchSymbol(aPos, XPathToken.TYPE_IDENT)) {
            astNode = new ASTNode(ASTNode.TYPE_NCNAME, aPos);
            astNode.addChild(new ASTNode.TYPE_NCNAME);

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

        /* DEBUG */ YulupDebug.ASSERT(aPos != null);

        // alt1: IDENT
        if (this.__matchSymbol(aPos, XPathToken.TYPE_NODETYPE)) {
            astNode = new ASTNode(ASTNode.TYPE_NODETYPE, aPos);
            astNode.addChild(new ASTNode.TYPE_NODETYPE);

            return new RuleEvalResult(aPos + 1, astNode);
        }

        // no applicable rule
        return null;
    }
};


function ASTNode(aNodeType, aPos) {
    /* DEBUG */ YulupDebug.ASSERT(aNodeType != null);
    /* DEBUG */ YulupDebug.ASSERT(aPos      != null);

    this.nodeType = aNodeType;
    this.pos      = aPos;
}

ASTNode.prototype = {
    __children: null,

    nodeType: null,
    pos     : null,

    addChild: function (aChild) {
        /* DEBUG */ YulupDebug.ASSERT(aChild != null);
        /* DEBUG */ YulupDebug.ASSERT(aChild ? aChild instanceof ASTNode : true);

        this.__children.push(aChild);
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
    },

    /**
     * Drive the parsing process.
     *
     * Note that the parsing process is kept as simple as possible.
     * It might have been nice to use a goto and action table, and
     * split out the actual processing.
     *
     * @param  {Array}      aResult     the array containing the result nodes
     * @param  {Number}     aState      the current parser state
     * @param  {Number}     aExpCounter the expression nesting level
     * @param  {XPathToken} aSymbol     the current symbol to operate on, or null if end of token stream
     * @return {Array} returns the result array
     * @throws {YulupException}
     */
    __drive: function (aResult, aState, aExpCounter, aSymbol) {
        var resultNode = null;

        /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__drive(\"" + aResult + "\", \"" + aState + "\", \"" + aExpCounter + "\", \"" + aSymbol + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResult     != null);
        /* DEBUG */ YulupDebug.ASSERT(aState      != null);
        /* DEBUG */ YulupDebug.ASSERT(aExpCounter != null);
        /* DEBUG */ YulupDebug.ASSERT(aSymbol ? (aSymbol instanceof XPathToken) : true);

        if (aSymbol)
            /* DEBUG */ dump("Yulup:xpathparser.js:XPathParser.__drive: symbol type = \"" + aSymbol.type + "\", value = \"" + aSymbol.value + "\"\n");

        if (aSymbol != null) {
            switch (aState) {
                case this.__STATE_LOCATIONPATH:
                    switch (aSymbol.type) {
                        case XPathToken.TYPE_SLASH:
                            // step delimiter read
                            resultNode = new XPathResultNode(XPathResultNode.TYPE_STEPDELIM);
                            aResult.push(resultNode);

                            this.__drive(aResult, this.__STATE_LOCATIONPATH, aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        case XPathToken.TYPE_NAME:
                            // beginning of a step read
                            resultNode = new XPathResultNode(XPathResultNode.TYPE_STEP);
                            resultNode.concatValue(aSymbol.value);
                            aResult.push(resultNode);

                            this.__drive(aResult, this.__STATE_STEP, aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        default:
                            throw new YulupException("Yulup:xpathparser.js:XPathParser.__drive: illegal token (type = \"" + aSymbol.type + "\", value = \"" + aSymbol.value + "\") in state LOCATIONPATH.");
                    }

                    break;
                case this.__STATE_STEP:
                    switch (aSymbol.type) {
                        case XPathToken.TYPE_SLASH:
                            // step delimiter read
                            this.__drive(aResult, this.__STATE_LOCATIONPATH, aExpCounter, aSymbol);

                            break;
                        case XPathToken.TYPE_NAME:
                            // step continued
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            this.__drive(aResult, this.__STATE_STEP, aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        case XPathToken.TYPE_LSQUAREBRACKET:
                            // step continued, entering expression
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            this.__drive(aResult, this.__STATE_EXPRESSION, ++aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        default:
                            throw new YulupException("Yulup:xpathparser.js:XPathParser.__drive: illegal token (type = \"" + aSymbol.type + "\", value = \"" + aSymbol.value + "\") in state STEP.");
                    }

                    break;
                case this.__STATE_EXPRESSION:
                    switch (aSymbol.type) {
                        case XPathToken.TYPE_SLASH:
                        case XPathToken.TYPE_NAME:
                            // step continued
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            this.__drive(aResult, this.__STATE_EXPRESSION, aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        case XPathToken.TYPE_LSQUAREBRACKET:
                            // step continued, entering nested expression
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            this.__drive(aResult, this.__STATE_EXPRESSION, ++aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        case XPathToken.TYPE_RSQUAREBRACKET:
                            // step continued, leaving expression
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            if (--aExpCounter == 0) {
                                this.__drive(aResult, this.__STATE_STEP, aExpCounter, this.__xpathLexer.getSymbol());
                            } else {
                                this.__drive(aResult, this.__STATE_EXPRESSION, aExpCounter, this.__xpathLexer.getSymbol());
                            }

                            break;
                        case XPathToken.TYPE_DOUBLEQUOTE:
                            // step continued, entering opaque, double quote delimited, string
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            this.__drive(aResult, this.__STATE_OPAQUEDOUBLESTRING, aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        case XPathToken.TYPE_SINGLEQUOTE:
                            // step continued, entering opaque, single quote delimited, string
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            this.__drive(aResult, this.__STATE_OPAQUESINGLESTRING, aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        default:
                            throw new YulupException("Yulup:xpathparser.js:XPathParser.__drive: illegal token (type = \"" + aSymbol.type + "\", value = \"" + aSymbol.value + "\") in state EXPRESSION.");
                    }

                    break;
                case this.__STATE_OPAQUEDOUBLESTRING:
                    switch (aSymbol.type) {
                        case XPathToken.TYPE_SLASH:
                        case XPathToken.TYPE_LSQUAREBRACKET:
                        case XPathToken.TYPE_RSQUAREBRACKET:
                        case XPathToken.TYPE_SINGLEQUOTE:
                        case XPathToken.TYPE_NAME:
                            // step continued
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            this.__drive(aResult, this.__STATE_OPAQUEDOUBLESTRING, aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        case XPathToken.TYPE_DOUBLEQUOTE:
                            // step continued, leaving opaque, double quote delimited, string
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            this.__drive(aResult, this.__STATE_EXPRESSION, aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        default:
                            throw new YulupException("Yulup:xpathparser.js:XPathParser.__drive: illegal token (type = \"" + aSymbol.type + "\", value = \"" + aSymbol.value + "\") in state OPAQUEDOUBLESTRING.");
                    }

                    break;
                case this.__STATE_OPAQUESINGLESTRING:
                    switch (aSymbol.type) {
                        case XPathToken.TYPE_SLASH:
                        case XPathToken.TYPE_LSQUAREBRACKET:
                        case XPathToken.TYPE_RSQUAREBRACKET:
                        case XPathToken.TYPE_DOUBLEQUOTE:
                        case XPathToken.TYPE_NAME:
                            // step continued
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            this.__drive(aResult, this.__STATE_OPAQUESINGLESTRING, aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        case XPathToken.TYPE_SINGLEQUOTE:
                            // step continued, leaving opaque, single quote delimited, string
                            aResult[aResult.length - 1].concatValue(aSymbol.value);

                            this.__drive(aResult, this.__STATE_EXPRESSION, aExpCounter, this.__xpathLexer.getSymbol());

                            break;
                        default:
                            throw new YulupException("Yulup:xpathparser.js:XPathParser.__drive: illegal token (type = \"" + aSymbol.type + "\", value = \"" + aSymbol.value + "\") in state OPAQUESINGLESTRING.");
                    }

                    break;
                default:
                    throw new YulupException("Yulup:xpathparser.js:XPathParser.__drive: unknown state \"" + aState + "\".");
            }
        }

        return aResult;
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
