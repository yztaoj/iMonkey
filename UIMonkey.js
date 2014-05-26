#import "UIAExtention.js"
#import "UIAutoMonkey.js"
#import "config.js"


function UIMonkey(target){
	this.device = target;
	this.app = target.frontMostApp();
	this.his = {};
	this.targets = [];
	this.config = config;
	return this;
}

extend(UIMonkey.prototype, {
	login: function(secText){
		function getTextField(parent){
			var tmp = parent.textFields().firstWithPredicate("isEnabled == 1");

			if (tmp.isValid() && tmp.isVisible()) return tmp;

			return parent.parent().findTextField();
		}

		//retry limit
		var retryLimit = 20;
		if(!retryLimit--) return "login too much";

		//see if it's possible
		if(!this.config || this.config.usr == "") return "impossible";

		//get necessary params
		var mainWindow = this.app.mainWindow();
		var textField = getTextField(secText.parent());
		if(!textField) return "can't find textField";
		var loginButton = mainWindow.findButton("登录");
		if(!loginButton || !loginButton.isVisible()) loginButton = mainWindow.findButton(null);
		if(!loginButton || !loginButton.isVisible()) return "can't find login button";

		//do the login work
		textField.setValue(this.config.login.usr);

		secText.tap();
		this.device.delay(0.5);
		var keyboard = this.app.keyboard();
		if(keyboard.isValid() && secText.hasKeyboardFocus()){
			secText.setValue("");
			keyboard.typeString(this.config.login.psw);
		}
		else{
			secText.setValue(this.config.login.psw);
		}
		loginButton.tap();

		//wait for login complete
		var result = "success";
		this.device.pushTimeout(4);
		if(!loginButton.waitForInvalid()){
			this.config.loginFailure = 100;
			result = "login timeout";
		}
		this.device.popTimeout();

		//wait for login complete
		var cancelButton = mainWindow.buttons()["返回"];
		if(cancelButton.isValid() && cancelButton.isVisible()) cancelButton.tap();
		return result;
	},

	dismissWelcome: function(){
		this.device.pushTimeout(0.5);
		this.app.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
		this.app.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
		this.app.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
		this.app.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
		this.app.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
		this.device.popTimeout();
	},

	releaseMonkey: function(){
		while(true){
			UIAutoMonkey.triggerRandomEvent();
			UIAutoMonkey.delay();
			var win = this.app.mainWindow();
			this.device.pushTimeout(0);
			var secText = win.findSecTextField();
			if(secText)
				this.login(secText);
			this.device.popTimeout();
		}
	}
});

var monkey = new UIMonkey(UIATarget.localTarget());
monkey.dismissWelcome();
monkey.releaseMonkey();
