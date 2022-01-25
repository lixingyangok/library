
import { reactive } from 'vue';
const moment = require('moment');

export function audioControl() {
    const aDom = [];
    const oData = reactive({
        aMusic: [{
            idx: 1,
            dom: null,
        }, {
            idx: 2,
            dom: null,
        }, {
            idx: 3,
            dom: null,
        }, {
            idx: 4,
            dom: null,
        }],
        timeVal: null,
        alarmTime: [5, 30],
        sNow: '初始值',
        sGap: '',
        bTodayBoomed: false,
    });
    function setDom(el, idx){
        aDom[idx] = el;
    }
    function refreshTime(){
        window.mmt = moment;
        return setInterval(()=>{
            const {'0': hour, '1': minute}  = oData.alarmTime;
            const oNow = moment();
            const oAim = moment().set({hour, minute});
            const iToNextGap = oNow.diff(oAim, 'minute');
            oData.sNow = oNow.format('yyyy-MM-DD, HH:mm:ss');
            console.log('到下次时间', iToNextGap);
            if (iToNextGap < 0){
                toBoom();
            }
        }, 1 * 1000);
    }
    function toBoom(){
        console.log('播音');
    }
    return {
        oData,
        oFn: {
            setDom,
            refreshTime,
        },
    };
};



