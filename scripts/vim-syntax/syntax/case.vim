if exists("b:current_syntax")
    finish
endif

syn case ignore

syn match cCommand '^\s*\zs[a-z-A-Z-_][a-zA-Z0-9-_]\+'
syn match cCommand '^\s*\zs-\s*[a-z-A-Z-_][a-zA-Z0-9-_]\+'
syn match cCommand '[^<]\+<<\s*\zs[a-z-A-Z-_][a-zA-Z0-9-_]\+'
syn match cVariable "\$[[:alnum:]_\.]\+" 
syn match cComment "#.*$"
syn match cString  '"[^"]*"'
syn match cString  '\'[^']*\''
syn match cNumber  '[0-9\.]\+'
syn match cExprBoundary  '(('
syn match cExprBoundary  '))'

let b:current_syntax = "case"

hi def link cComment Comment
hi def link cCommand Function
hi def link cVariable Statement
hi def link cExprBoundary Delimiter
hi def link cString  Comment
hi def link cNumber  Comment
