import * as playbillAPI from './playbill';
import * as aboutAPI from './about'

//Объект API, в котором будут все функции для запросов к серверу

export const API = {
    ...playbillAPI, 
    ...aboutAPI,   
};