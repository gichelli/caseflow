import React from 'react';

import Table from '../../components/Table';
import Button from '../../components/Button';
import { formatDate } from '../../util/DateUtil';
import ApiUtil from '../../util/ApiUtil';

const TABLE_HEADERS = ['Decision Date', 'EP Code', 'Status', 'Select this EP'];

export default class AssociatePage extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: null
    };
  }

  buildEndProductRow = (endProduct) => [
    formatDate(new Date(endProduct.claim_receive_date)),
    endProduct.claim_type_code,
    endProduct.status_type_code,
    <Button
        id={`button-Assign-to-Claim${endProduct.benefit_claim_id}`}
        name="Assign to Claim"
        classNames={["usa-button-outline"]}
        onClick={this.handleAssignEndProduct(endProduct)}
        loading={this.state.loading === endProduct.benefit_claim_id}
      />
  ];

  handleAssignEndProduct = (endProduct) => () => {
    let { id } = this.props.task;
    let { handleAlert, handleAlertClear } = this.props;

    event.preventDefault();
    handleAlertClear();

    this.setState({
      loading: endProduct.benefit_claim_id
    });

    let data = ApiUtil.convertToSnakeCase({
      endProductId: endProduct.benefit_claim_id
    });

    return ApiUtil.post(
      `/dispatch/establish-claim/${id}/assign-existing-end-product`,
      { data }).then(() => {
        window.location = `/dispatch/establish-claim/${id}`;
      }, () => {
        this.setState({
          loading: null
        });
        handleAlert(
            'error',
            'Error',
            'There was an error while assigning the EP. Please try again later'
          );
      });
  }

  sortEndProduct = (date1, date2) => {
    let time1 = new Date(date1.claim_receive_date).getTime();
    let time2 = new Date(date2.claim_receive_date).getTime();

    return time2 - time1;
  }

  render = function() {
    let endProducts = this.props.endProducts.sort(this.sortEndProduct);


    return <div className="cf-app-segment cf-app-segment--alt">
        <h1>Create End Product</h1>

        <div className="usa-alert usa-alert-warning">
          <div className="usa-alert-body">
            <h3 className="usa-alert-heading">Existing EP</h3>
            <p className="usa-alert-text">We found one or more existing EP(s)
            created within 30 days of this decision date.
            Please review the existing EP(s) in the table below.
            Select one to assign to this claim or create a new EP.</p>
          </div>
        </div>

        <div className="usa-grid-full">
          <Table
            headers={TABLE_HEADERS}
            buildRowValues={this.buildEndProductRow}
            values={endProducts}
          />
        </div>
      </div>;
  };
}
