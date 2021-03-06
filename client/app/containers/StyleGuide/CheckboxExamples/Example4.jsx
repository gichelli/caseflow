import React from 'react';

// components
import CheckboxGroup from '../../../components/CheckboxGroup';

export default class Example4 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      values: {
        checkboxExample41: false,
        checkboxExample42: true
      }
    };
  }

  onChange = (event) => {
    let state = this.state;

    state.values[event.target.getAttribute('id')] = event.target.checked;

    this.setState(state);
  }

  render = () => {
    let options = [
      {
        id: 'checkboxExample41',
        label: 'Option 1'
      },
      {
        id: 'checkboxExample42',
        label: 'Option 2'
      }
    ];

    return <CheckboxGroup
      label={<h3 id="horizontal">Horizontal Checkboxes</h3>}
      name="checkbox_example_4"
      options={options}
      onChange={this.onChange}
      values={this.state.values}
    />;
  }
}
