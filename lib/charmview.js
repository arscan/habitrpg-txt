var charm = require('charm')(),
    HabitAPI = require('./habitapi.js'),
    _ = require('underscore'),
    size = process.stdout.getWindowSize(),
    COLORS=require('../colors.json'),
    kb;

charm.pipe(process.stdout);
charm.reset();
charm.background('black');
charm.erase('screen');
charm.cursor(false);

process.on('SIGWINCH', function(){
  charm.reset();
  if(process.stdout.getWindowSize()[0] > 20){
      size = process.stdout.getWindowSize();
        refreshStatsView();
        refreshStatusBar();
        TaskList.refresh();
  }
});


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
    , UPTRIANGLE: '\u25b2'
    , DOWNTRIANGLE: '\u25bc'
}

var InputWindow = (function(){
    var inputMode = "normal",
        buffer = "";

    function setKeybinding(_kb){
        kb = _kb;
    }
    function setMode(mode){

        inputMode = mode; 
        charm.position(0,size[1]);
        if(inputMode === "command"){
            charm.erase('line');
            if (kb == 'emacs')
                buffer = "M-x ";
            charm.cursor(true);
            charm.write(buffer);

        } else if(inputMode === "search"){
            charm.erase('line');
            if (kb == 'emacs')
                buffer = "I-search: ";
            charm.write(buffer);
            charm.cursor(true);
        } else {
            charm.cursor(false);
        }

    }

    return {
        setMode: setMode,
        setKeybinding: setKeybinding,
        getKeybinding: function(){
            return kb;
        },
        getMode: function(){
            return inputMode;
        },
        keyPress: function(key){
            var i = 0,
                cmdpos = 0;

            if(kb == 'emacs')
                cmdpos = 4;

            if(inputMode == 'normal'){
                charm.cursor(false);
            } else {
                if(key.name == 'tab' && kb == 'emacs'){
                    setMode('normal');
                } else if(key.name == 'escape'){
                    buffer = "";
                    charm.position(0,size[1])
                        .erase('line');
                    setMode('normal');

                } else if (key.name === 'backspace' && buffer.length > cmdpos) {
                    buffer = buffer.substring(0,buffer.length-1);
                    charm.position(0,size[1])
                        .left(1)
                        .erase('end')
                        .write(buffer);

                    LogWindow.log(buffer);

                    if(buffer.length === 0){
                        setMode('normal');
                    }
                    if(inputMode == 'search'){
                        if(buffer.substring(1).length > 0){
                            TaskList.searchCursor(buffer.substring(1));
                        }
                    }
                    
                } else if (key.name === "return") {
                    if (buffer.length > 1 || kb == 'emacs') {
                        var args, cmd;
                        if (buffer.substring(0,1) === ':')
                            cmd = buffer.substring(cmdpos+1).split(' ', 1).join('').trim();
                        else if (buffer.substring(0,1) != '/' && buffer.substring(0,10) != "I-search: ")
                            cmd = buffer.substring(cmdpos).split(' ', 1).join('').trim();
                        if(cmd) {
                            args = buffer.substring(buffer.indexOf(cmd)+cmd.length+1).trim();

                            switch (cmd.toLowerCase()) {
                            case 't':
                                if (args.length) {
                                    charm.erase('line');
                                    setMode('normal');
                                    HabitAPI.createTask("todo",args);
                                    buffer = '';
                                }
                                break;
                            case 'h':
                                if (args.length) {
                                    charm.erase('line');
                                    setMode('normal');
                                    HabitAPI.createTask("habit",args);
                                    buffer = '';
                                }
                                break;
                            case 'd':
                                if (args.length) {
                                    charm.erase('line');
                                    setMode('normal');
                                    HabitAPI.createTask("daily",args);
                                    buffer = '';
                                }
                                break;
                            case 'r':
                                if (args.length) {
                                    charm.erase('line');
                                    setMode('normal');
                                    TaskList.renameTask(args);
                                    buffer = '';
                                }
                                break;

                            case 'delete':
                                charm.erase('line');
                                TaskList.deleteTask();
                                setMode('normal');
                                buffer='';
                                break;

                            case 'emacs':
                                setKeybinding('emacs');
                                buffer='';
                                setMode('normal');
                                break;

                            case 'vi':
                                setKeybinding('vi');
                                buffer='';
                                setMode('normal');
                                break;

                            case 'q':
                                process.exit(0);
                                break;
                            default:
                                buffer='';
                                charm.erase('line')
                                    .column(0)
                                    .write('Unknown command: ' + cmd);
                                setMode('normal');
                            }
                        } else if (buffer.substring(0,1) === '/' || buffer.substring(0,10) === "I-search: ") {
                            buffer='';
                            setMode('normal');
                            charm.erase('line');

                        }
                    }

                } else if(!key.ctrl && !key.meta && buffer.length < size[0] - 4) {
                    if(key.name == 'space')
                        buffer = buffer + ' ';
                    else if(key.name >= 'a' && key.name <= 'z') {
                        if(key.name.length == '1')
                            buffer = buffer + key.name;
                    }
                    else if(!key.name && key) // for those keys thats have no name
                        buffer = buffer + key;
                    charm.position(0,size[1])
                        .write(buffer);

                    if(inputMode == 'search'){
                        charm.cursor(false);
                        if(buffer.substring(1).length > 0 && kb == 'vi'){
                            TaskList.searchCursor(buffer.substring(1));
                        } else if (kb == 'emacs')
                            TaskList.searchCursor(buffer.substring(10));
                    }
                    
                } else if (key.name == 'escape' || (key.ctrl && key.name == 'g')) { // esc or C-g
                    buffer = '';
                    charm.position(0,size[1])
                        .erase('line');
                    setMode('normal');
                }

            }
        }
}

})();

