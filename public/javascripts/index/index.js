(function() {
    function eventBind() {
        $('.operate-wrapper button').click(function() {
            app.utility.showRightSideBar()
            resetCreateTaskForm()
        })

        $('.button-close-pane').click(function() {
            app.utility.hideRightSideBar()
        })

        $('#add_more_task_user').click(function(event) {
            addMoreTaskUserInput()
            event.preventDefault()
        })

        $('#create_task_btn').click(function(event) {           
            var self = this
            readyToCreateTask.call(self, event)
        })
    }

    function popoverTaskInfo() {
        $('span[rel="popover"]').each(function() {
            $(this).data('content',$(this).next().html())
        })
        $('span[rel="popover"]').popover({
            trigger     : 'hover'
        })
    }

    function addMoreTaskUserInput() {
        $('input[name="task_users"]:first').clone().insertBefore($('#add_more_task_user')).val('').focus()
    }

    function resetCreateTaskForm() {
        $('#create_task_form input[type="text"]').val('')
    }

    function agreePossibleUnknowUser() {
        var userOptionArray = [] 
        var agree           = true
        $('#task_users_option option').each(function() {
            userOptionArray.push($(this).val())
        })

        $('input[name="task_users"]').each(function() {
            var userName = $(this).val()
            if (userName !== '') {
                if (userOptionArray.indexOf(userName) == -1) {
                    alert('未知参与者\n\n' + userName + '\n\n不能包含该人员')
                    agree = false
                }
            }
        })
        return agree
    }
    
    function readyToCreateTask(event) {
        if (app.utility.isValidForm('create_task_form')) {
            if (agreePossibleUnknowUser()) {
                createTaskIsWorking()
                satrtCreateTask()
            } 
            event.preventDefault() 
        }
    }

    function createTaskIsWorking() {
        $('#create_task_btn').html('提交中...').addClass('disabled').off()
    }

    function satrtCreateTask() {
        $.ajax({
            type        : 'post',
            url         : $('#create_task_form').attr('action'),
            data        : $('#create_task_form').serialize(),
            success     : function(data) {
                if (data.ok) {
                    location.href = '/tasks/' + data.id
                } else {
                    createTaskIsComplete()
                    alert(data.msg)
                }
            }
        })
    }

    function createTaskIsComplete() {
        $('#create_task_btn').html('提交').removeClass('disabled').on('click', function(event) {
            var self = this
            readyToCreateTask.call(self, event)
        })
    }

    function fillTaskStatusToFilter() {
        var taskBaseLink =  '/tasks'
        //mark current status

        $('#datalist_status_selecter option').each(function(index, value) {
            if (index == 0) {
                return
            }

            $('#task_status_filter .dropdown-menu').append('<li><a href="'
                + taskBaseLink + '?status=' + $(this).val()
                + '">'
                + $(this).val()
                + '</a></li>')
        })
    }

    function fillTaskBranchToFilter() {
        var currentBranch = app.utility.get_query_value('branch')
        if (currentBranch) {
            $('#task_branch_filter button:first').html(decodeURIComponent(currentBranch))
        }
    }

    function fillTaskUserToFilter() {
        var currentUserId = app.utility.get_query_value('user')
        if (currentUserId) {
            $('#task_user_filter span.name').each(function() {
                if ($(this).data('id') == currentUserId) {
                    $('#task_user_filter button:first').html($(this).text())
                }
            })
        }
    }

    $(function() {
        eventBind()
        app.utility.highlightCurrentPage('任务')
        fillTaskStatusToFilter()
        fillTaskBranchToFilter()
        fillTaskUserToFilter()
        popoverTaskInfo()
        app.viewhelper.markDifferentColorToTaskStatus($('.task-list li .status span.label'))
    })

})()