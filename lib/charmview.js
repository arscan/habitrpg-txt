var charm = require('charm')(),
    HabitAPI = require('./habitapi.js'),
    _ = require('underscore'),
    size = process.stdout.getWindowSize();

charm.pipe(process.stdout);
charm.reset();
charm.background(0);
charm.erase('screen');

process.on('SIGWINCH', function(){
  charm.reset();
  if(process.stdout.getWindowSize()[0] > 20){
      size = process.stdout.getWindowSize();
      fullRefresh();
  }
});

function fullRefresh(){
    refreshStatsView();


}

var CHARS = {
    HORIZONTAL: '\u2501'
    , VERTICAL: '\u2503'
    , TOPLEFT: '\u250f'
    , TOPRIGHT: '\u2513'
    , BOTTOMLEFT: '\u2517'
    , BOTTOMRIGHT: '\u251b'
    , FAIL: '\u2718'
    , SUCCeSS: '\u2714'
    , CROSS: '\u2718'
    , SPINNER: '\u25dc\u25dd\u25de\u25df'
    , DOT: '\u00b7'
    , MARK: '\u2714'
}

var refreshStatsView = (function(){

    function drawBar(onForeground, onBackground, offForeground, offBackground, val, valMax, label, rowStart){
        var totalwidth = size[0] - 9,
            onWidth = Math.floor(totalwidth * (val / valMax)),
            offWidth = totalwidth - onWidth,
            poststring = '' + val + '/' + valMax,
            paddedstring = label + Array(totalwidth - label.length + 1 - poststring.length).join(' ') + poststring;

        charm.position(5,rowStart)
             .background(onBackground)
             .foreground(onForeground);
        for (var i = 0; i < paddedstring.length; i++){
            if(i > onWidth){
                charm.background(offBackground)
                     .foreground(offForeground);
            }
            charm.write(paddedstring.charAt(i));
        }
    }

    function drawBox(col, row, width,height){
        var inc = row+1;

        charm.display('dim');

        charm.position(col,row);
        charm.write(CHARS.TOPLEFT + Array(width).join(CHARS.HORIZONTAL) + CHARS.TOPRIGHT);
        while(inc<row+height){
            charm.position(col,inc);
            charm.write(CHARS.VERTICAL);
            charm.position(col+width,inc);
            charm.write(CHARS.VERTICAL);
            inc++;
        }
        charm.position(col,row+height);
        charm.write(CHARS.BOTTOMLEFT + Array(width).join(CHARS.HORIZONTAL) + CHARS.BOTTOMRIGHT)
        charm.display('reset');

    }
    

    return function(){
        if(!HabitAPI.data.stats) return false;

        charm.position(1,30);
        

        for(i = 0; i<256; i++){
            charm.background(i)
                .write(" ");
        }
        charm.background(16);
        charm.foreground('white');

        drawBox(2,2,size[0]-4,6);
        charm.position(4,2);

        charm.write(' ' + (HabitAPI.data.auth.local?HabitAPI.data.auth.local.username:HabitAPI.data.profile.name))
            .display('reset')
            .write(' [lvl ' + HabitAPI.data.stats.lvl + '] ');

        drawBar(16,248,248,16,Math.ceil(HabitAPI.data.stats.hp),HabitAPI.data.stats.maxHealth,'Health',4);
        drawBar(16,248,248,16,Math.floor(HabitAPI.data.stats.exp),HabitAPI.data.stats.toNextLevel,'Exp',6);

        return true;
    }

})();

var refreshStatusBar = (function(){

    charm.position(0,size[1]-2);

    return function(){
        var state = (HabitAPI.connected?(HabitAPI.unsaved?'unsaved':''):'disconnected');
        charm.position(0,size[1]-1);

        //statusBarWin.clrtoeol();
        charm.push();
        charm.background('white');
        charm.foreground('black');
        charm.write("HabitRPG (? for help) " + Array(size[0] - Math.min(state.length, size[0])-21).join(' '));
        //charm.write("HabitRPG (? for help) " + Array(5).join('a '));
        
        charm.move(size[0]-(Math.min(state.length, size[0])),0);
        charm.write(state);
        charm.pop();
        //statusBarWin.addstr(0, nc.cols-(Math.min(state.length, nc.cols)), state, nc.cols);
        //statusBarWin.chgat(0, 0, nc.cols, nc.attrs.STANDOUT, nc.colorPair(5));
        //statusBarWin.refresh();

    }

})();

