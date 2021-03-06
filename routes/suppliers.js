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
router.prefix('/suppliers');
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('suppliers', {
		title:"商品种类管理",theme:ctx.session.user.theme
	});
});
// 获得信息
router.get('/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let res = await ctx.redis.keys('su:*'); // clients
	let items = [];
	for(let i in res){
		let item  =  await ctx.redis.hgetall(res[i]);
		item._id = res[i].split(':')[1];
		items.push(item);
	}
	ctx.body = {rows:items};
});
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	let data = {
		n:body.n,// 公司
		t:body.t,
		c:body.c // 联系人
	};
	// 验证参数
	for (let i in data){
		ctx.assert(data[i], 400, "参数错误!",{details:`${i}:名称未定义`});
	}
	data.a = body.a;
	data.r = body.r;
	let msg ={
		t:'c',
		_id:body._id,
		data:data
	};
	let res = await ctx.mqtt.publish("ju7ygfa8001Qiha/su",JSON.stringify(msg) ,{qos:1});
	// let res = await ctx.redis.hmset('su:' + body._id,data);
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"无法执行"});
	ctx.body = {id:body._id};
});
router.put('/', async function (ctx, next) {
	ctx.body = {};
});
// 修改
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let data = {
		n:body.n,// 公司
		t:body.t,
		c:body.c // 联系人
	};
	// 验证参数
	for (let i in data){
		ctx.assert(data[i], 400, "参数错误!",{details:`${i}:名称未定义`});
	}
	data.a = body.a;
	data.r = body.r;
	let id = ctx.params.id;
	let msg ={
		t:'u',
		_id:id,
		data:data
	};
	let res = await ctx.mqtt.publish("ju7ygfa8001Qiha/su",JSON.stringify(msg) ,{qos:1});
	// let res = await ctx.redis.hmset('su:' + id,data);
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"无法执行"});
	ctx.body = res;
});
// 删除
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let msg ={
		t:'d',
		_id:id
	};
	let res = await ctx.mqtt.publish("ju7ygfa8001Qiha/su",JSON.stringify(msg) ,{qos:1});
	// let res = await ctx.redis.del('su:' + id);
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"无法删除"});
	ctx.body = res;
});
module.exports = router;