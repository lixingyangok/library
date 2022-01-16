/*
 * @Author: 李星阳
 * @Date: 2022-01-16 20:03:49
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-16 20:35:07
 * @Description: 
 */

module.exports.addDevRecord = function(){
    // ▼插入一条开发记录
    db.run("INSERT INTO dev_history VALUES ($time)", {
        $time: new Date().toLocaleString(),
    });
    db.get("SELECT count(*) FROM dev_history", function(err, row) {
        if (err) return;
        toLog('开发记录数量：', row['count(*)']);
    });
};




