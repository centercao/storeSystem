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
router.prefix('/users');
function cryptoPassFunc (password) {
	const md5 = crypto.createHash('md5'); //'sha1', 'md5', 'sha256', 'sha512'等
	return md5.update(password).digest('hex');
}
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('users', {
		title:"用户管理",theme:ctx.session.user.theme
	});
});
// 获得信息
router.get('/:id',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.account};
	let projection={pass:0,right:0};
	let res = await ctx.mongodb.db.collection('users').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 添加用户
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(ctx.session.user.account, 400, "参数错误!",{details:{ pId: "undefined"}});
	ctx.assert(body.account, 400, "参数错误!",{details:{ account: "undefined"}});
	ctx.assert(body.name, 400, "参数错误!",{details:{ name: "undefined"}});
	if(ctx.session.user.right.indexOf(0)==-1){
		ctx.assert(body.shop, 400, "参数错误!",{details:{ shop: "undefined"}});
	}
	// 验证 重复输入
	let res = await ctx.mongodb.db.collection('users').find({account:body.account}).toArray();
	if(res.length  > 0){
		ctx.throw(400, "参数错误!",{details:{ account: "用户帐号重复"}});
	}
	let pass = cryptoPassFunc('123456'); // md5.hex_md5("123456");
	res = await ctx.mongodb.db.collection('users').insertOne({account: body.account,pass:pass,name:body.name,
		shop: body.shop,pId: ctx.session.user.account});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = {id:res.insertedId.toString()};
});
router.put('/', async function (ctx, next) {
	ctx.body = {};
});
// 修改用户名
router.put('/:id/name', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "参数错误!",{details:{ name: "undefined"}});
	ctx.assert(body.shop, 400, "参数错误!",{details:{ shop: "undefined"}});
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('users').updateOne({_id:ctx.mongodb.ObjectID(id)},{$set:{name:body.name,shop:body.shop}});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
// 修改密码
router.put('/:id/password', async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id;
	ctx.assert(id, 400, "参数错误!",{details:{ account: "未填写"}});
	ctx.assert(body.oldPass, 400, "参数错误!",{details:{ oldPass: "未填写"}});
	ctx.assert(body.pass, 400, "参数错误!",{details:{ pass: "未填写"}});
	let pass = cryptoPassFunc(body.oldPass);
	let res = await ctx.mongodb.db.collection('users').find({account:id,pass:pass}).toArray();
	ctx.assert(res.length, 400, "参数错误!",{details:{account:body.account, pass: body.pass}});
	pass = cryptoPassFunc(body.pass);
	res = await ctx.mongodb.db.collection('users').updateOne({account:id},{$set:{pass:pass}});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
// 删除用户
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('users').deleteOne({_id:ctx.mongodb.ObjectID(id)});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
module.exports = router;