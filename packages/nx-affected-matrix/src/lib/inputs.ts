import type { BaseInputs } from '../../../utils/src/lib/nx';

export interface Inputs extends BaseInputs {
  targets: string[];
  workingDirectory: string;
}
