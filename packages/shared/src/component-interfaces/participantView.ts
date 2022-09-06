import { BaseSetupReturnType } from './types';

const observers = {};

function setup(): BaseSetupReturnType {
  return {
    className: 'lk-participant-view',
  };
}

export { setup, observers };
