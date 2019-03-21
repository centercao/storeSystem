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
router.prefix('/afterSales');
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
		case 'audit':
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
	await ctx.render('afterSales', {
		title:"退换修服务",theme:ctx.session.user.theme
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
// 退换货
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id;
	if(body.afterMode == 1){
		let data = {
			_id:body._id,
			gId:body.gId,
			remarks:body.remarks,
			date:new Date()
		};
		let res = await ctx.mongodb.db.collection('sales').updateOne({_id:id,pId:ctx.session.user.pId},{$addToSet:{after:data}},{upsert:true});
		ctx.assert(res.result.nModified, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
		ctx.body = res.result.nModified;
	}else{
		let res = await ctx.mongodb.db.collection('sales').findAndModify({_id:id},[],{},{remove:true,new:false});
		ctx.assert(res.ok, 503, "服务器无法处理当前请求",{details:{ result: res.ok}});
		for (let i =0,len = res.value.lists?res.value.lists.length:0;i<len;i++){
			await ctx.mongodb.db.collection('stocks').update({_id:res.value.lists[i].pId},{$inc:{sNum:-res.value.lists[i].num}});
		}
		ctx.body = res.ok;
	}

});
module.exports = router;