import { useLocalSearchParams } from 'expo-router';
import ChatMediaGalleryScreen from '../../../src/features/chat/screens/ChatMediaGalleryScreen';

export default function ChatMedia() {
    const { roomId } = useLocalSearchParams();
    return <ChatMediaGalleryScreen roomId={roomId} />;
}
