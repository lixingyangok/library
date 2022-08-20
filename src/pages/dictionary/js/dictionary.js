
// ▼切分句子
// export function splitSentence(sWord, sKey){
//     sKey = sKey.toLowerCase();
//     sWord = sWord.toLowerCase();
//     if (sKey == sWord) return 'l-01';
//     if (sWord.startsWith(sKey)) return 'l-02';
//     if (sWord.includes(sKey)) return 'l-03';
//     return '';
// }

export function groupThem(arr){
    const aResult = [];
    for (const cur of arr){
        let oLastOne = aResult.at(-1) || {};
        if (oLastOne.dir == cur.dir){
            oLastOne = aResult.at(-1);
        }else{
            oLastOne.aList.push(cur);
            aResult.push({dir: cur.dir, aList: [cur]});
        }
    }
    return aResult;
}

// ▼切割句子
export function splitSentence(text, sKey){
    const reg = new RegExp(`${sKey}`, 'ig');
    const aResult = [];
    let iLastEnd = 0;
    text.replace(reg, (sCurMach, iCurIdx) => {
        // console.log(sCurMach, iCurIdx);
        iCurIdx && aResult.push(text.slice(iLastEnd, iCurIdx));
        // const sClassName = (
        //     oData.oKeyWord[sCurMach.toLowerCase()] ? 'red' : 'blue'
        // );
        aResult.push({ 
            // sClassName,
            word: sCurMach,
        });
        iLastEnd = iCurIdx + sCurMach.length;
    });
    if (!iLastEnd) return [text];
    if (iLastEnd < text.length){
        aResult.push(text.slice(iLastEnd));
    }
    return aResult;
}


