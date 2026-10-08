import HealthKit, { QuantityTypeIdentifier } from "@kingstinct/react-native-healthkit";
import { Platform } from "react-native";
import dayjs from "dayjs";

const READ_TYPES = [
    QuantityTypeIdentifier.stepCount,
    QuantityTypeIdentifier.activeEnergyBurned,
    QuantityTypeIdentifier.appleExerciseTime,
];

/** HealthKit 권한 요청 */
export const initHealthKit = async () => {
    if (Platform.OS !== "ios") throw new Error("iOS only");
    await HealthKit.requestAuthorization({ toRead: READ_TYPES });
};

const querySum = async (identifier, startDate, endDate) => {
    const result = await HealthKit.queryStatisticsForQuantity(
        identifier,
        ["cumulativeSum"],
        { filter: { date: { startDate, endDate } } }
    );
    return Math.round(result?.sumQuantity?.quantity ?? 0);
};

/** 특정 날짜의 건강 데이터 조회 */
const getDayHealthData = async (date) => {
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const [stepsToday, calories, activeMinutes] = await Promise.all([
        querySum(QuantityTypeIdentifier.stepCount, startDate, endDate).catch(() => 0),
        querySum(QuantityTypeIdentifier.activeEnergyBurned, startDate, endDate).catch(() => 0),
        querySum(QuantityTypeIdentifier.appleExerciseTime, startDate, endDate).catch(() => 0),
    ]);

    return { stepsToday, calories, activeMinutes };
};

/** 오늘 건강 데이터 조회 */
export const getTodayHealthData = async () => {
    return getDayHealthData(new Date());
};

/** 최근 7일 건강 데이터 조회 (오늘 포함) */
export const getWeeklyHealthData = async () => {
    const results = [];
    for (let i = 6; i >= 0; i--) {
        const date = dayjs().subtract(i, "day").toDate();
        const data = await getDayHealthData(date).catch(() => ({
            stepsToday: 0,
            calories: 0,
            activeMinutes: 0,
        }));
        results.push({ date: dayjs(date).format("YYYY-MM-DD"), ...data });
    }
    return results;
};
