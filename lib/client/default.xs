exports.view = function(model, ctx)  {
    let  css = {
            'body': {
                'background-color': '#111',
                'overflow': 'hidden'
            },
            '#pgBody': {
                'margin': '0px 5px',
                'min-height': '600px'
            }
         };

    let  head = xs.html('head')
                  .add('title', ctx.title)
                  //.add('meta', {'http-equiv': "Content-Type", 'content': "text/html; charset=UTF-8"});
                  .add('meta', 'http-equiv="X-UA-Compatible" content="IE=edge"')
                  .add('meta', 'http-equiv="Content-Type" content="text/html; charset=UTF-8"');
    if (ctx.description)
        head.add('meta', {name: 'description', content: ctx.description});

    // add include files
    if (model.include)
        model.include.forEach( inc => head.add( inc ) );

    let  body = xs.html('body')
                  .add('div', {id: 'pgHead'}, header.create('header'))
                  .add('div', {id: 'pgBody'}, model.body )
                  .add('div', {id: 'pgFooter'}, footer.create('footer'));

    let  root = xs.uic('html', null, null, css)
                  .add( head )
                  .add( body );

    return  root;
}