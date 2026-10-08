import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommentApi, createReplyApi, deleteCommentApi, toggleCommentLikeApi } from "@src/api/feedApi";

/**
 * 댓글 작성 Mutation
 */
export const useAddComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, content }) => createCommentApi(postId, content),
        onMutate: async ({ postId, content, userNickname, userProfileImg }) => {
            await queryClient.cancelQueries({ queryKey: ["comments", postId] });
            const previousComments = queryClient.getQueryData(["comments", postId]);

            queryClient.setQueryData(["comments", postId], (old) => {
                const newComment = {
                    commentId: Date.now(),
                    feedPostId: postId,
                    userNickname: userNickname || 'Me',
                    userProfileImg: userProfileImg || null,
                    commentText: content, // content -> commentText로 수정
                    createdAt: new Date().toISOString(),
                    likeCount: 0,
                    userLike: false,
                    replyCount: 0,
                    isMyComment: true,
                    isTemp: true,
                };

                if (!old) return { data: [newComment] };
                const currentData = Array.isArray(old.data) ? old.data : [];
                return {
                    ...old,
                    data: [newComment, ...currentData]
                };
            });

            return { previousComments };
        },
        onError: (err, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(["comments", variables.postId], context.previousComments);
            }
        },
        onSettled: (data, error, variables) => {
            // 성공 시 즉시 데이터 최신화
            queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
        },
    });
};

/**
 * 댓글 삭제 Mutation
 */
export const useDeleteComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId }) => deleteCommentApi(commentId),
        onMutate: async ({ postId, commentId }) => {
            await queryClient.cancelQueries({ queryKey: ["comments", postId] });
            const previousComments = queryClient.getQueryData(["comments", postId]);

            queryClient.setQueryData(["comments", postId], (old) => {
                if (!old || !old.data) return old;
                return {
                    ...old,
                    data: old.data.filter(c => c.commentId !== commentId)
                };
            });

            return { previousComments };
        },
        onError: (err, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(["comments", variables.postId], context.previousComments);
            }
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
        },
    });
};

/**
 * 댓글 좋아요 Mutation
 */
export const useToggleCommentLike = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, isLiked }) => toggleCommentLikeApi(commentId, isLiked),
        onMutate: async ({ postId, commentId, parentCommentId }) => {
            console.log("[useToggleCommentLike] onMutate Start:");
            // parentCommentId가 있으면 대댓글 좋아요, 없으면 일반 댓글 좋아요
            const queryKey = parentCommentId ? ["replies", parentCommentId] : ["comments", postId];

            await queryClient.cancelQueries({ queryKey });
            const previousData = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old) => {
                if (!old || !old.data) return old;
                const newData = old.data.map(c => {
                    if (c.commentId === commentId) {
                        return {
                            ...c,
                            userLike: !c.userLike,
                            likeCount: c.userLike ? c.likeCount - 1 : c.likeCount + 1
                        };
                    }
                    return c;
                });
                return { ...old, data: newData };
            });

            return { previousData, queryKey };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(context.queryKey, context.previousData);
            }
        },
        onSettled: (data, error, variables) => {
            // 좋아요는 실시간 UI 반영이 중요하므로 invalidateQueries를 생략하여 
            // getCommentsApi/getRepliesApi가 불필요하게 호출되는 것을 방지합니다.
            // 필요 시에만 수동으로 최상위에서 조절할 수 있습니다.
        },
    });
};

/**
 * 대댓글 작성 Mutation
 */
export const useAddReply = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, commentId, content }) => createReplyApi(postId, commentId, content),
        onMutate: async ({ commentId, content, userNickname, userProfileImg }) => {
            await queryClient.cancelQueries({ queryKey: ["replies", commentId] });
            const previousReplies = queryClient.getQueryData(["replies", commentId]);

            queryClient.setQueryData(["replies", commentId], (old) => {
                const newReply = {
                    commentId: Date.now(),
                    parentCommentId: commentId,
                    userNickname: userNickname || 'Me',
                    userProfileImg: userProfileImg || null,
                    commentText: content, // content -> commentText 일원화
                    createdAt: new Date().toISOString(),
                    likeCount: 0,
                    userLike: false,
                    isMyComment: true,
                    isTemp: true,
                };

                if (!old) return { data: [newReply] };
                const currentData = Array.isArray(old.data) ? old.data : [];
                return {
                    ...old,
                    data: [...currentData, newReply]
                };
            });

            return { previousReplies };
        },
        onError: (err, variables, context) => {
            if (context?.previousReplies) {
                queryClient.setQueryData(["replies", variables.commentId], context.previousReplies);
            }
        },
        onSettled: (data, error, variables) => {
            // 대댓글 작성 시 해당 대댓글 목록과 부모 댓글 목록(답글 개수 갱신용) 모두 무효화
            queryClient.invalidateQueries({ queryKey: ["replies", variables.commentId] });
            queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
        },
    });
};
