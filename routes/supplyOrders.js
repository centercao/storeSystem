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
router.prefix('/supplyOrders');

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
	await ctx.render('supplyOrders', {
		title:"订单管理",theme:ctx.session.user.theme
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
			"cost" : 1,
			"price" : 1,
			"pay" : 1,
			"rem" : 1};
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
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	let data = {
		_id: body._id,
		gId: body.gId,   // 商品类别
		suId: body.suId, // 供应商
		iNum: Number(body.iNum), // 进货量
		cost:ctx.mongodb.connect.Decimal128.fromString(body.cost),// 进价
		price: ctx.mongodb.connect.Decimal128.fromString(body.price),// 定价
	};
	for(let i in data){
		ctx.assert(data[i], 400, "参数错误!",{details:{ i: "未定义"}});
	}
	data.date= body.date? new Date(body.date):new Date();
	data.pId = ctx.session.user.pId; // 总账户
	data.pay = Number(body.pay); // 支付情况
	data.num = data.iNum; // 库存量
	data.rem= body.rem||""; // 备注
	let res = await ctx.mongodb.db.collection('stocks').insertOne(data);
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = {id:res.insertedId};
});
// 修改
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	let data = {
		gId: body.gId,
		suId: body.suId,
		date: new Date(body.date),
		num: Number(body.num),
		cost:ctx.mongodb.connect.Decimal128.fromString(body.cost),// 进价
		price: ctx.mongodb.connect.Decimal128.fromString(body.price),// 定价
	};
	for(let i in data){
		ctx.assert(data[i], 400, "客户端参数错误!",{details:i+" 未提供"});
	}
	let dNum = Number(body.dNum);
	ctx.assert((dNum>= 0), 400, "客户端参数错误!",{details:"数量小于已分配量"});
	data.pay=Number(body.pay); // 支付
	data.rem= body.rem;
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('stocks').updateOne({_id:id,pId:ctx.session.user.pId,
		"$where":"this.dNum <= " + data.num},{$set:data});
	ctx.assert(res.modifiedCount, 503, "服务器无法处理当前请求",{details:"不能执行的操作"});
	ctx.body = res.modifiedCount;
});
// 删除
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('stocks').deleteOne({_id:id,pId:ctx.session.user.pId,$where:"this.dNum == 0"});
	ctx.assert(res.deletedCount, 503, "服务器无法处理当前请求",{details:"删除失败或不允许删除!"});
	ctx.body = {id:id};
});
module.exports = router;