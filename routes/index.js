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
  let items = {};
  for(let item in ctx.session.user.rights){
    let el = ctx.session.user.rights[item];
    let f = await ctx.redis.hgetall("f:" + el);
    if(f){
      if(items[f.p]){
        items[f.p][el] = f.n;
      }else {
        items[f.p] = {};
        items[f.p][el] = f.n;
      }
    }
  }
  ctx.body = items;
});
module.exports = router;