var TaskList = {refresh: function(){}};
var LogWindow = {log: function(){}};

exports.refreshStatsView = refreshStatsView;
exports.refreshStatusBar = refreshStatusBar;
exports.TaskList = TaskList;
exports.LogWindow = LogWindow;
/*

// set some color pairs //
nc.colorPair(1,nc.colors.BLACK,nc.colors.WHITE);
nc.colorPair(2,nc.colors.WHITE,nc.colors.BLACK);
nc.colorPair(3,nc.colors.BLACK,nc.colors.CYAN);

// not sure why this exists //
nc.setEscDelay(0);

// Window update Functions //

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
        currentIndex = 0,
        maxHabitLines = 40,
        maxDailyLines = 40,
        maxTodoLines = 40
        habitOffset = 0,
        dailyOffset = 0,
        todoOffset = 0;

    taskWin.move(9,0);
    
    function drawHeader(title){
        taskWin.hline(taskWin.width-2, nc.ACS.HLINE);
        taskWin.cursor(taskWin.cury,0);
        taskWin.addstr('  ');
        taskWin.cursor(taskWin.cury,3);
        taskWin.addstr(' ' + title + ' ');
        taskWin.cursor(taskWin.cury,0);
    }

    function setSectionSizes(){
        var totalLines = nc.lines-11;
        var filteredTodos = _.filter(HabitAPI.data.todoIds,function(id){return !HabitAPI.data.tasks[id].completed});
        var neededLines = filteredTodos.length + HabitAPI.data.habitIds.length + HabitAPI.data.dailyIds.length;

        if(neededLines + 9 > totalLines){
            // we have more stuff than total lines
            // lets start by breaking up into 3

            var minSize = Math.floor((totalLines - 9) / 3);

            maxHabitLines = Math.max(1,Math.min(HabitAPI.data.habitIds.length,minSize));
            maxDailyLines = Math.max(1,Math.min(HabitAPI.data.dailyIds.length,minSize));

            // Let the todos suck up the rest
            // Good enough for now
            maxTodoLines = (totalLines-9)-maxHabitLines-maxDailyLines;

        }

    }
    
    return {
        refresh: function(){
            var t; // for convenience

            setSectionSizes();
            
            taskWin.erase();
            taskWin.refresh();
            items = [];
            taskWin.cursor(0,0);


            drawHeader("Habits [" + HabitAPI.data.stats.habitToday + " today]");
            if(habitOffset > 0){
                taskWin.centertext(taskWin.cury+1," - - - - - - ".substring(0,taskWin.width-3));
            } else {
                taskWin.cursor(taskWin.cury+1,2);
            }
            taskWin.cursor(taskWin.cury+1,2);
            for(var i = 0; i<HabitAPI.data.habitIds.length;i++){
                t = HabitAPI.data.tasks[HabitAPI.data.habitIds[i]];
                if(habitOffset > i){
                    // above the fold
                    t.cury = taskWin.cury;
                    t.outby = i - habitOffset;
                    t.border=0;

                } else if (i >= maxHabitLines + habitOffset) {
                    // below the fold
                    t.cury = taskWin.cury-1;
                    t.outby = i-maxHabitLines + habitOffset+1;
                    t.border=0;

                } else {
                    // right on target
                    t.cury = taskWin.cury;
                    
                    if(i===habitOffset && habitOffset > 0){
                        t.border=-1;
                    } else if(i=== maxHabitLines + habitOffset -1 && HabitAPI.data.habitIds.length > maxHabitLines + habitOffset){
                        t.border=1;
                    } else {
                        t.border = 0;
                    }
                    
                    t.outby = 0;
                    taskWin.addstr('[' + (t.up - t.down == 0?' ':'' + Math.abs(t.up - t.down)) + '] ' + t.text.substr(0,taskWin.width-5));

                    if (t.up - t.down < 0){
                        taskWin.cursor(taskWin.cury,3);
                        taskWin.addstr('-');
                    } 
                    taskWin.cursor(taskWin.cury+1,2);
                }
                items.push(t);
                
            }
            
            if(HabitAPI.data.habitIds.length > maxHabitLines + habitOffset){
                taskWin.centertext(taskWin.cury," - - - - - - ".substring(0,taskWin.width-3));
            }

            taskWin.cursor(taskWin.cury+1,0);

            drawHeader("Daily [" + HabitAPI.data.stats.dailyToday + " complete]");
            if(dailyOffset > 0){
                taskWin.centertext(taskWin.cury+1," - - - - - - ".substring(0,taskWin.width-3));
            } else {
                taskWin.cursor(taskWin.cury+1,2);
            }

            taskWin.cursor(taskWin.cury+1,2);
            for(var i = 0; i<HabitAPI.data.dailyIds.length;i++){
                t = HabitAPI.data.tasks[HabitAPI.data.dailyIds[i]];
                if(dailyOffset > i){
                    // above the fold
                    t.cury = taskWin.cury;
                    t.outby = i - dailyOffset;
                    t.border=0;

                } else if (i >= maxDailyLines + dailyOffset) {
                    // below the fold
                    t.cury = taskWin.cury-1;
                    t.outby = i-maxDailyLines + dailyOffset+1;
                    t.border=0;

                } else {
                    // right on target
                    t.cury = taskWin.cury;
                    
                    if(i===dailyOffset && dailyOffset > 0){
                        t.border=-1;
                    } else if(i=== maxDailyLines + dailyOffset -1 && HabitAPI.data.dailyIds.length > maxDailyLines + dailyOffset){
                        t.border=1;
                    } else {
                        t.border = 0;
                    }
                    
                    t.outby = 0;
                    taskWin.addstr('[' + (t.completed?'X':' ') + '] ' + t.text.substr(0,taskWin.width-5));

                    if (t.up - t.down < 0){
                        taskWin.cursor(taskWin.cury,3);
                        taskWin.addstr('-');
                    } 
                    taskWin.cursor(taskWin.cury+1,2);
                }
                items.push(t);

            }

            if(HabitAPI.data.dailyIds.length > maxDailyLines + dailyOffset){
                taskWin.centertext(taskWin.cury," - - - - - - ".substring(0,taskWin.width-3));
            }

            taskWin.cursor(taskWin.cury+1,0);
            drawHeader("Todos [" + HabitAPI.data.stats.todoToday + " completed today]");
            if(todoOffset > 0){
                taskWin.centertext(taskWin.cury+1," - - - - - - ".substring(0,taskWin.width-3));
            } else {
                taskWin.cursor(taskWin.cury+1,2);
            }

            taskWin.cursor(taskWin.cury+1,2);
            
            var filteredTodos = _.filter(HabitAPI.data.todoIds,function(id){return !HabitAPI.data.tasks[id].completed});

            for(var i = 0; i<filteredTodos.length;i++){
                t = HabitAPI.data.tasks[filteredTodos[i]];
                if(todoOffset > i){
                    // above the fold
                    t.cury = taskWin.cury;
                    t.outby = i - todoOffset;
                    t.border=0;

                } else if (i >= maxTodoLines + todoOffset) {
                    // below the fold
                    t.cury = taskWin.cury-1;
                    t.outby = i-maxTodoLines + todoOffset+1;
                    t.border=0;

                } else {
                    // right on target
                    t.cury = taskWin.cury;
                    
                    if(i===todoOffset && todoOffset > 0){
                        t.border=-1;
                    } else if(i=== maxTodoLines + todoOffset -1 && filteredTodos.length > maxTodoLines + todoOffset){
                        t.border=1;
                    } else {
                        t.border = 0;
                    }
                    
                    t.outby = 0;
                    taskWin.addstr('[' + (t.completed?'X':' ') + '] ' + t.text.substr(0,taskWin.width-5));

                    if (t.up - t.down < 0){
                        taskWin.cursor(taskWin.cury,3);
                        taskWin.addstr('-');
                    } 
                    taskWin.cursor(taskWin.cury+1,2);
                }
                items.push(t);
            }
            if(filteredTodos.length > maxTodoLines + todoOffset){
                taskWin.centertext(taskWin.cury," - - - - - - ".substring(0,taskWin.width-3));
            }

            // draw where the cursor is now
            if(items.length > 0 && items[currentIndex] && items[currentIndex].cury ){
                try{
                    taskWin.chgat(items[currentIndex].cury, 2, taskWin.width-4, nc.attrs.STANDOUT, nc.colorPair(5));
                } catch(e){
                    LogWindow.log(e,1);
                }
            } else {
                currentIndex = 0;
            }

            taskWin.refresh();
        },
        moveCursor: function(inc){
            LogWindow.log("Moving cursor " + (inc > 0 ? "down" : "up"));
            if(items[currentIndex].border == inc){
                LogWindow.log("Hit fold going " + (inc > 0 ? "down" : "up"));
                if(items[currentIndex].type == "habit"){
                    habitOffset += inc;
                } else if(items[currentIndex].type == "daily"){
                    dailyOffset += inc;
                } else if(items[currentIndex].type == "todo"){
                    todoOffset += inc;
                }
                TaskList.refresh();

            } else if(currentIndex + inc < items.length && currentIndex + inc >= 0){
                if(items[currentIndex + inc].outby != 0){
                    if(items[currentIndex + inc].type == "habit"){
                        habitOffset += items[currentIndex + inc].outby;
                    } else if(items[currentIndex + inc].type =="daily"){
                        dailyOffset += items[currentIndex + inc].outby;
                    } else if(items[currentIndex + inc].type =="todo"){
                        todoOffset += items[currentIndex + inc].outby;
                    }
                    currentIndex += inc;
                    TaskList.refresh();
                } else {
                    taskWin.chgat(items[currentIndex].cury, 2, taskWin.width-4, nc.attrs.NORMAL, nc.colorPair(0));
                    currentIndex += inc;
                    taskWin.chgat(items[currentIndex].cury, 2, taskWin.width-4, nc.attrs.NORMAL, nc.colorPair(5));
                    taskWin.refresh();
                }
            }
        },
        searchCursor: function(str){
            // this is pretty difficult to read
            // it pulls out the text values of each
            // then finds the index of the first one that matches the entire substring we are looking for
            var ind = _.indexOf(_.pluck(items,'text'),_.find(_.pluck(items,'text'),function(val){return (val.toLowerCase().indexOf(str.toLowerCase()) >= 0)}));
            
            if(ind >= 0){
                currentIndex = ind;
                if(items[ind].outby != 0){
                    var offby = items[ind].outby;
                    if(items[ind].type == "habit"){
                        habitOffset += offby;
                    } else if(items[ind].type =="daily"){
                        dailyOffset += offby;
                    } else if(items[ind].type =="todo"){
                        todoOffset += offby;
                    }
                }
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

    var logWindow = new nc.Window(15, nc.cols, nc.cols),
        lines = new Array(12),
        keyPress = "";

    logWindow.move(nc.lines - 17,0);

    // an example of how to debug stuck on input error
    //logWindow.on('inputChar', function (c, i) {
    //    LogWindow.log("Stuck on Input")
    //});

    function refresh(){
        logWindow.erase();
        logWindow.cursor(0,0);
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
            // check to see if hte last one is either equal to the msg, or if 

            if(typeof lines[lines.length-1] == "string" && lines[lines.length-1] == msg){
                lines[lines.length-1] = msg + ' [1]';
            }

            if(typeof lines[lines.length-1] == "string" && lines[lines.length-1].indexOf(msg + ' [') == 0 && lines[lines.length-1].indexOf(']') > 0){
                var match = lines[lines.length-1].match(/(\[\d*\])/g);
                if(match && match.length){
                    lines[lines.length-1] = msg + " [" + (parseInt(match[0].substring(1,match[0].length-1)) + 1) + "]";
                    
                } else {
                    lines.push(msg);
                }
            } else {
                lines.push(msg);
            }
            if(lines.length > 12){
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

            } if((i === 106 || i === 258)){ // j, up arrow: move up

                TaskList.moveCursor(1);

            } else if((i === 107 || i === 259)){ // k, down arrow : move down

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


*/
exports.refreshStatsView = refreshStatsView;
exports.refreshStatusBar = refreshStatusBar;
exports.TaskList = TaskList;
exports.LogWindow = LogWindow;
