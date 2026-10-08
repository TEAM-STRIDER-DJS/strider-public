# Strider

운동·건강 기록과 커뮤니티를 연결하는 React Native / Expo 앱입니다. 피드, 채팅, 카카오·네이버 로그인, 푸시 알림, iOS HealthKit 동기화와 백엔드 기반 AI 리포트 화면을 포함합니다.

이 저장소에는 프런트엔드만 포함됩니다. 회원가입·SMS 인증·피드·채팅·AI 리포트에는 호환되는 별도 백엔드가 필요합니다. 실제 서비스 키, Firebase 설정, 기존 서버 주소, 테스트 계정과 원본 Git 이력은 포함하지 않습니다.

## 기술 구성

- Expo SDK 54, React Native 0.81, React 19, Expo Router
- TanStack Query, Zustand, MMKV
- NativeWind, Gluestack UI
- STOMP WebSocket, React Native Firebase Messaging
- 카카오·네이버 로그인 SDK, iOS HealthKit

## 시작하기

Node.js와 npm, 대상 플랫폼의 Android SDK/JDK 또는 Xcode/CocoaPods가 필요합니다. 네이티브 모듈을 사용하므로 Expo Go 대신 개발 빌드를 사용하세요.

```sh
npm ci
cp .env.example .env
```

`.env`를 본인의 설정으로 수정합니다. 예시 도메인은 동작하는 백엔드가 아닙니다.

| 변수 | 용도 |
| --- | --- |
| `APP_IDENTIFIER` | Android 패키지·iOS Bundle ID (기본 `com.strider.app`) |
| `KAKAO_NATIVE_KEY` | 본인 카카오 앱의 Native App Key |
| `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | 본인 네이버 앱의 SDK 설정 |
| `API_BASE_URL` | HTTP API 서버 기준 주소 |
| `CHAT_WEBSOCKET_URL` | STOMP를 지원하는 WebSocket 엔드포인트 전체 주소 |
| `MEDIA_BASE_URL` | 상대 미디어 경로에 붙일 서버·CDN 기준 주소 |
| `SHARE_BASE_URL` | `/share/{postId}` 페이지를 제공하는 웹 서버 기준 주소 |
| `HEALTH_SYNC_ENABLED` | `true`이면 iOS HealthKit 동기화 활성화 (기본 꺼짐) |
| `DEMO_HEALTH_ENABLED` | `true`이면 샘플 건강 데이터 사용 (기본 꺼짐, 테스트 서버 전용) |

주소에 사용자명·비밀번호·쿼리·fragment를 넣지 마세요. 설정이 없으면 기존 서비스로 연결하지 않고 해당 요청에서 설정 오류를 반환합니다. 환경설정 변경 후 Metro를 재시작하고 네이티브 키·앱 식별자가 바뀌면 앱을 다시 빌드하세요.

## 소셜 로그인과 Firebase

1. 본인 카카오·네이버 개발자 앱에 사용할 패키지/Bundle ID와 Android 키 해시 등 플랫폼 정보를 등록합니다. URL scheme은 `app.config.js`에서 입력한 키로 생성됩니다.
2. 본인 Firebase 프로젝트에 같은 앱 식별자로 Android/iOS 앱을 등록합니다.
3. Android의 `google-services.json`, iOS의 `GoogleService-Info.plist`를 프로젝트 루트에 둡니다. 설정 파일은 Git에서 제외됩니다.
4. 푸시는 본인의 Firebase/APNs 및 백엔드 환경을 구성해야 합니다. 실제 토큰·사용자 정보를 로그나 문서에 붙이지 마세요.

```sh
npm run android
# macOS / Xcode 환경
npm run ios
# 이미 개발 빌드를 설치한 경우
npm start
```

`.env`는 Git 노출을 방지하지만 앱에 전달되는 값의 비밀 보관 수단은 아닙니다. 현재 네이버 SDK 설정은 Expo `extra`에 포함됩니다. 서버 전용 Secret이나 Firebase Admin 서비스 계정 키는 앱에 넣지 마세요.

## 프로젝트 구조

- `app/`: 파일 기반 라우팅과 인증·설정 화면
- `src/features/`: 피드·채팅·검색·홈 UI
- `src/api/`: 백엔드 API 호출
- `src/hooks/`: 조회·변경 및 실시간 연동
- `src/store/`: 인증·피드·채팅·UI 상태
- `src/config/runtime.js`: 공통 외부 서비스 설정
- `assets/`: 로고·알림음

## 현재 구현 범위

검색 화면은 로고 예시 이미지로 구성된 UI이며 실제 검색 API와 연결되어 있지 않습니다. 일부 공유 UI도 실제 메시지 전송 연동이 남아 있습니다. 온보딩용 PNG를 포함한 로컬 사진·샘플 영상·썸네일은 제외하고 온보딩 이미지는 로고로 대체했으며 서버에서 제공하는 미디어는 계속 표시합니다. iOS 건강 동기화와 샘플 건강 데이터 전송은 명시적으로 켜기 전까지 수행하지 않습니다.

## 검증과 공개 준비

[설정 및 검증 안내](docs/SETUP.md)를 참고하세요. 설정 파일이나 테스트 계정을 커밋하지 마세요. 공개 전 실제 키 교체, 팀의 코드·디자인 공개 동의와 라이선스 확인은 별도로 필요합니다.
