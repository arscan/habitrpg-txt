var request = require('superagent');

var data, 
    apiUrl, 
    apiUser, 
    apiToken, 
    unsaved = false,
    connected = false,
    fnDataChange = function(){},
    fnConnectedChange = function(){},
    fnUnsavedChange = function(){},
    fnLog = function(txt){},
    refreshesPending = 0;

function init(_apiUrl, _apiUser, _apiToken, next){
    apiUrl = _apiUrl;
    apiUser = _apiUser;
    apiToken = _apiToken;

    refresh(next);

}

function setUnsaved(_unsaved){
    if(_unsaved !== unsaved){
        unsaved = _unsaved;
        fnUnsavedChange();
    }
}

function setConnected(_connected){
    if(_connected !== connected){
        connected = _connected;
        fnConnectedChange();
    }
}

function refresh(next){
    // don't refresh if we are awaiting for a response
    // TODO: add stuck detection so it doesn't block updates if something goes wrong

    refreshesPending++;
    //if(refreshesPending){
    //    if(typeof next == "function")
    //        next();
    //    return;
    //}

    request.get(apiUrl + "/user")
        .set('Accept', 'application/json')
        .set('X-API-User', apiUser)
        .set('X-API-Key', apiToken)
        .end(function(error,res){
            var yesterdayDate = new Date().getTime() - 1000*60*60*24,
                prevVal = 0,
                habitsBack = 0;
            
            if(refreshesPending > 1){
                // we have another refreshing coming down the queue
                // so lets ignore this one and just pick up on the next one
                refreshesPending--;
                fnLog("Blocked refresh on " + refreshesPending);
            } else {

                if(error || !res.body.auth){ 
                    refreshesPending--;
                    fnLog("Refresh error: " + error,1);
                    setConnected(false);

                    if(typeof error == "function"){
                        next(error);
                    }
                    return;
                }

                fnLog("Refreshed data");


                // TODO: check to see if it is different than what i already have

                data = res.body;
                setUnsaved(false);
                setConnected(true);

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
                refreshesPending--;

            }
            if(typeof next === "function"){
                next();
            }

        });

}

function createTask(type, text, next){

    // we don't attempt to manually create tasks at this point
    // we just let it get synched up on the refresh
    

    setUnsaved(true);

    // Post to the site
    request.post(apiUrl + "/user/task")
        .set('Accept', 'application/json')
        .set('X-API-User', apiUser)
        .set('X-API-Key', apiToken)
        .send({type:type, text:text, value:0})
        .end(function(error, res){
            if(error){
                fnLog("Create Error: " + error, 1);
                setConnected(false);
            } else {
                fnLog("Successfully created task");
                setConnected(true);
                setUnsaved(false);
            }
            // check to see if it worked
            if(typeof next === "function"){
                next();
            }
            refresh();
        });

}

function completeTask(taskid, completed, next){
    

    if(data.tasks[taskid]){
        data.tasks[taskid].completed = completed;
    }

    setUnsaved(true);

    request.put(apiUrl + "/user/task/" + taskid)
        .set('Accept', 'application/json')
        .set('Content-Type','application/json')
        .set('X-API-User', apiUser)
        .set('X-API-Key', apiToken)
        .send({completed:completed}).end(function(error,res){

            if(error){
                fnLog("Complete Task Error: " + error, 1);
                setConnected(false);
            } else {
                fnLog("Successfully completed task");
                setConnected(true);
                setUnsaved(false);
            }

            if(typeof next === "function"){
                next();
            }
            refresh();

            });
}

function updateHabit(taskid, direction, next){
    if(data.tasks[taskid].type != "habit"){
        fnLog("attempted to update task that wasn't a habit");
        return;
    }

    if(direction !== "up" && direction !== "down"){
        direction = "up";
    }

    if(direction === "up") {
        data.tasks[taskid].up++;

    } else if (direction === "down"){
        data.tasks[taskid].down++;

    }
    setUnsaved(true);

    request.post(apiUrl + "/user/tasks/" + taskid + "/" + direction)
        .set('Content-Length',0)
        .set('Accept', 'application/json')
        .set('X-API-User', apiUser)
        .set('X-API-Key', apiToken).end(function(error,res){
            if(error){
                fnLog("Update Habit: " + error, 1);
                setConnected(false);
            } else {
                fnLog("Successfully updated habit");
                setConnected(true);
                setUnsaved(false);
            }
            if(typeof next === "function"){
                next();
            }
            refresh();

    });
}

function renameTask(taskid, newtext, next){

    data.tasks[taskid].text = newtext;

    setUnsaved(true);

    request.put(apiUrl + "/user/task/" + taskid)
         .set('Accept', 'application/json')
         .set('X-API-User', apiUser)
         .set('X-API-Key', apiToken)
         .send({text:newtext})
         .end(function(error,res){
            if(error){
                fnLog("Rename: " + error, 1);
                setConnected(false);
            } else {
                fnLog("Successfully renamed");
                setConnected(true);
                setUnsaved(false);
            }
            if(typeof next === "function"){
                next();
            }
            refresh();
            // check to see if it worked

        });
}

function deleteTask(taskid, next){
    data.tasks[taskid].text = "deleting...";
    setUnsaved(true);

    request.del(apiUrl + "/user/task/" + taskid)
        .set('Content-Length',0).set('Accept', 'application/json')
        .set('X-API-User', apiUser)
        .set('X-API-Key', apiToken)
        .end(function(error,res){
            if(error){
                fnLog("Delete: " + error, 1);
                setConnected(false);
            } else {
                fnLog("Successfully deleted");
                setConnected(true);
                setUnsaved(false);
            }
            if(typeof next === "function"){
                next();
            }
            refresh();
            // check to see if it worked

        });
}


exports.init = init;
exports.refresh = refresh;
exports.createTask = createTask;
exports.completeTask = completeTask;
exports.renameTask = renameTask;
exports.deleteTask = deleteTask;
exports.updateHabit = updateHabit;
exports.onDataChange = function(fn){fnDataChange = fn};
exports.onUnsavedChange = function(fn){fnUnsavedChange = fn};
exports.onConnectedChange = function(fn){fnConnectedChange = fn};
exports.onLog = function(fn){fnLog = fn};

Object.defineProperty(exports,"data", {
    get: function(){ return data;}
})

Object.defineProperty(exports,"connected", {
    get: function(){ return connected;}
})

Object.defineProperty(exports,"unsaved", {
    get: function(){ return unsaved;}
})


// lets refresh every 10 seconds

setInterval(refresh,10000);
