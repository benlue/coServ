/*!
 * CheckIn: offers utilities to verify input data
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2018 ~ 2019 Gocharm Inc.
 */
const  _ = require('lodash'),
       moment = require('moment');

/**
 * Verify the input value based on the data format.
 * We'll simply ignore invalid format spec.
 */
exports.verifyInput = function(formatSpec, key, value)  {
    let  ps = _.remove(formatSpec.split(/\(|\)|\[|\]|\{|\}/), s => s != ''),
         dataType = ps[0],
         sizeSpec,
         rangeSpec,
         enumSpec,      // range & enum are exclusive to each other
         psLen = ps.length,
         angleBkt = formatSpec.indexOf('['),
         brace = formatSpec.indexOf('{');

    //console.log( JSON.stringify(ps, null, 4) );
    if (psLen == 2)  {
        // make sure it's the size or range spec
        if (angleBkt > 0 && angleBkt < formatSpec.indexOf(']'))
        // if (ps[1].indexOf('.') >= 0  || ps[1].indexOf('<') >= 0)
            rangeSpec = ps[1];
        else  if (brace > 0 && brace < formatSpec.indexOf('}'))
            enumSpec = ps[1];
        else
            sizeSpec = ps[1];
    }
    else  if (psLen == 3)  {
        sizeSpec = ps[1];

        if (angleBkt > 0 && angleBkt < formatSpec.indexOf(']'))
            rangeSpec = ps[2];
        else
            enumSpec = ps[2];
    }
    else  if (psLen > 3)
        return  {err: 'The data spec of the "' + key + '" parameter is not valid.'}

    let  result = {value: value};

    switch (dataType)  {
        case 'bool':
            if (typeof value == 'string')
                result.value = value && value != '0' && value != 'false' && value != 'f' && value != 'F';
            else
                result.value = value  ?  true : false;
            break;

        case 'string':
            if (typeof value === 'string')  {
                if (sizeSpec && !isNaN(sizeSpec))  {
                    if (value.length > parseInt(sizeSpec))
                        result.err = 'The parameter "' + key + '" has more than ' + sizeSpec + ' characters.';
                }
                
                if (!result.err && rangeSpec)  {
                    let  rsDot = rangeSpec.split('.');

                    if (rsDot.length == 1)  {
                        let  rsLess = rangeSpec.split('<');
                        if (rsLess.length === 3)  {
                            let  startS = rsLess[0];
                                 endS = rsLess[2];

                            if (value <= startS || (endS != '' && value >= endS))
                                result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                        }
                    }
                    else  if (rsDot.length == 2)  {
                        let  startS = rsDot[0];
                             endS = rsDot[1];

                        if ((startS.slice(-1) == '<'  ?  value <= startS.slice(0, -1) : value < startS) ||
                            (endS && endS != '<' && (endS.slice(0, 1) == '<'  ?  value >= endS.slice(1) : value > endS)))
                            result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                    }
                    else  {
                        let  startS = rsDot[0];
                             endS = rsDot[2];

                        // the right-hand side can be open
                        if (value < startS || (endS != '' && value > endS))
                            result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                    }
                }

                if (!result.err && enumSpec)  {
                    let  enumList = enumSpec.split(','),
                         isPassed = _.some(enumList, item => {
                                        return  item.trim() == value;
                                    });

                    if (!isPassed)
                        result.err = 'The parameter "' + key + '" does not contain a valid value.';
                }
            }
            else
                result.err = 'The parameter "' + key + '" is not a string.';
            break;

        case 'integer':
            let  i = parseInt(value);
            if (isNaN(i))
                result.err = 'The parameter "' + key + '" is not an integer.';
            else  {
                result.value = i;

                if (sizeSpec && !isNaN(sizeSpec) && (value + '').length > parseInt(sizeSpec))
                    result.err = 'The parameter "' + key + '" is more than ' + sizeSpec + ' digits.';

                if (!result.err && rangeSpec)  {
                    let  rsDot = rangeSpec.split('.');

                    if (rsDot.length == 1)  {
                        let  rsLess = rangeSpec.split('<');
                        if (rsLess.length === 3)  {
                            let  startS = rsLess[0]  ?  parseInt(rsLess[0]) : Number.MIN_SAFE_INTEGER,
                                 endS = rsLess[2]  ?  parseInt(rsLess[2]) : Number.MAX_SAFE_INTEGER;

                            if (i <= startS || i >= endS)
                                result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                        }
                    }
                    else  if (rsDot.length == 2)  {
                        let  startI = Number.MIN_SAFE_INTEGER,
                             endI = Number.MAX_SAFE_INTEGER,
                             isSmaller = false,
                             isGreater = false;
                             
                        if (rsDot[0])  {
                            if (rsDot[0].slice(-1) === '<')  {
                                startI = parseInt(rsDot[0].slice(0, -1));
                                isSmaller = true;
                            }
                            else
                                startI = parseInt(rsDot[0]);
                        }

                        if (rsDot[1])  {
                            if (rsDot[1].slice(0, 1) === '<')  {
                                endI = parseInt(rsDot[1].slice(1));
                                isGreater = true;
                            }
                            else
                                endI = parseInt(rsDot[1]);
                        }

                        if ((isSmaller  ?  i <= startI : i < startI) ||
                            (isGreater  ?  i >= endI : i > endI))
                            result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                    }
                    else  {
                        let  startS = rsDot[0]  ?  parseInt(rsDot[0]) : Number.MIN_SAFE_INTEGER,
                             endS = rsDot[2]  ?  parseInt(rsDot[2]) : Number.MAX_SAFE_INTEGER;

                        if (i < startS || i > endS)
                            result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                    }
                }

                if (!result.err && enumSpec)  {
                    let  enumList = enumSpec.split(','),
                         isPassed = _.some(enumList, item => {
                                        return  parseInt(item.trim()) == i;
                                    });

                    if (!isPassed)
                        result.err = 'The parameter "' + key + '" does not contain a valid value.';
                }
            }
            break;

        case 'float':
            let  v = parseFloat(value);
            if (isNaN(v))
                result.err = 'The parameter "' + key + '" is not a number.';
            else  {
                result.value = v;

                if (sizeSpec)  {
                    let  ss = sizeSpec.split(','),
                         iLen = ss[0];

                    if (!isNaN(iLen))  {
                        if (ss.length == 2 && !isNaN(ss[1]))
                            iLen = parseInt(iLen) - parseInt(ss[1]);
                        else
                            iLen = parseInt(iLen);

                        let  vs = (value + '').split('.'),
                             ipart = vs[0];

                        if (ipart.length > iLen)
                            result.err = 'The parameter "' + key + '" has more digits than rquired (' + sizeSpec + ').';
                        else  if (vs.length == 2 && ss.length == 2)  {
                            let  power = 10 ** parseInt(ss[1]);
                            v = result.value = parseFloat(Math.round(v * power)) / power;
                        }
                    }
                    else
                        result.err = 'The size constraints of the "' + key + '" parameter is not valid.';
                }

                if (!result.err && rangeSpec)  {
                    let  idx = rangeSpec.indexOf('..');
                    if (idx >= 0)  {
                        let  startV = idx == 0  ?  Number.MIN_VALUE : parseFloat(rangeSpec.slice(0, idx)),
                             endV = rangeSpec.slice(idx+2);
                        endV = endV  ?  parseFloat(endV) : Number.MAX_VALUE;

                        if (startV > v || v > endV)
                            result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                    }
                    else  {
                        idx = rangeSpec.indexOf('.<');
                        if (idx >= 0)  {
                            let  startV = idx == 0  ?  Number.MIN_VALUE : parseFloat(rangeSpec.slice(0, idx)),
                                 endV = rangeSpec.slice(idx+2);
                            endV = endV  ?  parseFloat(endV) : Number.MAX_VALUE;

                            if (startV > v || v >= endV)
                                result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                        }
                        else  {
                            idx = rangeSpec.indexOf('<.');
                            if (idx >= 0)  {
                                let  startV = idx == 0  ?  Number.MIN_VALUE : parseFloat(rangeSpec.slice(0, idx)),
                                     endV = rangeSpec.slice(idx+2);
                                endV = endV  ?  parseFloat(endV) : Number.MAX_VALUE;

                                if (startV >= v || v > endV)
                                    result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                            }
                            else  {
                                idx = rangeSpec.indexOf('<<');
                                if (idx >= 0)  {
                                    let  startV = idx == 0  ?  Number.MIN_VALUE : parseFloat(rangeSpec.slice(0, idx)),
                                         endV = rangeSpec.slice(idx+2);
                                    endV = endV  ?  parseFloat(endV) : Number.MAX_VALUE;

                                    if (startV >= v || v >= endV)
                                        result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                                }
                            }
                        }
                    }
                }

                if (!result.err && enumSpec)  {
                    let  enumList = enumSpec.split(','),
                         isPassed = _.some(enumList, item => {
                                        return  parseFloat(item.trim()) == v;
                                    });

                    if (!isPassed)
                        result.err = 'The parameter "' + key + '" does not contain a valid value.';
                }
            }
            break;

        case 'date':
            let  d;
            try  {
                if (sizeSpec)
                    d = moment(value, sizeSpec);
                else
                    d = moment(value);
            }
            catch (e)  {}

            if (d && d.isValid())  {
                result.value = sizeSpec  ?  d.format(sizeSpec) : value;

                if (rangeSpec)  {
                    let  rsDot = rangeSpec.split('.');

                    if (rsDot.length == 1)  {
                        let  rsLess = rangeSpec.split('<');
                        if (rsLess.length === 3)  {
                            let  startS = moment(rsLess[0]);
                                 endS = moment(rsLess[2]);

                            if (d.isSameOrBefore(startS) || d.isSameOrAfter(endS))
                                result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                        }
                    }
                    else  if (rsDot.length == 2)  {
                        let  startS = rsDot[0];
                             endS = rsDot[1];

                        if ((startS.slice(-1) == '<'  ?  d.isSameOrBefore(moment(startS.slice(0, -1))) : d.isBefore(moment(startS))) ||
                            (endS.slice(0, 1) == '<'  ?  d.isSameOrAfter(moment(endS.slice(1))) : d.isAfter(moment(endS))))
                            result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                    }
                    else  {
                        let  startS = moment(rsDot[0]);
                             endS = moment(rsDot[2]);

                        if (d.isBefore(startS) || d.isAfter(endS))
                            result.err = 'The parameter "' + key + '" is not within the range [' + rangeSpec + '].';
                    }
                }
            }
            else
                result.err = 'The parameter "' + key + '" is not a valid date (or date-time).';
            break;

        default:
            result.err = 'Unknown data type: ' + dataType;
            break;
    }
    return  result;
}

