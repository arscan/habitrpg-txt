var conf = require('nconf'),
    tty = require('tty'),
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



    //process.openStdin();
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('^C', process.exit);
    if (typeof process.stdin.fd === 'number' && tty.isatty(process.stdin.fd)) {
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
        }
        else tty.setRawMode(true);
    }
    process.stdin.on("data", function(input){
        if(input == '\3'){
            process.exit(0);
        } else {

            keyPress(input.toString());

        }
        
    });
    view = require('./lib/charmview.js');


} else if (conf.get("VIEWMODE").toLowerCase() == "ncurses"){

    view = require('./lib/ncursesview.js');

} else {

    console.log("view not found");

}
var inputMode = 'normal';
function keyPress(key){
    view.LogWindow.keyPress(key);
     var i = 0; // remove when done with everything

    if(inputMode == 'normal'){
        if(key === '~' || key === '`'){ // ~, `  toggle debug window

            view.LogWindow.toggle();

        } if((i === 106 || i === 258)){ // j, up arrow: move up

            //TaskList.moveCursor(1);

        } else if((i === 107 || i === 259)){ // k, down arrow : move down

            //TaskList.moveCursor(-1);

        } else if(i === 74){ // J move one section down

            // TODO IMPLEMENT THIS IN THE API

            //TaskList.moveCursor(1);

        } else if(i === 75){ // K  move one section up

            // TODO IMPLEMENT THIS IN THE API

            //TaskList.moveCursor(-1);

        } else if(i === 120 || i === 32 || i === 10){ // X and Space and Enter

            //TaskList.checkItem();

        } else if(i === 100 || i === 45){ // d, minus to decrement whatever you are on

            //TaskList.decrementHabit();

        } else if(i === 114){ // r, manual refresh 

            //HabitAPI.refresh();

        }  else if(i === 63){

            //toggleHelp();

        }  else if(i === 58){

            //inputMode = 'command';
            //inputWin.inbuffer = '';
            //nc.showCursor = true;

        } else if(i == 47){

            //inputMode = 'search';
            //inputWin.inbuffer = '';
            //nc.showCursor = true;

        }
    }


    if(inputMode == 'command' | inputMode == 'search'){
        if(i === 9){
            inputMode = 'normal';
            inputWin.inbuffer = '';
            nc.showCursor = false;
            inputWin.refresh();
        }else if(i === 330){

            var prev_x = inputWin.curx;
            inputWin.delch(inputWin.height-1, inputWin.curx);
            inputWin.inbuffer = inputWin.inbuffer.substring(0, inputWin.curx-1) + inputWin.inbuffer.substring(inputWin.curx);
            inputWin.cursor(inputWin.height-1, prev_x);
            if(inputWin.inbuffer.length == 0){
                inputMode = 'normal';
                nc.showCursor = false;
            }
            if(inputMode == 'search'){
                if(inputWin.inbuffer.substring(1).length > 0){
                    TaskList.searchCursor(inputWin.inbuffer.substring(1));
                }
            }
            inputWin.refresh();

        } else if (i === 127 && inputWin.curx > 0) {
            var prev_x = inputWin.curx-1;
            inputWin.delch(inputWin.height-1, prev_x);
            inputWin.inbuffer = inputWin.inbuffer.substring(0, prev_x) + inputWin.inbuffer.substring(prev_x+1);
            inputWin.cursor(inputWin.height-1, prev_x);
            if(inputWin.inbuffer.length == 0){
                inputMode = 'normal';
                nc.showCursor = false;
            }
            if(inputMode == 'search'){
                if(inputWin.inbuffer.substring(1).length > 0){
                    TaskList.searchCursor(inputWin.inbuffer.substring(1));
                }
            }
            inputWin.refresh();
        } else if (i === nc.keys.NEWLINE) {
            if (inputWin.inbuffer.length) {

                if (inputWin.inbuffer[0] === ':') {
                    var cmd = inputWin.inbuffer.substring(1).split(' ', 1).join('').trim(),
                        args = inputWin.inbuffer.substring(inputWin.inbuffer.indexOf(cmd)+cmd.length+1).trim();
                    switch (cmd.toLowerCase()) {
                        case 't':
                            if (args.length) {
                                inputWin.clear();
                                inputWin.inbuffer = '';
                                nc.showCursor = false;
                                inputMode = 'normal';
                                HabitAPI.createTask("todo",args);
                            }
                            break;
                        case 'h':
                            if (args.length) {
                                inputWin.clear();
                                inputWin.inbuffer = '';
                                nc.showCursor = false;
                                inputMode = 'normal';
                                HabitAPI.createTask("habit",args);
                            }
                            break;
                        case 'd':
                            if (args.length) {
                                inputWin.clear();
                                inputWin.inbuffer = '';
                                nc.showCursor = false;
                                inputMode = 'normal';
                                HabitAPI.createTask("daily",args);
                            }
                            break;
                        case 'r':
                            if (args.length) {
                                inputWin.clear();
                                inputWin.inbuffer = '';
                                nc.showCursor = false;
                                inputMode = 'normal';
                                TaskList.renameTask(args);
                            }
                            break;

                        case 'delete':
                            TaskList.deleteTask();
                            inputWin.clear();
                            inputWin.inbuffer = '';
                            nc.showCursor = false;
                            inputMode = 'normal';
                            break;

                        case 'q':
                            nc.cleanup();
                            process.exit(0);
                            break;
                        default:
                            inputWin.clear();
                            inputWin.addstr('Unknown command: ' + cmd);
                            inputMode = 'normal';
                            nc.showCursor = false;

                    }
                } else if (inputWin.inbuffer[0] === '/') {
                    inputMode = 'normal';
                    nc.showCursor = false;
                    inputWin.inbuffer = '';
                    inputWin.clear();

                    //items.

                    
                }
            }

        } else if (i >= 32 && i <= 126 && inputWin.curx < inputWin.width-4) {
            inputWin.echochar(i);
            inputWin.inbuffer += c;

            if(inputMode == 'search'){
                if(inputWin.inbuffer.substring(1).length > 0){
                    TaskList.searchCursor(inputWin.inbuffer.substring(1));
                }
            }
            
        } else if (i === 27) { // esc

            inputMode = 'normal';
            inputWin.inbuffer = '';
            nc.showCursor = false;
            inputWin.clear();

        }

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


