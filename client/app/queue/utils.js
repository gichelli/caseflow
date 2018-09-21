// @flow
import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import StringUtil from '../util/StringUtil';
import { redText } from './constants';

import type {
  Task,
  Tasks,
  BasicAppeal,
  BasicAppeals,
  AppealDetails,
  Issue,
  Issues
} from './types/models';
import type { NewDocsForAppeal } from './types/state';

import ISSUE_INFO from '../../constants/ISSUE_INFO.json';
import DIAGNOSTIC_CODE_DESCRIPTIONS from '../../constants/DIAGNOSTIC_CODE_DESCRIPTIONS.json';
import VACOLS_DISPOSITIONS_BY_ID from '../../constants/VACOLS_DISPOSITIONS_BY_ID.json';
import DECISION_TYPES from '../../constants/APPEAL_DECISION_TYPES.json';
import USER_ROLE_TYPES from '../../constants/USER_ROLE_TYPES.json';

export const prepareTasksForStore = (tasks: Array<Object>): Tasks =>
  tasks.reduce((acc, task: Object): Tasks => {
    const decisionPreparedBy = task.attributes.decision_prepared_by.first_name ? {
      firstName: task.attributes.decision_prepared_by.first_name,
      lastName: task.attributes.decision_prepared_by.last_name
    } : null;

    acc[task.attributes.external_appeal_id] = {
      appealType: task.attributes.appeal_type,
      addedByCssId: null,
      appealId: task.attributes.appeal_id,
      externalAppealId: task.attributes.external_appeal_id,
      assignedOn: task.attributes.assigned_at,
      dueOn: null,
      assignedTo: {
        cssId: task.attributes.assigned_to.css_id,
        id: task.attributes.assigned_to.id,
        type: task.attributes.assigned_to.type
      },
      assignedBy: {
        firstName: task.attributes.assigned_by.first_name,
        lastName: task.attributes.assigned_by.last_name,
        cssId: task.attributes.assigned_by.css_id,
        pgId: task.attributes.assigned_by.pg_id
      },
      taskId: task.id,
      action: task.attributes.action,
      documentId: task.attributes.document_id,
      workProduct: null,
      previousTaskAssignedOn: task.attributes.previous_task.assigned_at,
      placedOnHoldAt: task.attributes.placed_on_hold_at,
      status: task.attributes.status,
      onHoldDuration: task.attributes.on_hold_duration,
      instructions: task.attributes.instructions,
      decisionPreparedBy
    };

    return acc;
  }, {});

const extractAppealsFromTasks =
  (tasks: Array<Object>):
    BasicAppeals => {
    return tasks.reduce((accumulator, task) => {
      if (!accumulator[task.attributes.external_appeal_id]) {
        accumulator[task.attributes.external_appeal_id] = {
          id: task.attributes.appeal_id,
          type: task.attributes.appeal_type,
          externalId: task.attributes.external_appeal_id,
          docketName: task.attributes.docket_name,
          isLegacyAppeal: task.attributes.docket_name === 'legacy',
          caseType: task.attributes.case_type,
          isAdvancedOnDocket: task.attributes.aod,
          issueCount: task.attributes.issue_count,
          docketNumber: task.attributes.docket_number,
          veteranFullName: task.attributes.veteran_full_name,
          veteranFileNumber: task.attributes.veteran_file_number,
          isPaperCase: task.attributes.paper_case
        };
      }

      return accumulator;
    }, {});
  };

export const extractAppealsAndAmaTasks =
(tasks: Array<Object>): { appeals: BasicAppeals, amaTasks: Tasks, tasks: Tasks } => ({
  tasks: {},
  appeals: extractAppealsFromTasks(tasks),
  amaTasks: prepareTasksForStore(tasks) });

export const prepareLegacyTasksForStore = (tasks: Array<Object>): Tasks => {
  const mappedLegacyTasks = tasks.map((task): Task => {
    return {
      appealId: task.attributes.appeal_id,
      appealType: task.attributes.appeal_type,
      externalAppealId: task.attributes.external_appeal_id,
      assignedOn: task.attributes.assigned_on,
      dueOn: task.attributes.due_on,
      assignedTo: {
        cssId: task.attributes.assigned_to.css_id,
        type: task.attributes.assigned_to.type,
        id: task.attributes.assigned_to.id
      },
      assignedBy: {
        firstName: task.attributes.assigned_by.first_name,
        lastName: task.attributes.assigned_by.last_name,
        cssId: task.attributes.assigned_by.css_id,
        pgId: task.attributes.assigned_by.pg_id
      },
      addedByName: task.attributes.added_by_name,
      addedByCssId: task.attributes.added_by_css_id,
      taskId: task.attributes.task_id,
      action: task.attributes.action,
      documentId: task.attributes.document_id,
      workProduct: task.attributes.work_product,
      previousTaskAssignedOn: task.attributes.previous_task.assigned_on,
      status: task.attributes.status,
      decisionPreparedBy: null
    };
  });

  return _.pickBy(_.keyBy(mappedLegacyTasks, (task) => task.externalAppealId), (task) => task);
};

