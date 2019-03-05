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
// 返回页面
router.get('/',  async function (ctx, next) {
	await ctx.render('stocks', {
		title:"入库管理",theme:ctx.session.user.theme
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
		let  where={pId:ctx.session.user.account};
		if(ctx.session.user.shop){
			where[shop]=ctx.session.user.shop;
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
		let res = await ctx.mongodb.db.collection('stocks').find(where).project(projection);
		let counts = await res.count();
		res = await res.sort(sort).skip((page-1)*rows).limit(rows).toArray();
		ret["total"] = Math.ceil(counts / rows); // 总页数
		ret["records"] = counts;
		ret["rows"] = res;
	}
	ctx.body = ret;
});
// 添加
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	let data = {
		_id: body._id,
		pId: ctx.session.user.pId, // 总客户
		gId: body.gId,   // 商品类别
		sId: body.sId,   // 商店
		suId: body.suId, // 供应商
		date: new Date(body.date),
		num: Number(body.num), // 数量
		inPrice:ctx.mongodb.connect.Decimal128.fromString(body.inPrice),// 进价
		price: ctx.mongodb.connect.Decimal128.fromString(body.price),// 定价
	};
	for(let i in data){
		ctx.assert(data[i], 400, "参数错误!",{details:{ i: "未定义"}});
	}
	data.sNum = 0;
	data.tNum = 0;
	data.uNum = 0;
	data.remarks= body.remarks;
	let res = await ctx.mongodb.db.collection('stocks').insertOne(data);
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
	ctx.assert(ctx.session.user.account, 400, "参数错误!",{details:{ account: "未登陆"}});
	let data = {
		gId: body.gId,
		sId: body.sId,
		suId: body.suId,
		date: new Date(body.date),
		num: Number(body.num),
		inPrice: Number(body.inPrice),
		price: Number(body.price)
	};
	for(let i in data){
		ctx.assert(data[i], 400, "参数错误!",{details:{ i: "未定义"}});
	}
	data.remarks= body.remarks;
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('stocks').updateOne({_id:id,pId:ctx.session.user.pId},{$set:data});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
// 删除
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('stocks').deleteOne({_id:id,pId:ctx.session.user.pId});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.result;
});
module.exports = router;