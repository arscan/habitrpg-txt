var conf = require('nconf'),
    HabitAPI = require('./lib/habitapi.js'),
    NcursesView = require('./lib/ncursesview.js');

conf.argv().file({file: __dirname + "/config.json"}).defaults({
    'APIURL': 'https://habitrpg.com/api/v1',
    'APIUSER': '001122',
    'APITOKEN': 'ABCABC'
});

// HabitAPI is not aware of the ncurses view
// the ncurses view is aware of the HabitAPI
// this allows me to add a console view easily (consoleview)

HabitAPI.onDataChange(function(){
    NcursesView.refreshStatsView();
    NcursesView.refreshStatusBar();
    NcursesView.TaskList.refresh();
});

HabitAPI.onConnectedChange(function(){
    NcursesView.refreshStatusBar();
});

HabitAPI.onLog(function(text){
    NcursesView.LogWindow.log(text);
});

HabitAPI.onUnsavedChange(function(){
    NcursesView.refreshStatusBar();
});

HabitAPI.init(conf.get("APIURL"),conf.get("APIUSER"),conf.get("APITOKEN"));

