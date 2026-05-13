jest.mock('firebase/storage', () => ({
  ref: jest.fn(() => 'storageRef'),
  uploadBytes: jest.fn().mockResolvedValue(undefined),
  getDownloadURL: jest.fn().mockResolvedValue('https://storage.example.com/file.jpg'),
}));
jest.mock('../lib/firebase', () => ({ storage: {} }));

global.fetch = jest.fn().mockResolvedValue({
  blob: jest.fn().mockResolvedValue(new Blob(['data'])),
}) as unknown as typeof fetch;

import { uploadPhotos } from '../lib/upload';

describe('uploadPhotos', () => {
  it('uploads each photo and returns download URLs', async () => {
    const urls = await uploadPhotos(['file:///photo1.jpg', 'file:///photo2.jpg'], 'uid123');
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe('https://storage.example.com/file.jpg');
    expect(urls[1]).toBe('https://storage.example.com/file.jpg');
  });
});
