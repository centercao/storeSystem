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

router.prefix('/rights');
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('rights', {
		title:"权限管理",theme:ctx.session.user.theme
	});
});
// 获得登录权限
router.get('/:id',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where;
	let projection={};
	let rights;
	if(ctx.session.user.right.indexOf(0)!=-1){
		where={id:5}; // {"id":{"$in":[4,5]}}
		rights = await ctx.mongodb.db.collection('rights').find(where).project(projection).toArray();
	}else{
		where={$or:[]};
		ctx.session.user.right.forEach(function(v,i,a){
			let val ={id:v};
			where.$or.push(val);
		});
		rights = await ctx.mongodb.db.collection('rights').find(where).project(projection).toArray();
	}
	// 查找父节点
	where={id:{"$in":[]}}
	rights.forEach(function(v,i,a){
		where.id.$in.push(v.pId);
	});
	let res = await ctx.mongodb.db.collection('rights').find(where).project(projection).toArray();
	ctx.body = rights.concat(res);
});
// 获得信息(给管理员下面的用户赋权)
router.get('/list/:id',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:{ $ne : 0 } ,$or:[]};
	if(ctx.session.user.right.indexOf(0)!=-1){
		where={ pId : { $ne : 0 } };
	}else{
		ctx.session.user.right.forEach(function(v,i,a){
			var val ={id:v};
			where.$or.push(val);
		});
	}
	let projection={};
	let res = await ctx.mongodb.db.collection('rights').find(where).project(projection).toArray();
	let id = ctx.params.id;
	where = {account:id};
	projection = {right:1};
	let rights = await ctx.mongodb.db.collection('users').find(where).project(projection).toArray();
	res.forEach(function(v,i,a){
		if(rights[0].right  && rights[0].right.indexOf(v.id)!=-1){
			res[i].right = 1;
		}else {
			res[i].right = 0;
		}
	});
	ctx.body = {rows:res};
});
// 权限
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
// 修改
router.put('/:id', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.id, 400, "Parameter error!",{details:{ id: "undefined"}});
	let account = ctx.params.id;
	let res; // ctx.mongodb.ObjectID(id)
	if(body.check == "1"){
		res = await ctx.mongodb.db.collection('users').updateOne({account:account},{ $push: { right:Number(body.id)}});
	}else {
		res = await ctx.mongodb.db.collection('users').updateOne({account:account},{ $pull: { right:Number(body.id)}});
	}
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	// ctx.throw(503, "服务器无法处理当前请求",{details:{ result: res.result}});
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