var nc = require('ncurses'),
    HabitAPI = require('./habitapi.js'),
    _ = require('underscore'),
    rootWin = new nc.Window();

/* set some color pairs */
nc.colorPair(1,nc.colors.BLACK,nc.colors.WHITE);
nc.colorPair(2,nc.colors.WHITE,nc.colors.BLACK);
nc.colorPair(3,nc.colors.BLACK,nc.colors.CYAN);

/* not sure why this exists */
nc.setEscDelay(0);

/* Window update Functions */

// the stats bar only needs to updated, so just expose that function

var refreshStatsView = (function(){
    var statsWin = new nc.Window(7,nc.cols-4);

    function drawBar(onColorPair, offColorPair, val, valMax, label, rowStart){
        var totalwidth = statsWin.width - 6,
            onWidth = Math.floor(totalwidth * (val / valMax)),
            offWidth = totalwidth - onWidth,
            poststring = '' + val + '/' + valMax,
            paddedstring = label + Array(totalwidth - label.length + 1 - poststring.length).join(' ') + poststring;

        statsWin.cursor(rowStart,3);
        statsWin.attron(nc.colorPair(1));
        for (var i = 0; i < paddedstring.length; i++){
            if(i > onWidth){
                statsWin.attroff(nc.colorPair(1));
                statsWin.attron(nc.colorPair(2));
            }
            statsWin.addstr(paddedstring.charAt(i));
        }
        statsWin.attroff(nc.colorPair(2));
        statsWin.refresh();
    }


    return function(){
        if(!HabitAPI.data.stats) false;
        statsWin.move(1,2);
        statsWin.box();
        statsWin.cursor(0,2);
        statsWin.addstr(HabitAPI.data.auth.local?HabitAPI.data.auth.local.username:HabitAPI.data.profile.name);
        statsWin.addstr(' [lvl ' + HabitAPI.data.stats.lvl + ']');
        statsWin.refresh();

        drawBar(1,2,Math.ceil(HabitAPI.data.stats.hp),HabitAPI.data.stats.maxHealth,'Health',2);
        drawBar(1,2,Math.floor(HabitAPI.data.stats.exp),HabitAPI.data.stats.toNextLevel,'Exp',4);

        return true;
    }

})();

// the status bar only needs to be refreshed (on connection changes, etc)
// so only expose that

var refreshStatusBar = (function(){
    var statusBarWin = new nc.Window(1,nc.cols);

    statusBarWin.move(nc.lines-2,0);

    return function(){
        var state = (HabitAPI.connected?(HabitAPI.unsaved?'unsaved':''):'disconnected');
        statusBarWin.cursor(0,0);
        statusBarWin.clrtoeol();
        statusBarWin.addstr("HabitRPG (? for help)");
        statusBarWin.addstr(0, nc.cols-(Math.min(state.length, nc.cols)), state, nc.cols);
        statusBarWin.chgat(0, 0, nc.cols, nc.attrs.STANDOUT, nc.colorPair(5));
        statusBarWin.refresh();

    }

})();


// the help bar only needs to be toggled, so just expose that function

var toggleHelp = (function(){
    var helpWin = new nc.Window(17, nc.cols-8);

    // TODO: make some helper funcs for this
    
    helpWin.hide();
    helpWin.move(4,4);
    helpWin.box();
    helpWin.cursor(1,2);
    helpWin.addstr('KEY  DESCRIPTION');
    helpWin.cursor(2,2);
    helpWin.hline(helpWin.width-4, nc.ACS.HLINE);
    helpWin.cursor(3,2);
    helpWin.addstr('  j  down a line');
    helpWin.cursor(4,2);
    helpWin.addstr('  k  up a line');
    helpWin.cursor(5,2);
    helpWin.addstr('spc  check off something');
    helpWin.cursor(6,2);
    helpWin.addstr('  -  mark down a habit');
    helpWin.cursor(7,2);
    helpWin.addstr('  r  manually refresh');
    helpWin.cursor(8,2);
    helpWin.addstr('  ~  show log (press 2x)');
    helpWin.cursor(9,2);
    helpWin.addstr('  /  search tasks');
    helpWin.cursor(11,2);
    helpWin.addstr(' :q quits');
    helpWin.cursor(12,2);
    helpWin.addstr(' :h <txt> add a habit');
    helpWin.cursor(13,2);
    helpWin.addstr(' :d <txt> add a daily');
    helpWin.cursor(14,2);
    helpWin.addstr(' :t <txt> add a todo');
    helpWin.cursor(15,2);
    helpWin.addstr(' :delete');

    helpWin.on('inputChar', function (c, i) {
        helpWin.hide();
        TaskList.refresh();
        //statusWindow.refresh();
        
    });

    return function(){
        if(helpWin.hidden){
            helpWin.show();
        } else {
            helpWin.hide();
        }
        helpWin.refresh();
    }

})();

