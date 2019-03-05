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
router.get('/list',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('suppliers').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "参数错误!",{details:{ name: "未定义"}});
	ctx.assert(body.contact, 400, "参数错误!",{details:{ contact: "未定义"}});
	let data = {
		_id:body._id,
		name: body.name,
		contact: body.contact,
		address: body.address,
		telephone: body.telephone,
		remarks: body.remarks,
		pId: ctx.session.user.pId
	};
	// for(let i in data){
	// 	if(i != 'company'){
	// 		ctx.assert(data[i], 400, "参数错误!",{details:{ i: "未定义"}});
	// 	}
	// }

	let res = await ctx.mongodb.db.collection('suppliers').insertOne(data);
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = {id:res.insertedId};
});
router.put('/', async function (ctx, next) {
	ctx.body = {};
});
// 修改
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "参数错误!",{details:{ name: "未定义"}});
	ctx.assert(body.name, 400, "参数错误!",{details:{ name: "未定义"}});
	ctx.assert(body.contact, 400, "参数错误!",{details:{ contact: "未定义"}});
	let data = {
		name: body.name,
		contact: body.contact,
		address: body.address,
		telephone: body.telephone,
		remarks: body.remarks
	};
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('suppliers').updateOne({_id:id},{$set:data});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
// 删除
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('suppliers').deleteOne({_id:id});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
module.exports = router;