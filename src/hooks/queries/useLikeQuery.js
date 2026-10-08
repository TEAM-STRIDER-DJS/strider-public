import { useQuery } from '@tanstack/react-query';
import { getPostLikesApi } from '../../api/feedApi';

export const usePostLikes = (postId) => {
    return useQuery({
        queryKey: ['likes', postId],
        queryFn: () => getPostLikesApi(postId),
        enabled: !!postId, // postId가 있을 때만 실행
        select: (data) => data || [],
    });
};
