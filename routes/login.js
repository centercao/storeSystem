/**
 * Created by center ON 17-11-27
 */
/*********************属性**********************
 * account
 * name
 * password
 * img
 * login/logout：{token，reToken}
 **********************属性*********************/
const router = require('koa-router')();
const crypto = require('crypto');
function cryptoPassFunc (password) {
	const md5 = crypto.createHash('md5'); //'sha1', 'md5', 'sha256', 'sha512'等
	return md5.update(password).digest('hex');
}

router.prefix('/login');
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('login', {
		title:"用户登录"
	});
});

// 登录
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.account, 400, "参数错误!",{details:{ account: "undefined"}});
	ctx.assert(body.pass, 400, "参数错误!",{details:{ pass: "undefined"}});
	let pass = cryptoPassFunc(body.pass);
	// 验证
	let res = await ctx.mongodb.db.collection('users').find({_id:body.account,pass:pass}).toArray();
	ctx.assert(res.length, 400, "参数错误!",{details:{account:body.account, pass: body.pass}});
	ctx.session.user = {};
	ctx.session.user.account = body.account;
	ctx.session.user.name = res[0].name;
	ctx.session.user.rights = res[0].rights;
	ctx.session.user.theme = res[0].theme || 'ui-darkness'; //'ui-darkness';
	ctx.session.user.image = res[0].image || 'images/users/user2-160x160.jpg';
	ctx.session.user.pId = res[0].pId =="admin"?body.account:res[0].pId;
	ctx.session.user.shop = res[0].shop;
	ctx.body = {};
});
// 登出
router.delete('/',  async function (ctx, next) {
	ctx.session = null;
	ctx.body = {};
});
module.exports = router;