// expose a bunch of functions for task window, so wrap it up in an object

var TaskList = (function(){

    var taskWin = new nc.Window(nc.lines-11, nc.cols, nc.cols),
        items = []
        currentIndex = 0;

    taskWin.move(9,0);
    
    function drawHeader(title){
        taskWin.hline(taskWin.width-2, nc.ACS.HLINE);
        taskWin.cursor(taskWin.cury,0);
        taskWin.addstr('  ');
        taskWin.cursor(taskWin.cury,3);
        taskWin.addstr(' ' + title + ' ');
        taskWin.cursor(taskWin.cury,0);
    }
    
    return {
        refresh: function(){
            var t; // for convenience
            taskWin.erase();
            taskWin.refresh();
            items = [];
            taskWin.cursor(0,0);

            drawHeader("Habits [" + HabitAPI.data.stats.habitToday + " today]");
            taskWin.cursor(taskWin.cury+1,0);
            for(var i = 0; i<HabitAPI.data.habitIds.length;i++){
                t = HabitAPI.data.tasks[HabitAPI.data.habitIds[i]];
                taskWin.cursor(taskWin.cury+1,2);
                t.cury = taskWin.cury;
                items.push(t);
                taskWin.addstr('[' + (t.up - t.down == 0?' ':'' + Math.abs(t.up - t.down)) + '] ' + t.text.substr(0,taskWin.width-5));

                if (t.up - t.down < 0){
                    taskWin.cursor(taskWin.cury,3);
                    taskWin.addstr('-');
                } 
                
            }

            taskWin.cursor(taskWin.cury+2,0);
            drawHeader("Daily [" + HabitAPI.data.stats.dailyToday + " complete]");
            taskWin.cursor(taskWin.cury+1,0);

            for(var i = 0; i<HabitAPI.data.dailyIds.length;i++){
                t = HabitAPI.data.tasks[HabitAPI.data.dailyIds[i]];

                taskWin.cursor(taskWin.cury+1,2);
                t.cury = taskWin.cury;
                items.push(t);

                taskWin.addstr('[' + (t.completed?'X':' ') + '] ' + t.text.substr(0,taskWin.width-5));
            }

            taskWin.cursor(taskWin.cury+2,0);
            drawHeader("Todos [" + HabitAPI.data.stats.todoToday + " completed today]");
            taskWin.cursor(taskWin.cury+1,0);

            for(var i = 0; i<HabitAPI.data.todoIds.length;i++){
                t = HabitAPI.data.tasks[HabitAPI.data.todoIds[i]];
                if(!t.completed){
                    taskWin.cursor(taskWin.cury+1,2);
                    taskWin.addstr('[' + (t.completed?'X':' ') + '] ' + t.text.substr(0,taskWin.width-5));
                    t.cury = taskWin.cury;
                    items.push(t);
                }
            }

            // draw where the cursor is now
            if(items.length > 0 && items[currentIndex] && items[currentIndex].cury){
                taskWin.chgat(items[currentIndex].cury, 2, taskWin.width-5, nc.attrs.STANDOUT, nc.colorPair(5));
            } else {
                currentIndex = 0;
            }

            taskWin.refresh();
        },
        moveCursor: function(inc){
            LogWindow.log("Moving cursor " + (inc > 0 ? "down" : "up"));
            if(currentIndex + inc < items.length && currentIndex + inc >= 0){
                taskWin.chgat(items[currentIndex].cury, 2, taskWin.width-5, nc.attrs.NORMAL, nc.colorPair(0));
                currentIndex += inc;
                taskWin.chgat(items[currentIndex].cury, 2, taskWin.width-5, nc.attrs.NORMAL, nc.colorPair(5));
                taskWin.refresh();
            }
        },
        searchCursor: function(str){
            // this is pretty difficult to read
            // it pulls out the text values of each
            // then finds the index of the first one that matches the entire substring we are looking for
            var ind = _.indexOf(_.pluck(items,'text'),_.find(_.pluck(items,'text'),function(val){return (val.toLowerCase().indexOf(str.toLowerCase()) >= 0)}));
            
            if(ind >= 0){
                currentIndex = ind;
            }
            TaskList.refresh();
        
        },
        checkItem: function(){
            if(items[currentIndex].type == 'daily' || items[currentIndex].type == 'todo'){

                HabitAPI.completeTask(items[currentIndex].id, !items[currentIndex].completed);

            } else if(items[currentIndex].type == 'habit'){
                HabitAPI.updateHabit(items[currentIndex].id,"up");
            }

            if(items[currentIndex].type == 'todo'){
                currentIndex--;
            }
            TaskList.refresh();
        },
        decrementHabit: function(){

            if(items[currentIndex].type == 'habit'){
                HabitAPI.updateHabit(items[currentIndex].id,"down");
            }
            TaskList.refresh();

        },
        renameTask: function(newtext){

          HabitAPI.renameTask(items[currentIndex].id, newtext);
          TaskList.refresh();
         },
        deleteTask: function(){
        
          HabitAPI.deleteTask(items[currentIndex].id);
          currentIndex--;
          TaskList.refresh();
        }
        
    }
})(); 

