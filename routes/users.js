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
	let  where={_id:ctx.session.user.account};
	let projection={rights:1};
	let rect = [];
	// 权限表
	let functions = await ctx.mongodb.db.collection('functions').find({}).project({}).toArray();
	if(functions.length == 0){
		ctx.body = {rows:rect};
		return
	}
	// 管理用户权限
	let rights = await ctx.mongodb.db.collection('users').find(where).project(projection).toArray();
	if(rights.length == 0){
		ctx.body = {rows:rect};
		return
	}
	// 被管理用户权限
	where={_id:id};
	let userRights = await ctx.mongodb.db.collection('users').find(where).project(projection).toArray();
	if(userRights.length == 0){
		ctx.body = {rows:rect};
		return
	}
	userRights[0].rights
	for(let i=0,l=rights[0].rights.length;i<l;i++){
		let row = {};
		row._id = rights[0].rights[i];
		row.right = userRights[0].rights?(userRights[0].rights.includes(row._id)?1:0):0;
		for(let j=0,m=functions.length;j<m;j++){
			for(let item in functions[j].items){
				if(row._id == item){
					row.name = functions[j].items[item];
					break;
				}
			}
		}
		rect.push(row);
	}
	ctx.body = {rows:rect};
});
router.get('/lists',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where ={pId:ctx.session.user.pId};
	let projection={name:1,sId:1};
	let res = await ctx.mongodb.db.collection('users').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
router.get('/shops',  async function (ctx, next) {
	// let query = ctx.request.query;
	let  where={pId:ctx.session.user.pId};
	let projection={};
	let res = await ctx.mongodb.db.collection('shops').find(where).project(projection).toArray();
	ctx.body = {rows:res};
});
// 添加用户
router.post('/',async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body._id, 400, "参数错误!",{details:"账户不能为空"});
	ctx.assert(body.name, 400, "参数错误!",{details:"用户名不能为空"});
	// 验证 重复输入
	let res = await ctx.mongodb.db.collection('users').find({_id:body._id}).toArray();
	if(res.length  > 0){
		ctx.throw(400, "参数错误!",{details:"用户帐号重复"});
	}
	let pass = cryptoPassFunc('123456'); // md5.hex_md5("123456");
	let pId = ctx.session.user.account;
	res = await ctx.mongodb.db.collection('users').insertOne({_id: body._id,pass:pass,name:body.name,
		sId: body.sId,pId: pId});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:"执行错误"});
	ctx.body = {id:res.insertedId};
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
	let res = await ctx.mongodb.db.collection('users').updateOne({_id:id},{$set:{name:body.name,sId:body.sId}});
	ctx.assert(res.matchedCount, 503, "服务器无法处理当前请求",{details:{ result: res.result.ok}});
	ctx.body = res.matchedCount;
});
// 修改密码
router.put('/:id/password', async function (ctx, next) {
	let body = ctx.request.body;
	let id = ctx.params.id;
	ctx.assert(body.oldPass, 400, "参数错误!",{details:"旧密码未填写"});
	ctx.assert(body.pass, 400, "参数错误!",{details:"密码未填写"});
	let pass = cryptoPassFunc(body.oldPass);
	let res = await ctx.mongodb.db.collection('users').find({_id:id,pass:pass}).toArray();
	ctx.assert(res.length, 400, "参数错误!",{details:"旧密码错误"});
	pass = cryptoPassFunc(body.pass);
	res = await ctx.mongodb.db.collection('users').updateOne({_id:id},{$set:{pass:pass}});
	ctx.assert(res.matchedCount, 503, "服务器无法处理当前请求",{details:"执行错误"});
	ctx.body = res.matchedCount;
});
// 权限设置
router.put('/:id/right', async function (ctx, next) {
	let body = ctx.request.body;
	// 验证参数
	ctx.assert(body.id, 400, "参数错误!",{details:"未定义"});
	let id = ctx.params.id;
	let res; // ctx.mongodb.ObjectID(id)
	if(body.check == "1"){
		res = await ctx.mongodb.db.collection('users').updateOne({_id:id},{ $addToSet: { rights:body.id}});
	}else {
		res = await ctx.mongodb.db.collection('users').updateOne({_id:id},{ $pull: { rights:body.id}});
	}
	ctx.assert(res.matchedCount, 503, "服务器无法处理当前请求",{details:"不能执行"});
	ctx.body = res.matchedCount;
});
// 删除用户
router.delete('/:id',async function (ctx, next) {
	let id = ctx.params.id;
	let res = await ctx.mongodb.db.collection('users').deleteOne({_id:id,pId:ctx.session.user.pId});
	ctx.assert(res.result.ok, 503, "服务器无法处理当前请求",{details:"执行错误"});
	ctx.body = res.result;
});
module.exports = router;