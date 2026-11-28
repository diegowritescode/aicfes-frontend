import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { guardarSonido, sonidoEstaActivo } from '@/core/almacenamiento/sonido';

/**
 * The four sounds a duel makes.
 *
 * Generated rather than downloaded: four short synthesised tones,
 * about 16 KB in total, with no third party's licence attached to
 * them. `assets/sonidos` holds them.
 *
 * Every call is wrapped. Audio fails for reasons the app cannot
 * control — a phone in a call, a route that disappears when
 * headphones are pulled out, a codec a particular Android build
 * dislikes — and a duel that crashes because a sound would not play
 * is strictly worse than a silent duel.
 */

const FUENTES = {
  acierto: require('../../../../assets/sonidos/acierto.m4a'),
  fallo: require('../../../../assets/sonidos/fallo.m4a'),
  victoria: require('../../../../assets/sonidos/victoria.m4a'),
  derrota: require('../../../../assets/sonidos/derrota.m4a'),
} as const;

export type Sonido = keyof typeof FUENTES;

export function useSonido() {
  /* Starts on, and is corrected from storage once it answers. The
     alternative — starting off — would mute the first answer of the
     first round after every launch. */
  const [activo, setActivo] = useState(true);
  const reproductores = useRef<Partial<Record<Sonido, AudioPlayer>>>({});

  useEffect(() => {
    let vivo = true;
    void sonidoEstaActivo().then((valor) => {
      if (vivo) setActivo(valor);
    });

    /* Does not take over the phone's audio: a learner with music on
       keeps their music, and these tones play over it. Silent mode is
       respected, which on a phone in a classroom is the difference
       between a feature and a reason to uninstall. */
    void setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
    }).catch(() => undefined);

    return () => {
      vivo = false;
      /* Players hold a native handle each. Left behind, they leak for
         as long as the app runs. */
      for (const p of Object.values(reproductores.current)) {
        try {
          p?.remove();
        } catch {
          /* Already gone. */
        }
      }
      reproductores.current = {};
    };
  }, []);

  const sonar = useCallback(
    (cual: Sonido) => {
      if (!activo) return;

      try {
        let p = reproductores.current[cual];
        if (!p) {
          p = createAudioPlayer(FUENTES[cual]);
          reproductores.current[cual] = p;
        }
        /* Rewound rather than recreated: five correct answers in a
           round would otherwise build five native players, and the
           second one would not play while the first still held the
           route. */
        p.seekTo(0);
        p.play();
      } catch {
        /* A duel must not die over a sound. */
      }
    },
    [activo],
  );

  const alternar = useCallback(() => {
    setActivo((antes) => {
      const ahora = !antes;
      void guardarSonido(ahora);
      return ahora;
    });
  }, []);

  return { activo, sonar, alternar };
}
