import { useLocalSearchParams } from 'expo-router';
import ChatRoomScreen from '../../../src/features/chat/screens/ChatRoomScreen';

export default function ChatRoom() {
    const { roomId } = useLocalSearchParams();
    return <ChatRoomScreen roomId={roomId} />;
}
