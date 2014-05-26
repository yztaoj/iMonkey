// The MIT License (MIT)

// Copyright (c) 2014 yztaoj

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
function extend(destination, source) {
  for (var property in source) {
    destination[property] = source[property];
  }
  return destination;
}

function log(content){
	var out = content.toString();
	if(typeof content == "object")
		out += " :"+JSON.stringify(content);

	UIALogger.logMessage(out);
}

extend(UIATarget.prototype, {
	waitReaction: function(preDelay){
		this.pushTimeout(0);

		var oldBID = this.frontMostApp().bundleID();
		
		if(preDelay) this.delay(preDelay);

		var counter = 300; // 30 seconds
		while(counter--){
			var app = this.frontMostApp();
			var newBID = app.bundleID();
			if(newBID != oldBID) {
				this.popTimeout();
				throw "app jumped out!!! "+newBID;
			}

			if(!app.mainWindow().inProgress())
				break;
			else
				this.delay(0.1);
		}

		if (counter == 0) log("waitReaction timeout!");
		
		this.popTimeout();
	}
});

extend(UIAElement.prototype, {
	findButton: function(name){
		function finder(element){
			if(element instanceof UIAButton &&
				element.name() == name &&
				element.isVisible()) return true;
			return false;
		}
		return this.traverse(finder);
	},

	findTextField: function(){
		function finder(element){
			if(element instanceof UIATextField &&
				element.isVisible()) return true;
			return false;
		}
		return this.traverse(finder);
	},

	findSecTextField: function(){
		function finder(element){
			if(element instanceof UIASecureTextField &&
				element.isVisible()) return true;
			return false;
		}
		return this.traverse(finder);
	},

	inspect: function (){
		var elements = this.elements();
		var len = elements.length;
		for(var i = 0; i < len; i++){
			if(elements[i].isVisible())
				elements[i].inspect();
		}
		this.logElement();
	},

	isFullScreen: function(){
		var rect = this.rect();
		var screenRect = this.ancestry()[0].rect();
		return (rect.size.x == screenRect.size.x && 
			rect.size.y == screenRect.size.y)
	},

	isIndicator: function(){
		if(this instanceof UIAProgressIndicator ||
			this instanceof UIAActivityIndicator ||
			this instanceof UIAPageIndicator)
			return true;
		return false;
	},

	traverse: function(func){
		if(func(this)) return this;

		var elements = this.elements();
		if(elements instanceof UIAElementNil) return false;

		for(var i=0; i<elements.length; i++){
			var ret = elements[i].traverse(func);
			if(ret) return ret;
		}
		return false;
	},

	inProgress: function(){
		return this.traverse(function(element){
			if(!element.isVisible()) return false;

			if(element instanceof UIAActivityIndicator ||
				element instanceof UIAProgressIndicator){
				return true;
			}

			return false;
		});
	},

	signature: function(){
		var ancestry = this.ancestry();
		var parent = ancestry[ancestry.length-2];
		var tmp = "";
		var position = parent.childPosition(this);
		for(var i = 0; i< ancestry.length; i++){
			tmp += ancestry[i].toString()+"->";
		}
		return tmp+"name:"+this.name()+position;//+":"+this.value()+":"+this.label();
	},

	sameElement: function(target){
		if(this.toString() != target.toString() ||
			this.name() != target.name() ||
			this.value() != target.value() ||
			this.label() != target.label())
			return false;

		//UI element with same location
		var selfRect = this.rect();
		var targetRect = target.rect();
		if(selfRect.size.width != targetRect.size.width ||
			selfRect.size.height != targetRect.size.height ||
			selfRect.origin.x != targetRect.origin.x ||
			selfRect.origin.y != targetRect.origin.y)
			return false;

		var childsL = this.elements();
		var childsR = target.elements();
		var len = childsL.length;
		if(len != childsR.length) return false;

		for(var i = 0; i < len; i++){
			if(!childsL[i].sameElement(childsR[i])) return false;
		}

		return true;
	},

	childPosition: function(child){
		var childs = this.elements();
		var len = childs.length;
		var i = 0;
		for(; i < len; i++){
			if(child.sameElement(childs[i])){
				i++;
				break;
			}
		}
		return i+"/"+len;
	}
});
