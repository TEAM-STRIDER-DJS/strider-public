const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * @react-native-firebase 를 static frameworks 없이 쓸 때,
 * Firebase Swift pod(FirebaseCoreInternal 등)이 GoogleUtilities 등에서 모듈맵을 요구하며 실패한다.
 * Podfile에 `use_modular_headers!` 를 추가해 전역 모듈맵 생성을 켠다.
 * (static frameworks를 안 쓰므로 RNFBMessaging의 RCT_EXPORT_METHOD 등 RN 매크로도 정상 컴파일)
 */
module.exports = function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfile = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );
      let contents = fs.readFileSync(podfile, "utf8");

      if (!contents.includes("use_modular_headers!")) {
        // platform :ios 선언 바로 다음 줄(전역)에 삽입
        contents = contents.replace(
          /(platform :ios[^\n]*\n)/,
          `$1use_modular_headers!\n`,
        );
        fs.writeFileSync(podfile, contents);
      }

      return config;
    },
  ]);
};