var refreshStatsView = (function(){

    function drawBar(val, valMax, label, rowStart){
        var onForeground = COLORS.STATS_BAR_ON_FG,
            onBackground = COLORS.STATS_BAR_ON_BG,
            offForeground = COLORS.STATS_BAR_OFF_FG;

        //offbackground not really working at the moment
        //because i am having trouble making the background true black... so i use a display reset instead.
        
        var totalwidth = size[0] - 9,
            onWidth = Math.floor(totalwidth * (val / valMax)),
            offWidth = totalwidth - onWidth,
            poststring = '' + val + '/' + valMax,
            percstring = ' (' + Math.floor(val/valMax*100) + '%)',
            paddedstring = label + Array(totalwidth - label.length + 1 - poststring.length - percstring.length).join(' ') + poststring + percstring;

        charm.position(5,rowStart)
             .background(onBackground)
             .foreground(onForeground);
        for (var i = 0; i < paddedstring.length; i++){
            if(i > onWidth){
                charm.display('reset')
                    .foreground(offForeground);

            }
            charm.write(paddedstring.charAt(i));
        }

        charm.display('reset');
    }

    function drawBox(col, row, width,height){
        var inc = row+1;

        charm.position(col,row)
            .foreground(COLORS.STATS_BORDER);
        charm.write(CHARS.TOPLEFT + Array(width).join(CHARS.HORIZONTAL) + CHARS.TOPRIGHT);
        while(inc<row+height){
            charm.position(col,inc);
            charm.write(CHARS.VERTICAL);
            charm.position(col+width,inc);
            charm.write(CHARS.VERTICAL);
            inc++;
        }
        charm.position(col,row+height);
        charm.write(CHARS.BOTTOMLEFT + Array(width).join(CHARS.HORIZONTAL) + CHARS.BOTTOMRIGHT);
        charm.display('reset');


    }
    

    return function(){
        if(!HabitAPI.data || !HabitAPI.data.stats) return false;

        charm.position(1,30);
        
/*
        for(i = 0; i<256; i++){
            charm.background(i)
                .write(" ");
        }
        */
        charm.display('reset');
        charm.foreground('white');

        drawBox(2,2,size[0]-4,6);
        charm.position(4,2)
            .foreground(COLORS.STATS_LABEL_USER)
            .write(' ' + (HabitAPI.data.auth.local?HabitAPI.data.auth.local.username:HabitAPI.data.profile.name))
            .foreground(COLORS.STATS_LABEL_LVL)
            .write(' [lvl ' + HabitAPI.data.stats.lvl + '] ');

        drawBar(Math.ceil(HabitAPI.data.stats.hp),HabitAPI.data.stats.maxHealth,'Health',4);
        drawBar(Math.floor(HabitAPI.data.stats.exp),HabitAPI.data.stats.toNextLevel,'Exp',6);

        return true;
    }

})();

