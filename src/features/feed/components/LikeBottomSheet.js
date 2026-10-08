import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FollowCard from "@src/components/ui/FollowCard";
import { useFollowMutation } from "@src/hooks/mutations/useFollowMutation";
import { useAuthStore } from "@src/store/authStore";
import CustomBottomSheet from "@src/components/ui/CustomBottomSheet";
import { usePostLikes } from "@src/hooks/queries/useLikeQuery";
import { Spinner } from "@gluestack-ui/themed";

const LikeBottomSheet = forwardRef(({ snapPoints, onClose }, ref) => {
    const bottomSheetRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [postId, setPostId] = useState(null);

    // postId가 설정되면 쿼리 실행
    const { data: likeUsers = [], isLoading } = usePostLikes(postId);

    const myUserId = useAuthStore((state) => state.userId);
    const { mutate: toggleFollow } = useFollowMutation();

    useImperativeHandle(ref, () => ({
        present: (params) => {
            if (params?.postId) {
                setPostId(params.postId);
            }
            bottomSheetRef.current?.present();
        },
        dismiss: () => {
            bottomSheetRef.current?.dismiss();
            setPostId(null);
            setSearchQuery("");
        },
    }));

    const handleToggleFollow = (targetUserId, isCurrentlyFollowing) => {
        if (!myUserId) return;
        toggleFollow({
            userId: myUserId,
            targetUserId,
            isFollowed: isCurrentlyFollowing,
        });
    };

    /** 검색 결과 필터링 */
    const filteredList = (Array.isArray(likeUsers) ? likeUsers : []).filter(u => 
        (u.nickname || u.userNickname || u.memberName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <CustomBottomSheet
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            onClose={onClose}
        >
            <View className="flex-1">
                <View className="items-center py-3 border-b border-gray-100">
                    <Text className="text-base font-bold text-gray-800">좋아요</Text>
                </View>

                <View className="px-4 py-3">
                    <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
                        <Ionicons name="search" size={18} color="#9CA3AF" />
                        <TextInput
                            placeholder="검색"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="flex-1 ml-2 text-sm text-gray-800 py-0"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <Spinner size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredList}
                        keyExtractor={(item, index) => item?.userId ?? index.toString()}
                        renderItem={({ item }) =>
                            item ? (
                                <FollowCard data={item} onToggleFollow={handleToggleFollow} />
                            ) : null
                        }
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-20">
                                <Text className="text-gray-400">좋아요를 누른 사람이 없습니다.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </CustomBottomSheet>
    );
});

export default LikeBottomSheet;
