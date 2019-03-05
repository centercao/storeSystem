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
		let  where={pId:ctx.session.user.account,audit:{$lte : 1}};
		if(ctx.session.user.shop){
			where[shop]=ctx.session.user.shop;
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
router.get('/stocks',  async function (ctx, next) {
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
		where['$match'] = {pId:{$eq:ctx.session.user.pId}};
		if(ctx.session.user.shop){
			where['$match'].sId={$eq:ctx.session.user.shop};
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
							where['$match'][field][item] = terms[item]; // 重复条件最后一个生效
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
		let res = await ctx.mongodb.db.collection('stocks').aggregate([where,
			{
				$project: {
					_id:1,
					"date" : 1,
					"gId" : 1,
					"sId" : 1,
					"suId" :1,
					"price" : 1,
					"remarks" : 1,
					num:{$subtract:[{$subtract:[{$subtract:["$num","$sNum"]},"$tNum"]},"$uNum"]}
				}
			},
			{
				$match: {
					$expr: {
						$gt: ["$num", 0]
					}
				}
			},
			{$sort : sort},
			{$skip: (page-1)*rows},
			{$limit: rows}
		]).toArray();
		let counts  = res.length;
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
		lists[i].num = Number(lists[i].num);
	}
	let data = {
		_id:body._id,
		pId:ctx.session.user.pId,
		aId:ctx.session.user.account,// 销售账户
		sId:ctx.session.user.shop, // 商店
		cId : body.cId,
		payId : Number(body.payId), // 支付方式
		should:ctx.mongodb.connect.Decimal128.fromString(body.should), // 应收
		proceed :ctx.mongodb.connect.Decimal128.fromString(body.proceed),//实收款
		arrears : ctx.mongodb.connect.Decimal128.fromString(body.arrears),// 欠款
		date : new Date(body.date),
		lists:lists,
		audit:1,
	};
	/*for(let i in body.lists){
		// ctx.assert(body.lists[i], 400, "参数错误!",{details:{ i: "未定义"}});
		body.lists[i].num = Number(body.lists[i].num);
	}*/
	let res = await ctx.mongodb.db.collection('sales').insertOne(data);
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	for(let i = 0;i< lists.length;i++){
		await ctx.mongodb.db.collection('stocks').update({_id:lists[i].pId},{$inc:{sNum:lists[i].num}});
	}
	ctx.body = {id:res.insertedId};
});
// 添加子项目
router.post('/:id',async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id;
	let data = {
		_id:body._id,
		pId:body.pId,
		gId:body.gId,
		num:Number(body.num)
	};
	let res = await ctx.mongodb.db.collection('sales').update({_id:id},
		{$push:{lists:data},$set:{'should':Number(body.should)}},{upsert:true,multi:false});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	res = await ctx.mongodb.db.collection('stocks').update({_id:data.pId},{$inc:{sNum:data.num}});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = {id:res.result};
});
// 更新
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id;
	let data = {
		cId : body.cId,
		payId : Number(body.payId), // 支付方式
		should:ctx.mongodb.connect.Decimal128.fromString(body.should), // 应收
		proceed :ctx.mongodb.connect.Decimal128.fromString(body.proceed),//实收款
		arrears : ctx.mongodb.connect.Decimal128.fromString(body.arrears),// 欠款
		lists:body.lists||[],
		date : new Date(body.date)
	};
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
// 更新子项目
router.put('/:pId/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let pId = ctx.params.pId;
	let id = ctx.params.id;
	let data ={
		"lists.$.num":Number(body.num),
		'should':Number(body.should)
	};
	let res = await ctx.mongodb.db.collection('sales').update({_id:pId,'lists._id': id}, //'lists': {'$elemMatch': {'_id': id}}
		{$set:data});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	res = await ctx.mongodb.db.collection('stocks').update({_id:body.oldPid},{$inc:{sNum:(body.num-body.oldNum)}});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = {id:res.result};
});
// 删除
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('sales').findAndModify({_id:id},[],{},{remove:true,new:false});
	ctx.assert(res.ok, 503, "服务器无法处理当前请求",{details:{ result: res.ok}});
	for (let i =0,len = res.value.lists?res.value.lists.length:0;i<len;i++){
		await ctx.mongodb.db.collection('stocks').update({_id:res.value.lists[i].pId},{$inc:{sNum:-res.value.lists[i].num}});
	}
	ctx.body = res.ok;
});
// 删除子项
router.delete('/:pId/:id',async function (ctx, next) {
	// let query = ctx.request.query;
	let pId = ctx.params.pId;
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('sales').findAndModify({_id:pId},[],{$pull:{lists:{_id:id}}},{remove:false,new:false});
	ctx.assert(res.ok, 503, "服务器无法处理当前请求",{details:{ result: res.ok}});
	if(res.value){
		if(res.value.lists){
			await ctx.mongodb.db.collection('stocks').update({_id:res.value.lists[0].pId},{$inc:{sNum:-res.value.lists[0].num}});
		}
	}
	//res = await ctx.mongodb.db.collection('stocks').update({_id:query.pId},{$inc:{sNum:-query.oldNum}});
	//ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.ok;//result.nModified;
});
module.exports = router;