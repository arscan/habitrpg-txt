var conf = require('nconf'),
    HabitAPI = require('./lib/habitapi.js');

conf.argv().file({file: __dirname + "/config.json"}).defaults({
    'APIURL': 'https://habitrpg.com/api/v1',
    'APIUSER': '001122',
    'APITOKEN': 'ABCABC',
    'VIEWMODE': 'ncurses'
});


// view interface
// this needs to be cleaned up
// good enough for now
view = {
    refreshStatsView: function(){},
    refreshStatusBar: function(){},
    TaskList: {refresh: function(){}},
    LogWindow: {log: function(text){console.log(text)}}
}

// HabitAPI is not aware of the ncurses view
// the ncurses view is aware of the HabitAPI
// this allows me to add a console view easily (consoleview)
if (conf.get("VIEWMODE").toLowerCase() == "charm"){

    view = require('./lib/charmview.js');

} else if (conf.get("VIEWMODE").toLowerCase() == "ncurses"){

    view = require('./lib/ncursesview.js');

} else {

    console.log("view not found");

}


HabitAPI.onDataChange(function(){
    view.refreshStatsView();
    view.refreshStatusBar();
    view.TaskList.refresh();
});

HabitAPI.onConnectedChange(function(){
    view.refreshStatusBar();
});

HabitAPI.onLog(function(text){
    view.LogWindow.log(text);
});

HabitAPI.onUnsavedChange(function(){
    view.refreshStatusBar();
});

HabitAPI.init(conf.get("APIURL"),conf.get("APIUSER"),conf.get("APITOKEN"));