var refreshStatusBar = (function(){

    return function(){
        var state = (HabitAPI.connected?(HabitAPI.unsaved?'unsaved':''):'disconnected');
        charm.push()
            .position(0,size[1]-1)
            .display('reset')
            .background(COLORS.STATUS_BAR_BG)
            .foreground(COLORS.STATUS_BAR_FG)
            .write("HabitRPG (? for help) " + Array(size[0] - Math.min(state.length, size[0])-21).join(' '))
            .position(size[0]-(Math.min(state.length, size[0])),size[1]-1)
            .foreground(COLORS.STATUS_BAR_ERROR_FG)
            .write(state)
            .display('reset')
            .pop();

    }

})();

var LogWindow = (function(){

    var lines = new Array(12),
        keyPress = "",
        visible = false;

    function refresh(){
        charm.push(true);
        if(!visible) return false;

        charm.position(0,size[1]-16)
            .foreground(248)
            .background(16)
            .write(Array(size[0]+1).join(CHARS.HORIZONTAL));
        for(var i = 0; i<lines.length;i++){
            charm.position(0,size[1]-15+i)
                .move(0,1)
                .erase('line')
                .position(0,size[1]-15+i);

            if(typeof lines[i] != "undefined"){
                charm.write('# ' + lines[i]);
            }
        }
        charm.position(0,size[1]-3)
            .write(Array(size[0]+1).join(CHARS.HORIZONTAL))
            .position(0,size[1]-2)
            .erase('line')
            .position(0,size[1]-2)
            .write('# ' + keyPress);
        charm.pop();
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
            if(key.name)
                keyPress =  key.name;
            else 
                keyPress = key;
            if(key.ctrl)
                keyPress = "C-" + keyPress;
            else if(key.meta)
                keyPress = "M-" + keyPress;
            refresh();
        },
        refresh: refresh,
        show: function(){
            LogWindow.log("showing log");
            visible = true;
            refresh();

        },
        hide: function(){
            LogWindow.log("hiding log");
            visible = false;
            TaskList.refresh();
        },
        toggle: function(){
            visible = !visible;
            refresh();
            TaskList.refresh();
        }
    }
})();

