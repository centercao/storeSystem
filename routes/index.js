const router = require('koa-router')()
router.prefix('/');
const getUserIp = (req) => {
  return req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
};
router.get('/', async (ctx, next) => {
  let ip = getUserIp(ctx.req);
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  });
});


module.exports = router
