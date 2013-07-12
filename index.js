var conf = require('nconf'),
    tty = require('tty'),
    HabitAPI = require('./lib/habitapi.js'),
    view = require('./lib/charmview.js'),
    keypress = require('keypress');

conf.argv().file({file: __dirname + "/config.json"}).defaults({
    'APIURL': 'https://habitrpg.com/api/v1',
    'APIUSER': '001122',
    'APITOKEN': 'ABCABC',
    'KEYBINDING': 'vi'
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

// Keypress doesn't detect the names some keys, so fall
// back to plain sequence in those cases (ch).
view.InputWindow.setKeybinding(conf.get("KEYBINDING"));
keypress(process.stdin);
process.stdin.on('keypress', function(ch, key){
    if (key && key.ctrl && key.name == 'c') { // exit on C-c
        process.exit(0);
    }
    else if(key) {
        keyPress(key);

    } else {    
        key = ch;
        keyPress(key);
    }
    
    
});

function keyPress(key){
    view.LogWindow.keyPress(key);
    var kb = view.InputWindow.getKeybinding();
    if(view.InputWindow.getMode() == 'normal'){
        if(kb == 'vi') { 
            if(key.name === '~' || key.name === '`'){ // ~, `  toggle debug window

                view.LogWindow.toggle();

            } if(key.name == 'j'){ // j, up arrow: move up

                view.TaskList.moveCursor(1);

            } else if(key.name == 'k'){ // k, down arrow : move down

                view.TaskList.moveCursor(-1);

            } else if(key.name == 'J'){ // J move one section down


            } else if(key.name == 'K'){ // K  move one section up

            } else if(key.name == 'd' || key == '-'){ // d, minus to decrement whatever you are on

                view.TaskList.decrementHabit();

            } else if(key.name == 'space' || key.name == 'x'){ // update habit

                view.TaskList.checkItem();

            } else if(key.name == 'r'){ // r, manual refresh 

                HabitAPI.refresh();

            }  else if(key == '?'){

                view.HelpWindow.toggle();

            }  else if(key == ":"){
                view.InputWindow.setMode('command');

            } else if(key == "/"){
                view.InputWindow.setMode('search');

            }
        }
        if(kb == 'emacs'){
            if(key == '`' || key == '~' || key.name == 'f1'){ // f1,  toggle debug window

                view.LogWindow.toggle();

            }

            if(key.name == 'n'){ // n or C-n

                view.TaskList.moveCursor(1);

            } else if(key.name == 'p'){ // p or C-p

                view.TaskList.moveCursor(-1);

            } else if(key.ctrl && key.name == 'd'){ // C-d to decrement whatever you are on

                view.TaskList.decrementHabit();

            } else if(key.ctrl && (key.name == 'space' || key.name == '`')){ // C-SPC, C-`

                view.TaskList.checkItem();

            } else if(key.name == 'r'){ // r, manual refresh 

                HabitAPI.refresh();

            }  else if(key == '?'){ // ? for help

                view.HelpWindow.toggle();

            }  else if(key.meta && key.name == 'x'){ // M-x
                view.InputWindow.setMode('command');

            } else if(key.ctrl && key.name == 's'){ // C-s
                view.InputWindow.setMode('search');

            }
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


