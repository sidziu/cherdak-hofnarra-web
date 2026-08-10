import * as playbillAPI from './playbill';
import * as aboutAPI from './about'
import * as archiveAPI from './archive'

//Объект API, в котором будут все функции для запросов к серверу

export const API = {
    ...playbillAPI, 
    ...aboutAPI,
    ...archiveAPI,
};