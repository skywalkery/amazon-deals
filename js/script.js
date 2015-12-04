// remove all expired deals from the storage on start
chrome.storage.sync.get(null, function(items) {
	for (var key in items) {
		if (key === 'expire') continue;
		removeIfExpired(key, items[key]);
	}	
});

// get the deal's timestamp and if it was more then value ago, then remove it from storage
function removeIfExpired(id, deal, callback) {
	if (deal && deal.timestamp) {
		var now = new Date().getTime();
		var diff = now - deal.timestamp;
		chrome.storage.sync.get('expire', function(result) {
			var expire = parseInt(result.expire, 10) * 24 * 60 * 60 * 1000;
			var expired = diff >= expire;
			if (expired) {
				chrome.storage.sync.remove(id);
			}
			callback && callback(expired);
		});
	} else {
		callback && callback(true);
	}
}

// check that element has class
function hasClass(element, cls) {
	return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

// add the big cross on top of disabled deal
function addDisabledStyle(element, style) {
	var crossDiv = document.createElement('div');
	var img = document.createElement('img');
	img.src = chrome.extension.getURL('ico/bigX.png');
	img.className = 'ad-img-x';
	
	crossDiv.className = 'ad-cross';
	var outerDiv;
	if (style === 1) {
		outerDiv = crossDiv;
	} else if (style === 2 || style === 3) {
		crossDiv.className += ' ad-cross-small';
		var outerDiv = document.createElement('div');
		outerDiv.style.position = 'absolute';
		outerDiv.style.top = '10px';
		outerDiv.style['padding-left'] = '15px';
		outerDiv.appendChild(crossDiv);
	}
	crossDiv.appendChild(img);
	
	element.appendChild(outerDiv);
	element.style.opacity = 0.5;
}

// utility function for more easy elements removing
Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}

// utility function for more easy elements removing
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

// utility function for create dom from string
String.prototype.toDOM=function(){
	var d=document
	 ,i
	 ,a=d.createElement("div")
	 ,b=d.createDocumentFragment();
	a.innerHTML=this;
	while(i=a.firstChild)b.appendChild(i);
	return b;
};

function getElementsById(tag, elementID){
    var elementCollection = new Array();
    var allElements = document.getElementsByTagName(tag);
    for(i = 0; i < allElements.length; i++){
        if(allElements[i].id == elementID)
            elementCollection.push(allElements[i]);

    }
    return elementCollection;
}

// remove the big cross from top of disabled deal
function removeDisabledStyle(element) {
	element.getElementsByClassName('ad-cross').remove();
	element.style.opacity = 1;
}

// create button which disable or enable the deal
function createBtn(node, dealContainer, dealId, isDisabled, style) {
	var parent = node;
	if (hasClass(node, 'dealContainer')) {
		parent = node.parentElement;
	}
	
	var button = document.createElement('button');
	button.innerHTML = isDisabled ? '✓' : 'X';
	button.className = 'ad-btn';
	if (style === 1) {
		button.className += ' ad-btn-big';
	} else if (style === 2) {
		button.className += ' ad-btn-small';
	} else if (style === 3) {
		button.className += ' ad-btn-small';
		button.className += ' ad-btn-offset';
	}
	
	if (!isDisabled) {
		button.className += ' ad-btn-disable';
		
		button.onclick = function() {
			// add big cross on top of deal
			addDisabledStyle(dealContainer, style);
			
			// add deal with the current timestamp to the storage
			var deal = {};
			deal[dealId] = {timestamp: new Date().getTime()}; 
			chrome.storage.sync.set(deal);
			
			// change button to enable
			parent.getElementsByClassName('ad-btn').remove();
			createBtn(node, dealContainer, dealId, true, style);
		};
	} else {
		button.className += ' ad-btn-enable';
		
		button.onclick = function() {
			// remove big cross from top of deal
			removeDisabledStyle(dealContainer);
			
			// remove deal from the storage
			chrome.storage.sync.remove(dealId);
			
			// change button to disable
			parent.getElementsByClassName('ad-btn').remove();
			createBtn(node, dealContainer, dealId, false, style);
		};
	}
	
	parent.insertBefore(button, parent.firstChild);
}

