grammar URLSpec

entry URLSpecDocument:
    (paramTypes+=ParamTypeDeclaration)*
    (global=GlobalBlock)?
    (pages+=PageDeclaration)*;

ParamTypeDeclaration:
    'param' name=IDENTIFIER '=' type=Type ';';

GlobalBlock:
    'global' '{' (parameters+=ParameterDeclaration)* '}';

PageDeclaration:
    'page' name=IDENTIFIER '=' path=Path '{' (parameters+=ParameterDeclaration)* '}';

Path:
    segments+=PathSegment+;

PathSegment:
    static=PATH_SEGMENT | '/:' parameter=ParameterName;

ParameterDeclaration:
    name=ParameterName optional='?'? ':' type=Type ';';

ParameterName returns string:
    IDENTIFIER | 'page' | 'param' | 'global' | 'string';

Type:
    UnionType | StringLiteralType | TypeReference | StringKeyword;

StringLiteralType:
    value=STRING;

StringKeyword:
    value='string';

UnionType:
    types+=StringLiteralType ('|' types+=StringLiteralType)+;

TypeReference:
    ref=[ParamTypeDeclaration:IDENTIFIER];

terminal PATH_SEGMENT:
    /\/[a-zA-Z0-9_-]+/;

terminal IDENTIFIER:
    /[a-zA-Z][a-zA-Z0-9_]*/;

terminal STRING:
    /"([^"\\]|\\.)*"/;

hidden terminal WS:
    /\s+/;

hidden terminal SL_COMMENT:
    /\/\/[^\n\r]*/;
