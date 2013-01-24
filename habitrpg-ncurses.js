var nc = require('ncurses'),
          win = new nc.Window(),
          config = require('./config.js');
var data = {
    level:1,
    health:45,
    healthMax:50,
    exp: 16,
    expMax: 20,
    gold: 5,
    silver: 10,
    habits: [
        {name:'1 Hour Productive Work',up:1,down:0},
        {name:'Eat Healthy Meal',up:1,down:1},
        {name:'Junk food / soda',up:0,down:1},
        {name:'Use Notebook',up:1,down:1},
        {name:'Visit Reddit / HN',up:0,down:1}
        ],
    daily: [
        {name:'Go to Gym',done:0},
        {name:'Clean Desk, no VM, etc',done:1},
        {name:'In Work Early',done:0},
        {name:'Weekly Summary',done:0},
        ],
    todos: [
        {name:'Ring Insurance', done:0},
        {name:'book ZQN -> AKL flight', done:0},
        {name:'confirm all flights', done:0},
        {name:'Review IB', done:0},
        {name:'Review ITM', done:0},
        {name:'Call Marriot', done:0},
        {name:'Refactor habitrpg-ncurses', done:0}],
    rewards: [   /* NOT IMPLEMENTED YET */
        { name: 'Leather Armor', 'price': 30, description: 'Helps with stuff'},
        { name: 'Sword 2', 'price': 25, description: 'Helps with stuff'},
        { name: 'potion', 'price': 25, description: 'Helps with stuff'}
        ]

};


var items = [];

nc.colorPair(1,nc.colors.BLACK,nc.colors.WHITE);
nc.colorPair(2,nc.colors.WHITE,nc.colors.BLACK);
nc.colorPair(3,nc.colors.WHITE,nc.colors.CYAN);
var statusWindow = new nc.Window(7,nc.cols-4);
var currentIndex = 0;
var unsaved = false;

var drawFn = function(){
    items = [];

    /* draw the header */
        
    drawFooter(win,(unsaved?'unsaved':''));

        /* draw the status box */
    statusWindow.move(1,2);
    statusWindow.box();
    statusWindow.cursor(0,2);
    statusWindow.addstr(config.username);
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

    win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.STANDOUT, nc.colorPair(5));
    win.refresh();
}

drawFn();

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

inputWindow.on('inputChar', function (c, i) {

    if(mode == 'normal'){
        inputWindow.clear();

        if(i === 106){


            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.NORMAL, nc.colorPair(0));
            currentIndex++;
            if(currentIndex > items.length -1){
                currentIndex = 0;
            }
            
            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.STANDOUT, nc.colorPair(5));
            win.cursor(items[currentIndex].cury,2);
            win.refresh();

        } else if(i === 107){

            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.NORMAL, nc.colorPair(0));
            currentIndex--;
            if(currentIndex < 0){
                currentIndex = items.length-1;
            }
            
            win.chgat(items[currentIndex].cury, 2, win.width-5, nc.attrs.STANDOUT, nc.colorPair(5));
            win.cursor(items[currentIndex].cury,2);
            win.refresh();

        } else if(i === 105){
            unsaved = true;
            if(items[currentIndex].type == 'daily' || items[currentIndex].type == 'todos'){
                items[currentIndex].done = 1;
                process.nextTick(drawFn);

            } else if(items[currentIndex].type == 'habits'){
                items[currentIndex].up += 1;
                process.nextTick(drawFn);
            }

        } else if(i === 120 || i == 32){
            if(items[currentIndex].type == 'daily' || items[currentIndex].type == 'todos'){
                unsaved = true;
                items[currentIndex].done = (items[currentIndex].done * -1) + 1;
                process.nextTick(drawFn);
            }

        } else if(i === 100){
            unsaved = true;
            if(items[currentIndex].type == 'daily' || items[currentIndex].type == 'todos'){
                items[currentIndex].done = 0;
                process.nextTick(drawFn);
            } else if(items[currentIndex].type == 'habits'){
                items[currentIndex].down += 1;
                process.nextTick(drawFn);
            }
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
                        case 'a':
                            if (args.length) {
                                data.todos.push({'name':args, done:0});
                                inputWindow.clear();
                                inputWindow.inbuffer = '';
                                process.nextTick(drawFn);
                                nc.showCursor = false;
                                mode = 'normal';
                                unsaved = true;
                            
                            }
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
        
    //inputWindow.addstr('' +i);



});


win.on('inputChar', function (c, i) {
    win.addstr('hi there');
    win.refresh();
});
/*
 * win.on('inputChar', function (c, i) {
    //win.cursor(0,0);
    //win.clrtoeol();

    win.addstr("dfdfadfasdf");
    //win.refresh();
    habitWindow.chgat(data.habits[3].cury, 0, habitWindow.width, nc.attrs.STANDOUT, nc.colorPair(5));
    habitWindow.cursor(data.habits[3].cury,2);
    habitWindow.refresh();
    win.refresh();
//    win.addstr('hi dfddfl');



});
*/

function drawFooter(mywin, state){
    mywin.cursor(mywin.height-2,0);
    mywin.clrtoeol();
    win.addstr("HabitRPG");
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
process.on('SIGWINCH',drawFn);
