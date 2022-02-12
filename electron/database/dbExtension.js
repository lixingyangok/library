/*
 * @Author: 李星阳
 * @Date: 2022-02-08 19:39:29
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-09 01:28:46
 * @Description: 
 */

module.exports.get123 = function(val) {
    return (
        val==1 || val==2
    );
};

module.exports.regexp = function(val) {
    return (
        val==1 || val==2
    );
};

module.exports.REGEXP = function(val) {
    if (val==1 || val==2) return 1;
    else 0;
};


exports.REGEXP = function(val) {
    if (val==1 || val==2) return 1;
    else 0;
};


