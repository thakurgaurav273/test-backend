import { detectImage } from './image-signature';

const pad = (bytes: number[]) =>
  Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);

describe('detectImage', () => {
  it('detects jpeg, png, webp and gif', () => {
    expect(detectImage(pad([0xff, 0xd8, 0xff, 0xe0]))?.extension).toBe('jpg');
    expect(
      detectImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        ?.extension,
    ).toBe('png');
    expect(detectImage(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))?.extension).toBe(
      'webp',
    );
    expect(detectImage(Buffer.from('GIF89a\0\0\0\0\0\0'))?.extension).toBe(
      'gif',
    );
  });

  it('rejects text, svg and tiny buffers', () => {
    expect(
      detectImage(
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
      ),
    ).toBeNull();
    expect(detectImage(Buffer.from('just some plain text file'))).toBeNull();
    expect(detectImage(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});
