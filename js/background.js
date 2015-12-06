var redirectPostfix = "aff=xxx";
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

chrome.webRequest.onBeforeRequest.addListener(function(details) {
    return detectRedirect(details);
}, {
    urls : ["*://*.amazon.com/*"],
    types: ["main_frame","sub_frame"]
}, ["blocking"]);

function detectRedirect(details) {
    var url = details.url;
    
    if (url == null) {
        return;
    }
    
    var http = "http://";
    var https = "https://";
    var amazonurl = "www.amazon.com";
	var smileurl = "smile.amazon.com";
    // ignore links with these strings in them
    var filter = "(sa-no-redirect=)|(redirect=true)|(redirect.html)|(r.html)|(/gp/dmusic/cloudplayer)|(/gp/wishlist)|(aws.amazon.com)|(sa-no-redirect\\%3D)";
    
    // Don't try and redirect pages that are in our filter
    if (url.match(filter) != null && (url.indexOf(redirectPostfix) > -1 || url.indexOf(redirectPostfix.replace('=','%3D')) > -1)) {
        return;
    }
	if (url.indexOf('signin?') > -1) {
		return;
	}

    if (url.match(http + amazonurl) != null) {
        // If this is the non-secure link...
        return redirectToSmile(http, amazonurl, url);
    } else if (url.match(https + amazonurl) != null) {
        // If this is the secure link...
        return redirectToSmile(https, amazonurl, url);
    } else if (url.match(http + smileurl) != null) {
		return redirectToSmile(http, smileurl, url);
	} else if (url.match(https + smileurl) != null) {
		return redirectToSmile(https, smileurl, url);
	}
}

function redirectToSmile(scheme, amazonurl, url) {
    var smileurl = "smile.amazon.com";
    return {
        // redirect to amazon smile append the rest of the url
        redirectUrl : scheme + smileurl + getRelativeRedirectUrl(scheme, amazonurl, url) + "&" + redirectPostfix
    };
}

function getRelativeRedirectUrl(scheme, amazonurl, url) {
    var relativeUrl = url.substring((scheme + amazonurl).length);
	alert(relativeUrl);
    var noRedirectIndicator = "sa-no-redirect=1";
    var paramStart = "?";
    var paramStartRegex = "\\" + paramStart;
    var newurl = null;

    // check to see if there are already GET variables in the url
    if (relativeUrl.match(paramStartRegex) != null) {
        newurl = relativeUrl + "&" + noRedirectIndicator;
    } else {
        newurl = relativeUrl + paramStart + noRedirectIndicator;
    }
    return newurl;
}