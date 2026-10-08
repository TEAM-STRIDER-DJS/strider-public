import { Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * 채팅 미디어(사진/동영상) 원본을 기기 갤러리에 저장한다.
 *
 * 말풍선 뷰어와 갤러리 뷰어가 같은 동작을 써야 해서 화면 밖으로 뺐다.
 * 확장자를 그대로 살려 내려받으므로 mp4에도 그대로 동작한다.
 *
 * @param {string} url - 원본 URL (formatImageUrl로 이미 절대 URL이 된 값)
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export const saveMediaToLibrary = async (url) => {
    if (!url) return false;

    try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '사진을 저장하려면 갤러리 접근 권한이 필요합니다.');
            return false;
        }

        // 임시 파일로 내려받은 뒤 갤러리에 넣는다 (쿼리스트링은 파일명에서 제거)
        const fileName = url.split('/').pop().split('?')[0] || `chat_media_${Date.now()}.jpg`;
        const localUri = FileSystem.cacheDirectory + fileName;
        const { uri } = await FileSystem.downloadAsync(url, localUri);
        await MediaLibrary.saveToLibraryAsync(uri);

        Alert.alert('저장 완료', '갤러리에 저장되었습니다.');
        return true;
    } catch (err) {
        console.error("[미디어 저장 실패]");
        // 시뮬레이터에는 사진 앱 권한 항목이 없어 이 예외가 난다
        if (err?.message?.includes('NSPhotoLibraryAddUsageDescription')) {
            Alert.alert(
                '시뮬레이터 미지원',
                '갤러리 저장은 실제 기기(iPhone)에서만 사용할 수 있습니다.\n실기기에서 테스트해 주세요.',
            );
        } else {
            Alert.alert('저장 실패', '저장하는 중 오류가 발생했습니다.');
        }
        return false;
    }
};
