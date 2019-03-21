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
router.prefix('/stocksWarn');

function OpMap(op, data) {
	switch (op) {
		case 'eq':
			return {$eq: data};
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

function formatData(field, dd) {
	let data = dd;
	switch (field) {
		case 'case':
			data = Number(dd);
			break;
		case 'date':
			data = dd ? new Date(dd) : new Date();
			break;
		default:
			break
	}
	return data;
}

// 返回用户页面
router.get('/', async function (ctx, next) {
	await ctx.render('stocksWarn', {
		title: "库存警报", theme: ctx.session.user.theme
	});
});
// 获得信息
router.get('/lists', async function (ctx, next) {
	let query = ctx.request.query;
	let page = parseInt(query.page);
	let rows = parseInt(query.rows);
	let ret = {};
	ret["total"] = 0;
	ret["page"] = page;
	ret["records"] = 0;
	ret["rows"] = [];
	let filter = query.filters;
	let where = {};
	where['$match'] = {pId: {$eq: ctx.session.user.pId}};
	if (ctx.session.user.shop) {
		where['$match'].sId = {$eq: ctx.session.user.shop};
	}
	let projection = {};
	let sidx = query.sidx;
	let sort = {};
	sort[sidx] = query.sord == "asc" ? 1 : -1;
	if (filter && filter != "") {
		let filters = JSON.parse(filter);
		let groupOp = filters.groupOp;
		let rules = filters.rules;
		if (groupOp != "AND") {
			where['$match']["$or"] = [];
			for (let i = 0; i < rules.length; i++) {
				let terms = {};
				let op = rules[i].op;
				let field = rules[i].field;
				let data = formatData(field, rules[i].data);
				terms[field] = OpMap(op, data);
				where['$match']["$or"].push(terms);
			}
		} else {
			for (let i = 0; i < rules.length; i++) {
				let op = rules[i].op;
				let field = rules[i].field;
				let data = formatData(field, rules[i].data);
				let terms = OpMap(op, data);
				if (where['$match'][field]) {
					for (let item in terms) {
						where['$match'][field][item] = terms[item]; // 重复条件最后一个生效
						break;
					}
				} else {
					where['$match'][field] = terms;
				}
			}
		}
	} else {
		let data = formatData(query.searchField, query.searchString);
		where['$match'][query.searchField] = OpMap(query.searchOper, data);
	}
	let res = await ctx.mongodb.db.collection('goods').aggregate([where,
		{
			$lookup: {
				from: "subStocks",
				localField: "_id",
				foreignField: "gId",
				as: "stocks"
			}
		},
		{
			$unwind: {
				path: "$stocks",
				preserveNullAndEmptyArrays: false
			}
		},
		{
			$group: {
				_id: "$_id",
				name:{
					$first: "$name"
				},
				warn:{
					$first: "$warn"
				},
				num: {
					$sum: "$stocks.num"
				} // 销售数量

			}
		},
		{$sort: sort},
		{$skip: (page - 1) * rows},
		{$limit: rows}
	]).toArray();
	let counts = res.length;
	ret["total"] = Math.ceil(counts / rows);
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
module.exports = router;