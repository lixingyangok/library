/*
 * @Author: 李星阳
 * @Date: 2022-01-07 17:08:49
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-07 17:23:02
 * @Description: 
 */

import { ref } from 'vue';

export function setGlobal(){
    // ▼添加 .v 别名
    const oProtoType = Object.getPrototypeOf(ref());
    Object.defineProperty(oProtoType, 'v', {
        get: Object.getOwnPropertyDescriptor(oProtoType, "value").get,
        set: Object.getOwnPropertyDescriptor(oProtoType, "value").set,
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

