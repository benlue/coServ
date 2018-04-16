/*!
 * blockUtil: block utilities
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 ~ 2018 Gocharm Inc.
 */

exports.pathToClazName = function(blkPath)  {
    // deal with windows
    blkPath = blkPath.replace(/\\/gi, '');

    let  clazName = '',
         paths = blkPath.split('/');

    paths.forEach( p => clazName += capitalize(p) );
    //console.log('path vs class-name: %s, %s', blkPath, clazName);
    return  clazName;
}


function  capitalize(s) {
    return s.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};