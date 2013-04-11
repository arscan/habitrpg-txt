var nc = require('ncurses'),
    conf = require('nconf'),
    HabitAPI = require('./lib/habitapi.js'),
    rootWin = new nc.Window();

conf.argv().file({file: __dirname + "/config.json"}).defaults({
    'APIURL': 'https://habitrpg.com/api/v1',
    'APIUSER': '001122',
    'APITOKEN': 'ABCABC'
});

/* set some color pairs */
nc.colorPair(1,nc.colors.BLACK,nc.colors.WHITE);
nc.colorPair(2,nc.colors.WHITE,nc.colors.BLACK);
nc.colorPair(3,nc.colors.BLACK,nc.colors.CYAN);
/* common functions */


/* Window update Functions */

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
        statsWin.addstr(HabitAPI.data.auth.local.username);
        statsWin.addstr(' [lvl ' + HabitAPI.data.stats.lvl + ']');
        statsWin.refresh();

        drawBar(1,2,Math.ceil(HabitAPI.data.stats.hp),HabitAPI.data.stats.maxHealth,'Health',2);
        drawBar(1,2,Math.floor(HabitAPI.data.stats.exp),HabitAPI.data.stats.toNextLevel,'Exp',4);

        return true;
    }

})();

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

var toggleHelp = (function(){
    var helpWin = new nc.Window(15, nc.cols-8);

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
    helpWin.addstr('  -  down a habit');
    helpWin.cursor(8,2);
    helpWin.addstr(' :q quits');
    helpWin.cursor(9,2);
    helpWin.addstr(' :h <txt> add a habit');
    helpWin.cursor(10,2);
    helpWin.addstr(' :d <txt> add a daily');
    helpWin.cursor(11,2);
    helpWin.addstr(' :t <txt> add a todo');
    helpWin.cursor(12,2);
    helpWin.addstr(' :delete');

    return function(){
        if(helpWin.hidden){
            helpWin.show();
        } else {
            helpWin.hide();
        }
        helpWin.refresh();
    }

})();


var refreshTask = (function(){

    var taskWin = new nc.Window(nc.lines-11, nc.cols, nc.cols),
        items = [];

    taskWin.move(9,0);
    
    function drawHeader(title){
        taskWin.hline(taskWin.width-2, nc.ACS.HLINE);
        taskWin.cursor(taskWin.cury,0);
        taskWin.addstr('  ');
        taskWin.cursor(taskWin.cury,3);
        taskWin.addstr(' ' + title + ' ');
        taskWin.cursor(taskWin.cury,0);
    }
    
    return function(){
        var t; // for convenience
        items = [];

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
            t.cury = taskWin.cury;
            items.push(t);

            taskWin.cursor(taskWin.cury+1,2);

            taskWin.addstr('[' + (t.completed?'X':' ') + '] ' + t.text.substr(0,taskWin.width-5));
        }

        taskWin.cursor(taskWin.cury+2,0);
        drawHeader("Todos [" + HabitAPI.data.stats.todoToday + " completed today]");
        taskWin.cursor(taskWin.cury+1,0);

        for(var i = 0; i<HabitAPI.data.todoIds.length;i++){
            t = HabitAPI.data.tasks[HabitAPI.data.todoIds[i]];
            if(!t.completed){
                t.cury = taskWin.cury;
                items.push(t);
                taskWin.cursor(taskWin.cury+1,2);
                taskWin.addstr('[' + (t.completed?'X':' ') + '] ' + t.text.substr(0,taskWin.width-5));
            }
        }

        taskWin.refresh();
    }
})() 

HabitAPI.onDataChange(function(){
    refreshStatsView();
    refreshStatusBar();
    refreshTask();
});

HabitAPI.onConnectedChange(function(){
    refreshStatusBar();
});



//setInterval(toggleHelp,4000);

HabitAPI.init(conf.get("APIURL"),conf.get("APIUSER"),conf.get("APITOKEN"));