var TaskList = (function(){

    var items = [],
        currentIndex = 0,
        maxHabitLines = 40,
        maxDailyLines = 40,
        maxTodoLines = 40,
        maxRewardLines = 40,
        habitOffset = 0,
        dailyOffset = 0,
        todoOffset = 0,
        rewardOffset = 0;

    function drawHeader(label){
        charm.display('reset')
            .foreground(COLORS.HEADER_BAR_LINE)
            .erase('line')
            .column(2)
            .write(Array(size[0]-2).join(CHARS.HORIZONTAL))
            .column(4)
            .foreground(COLORS.HEADER_BAR_LABEL)
            .write(' ' + label + ' ')
            .display('reset');
    }

    function setSectionSizes(){
        var totalLines = size[1]-14;
        var filteredTodos = _.filter(HabitAPI.data.todoIds,function(id){return !HabitAPI.data.tasks[id].completed});
        var neededLines = filteredTodos.length + HabitAPI.data.habitIds.length + HabitAPI.data.dailyIds.length + HabitAPI.data.rewardIds.length;

        if(neededLines + 9 > totalLines){
            // we have more stuff than total lines
            // lets start by breaking up into 4

            var minSize = Math.max(1,Math.floor((totalLines - 9) / 4));

            maxRewardLines = Math.max(1,Math.min(HabitAPI.data.rewardIds.length,minSize));
            maxHabitLines = Math.max(1,Math.min(HabitAPI.data.habitIds.length,minSize));
            maxDailyLines = Math.max(1,Math.min(HabitAPI.data.dailyIds.length,minSize));

            // Let the todos suck up the rest
            // Good enough for now
            maxTodoLines = (totalLines-9)-maxHabitLines-maxDailyLines -maxRewardLines;
            

        }

    }
    
    return {
        refresh: function(){
            var t, // for convenience
                cp = 0

            setSectionSizes();
            charm.push();
            
            items = [];

            charm.position(2,10)
                .erase('line');
            cp = 10;

            drawHeader("Rewards [" + Math.floor(HabitAPI.data.stats.gp) + " gold]");
            if(rewardOffset > 0){

                charm.move(0,1)
                    .erase('line')
                    .column(2)
                    .foreground(235)
                    .write(Array(Math.floor(size[0]/5)).join("  " + CHARS.UPTRIANGLE + "  "))
                    .display('reset');
                cp++;
            } else {
                charm.move(0,1)
                    .column(0)
                    .erase('line');
                cp++;
            }
            charm.move(0,1)
                .erase('line');
            cp++;

            for(var i = 0; i<HabitAPI.data.rewardIds.length;i++){
                t = HabitAPI.data.tasks[HabitAPI.data.rewardIds[i]];
                charm.column(2);
                if(rewardOffset > i){
                    // above the fold
                    t.cury = cp;
                    t.outby = i - rewardOffset;
                    t.border=0;

                    
                } else if (i >= maxRewardLines + rewardOffset) {
                    // below the fold
                    t.cury = cp-1;
                    t.outby = i-maxRewardLines + rewardOffset+1;
                    t.border=0;

                } else {
                    // right on target
                    t.cury = cp;
                    
                    if(i===rewardOffset && rewardOffset > 0){
                        t.border=-1;
                    } else if(i=== maxRewardLines + rewardOffset -1 && HabitAPI.data.rewardIds.length > maxRewardLines + rewardOffset){
                        t.border=1;
                    } else {
                        t.border = 0;
                    }

                    t.outby = 0;

                    if(currentIndex == items.length){
                        charm.background(248)
                            .foreground(16)
                            .write(Array(size[0]-2).join(' '))
                            .column(2);
                    }
                    charm.write('[' + t.value + 'g] ' + t.text.substr(0,size[0]-5));
                    if (t.up - t.down < 0){
                        charm.column(3)
                            .write('-');
                        
                    } 
                    if(currentIndex == items.length){
                        charm.display('reset')
                            .foreground(248);
                    }

                    charm.move(0,1)
                        .column(2)
                        .erase('line');
                    cp++;
                }
                items.push(t);

            }

            if(HabitAPI.data.rewardIds.length > maxRewardLines + rewardOffset){
                charm.foreground(235)
                    .write(Array(Math.floor(size[0]/5)).join("  " + CHARS.DOWNTRIANGLE + "  "))
                    .display('reset');
            }
            charm.move(0,1)
                .erase('line');
            cp++;

            drawHeader("Habits [" + HabitAPI.data.stats.habitToday + " today]");
            if(habitOffset > 0){

                charm.move(0,1)
                    .erase('line')
                    .column(2)
                    .foreground(235)
                    .write(Array(Math.floor(size[0]/5)).join("  " + CHARS.UPTRIANGLE + "  "))
                    .display('reset');
                cp++;
            } else {
                charm.move(0,1)
                    .column(0)
                    .erase('line');
                cp++;
            }
            charm.move(0,1)
                .erase('line');
            cp++;

            for(var i = 0; i<HabitAPI.data.habitIds.length;i++){
                t = HabitAPI.data.tasks[HabitAPI.data.habitIds[i]];
                charm.column(2);
                if(habitOffset > i){
                    // above the fold
                    t.cury = cp;
                    t.outby = i - habitOffset;
                    t.border=0;

                } else if (i >= maxHabitLines + habitOffset) {
                    // below the fold
                    t.cury = cp-1;
                    t.outby = i-maxHabitLines + habitOffset+1;
                    t.border=0;

                } else {
                    // right on target
                    t.cury = cp;
                    
                    if(i===habitOffset && habitOffset > 0){
                        t.border=-1;
                    } else if(i=== maxHabitLines + habitOffset -1 && HabitAPI.data.habitIds.length > maxHabitLines + habitOffset){
                        t.border=1;
                    } else {
                        t.border = 0;
                    }
                    
                    t.outby = 0;

                    if(currentIndex == items.length){
                        charm.background(248)
                            .foreground(16)
                            .write(Array(size[0]-2).join(' '))
                            .column(2);
                    }
                    charm.write('[' + (t.up - t.down == 0?' ':'' + Math.abs(t.up - t.down)) + '] ' + t.text.substr(0,size[0]-5));
                    if (t.up - t.down < 0){
                        charm.column(3)
                            .write('-');
                        
                    } 
                    if(currentIndex == items.length){
                        charm.display('reset')
                            .foreground(248);
                    }

                    charm.move(0,1)
                        .column(2)
                        .erase('line');
                    cp++;
                }
                items.push(t);
                
            }
            
            if(HabitAPI.data.habitIds.length > maxHabitLines + habitOffset){
                charm.foreground(235)
                    .write(Array(Math.floor(size[0]/5)).join("  " + CHARS.DOWNTRIANGLE + "  "))
                    .display('reset');
            }
            charm.move(0,1)
                .erase('line');
            cp++;

            drawHeader("Daily [" + HabitAPI.data.stats.dailyToday + " complete]");
            charm.move(0,1)
                .erase('line');
            cp++;

            if(dailyOffset > 0){
                charm.column(0)
                    .erase('line')
                    .foreground(235)
                    .write(Array(Math.floor(size[0]/5)).join("  " + CHARS.UPTRIANGLE + "  "))
                    .move(0,1)
                    .erase('line')
                    .display('reset');
                cp++;
            } else {
                charm.move(0,1)
                    .erase('line');
                cp++;
            }

            for(var i = 0; i<HabitAPI.data.dailyIds.length;i++){
                t = HabitAPI.data.tasks[HabitAPI.data.dailyIds[i]];
                charm.column(2);
                if(dailyOffset > i){
                    // above the fold
                    t.cury = cp;
                    t.outby = i - dailyOffset;
                    t.border=0;

                } else if (i >= maxDailyLines + dailyOffset) {
                    // below the fold
                    t.cury = cp-1;
                    t.outby = i-maxDailyLines + dailyOffset+1;
                    t.border=0;

                } else {
                    // right on target
                    t.cury = cp;
                    
                    if(i===dailyOffset && dailyOffset > 0){
                        t.border=-1;
                    } else if(i=== maxDailyLines + dailyOffset -1 && HabitAPI.data.dailyIds.length > maxDailyLines + dailyOffset){
                        t.border=1;
                    } else {
                        t.border = 0;
                    }
                    
                    t.outby = 0;
                    if(currentIndex == items.length){
                        charm.background(248)
                            .foreground(16)
                            .write(Array(size[0]-2).join(' '))
                            .column(2);
                    }
                    charm.write('[' + (t.completed?'X':' ') + '] ' + t.text.substr(0,size[0]-5));
                    if(currentIndex == items.length){
                        charm.display('reset')
                            .foreground(248);
                    }

                    if (t.up - t.down < 0){
                        charm.column(3);
                        taskWin.addstr('-');
                    } 
                    charm.move(0,1)
                        .erase('line');
                    cp++;
                }
                items.push(t);

            }

            if(HabitAPI.data.dailyIds.length > maxDailyLines + dailyOffset){
                charm.foreground(235)
                    .write(Array(Math.floor(size[0]/5)).join("  " + CHARS.DOWNTRIANGLE + "  "))
                    .display('reset');
            }

            charm.move(0,1)
                .erase('line');
            cp++;
            //api doesn't support figuring out how many done today yet
            //drawHeader("Todos [" + HabitAPI.data.stats.todoToday + " completed today]");
            drawHeader("Todos");
            charm.move(0,1)
                .erase('line');
            cp++;
            if(todoOffset > 0){
                charm.column(0)
                    .erase('line')
                    .foreground(235)
                    .write(Array(Math.floor(size[0]/5)).join("  " + CHARS.UPTRIANGLE + "  "))
                    .move(0,1)
                    .erase('line')
                    .display('reset');
                cp++;
            } else {
                charm.move(0,1)
                    .erase('line');
                cp++;
            }

            var filteredTodos = _.filter(HabitAPI.data.todoIds,function(id){return !HabitAPI.data.tasks[id].completed});

            for(var i = 0; i<filteredTodos.length;i++){
                t = HabitAPI.data.tasks[filteredTodos[i]];
                charm.column(2);
                if(todoOffset > i){
                    // above the fold
                    t.cury = cp;
                    t.outby = i - todoOffset;
                    t.border=0;

                } else if (i >= maxTodoLines + todoOffset) {
                    // below the fold
                    t.cury = cp-1;
                    t.outby = i-maxTodoLines + todoOffset+1;
                    t.border=0;

                } else {
                    // right on target
                    t.cury = cp;
                    
                    if(i===todoOffset && todoOffset > 0){
                        t.border=-1;
                    } else if(i=== maxTodoLines + todoOffset -1 && filteredTodos.length > maxTodoLines + todoOffset){
                        t.border=1;
                    } else {
                        t.border = 0;
                    }
                    
                    t.outby = 0;
                    if(currentIndex == items.length){
                        charm.background(248)
                            .foreground(16)
                            .write(Array(size[0]-2).join(' '))
                            .column(2);
                    }
                    charm.write('[' + (t.completed?'X':' ') + '] ' + t.text.substr(0,size[0]-5));
                    if(currentIndex == items.length){
                        charm.display('reset')
                            .foreground(248);
                    }

                    if (t.up - t.down < 0){
                        charm.column(3);
                        charm.write('-');
                    } 
                    charm.move(0,1)
                        .erase('line');
                    cp++;
                }
                items.push(t);
            }
            if(filteredTodos.length > maxTodoLines + todoOffset){
                charm.foreground(235)
                    .write(Array(Math.floor(size[0]/5)).join("  " + CHARS.DOWNTRIANGLE + "  "))
                    .display('reset');
            }
            // clear out to the bottom
            
            for(i = cp+1; i< size[1]-1; i++){
                charm.position(0,i);
                charm.erase('line');
            }

            // this isn't the best way to do this
            // but its good enough for now

            LogWindow.refresh(); // refresh this if its open.
            HelpWindow.refresh(); // refresh this if its open.
            charm.pop();

        },
        moveCursor: function(inc){
            if(!items.length) return;
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
                else if(items[currentIndex].type == "reward"){
                    rewardOffset += inc;
                }
                currentIndex += inc;
                TaskList.refresh();

            } else if(currentIndex + inc < items.length && currentIndex + inc >= 0){
                if(items[currentIndex + inc].outby != 0){
                    if(items[currentIndex + inc].type == "habit"){
                        habitOffset += items[currentIndex + inc].outby;
                    } else if(items[currentIndex + inc].type =="daily"){
                        dailyOffset += items[currentIndex + inc].outby;
                    } else if(items[currentIndex + inc].type =="todo"){
                        todoOffset += items[currentIndex + inc].outby;
                    } else if(items[currentIndex + inc].type == "reward"){
                        rewardOffset += items[currentIndex + inc].outby;
                    }
                    currentIndex += inc;
                    TaskList.refresh();
                } else {
                    currentIndex += inc;
                    TaskList.refresh();
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
                    } else if(items[ind].type =="reward"){
                        rewardOffset += offby;
                    }
                }
            }
            TaskList.refresh();
        
        },
        checkItem: function(){
            if(!items.length) return;
            if(items[currentIndex].type == 'daily' || items[currentIndex].type == 'todo'){

                HabitAPI.completeTask(items[currentIndex].id, !items[currentIndex].completed);

            } else if(items[currentIndex].type == 'habit'){
                HabitAPI.updateHabit(items[currentIndex].id,"up");
            } else if(items[currentIndex].type == 'reward'){
                HabitAPI.buyReward(items[currentIndex].id,"up");
            }

            if(items[currentIndex].type == 'todo'){
                currentIndex--;
            }
            TaskList.refresh();
        },
        decrementHabit: function(){

            if(!items.length) return;

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
            if(currentIndex > 0)
                currentIndex--;
            TaskList.refresh();
        }
        
    }
})(); 

