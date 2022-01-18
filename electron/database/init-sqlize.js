/*
 * @Author: 李星阳
 * @Date: 2022-01-17 21:07:42
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-18 07:11:04
 * @Description: 
 */


module.exports = {
    trySqlite(){
        sqlize.authenticate().then(()=>{
            toLog('★ Connection has been established successfully.');
        }).catch(err=>{
            toLog('● Unable to connect to the database:', err);
        });
    },
}; 