function createMarkPanel() {
	if (document.querySelector('#amdealsMenu')) {
		return;
	}
	
	document.body.appendChild('<ul id="amdealsMenu">\
		<li><a href="#">Amazon deals</a>\
	</ul>'.toDOM());
	
	document.body.appendChild('<nav id="c-menu--slide-right" class="c-menu c-menu--slide-right">\
	  <button class="c-menu__close">&larr; Close Menu</button>\
	  <ul class="c-menu__items">\
		<li id="adMarkAll" class="c-menu__item"><a href="#" class="c-menu__link">Mark all</a></li>\
		<li id="adUnmarkAll" class="c-menu__item"><a href="#" class="c-menu__link">Unmark all</a></li>\
	  </ul>\
	</nav>'.toDOM());
	
	document.body.appendChild('<div id="c-mask" class="c-mask"></div>'.toDOM());
	
	var slideRight = new Menu({
		wrapper: 'body',
		type: 'slide-right',
		menuOpenerClass: '.c-button',
		maskId: '#c-mask'
	});

	var slideRightBtn = document.querySelector('#amdealsMenu');

	slideRightBtn.addEventListener('click', function(e) {
		e.preventDefault;
		slideRight.open();
	});
	
	var markAllBtn = document.querySelector('#adMarkAll');
	markAllBtn.addEventListener('click', clickAllDisableButtons);
	
	var unmarkAllBtn = document.querySelector('#adUnmarkAll');
	unmarkAllBtn.addEventListener('click', clickAllEnableButtons);
}

function clickAllDisableButtons(e) {
	e.preventDefault;
	var btns = document.getElementsByClassName('ad-btn-disable');
	for(var i = btns.length - 1; i >= 0; i--) {
        btns[i].click();
    }
}

function clickAllEnableButtons(e) {
	e.preventDefault;
	var btns = document.getElementsByClassName('ad-btn-enable');
	for(var i = btns.length - 1; i >= 0; i--) {
        btns[i].click();
    }
}

// process the deal element and add extra button and style
function processDealNode(node) {
	// just in case
	// doesn't process if we already have the extra button for this deal
	var parent = node;
	if (hasClass(node, 'dealContainer')) {
		parent = node.parentElement;
	}
	if (parent.getElementsByClassName('ad-btn').length > 0) return;

	var dealId;
	
	// get the deal id from the data attribute
	var spans = node.getElementsByClassName('a-declarative');
	for (var j = 0, spansLen = spans.length; j < spansLen; j++) {
		var dataAttrs = [].filter.call(spans[j].attributes, function(at) { return /^data-gbdeal/.test(at.name); });
		dataAttrs.forEach(function(dataAttr){
			var value = JSON.parse(dataAttr.value);
			dealId = value.dealID;
		});
	}
	
	// find inner deal container in the node
	var deals = node.getElementsByClassName('dealTile');
	if (deals.length) {
		addStyleAndButton(dealId, parent, deals[0], 1);
	}
}

function processDealNode2(node) {
	// just in case
	// doesn't process if we already have the extra button for this deal
	var parent = node.parentElement;
	if (parent.getElementsByClassName('ad-btn').length > 0) return;

	// get the deal id
	var spans = parent.querySelectorAll("#dealTimeRemaining>span");
	if (spans.length < 2) return;
	var spanId = spans[1].id;
	var dealId = spanId.substring(0, spanId.indexOf('_'));
	
	addStyleAndButton(dealId, parent, parent, 2);
}

function processDealNode3(node) {
	// just in case
	// doesn't process if we already have the extra button for this deal
	var parent = node;
	if (parent.getElementsByClassName('ad-btn').length > 0) return;

	// get the deal id
	var title = parent.querySelectorAll(".title");
	if (title.length === 0) return;
	var href = title[0].href;
	var dealId = href.substring(href.indexOf('product/') + 8, href.indexOf('/ref'));
	
	addStyleAndButton(dealId, parent, parent, 3);
}

function processDealNode4(node) {
	// just in case
	// doesn't process if we already have the extra button for this deal
	var parent = node.parentElement;
	if (parent.getElementsByClassName('ad-btn').length > 0) return;

	// get the deal id
	var spans = parent.querySelectorAll("#timerContent>span");
	if (spans.length < 2) return;
	var spanId = spans[1].id;
	var dealId = spanId.substring(0, spanId.indexOf('_'));
	
	addStyleAndButton(dealId, parent, parent, 2);
}

function processDealNode5(node) {
	// just in case
	// doesn't process if we already have the extra button for this deal
	var parent = node.parentElement;
	if (parent.getElementsByClassName('ad-btn').length > 0) return;

	var dealId;
	// get the deal id
	var dataAttrs = [].filter.call(parent.attributes, function(at) { return /^data-asin/.test(at.name); });
	dataAttrs.forEach(function(dataAttr){
		dealId = dataAttr.value;
	});
	
	addStyleAndButton(dealId, parent, parent, 1);
}

function processDealNode6(node) {
	// just in case
	// doesn't process if we already have the extra button for this deal
	var parent = node;
	if (parent.getElementsByClassName('ad-btn').length > 0) return;

	// get the deal id
	var dealId = node.id.substring(11);
	
	addStyleAndButton(dealId, parent, parent, 1);
}

