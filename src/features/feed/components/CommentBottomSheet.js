import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, Image, Keyboard, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomBottomSheet from '@src/components/ui/CustomBottomSheet';
import { useComments, useReplies } from '@src/hooks/queries/useFeedQuery';
import { useProfileQuery } from '@src/hooks/queries/useProfileQuery';
import { useAddComment, useDeleteComment, useToggleCommentLike, useAddReply } from '@src/hooks/mutations/useCommentMutation';
import { useAuthStore } from '@src/store/authStore';
import { formatTimeAgo } from '@src/utils/date';

// 이미지 매핑 헬퍼
const getImageSource = (imagePath) => {
    // URL or Base64
    if (imagePath && (imagePath.startsWith('http') || imagePath.startsWith('data:'))) {
        return { uri: imagePath };
    }
    return require('@assets/strider-logo.png');
};


// 개별 댓글 아이템 컴포넌트 (대댓글 로직 분리)
const CommentItem = React.memo(({ item, postId, onDelete, onLike, onReply }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { data: replies = [], isLoading: isRepliesLoading } = useReplies(item.commentId);

    const hasReplies = item.replyCount > 0;

    const handleDelete = () => {
        Alert.alert("댓글 삭제", "정말로 삭제하시겠습니까?", [
            { text: "취소", style: "cancel" },
            { text: "삭제", style: "destructive", onPress: () => onDelete(item.commentId) }
        ]);
    };

    return (
        <View style={styles.commentItemContainer}>
            <View style={styles.commentItem}>
                <Image source={getImageSource(item.userProfileImg)} style={styles.profileImg} />
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.nickname}>{item.userNickname}</Text>
                        <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{item.commentText}</Text>

                    <View style={styles.actionRow}>
                        <Pressable onPress={() => onReply(item)} hitSlop={8}>
                            <Text style={styles.replyButtonText}>답글 달기</Text>
                        </Pressable>
                        {item.isMyComment && (
                            <Pressable onPress={handleDelete} hitSlop={8} style={{ marginLeft: 12 }}>
                                <Text style={styles.deleteButtonText}>삭제</Text>
                            </Pressable>
                        )}
                    </View>

                    {/* 답글 보기 토글 */}
                    {hasReplies && (
                        <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.viewRepliesButton}>
                            <View style={styles.horizontalLine} />
                            <Text style={styles.viewRepliesText}>
                                {isExpanded ? '답글 숨기기' : `답글 ${item.replyCount}개 보기`}
                            </Text>
                        </Pressable>
                    )}
                </View>

                <Pressable
                    onPress={() => {
                        console.log("[CommentItem] Heart Clicked:");
                        onLike(item.commentId, item.userLike);
                    }}
                    style={styles.likeButton}
                    hitSlop={10}
                >
                    <Ionicons name={item.userLike ? "heart" : "heart-outline"} size={16} color={item.userLike ? "#FF4B4B" : "#888"} />
                    {item.likeCount > 0 && <Text style={styles.likeCountText}>{item.likeCount}</Text>}
                </Pressable>
            </View>

            {/* 대댓글 목록 렌더링 */}
            {isExpanded && (
                <View style={styles.repliesContainer}>
                    {isRepliesLoading ? (
                        <ActivityIndicator size="small" color="#999" style={{ alignSelf: 'flex-start', marginLeft: 20 }} />
                    ) : (
                        replies.map(reply => (
                            <View key={reply.commentId} style={styles.replyItem}>
                                <Image source={getImageSource(reply.userProfileImg)} style={styles.replyProfileImg} />
                                <View style={styles.replyContent}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.nickname}>{reply.userNickname}</Text>
                                        <Text style={styles.time}>{formatTimeAgo(reply.createdAt)}</Text>
                                    </View>
                                    <Text style={styles.commentText}>{reply.commentText}</Text>
                                </View>
                                <Pressable
                                    onPress={() => onLike(reply.commentId, reply.userLike, item.commentId)}
                                    style={styles.likeButton}
                                    hitSlop={10}
                                >
                                    <Ionicons
                                        name={reply.userLike ? "heart" : "heart-outline"}
                                        size={14}
                                        color={reply.userLike ? "#FF4B4B" : "#888"}
                                    />
                                    {reply.likeCount > 0 && <Text style={styles.likeCountText}>{reply.likeCount}</Text>}
                                </Pressable>
                            </View>
                        ))
                    )}
                </View>
            )}
        </View>
    );
});


