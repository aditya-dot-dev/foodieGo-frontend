import { fetchApi } from './client';
import { ProfileData, UpdateProfilePayload, UpdateAvatarPayload } from './types';

export const profileApi = {
    // GET /profile/me - Get current user profile
    getMe: async (): Promise<ProfileData> => {
        return fetchApi<ProfileData>('/profile/me');
    },

    // PUT /profile/me - Update profile (name, phone)
    updateMe: async (
        payload: UpdateProfilePayload
    ): Promise<{ message: string; user: ProfileData }> => {
        return fetchApi<{ message: string; user: ProfileData }>('/profile/me', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },

    // PUT /profile/me/avatar - Update profile image
    updateAvatar: async (
        payload: UpdateAvatarPayload
    ): Promise<{ message: string; user: ProfileData }> => {
        const formData = new FormData();
        if (payload.profile_image instanceof File) {
            formData.append('profile_image', payload.profile_image);
        } else {
            formData.append('profile_image', payload.profile_image);
        }

        return fetchApi<{ message: string; user: ProfileData }>('/profile/me/avatar', {
            method: 'PUT',
            body: formData,
        });
    },
};