var HelpWindow = (function(){
    var hidden = true;

    // TODO: make some helper funcs for this
    
    function drawBox(col, row, width,height){
        var inc = row+1;

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

    function refresh(){

        if(hidden) return true;
        charm.push();
        if(kb == 'vi'){
            charm.position(7,12)
                .erase('line')
                .write('KEY  DESCRIPTION')
                .move(0,1)
                .erase('line')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  j  down a line')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  k  up a line')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('spc  check off something')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  -  mark down a habit')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  ~  debug log')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  /  search tasks')
                .move(0,1)
                .erase('line')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  :q  quits')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  :h  add a habit')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  :d  add a daily')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  :delete    you can guess')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  :vi    vi style keys')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  :emacs    emacs style keys')
                .move(0,1)
                .erase('line');
        }
        if(kb == 'emacs'){
            charm.position(7,12)
                .erase('line')
                .write('KEY  DESCRIPTION')
                .move(0,1)
                .erase('line')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  n or C-n  down a line')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  p or C-p  up a line')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  C-spc  check off something')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  C-d  mark down a habit')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  ~  debug log')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  C-s  search tasks')
                .move(0,1)
                .erase('line')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  M-x q  quits')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  M-x h  add a habit')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  M-x d  add a daily')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  M-x delete    you can guess')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  M-x vi    vi style keys')
                .move(0,1)
                .column(7)
                .erase('line')
                .write('  M-x emacs    emacs style keys')
                .move(0,1)
                .erase('line');
        }

drawBox(5,10,size[0]-8,18); 
charm.pop();
}

return {
    refresh: refresh,
    toggle: function(){
        hidden = !hidden;
        TaskList.refresh();
        refresh();
    }
}
})();

InputWindow.setMode('normal');

exports.refreshStatsView = refreshStatsView;
exports.refreshStatusBar = refreshStatusBar;
exports.InputWindow = InputWindow;
exports.HelpWindow = HelpWindow;
exports.TaskList = TaskList;
exports.LogWindow = LogWindow;

