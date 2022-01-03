import {reactive} from 'vue';

export default function(){
    const oData = reactive({
        aa: 'aa',
        bb: 'bb',
    });
    const oFn = {
        aaAdd(){
            oData.aa += '1-';
        },
        bbAdd(){
            oData.bb += '1-';
        },
    };
    return [oData, oFn];
}

// export default {
    
// };

