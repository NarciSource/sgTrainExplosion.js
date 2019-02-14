// ==UserScript==
// @name         sgTrainExplosion
// @namespace    sgTX
// @version      0.1.0
// @description  The explosion is art.
// @author       narci <jwch11@gmail.com>
// @match        *://www.steamgifts.com/giveaway/*
// @icon         https://raw.githubusercontent.com/NarciSource/sgTrainExplosion.js/master/img/logo.png
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.8.0/jquery.contextMenu.js
// @resource     cm-style https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.8.0/jquery.contextMenu.css
// @resource     tx-style https://raw.githubusercontent.com/NarciSource/sgTrainExplosion.js/master/css/default.css
// @resource     train-img https://raw.githubusercontent.com/NarciSource/sgTrainExplosion.js/master/img/train.gif
// @updateURL    https://raw.githubusercontent.com/NarciSource/sgTrainExplosion.js/master/sgTrainExplosion.meta.js
// @downloadURL  https://raw.githubusercontent.com/NarciSource/sgTrainExplosion.js/master/sgTrainExplosion.user.js
// @grant        GM.getResourceUrl
// @license      MIT
// ==/UserScript==

async function addStyle(resource_url) {
    $('<link>', {
        rel : 'stylesheet',
        type : 'text/css',
        href : await GM.getResourceUrl(resource_url)
    }).appendTo('head');
};
addStyle("tx-style");
addStyle("cm-style");



const sg_regx = /giveaway\/([\w]{5})\//,
      steam_regx = /store\.steampowered\.com\/([\w]+)\/([\d]+)/;

$('<i>', {
    class: 'sgtx__icon fa fa-train',
    title: "Train Extraction",
    click: function() {
        if (!$.contains(document, $rail.get())) {
            $rail.prependTo($('.page__inner-wrap'))
        } else {
            $rail.detach();
        }
        $(this).toggleClass('sgtx__icon--activated');
        
        progress();
        recursive(
            $('.page__description').find('a')
                .filter((_,atag)=>sg_regx.exec(atag.href)!==null)
                .map((_,atag)=>sg_regx.exec(atag.href)[1])
        );
    }
})
.appendTo($('.featured__summary'))
.parent().css({position:'relative'});


var $rail = $('<div>', {
                class: 'sgtx__rail'
            }),
    $train = $('<ul>', {
                class: 'sgtx__train',
                on: {
                    mousewheel: function(e){
                        var wheelDelta = e.originalEvent.wheelDelta;
                        
                        if (wheelDelta > 0){
                            $(this).scrollLeft(-wheelDelta + $(this).scrollLeft());
                        } else{
                            $(this).scrollLeft(-wheelDelta + $(this).scrollLeft());
                        }
                    }
                },
            }).appendTo($rail),
    $locomotive = $('<li>', {
                class: 'sgtx__train__locomotive',
                html: $.merge(
                    $('<div>', {
                        class: 'sgtx__train__locomotive__train-gif'
                    }),
                    $('<div>',{
                        class: 'sgtx__train__locomotive__count fa-stack',
                        html: $.merge(
                            $('<i>', {
                                class: 'fa fa-circle-o-notch fa-stack-1x',
                            }),
                            $('<span>', {
                                text: 0
                            })
                        )
                    })
                ),
                click: function() {
                    trailer_update = !trailer_update;
                }
            }).prependTo($train),
    $num_of_trailer = $locomotive.children('.sgtx__train__locomotive__count');

(async _=> 
    $locomotive.children('.sgtx__train__locomotive__train-gif')
        .css({'background-image': `url(${await GM.getResourceUrl("train-img")})`})
)();


