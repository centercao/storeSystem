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

router.prefix('/shops');
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('shops', {
		title:"店铺管理",theme:ctx.session.user.theme
	});
});
// 获得信息
router.get('/list',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.account};
	let projection={};
	let res = await ctx.mongodb.db.collection('shops').find(where).project(projection).toArray();
	ctx.body = res;
});
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(ctx.session.user.account, 400, "参数错误!",{details:{ pId: "undefined"}});
	ctx.assert(body.name, 400, "参数错误!",{details:{ name: "undefined"}});
	let res = await ctx.mongodb.db.collection('shops').insertOne({pId: ctx.session.user.account,name:body.name});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = {id:res.insertedId.toString()};
});
router.put('/', async function (ctx, next) {
	ctx.body = {};
});
// 修改
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "参数错误!",{details:{ name: "undefined"}});
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('shops').updateOne({_id:ctx.mongodb.ObjectID(id)},{$set:{name:body.name}});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	// ctx.throw(503, "服务器无法处理当前请求",{details:{ result: res.result}});
	ctx.body = res.result;
});
// 删除用户
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('shops').deleteOne({_id:ctx.mongodb.ObjectID(id)});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	// ctx.throw(503, "服务器无法处理当前请求",{details:{ result: res.result}});
	ctx.body = res.result;
});
module.exports = router;