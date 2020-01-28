# frozen_string_literal: true

class Hearings::ScheduleHearingTasksColumnsController < ApplicationController
  include HearingsConcerns::VerifyAccess

  before_action :verify_build_hearing_schedule_access

  def index
    if allowed_params[Constants.QUEUE_CONFIG.TAB_NAME_REQUEST_PARAM] == "amaAssignHearingsTab"
      tab = AssignHearing.new(appeal_type: Appeal.name, regional_office_key: allowed_params[:regional_office_key])
      render json: tab.to_hash
    elsif allowed_params[Constants.QUEUE_CONFIG.TAB_NAME_REQUEST_PARAM] == "legacyAssignHearingsTab"
      tab = AssignHearing.new(appeal_type: LegacyAppeal.name, regional_office_key: allowed_params[:regional_office_key])
      render json: tab.to_hash
    else
      fail(
        Caseflow::Error::InvalidParameter,
        parameter: Constants.QUEUE_CONFIG.TAB_NAME_REQUEST_PARAM,
        message: "Tab does not exist"
      )
    end
  end

  private

  def allowed_params
    params.permit(
      Constants.QUEUE_CONFIG.TAB_NAME_REQUEST_PARAM,
      :regional_office_key
    )
  end
end
