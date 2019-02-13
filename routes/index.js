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


module.exports = router
