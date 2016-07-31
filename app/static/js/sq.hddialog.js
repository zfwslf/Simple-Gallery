(function($, SQ) {

    var $doc = $(document),
        $win = $(window);

    var Dialog = new SQ.Class(SQ.Widget);

    var maskTpl = '<div class="sq-dialog-masking" style="height: {$docHeight}px;"></div>'.replace("{$docHeight}", $doc.height()),
        dialogTpl = '<div class="sq-dialog {$className}">' +
            '<div class="sq-dialog-body">' +
            '<div class="sq-dialog-titlebar">' +
            '<div class="sq-dialog-titlebar-text">{$title}</div>' +
            '<a href="javascript:void(0);" title="关闭" class="sq-dialog-close">X</a>' +
            '</div>' +
            '<div class="sq-dialog-client">' +
            '<div class="sq-dialog-content" style="height: {$height};">' +
            '{$content}' +
            '</div>' +
            '</div>' +
            '{$button}' +
            '{$footer}' +
            '</div>' +
            ' </div>';

    Dialog.include({
        init: function(opts) {
            $.extend(this, {
                title: "温馨提示",
                content: "",
                // className: "hd-sqDialog-0", // 添加控制样式的类名;
                // top: 0,
                //width: 300,
                // height: 0,
                closeEvt: function() {},
                button: [],
                footer: "", // 弹窗底部注释/提示;
                mask: true
            }, opts || {});
            this.isHide = true;
            this.cssCache = null;

            this.render();
            this.event();
            // if (+this.top !== this.top) {
            //     this.scroll();
            // }
        },
        render: function() {
            var div = '<div style="display: none;"></div>';
            this.$el = $(div);
            $(document.body).append(this.$el);

            var html = (this.mask ? maskTpl : "") + dialogTpl,
                _height = this.height ? this.height + "px" : "auto";
            footer = this.footer ? '<div class="sq-dialog-footer">' + this.footer + '</div>' : "";
            html = html.replace("{$className}", this.className|| "" )
                .replace("{$height}", _height)
                .replace("{$title}", this.title)
                .replace("{$content}", this.content)
                .replace("{$button}", this.c_button())
                .replace("{$footer}", footer);

            this.$el.html($.trim(html));
            this.$box = this.$el.find(".sq-dialog");
        },
        event: function() {
            var ts = this,
                evtObj = this.evtObj;
            ts.$el.on("click", ".sq-dialog-close", function(e) {
                e.preventDefault();
                ts.hide();
                if (typeof ts.closeEvt === "function") {
                    ts.closeEvt();
                }
            }).on("click", ".sq-dialog-btn", function(e) {
                if (!ts.button.length) return; // 防止content的html代码里面含有类名为sq-dialog-btn的标签执行下面的点击事件代码;
                // 既有URL 也有callback的情况 跳转链接同时执行callback;
                if ($(this).data("cur") === "0") {
                    e.preventDefault();
                }
                var fn = evtObj[$(this).data("evtid")];
                fn.call(this, e, ts);
            });
        },
        // 生成按钮;
        c_button: function() {
            var html = "",
                tpl = '<a class="sq-dialog-btn sq-dialog-btn{$index}" href="{$url}" {$target} {$bindEvt} data-curl="{$m}" title="{$name}">{$name}</a>';
            arr = this.button,
            evtObj = {};
            if (arr.length) {
                for (var i = 0, len = arr.length; i < len; i++) {
                    var item = arr[i],
                        isFn = typeof item.callback == "function",
                        target = "",
                        bindEvt = "",
                        curl = "0",
                        url = "javascript:void(0);";
                    if (item.url) {
                        target = 'target="_blank"';
                        url = item.url;
                        // 既有URL 也有callback的情况;
                        isFn && (curl = "1");
                    }
                    if (isFn) {
                        bindEvt = 'data-evtid="' + i + '"';
                        evtObj[i] = item.callback;
                    }
                    this.evtObj = evtObj;
                    html += tpl.replace("{$target}", target)
                        .replace("{$url}", url)
                        .replace("{$index}", i)
                        .replace("{$bindEvt}", bindEvt)
                        .replace("{$m}", curl)
                        .replace(/\{\$name\}/g, item.txt);
                }
                html = '<div class="sq-dialog-buttons">' + html + '</div>';
            }
            return html;
        },
        // 设置弹窗样式;
        setCss: function(top) {

            if (!this.cssCache) {
                this.cssCache = {
                    width: this.width || this.$box.width(),
                    height: this.$box.height()
                };
            }
            var cssCache = this.cssCache,
                height = cssCache.height,
                width = cssCache.width,
                // 弹窗的top值: 优先使用参数top的值 其次是全局参数this.top 最后是计算后浏览器窗口的垂直居中点的值;
                tp = (+top === top) ? top : ((+this.top === this.top) ? this.top : $win.scrollTop() + $win.height() / 2 - height / 2);

            this.$box.css({
                "top": tp,
                "left": "50%",
                "width": width,
                "height": height,
                "margin-left": -width / 2
            });
        },

        show: function(top) {
            this.$el.show();
            this.setCss(top);
            this.isHide = false;
            return this;
        },
        hide: function() {
            this.$el.hide();
            this.isHide = true;
            return this;
        },
        // 滚动或窗口缩放时，自动调整弹窗位置;
        scroll: function() {
            var ts = this,
                $box = this.$box,
                height = ts.$box.height(),
                timeId = 0;
            $win.on("scroll.sq-dialog resize.sq-dialog", function() {
                if (ts.isHide) return;
                clearTimeout(timeId);
                timeId = setTimeout(function() {
                    $box.animate({
                        "top": $win.scrollTop() + $win.height() / 2 - $box.height() / 2
                    }, 200);
                }, 150);
            });
        },

        destroy: function() {
            this.$el.off("click", ".sq-dialog-close")
                .off("click", ".sq-dialog-btn[href^=javascript]");
            $win.off("scroll.sq-dialog resize.sq-dialog");

            this.$el.remove();
        }
    });

    SQ.hdDialog = Dialog;

})(jQuery, SQ);