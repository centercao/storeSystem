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
const crypto = require('crypto');
router.prefix('/users');
function cryptoPassFunc (password) {
	const md5 = crypto.createHash('md5'); //'sha1', 'md5', 'sha256', 'sha512'等
	return md5.update(password).digest('hex');
}
// 返回用户页面
router.get('/',  async function (ctx, next) {
	await ctx.render('users', {
		title:"用户管理",theme:ctx.session.user.theme
	});
});
router.get('/rightsPage',  async function (ctx, next) {
	await ctx.render('rightsPage', {
		title:"权限管理",theme:ctx.session.user.theme
	});
});
// 获得信息
router.get('/rightsItems/:id',  async function (ctx, next) {
	// let query = ctx.request.query;
	let id = ctx.params.id;
	let rect = [];
	// 管理用户权限
	let rights = await ctx.redis.smembers('r:' + ctx.session.user.account);
	if(rights.length == 0){
		ctx.body = {rows:rect};
		return
	}
	// 被管理用户权限
	let userRights = await ctx.redis.smembers('r:' + id);
	for(let i=0,l=rights.length;i<l;i++){
		let row = {};
		row._id = rights[i];
		row.right = userRights.includes(row._id)?1:0;
		row.name = await ctx.redis.hget('f:' + row._id,'n');
		rect.push(row);
	}
	ctx.body = {rows:rect};
});
// 用户列表
router.get('/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let res = await ctx.redis.keys('u:*');
	let items = [];
	for(let i in res){
		let item ={};
		let user =  await ctx.redis.hgetall(res[i]);
		item._id = res[i].split(':')[1];
		item.name = user.n;
		item.sId  = user.s;
		items.push(item);
	}
	ctx.body = {rows:items};
});
router.get('/shops',  async function (ctx, next) {
	// let query = ctx.request.query;
	let res = await ctx.redis.keys('sh:*');
	let items = [];
	for(let i in res){
		let item ={};
		item._id = res[i].split(':')[1];
		item.name = await ctx.redis.get(res[i]);
		items.push(item);
	}
	ctx.body = {rows:items};
});
// 添加用户
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body._id, 400, "参数错误!",{details:"账户不能为空"});
	ctx.assert(body.name, 400, "参数错误!",{details:"用户名不能为空"});
	// 验证 重复输入
	let res = await ctx.redis.exists('u:' + body._id);
	ctx.assert(!res,400, "参数错误!",{details:"用户帐号重复"});
	let pass = cryptoPassFunc('123456'); // md5.hex_md5("123456");
	let data = {
		n:body.name,
		s:body.sId,
		p:pass
	};
	let msg ={
		t:'c',
		_id:body._id,
		data:data
	};
	res = await ctx.mqtt.publish("ju7ygfa8001Qiha/u",JSON.stringify(msg) ,{qos:1});
	// res = await ctx.redis.hmset('u:'+ body._id,{n:body.name,p:pass,s:body.sId});
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"不能执行操作"});
	ctx.body = {id:body._id};
});
router.put('/', async function (ctx, next) {
	ctx.body = {};
});
// 修改用户名
router.put('/:id/name', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.name, 400, "参数错误!",{details:"名字未填写"});
	let id = ctx.params.id;
	let data = {
		n:body.name,
		s:body.sId
	};
	let msg ={
		t:'u',
		_id:id,
		data:data
	};
	let res = await ctx.mqtt.publish("ju7ygfa8001Qiha/u",JSON.stringify(msg) ,{qos:1});
	// let res = await ctx.redis.hmset('u:'+ id,{'n':body.name,'s':body.sId});
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"不能执行操作"});
	ctx.body = 1;
});
// 修改密码
router.put('/:id/password', async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id;
	ctx.assert(body.oldPass, 400, "参数错误!",{details:"旧密码未填写"});
	ctx.assert(body.pass, 400, "参数错误!",{details:"密码未填写"});
	let pass = cryptoPassFunc(body.oldPass);
	let res = await ctx.redis.hget('u:' + id,'p');
	ctx.assert((res == pass), 400, "参数错误!",{details:"旧密码错误"});
	pass = cryptoPassFunc(body.pass);
	let data = {
		p:pass
	};
	let msg ={
		t:'u',
		_id:id,
		data:data
	};
	res = await ctx.mqtt.publish("ju7ygfa8001Qiha/u",JSON.stringify(msg) ,{qos:1});
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"不能执行操作"});
	// await ctx.redis.hset('u:' + id ,'p' , pass);
	ctx.body = 1;
});
// 权限设置
router.put('/:id/right', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.id, 400, "参数错误!",{details:"未定义"});
	let id = ctx.params.id;
	/*let res; // ctx.mongodb.ObjectID(id)
	if(body.check == "1"){
		res = await ctx.redis.sadd('r:' + id ,body.id);
	}else {
		res = await ctx.redis.srem('r:' + id ,body.id);
	}*/
	let data = {
		id:body.id
	};
	let msg ={
		t:'r',
		c:body.check,
		_id:id,
		data:data
	};
	let res = await ctx.mqtt.publish("ju7ygfa8001Qiha/r",JSON.stringify(msg) ,{qos:1});
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"不能执行操作"});
	ctx.body = res;
});
// 删除用户
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	// let res = await ctx.redis.del('u:' + id);
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"执行错误"});
	let msg ={
		t:'d',
		_id:id
	};
	let res = await ctx.mqtt.publish("ju7ygfa8001Qiha/u",JSON.stringify(msg) ,{qos:1});
	// res = await ctx.redis.del('r:' + id);
	ctx.assert(res, 503, "服务器无法处理当前请求",{details:"执行错误"});
	ctx.body = res;
});
module.exports = router;