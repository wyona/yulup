class ExprParser extends Parser;

locationPath
    : relativeLocationPath
    | absoluteLocationPath
    ;

absoluteLocationPath
    : SLASH (relativeLocationPath)?
    | DOUBLESLASH relativeLocationPath
    ;

relativeLocationPath
    : step (relativeLocationPath2)?
    ;

relativeLocationPath2
    : SLASH step relativeLocationPath2
    | DOUBLECOLON step relativeLocationPath2
    ;

step
    : axisSpecifier nodeTest (predicate)*
    | abbreviatedStep
    ;

abbreviatedStep
    : PERIOD
    | DOUBLEPERIOD
    ;

axisSpecifier
    : axisName DOUBLECOLON
    | abbreviatedAxisSpecifier
    ;

abbreviatedAxisSpecifier
    : (AT)?
    ;

axisName
    : "ancestor" | "ancestor-or-self" | "attribute" | "child" | "descendant" | "descendant-or-self" | "following" | "following-sibling" | "namespace" | "parent" | "preceding" | "preceding-sibling" | "self"
    ;

nodeTest
    : nameTest
    | "processing-instruction" LPAREN literal RPAREN
    | nodeType LPAREN RPAREN
    ;

predicate
    : LBRACKET expr RBRACKET
    ;

expr
    : orExpr
    ;

primaryExpr
    : variableReference
    | LPAREN expr RPAREN
    | literal
    | number
    | functionCall
    ;

functionCall
    : functionName LPAREN (argument (COMMA argument)*)? RPAREN
    ;

argument
    : expr
    ;

unionExpr
    : pathExpr (unionExpr2)?
    ;

unionExpr2
    : BAR pathExpr unionExpr2
    ;

pathExpr
    : locationPath
    | filterExpr
    | filterExpr SLASH relativeLocationPath
    | filterExpr DOUBLESLASH relativeLocationPath
    ;

filterExpr
    : primaryExpr (filterExpr2)?
    ;

filterExpr2
    : predicate filterExpr2
    ;

orExpr
    : andExpr (orExpr2)?
    ;

orExpr2
    : OR andExpr orExpr2
    ;

andExpr
    : equalityExpr (andExpr2)?
    ;

andExpr2
    : AND equalityExpr andExpr2
    ;

equalityExpr
    : relationalExpr (equalityExpr2)?
    ;

equalityExpr2
    : EQUAL relationalExpr equalityExpr2
    | NOTEQUAL relationalExpr equalityExpr2
    ;

relationalExpr
    : additiveExpr (relationalExpr2)?
    ;

relationalExpr2
    : LESSTHAN additiveExpr relationalExpr2
    | GREATERTHAN additiveExpr relationalExpr2
    | LESSOREQUAL additiveExpr relationalExpr2
    | GREATEROREQUAL additiveExpr relationalExpr2
    ;

additiveExpr
    : multiplicativeExpr (additiveExpr2)?
    ;

additiveExpr2
    : PLUS multiplicativeExpr additiveExpr2
    | MINUS multiplicativeExpr additiveExpr2
    ;

multiplicativeExpr
    : unaryExpr (multiplicativeExpr2)?
    ;

multiplicativeExpr2
    : STAR unaryExpr multiplicativeExpr2
    | DIV unaryExpr multiplicativeExpr2
    | MOD unaryExpr multiplicativeExpr2
    ;

unaryExpr
    : unionExpr
    | MINUS unaryExpr
    ;

literal
    : DOUBLEQUOTE (DOUBLEQUOTELITERAL)* DOUBLEQUOTE
    | SINGLEQUOTE (SINGLEQUOTELITERAL)* SINGLEQUOTE
    ;

number
    : DIGITS (PERIOD (DIGITS)?)?
    | PERIOD DIGITS
    ;

functionName
    : qName
    ;

variableReference
    : DOLLAR qName
    ;

nameTest
    : STAR
    | ncName COLON STAR
    | qName
    ;

qName
    : prefixedName
    | unprefixedName
    ;

prefixedName
    : prefix COLON localPart
    ;

unprefixedName
    : localPart
    ;

prefix
    : ncName
    ;

localPart
    : ncName
    ;

ncName
    : ncNameStartChar (ncNameChar)*
    ;

ncNameChar
    : nameChar
    ;

ncNameStartChar
    : LETTER
    | UNDERSCORE
    ;

nameChar
    : LETTER | DIGIT | PERIOD | HYPHEN | UNDERSCORE
    ;

nodeType
    : "comment" | "test" | "node"
    ;


class ExprLexer extends Lexer;

options {
    k = 3;
}

LPAREN
    : '(' ;
RPAREN
    : ')' ;
LBRACKET
    : '[' ;
RBRACKET
    : ']' ;
PLUS
    : '+' ;
MINUS
    : '-' ;
STAR
    : '*' ;
BAR
    : '|' ;
SLASH
    : '/' ;
DOUBLESLASH
    : "//" ;
COLON
    : ':' ;
DOUBLECOLON
    : "::" ;
PERIOD
    : '.' ;
DOUBLEPERIOD
    : ".." ;
COMMA
    : ',' ;
AT
    : '@' ;
DOLLAR
    : '$' ;
DOUBLEQUOTE
    : '"' ;
SINGLEQUOTE
    : '\'' ;
AND
    : "and" ;
OR
    : "or" ;
EQUAL
    : '=' ;
NOTEQUAL
    : "!=" ;
LESSTHAN
    : '<' ;
GREATERTHAN
    : '>' ;
LESSOREQUAL
    : "<=" ;
GREATEROREQUAL
    : ">=" ;
DIV
    : "div" ;
MOD
    : "mod" ;

EXPRWS
    : ( '\u0020'
        | '\u0009'
        | '\u000d'
        | '\u000a'
      )
        {$setType(Token.SKIP);} ;

DOUBLEQUOTELITERAL
    : ~'"' ;
SINGLEQUOTELITERAL
    : ~'\'' ;
