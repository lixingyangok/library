/*
 * @Author: 李星阳
 * @Date: 2021-11-28 14:52:03
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-11-28 14:54:38
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
