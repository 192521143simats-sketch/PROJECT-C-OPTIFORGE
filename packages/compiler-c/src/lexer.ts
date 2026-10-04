export type SourcePosition={offset:number;line:number;column:number};
export type SourceSpan={start:SourcePosition;end:SourcePosition};
export type TokenKind=
  |"int"|"void"|"return"|"if"|"else"|"while"
  |"identifier"|"integer"
  |"("|")"|"{"|"}"|","|";"
  |"+"|"-"|"*"|"/"|"%"|"="|"=="|"!="|"<"|"<="|">"|">="|"&&"|"||"|"!"
  |"eof";
export type Token={kind:TokenKind;lexeme:string;span:SourceSpan;value?:number};

export class CLexError extends SyntaxError{
  constructor(message:string,readonly span:SourceSpan){super(`${message} at ${span.start.line}:${span.start.column}`);this.name="CLexError";}
}

const keywords=new Map<string,TokenKind>([["int","int"],["void","void"],["return","return"],["if","if"],["else","else"],["while","while"]]);
const single=new Set(["(",")","{","}",",",";","+","-","*","/","%","=","<",">","!"]);
const double=new Set(["==","!=","<=",">=","&&","||"]);

export function lex(source:string):Token[]{
  const tokens:Token[]=[];let offset=0,line=1,column=1;
  const position=():SourcePosition=>({offset,line,column});
  const advance=()=>{const char=source[offset++]!;if(char==="\n"){line++;column=1;}else column++;return char;};
  const emit=(kind:TokenKind,start:SourcePosition,value?:number)=>{const lexeme=source.slice(start.offset,offset);tokens.push(value===undefined?{kind,lexeme,span:{start,end:position()}}:{kind,lexeme,value,span:{start,end:position()}});};
  while(offset<source.length){
    const char=source[offset]!;
    if(/\s/.test(char)){advance();continue;}
    if(char==="/"&&source[offset+1]==="/"){while(offset<source.length&&advance()!=="\n"){}continue;}
    if(char==="/"&&source[offset+1]==="*"){const start=position();advance();advance();let closed=false;while(offset<source.length){if(source[offset]==="*"&&source[offset+1]==="/"){advance();advance();closed=true;break;}advance();}if(!closed)throw new CLexError("Unterminated block comment",{start,end:position()});continue;}
    const start=position();
    if(/[A-Za-z_]/.test(char)){advance();while(offset<source.length&&/[A-Za-z0-9_]/.test(source[offset]!))advance();const word=source.slice(start.offset,offset);emit(keywords.get(word)??"identifier",start);continue;}
    if(/[0-9]/.test(char)){advance();while(offset<source.length&&/[0-9]/.test(source[offset]!))advance();const text=source.slice(start.offset,offset),value=Number(text);if(!Number.isSafeInteger(value))throw new CLexError("Integer literal is outside the supported safe range",{start,end:position()});emit("integer",start,value);continue;}
    const pair=source.slice(offset,offset+2);if(double.has(pair)){advance();advance();emit(pair as TokenKind,start);continue;}
    if(single.has(char)){advance();emit(char as TokenKind,start);continue;}
    throw new CLexError(`Unexpected character ${JSON.stringify(char)}`,{start,end:{...start,column:start.column+1,offset:start.offset+1}});
  }
  const end=position();tokens.push({kind:"eof",lexeme:"",span:{start:end,end}});return tokens;
}
