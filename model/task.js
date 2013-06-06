var mongoose        = require('./config').mongoose,
    ObjectId        = mongoose.Schema.Types.ObjectId,
    collectionName  = 'task',
    userModel       = require('./user').user,
    milestoneModel  = require('./milestone').milestone,
    Emitter         = require('events').EventEmitter;

var taskSchema = mongoose.Schema({
    name            : String,
    status          : String,
    branch          : String,
    custom_id       : String,
    active          : Boolean,
    created_time    : Date,
    users           : [ObjectId],
},{
    collection : collectionName,
})

taskSchema.statics.findDeveloping = function (cb) {
    var filter = {
        active : true,
        status : {'$nin' : ['需求提交','已发外网']},
    }

    this.find(filter, function(err, tasks) {
        cb(err, tasks)
    });
}

taskSchema.statics.findDevelopingIncludeUserAndMilestone = function (cb) {
    var emitter             = new Emitter(),
        filter              = {active : true, status : {'$nin' : ['需求提交','已发外网']}},
        option              = {sort : {status : -1, custom_id : -1, create_time : -1}};   

    this.find(filter, {}, option, function(err, tasks) {
        if (err) {
            cb(err)
            return
        }

        tasks = tasks.map(function(item, index) {
            item = item.toObject()
            return item
        })

        includeUser(tasks, function(err, tasks) {
            includeMilestone(tasks, function(err, tasks) {
                cb(err, tasks)
            })
        })
    });
}

var Task = mongoose.model(collectionName, taskSchema);

exports.task = Task;

// helper -----------------------------------------------------------------------------------
function includeUser(tasks, cb) {
    userModel.find(function(err, users) {
        if (err) {
            cb(err)
            return
        }

        tasks.forEach(function(taskItem) {
            var usersIdGroup = taskItem.users.map(function(userObjectIdItem) {
                return String(userObjectIdItem)
            })

            users.forEach(function(userItem) {
                var userIndex = usersIdGroup.indexOf(String(userItem._id))
                if (userIndex > -1) {
                    taskItem.users[userIndex] = userItem
                }
            })
        })

        cb(null, tasks)
    })
}

function includeMilestone(tasks, cb) {
    var developingTaskIdGroup = tasks.map(function(taskItem) {
        taskItem.milestones = []
        return String(taskItem._id)
    })

    milestoneModel.find({task_id : {$in : developingTaskIdGroup}}, {}, {sort : {event_time : 1}}, function(err, milestones) {
        if (err) {
            cb(err)
            return
        }

        tasks.forEach(function(taskItem) {
            milestones.forEach(function(milestoneItem) {
                if (String(taskItem._id) === milestoneItem.task_id) {
                    taskItem.milestones.push(milestoneItem)
                }
            })
        })

        cb(null, tasks)
    })
}