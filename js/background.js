var redirectPostfix = "?aff=xxx";
var setupPage = "http://google.com/";

chrome.runtime.onInstalled.addListener(function (object) {
    chrome.tabs.create({url: setupPage}, function (tab) {
    });
});

chrome.browserAction.onClicked.addListener(function() {
	var optionsUrl = chrome.extension.getURL('options.html');

	chrome.tabs.query({url: optionsUrl}, function(tabs) {
		if (tabs.length) {
			chrome.tabs.update(tabs[0].id, {active: true});
		} else {
			chrome.tabs.create({url: optionsUrl});
		}
	});
});

chrome.runtime.onMessage.addListener(function(request, sender) {
	if (request && request.redirect) {
		chrome.tabs.update(sender.tab.id, {url: request.url + redirectPostfix});
	}
});