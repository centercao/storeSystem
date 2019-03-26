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
const NodeRSA = require('node-rsa');
const si = require('systeminformation');
const pubKey = '-----BEGIN PUBLIC KEY-----\n' +
	'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBANMw16kQUjgVK0cthU3KFYJtxTklCmTZ\n' +
	'jH7C3GaWyz0JBCNvxq7BgTufGoaf++V158rhZ8meI2SgiSuAiqQOAZ8CAwEAAQ==\n' +
	'-----END PUBLIC KEY-----';
const key = "bMZrDMS5M36e/xX+S2o12WKyd7GzFgDeqB8rBY01SVW7cw7dQcKWLuVkOcGMWcjFpd2gs2U47WSwNyYSMYWrBA==";
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
	let pubKey0 = new NodeRSA(pubKey, 'pkcs8-public');
	let systemInfo  =await si.system();
	let flag = pubKey0.verify(systemInfo.serial + systemInfo.uuid, new Buffer(key,'base64'));
	ctx.assert(flag, 400, "参数错误!",{details:"无权使用"});
	// 验证参数
	ctx.assert(body.account, 400, "参数错误!",{details:"账户错误"});
	ctx.assert(body.pass, 400, "参数错误!",{details:"密码不存在"});
	let pass = cryptoPassFunc(body.pass);
	// 验证
	let res = await ctx.mongodb.db.collection('users').find({_id:body.account,pass:pass}).toArray();
	ctx.assert(res.length, 400, "参数错误!",{details:"用户不存在或错误"});
	ctx.session.user = {};
	ctx.session.user.account = body.account;
	ctx.session.user.name = res[0].name;
	ctx.session.user.rights = res[0].rights;
	ctx.session.user.theme = res[0].theme || 'redmond'; //'redmond';
	ctx.session.user.image = res[0].image || 'images/users/user2-160x160.jpg';
	ctx.session.user.pId = res[0].pId =="admin"?body.account:res[0].pId;
	ctx.session.user.shop = res[0].shop;
	ctx.body = {};
});
// 设置UI
router.put('/',async function (ctx, next) {
	let body = ctx.request.body;
	let res = await ctx.mongodb.db.collection('users').updateOne({_id:ctx.session.user.account},{$set:{theme:body.theme}});
	ctx.session.user.theme = body.theme || 'ui-darkness'; //'ui-darkness';
	ctx.body = {};
});
// 登出
router.delete('/',  async function (ctx, next) {
	ctx.session = null;
	ctx.body = {};
});
module.exports = router;