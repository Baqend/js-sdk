import { Base64 } from './Base64';

export type MFAResponse = {
  qrCode: Base64<'png'>
  keyUri: string
};
