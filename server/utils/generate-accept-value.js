import crypto from 'crypto';

export default function generateAcceptValue(acceptKey) {
  return crypto.createHash('sha1').update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
}