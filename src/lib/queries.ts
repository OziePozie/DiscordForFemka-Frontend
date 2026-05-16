import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  getSession,
  getMe,
  updateMe,
  uploadAvatar,
  getPlayer,
  logout,
  unlinkProvider,
} from './api/endpoints';
import type {
  SessionDto,
  MeDto,
  UpdateMeRequest,
  PlayerPublicDto,
  AttachmentDto,
  AccountProvider,
} from './api/types';

export const qk = {
  session: ['session'] as const,
  me: ['me'] as const,
  player: (id: string) => ['player', id] as const,
};

export function useSession(): UseQueryResult<SessionDto | null> {
  return useQuery({
    queryKey: qk.session,
    queryFn: getSession,
    staleTime: 60_000,
    retry: 0,
  });
}

export function useMe(): UseQueryResult<MeDto> {
  return useQuery({
    queryKey: qk.me,
    queryFn: getMe,
  });
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.player(id) : ['player', 'none'],
    queryFn: () => getPlayer(id!),
    enabled: Boolean(id),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation<MeDto, Error, Partial<UpdateMeRequest>>({
    mutationFn: updateMe,
    onSuccess: (me) => {
      qc.setQueryData(qk.me, me);
      qc.invalidateQueries({ queryKey: qk.session });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation<AttachmentDto, Error, File>({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.session });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: logout,
    onSuccess: () => {
      qc.setQueryData(qk.session, null);
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useUnlinkProvider() {
  const qc = useQueryClient();
  return useMutation<void, Error, Lowercase<AccountProvider>>({
    mutationFn: unlinkProvider,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export type { PlayerPublicDto };
