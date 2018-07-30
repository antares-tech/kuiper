
/* description: Parses and executes mathematical expressions. */

/* lexical grammar */
%lex
%%

"#".*                         /* skip comment till the end of the line */
\n                    { yy.log ('    ====> EOL'); return 'EOL'; }
\s+                           /* skip whitespace */
"print"                       return 'COMM_PRINT'
"sleep"                       return 'COMM_SLEEP'
"assert"                      return 'COMM_ASSERT'
[0-9]+("."[0-9]+)?\b          return 'NUMBER'
\$[a-zA-Z_][a-zA-Z0-9_]*      return 'VARIABLE'
[a-zA-Z_][\-a-zA-Z0-9_]*      return 'IDENTIFIER'
\"[^"]*\"                     return 'STRING_LITERAL'
[a-zA-Z_]["."=\-a-zA-Z_0-9,]* return 'STRING'
"((".*"))"                    return 'JAVASCRIPT_EXPR'
"<<"                          return 'ASSIGN'
"*"                           return '*'
"/"                           return '/'
"-"                           return '-'
"+"                           return '+'
"^"                           return '^'
"!"                           return '!'
"%"                           return '%'
"("                           return '('
")"                           return ')'
"."                           return '.'
"~"                           return '~'
"PI"                          return 'PI'
"E"                           return 'E'
<<EOF>>                       return 'EOF'
.                             return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%right '!'
%right '%'
%left UMINUS

%start statement

%% /* language grammar */

translation-unit
    : translation-unit statement
        {
           $$ = $1;
           yy.log (`translation-unit A done`);
           return $$;
        }
    | translation-unit EOF
        {
           $$ = $1;
           yy.log (`translation-unit B done`);
           return $$;
        }
    | statement
        {
           $$ = $1;
           yy.log (`translation-unit D done`);
           return $$;
        }
    ;

statement
    : assignment-statement
        {
           $$ = $1;
           yy.log (`statement A : ${JSON.stringify ($$)}`);
           return $$;
        }
    | statement EOL
        {
           $$ = $1;
           yy.log (`statement B : ${JSON.stringify ($$)}`);
           return $$;
        }
    ;

assignment-statement
    : VARIABLE ASSIGN expression
        {
           $$ = { variable : $1, expr : $3 };
           yy.log (`assignment-statement A : ${JSON.stringify ($$)}`);
        }
    | VARIABLE ASSIGN command-line
        {
           $$ = { variable : $1, command : $3 };
           yy.log (`assignment-statement B : ${JSON.stringify ($$)}`);
        }
    | assignment-statement sub-commands-block
        {
           if (!$1.sub_command_block)
              $1.sub_command_block = [];

           $1.sub_command_block.push ($2);
           $$ = $1;
           yy.log (`assignment-statement C : ${JSON.stringify ($$)}`);
        }
    | command-line
        {
           $$ = { variable : "$response", command : $1 };
           yy.log (`assignment-statement D : ${JSON.stringify ($$)}`);
        }
    ;

expression
    : STRING_LITERAL
        /* { $$ = { type : 'string', value : $1 }; } */
         { $$ = { type : 'string', value : $1.replace (/"/g, '') }; }
    | NUMBER
        { $$ = { type : 'number', value : $1 }; }
    | object-expression
        { $$ = { type : 'js', value : $1 }; }
    | JAVASCRIPT_EXPR
        { $$ = { type : 'js', value : $1.replace (/\(\(/g, "").replace (/\)\)/g, "") }; }
    ;

object-expression
    : VARIABLE
        { $$ = $1 }
    | object-expression '.' IDENTIFIER
        { $$ = $1 + '.' + $3 }
    ;

command-sequence
    : command-sequence EOF
        {
           $$ = $1;
           yy.log (`command-sequence A1 : ${JSON.stringify ($$, null, 2)}`);
        }
    | command-sequence new-lines EOF
        {
           $$ = $1;
           yy.log (`command-sequence A2 : ${JSON.stringify ($$, null, 2)}`);
        }
    | command-sequence new-lines command-line
        {
           $1.push ($3);
           $$ = $1;
           yy.log (`command-sequence B : ${JSON.stringify ($$, null, 2)}`);
        }
    | command-line
        {
           $$ = [ $1 ];
           yy.log (`command-sequence C : ${JSON.stringify ($$, null, 2)}`);
        }
    ;

new-lines
    : EOL
    | EOL new-lines
    ;
command-line
    : command arguments
        {
           $$ =  {
                command : $1,
                args    : $2,
           };
           yy.log (`command-line A = ${JSON.stringify ($$)}`);
        }
    | command
        {
           $$ =  {
                command : $1
           };
           yy.log (`command-line B = ${JSON.stringify ($$)}`);
        }
    | COMM_PRINT expression
        {
           $$ =  {
                command : 'PRINT',
                args    : [{
                  arg   : 'expr',
                  expr  : $2
                }]
           };
           yy.log (`command-line PRINT = ${JSON.stringify ($$)}`);
        }
    | COMM_ASSERT expression
        {
           $$ =  {
                command : 'ASSERT',
                args    : [{
                  arg   : 'expr',
                  expr  : $2
                }]
           };
           yy.log (`command-line ASSERT = ${JSON.stringify ($$)}`);
        }
    | COMM_SLEEP expression
        {
           $$ =  {
                command : 'SLEEP',
                args    : [{
                  arg   : 'timeout',
                  expr  : $2
                }]
           };
           yy.log (`command-line SLEEP = ${JSON.stringify ($$)}`);
        }
    ;

sub-commands-block
    : '-' assignment-statement
        {
           $$ = $2;
           yy.log (`sub-commands-block A = ${JSON.stringify ($2)}`);
        }
    ;

command
    : IDENTIFIER
        {
           yy.log ('command = ' + $1);
           $$ = $1.toUpperCase ();
        }
    ;

arguments
    : arguments argument
        {
           $$ = $1;
           $$.push ($2);
           yy.log (`arguments A = ${JSON.stringify ($$)}`);
        }
    | argument
        {
           $$ =  [ $1 ];
           yy.log (`arguments B = ${JSON.stringify ($$)}`);
        }
    ;

argument
    : IDENTIFIER expression
        {$$ = { arg : $1, expr : $2 }; }
    | IDENTIFIER
        {$$ = { arg : $1, expr : { type : 'boolean', value : true } };}
    ;

