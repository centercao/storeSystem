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
router.get('/items',  async function (ctx, next) {
	// let query = ctx.request.query;
	let res = await ctx.redis.keys('sh:*');
	let items = [];
	for(let i in res){
		let item ={};
		item._id = res[i].split(':')[1];
		item.name = await ctx.redis.get(res[i]);
		items.push(item);
	}
	ctx.body = {rows:items};
});
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body._id, 400, "参数错误!",{details:"_id错误"});
	ctx.assert(body.name, 400, "参数错误!",{details:"名称未定义"});
	let data = {
		n:body.name
	};
	let msg ={
		t:'c',
		_id:body._id,
		data:data
	};
	let res = await ctx.mqtt.publish("ju7ygfa8001Qiha/sh",JSON.stringify(msg) ,{qos:1});
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"不能执行操作"});
	ctx.body = {id:body._id};
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
	let data = {
		n:body.name
	};
	let msg ={
		t:'u',
		_id:id,
		data:data
	};
	let res = await ctx.mqtt.publish("ju7ygfa8001Qiha/sh",JSON.stringify(msg) ,{qos:1});
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"不能执行操作"});
	ctx.body = res;
});
// 删除
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let msg ={
		t:'d',
		_id:id
	};
	let res = await ctx.mqtt.publish("ju7ygfa8001Qiha/sh",JSON.stringify(msg) ,{qos:1});
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"无法删除"});
	ctx.body = id;
});
module.exports = router;