class BvaDispatchTask < GenericTask
  class << self
    def create_from_root_task(root_task)
      create!(assigned_to: BvaDispatch.singleton, parent_id: root_task.id, appeal: root_task.appeal)
    end

    def outcode(appeal, params, user)
      tasks = where(appeal: appeal, assigned_to: user)
      if tasks.count != 1
        fail Caseflow::Error::BvaDispatchTaskCountMismatch, appeal_id: appeal.id, user_id: user.id, tasks: tasks
      end

      task = tasks[0]

      fail(Caseflow::Error::BvaDispatchDoubleOutcode, appeal_id: appeal.id, task_id: task.id) if task.completed?

      params[:appeal_id] = appeal.id
      create_decision_document!(params)

      task.update!(status: Constants.TASK_STATUSES.completed)
      task.root_task.update!(status: Constants.TASK_STATUSES.completed)
      appeal.request_issues.each(&:close_decided_issue!)
    rescue ActiveRecord::RecordInvalid => e
      raise(Caseflow::Error::OutcodeValidationFailure, message: e.message) if e.message.match?(/^Validation failed:/)

      raise e
    end

    private

    def create_decision_document!(params)
      DecisionDocument.create!(params).tap do |decision_document|
        delay = decision_document.decision_date.future? ? decision_document.decision_date : 0
        decision_document.submit_for_processing!(delay: delay)

        # TODO: remove this unless statement when all decision documents require async processing
        unless decision_document.processed?
          ProcessDecisionDocumentJob.perform_later(decision_document.id)
        end
      end
    end
  end
end
