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

/*
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
    */


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