/*
function taskWindow(){



    drawnFn = function(){

    }


    return drawFn;

}

function taskWindow(){


    drawnFn = function(){

    }


    return drawFn;

}


function statsWindow

HabitAPI.init(conf.get("APIURL"),conf.get("APIUSER"),conf.get("APITOKEN"));


var data = {
    username:'something',
    level:1,
    health:45,
    healthMax:50,
    exp: 16,
    expMax: 20,
    gold: 5,
    silver: 10,
    habits: [
        {name:'1 Hour Productive Work',up:1,down:0},
        ],
    daily: [
        {name:'Go to Gym',done:0},
        ],
    todos: [
        {name:'Ring Insurance', done:0},
    ],
    rewards: [   
        { name: 'Leather Armor', 'price': 30, description: 'Helps with stuff'},
        ],

};
var refresh =  function(){
        request.get(apiURL + "/user").set('Accept', 'application/json').set('X-API-User', apiUser).set('X-API-Key', apiToken).end(function(error,res){
        if(error || !res.body.auth){ 
            connected=false;
            drawFn();
            
            return;
        }
        connected = true;
        data.username = res.body.auth.local ? res.body.auth.local.username : res.body.profile.name;
        data.level = res.body.stats.lvl;
        data.health = Math.ceil(res.body.stats.hp);
        data.healthMax=res.body.stats.maxHealth;
        data.exp = Math.floor(res.body.stats.exp);
        data.expMax = res.body.stats.toNextLevel;
        data.habits = [];
        data.daily = [];
        data.todos = [];
        for(var i = 0; i<res.body.habitIds.length;i++){
            data.habits[i] = {};
            data.habits[i].id = res.body.habitIds[i]
            data.habits[i].name = res.body.tasks[res.body.habitIds[i]].text;
            data.habits[i].up = 0;
            data.habits[i].down = 0; data.habits[i].value = res.body.tasks[res.body.habitIds[i]].value;
            var habitsback = 0;
            var yesterdayDate = new Date().getTime() - 1000*60*60*24;
            var prevVal = data.habits[i].value;
            if(res.body.tasks[res.body.habitIds[i]].history){
                var habitsback = res.body.tasks[res.body.habitIds[i]].history.length-1;
                //console.log(res.body.tasks[res.body.habitIds[i]].history[habitsback]);
                //process.exit(0); 

                while(res.body.tasks[res.body.habitIds[i]].history && habitsback >= 0 && res.body.tasks[res.body.habitIds[i]].history[habitsback] && res.body.tasks[res.body.habitIds[i]].history[habitsback].date > yesterdayDate){
                    
                    if(prevVal >= res.body.tasks[res.body.habitIds[i]].history[habitsback].value){
                        data.habits[i].up++; 
                    } else {
                        data.habits[i].down++; 
                    }
                    prevVal = res.body.tasks[res.body.habitIds[i]].history[habitsback].value;
                    habitsback--;
                }
            }
            
        }
        for(var i = 0; i<res.body.dailyIds.length;i++){
            data.daily[i] = {};
            data.daily[i].id = res.body.dailyIds[i]
            data.daily[i].name = res.body.tasks[res.body.dailyIds[i]].text;
            data.daily[i].up = res.body.tasks[res.body.dailyIds[i]].up;
            data.daily[i].down = res.body.tasks[res.body.dailyIds[i]].down;
            data.daily[i].done = res.body.tasks[res.body.dailyIds[i]].completed;
            data.daily[i].value = res.body.tasks[res.body.dailyIds[i]].value;
        }
        var validtodos = 0;
        for(var i = 0; i<res.body.todoIds.length;i++){

            if(!res.body.tasks[res.body.todoIds[i]].completed){
                data.todos[validtodos] = {};
                data.todos[validtodos].id = res.body.todoIds[i]
                data.todos[validtodos].name = res.body.tasks[res.body.todoIds[i]].text;
                data.todos[validtodos].up = res.body.tasks[res.body.todoIds[i]].up;
                data.todos[validtodos].down = res.body.tasks[res.body.todoIds[i]].down;
                data.todos[validtodos].done = res.body.tasks[res.body.todoIds[i]].completed;
                data.todos[validtodos].value = res.body.tasks[res.body.todoIds[i]].value;
                validtodos++;   
            }
            
        }
        drawFn();
        });


    }

var setTaskStatus = function(taskid, taskstatus){
    if(!connected) return;

        request.put(apiURL + "/user/task/" + taskid).set('Accept', 'application/json').set('X-API-User', apiUser).set('X-API-Key', apiToken).send({completed:taskstatus}).end(function(res){
    unsaved = false;
            refresh();

});
}
var renameTask = function(taskid, newtext){

    if(!connected) return;

        request.put(apiURL + "/user/task/" + taskid).set('Accept', 'application/json').set('X-API-User', apiUser).set('X-API-Key', apiToken).send({text:newtext}).end(function(res){
    unsaved = false;
            refresh();

});
}

var deleteTask = function(taskid){

    if(!connected) return;

        request.del(apiURL + "/user/task/" + taskid).set('Content-Length',0).set('Accept', 'application/json').set('X-API-User', apiUser).set('X-API-Key', apiToken).end(function(res){
            currentIndex--;
            currentIndex = currentIndex < 0? 0: currentIndex;
        unsaved = false;
            refresh();

});
}

var doHabit = function(taskid, direction){
    if(!connected) return;

        request.post(apiURL + "/user/tasks/" + taskid + "/" + direction).set('Content-Length',0).set('Accept', 'application/json').set('X-API-User', apiUser).set('X-API-Key', apiToken).end(function(res){
    unsaved = false;
    refresh();

});
}

var createTask = function(tasktype, text){
    if(!connected) return;

    if(tasktype == "daily"){

        data[tasktype].push({name: text, up:0,down:0,done:0,value:0}); 

    } else {

        data[tasktype + "s"].push({name: text, up:0,down:0,done:0,value:0}); 
    }
        unsaved=true;
        drawFn();
        request.post(apiURL + "/user/task").set('Accept', 'application/json').set('X-API-User', apiUser).set('X-API-Key', apiToken).send({type:tasktype, text:text, value:0}).end(function(res){
    unsaved = false;
            refresh();

});
}

refresh();
setInterval(refresh,10000);

var items = [];

nc.colorPair(1,nc.colors.BLACK,nc.colors.WHITE);
nc.colorPair(2,nc.colors.WHITE,nc.colors.BLACK);
nc.colorPair(3,nc.colors.WHITE,nc.colors.CYAN);
var statusWindow = new nc.Window(7,nc.cols-4);
var currentIndex = 0;
var unsaved = false;

var helpWindow = new nc.Window(15, nc.cols-8);
helpWindow.move(4,4);
helpWindow.box();
helpWindow.cursor(1,2);
helpWindow.addstr('KEY  DESCRIPTION');
helpWindow.cursor(2,2);
helpWindow.hline(helpWindow.width-4, nc.ACS.HLINE);
helpWindow.cursor(3,2);
helpWindow.addstr('  j  down a line');
helpWindow.cursor(4,2);
helpWindow.addstr('  k  up a line');
helpWindow.cursor(5,2);
helpWindow.addstr('spc  check off something');
helpWindow.cursor(6,2);
helpWindow.addstr('  -  down a habit');
helpWindow.cursor(8,2);
helpWindow.addstr(' :q quits');
helpWindow.cursor(9,2);
helpWindow.addstr(' :h <txt> add a habit');
helpWindow.cursor(10,2);
helpWindow.addstr(' :d <txt> add a daily');
helpWindow.cursor(11,2);
helpWindow.addstr(' :t <txt> add a todo');
helpWindow.cursor(12,2);
helpWindow.addstr(' :delete');
helpWindow.hide();

var drawFn = function(){
    items = [];
    win.clear();

    // draw the header 
        
    drawFooter(win,connected?(unsaved?'unsaved':''):'disconnected');

        // draw the status box 
    statusWindow.move(1,2);
    statusWindow.box();
    statusWindow.cursor(0,2);
    statusWindow.addstr(data.username);
    statusWindow.addstr(' [lvl ' + data.level + ']');
    statusWindow.refresh();
    drawBar(statusWindow,1,2,data.health,data.healthMax,'Health',2);
    drawBar(statusWindow,1,2,data.exp,data.expMax,'Exp',4);

    win.cursor(9,0);
    var habitsDone = 0;

    win.cursor(win.cury+1,0);
    for(var i = 0; i<data.habits.length;i++){
        win.cursor(win.cury+1,2);
        data.habits[i].cury = win.cury;
        data.habits[i].type = 'habits';
        items.push(data.habits[i]);
        win.addstr('[' + (data.habits[i].up - data.habits[i].down == 0?' ':'' + Math.abs(data.habits[i].up - data.habits[i].down)) + '] ' + data.habits[i].name.substr(0,win.width-5));

        if (data.habits[i].up - data.habits[i].down < 0){
            win.cursor(win.cury,3);
            win.addstr('-');
            //win.chgat(win.cury, 3, 1, nc.attrs.NORMAL, nc.colorPair(3));

        } 
        habitsDone += data.habits[i].up;
        habitsDone -= data.habits[i].down;
        
        
    }
    win.cursor(win.cury-data.habits.length-1,0);
    drawHeader(win,"Habits [" + habitsDone + " today]");
    win.cursor(win.cury+data.habits.length+4,0);

    var dailyDone = 0;

    for(var i = 0; i<data.daily.length;i++){
        win.cursor(win.cury+1,2);
        data.daily[i].cury = win.cury;
        data.daily[i].type = 'daily';
        items.push(data.daily[i]);
        win.addstr('[' + (data.daily[i].done?'X':' ') + '] ' + data.daily[i].name.substr(0,win.width-5));
        dailyDone += data.daily[i].done;
        

    }
    win.cursor(win.cury-data.daily.length-1,0);
    drawHeader(win,"Daily [" + dailyDone + " complete]");
    win.cursor(win.cury+data.daily.length+4,0);

    var todosDone = 0;

    for(var i = 0; i<data.todos.length;i++){
        win.cursor(win.cury+1,2);
        data.todos[i].cury = win.cury;
        data.todos[i].type = 'todos';
        items.push(data.todos[i]);
        win.addstr('[' + (data.todos[i].done?'X':' ') + '] ' + data.todos[i].name.substr(0,win.width-5));
        todosDone += data.todos[i].done;
    }

    win.cursor(win.cury-data.todos.length-1,0);
    drawHeader(win,"Todos [" + todosDone + " completed today]");
    win.cursor(win.cury+data.todos.length+4,0);

    if(items.length > 0)
        win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.STANDOUT, nc.colorPair(5));

    win.refresh();
}

function drawHeader(mywin, title){
    mywin.hline(win.width-3, nc.ACS.HLINE);
    mywin.cursor(mywin.cury,0);
    mywin.addstr('  ');
    mywin.cursor(mywin.cury,3);
    mywin.addstr(' ' + title + ' ');
    mywin.cursor(mywin.cury,0);
}


var inputWindow = new nc.Window(1,nc.cols);
var mode = 'normal';
nc.showCursor = false;
inputWindow.move(win.height-1,0);
inputWindow.refresh();
helpWindow.on('inputChar', function (c, i) {
    helpWindow.hide();
    statusWindow.refresh();
    
});
inputWindow.on('inputChar', function (c, i) {
    //helpWindow.hide();
    if(mode == 'normal'){
        inputWindow.clear();
        //console.log(i);
        //process.exit(0);

        if((i === 106 || i === 259) && items.length){ // j, up arrow: move up

            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.NORMAL, nc.colorPair(0));
            currentIndex++;
            if(currentIndex > items.length -1){
                currentIndex = 0;
            }

            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.STANDOUT, nc.colorPair(5));
            win.cursor(items[currentIndex].cury,2);
            win.refresh();

        } else if((i === 107 || i === 258) && items.length){ // k, down arrow : move down

            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.NORMAL, nc.colorPair(0));
            currentIndex--;
            if(currentIndex < 0){
                currentIndex = items.length-1;
            }

            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.STANDOUT, nc.colorPair(5));
            win.cursor(items[currentIndex].cury,2);
            win.refresh();

        } else if(i === 74 && items.length && currentIndex < items.length-1 && items[currentIndex].type === items[currentIndex+1].type){ // J move current selection one up


            // TODO IMPLEMENT THIS IN THE API

            // now move the cursor up

            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.NORMAL, nc.colorPair(0));
            currentIndex++;
            if(currentIndex > items.length -1){
                currentIndex = 0;
            }

            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.STANDOUT, nc.colorPair(5));
            win.cursor(items[currentIndex].cury,2);
            win.refresh();

        } else if(i === 75 && items.length && currentIndex > 0 && items[currentIndex].type === items[currentIndex-1].type){ // K  move current selection one up

            // TODO IMPLEMENT THIS IN THE API

            // now move the cursor down
             
            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.NORMAL, nc.colorPair(0));
            currentIndex--;
            if(currentIndex < 0){
                currentIndex = items.length-1;
            }

            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.STANDOUT, nc.colorPair(5));
            win.cursor(items[currentIndex].cury,2);
            win.refresh();
        } else if((i === 120 || i === 32 || i === 10) && items.length){ // X and Space and Enter
            if(items[currentIndex].type == 'daily' || items[currentIndex].type == 'todos'){
                unsaved = true;
                items[currentIndex].done = (items[currentIndex].done * -1) + 1;
                drawFn();
                setTaskStatus(items[currentIndex].id,items[currentIndex].done);
            } else if(items[currentIndex].type == 'habits'){
                unsaved = true;
                items[currentIndex].up++;
                drawFn();
                doHabit(items[currentIndex].id,'up');
            }

            if(items[currentIndex].type == 'todos'){
                currentIndex--;
            }

        } else if((i === 100 || i === 45) && items.length){ // d, minus to decrement whatever you are on
            unsaved = true;
            if(items[currentIndex].type == 'daily' || items[currentIndex].type == 'todos'){
                setTaskStatus(items[currentIndex].id,items[currentIndex].done);

            } else if(items[currentIndex].type == 'habits'){
                items[currentIndex].down += 1;
                drawFn();
                doHabit(items[currentIndex].id,'down');
            }
        }  else if(i === 63){
            helpWindow.show();
        }  else if(i === 58){
            mode = 'command';
            inputWindow.inbuffer = '';
            nc.showCursor = true;

        }
    }


    if(mode == 'command'){
        if(i === 9){
            mode = 'normal';
            inputWindow.inbuffer = '';
            nc.showCursor = false;
            inputWindow.refresh();
        }else if(i === 330){

            var prev_x = inputWindow.curx;
            inputWindow.delch(inputWindow.height-1, inputWindow.curx);
            inputWindow.inbuffer = inputWindow.inbuffer.substring(0, inputWindow.curx-1) + inputWindow.inbuffer.substring(inputWindow.curx);
            inputWindow.cursor(inputWindow.height-1, prev_x);
            if(inputWindow.inbuffer.length == 0){
                mode = 'normal';
                nc.showCursor = false;
            }
            inputWindow.refresh();

        } else if (i === 127 && inputWindow.curx > 0) {
            var prev_x = inputWindow.curx-1;
            inputWindow.delch(inputWindow.height-1, prev_x);
            inputWindow.inbuffer = inputWindow.inbuffer.substring(0, prev_x) + inputWindow.inbuffer.substring(prev_x+1);
            inputWindow.cursor(inputWindow.height-1, prev_x);
            if(inputWindow.inbuffer.length == 0){
                mode = 'normal';
                nc.showCursor = false;
            }
            inputWindow.refresh();
        } else if (i === nc.keys.NEWLINE) {
            if (inputWindow.inbuffer.length) {

                if (inputWindow.inbuffer[0] === ':') {
                    var cmd = inputWindow.inbuffer.substring(1).split(' ', 1).join('').trim(),
                        args = inputWindow.inbuffer.substring(inputWindow.inbuffer.indexOf(cmd)+cmd.length+1).trim();
                    switch (cmd.toLowerCase()) {
                        case 't':
                            if (args.length) {
                                inputWindow.clear();
                                inputWindow.inbuffer = '';
                                nc.showCursor = false;
                                mode = 'normal';
                                unsaved = true;
                                createTask("todo",args);
                            }
                            break;
                        case 'h':
                            if (args.length) {
                                inputWindow.clear();
                                inputWindow.inbuffer = '';
                                nc.showCursor = false;
                                mode = 'normal';
                                unsaved = true;
                                createTask("habit",args);
                            }
                            break;
                        case 'd':
                            if (args.length) {
                                inputWindow.clear();
                                inputWindow.inbuffer = '';
                                nc.showCursor = false;
                                mode = 'normal';
                                unsaved = true;
                                createTask("daily",args);
                            }
                            break;
                        case 'r':
                            if (args.length) {
                                inputWindow.clear();
                                inputWindow.inbuffer = '';
                                nc.showCursor = false;
                                mode = 'normal';
                                unsaved = true;
                                renameTask(items[currentIndex].id,args);
                            }
                            break;

                        case 'delete':
                            deleteTask(items[currentIndex].id);
                            inputWindow.clear();
                            inputWindow.inbuffer = '';
                            nc.showCursor = false;
                            mode = 'normal';
                            unsaved = true;
                            break;

                        case 'q':
                            nc.cleanup();
                            process.exit(0);
                            break;
                        default:
                            inputWindow.clear();
                            inputWindow.addstr('Unknown command: ' + cmd);
                            mode = 'normal';
                            nc.showCursor = false;

                    }
                }
            }

        } else if (i >= 32 && i <= 126 && inputWindow.curx < inputWindow.width-4) {
            inputWindow.echochar(i);
            inputWindow.inbuffer += c;
        }

    }
    inputWindow.refresh();

});

function drawFooter(mywin, state){
    mywin.cursor(mywin.height-2,0);
    mywin.clrtoeol();
    win.addstr("HabitRPG (? for help)");
    mywin.addstr(mywin.height-2, mywin.width-(Math.min(state.length, mywin.width)), state, mywin.width);
    mywin.chgat(mywin.height-2, 0, mywin.width, nc.attrs.STANDOUT, nc.colorPair(5));
}

function drawBar(mywin, onColorPair, offColorPair, val, valMax, label, rowStart){
    var totalwidth = mywin.width - 6,
        onWidth = Math.floor(totalwidth * (val / valMax)),
        offWidth = totalwidth - onWidth,
        poststring = '' + val + '/' + valMax,
        paddedstring = label + Array(totalwidth - label.length + 1 - poststring.length).join(' ') + poststring;

    mywin.cursor(rowStart,3);
    mywin.attron(nc.colorPair(1));
    for (var i = 0; i < paddedstring.length; i++){
        if(i > onWidth){
            mywin.attroff(nc.colorPair(1));
            mywin.attron(nc.colorPair(2));
        }
        mywin.addstr(paddedstring.charAt(i));
    }
    mywin.attroff(nc.colorPair(2));
    mywin.refresh();
}

*/
/*
process.on('SIGWINCH',function(){
    //setTimeout(function(){
    win = new nc.Window();
    var winsize = process.stdout.getWindowSize();
    //win.resize(winsize[1],winsize[0]);
    //process.exit(0);
    //statusWindow.resize(winsize[0],winsize[1]);
    statusWindow.clear();
    statusWindow.resize(7,winsize[0]-4);
    
    drawFn();
    //},500);

});
*/
