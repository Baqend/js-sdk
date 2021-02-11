export function hmac(message: string, key: string): Promise<string> {
  const encoder = new TextEncoder();

  return Promise.resolve(
    crypto.subtle.importKey(
      'raw', // raw format of the key - should be Uint8Array
      encoder.encode(key),
      { // algorithm details
        name: 'HMAC',
        hash: { name: 'SHA-1' },
      },
      false, // export = false
      ['sign', 'verify'], // what this key can do
    ),
  )
    .then((cryptoKey) => crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message)))
    .then((signature) => {
      const byteArray = new Uint8Array(signature);
      return byteArray.reduce((token, x) => token + x.toString(16).padStart(2, '0'), '');
    });
}
