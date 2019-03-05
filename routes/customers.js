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
router.prefix('/customers');
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('customers', {
		title:"商品种类管理",theme:ctx.session.user.theme
	});
});
// 获得信息
router.get('/list',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('customers').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
router.get('/options',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('customers').find(where).project(projection).toArray();
	let res1 = await ctx.mongodb.db.collection('sales').aggregate([{$match:{pId:{$eq:ctx.session.user.pId}}
	},
		{$project:{_id:0,cId:1}},
		{$lookup: {
				from: "customers",
				localField: "cId",
				foreignField: "_id",
				as: "customers"
			}
		},
		{$match:{customers:{$eq: []}}},
		{$project:{_id:"$cId",name:"$cId"}},
		{$group:{_id:"$_id",name:{$first:"$name"}}}

	]).toArray();
	ctx.body = {rows:res1.concat(res)};
});
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "参数错误!",{details:{ name: "undefined"}});
	// if(ctx.session.user.right.indexOf(0)==-1){
	// 	ctx.assert(body.shop, 400, "参数错误!",{details:{ shop: "undefined"}});
	// }
	let res = await ctx.mongodb.db.collection('customers').insertOne({_id:body._id, name:body.name,
		company:body.company,address:body.address,telephone:body.telephone,remarks:body.remarks,
		pId: ctx.session.user.pId});
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
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('customers').updateOne({_id:id},
		{$set:{name:body.name,company:body.company,address:body.address,
				telephone:body.telephone,remarks:body.remarks}});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
// 删除
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('customers').deleteOne({_id:id});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
module.exports = router;