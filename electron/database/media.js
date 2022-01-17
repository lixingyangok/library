/*
 * @Author: 李星阳
 * @Date: 2022-01-16 10:33:24
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-17 00:03:00
 * @Description: 
 */

const fs = require('fs').promises;

module.exports = {
    // ▼查询库中媒体
    async getMediaInfo(sHash){
        const {oPromise, fnResolve, fnReject} = newPromise();
        const sql = "SELECT * FROM media where hash = ?";
        db.get(sql, sHash, (err, row) => {
            if (err) return toLog('查询出错');
            fnResolve(row);
        });
        return oPromise;
    },
    async saveMediaInfo(obj){
        const oState = await fs.stat(`${obj.dir}/${obj.name}`);
        obj.size = oState.size;
        const {oPromise, fnResolve, fnReject} = newPromise();
        const sql = `
            INSERT INTO media (hash, name, dir, size)
            VALUES ($hash, $name, $dir, $size)
        `;
        db.run(sql, prefixKey(obj), (err) => {
            fnResolve(err);
        });
        const res = await oPromise;
        return res;
    },
};

function prefixKey(obj){
    return Object.entries(obj).reduce((result, cur)=>{
        const [key, val] = cur;
        result['$' + key] = val;
        return result;
    }, {});
}

// ▼插入数据的方法
// const stmt = db.prepare(`
//     INSERT INTO media (hash, name, dir, size)
//     VALUES ($hash,$name,$dir,$size)
// `);
// stmt.run(prefixKey(obj), err => {
//     fnResolve(err);
// });
// stmt.finalize();