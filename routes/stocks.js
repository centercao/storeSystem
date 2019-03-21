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
router.prefix('/stocks');
const shortId=require('jsnodeid');

// 查询条件转换
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
// 格式化数据
function formatData(field,dd) {
	let data = dd;
	switch (field){
		case 'pay':
			data = Number(dd);
			break;
		case 'date':
			data = dd?new Date(dd):new Date();
			break;
		default:
			break
	}
	return data;
}
// 返回页面
router.get('/',  async function (ctx, next) {
	await ctx.render('stocks', {
		title:"配货管理",theme:ctx.session.user.theme
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
			where[shop]=ctx.session.user.shop;
		}
		let projection={"pId" :1,
			"gId" : 1,
			"suId" : 1,
			"date" : 1,
			"num" : 1,
			"iNum" : 1,
			"rem" : 1};// 除去异动
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
		let res = await ctx.mongodb.db.collection('stocks').find(where).project(projection);
		let counts = await res.count();
		res = await res.sort(sort).skip((page-1)*rows).limit(rows).toArray();
		ret["total"] = Math.ceil(counts / rows); // 总页数
		ret["records"] = counts;
		ret["rows"] = res;
	}
	ctx.body = ret;
});
// 分库表查询
router.get('/subLists/:id',  async function (ctx, next) {
	let query = ctx.request.query;
	let id = ctx.params.id;
	let page = parseInt(query.page);
	let rows = parseInt(query.rows);
	let ret = {};
	ret["total"] = 0;
	ret["page"] = page;
	ret["records"] = 0;
	ret["rows"] = [];
	let  where = {dId:id};
	let projection = {sId:1,num:1,rem:1};
	let res = await ctx.mongodb.db.collection('subStocks').find(where,projection).toArray();
	let counts = res.length;
	ret["total"] = Math.ceil(counts / rows); // 总页数
	ret["records"] = counts;
	ret["rows"] = res;
	ctx.body = ret;
});
// 异动表查询
router.get('/lists/:dId/:subId',  async function (ctx, next) {
	let query = ctx.request.query;
	let dId = ctx.params.dId; // 订单id
	let subId = ctx.params.subId; // 分库id
	let page = parseInt(query.page);
	let rows = parseInt(query.rows);
	let ret = {};
	ret["total"] = 0;
	ret["page"] = page;
	ret["records"] = 0;
	ret["rows"] = [];
	let  where = {dId:dId,subId:subId};
	let projection = {};
	let res = await ctx.mongodb.db.collection('unuStocks').find(where,projection).toArray();
	let counts = res.length;
	ret["total"] = Math.ceil(counts / rows); // 总页数
	ret["records"] = counts;
	ret["rows"] = res;
	ctx.body = ret;
});
// goods信息
router.get('/goodsLists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('goods').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 商店
router.get('/shopsLists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('shops').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 供应商
router.get('/suppliersLists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('suppliers').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 分库
router.post('/:id',async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id; // 订单id
	let ownerId = shortId.uuid();
	let data = {
		_id:ownerId,
		pId:ctx.session.user.pId,
		dId:id,
		sId:body.sId,   // 店库
		gId:body.gId,
		num:Number(body.num),
	};
	// 验证参数
	for(let i in data){
		ctx.assert(data[i], 400, "参数错误!",{details:{ i: "未定义"}});
	}
	data.date = new Date();
	data.rem = body.rem || "";
	let transData = {
		_id:shortId.uuid(),
		type:1, // 分库(添加)
		s_id:id,
		s_c:"stocks", // 源库
		args:data,
		d_id:ownerId,
		d_c:"subStocks", // 目标库
		state:0 // initial
	};
	// 插入分库事务
	let res = await ctx.mongodb.db.collection('transactions').insertOne(transData);
	ctx.assert(res.insertedCount, 503, "服务器无法处理当前请求",{details:"不能执行的操作"});
	ctx.body = {id:ownerId};
});
// 异动
router.post('/:dId/:subId',async function (ctx, next) {
	let body = ctx.request.body;
	let dId = ctx.params.dId; // 订单
	let subId = ctx.params.subId; // 分库id
	let ownerId = shortId.uuid();
	let data = {
		_id:ownerId,
		pId:ctx.session.user.pId,   // 订单
		dId:dId,
		subId:subId, // 分库id
		suId:body.suId, // 供应商
		gId:body.gId, // 品类id
		sId:body.sId, // 店库id
		num:Number(body.num)
	};
	// 验证参数
	for(let i in data){
		ctx.assert(data[i], 400, "参数错误!",{details:{ i: "未定义"}});
	}
	data.mode = body.mode;
	data.date = body.date?new Date(body.date):new Date();
	data.rem = body.rem || "";
	let transData = {
		_id:shortId.uuid(),
		type:1, // 异动(添加)
		s_id:subId,
		s_c:"subStocks", // 源库
		args:data,
		d_id:ownerId,
		d_c:"unuStocks", // 目标库
		state:0 // initial
	};
	// 插入分库事务
	let res = await ctx.mongodb.db.collection('transactions').insertOne(transData);
	ctx.assert(res.insertedCount, 503, "服务器无法处理当前请求",{details:"不能执行的操作"});
	ctx.body = {id:ownerId};
});

// 修改分配
router.put('/:dId/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let dId = ctx.params.dId; // 订单id
	let id = ctx.params.id;
	let data = {
		num:Number(body.num)
	};
	// 验证参数
	for(let i in data){
		ctx.assert(data[i], 400, "客户端参数错误!",{details:i+" 未提供"});
	}
	data["rem"] = body.rem || "";
	let transData = {
		_id:shortId.uuid(),
		type:2, // 修改分库
		s_id:dId,
		s_c:"stocks", // 源库
		args:data,
		d_id:id,
		d_c:"subStocks", // 目标库
		state:0 // initial
	};
	// 插入分库事务
	let res = await ctx.mongodb.db.collection('transactions').insertOne(transData);
	ctx.assert(res.insertedCount, 503, "服务器无法处理当前请求",{details:"不能执行的操作"});
	ctx.body = res.insertedCount;
});
// 修改异动
router.put('/unusual/:subId/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id; // 异动id
	let subId = ctx.params.subId; // 分库id
	let data = {
		num:Number(body.num)
	};
	// 验证参数
	for(let i in data){
		ctx.assert(data[i], 400, "客户端参数错误!",{details:i+" 未提供"});
	}
	data["rem"] = body.rem || "";
	let transData = {
		_id:shortId.uuid(),
		type:2, // 修改异动
		s_id:subId,
		s_c:"subStocks", // 源库
		args:data,
		d_id:id,
		d_c:"unuStocks", // 目标库
		state:0 // initial
	};
	// 插入事务
	let res = await ctx.mongodb.db.collection('transactions').insertOne(transData);
	ctx.assert(res.insertedCount, 503, "服务器无法处理当前请求",{details:"不能执行的操作"});
	ctx.body = res.insertedCount;
});

