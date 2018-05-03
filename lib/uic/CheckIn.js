/*!
 * CheckIn: offers utilities to verify input data
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2018 Gocharm Inc.
 */
const  moment = require('moment');

exports.isString = function(s)  {
    return  typeof s === 'string';
}


exports.isInteger = function(i)  {
    return  Number.isInteger(i);
}


exports.isNumber = function(n)  {
    return  !Number.isNaN(n);
}


/**
 * This is the 'check date' function exposed to UIC
 * @param {*} format 
 */
exports.isDate = function(format, d)  {
    if (d)
        return  isDateTime(d);
    else
        return  exports.mix.bind({
            format: format,
            name: 'isDate'
        });
}


exports.isArray = function(func, a)  {
    if (a)
        return  isArrayItem(a);
    else
        return  exports.mix.bind({
            func: func,
            name: 'isArray'
        });
}


 exports.mix = function(v)  {
     if (this.name == 'isDate')
        return  isDateTime(v, this.format);
    else  if (this.name = 'isArray')
        return  isArrayItem( v, this.func );

    return  false;
 }


 /**
  * This is the 'check date' function invoked internally
  * @param {*} d 
  */
 function  isDateTime(d, format)  {
    if (d instanceof Date)
        return  true;

    let  isOk = false;

    if (typeof d === 'string')  {
        try  {
            let  dd = this.format  ?  moment(d, this.format) : moment(d);
            isOk = dd && dd.isValid();
        }
        catch (e)  {}
    }

    return  isOk;
 }


 function  isArrayItem(a, func)  {
     if (Array.isArray(a))  {
        let  isOk = true;

        if (func)
            for (let i = 0, len = a.length; i < len; i++)  {
                if (!func(a[i]))  {
                    isOk = false;
                    break;
                }
            }

        return  isOk;
     }

     return  false;
 }