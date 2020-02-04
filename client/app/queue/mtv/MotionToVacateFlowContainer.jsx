import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useParams, useRouteMatch, Switch, Route } from 'react-router';
import { taskById, appealWithDetailSelector } from '../selectors';
import { MotionToVacateContextProvider } from './MotionToVacateContext';
import { ReviewVacatedDecisionIssuesView } from './ReviewVacatedDecisionIssuesView';

export const MotionToVacateFlowContainer = () => {
  const { path } = useRouteMatch();
  const { taskId, appealId } = useParams();
  const task = useSelector((state) => taskById(state, { taskId }));
  const appeal = useSelector((state) => appealWithDetailSelector(state, { appealId }));

  return (
    <React.Fragment>
      <MotionToVacateContextProvider>
        {/* MTV Progress Bar (#13319) Here */}

        <Switch>
          <Route path={`${path}/draft_decision/vacatures`}>
            {/* Insert component from #13007 here */}
            <ReviewVacatedDecisionIssuesView appeal={appeal} />
          </Route>
          <Route path={`${path}/draft_decision/add_decisions`}>
            {/* Insert component from #13071 here */}
            {/* <AddDecisionsView appeal={appeal} /> */}
            <></>
          </Route>
        </Switch>
      </MotionToVacateContextProvider>
    </React.Fragment>
  );
};
