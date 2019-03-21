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
router.prefix('/salesMonths');
function OpMap(op, data) {
	switch (op) {
		case 'eq':
			return {$eq:data};
		case 'ne':
			return {$ne: data};
		case 'lt':
			return {$lt: data};
		case 'le':
			return {$lte: data};
		case 'gt':
			return {$gt: data};
		case 'ge':
			return {$gte: data};
		case 'bw': {
			let regExp = new RegExp("^" + data);
			return regExp;
		}
		default:
			break;
	}
}
function formatData(field,dd) {
	let data = dd;
	switch (field){
		case 'date':
			data = dd?new Date(dd):new Date();
			break;
		default:
			break
	}
	return data;
}
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('salesMonths', {
		title:"销售审核",theme:ctx.session.user.theme
	});
});
// 获得信息
router.get('/lists',  async function (ctx, next) {
	let query = ctx.request.query;
	let startTime = new Date(query.startTime);
	let endTime = new Date(query.endTime);
	let ret = {};
	ret["rows"] = [];
	let where = {};
	where['$match'] = {pId:ctx.session.user.pId};
	if (ctx.session.user.shop) {
		where['$match'].sId = {$eq: ctx.session.user.shop};
	}
	where['$match'].date = {$lte:endTime,$gte:startTime};
	let res = await ctx.mongodb.db.collection('sales').aggregate([where,
		{
			$lookup:{
				from: "stocks",
				localField: "dId",
				foreignField: "_id",
				as: "stocks"
			}
		},
		{
			$unwind: {
				path: "$stocks",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$project: {
				gId: "$stocks.gId",
				sId:1,
				date: 1,
				num: 1,
				proceed:1,
				cost: "$stocks.cost"
			}
		},
		{$sort: {"date":1}}
	]).toArray();
	ret["rows"] = res;
	ctx.body = ret;
});
// 客户信息
router.get('/customers/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('customers').find(where).project(projection).toArray();
	ctx.body = {rows:res};
})
// 品类信息
router.get('/goods/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('goods').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 店库信息
router.get('/shops/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('shops').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 供应商
router.get('/suppliers/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('suppliers').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 操作者
router.get('/operator/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where ={pId:ctx.session.user.pId};
	let projection={name:1};
	let res = await ctx.mongodb.db.collection('users').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 运输
router.get('/transport/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('transport').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 审核
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('sales').updateOne({_id:id},
		{$set:{audit:body.audit}});
	ctx.assert(res.modifiedCount, 503, "服务器无法处理当前请求",{details:"不能执行"});
	ctx.body = res.modifiedCount;
});
module.exports = router;