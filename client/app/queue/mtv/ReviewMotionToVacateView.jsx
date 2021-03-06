import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { MotionsAttorneyDisposition } from './MotionsAttorneyDisposition';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router-dom';

import { fetchJudges } from '../QueueActions';
import { submitMTVAttyReview } from './mtvActions';
import { taskById, appealWithDetailSelector } from '../selectors';
import { taskActionData } from '../utils';

export const ReviewMotionToVacateView = (props) => {
  const { task, appeal, judges, submitting } = props;

  const { selected } = taskActionData(props);

  const judgeOptions = Object.values(judges).map(({ id: value, display_name: label }) => ({
    label,
    value
  }));

  const handleSubmit = async (review) => {
    const newTask = {
      ...review,
      parent_id: task.taskId,
      type: 'JudgeAddressMotionToVacateTask',
      external_id: appeal.externalId,
      assigned_to_type: 'User'
    };

    await props.submitMTVAttyReview(newTask, props);
  };

  useEffect(() => {
    if (!judgeOptions.length) {
      props.fetchJudges();
    }
  });

  return (
    judges && (
      <MotionsAttorneyDisposition
        task={task}
        judges={judgeOptions}
        selectedJudge={selected}
        appeal={appeal}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    )
  );
};

ReviewMotionToVacateView.propTypes = {
  task: PropTypes.object,
  appeal: PropTypes.object,
  judges: PropTypes.object,
  fetchJudges: PropTypes.func,
  submitMTVAttyReview: PropTypes.func,
  error: PropTypes.bool
};

const mapStateToProps = (state, { match }) => {
  const { taskId, appealId } = match.params;

  return {
    task: taskById(state, { taskId }),
    appeal: appealWithDetailSelector(state, { appealId }),
    judges: state.queue.judges,
    error: state.mtv.attorneyView.error,
    submitting: state.mtv.attorneyView.submitting
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchJudges,
      submitMTVAttyReview
    },
    dispatch
  );

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ReviewMotionToVacateView)
);
