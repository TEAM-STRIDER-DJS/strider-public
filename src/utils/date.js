import dayjs from "dayjs";
import "dayjs/locale/ko";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("ko");

export const formatTimeAgo = (date) => {
    if (!date) return "";
    return dayjs(date).fromNow();
};

export const formatDate = (date, format = "YYYY.MM.DD") => {
    if (!date) return "";
    return dayjs(date).format(format);
};

/**
 * 백엔드 createdAt(문자열 또는 [y,m,d,...] 배열)을 YYYY-MM-DD 키로 변환
 */
export const toDateKey = (createdAt) => {
    if (!createdAt) return null;
    let d;
    if (Array.isArray(createdAt)) {
        const [y, mo, da] = createdAt;
        d = dayjs(`${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`);
    } else {
        d = dayjs(createdAt);
    }
    return d.isValid() ? d.format("YYYY-MM-DD") : null;
};
