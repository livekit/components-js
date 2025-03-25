import { describe, test } from 'vitest';
import { createEmailRegExp } from './emailRegex';

const fixtures = [
  'livekit@gmail.com',
  'foo@bar',
  'test@about.museum',
  'test@nominet.org.uk',
  'test.test@livekit.io',
  'test@255.255.255.255',
  'a@livekit.io',
  'test@e.com',
  'test@xn--hxajbheg2az3al.xn--jxalpdlp',
  'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghiklm@livekit.io',
  '!#$%&amp;`*+/=?^`{|}~@livekit.io',
  'test@g--a.com',
  'a@abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghikl.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghikl.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghikl.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefg.hij',
  '123@livekit.io',
  '"\\a"@livekit.io',
  '""@livekit.io',
  '"test"@livekit.io',
  '"\\""@livekit.io',
  'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghiklmn@livekit.io',
  'test@iana.co-uk',
  'a@a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v',
  'test@foo-bar.com',
  'foo@x.solutions',
  'foo@[IPv6:2001:db8::2]',
];

const fixturesNot = [
  '@',
  '@io',
  '@livekit.io',
  'test..livekit.io',
  'test@iana..com',
  'test@livekit.io.',
  '.test@livekit.io',
  'livekit@livekit@livekit.com',
  'mailto:livekit@gmail.com',
  'foo.example.com',
  'test.@example.com',
];

describe('Email regex tests', () => {
  test('extract', (t) => {
    for (const fixture of fixtures) {
      t.expect((createEmailRegExp().exec(`foo ${fixture} bar`) || [])[0]).toBe(fixture);
    }

    t.expect(createEmailRegExp().exec('mailto:livekit@gmail.com')?.[0]).toBe('livekit@gmail.com');
  });

  test('exact', (t) => {
    for (const fixture of fixtures) {
      t.expect(createEmailRegExp({ exact: true }).test(fixture)).toBeTruthy();
    }
  });

  test('failures', (t) => {
    for (const fixture of fixturesNot) {
      t.expect(createEmailRegExp({ exact: true }).test(fixture)).toBeFalsy();
    }
  });
});
