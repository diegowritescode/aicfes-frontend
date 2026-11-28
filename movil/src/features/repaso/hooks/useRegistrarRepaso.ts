import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { Area, Letra } from '@/shared/model/icfes';
import {
  completarSesionEstudio,
  guardarRespuestas,
  iniciarSesionEstudio,
} from '@/shared/pregunta/api/peticiones';

/**
 * Record that a mistake was revisited.
 *
 * A real session, opened and closed. The question of the day used to
 * make up a `sessionId` string and the server rejected every one of
 * them with INVALID_SESSION — so no answer was ever stored, the area
 * never moved, and nothing said so. Not repeating that here.
 *
 * Getting it right is what removes it from the list: the server
 * recomputes what is outstanding from the answers, so a correct one
 * stops appearing on the next read.
 */
export function useRegistrarRepaso(alTerminar?: () => void) {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      itemId: string;
      area: Area;
      elegida: Letra;
      acerto: boolean;
    }) => {
      const sesion = await iniciarSesionEstudio({ mode: 'test', area: params.area });
      if (!sesion.ok) throw sesion.fallo;

      const guardado = await guardarRespuestas([
        {
          sessionId: sesion.datos.sessionId,
          questionIndex: 0,
          area: params.area,
          dificultad: 'media',
          selectedAnswer: params.elegida,
          isCorrect: params.acerto,
          itemId: params.itemId,
        },
      ]);
      if (!guardado.ok) throw guardado.fallo;

      await completarSesionEstudio(sesion.datos.sessionId, {
        durationSeconds: 60,
        totalQuestions: 1,
        correctQuestions: params.acerto ? 1 : 0,
        areaBreakdown: {
          [params.area]: { correct: params.acerto ? 1 : 0, total: 1 },
        },
      });
    },
    onSuccess: () => {
      /* The dashboard counts this, and the list is now one shorter.
         Both come from the server, so both get re-read. */
      void cliente.invalidateQueries({ queryKey: ['panel'] });
      alTerminar?.();
    },
  });
}