var LogWindow = (function(){

    var logWindow = new nc.Window(20, nc.cols, nc.cols),
        lines = new Array(17),
        keyPress = "";

    logWindow.move(nc.lines - 22,0);

    // an example of how to debug stuck on input error
    //logWindow.on('inputChar', function (c, i) {
    //    LogWindow.log("Stuck on Input")
    //});

    function refresh(){
        logWindow.erase();
        logWindow.hline(logWindow.width, nc.ACS.HLINE);
        for(var i = 0; i<lines.length;i++){
            logWindow.cursor(logWindow.cury+1,0);
            if(typeof lines[i] != "undefined"){
                logWindow.addstr('# ' + lines[i],nc.cols-1);
            }
        }
        logWindow.cursor(logWindow.cury+1,0);
        logWindow.hline(logWindow.width, nc.ACS.HLINE);
        logWindow.cursor(logWindow.cury+1,0);
        logWindow.addstr('# ' + keyPress);
        logWindow.refresh();
    }
    
    return {
        log: function(msg){
            lines.push(msg);
            logWindow.cursor(0,0);
            if(lines.length > 17){
                lines.shift();
            }
            refresh();
            
        },
        
        // I got tired of key presses filling up my log.  Make a distinct line for it
        keyPress: function(key){
            keyPress = "Pressed key " + key;
            refresh();
        },
        show: function(){
            logWindow.show();
            logWindow.bottom();

        },
        hide: function(){
            logWindow.hide();
        },
        toggle: function(){
            if(logWindow.hidden){
                logWindow.show();
            } else {
                logWindow.hide();
            }

        }
    }
})();

LogWindow.show();

// Input window
// It doesn't expose anything
// It just writes to itself and calls other stuffs

(function(){

    var inputWin = new nc.Window(1,nc.cols),
        inputMode = 'normal';

    nc.showCursor = false;
    inputWin.move(nc.lines-1,0);
    inputWin.refresh();

    // Input comes from the topmost window
    // If for some reason this window loses focus, do inputWin.top()

    //setInterval(function(){inputWin.top()},1000);

    inputWin.on('inputChar', function (c, i) {

        LogWindow.keyPress(i);

        if(inputMode == 'normal'){
            inputWin.clear();
            if((i === 126 || i === 96)){ // ~, `  toggle debug window

                LogWindow.toggle();
                inputWin.top(); // logwindow gets put on top, which kills the input stream. this fixes that.

            } if((i === 106 || i === 259)){ // j, up arrow: move up

                TaskList.moveCursor(1);

            } else if((i === 107 || i === 258)){ // k, down arrow : move down

                TaskList.moveCursor(-1);

            } else if(i === 74){ // J move one section down

                // TODO IMPLEMENT THIS IN THE API

                TaskList.moveCursor(1);

            } else if(i === 75){ // K  move one section up

                // TODO IMPLEMENT THIS IN THE API

                TaskList.moveCursor(-1);

            } else if(i === 120 || i === 32 || i === 10){ // X and Space and Enter

                TaskList.checkItem();

            } else if(i === 100 || i === 45){ // d, minus to decrement whatever you are on

                TaskList.decrementHabit();

            } else if(i === 114){ // r, manual refresh 

                HabitAPI.refresh();

            }  else if(i === 63){

                toggleHelp();

            }  else if(i === 58){

                inputMode = 'command';
                inputWin.inbuffer = '';
                nc.showCursor = true;

            } else if(i == 47){

                inputMode = 'search';
                inputWin.inbuffer = '';
                nc.showCursor = true;

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
        inputWin.refresh();

    });

})();


exports.refreshStatsView = refreshStatsView;
exports.refreshStatusBar = refreshStatusBar;
exports.TaskList = TaskList;
exports.LogWindow = LogWindow;

