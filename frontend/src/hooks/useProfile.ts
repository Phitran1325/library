import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, uploadAvatar } from '../services/profile.api';
import { notifications } from '@mantine/notifications';
import type { User } from '../types';

export const useProfile = () => {
    const queryClient = useQueryClient();

    // Query: Get Profile
    const {
        data: user,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['profile'],
        queryFn: getProfile,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
    });

    // Mutation: Update Profile
    const updateProfileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (updatedUser) => {
            // Update cache
            queryClient.setQueryData(['profile'], updatedUser);

            // Also update 'user' in localStorage if needed, or let AuthContext handle it
            // Ideally AuthContext should sync with this, but for now we update cache

            notifications.show({
                title: 'Thành công',
                message: 'Cập nhật thông tin thành công',
                color: 'green',
            });
        },
        onError: (err: any) => {
            notifications.show({
                title: 'Thất bại',
                message: err.message || 'Có lỗi xảy ra khi cập nhật thông tin',
                color: 'red',
            });
        },
    });

    // Mutation: Upload Avatar
    const uploadAvatarMutation = useMutation({
        mutationFn: uploadAvatar,
        onSuccess: (avatarUrl) => {
            // Update profile cache with new avatar
            queryClient.setQueryData<User>(['profile'], (oldUser) => {
                if (!oldUser) return undefined;
                return { ...oldUser, avatar: avatarUrl };
            });

            notifications.show({
                title: 'Thành công',
                message: 'Cập nhật ảnh đại diện thành công',
                color: 'green',
            });
        },
        onError: (err: any) => {
            notifications.show({
                title: 'Thất bại',
                message: err.message || 'Có lỗi xảy ra khi tải ảnh lên',
                color: 'red',
            });
        },
    });

    return {
        user,
        isLoading,
        error,
        refetch,
        updateProfile: updateProfileMutation.mutate,
        isUpdating: updateProfileMutation.isPending,
        uploadAvatar: uploadAvatarMutation.mutate,
        isUploading: uploadAvatarMutation.isPending,
    };
};
