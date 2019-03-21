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
router.prefix('/sales');
const shortId=require('jsnodeid');
function OpMap(op, data) {
	switch (op) {
		case 'eq': // 等于
			return {$eq:data};
		case 'ne': // 不等于
			return {$ne: data};
		case 'lt': // 小于
			return {$lt: data};
		case 'le': // 小于等于
			return {$lte: data};
		case 'gt': // 大于
			return {$gt: data};
		case 'ge': // 大于等于
			return {$gte: data};
		case 'bw': { // 开头是
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
		case 'case':
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
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('sales', {
		title:"销售管理",theme:ctx.session.user.theme
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
		let  where={pId:ctx.session.user.pId,audit:{$lte : 1},oId:ctx.session.user.account};
		if(ctx.session.user.shop){
			where[sId]=ctx.session.user.shop;
		}
		let projection={lists:0};
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
		/*for(let i =0,len = res.length;i< len;i++){
			res[i].proceed = res[i].proceed.toString();
		}*/
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
// 运输
router.get('/transport/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('transport').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 销售详细列表
router.get('/lists/:id',  async function (ctx, next) {
	let query = ctx.request.query;
	let page = parseInt(query.page);
	let rows = parseInt(query.rows);
	let ret = {};
	ret["total"] = 0;
	ret["page"] = page;
	ret["records"] = 0;
	ret["rows"] = [];
	let filter = query.filters;
	let where = {_id: ctx.params.id};
	let projection = {lists: 1};
	let sidx = query.sidx;
	let sort = {};
	sort[sidx] = query.sord == "asc" ? 1 : -1;
	if (filter && filter != "") {
		let filters = JSON.parse(filter);
		let groupOp = filters.groupOp;
		let rules = filters.rules;
		if (groupOp != "AND") {
			where["$or"] = [];
			for (let i = 0; i < rules.length; i++) {
				let terms = {};
				let op = rules[i].op;
				let field = rules[i].field;
				let data = formatData(field, rules[i].data);
				terms[field] = OpMap(op, data);
				where["$or"].push(terms);
			}
		} else {
			for (let i = 0; i < rules.length; i++) {
				let op = rules[i].op;
				let field = rules[i].field;
				let data = formatData(field, rules[i].data);
				let terms = OpMap(op, data);
				if (where[field]) {
					for (let item in terms) {
						where[field][item] = terms[item]; // 重复条件最后一个生效
						break;
					}
				} else {
					where[field] = terms;
				}
			}
		}
	} else {
		let data = formatData(query.searchField, query.searchString);
		where[query.searchField] = OpMap(query.searchOper, data);
	}
	let res = await ctx.mongodb.db.collection('sales').find(where).project(projection).sort(sort).skip((page - 1) * rows).limit(rows).toArray();
	if(res.length>0){
		if(res[0].lists){
			let counts = res[0].lists.length;
			ret["total"] = Math.ceil(counts / rows); // 总页数
			ret["records"] = counts;
			ret["rows"] = res[0].lists;
		}
	}
	ctx.body = ret;
});
// 库存查询
router.get('/subStocks',  async function (ctx, next) {
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
		let  where={};
		where['$match'] = {pId:ctx.session.user.pId,num:{$gt:0}};
		if(ctx.session.user.shop){
			where['$match'].sId={$eq:ctx.session.user.shop};
		}
		let sidx = query.sidx;
		let sort = {};
		sort[sidx] = query.sord == "asc"?1:-1;
		if (filter  && filter != "") {
			let filters = JSON.parse(filter);
			let groupOp = filters.groupOp;
			let rules = filters.rules;
			if(groupOp != "AND"){
				where['$match']["$or"] = [];
				for (let i = 0; i < rules.length;i++) {
					let terms = {};
					let op = rules[i].op;
					let field = rules[i].field;
					let data = formatData(field,rules[i].data);
					terms[field] = OpMap(op,data);
					where['$match']["$or"].push(terms);
				}
			}else{
				for (let i = 0; i < rules.length;i++) {
					let op = rules[i].op;
					let field = rules[i].field;
					let data = formatData(field,rules[i].data);
					let terms = OpMap(op,data);
					if(where['$match'][field]){
						for(let item in terms) {
							where['$match'][field][item] = terms[item];
							break;
						}
					}else{
						where['$match'][field] = terms;
					}
				}
			}
		}else {
			let data = formatData(query.searchField,query.searchString);
			where['$match'][query.searchField] = OpMap(query.searchOper,data);
		}
		let res = await ctx.mongodb.db.collection('subStocks').aggregate([where,
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
					pId: 1,
					dId:1,
					gId: "$stocks.gId",
					sId:1,
					suId:"$stocks.suId",
					date: "$stocks.date",
					num: 1,
					price: "$stocks.price",
					rem: 1
				}
			},
			{$sort : sort},
			{$skip: (page-1)*rows},
			{$limit: rows}
		]).toArray();
		let counts = res.length;
		ret["total"] = Math.ceil(counts / rows);
		ret["records"] = counts;
		ret["rows"] = res;
	}
	ctx.body = ret;
});
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	let lists = body.lists || [];
	for(let i =0;i<lists.length;i++){
		lists[i].pId = ctx.session.user.pId;
		lists[i].oId = ctx.session.user.account;
		lists[i].sId = ctx.session.user.shop;
		lists[i].cId = body.cId; // 客户
		lists[i].payId = body.payId; // 支付方式
		lists[i].tId=body.tId; // 运输方式
		lists[i].mode = body.mode; // 批发零售
		lists[i].date =  body.date?new Date(body.date):new Date();
		lists[i].num = Number(lists[i].num);
		lists[i].should = ctx.mongodb.connect.Decimal128.fromString(lists[i].should);// 应收
		lists[i].proceed = ctx.mongodb.connect.Decimal128.fromString(lists[i].proceed);// 总实收款=数量*单价
		lists[i].arrears = ctx.mongodb.connect.Decimal128.fromString(lists[i].arrears);// 欠款
		lists[i].audit="1"; // 待审核
	}
	//
	/*for(let i in body.lists){
		// ctx.assert(body.lists[i], 400, "参数错误!",{details:{ i: "未定义"}});
		body.lists[i].num = Number(body.lists[i].num);
	}*/
	let transData = {
		_id:shortId.uuid(),
		type:0, // 添加事务集合
		items:[],
		state:0 // initial
	};
	for(let i =0,l = lists.length;i<l;i++){
		let SubTrans = {
			_id:shortId.uuid(),
			type:1, // 分库(添加)
			s_id:lists[i].subId, // 分库存
			s_c:"subStocks", // 源库
			args:lists[i],
			d_id:lists[i]._id,
			d_c:"sales", // 目标库
			state:-1 // initial 之前,需要事务集合去修改为0
		};
		transData.items.push(SubTrans);
	}
	let res = await ctx.mongodb.db.collection('transactions').insertOne(transData);
	ctx.assert(res.insertedCount, 503, "服务器无法处理当前请求",{details:"不能执行的操作"});
	ctx.body = {id:0};
	ctx.body = {id:res.insertedId};
});
// 更新
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id;
	let data = {
		cId : body.cId,
		should:ctx.mongodb.connect.Decimal128.fromString(body.should), // 应收
		proceed :ctx.mongodb.connect.Decimal128.fromString(body.proceed),//实收款
		arrears : ctx.mongodb.connect.Decimal128.fromString(body.arrears),// 欠款
		lists:body.lists||[],
		date : body.date?new Date(body.date):new Date()
	};
	data.payId = Number(body.payId); // 支付方式
	data.tId=body.tId; // 运输方式
	data.mode = Number(body.mode); // 批发零售
	data.remarks = body.remarks;
	// update({_id:id},{$set:data});
	let res = await ctx.mongodb.db.collection('sales').findAndModify({_id:id},[],{$set:data},{remove:false,new:false});
	ctx.assert(res.ok, 503, "服务器无法处理当前请求",{details:{ result: res.ok}});
	for(let i = 0,len = res.value.lists?res.value.lists.length:0;i< len;i++){
		res = await ctx.mongodb.db.collection('stocks').update({_id:res.value.lists[i].pId},{$inc:{sNum:-res.value.lists[i].num}});
	}
	for(let i = 0;i< data.lists.length;i++){
		res = await ctx.mongodb.db.collection('stocks').update({_id:data.lists[i].pId},{$inc:{sNum:data.lists[i].num}});
	}

	ctx.body = {id:res.ok};
});
// 删除
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('sales').findAndModify({_id:id,pId:ctx.session.user.pId},[],{},{remove:true,new:false});
	ctx.assert(res.ok, 503, "服务器无法处理当前请求",{details:{ result: res.ok}});
	for (let i =0,len = res.value.lists?res.value.lists.length:0;i<len;i++){
		await ctx.mongodb.db.collection('stocks').update({_id:res.value.lists[i].pId},{$inc:{sNum:-res.value.lists[i].num}});
	}
	ctx.body = res.ok;
});
module.exports = router;