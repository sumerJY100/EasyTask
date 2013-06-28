var routeApp        = require('./app'),
    time            = require('../helper/time'),
    view            = require('../helper/view'),
    taskModel       = require('../model/task').task,
    userModel       = require('../model/user').user,
    roleModel       = require('../model/data').role,
    bugModel        = require('../model/bug').bug,
    counterModel    = require('../model/counter').counter,
    bugtypeModel    = require('../model/data').bugType,
    bugStatusModel  = require('../model/data').bugStatus,
    bugLevelModel   = require('../model/data').bugLevel;

exports.new = function(req, res) {
    var customId    = req.params.task_id,
        programmers = [];

    taskModel.findOne({custom_id : customId}, function(err, taskResult) {
        if (err || !taskResult) {
            routeApp.err404(req, res)
            return
        }

        userModel.findActiveUsers(function(err, users) {
            users.forEach(function(item, index) {
                if (item.role.indexOf(roleModel[1]) > -1) {
                    programmers.push(item)
                }
            })

            res.render('bug/new', 
                { 
                    title       : '添加Bug - ' + taskResult.name, 
                    task        : taskResult,
                    bugTypes    : bugtypeModel,
                    bugLevels   : bugLevelModel,
                    programmers : programmers,
                } 
            )
        })
    })
}

exports.create = function(req, res) {
    var taskId = req.params.task_id,
        newBug = null;

    routeApp.ownAuthority(req, function(hasAuth, operator) {
        if (!hasAuth) {
            res.send({ ok : 0, msg : '没有权限'})
            return
        }

        if (!req.body.name) {
            res.send({ok : 0, msg : 'bug名称必填'})
            return
        }

        if (!req.body.type) {
            res.send({ok : 0, msg : 'bug类别必填'})
            return
        }

        if (!req.body.level) {
            res.send({ok : 0, msg : 'bug级别必填'})
            return
        }

        newBug = new bugModel({
            task_id         : taskId,
            name            : req.body.name,
            content         : req.body.content || '',
            type            : req.body.type,
            files           : req.body.taskfiles || [],
            operator_id     : String(operator._id),
            closed          : false,
            comments        : [],
            level           : req.body.level,
            status          : bugStatusModel[0],
            score           : parseInt(req.body.score, 10) || 0,
            assign_to       : req.body.assign_to || '',
            updated_time    : new Date(),
            created_time    : new Date(),
        })

        newBug.save(function(err, bugResult) {
            res.send({ok : 1, bug : bugResult})
            routeApp.createLogItem(String(operator._id), taskId, '12', bugResult.type + ":" + bugResult.name)
        })
    })
}

exports.list = function(req, res) {
    var taskId      = req.params.task_id,
        key         = '',
        filter      = {
            task_id     : taskId,
            status      : req.query.status || '',
            closed      : req.query.closed || false,
            assign_to   : req.query.assign_to || '',
        };
        
    for (key in filter) {
        if (!filter[key]) {
            delete filter[key]
        }
    }   

    bugModel.findOpenBugsIncludeUsersByTaskId(filter, function(err, bugResults) {
        if (err) {
            res.send({ ok : 0, msg : '数据库错误'})
            return
        }

        bugResults = bugResults.map(function(item, index) {
            item.updated_time = time.readable_time(item.updated_time)
            return item
        })

        res.send({ok : 1, bugs : bugResults})
    })     
}

exports.changeStatus = function(req, res) {
    var taskId = req.params.task_id,
        id     = req.params.id,
        status = req.body.status;

    routeApp.ownAuthority(req, function(hasAuth, operator) {
        if (!hasAuth) {
            res.send({ ok : 0, msg : '没有权限'})
            return
        }

        if (!status) {
            res.send({ok : 0, msg : '没有状态名称'})
            return
        }

        bugModel.findByIdAndUpdate(id, { status : status, updated_time : new Date()}, function(err, bugResult) {
            if (!bugResult) {
                res.send({ok : 0, msg : "没有找到要修改的bug"})
                return
            }

            res.send({ok : 1})

            routeApp.createLogItem(String(operator._id), taskId, '13', bugResult.status)
        })
    })
}