$.contextMenu({
    selector: '.sgtx__train__locomotive, .sgtx__icon',
    callback: function(key, options) {
        switch(key) {
            case "expand":
                $train.toggleClass('sgtx__train--expand');
                break;
            case "pointsort":
                $train.children('.sgtx__train__trailer')
                    .sort((a,b)=> $(a).data("point") < $(b).data("point") ? 1:-1)
                    .appendTo($train);
                break;
            case "timesort":
                $train.children('.sgtx__train__trailer')
                    .sort((a,b)=> $(a).data("time").time < $(b).data("time").time ? -1:1)
                    .appendTo($train);
                break;
            case "expiredhide":
                $train.children('.sgtx__train__trailer')
                    .filter((_,trailer)=>$(trailer).data("time").expired)
                    .each((_,trailer)=>$(trailer).hide());
                break;
            case "reload":
                $train.children('.sgtx__train__trailer').remove();
                $num_of_trailer.children('span').text(0);
                sgcodeStore.clear();
                trailer_update = true;
                recursive(
                    $('.page__description').find('a')
                        .filter((_,atag)=>sg_regx.exec(atag.href)!==null)
                        .map((_,atag)=>sg_regx.exec(atag.href)[1]));
                break;
        }
    },
    items: {
        expand: {name: "Expand/Collapse", icon: 'fa-expand'},
        pointsort: {name: "Sort by point", icon: 'fa-sort-amount-desc'},
        timesort: {name: "Sort by remaining time", icon: 'fa-sort-amount-asc'},
        expiredhide: {name: "Hide for expired", icon: 'fa-eye-slash'},
        reload: {name: "Reload", icon: 'fa-refresh'}
    }
});

function progress() {
    $num_of_trailer.children('i').animate({ deg: 360 }, {
        duration: 600,
        step: function(now) {
            $num_of_trailer.children('i').css({ transform: `rotate(${now}deg)` });
        },
        complete: function() {
            $num_of_trailer.children('i')[0].deg=0;
        }
    });
}

function addList(sgcode, point, time, ginfo) {
    //console.log(sgcode, point, time, ginfo);

    $num_of_trailer.children('span').text( Number($num_of_trailer.children('span').text())+1 );

    $('<li>',{
        class: 'sgtx__train__trailer',
        data: {point, time, ginfo},
        html: $.merge(
                $('<a>', {
                    class: 'giveaway_image_thumbnail',
                    css: {
                        'background-image': ginfo!==undefined? 
                            `url(https://steamcdn-a.akamaihd.net/steam/${ginfo.dir}s/${ginfo.gid}/capsule_184x69.jpg)`
                          : `url(https://cdn.steamgifts.com/brand/logo.png)`,
                        'background-size': 'contain'
                    },
                    href: `/giveaway/${sgcode}/`
                }),
                $('<a>', {
                    href: ginfo!==undefined? `https://store.steampowered.com/${ginfo.dir}/${ginfo.gid}/`
                                           : `https://store.steampowered.com/`,
                    html: $('<i>', {
                        class: 'fa fa-steam'
                    })
                })
            )
    }).appendTo($train);
}



var sgcodeStore = new Set(),
    trailer_update = true,
    recursive = sgcodes=> {
        if (trailer_update) {
            sgcodes
                .filter((_,sgcode)=>!sgcodeStore.has(sgcode))
                .each((_,sgcode)=>{
                    sgcodeStore.add(sgcode);
                    progress();

                    $.ajax({ 
                        dataType: 'html',
                        url: `https://www.steamgifts.com/giveaway/${sgcode}/` })

                    .done(html=>{
                        if ($(html).find('.page__heading__breadcrumbs').text() === "Error") {
                            addList(sgcode, 0, {expired: true, time: $.now()});
                            return;
                        }

                        let name = $(html).find('.featured__heading').children('.featured__heading__medium').text(),
                            point = Number( $(html).find('.featured__heading').children('.featured__heading__small').last().text().match(/\d+/)[0] ),

                            expired = !$(html).find('.featured__column').eq(0).text().includes("remaining"),
                            time = $(html).find('.featured__column').eq(0).children('span').data("timestamp"),

                            [_, dir, gid] = steam_regx.exec($(html).find('.featured__heading').children('a').eq(0)[0].href),

                            ref_sgcodes = $(html).find('.page__description').find('a')
                                        .filter((_,atag)=> sg_regx.exec(atag.href)!==null)
                                        .map((_,atag)=> sg_regx.exec(atag.href)[1]);

                        addList(sgcode, point, {expired, time}, {name, dir, gid});
                        recursive(ref_sgcodes);
                    })
                    .catch(e=>console.log(e));
            });
        }
    };