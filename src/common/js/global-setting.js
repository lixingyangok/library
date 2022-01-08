/*
 * @Author: 李星阳
 * @Date: 2022-01-07 17:08:49
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-08 08:22:03
 * @Description: 
 */

import { ref, computed } from 'vue';

export function setGlobal(){
    // const {oPromise, fnResolve, fnReject} = newPromise();
    window.newPromise = function(){
        let fnResolve, fnReject;
        const oPromise = new Promise((f1, f2) => {
            fnResolve = f1, fnReject = f2;
        });
        return {oPromise, fnResolve, fnReject};
    };
    // ▼添加 .v 别名
    [
        Object.getPrototypeOf(ref()),
        Object.getPrototypeOf(computed(() => [])),
    ].forEach(cur=>{
        Object.defineProperty(cur, 'v', {
            get: Object.getOwnPropertyDescriptor(cur, "value").get,
            set: Object.getOwnPropertyDescriptor(cur, "value").set,
        });
    });

    // ▼自定义方法
    Object.defineProperties(Object.prototype, {
        '$dc': { // deep copy = 深拷贝
            value: function () {
                let val = null;
                try {
                    val = toClone(this);
                } catch (err) {
                    val = JSON.parse(JSON.stringify(this));
                }
                return val;
            },
        },
        '$cpFrom': { // copy from = 将本对象的值修改为目标对象的值
            value: function (source) {
                for (let key of Object.keys(this)) {
                    if (key in source) this[key] = source[key];
                }
                return this;
            },
        },
    });
}



function toClone(source) {
    if (!(source instanceof Object && typeof source == 'object' && source)) return source; //不处理非数组、非对象
    const newObj = new source.constructor;
    const iterator = source instanceof Array ? source.entries() : Object.entries(source);
    for (const [key, val] of iterator) {
        newObj[key] = val instanceof Object ? toClone(val) : val;
    }
    return newObj;
}

