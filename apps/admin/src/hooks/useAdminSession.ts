import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAdminSession, loginAdmin, logoutAdmin } from '../api/auth';

export function useAdminSession() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['admin-session'],
    queryFn: getAdminSession,
  });

  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-session'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutAdmin,
    onSuccess: async () => {
      queryClient.setQueryData(['admin-session'], null);
      navigate('/login');
    },
  });

  return {
    session: sessionQuery.data,
    user: sessionQuery.data?.user,
    isLoading: sessionQuery.isLoading,
    isAuthenticated: Boolean(sessionQuery.data?.user),
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}