export const prepareAllTasksForStore = (tasks: Array<Object>): { amaTasks: Tasks, tasks: Tasks } => {
  const amaTasks = tasks.filter((task) => {
    return task.attributes.appeal_type === 'Appeal';
  });
  const legacyTasks = tasks.filter((task) => {
    return task.attributes.appeal_type === 'LegacyAppeal';
  });

  return {
    amaTasks: prepareTasksForStore(amaTasks),
    tasks: prepareLegacyTasksForStore(legacyTasks)
  };
};

export const associateTasksWithAppeals =
  (serverData: { tasks: { data: Array<Object> } }):
    { appeals: BasicAppeals, tasks: Tasks } => {
    const {
      tasks: { data: tasks }
    } = serverData;

    return {
      tasks: prepareLegacyTasksForStore(tasks),
      appeals: extractAppealsFromTasks(tasks)
    };
  };

export const prepareAppealIssuesForStore = (appeal: { attributes: Object }) => {
  // Give even legacy issues an 'id' property, because other issues will have it,
  // so we can refer to this property and phase out use of vacols_sequence_id.
  let issues = appeal.attributes.issues;

  if (appeal.attributes.docket_name === 'legacy') {
    issues = issues.map((issue) => ({
      id: issue.vacols_sequence_id,
      ...issue
    }));
  }

  return issues;
};

export const prepareAppealForStore =
  (appeals: Array<Object>):
    { appeals: BasicAppeals, appealDetails: AppealDetails } => {

    const appealHash = appeals.reduce((accumulator, appeal) => {
      accumulator[appeal.attributes.external_id] = {
        id: appeal.id,
        externalId: appeal.attributes.external_id,
        docketName: appeal.attributes.docket_name,
        isLegacyAppeal: appeal.attributes.docket_name === 'legacy',
        caseType: appeal.attributes.type,
        isAdvancedOnDocket: appeal.attributes.aod,
        issueCount: appeal.attributes.issues.length,
        docketNumber: appeal.attributes.docket_number,
        veteranFullName: appeal.attributes.veteran_full_name,
        veteranFileNumber: appeal.attributes.veteran_file_number,
        isPaperCase: appeal.attributes.paper_case
      };

      return accumulator;
    }, {});

    const appealDetailsHash = appeals.reduce((accumulator, appeal) => {
      accumulator[appeal.attributes.external_id] = {
        hearings: appeal.attributes.hearings,
        issues: prepareAppealIssuesForStore(appeal),
        appellantFullName: appeal.attributes.appellant_full_name,
        appellantAddress: appeal.attributes.appellant_address,
        appellantRelationship: appeal.attributes.appellant_relationship,
        locationCode: appeal.attributes.location_code,
        veteranDateOfBirth: appeal.attributes.veteran_date_of_birth,
        veteranDateOfDeath: appeal.attributes.veteran_date_of_death,
        veteranGender: appeal.attributes.veteran_gender,
        externalId: appeal.attributes.external_id,
        status: appeal.attributes.status,
        decisionDate: appeal.attributes.decision_date,
        certificationDate: appeal.attributes.certification_date,
        powerOfAttorney: appeal.attributes.power_of_attorney,
        regionalOffice: appeal.attributes.regional_office,
        caseflowVeteranId: appeal.attributes.caseflow_veteran_id
      };

      return accumulator;
    }, {});

    return {
      appeals: appealHash,
      appealDetails: appealDetailsHash
    };
  };

export const renderAppealType = (appeal: BasicAppeal) => {
  const {
    isAdvancedOnDocket,
    caseType
  } = appeal;
  const cavc = caseType === 'Court Remand';

  return <React.Fragment>
    {isAdvancedOnDocket && <span><span {...redText}>AOD</span>, </span>}
    {cavc ? <span {...redText}>CAVC</span> : <span>{caseType}</span>}
  </React.Fragment>;
};

