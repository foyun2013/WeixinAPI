window.WeixinAPI = (function() {
    var events = {};
    var isReady = false;
    var wxData;
    var generalHandler;

    var wxInvokes = {
        sendAppMessage: function(action) {
            WeixinJSBridge.invoke(action, {
                'appid': wxData.appId || '',
                'img_url': wxData.imgUrl,
                'link': wxData.link,
                'desc': wxData.desc,
                'title': wxData.title,
                'img_width': '640',
                'img_height': '640'
            }, wrapWxInvokeCallback(action));
        },
        shareTimeline: function(action) {
            WeixinJSBridge.invoke(action, {
                'appid': wxData.appId || '',
                'img_url': wxData.imgUrl,
                'link': wxData.link,
                'desc': wxData.desc,
                'title': wxData.title,
                'img_width': '640',
                'img_height': '640'
            }, wrapWxInvokeCallback(action));
        },
        generalShare: function(action) {
            generalHandler.generalShare({
                'appid': wxData.appId || '',
                'img_url': wxData.imgUrl,
                'link': wxData.link,
                'desc': wxData.desc,
                'title': wxData.title,
                'img_width': '640',
                'img_height': '640'
            }, wrapWxInvokeCallback(action));
        }
    };

    function ready(data, callback) {
        var self = this;
        wxData = data || {};
        if (!isReady) {
            var _wxBridgeReady = function () {
                wxBridgeReady(self, callback);
            };
            if ('addEventListener' in document) {
                document.addEventListener('WeixinJSBridgeReady', _wxBridgeReady, false);
            } else if (document.attachEvent) {
                document.attachEvent('WeixinJSBridgeReady', _wxBridgeReady);
                document.attachEvent('onWeixinJSBridgeReady', _wxBridgeReady);
            }
        } else if (callback) {
            callback.call(null, self);
        }
        return self;
    }

    function wxBridgeReady(context, callback) {
        isReady = true;
        WeixinJSBridge.on('menu:share:appmessage', function() {
            wxShare('sendAppMessage');
        });
        WeixinJSBridge.on('menu:share:timeline', function() {
            wxShare('shareTimeline');
        });
        WeixinJSBridge.on('menu:general:share', function(general) {
            generalHandler = general;
            wxShare('generalShare');
        });
        if (callback) callback.call(null, context);
    }

    function wxShare(action) {
        if (isReady) {
            fireEvent(getEventName(action, 'ready'));
            fireEvent('ready');
            wxInvokes[action].call(null, action);
        }
    }
    
    function wrapWxInvokeCallback(action) {
        return function(resp) {
            wxInvokeCallback(action, resp);
        };
    }

    function wxInvokeCallback(action, resp) {
        var msg = resp.err_msg;
        var result;
        if (/:cancel$/.test(msg)) {
            result = 'cancel';
        } else if (/:(confirm|ok)$/.test(msg)) {
            result = 'ok';
        } else {
            result = 'fail';
        }
        fireEvent(getEventName(action, result), [msg]);
        fireEvent(result, [msg]);
        fireEvent(getEventName(action, 'complete'), [msg]);
        fireEvent('complete', [msg]);
    }

    function getEventName(action, event) {
        var prefix;
        if (action == 'sendAppMessage') {
            prefix = 'appmessage';
        } else if (action == 'shareTimeline') {
            prefix = 'timeline';
        } else if (action == 'generalShare') {
            prefix = 'general';
        }
        return prefix + ':' + event;
    }

    function addListener(eventName, callback) {
        if (typeof eventName === 'string') {
            events[eventName] = events[eventName] || [];
            if (callback) {
                events[eventName].push(callback);
            }
        } else {
            for (var o in eventName) {
                addListener(o, eventName[o]);
            }
        }
    }

    function removeListener(eventName, callback) {
        if (typeof eventName === 'string') {
            if (events[eventName]) {
                for (var i = 0, len = events[eventName].length; i < len; i++) {
                    if (!callback || events[eventName][i] === callback) {
                        events[eventName].splice(i, 1);
                        return;
                    }
                }
            }
        } else {
            for (var o in eventName) {
                removeListener(o, eventName[o]);
            }
        }
    }

    function fireEvent(eventName, args) {
        if (events[eventName]) {
            for (var i = 0, len = events[eventName].length; i < len; i++) {
                var eventCb = events[eventName][i];
                if (eventCb && eventCb.apply(null, args || []) === false) {
                    return;
                }
            }
        }
    }

    return {
        /**
         * 初始化
         * @param {Object} wxData
         */
        ready: ready,
        
        /**
         * 绑定事件
         * @param {String} eventName
         * @param {String} callback
         *
         * 支持事件：
         *  - ready
         *  - cancel
         *  - ok
         *  - fail
         *  - complete
         */
        on: addListener,

        /**
         * 解绑事件
         * @param {String} eventName
         * @param {String} callback
         */
        off: removeListener
    };
}());