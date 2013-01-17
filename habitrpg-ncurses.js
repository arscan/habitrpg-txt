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
        'Ring Insurance',
        'book ZQN -> AKL flight',
        'confirm all flights',
        'email caddy and mullin about stuff to do during the day',
        'Review IB',
        'Review IB Addendum',
        'Review ITM'],
    rewards: [
        { name: 'Leather Armor', 'price': 30, description: 'Helps with stuff'},
        { name: 'Sword 2', 'price': 25, description: 'Helps with stuff'},
        { name: 'potion', 'price': 25, description: 'Helps with stuff'}
        ]

}

//updateHeader(win,'hi here', {pos:'right'});

nc.colorPair(1,nc.colors.BLACK,nc.colors.WHITE);
nc.colorPair(2,nc.colors.WHITE,nc.colors.BLACK);
/*
win.bkgd = nc.colorPair(1);
win.attron(nc.colorPair(1));
win2.attron(nc.colorPair(2));
win.attron(nc.colorPair(2));
*/

/* draw the header */
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

win.cursor(11,2);
win.hline(nc.cols-4, nc.ACS.HLINE);


win.cursor(11,3);
win.addstr(' Habits ');

win.cursor(13,2)
for(var i = 0; i<data.habits.length;i++){
    win.addstr('[ ][-] ' + data.habits[i].name);
    win.cursor(13+i,2);
}





win.refresh();
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
