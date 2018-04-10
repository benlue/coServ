/*!
 * blockUtil: block utilities
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */

exports.pathToClazName = function(blkPath)  {
    // deal with windows
    blkPath = blkPath.replace(/\\/gi, '');

    let  clasName = '',
         paths = blkPath.split('/');

    path.forEach( p => clazName += capitalize(p) );
    return  clazName;
}


function  capitalize(s) {
    return s.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};