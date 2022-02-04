console.log('\n\n\n\n\n');
const aResult = [];

let iLastEnd = 0;
let s1 = `Hi my name's Tom, I live in Beijing, what about you?`;
let reg = /\b(tom|beijing|you|name)\b/gi;

s1.replace(reg, function(a1, sCurMach, iCurIdx){
    iCurIdx && aResult.push(s1.slice(iLastEnd, iCurIdx));
    aResult.push(sCurMach);
    iLastEnd = iCurIdx + sCurMach.length;
    // console.log(iCurIdx, sCurMach);
});

console.log(aResult);