// 删除分库
router.delete('/:dId/:id',async function (ctx, next) {
	let dId = ctx.params.dId;// 订单id
	let id = ctx.params.id;
	let transData = {
		_id:shortId.uuid(),
		type:3, // 删除分库
		s_id:dId,
		s_c:"stocks", // 源库
		d_id:id,
		d_c:"subStocks", // 目标库
		state:0 // initial
	};
	// 插入事务
	let res = await ctx.mongodb.db.collection('transactions').insertOne(transData);
	ctx.assert(res.insertedCount, 503, "服务器无法处理当前请求",{details:"不能执行的操作"});
	ctx.body = res.id;
});
// 删除异动
router.delete('/unusual/:subId/:id/',async function (ctx, next) {
	let id = ctx.params.id;
	let subId = ctx.params.subId;
	let transData = {
		_id:shortId.uuid(),
		type:3, // 删除分库
		s_id:subId,
		s_c:"subStocks", // 源库
		d_id:id,
		d_c:"unuStocks", // 目标库
		state:0 // initial
	};
	// 插入事务
	let res = await ctx.mongodb.db.collection('transactions').insertOne(transData);
	ctx.assert(res.insertedCount, 503, "服务器无法处理当前请求",{details:"不能执行的操作"});
	ctx.body = id;
});
module.exports = router;