const CommentBottomSheet = React.forwardRef(({ postId, onClose, snapPoints: propSnapPoints }, ref) => {
    const insets = useSafeAreaInsets();
    const [inputText, setInputText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // { commentId, userNickname }
    const inputRef = useRef(null);

    const { data: comments = [], isLoading } = useComments(postId);
    const addCommentMutation = useAddComment();
    const addReplyMutation = useAddReply();
    const deleteCommentMutation = useDeleteComment();
    const toggleLikeMutation = useToggleCommentLike();

    // 로그인 유저 프로필
    const myUserId = useAuthStore((state) => state.userId);
    const { data: myProfile } = useProfileQuery(myUserId);
    const myProfileImg = myProfile?.profileImage
        ? { uri: myProfile.profileImage }
        : require('@assets/strider-logo.png');

    // 입력창 포커스 및 텍스트 설정
    const handleReply = useCallback((comment) => {
        setReplyingTo({ commentId: comment.commentId, userNickname: comment.userNickname });
        // 약간의 딜레이 후 포커스 (모달 애니메이션 고려)
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    }, []);

    const handleCancelReply = useCallback(() => {
        setReplyingTo(null);
        setInputText('');
        Keyboard.dismiss();
    }, []);

    const handleSubmit = () => {
        if (!inputText.trim()) return;

        const userNickname = myProfile?.nickname;
        const userProfileImg = myProfile?.profileImage || null;

        if (replyingTo) {
            // 대댓글 작성
            addReplyMutation.mutate(
                { postId, commentId: replyingTo.commentId, content: inputText, userNickname, userProfileImg },
                {
                    onSuccess: () => {
                        setInputText('');
                        setReplyingTo(null);
                        Keyboard.dismiss();
                    }
                }
            );
        } else {
            // 일반 댓글 작성
            addCommentMutation.mutate(
                { postId, content: inputText, userNickname, userProfileImg },
                {
                    onSuccess: () => {
                        setInputText('');
                        Keyboard.dismiss();
                    }
                }
            );
        }
    };

    // 상위에서 전달받은 snapPoints 사용, 없으면 기본값 설정
    const snapPoints = useMemo(() => propSnapPoints || ['50%'], [propSnapPoints]);

    return (
        <CustomBottomSheet
            ref={ref}
            snapPoints={snapPoints}
            onClose={() => {
                handleCancelReply();
                onClose && onClose();
            }}
            enablePanDownToClose={true}
        >
            <View style={styles.container}>
                {/* 헤더 */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        댓글 {comments.reduce((acc, curr) => acc + 1 + (curr.replyCount || 0), 0)}
                    </Text>
                </View>

                {/* 댓글 목록 영역을 flex: 1로 감싸서 입력창 공간 확보 */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={{ flex: 1 }}>
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#000" />
                            </View>
                        ) : (
                            <FlatList
                                style={{ flex: 1 }}
                                data={comments}
                                keyExtractor={(item) => item.commentId.toString()}
                                renderItem={({ item }) => (
                                    <CommentItem
                                        item={item}
                                        postId={postId}
                                        onDelete={(id) => deleteCommentMutation.mutate({ postId, commentId: id })}
                                        onLike={(id, isLiked, parentCommentId) => {
                                            console.log("[CommentBottomSheet] onLike called:");
                                            toggleLikeMutation.mutate({ postId, commentId: id, isLiked, parentCommentId });
                                        }}
                                        onReply={handleReply}
                                    />
                                )}
                                contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>아직 댓글이 없습니다.</Text>
                                        <Text style={styles.emptySubText}>첫 번째 댓글을 남겨보세요!</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>

                    {/* 입력창 영역 */}
                    <View
                        style={[
                            styles.inputContainer,
                            { paddingBottom: Math.max(insets.bottom, 16) }
                        ]}
                    >
                        {replyingTo && (
                            <View style={styles.replyingBar}>
                                <Text style={styles.replyingText}>
                                    <Text style={{ fontWeight: 'bold' }}>{replyingTo.userNickname}</Text>님에게 답글 남기는 중...
                                </Text>
                                <Pressable onPress={handleCancelReply} hitSlop={10}>
                                    <Ionicons name="close-circle" size={20} color="#666" />
                                </Pressable>
                            </View>
                        )}
                        <View style={styles.inputWrapper}>
                            <Image source={myProfileImg} style={styles.inputProfileImg} />
                            <View style={styles.textInputContainer}>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.textInput}
                                    placeholder={replyingTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."}
                                    placeholderTextColor="#999"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    multiline
                                    maxLength={300}
                                    autoFocus={false} // 자동 포커스 끔
                                />
                                {inputText.trim().length > 0 && (
                                    <Pressable onPress={handleSubmit} style={styles.sendButton}>
                                        <Text style={styles.sendButtonText}>게시</Text>
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </CustomBottomSheet>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 13,
        color: '#AAA',
    },
    // Comment Item Styles
    commentItemContainer: {
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    commentItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    profileImg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        backgroundColor: '#F0F0F0',
        borderWidth: 0.5,
        borderColor: '#E0E0E0',
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    nickname: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 6,
    },
    time: {
        fontSize: 11,
        color: '#999',
    },
    commentText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 4,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 2,
    },
    replyButtonText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    deleteButtonText: {
        fontSize: 12,
        color: '#FF4B4B',
        fontWeight: '600',
    },
    likeButton: {
        alignItems: 'center',
        marginLeft: 10,
        marginTop: 4,
    },
    likeCountText: {
        fontSize: 10,
        color: '#888',
        marginTop: 2,
    },
    viewRepliesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    horizontalLine: {
        width: 20,
        height: 1,
        backgroundColor: '#DDD',
        marginRight: 8,
    },
    viewRepliesText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
    },
    repliesContainer: {
        marginTop: 12,
        paddingLeft: 46, // 대댓글 들여쓰기
    },
    replyItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    replyProfileImg: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
        backgroundColor: '#F0F0F0',
    },
    replyContent: {
        flex: 1,
    },
    // Input Styles
    keyboardAvoidingView: {
        // zIndex: 1, // 필요시
    },
    inputContainer: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingHorizontal: 16,
        paddingTop: 12,
        width: '100%',
        zIndex: 100,
        elevation: 5,
    },
    replyingBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    replyingText: {
        fontSize: 12,
        color: '#666',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    inputProfileImg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
        marginBottom: 4,
        backgroundColor: '#F0F0F0',
    },
    textInputContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        alignItems: 'center',
        paddingHorizontal: 12,
        minHeight: 40,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        paddingVertical: 8,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 8,
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    sendButtonText: {
        color: '#0066FF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default CommentBottomSheet;
