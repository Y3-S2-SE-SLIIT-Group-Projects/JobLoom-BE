import mongoose from 'mongoose';
import { generateJitsiRoomName } from '../../src/utils/jitsiRoom.js';

describe('generateJitsiRoomName', () => {
  test('returns a string matching jobloom-{8hex}-{32hex} pattern', () => {
    const id = new mongoose.Types.ObjectId();
    const name = generateJitsiRoomName(id);
    expect(name).toMatch(/^jobloom-[0-9a-f]{8}-[0-9a-f]{32}$/);
  });

  test('uses last 8 chars of id string in the prefix segment', () => {
    const id = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    const name = generateJitsiRoomName(id);
    expect(name.startsWith('jobloom-99439011-')).toBe(true);
  });

  test('produces different names on successive calls (random suffix)', () => {
    const id = new mongoose.Types.ObjectId();
    const a = generateJitsiRoomName(id);
    const b = generateJitsiRoomName(id);
    expect(a).not.toBe(b);
  });
});
