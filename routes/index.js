const router = require('koa-router')()
router.prefix('/');
const getUserIp = (req) => {
  return req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
};
router.get('/', async (ctx, next) => {
  // let ip = getUserIp(ctx.req);
  await ctx.render('index', {
    title: '账务邦服务系统',theme:ctx.session.user.theme,
    userName:ctx.session.user.name,userImage:ctx.session.user.image
  });
});
router.get('/index/rightItems',  async function (ctx, next) {
  // let query = ctx.request.query;
  let  where;
  let projection={_id:0};
  where={};
  let rights = await ctx.mongodb.db.collection('functions').find(where).project(projection).toArray();
  for(let i=rights.length-1;i>=0;i--){
    for(let key in rights[i].items){
      if(!ctx.session.user.rights.includes(key)){
        delete rights[i].items[key];
      }
    }
    if(Object.keys(rights[i].items).length == 0){
      rights.splice(i, 1);
    }
  }
  ctx.body = rights;
});
module.exports = router;
