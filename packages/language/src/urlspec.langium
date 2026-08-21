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
    (annotations+=Annotation)*
    'page' name=IDENTIFIER '=' path=Path '{' (parameters+=ParameterDeclaration)* (whenClauses+=WhenClause)* '}';

Annotation:
    key=ANNOTATION_KEY '=' value=AnnotationValue ';';

AnnotationValue:
    AnnotationString | AnnotationBoolean | AnnotationList;

AnnotationString:
    value=STRING;

AnnotationBoolean:
    value=('true' | 'false');

AnnotationList:
    '[' (values+=STRING (',' values+=STRING)* ','?)? ']';

WhenClause:
    'when' discriminant=ParameterName '=' value=STRING '{' (parameters+=ParameterDeclaration)* '}';

Path:
    root=ROOT_PATH | segments+=PathSegment+;

PathSegment:
    static=PATH_SEGMENT | PARAM_PREFIX parameter=ParameterName;

ParameterDeclaration:
    name=ParameterName optional='?'? ':' type=Type ';';

ParameterName returns string:
    IDENTIFIER | 'page' | 'param' | 'global' | 'string' | 'when' | 'true' | 'false';

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

hidden terminal SL_COMMENT:
    /\/\/[^\n\r]*/;

terminal PATH_SEGMENT:
    /\/[a-zA-Z0-9_.\-]+/;

terminal PARAM_PREFIX:
    '/:';

terminal ROOT_PATH:
    '/';

terminal ANNOTATION_KEY:
    /@[a-zA-Z][a-zA-Z0-9_.]*/;

terminal IDENTIFIER:
    /[a-zA-Z][a-zA-Z0-9_.]*/;

terminal STRING:
    /"([^"\\]|\\.)*"/;

hidden terminal WS:
    /\s+/;
