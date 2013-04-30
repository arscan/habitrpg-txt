var conf = require('nconf'),
    tty = require('tty'),
    HabitAPI = require('./lib/habitapi.js'),
    view = require('./lib/charmview.js');

conf.argv().file({file: __dirname + "/config.json"}).defaults({
    'APIURL': 'https://habitrpg.com/api/v1',
    'APIUSER': '001122',
    'APITOKEN': 'ABCABC',
});


//process.openStdin();
if (typeof process.stdin.fd === 'number' && tty.isatty(process.stdin.fd)) {
    if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
    }
    else tty.setRawMode(true);
}
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on("data", function(key){
    key = "" + key;
    if(key.charCodeAt() === 3){
        process.exit(0);
    } else {
        keyPress(key);
    }
    
});

function keyPress(key){
    view.LogWindow.keyPress(key);

    if(view.InputWindow.getMode() == 'normal'){
        if(key === '~' || key === '`'){ // ~, `  toggle debug window

            view.LogWindow.toggle();

        } if(key == 'j'){ // j, up arrow: move up

            view.TaskList.moveCursor(1);

        } else if(key == 'k'){ // k, down arrow : move down

            view.TaskList.moveCursor(-1);

        } else if(key == 'J'){ // J move one section down


        } else if(key == 'K'){ // K  move one section up


        } else if(key == 'X' || key == 'x' || key == ' '){ // X and Space

            view.TaskList.checkItem();

        } else if(key == 'd' || key == '-'){ // d, minus to decrement whatever you are on

            view.TaskList.decrementHabit();

        } else if(key == 'r'){ // r, manual refresh 

            HabitAPI.refresh();

        }  else if(key == '?'){

            view.HelpWindow.toggle();

        }  else if(key == ":"){
            view.InputWindow.setMode('command');

        } else if(key == "/"){
            view.InputWindow.setMode('search');

        }
    }

    if(view.InputWindow.getMode() != 'normal'){
        // we are not in normal mode
        view.InputWindow.keyPress(key);

    }

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


