import React, { useState } from 'react';
import MediaPickerStep from '@src/features/feed/components/MediaPickerStep';
import PostDetailsStep from '@src/features/feed/components/PostDetailsStep';

export default function RegisterFeedScreen() {
    const [step, setStep] = useState(1);
    const [selectedMedia, setSelectedMedia] = useState([]);

    const handleNext = (media) => {
        setSelectedMedia(media);
        setStep(2);
    };

    // 뒤로 갈 때 Step2에서 편집한 목록(삭제/순서변경)을 보존
    const handleBack = (media) => {
        if (Array.isArray(media)) setSelectedMedia(media);
        setStep(1);
    };

    if (step === 1) {
        return <MediaPickerStep onNext={handleNext} initialSelected={selectedMedia} />;
    }

    return <PostDetailsStep selectedMedia={selectedMedia} onBack={handleBack} />;
}
