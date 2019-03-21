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
router.prefix('/transport');
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('transport', {
		title:"运输管理",theme:ctx.session.user.theme
	});
});
// 获得信息
router.get('/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('transport').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "参数错误!",{details:"名称未定义"});
	let data = {
		_id:body._id,
		name: body.name,
		contact: body.contact,
		address: body.address,
		telephone: body.telephone,
		remarks: body.remarks,
		pId: ctx.session.user.pId
	};
	let res = await ctx.mongodb.db.collection('transport').insertOne(data);
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
	ctx.assert(body.name, 400, "参数错误!",{details:"名称未定义"});
	let data = {
		name: body.name,
		contact: body.contact,
		address: body.address,
		telephone: body.telephone,
		remarks: body.remarks
	};
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('transport').updateOne({_id:id},{$set:data});
	ctx.assert(res.modifiedCount, 503, "服务器无法处理当前请求",{details:"不能执行操作"});
	ctx.body = res.modifiedCount;
});
// 删除
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('transport').deleteOne({_id:id});
	ctx.assert(res.deletedCount, 503, "服务器无法处理当前请求",{details:"不能执行操作"});
	ctx.body = res.deletedCount;
});
module.exports = router;