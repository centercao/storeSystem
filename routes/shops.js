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
router.get('/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('shops').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let resShop = await ctx.mongodb.db.collection('shops').find(where).project(projection).toArray();
	let shopNum = resShop.length;
	let resUsers = await ctx.mongodb.db.collection('users').find({_id:ctx.session.user.pId}).project(projection).toArray();
	let limit = resUsers[0].shopNum?resUsers[0].shopNum:3;
	ctx.assert((shopNum < limit), 405, "不允许的操作",{details:"数量超过了限制!"});
	// 验证参数
	ctx.assert(body._id, 400, "参数错误!",{details:"_id错误"});
	ctx.assert(body.name, 400, "参数错误!",{details:"名称未定义"});
	let res = await ctx.mongodb.db.collection('shops').insertOne({_id:body._id, pId: ctx.session.user.account,name:body.name});
	ctx.assert(res.insertedCount, 503, "服务器无法处理当前请求",{details:"不能执行操作"});
	ctx.body = {id:res.insertedId};
});
router.put('/', async function (ctx, next) {
	ctx.body = {};
});
// 修改
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "参数错误!",{details:"未定义"});
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('shops').updateOne({_id:id},{$set:{name:body.name}});
	ctx.assert(res.modifiedCount, 503, "服务器无法处理当前请求",{details:"不能执行操作"});
	ctx.body = res.modifiedCount;
});
// 删除用户
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('shops').deleteOne({_id:id});
	ctx.assert(res.deletedCount, 503, "服务器无法处理当前请求",{details:"无法删除"});
	ctx.body = res.deletedCount;
});
module.exports = router;