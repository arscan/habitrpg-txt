var request = require('superagent'),
    events = require('events');

var data, 
    apiUrl, 
    apiUser, 
    apiToken, 
    unsaved = false,
    connected = false,
    fnDataChange = function(){},
    fnConnectedChange = function(){};

function init(_apiUrl, _apiUser, _apiToken, next){
    apiUrl = _apiUrl;
    apiUser = _apiUser;
    apiToken = _apiToken;

    refresh(next);

}

function refresh(next){

    request.get(apiUrl + "/user")
        .set('Accept', 'application/json')
        .set('X-API-User', apiUser)
        .set('X-API-Key', apiToken)
        .end(function(error,res){
            var yesterdayDate = new Date().getTime() - 1000*60*60*24,
                prevVal = 0,
                habitsBack = 0;

            if(error || !res.body.auth){ 
                if(!connected){
                    connected = false;
                    fnConnectedChange();
                }
                next(error);
                return;
            }

            connected = true;

            // TODO: check to see if it is different than what i already have

            data = res.body;
            unsaved = false;

            // now process data

            data.stats.habitToday = 0;
            data.stats.dailyToday = 0;
            data.stats.todoToday = 0;
            
            for(var i = 0; i<data.habitIds.length;i++){
                habitsBack = 0;
                prevVal = data.tasks[data.habitIds[i]].value;
                if(data.tasks[data.habitIds[i]].history){
                    habitsBack = data.tasks[data.habitIds[i]].history.length-1;

                    while(habitsBack >= 0 && 
                            data.tasks[data.habitIds[i]].history && 
                            data.tasks[data.habitIds[i]].history[habitsBack] && 
                            data.tasks[data.habitIds[i]].history[habitsBack].date > yesterdayDate){
                        
                        if(prevVal >= data.tasks[data.habitIds[i]].history[habitsBack].value){
                            data.tasks[data.habitIds[i]].up++; 
                            data.stats.habitToday++;
                        } else {
                            data.tasks[data.habitIds[i]].down++; 
                            data.stats.habitToday--;
                        }
                        prevVal = data.tasks[data.habitIds[i]].history[habitsBack].value;
                        habitsBack--;
                        
                    }
                }
                
            }

            for(var i = 0; i<data.dailyIds.length;i++){
                data.stats.dailyToday += data.tasks[data.dailyIds[i]].completed;
            }

            // TODO: figure out some what to do todo completed today (add completed date to model)

            fnDataChange();
            if(typeof next === "function"){
                next();
            }

        });

}


function createTask(type, text, next){

    // Post to the site
    request.post(apiUrl + "/user/task")
        .set('Accept', 'application/json')
        .set('X-API-User', apiUser)
        .set('X-API-Key', apiToken)
        .send({type:type, text:text, value:0})
        .end(function(res){
            // check to see if it worked
            if(typeof next === "function"){
                next();
            }
            refresh();
        });

}

function setTaskCompleted(taskid, completed, next){

    request.put(apiUrl + "/user/task/" + taskid)
        .set('Accept', 'application/json')
        .set('Content-Type','application/json')
        .set('X-API-User', apiUser)
        .set('X-API-Key', apiToken)
        .send({completed:completed}).end(function(res){
            
            if(typeof next === "function"){
                next();
            }
            refresh();

            });
}

function renameTask(taskid, newtext, next){

     request.put(apiUrl + "/user/task/" + taskid)
         .set('Accept', 'application/json')
         .set('X-API-User', apiUser)
         .set('X-API-Key', apiToken)
         .send({text:newtext})
         .end(function(res){
            // check to see if it worked

            if(typeof next === "function"){
                next();
            }
            refresh();

            });
}

function deleteTask(taskid, next){

    request.del(apiUrl + "/user/task/" + taskid)
        .set('Content-Length',0).set('Accept', 'application/json')
        .set('X-API-User', apiUser)
        .set('X-API-Key', apiToken)
        .end(function(res){

            if(typeof next === "function"){
                next();
            }
            refresh();

            // TODO: do this in the interface I suppose
            currentIndex--;
            currentIndex = currentIndex < 0? 0: currentIndex;
        unsaved = false;
            refresh();

});
}

function moveHabit(taskid, direction, next){

    request.post(apiUrl + "/user/tasks/" + taskid + "/" + direction)
        .set('Content-Length',0)
        .set('Accept', 'application/json')
        .set('X-API-User', apiUser)
        .set('X-API-Key', apiToken).end(function(res){
            if(typeof next === "function"){
                next();
            }
            refresh();

    });
}

exports.init = init;
exports.refresh = refresh;
exports.createTask = createTask;
exports.setTaskCompleted = setTaskCompleted;
exports.renameTask = renameTask;
exports.deleteTask = deleteTask;
exports.moveHabit = moveHabit;
exports.onDataChange = function(fn){fnDataChange = fn};
exports.onConnectedChange = function(fn){fnConnectedChange = fn};

Object.defineProperty(exports,"data", {
    get: function(){ return data;}
})

Object.defineProperty(exports,"connected", {
    get: function(){ return connected;}
})

Object.defineProperty(exports,"unsaved", {
    get: function(){ return unsaved;}
})

/*

var HabitAPI = {

    apiUrl: null,
    apiUser: null,
    apiToken: null,
    saveRate: 2000,
    updateQueue: [],


    data: {},

    init: function(apiUrl,apiUser,apiToken, cb){
        var self = this;
        //check to see if the apiurl and apikey are correct

        this.apiUrl = apiUrl;
        this.apiUser = apiUser;
        this.apiToken = apiToken;

        this._refresh(cb);
    },

    _refresh: function(cb){
        var inc;
        // grab everything off the queue
        console.log(this.updateQueue.length);
        while(this.updateQueue.length > 0){
            inc = this.updateQueue.shift();
            console.log("doing " + inc.method);
            console.log("this is a " + typeof(request[inc.method]));

            request[inc.method](this.apiUrl + inc.path)
                .set('Accept', 'application/json')
                .set('X-API-User', this.apiUser)
                .set('X-API-Key', this.apiToken)
                .set('Content-Length', (inc.method === "del"? 0 : undefined))
                .send(inc.body)
                .end(function(res){console.log(res)});

            console.log("did this");
        }


    },

    createTask: function(tasktype, text, notes, up, down, value, completed, cb){
        // create locally
        if(typeof(this.data.items) != "undefined"){
            // we don't create things locally on task creation
            // its too much of a pain
        }
        request.post(apiUrl + "/user/task")
            .set('Accept', 'application/json')
            .set('X-API-User', this.apiUser)
            .set('X-API-Key', this.apiToken)
            .send(
                    {
                        type:tasktype, 
            text:text, 
            value:0
                    })
        .end(function(res){
            cb();
        })
        },

        deleteTask: function(taskid, cb){

        },

        renameTask: function(taskid, newname, cb){


        },


        queueCall: function(method, path, body, cb){

            this.updateQueue.push({method:method,path:path,body:body,cb:cb});

        }


}
*/
