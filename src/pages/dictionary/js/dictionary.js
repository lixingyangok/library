
// ▼切分句子
export function splitSentence(sWord, sKey){
    sKey = sKey.toLowerCase();
    sWord = sWord.toLowerCase();
    if (sKey == sWord) return 'l-01';
    if (sWord.startsWith(sKey)) return 'l-02';
    if (sWord.includes(sKey)) return 'l-03';
    return '';
}

