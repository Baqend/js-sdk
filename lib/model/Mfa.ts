import { model } from 'lib';
import { Base64 } from './Base64';

export type MFAResponse = {
  qrCode: Base64<'png'>
  keyUri: string
  submitCode: (code: number) => Promise<model.User>
};
