import { BaseSetupReturnType } from './types';

interface ParticipantNameSetup extends BaseSetupReturnType {}
function setup(): ParticipantNameSetup {
  return { className: 'lk-participant-name' };
}
export { setup };
