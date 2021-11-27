/*
 * @Author: 李星阳
 * @Date: 2021-11-27 20:58:24
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-11-27 21:13:40
 * @Description: 
 */
module.exports = {
    root: true,
    parserOptions: {
        sourceType: 'module',
    },
    parser: 'vue-eslint-parser',
    env: {
        browser: true,
        node: true,
        es6: true,
    },
    rules: {
        "indent": ["warn", 4],
        "semi": ["error", "always"],
        "comma-dangle": [1,"always-multiline"],
    },
};
