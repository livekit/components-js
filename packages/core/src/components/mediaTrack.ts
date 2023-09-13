import { RemoteTrackPublication, Track, type TrackPublication } from 'livekit-client';
import { map, startWith } from 'rxjs';
import { observeParticipantMedia } from '../observables/participant';
import { prefixClass } from '../styles-interface';
import { isTrackReference } from '../track-reference/track-reference.types';
import type { TrackIdentifier } from '../types';

const publicationInViewSet = new Map<string, number>();
const managedPublications = new Map<string, TrackPublication>();
const unsubTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

let intersectionObserver: IntersectionObserver | undefined;

export function setupMediaTrack(trackIdentifier: TrackIdentifier, element?: HTMLMediaElement) {
  if (!intersectionObserver) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pubId = entry.target.getAttribute('data-lk-publication-sid');
          if (pubId) {
            if (entry.isIntersecting) {
              let inViewCount = publicationInViewSet.get(pubId!) ?? 0;

              inViewCount += 1;
              publicationInViewSet.set(pubId, inViewCount);
            } else {
              let inViewCount = publicationInViewSet.get(pubId!) ?? 0;
              inViewCount -= 1;
              publicationInViewSet.set(pubId, Math.max(0, inViewCount));
            }
          }
        });
        for (const [pubSid, publication] of managedPublications) {
          if (publication instanceof RemoteTrackPublication) {
            const inViewCount = publicationInViewSet.get(pubSid) ?? 0;
            if (inViewCount > 0) {
              clearTimeout(unsubTimeouts.get(pubSid));
              unsubTimeouts.delete(pubSid);
              publication.setSubscribed(true);
              console.log('setting publication sub', pubSid);
            } else {
              const timeout =
                unsubTimeouts.get(pubSid) ??
                setTimeout(() => {
                  publication.setSubscribed(false);
                  console.log('setting publication unsub', pubSid);
                  unsubTimeouts.delete(pubSid);
                }, 3000);
              unsubTimeouts.set(pubSid, timeout);
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '0px',
      },
    );
  }
  console.log('isTrackRef', isTrackReference(trackIdentifier), element);
  if (isTrackReference(trackIdentifier) && element) {
    managedPublications.set(trackIdentifier.publication.trackSid, trackIdentifier.publication);
    element.setAttribute('data-lk-publication-sid', trackIdentifier.publication.trackSid);
    intersectionObserver.observe(element);
  }

  const initialPub = getTrackByIdentifier(trackIdentifier);
  const trackObserver = observeParticipantMedia(trackIdentifier.participant).pipe(
    map(() => {
      return getTrackByIdentifier(trackIdentifier);
    }),
    startWith(initialPub),
  );
  const className: string = prefixClass(
    trackIdentifier.source === Track.Source.Camera ||
      trackIdentifier.source === Track.Source.ScreenShare
      ? 'participant-media-video'
      : 'participant-media-audio',
  );
  return { className, trackObserver };
}

export function getTrackByIdentifier(options: TrackIdentifier) {
  if (isTrackReference(options)) {
    return options.publication;
  } else {
    const { source, name, participant } = options;
    if (source && name) {
      return participant.getTracks().find((pub) => pub.source === source && pub.trackName === name);
    } else if (name) {
      return participant.getTrackByName(name);
    } else if (source) {
      return participant.getTrack(source);
    } else {
      throw new Error('At least one of source and name needs to be defined');
    }
  }
}
