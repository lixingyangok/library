/*
 * @Author: 李星阳
 * @Date: 2022-01-16 10:33:24
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-16 18:08:38
 * @Description: 
 */

// ▼查询库中媒体
export async function getMediaInfo(sHash){
    console.log('getMediaInfo 开始执行');
    const {oPromise, fnResolve, fnReject} = newPromise();
    db.all("SELECT * FROM media where hash = ?", sHash, function(err, row) {
        if (err) return console.log('查询出错');
        fnResolve(row);
    });
    return oPromise;
}

export async function saveMediaInfo(obj){
    // console.log('keyAdd', prefixKey(obj));
    // const {oPromise, fnResolve, fnReject} = newPromise();
    // const sql = "INSERT INTO media VALUES (hash), values($hash)";
    // // , name, size, duration, dir
    // db.run(sql, prefixKey(obj), (err, a2)=>{
    //     console.log('err', err);
    //     console.log('a2', a2);
    //     fnResolve(rest);
    // });
    var stmt = db.prepare(`
        INSERT INTO media (hash, name, dir)
        VALUES (?,?,?)
    `);
    const res = stmt.run(obj.hash, obj.name, obj.dir);
    stmt.finalize();
    console.log('我插：', res);
    // return oPromise;
}

function prefixKey(obj){
    return Object.entries(obj).reduce((result, cur)=>{
        const [key, val] = cur;
        result['$' + key] = val;
        return result;
    }, {});
}

