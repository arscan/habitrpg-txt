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
        {name:'Use Personal Notebook',up:1,down:1},
        {name:'Visit Reddit / HN',up:0,down:1}
        ],
    daily: [
        {name:'Go to Gym',done:0},
        {name:'Clean Desk, no VM, etc',done:1},
        {name:'Floss',done:0},
        {name:'In Work Early',done:0},
        {name:'Weekly Summary',done:0},
        {name:'Record Summary',done:0}
        ],
    todos: [
        {name:'Ring Insurance'},
        {name:'book ZQN -> AKL flight'},
        {name:'confirm all flights'},
        {name:'email caddy and mullin about stuff to do during the day'},
        {name:'Review IB'},
        {name:'Review IB Addendum'},
        {name:'Review ITM'}],
    rewards: [
        { name: 'Leather Armor', 'price': 30, description: 'Helps with stuff'},
        { name: 'Sword 2', 'price': 25, description: 'Helps with stuff'},
        { name: 'potion', 'price': 25, description: 'Helps with stuff'}
        ]

};

var habitsLocation = {"top": 0, "bottom": 0};
var dailyLocation = {"top":0, "bottom":0};

//updateHeader(win,'hi here', {pos:'right'});

nc.colorPair(1,nc.colors.BLACK,nc.colors.WHITE);
nc.colorPair(2,nc.colors.WHITE,nc.colors.BLACK);
/*
win.bkgd = nc.colorPair(1);
win.attron(nc.colorPair(1));
win2.attron(nc.colorPair(2));
win.attron(nc.colorPair(2));
*/
//win.scrollok(true);
//win.setscrreg(1, win.height-3); // Leave one line at the top for the header
//win.idlok(true);

/* draw the header */
var fnDraw = function(){
    
    drawHeader(win,"connected");

    /* draw the status box */
    var statusWindow = new nc.Window(7,nc.cols-4);
    statusWindow.move(3,2);
    statusWindow.box();
    statusWindow.cursor(0,2);
    statusWindow.addstr(config.username);
    statusWindow.addstr(' [lvl ' + data.level + ']');
    statusWindow.refresh();
    drawBar(statusWindow,1,2,data.health,data.healthMax,'Health',2);
    drawBar(statusWindow,1,2,data.exp,data.expMax,'Exp',4);

    /* draw the habit area */
    var habitWindow = new nc.Window(4+data.habits.length,nc.cols-4);
    habitWindow.move(11,2);
    habitWindow.cursor(0,0);
    habitWindow.hline(habitWindow.width, nc.ACS.HLINE);
    habitWindow.cursor(0,1);
    habitWindow.addstr(' Habits ');
    habitWindow.cursor(1,0);
    for(var i = 0; i<data.habits.length;i++){
        habitWindow.cursor(habitWindow.cury+1,0);
        data.habits[i].cury = habitWindow.cury;
        habitWindow.addstr('[ ] ' + data.habits[i].name.substr(0,habitWindow.width-5));

    }
    habitWindow.chgat(data.habits[3].cury, 0, habitWindow.width, nc.attrs.STANDOUT, nc.colorPair(5));
    habitWindow.cursor(data.habits[3].cury,2);
    /* draw the Daily section*/
    var dailyWindow = new nc.Window(4,nc.cols-4);
    dailyWindow.move(habitWindow.begy+habitWindow.height-1,2);
    dailyWindow.cursor(0,0);
    dailyWindow.hline(dailyWindow.width, nc.ACS.HLINE);
    dailyWindow.cursor(0,1);
    dailyWindow.addstr(' Daily ');
    dailyWindow.cursor(2,0);
    for(var i = data.daily.length-1; i>=0;i--){
        dailyWindow.insertln();
        dailyWindow.resize(dailyWindow.height+1, dailyWindow.width);
        dailyWindow.cursor(2,0);
        dailyWindow.addstr('[ ] ' + data.daily[i].name.substr(0,dailyWindow.width-5));

    }

    var todoWindow = new nc.Window(4,nc.cols-4);
    todoWindow.move(dailyWindow.begy+dailyWindow.height-1,2);
    todoWindow.cursor(0,0);
    todoWindow.hline(todoWindow.width, nc.ACS.HLINE);
    todoWindow.cursor(0,1);
    todoWindow.addstr(' Todos ');
    todoWindow.cursor(2,0);
    for(var i = data.todos.length-1; i>=0;i--){
        todoWindow.insertln();
        todoWindow.resize(todoWindow.height+1, todoWindow.width);
        todoWindow.cursor(2,0);
        todoWindow.addstr('[ ] ' + data.todos[i].name.substr(0,todoWindow.width-5));
    }
    win.refresh();
    win.cursor(0,0);
}
/*
win.on('inputChar', function (c, i) {
    win.cursor(4,4);
    process.exit(0);


});
*/
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
fnDraw();

function drawHeader(mywin, state){
    mywin.cursor(0,0);
    mywin.clrtoeol();
    win.addstr("HabitRPG");
    mywin.addstr(0, mywin.width-(Math.min(state.length, mywin.width)), state, mywin.width);
    mywin.cursor(1,0);
    mywin.hline(nc.cols, nc.ACS.HLINE);
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
function updateHeader(win, header, style) {
   var curx = win.curx, cury = win.cury;
   style = style || {};
   header = '' + header;
   win.cursor(0, 0);
   win.clrtoeol();
   if (style.attrs)
     win.attron(style.attrs);
   if (header.length > 0) {
     if (style.pos === 'center')
       win.centertext(0, header);
     else if (style.pos === 'right')
       win.addstr(0, win.width-(Math.min(header.length, win.width)), header, win.width);
     else
        win.addstr(header, win.width);
  }
   if (style.attrs)
     win.attroff(style.attrs);
    win.cursor(1,0);
    win.hline(nc.cols, nc.ACS.HLINE);
    win.refresh();
   win.cursor(cury, curx);
   win.refresh();
}
//process.on('SIGWINCH',fnDraw);