exports.verifyObjectInput = function(rules, key, inObj)  {
    let  err;

    Object.getOwnPropertyNames(rules).some( p => {
        let  rule = rules[p],
             errMsg = rule['@error'] || rule['@errCode'],   // default error message when error occured
             parName = key  ?  (key + '.' + p) : p;

        if (typeof rule === 'string')
            rule = {'@type': rule};

        // console.log('checking parameter: ' + p);
        
        if  (inObj[p] != undefined)  {
        //if  (inObj.hasOwnProperty(p))  {
            //console.log('rule:\n' + JSON.stringify(rule, null, 4) );
            let  value = inObj[p],
                 dataFormat = rule['@type'],
                 dataVerifier = rule['@verifier'];

            if (dataFormat)  {
                let  typeoOfFormat = typeof dataFormat;
                // console.log('data format:\n' + JSON.stringify(dataFormat, null, 4));

                if (typeoOfFormat === 'string')   {
                    let  result = exports.verifyInput(dataFormat, parName, value);

                    if (result.err)
                        err = errMsg || result.err;
                    else
                        // the result value maybe justified based on the rule
                        inObj[p] = result.value;
                }
                else  if (Array.isArray(dataFormat) && dataFormat.length)  {
                    // the input parameter is expected to be an array
                    if (!Array.isArray(value))
                        err = errMsg || 'The parameter value "' + parName + '" should be an array.';
                    else  {
                        let  rule = dataFormat[0];
                        if (typeof rule === 'string')  {
                            // the array value should be of primitive types
                            value.some( (item, idx) => {
                                let  itemName = parName + '[' + idx + ']',
                                     result = exports.verifyInput(rule, itemName, item);

                                if (result.err)
                                    err = errMsg || result.err;
                                else
                                    // the result value maybe justified based on the rule
                                    value[idx] = result.value;
                                return  err;
                            });
                        }
                        else
                            value.some( (item, idx) => {
                                //console.log('array item:\n' + JSON.stringify(item, null, 4));
                                let  itemName = parName + '[' + idx + ']';
                                err = exports.verifyObjectInput(rule, itemName, item);
                                return  err;
                            });
                    }
                }
                else  if (typeoOfFormat === 'object')   {
                    // the input parameter is expected to be an object
                    if (typeof value != 'object')
                        err = errMsg || 'The parameter value "' + parName + '" should be an object.';
                    else
                        err = exports.verifyObjectInput(dataFormat, parName, value);
                }
            }

            if (dataVerifier)  {
                if (!Array.isArray(dataVerifier) && (typeof dataVerifier === 'function'))
                    dataVerifier = [dataVerifier];

                for (let i = 0, len = dataVerifier.length; i < len; i++)  {
                    let  dvFun = dataVerifier[i];
                    if (typeof dvFun === 'function' && !dvFun(p, inObj))  {
                        err = errMsg || 'The parameter "' + parName + '" does not pass the "' + dataVerifier[i].name + '" verifier.';
                        break;
                    }
                }
            }
        }
        else  if (rule['@required'])
            err = errMsg || 'The paremeter "' + parName + '" is required.';
        else  if (rule['@default'])  {
            if (typeof rule['@default'] == 'function')
                inObj[p] = rule['@default'](inObj[p]);
            else
                inObj[p] = rule['@default'];
        }
    });

    return  err;
}

exports.isString = function(s)  {
    return  typeof s === 'string';
}


exports.isInteger = function(i)  {
    return  Number.isInteger(i) || Number.isInteger(parseInt(i));
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


exports.isObject = function(obj)  {
    return  obj && (typeof obj === 'object') && value.constructor === Object;
}


 exports.mix = function(v)  {
     if (this.name == 'isDate')
        return  isDateTime(v, this.format);
    else  if (this.name = 'isArray')
        return  isArrayItem( v, this.func );
    //else  if (this.name = 'isObject')
    //    return  isArrayItem( v, this.func );

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