import { useQuery } from "@tanstack/react-query";
import { verifyPhoneCodeApi, checkAvailableIdApi, findMyIdQueryApi } from "@src/api/authApi";

export function useVerifyPhoneCodeQuery(phoneNumber, code, enabled) {
    return useQuery({
        queryKey: ["verifyPhoneCode", phoneNumber, code],
        enabled,
        queryFn: () => verifyPhoneCodeApi({ phoneNumber, inputCode: code }),
    });
}

export function findMyIdQuery(phoneNumber, code, enabled) {
    return useQuery({
        queryKey: ["findMyId", phoneNumber, code],
        enabled,
        queryFn: () => findMyIdQueryApi({ phoneNumber, inputCode: code }),
    });
}

export function useCheckAvailableIdQuery(id) {
  return useQuery({
    // include id in the key so cache entries are per-id and the queryFn
    // receives the id from the queryKey when refetch() is called
    queryKey: ["checkAvailableId", id],
    // Do not run automatically; we'll trigger refetch when user presses the button
    enabled: false,
    queryFn: ({ queryKey }) => checkAvailableIdApi(queryKey[1]),
  });
};