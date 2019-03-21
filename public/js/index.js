function runAjax(type,url,data,backFun,async=false){
	$.ajax({
		cache: true,
		type: type,
		timeout: 2000,
		url: url,
		data: data,
		async: async , // 异步
		error: function (xhr, statusText, errorThrown) { // XMLHttpRequest
			// alert("错误提示： status:" + xhr.status + " responseText:" + xhr.responseText);
			if(data.indexOf('html') != -1) {
				window.location.href = '/login';
				return;
			}
			backFun('error',xhr.responseText);
		},
		success: function (result, statusText, xhr) {
			if(typeof(result) == 'string' && result.indexOf('html') != -1) {
				window.location.href = '/login';
				return;
			}
			backFun('',result);
		}
	});
}
function pageSize() {
	let winW, winH;
	if(window.innerHeight) {// all except IE
		winW = window.innerWidth;
		winH = window.innerHeight;
	} else if (document.documentElement && document.documentElement.clientHeight) {// IE 6 Strict Mode
		winW = document.documentElement.clientWidth;
		winH = document.documentElement.clientHeight;
	} else if (document.body) { // other
		winW = document.body.clientWidth;
		winH = document.body.clientHeight;
	}  // for small pages with total size less then the viewport
	return {WinW:winW, WinH:winH};
}
function toDecimal(x,places=2) {
	var n = Math.pow(10,places);
	var f = parseFloat(x);
	if (isNaN(f)) {
		return;
	}
	f = Math.round(x*n)/n;
	return f;
}
function GetQueryString(name) {
	var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
	var r = window.location.search.substr(1).match(reg);
	if(r!=null)return  unescape(r[2]); return null;
}
Date.prototype.format = function(fmt) {
	var o = {
		"M+": this.getMonth() + 1, //月份
		"d+": this.getDate(), //日
		"h+": this.getHours(), //小时
		"m+": this.getMinutes(), //分
		"s+": this.getSeconds(), //秒
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度
		"S": this.getMilliseconds() //毫秒
	};
	if(/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for(var k in o)
		if(new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
};
function trim(s){
	return s?s.replace(/(^\s*)|(\s*$)/g, ""):null;
}
var common = {
	confirm:function(id,msg,callback) {
		$("#" + id).html("<p class='message'>"+msg+"</p>");
		$("#"+ id).dialog({
			resizable: false,
			modal: true,
			overlay: {
				backgroundColor: '#000',
				opacity: 0.5
			},
			buttons: {
				'确认': function() {
					callback.call();
					$(this).dialog('close');
				},
				'取消': function() {
					$(this).dialog('close');
				}
			}
		});
	}
};
function weekIndexInMonth (date) {
	var date = new Date(date),
		w = date.getDay(),
		d = date.getDate();
	return Math.ceil((d + 6 - w) / 7);
}
