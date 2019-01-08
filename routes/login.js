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
const md5 = require("../middlewares/md5");
var os =require('os');
var path = require('path');
var fs =require('fs');

router.prefix('/login');
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('login', {
		title:"用户登录"
	});
	ctx.session.user = "abc";
});
// 获得信息
router.get('/:id',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={};
	let projection={pass:0};
	let res = await ctx.mongodb.db.collection('users').find(where).project(projection).toArray();
	for(let i =0, len = res.length;i<len;i++){
		res[i].id = res[i]._id.toString();
		delete res[i]._id;
	}
	ctx.body = {rows:res};
});
// 添加用户
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.account, 400, "Parameter error!",{details:{ account: "undefined"}});
	ctx.assert(body.name, 400, "Parameter error!",{details:{ name: "undefined"}});
	// 验证 重复输入
	let res = await ctx.mongodb.db.collection('users').find({account:body.account}).toArray();
	if(res.length  > 0){
		ctx.throw(400,"Parameter error!Account duplication.");
	}
	let pass = md5.hex_md5("123456");
	res = await ctx.mongodb.db.collection('users').insertOne({account: body.account,pass:pass,name:body.name,date: new Date(),mDate: new Date()});
	ctx.body = {id:res.insertedId.toString()};
});
router.put('/', async function (ctx, next) {
	ctx.body = {};
});
// 修改用户名
router.put('/:id/name', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "Parameter error!",{details:{ name: "undefined"}});
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('users').updateOne({_id:ctx.mongodb.ObjectID(id)},{$set:{name:body.name,mDate: new Date()}});
	ctx.body = res.result;
});
// 修改角色
router.put('/:id/role', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.checked == undefined?false:true, 400, "Parameter error!",{details:{ checked: "undefined"}});
	ctx.assert(body.val, 400, "Parameter error!",{details:{ val: "undefined"}});
	let id = ctx.params.id;
	let res;
	if(body.checked == 1){
		res = await ctx.mongodb.db.collection('users').updateOne({_id:ctx.mongodb.ObjectID(id),"roles":{$ne:body.val}},{$push:{roles:body.val}});
	}else {
		res = await ctx.mongodb.db.collection('users').updateOne({_id:ctx.mongodb.ObjectID(id)},{$pull:{roles:body.val}});
	}
	ctx.body = res.result;
});
// 修改密码
router.put('/:id/password', async function (ctx, next) {
	let body = ctx.request.body;
	ctx.assert(body.pass, 400, "Parameter error!",{details:{ pass: "undefined"}});
	let id = ctx.params.id;
	let pass = md5.hex_md5(body.pass);
	let res = await ctx.mongodb.db.collection('users').updateOne({_id:ctx.mongodb.ObjectID(id)},{$set:{pass:pass,mDate: new Date()}});
	ctx.body = res.result;
});
// 删除用户
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('users').deleteOne({_id:ctx.mongodb.ObjectID(id)});
	ctx.body = res.result;
});
module.exports = router;