/*******************************************************************
 *  Copyright(c) 2017-2018 Company Name
 *  All rights reserved.
 *
 *  文件名称:
 *  简要描述:
 *
 *  创建日期: 2018/5/30
 *  作者: center
 *  说明:
 *
 *  修改日期:
 *  作者:
 *  说明:
 ******************************************************************/
const router = require('koa-router')()

router.prefix('/roles');

// 获取页面
router.get('/',async function (ctx, next) {
	await ctx.render('roles', {
		title:"角色管理"
	});
});

router.get('/:id',async function (ctx, next) {
	let res = await ctx.mongodb.db.collection('roles').find({},{_id:1,name:1}).toArray();
	for(let i =0, len = res.length;i<len;i++){
		res[i].id = res[i]._id.toString();
		delete res[i]._id;
	}
	ctx.body = res;
});
// 添加
router.post('/', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "Parameter error!",{details:{ name: "undefined"}});
	// 验证 重复输入
	let res = await ctx.mongodb.db.collection('roles').find({name:body.name}).toArray();
	if(res.length  > 0){
		ctx.throw(400,"参数错误,角色重复");
	}
	res = await ctx.mongodb.db.collection('roles').insertOne({name: body.name,date: new Date(),mDate: new Date()});
	ctx.body = {id:res.insertedId.toString()};
});
router.put('/',async function (ctx, next) {
	ctx.body = 'this is a devices put response';
});
// 修改名称
router.put('/:id/name', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "Parameter error!",{details:{ name: "undefined"}});
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('roles').updateOne({_id:ctx.mongodb.ObjectID(id)},{$set:{name:body.name,mDate: new Date()}});
	ctx.body = res.result;
});
// 修改权限
router.put('/:id/authorize', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.checked == undefined?false:true, 400, "Parameter error!",{details:{ checked: "undefined"}});
	ctx.assert(body.val, 400, "Parameter error!",{details:{ val: "undefined"}});
	let id = ctx.params.id;
	let val = Number(body.val);
	let res;
	if(body.checked == 1){
		res = await ctx.mongodb.db.collection('roles').updateOne({_id:ctx.mongodb.ObjectID(id),"aut":{$ne:val}},{$push:{aut:val}});
	}else {
		res = await ctx.mongodb.db.collection('roles').updateOne({_id:ctx.mongodb.ObjectID(id)},{$pull:{aut:val}});
	}
	ctx.body = res.result;
});
// 删除
router.delete('/:id', async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('roles').deleteOne({_id:ctx.mongodb.ObjectID(id)});
	ctx.body = res.result;
});
module.exports = router;