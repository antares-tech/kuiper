
/* description: Parses and executes mathematical expressions. */

/* lexical grammar */
%lex
%%

"#".*                         /* skip comment till the end of the line */
(\n)+                         return 'EOL'
\s+                           /* skip whitespace */
[0-9]+("."[0-9]+)?\b          return 'NUMBER'
[a-zA-Z_]["."=\-a-zA-Z_0-9,]* return 'STRING'
"*"                           return '*'
"/"                           return '/'
"-"                           return '-'
"+"                           return '+'
"^"                           return '^'
"!"                           return '!'
"%"                           return '%'
"("                           return '('
")"                           return ')'
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

%start command-sequence

%% /* language grammar */

command-sequence
    : command-sequence EOF
        {
           $$ = $1;
           yy.log (`command-sequence A1 : ${JSON.stringify ($$, null, 2)}`);
           return $$;
        }
    | command-sequence new-lines EOF
        {
           $$ = $1;
           yy.log (`command-sequence A2 : ${JSON.stringify ($$, null, 2)}`);
           return $$;
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
           var command = $1.toUpperCase();
           var args = $2;
           $$ =  {
                command : command,
                args    : args,
           };
           yy.log (`command-line = ${JSON.stringify ($$)}`);
        }
    | command
        {
           var command = $1.toUpperCase();
           $$ =  {
                command : command
           };
           yy.log (`command-line = ${JSON.stringify ($$)}`);
        }
    ;

command
    : STRING
        {
           yy.log ('command = ' + $1);
           $$ = $1;
        }
    ;

arguments
    : arguments argument
        {
           yy.log (`arg: ${$2.arg} = ${$2.value}`);
           var temp = $1;
           temp [ $2.arg ] = $2.value;
           $$ =  temp;
           yy.log (`pushing $$ = ${JSON.stringify ($$)}`);
        }
    | argument
        {
           yy.log (`arg: ${$1.arg} = ${$1.value}`);
           var temp = {}, arr = [];
           temp [ $1.arg ] = $1.value;
           $$ =  temp;
           yy.log (`pushing $$ = ${JSON.stringify ($$)}`);
        }
    ;

argument
    : STRING STRING
        {$$ = { arg : $1, value : $2 };}
    | STRING NUMBER
        {$$ = { arg : $1, value : $2 };}
    | STRING '-'
        {$$ = { arg : $1, value : true };}
    ;

