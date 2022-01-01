/*
 * @Author: 李星阳
 * @Date: 2021-12-30 20:55:39
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-01 17:32:33
 * @Description: 
 */


export class WaveMaker{
    name = 'hello';
    constructor(...rest){
        console.log('自有属性：', this.name);
        console.log('得到有参数：', rest);
    }
}


