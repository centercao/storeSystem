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
router.prefix('/salesMan');
const shortId=require('jsnodeid');

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
	await ctx.render('salesMan', {
		title:"销售审核",theme:ctx.session.user.theme
	});
});
// 获得信息
router.get('/lists',  async function (ctx, next) {
	let query = ctx.request.query;
	let page = parseInt(query.page);
	let rows = parseInt(query.rows);
	let ret = {};
	ret["total"] = 0;
	ret["page"] = page;
	ret["records"] = 0;
	ret["rows"] = [];
	if (eval(query._search.toLowerCase())) {
		let filter = query.filters;
		let  where={pId:ctx.session.user.pId};
		if(ctx.session.user.shop){
			where[sId]=ctx.session.user.shop;
		}
		let projection={};
		let sidx = query.sidx;
		let sort = {};
		sort[sidx] = query.sord == "asc"?1:-1;
		if (filter != "") {
			let filters = JSON.parse(filter);
			let groupOp = filters.groupOp;
			let rules = filters.rules;
			if(groupOp != "AND"){
				where["$or"] = [];
				for (let i = 0; i < rules.length;i++) {
					let terms = {};
					let op = rules[i].op;
					let field = rules[i].field;
					let data = formatData(field,rules[i].data);
					terms[field] = OpMap(op,data);
					where["$or"].push(terms);
				}
			}else{
				for (let i = 0; i < rules.length;i++) {
					let op = rules[i].op;
					let field = rules[i].field;
					let data = formatData(field,rules[i].data);
					let terms = OpMap(op,data);
					if(where[field]){
						for(let item in terms) {
							where[field][item] = terms[item]; // 重复条件最后一个生效
							break;
						}
					}else{
						where[field] = terms;
					}
				}
			}
		}else {
			let data = formatData(query.searchField,query.searchString);
			where[query.searchField] = OpMap(query.searchOper,data);
		}
		let res = await ctx.mongodb.db.collection('sales').find(where).project(projection);
		let counts = await res.count();
		res = await res.sort(sort).skip((page-1)*rows).limit(rows).toArray();
		ret["total"] = Math.ceil(counts / rows); // 总页数
		ret["records"] = counts;
		ret["rows"] = res;
	}
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
//
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id;
	let data = {
		tId:body.tId,
		payId:body.payId,
		mode:body.mode,
		rem:body.rem
	};
	let res = await ctx.mongodb.db.collection('sales').updateOne({_id:id},
		{$set:data});
	ctx.assert(res.modifiedCount, 503, "服务器无法处理当前请求",{details:"不能修改"});
	ctx.body = res.modifiedCount;
});
router.delete('/:id/:subId', async function (ctx, next) {
	//let body = ctx.request.body;
	let subId = ctx.params.subId;// 订单id
	let id = ctx.params.id;
	let transData = {
		_id:shortId.uuid(),
		type:3, // 删除
		s_id:subId,
		s_c:"subStocks", // 源库
		d_id:id,
		d_c:"sales", // 目标库
		state:0 // initial
	};
	// 插入事务
	let res = await ctx.mongodb.db.collection('transactions').insertOne(transData);
	ctx.assert(res.insertedCount, 503, "服务器无法处理当前请求",{details:"不能删除"});
	ctx.body = res.id;
});
module.exports = router;