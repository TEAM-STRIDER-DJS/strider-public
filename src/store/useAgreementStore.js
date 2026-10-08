import { create } from 'zustand';

const initialState = {
    age: false,
    terms: false,
    privacy: false,
    marketing: false,
    push: false,
    email: false,
    sms: false,
};

export const useAgreementStore = create((set, get) => ({
    agreements: initialState,

    toggle: (key) =>
        set((state) => ({
            agreements: {
                ...state.agreements,
                [key]: !state.agreements[key],
            },
        })),

    reset: () => set({ agreements: initialState }),

    setAll: (value) =>
        set(() => ({
            agreements: Object.keys(initialState).reduce((acc, key) => ({ ...acc, [key]: value }), {}),
        })),

    allRequiredChecked: () => {
        const { age, terms, privacy } = get().agreements;
        return age && terms && privacy;
    },
}));