export const renderLegacyAppealType = ({ aod, type }: {aod: boolean, type: string}) => {
  const cavc = type === 'Court Remand';

  return <React.Fragment>
    {aod && <span><span {...redText}>AOD</span>, </span>}
    {cavc ? <span {...redText}>CAVC</span> : <span>{type}</span>}
  </React.Fragment>;
};

export const getDecisionTypeDisplay = (decision: {type?: string} = {}) => {
  const {
    type: decisionType
  } = decision;

  switch (decisionType) {
  case DECISION_TYPES.OMO_REQUEST:
    return 'OMO';
  case DECISION_TYPES.DRAFT_DECISION:
    return 'Draft Decision';
  default:
    return StringUtil.titleCase(decisionType);
  }
};

export const getIssueProgramDescription = (issue: Issue) =>
  _.get(ISSUE_INFO[issue.program], 'description', '') || 'Compensation';
export const getIssueTypeDescription = (issue: Issue) => {
  const {
    program,
    type,
    description
  } = issue;

  if (!program) {
    return description;
  }

  return _.get(ISSUE_INFO[program].levels, `${type}.description`);
};

export const getIssueDiagnosticCodeLabel = (code: string): string => {
  const readableLabel = DIAGNOSTIC_CODE_DESCRIPTIONS[code];

  if (!readableLabel) {
    return '';
  }

  return `${code} - ${readableLabel.staff_description}`;
};

/**
 * For attorney checkout flow, filter out already-decided issues. Undecided
 * disposition IDs are all numerical (1-9), decided IDs are alphabetical (A-X).
 * Filter out disposition 9 because it is no longer used.
 *
 * @param {Array} issues
 * @returns {Array}
 */

export const getUndecidedIssues = (issues: Issues) => _.filter(issues, (issue) => {
  if (!issue.disposition) {
    return true;
  }

  const disposition = Number(issue.disposition);

  if (disposition && disposition < 9 && issue.disposition in VACOLS_DISPOSITIONS_BY_ID) {
    return true;
  }
});

export const buildCaseReviewPayload = (
  decision: Object, userRole: string, issues: Issues, args: Object = {}
): Object => {
  const payload = {
    data: {
      tasks: {
        type: `${userRole}CaseReview`,
        ...decision.opts
      }
    }
  };

  if (userRole === USER_ROLE_TYPES.attorney) {
    _.extend(payload.data.tasks, { document_type: decision.type });
  } else {
    args.factors_not_considered = _.keys(args.factors_not_considered);
    args.areas_for_improvement = _.keys(args.areas_for_improvement);

    _.extend(payload.data.tasks, args);
  }

  payload.data.tasks.issues = getUndecidedIssues(issues).map((issue) => _.extend({},
    _.pick(issue, ['remand_reasons', 'type', 'readjudication']),
    { disposition: _.capitalize(issue.disposition) },
    { id: issue.id }
  ));

  return payload;
};

/**
 * During attorney checkout flow, validate document ID field. All work
 * product document IDs will be in one of the following formats:
 * (new) /^\d{5}-\d{8}$/
 * (old) /^\d{8}\.\d{3,4}$/
 *
 * "Old" refers to decisions not prepared using the Interactive Decision Template.
 *
 * VHA work product document ID formats:
 * /^V\d/{7}\.\d{3,4}$/
 *
 * IME work product document ID formats:
 * /^M\d{7}\.\d{3,4}$/
 */
export const validateWorkProductTypeAndId = (decision: {opts: Object}) => {
  const {
    opts: {
      document_id: documentId,
      work_product: workProduct
    }
  } = decision;
  const newFormat = new RegExp(/^\d{5}-\d{8}$/);

  if (!workProduct) {
    return newFormat.test(documentId);
  }

  const initialChar = workProduct.includes('IME') ? 'M' : 'V';
  const regex = `^${initialChar}\\d{7}\\.\\d{3,4}$`;
  const oldFormat = new RegExp(regex);

  return oldFormat.test(documentId) || newFormat.test(documentId);
};

export const taskHasNewDocuments = (task: Task, newDocsForAppeal: NewDocsForAppeal) => {
  if (!newDocsForAppeal[task.externalAppealId] || !newDocsForAppeal[task.externalAppealId].docs) {
    return false;
  }

  return newDocsForAppeal[task.externalAppealId].docs.length > 0;
};

export const taskIsOnHold = (task: Task) => moment().diff(moment(task.placedOnHoldAt), 'days') < task.onHoldDuration;