function processDealNode7(node) {
	// just in case
	// doesn't process if we already have the extra button for this deal
	var parent = node;
	if (parent.getElementsByClassName('ad-btn').length > 0) return;

	// get the deal id
	var img = parent.querySelectorAll(".acs-wtfl-image>a");
	if (img.length === 0) return;
	var href = img[0].href;
	var dealId = href.substring(href.indexOf('dp/') + 3, href.indexOf('/ref'));
	
	addStyleAndButton(dealId, parent, parent, 1);
}

function processDealNode8(node) {
	// just in case
	// doesn't process if we already have the extra button for this deal
	var parent = node;
	if (hasClass(node, 'p-prod-tile-type-carousel')) {
		parent = node.parentElement;
	}
	if (parent.getElementsByClassName('ad-btn').length > 0) return;

	// get the deal id
	var link = parent.querySelectorAll(".p-prod-tile-title>a");
	if (link.length === 0) return;
	var href = link[0].href;
	var dealId = href.substring(href.indexOf('dp/') + 3, href.indexOf('/ref'));
	
	addStyleAndButton(dealId, parent, parent, 1);
}

function addStyleAndButton(dealId, parent, currDeal, style) {
	chrome.storage.sync.get(dealId, function(result){
		var storageDeal = result[dealId];
		
		// check if this deal was expired
		removeIfExpired(dealId, storageDeal, function(enabled) {
			if (!enabled) {
				// add disabled deal style
				addDisabledStyle(currDeal, style);
			}
			
			if (parent.getElementsByClassName('ad-btn').length > 0) return;
			// create extra button
			createBtn(parent, currDeal, dealId, !enabled, style);
		});
	});
	
	createMarkPanel();
}

// observer for tracking new deals which will be created from the javascript
var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		if (!mutation.addedNodes) return;

		for (var i = 0, len = mutation.addedNodes.length; i < len; i++) {
			var node = mutation.addedNodes[i];
			
			if (hasClass(node, 'singleCell') || hasClass(node, 'dealContainer')) {
				processDealNode(node);
			} else if (node.id === 'dealHoverContent') {
				processDealNode2(node);
			} else if (hasClass(node, 'asin') && hasClass(node, 'fluid')) {
				processDealNode3(node);
			} else if (node.id === 'dealImageContent') {
				processDealNode4(node);
			} else if (hasClass(node, 'coupon')) {
				processDealNode6(node);
			} else if (hasClass(node, 'acs-wtfl-card')) {
				processDealNode7(node);
			} else if (hasClass(node, 'a-carousel-card') || (hasClass(node, 'p-prod-tile') && hasClass(node, 'p-prod-tile-type-carousel'))) {
				processDealNode8(node);
			}
		}
  });
});

document.addEventListener("DOMContentLoaded", function(){
	// Amazon deals are dynamically created from the javascript,
	// so we can not just get DOM at this point, because we don't know,
	// when they will be created
	observer.observe(document.body, {
		childList: true
	  , subtree: true
	  , attributes: false
	  , characterData: false
	});
	
	// process already created deals at this point, others will be processed through the observer
	var deals = document.getElementsByClassName('singleCell');
	for (var i = 0, len = deals.length; i < len; i++) {
		processDealNode(deals[i]);
	}
	
	deals = document.getElementsByClassName('dealView');
	for (var i = 0, len = deals.length; i < len; i++) {
		processDealNode(deals[i]);
	}
	
	deals = getElementsById('div', 'dealHoverContent');
	for (var i = 0, len = deals.length; i < len; i++) {
		processDealNode2(deals[i]);
	}
	
	deals = getElementsById('div', 'dealImageContent');
	for (var i = 0, len = deals.length; i < len; i++) {
		processDealNode4(deals[i]);
	}
	
	deals = document.getElementsByClassName('asin');
	for (var i = 0, len = deals.length; i < len; i++) {
		processDealNode3(deals[i]);
	}
	
	deals = document.getElementsByClassName('s-item-container');
	for (var i = 0, len = deals.length; i < len; i++) {
		processDealNode5(deals[i]);
	}
	
	deals = document.getElementsByClassName('coupon');
	for (var i = 0, len = deals.length; i < len; i++) {
		processDealNode6(deals[i]);
	}
	
	deals = document.getElementsByClassName('acs-wtfl-card');
	for (var i = 0, len = deals.length; i < len; i++) {
		processDealNode7(deals[i]);
	}
	
	deals = document.getElementsByClassName('a-carousel-card');
	for (var i = 0, len = deals.length; i < len; i++) {
		processDealNode8(deals[i]);
	}
});