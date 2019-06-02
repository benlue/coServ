/*!
 * xpath: looking for decedents based on xpath
 * authors: Ben Lue
 * Copyright(c) 2019 Gocharm Inc.
 */
const  _ = require('lodash');

/**
 * @param {*} selector
 * @param {*} list
 */
exports.find = function(selector, list)  {
    let  sec = selector.split(' '),
         found = list,
         goDeep = true;

    while (sec.length)  {
        if (sec[0] === '>')  {
            let  nlist = [];
            found.forEach(item => {
                if (item.c)
                    nlist = nlist.concat( item.c );
            });

            found = nlist;
            goDeep = false;
        }
        else  {
            list = found;
            found = [];

            findDecendent(sec[0], list, found, goDeep);
            goDeep = true;
        }

        sec = sec.slice(1);
    }

    return  found;
}


/**
 * 
 * @param {*} selector 
 * @param {*} list 
 * @param {*} found an array to store the found elements (HTML tags)
 */
function  findDecendent(selector, list, found, goDeep)  {
    let  lead = selector.charAt(0),
         name = lead == '.' || lead == '#'  ?  selector.slice(1) : null;

    for (let i = 0, len = list.length; i < len; i++)  {
        let  item = list[i];

        if (lead === '#')  {
            if (item.a && item.a.id == name)
                found.push( item );
        }
        else  if (lead === '.')  {
            if (item.a && item.a.class && matchClass(item.a.class, name))
                found.push( item );
        }
        else  if (item.t === selector)
            found.push( item );

        if (goDeep && item.c)
            findDecendent(selector, item.c, found, true);
    }
}


function  matchClass(clazes, claz)  {
    return  _.find( clazes.split(' '), c => c == claz );
}