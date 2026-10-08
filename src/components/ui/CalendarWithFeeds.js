import { useState, useCallback } from "react";
import { View, ImageBackground, Text, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import {
  VStack,
  HStack,
  Pressable,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalCloseButton,
  ScrollView,
  Button,
  ButtonText,
} from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";

const DayComponent = ({ date, state, feedsByDate, onDayPress, onDayFeedPress }) => {
  const key = `${date.year}-${String(date.month).padStart(2, "0")}-${String(
    date.day
  ).padStart(2, "0")}`;
  const feed = feedsByDate[key];

  return (
    <Pressable
      onPress={() => {
        // 피드가 있는 날짜를 누르면 해당 날짜 게시물로 이동
        if (feed && onDayFeedPress) {
          onDayFeedPress(feed, key);
          return;
        }
        onDayPress({ year: date.year, month: date.month, day: date.day });
      }}
      className="flex items-center justify-center h-[50px] w-[50px]"
    >
      {feed ? (
        <ImageBackground
          source={{ uri: feed.thumbnail }}
          className="w-[44px] h-[44px] items-center justify-center rounded-full overflow-hidden"
          imageStyle={{ borderRadius: 22 }}
          style={{ borderRadius: 22 }}
        >
          {/* 밝은 사진에서도 날짜가 보이도록 어둑한 오버레이 */}
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 22,
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          />
          <Text
            style={{
              color: "#fff",
              fontWeight: "bold",
              fontSize: 15,
              textShadowColor: "rgba(0,0,0,0.6)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
            selectable={false}
          >
            {date.day}
          </Text>
        </ImageBackground>
      ) : (
        <Text
          style={{ color: state === "disabled" ? "#ccc" : "#000" }}
          selectable={false}
        >
          {date.day}
        </Text>
      )}
    </Pressable>
  );
};

const CalendarWithFeeds = ({ feedsByDate = {}, initialDate = new Date(), onDayFeedPress }) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isModalVisible, setModalVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(initialDate.getFullYear());

  const openPicker = () => {
    setPickerYear(currentDate.getFullYear());
    setModalVisible(true);
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const handleDateSelect = (y, m) => {
    setCurrentDate(new Date(y, m - 1, 1));
    setModalVisible(false);
  };

  const handleDayPress = useCallback((day) => {
    setCurrentDate(new Date(day.year, day.month - 1, day.day));
  }, []);

  const handleMonthChange = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  return (
    <VStack className="space-y-4">
      {/* 연/월 선택 모달 */}
      <Modal isOpen={isModalVisible} onClose={() => setModalVisible(false)}>
        <ModalBackdrop />
        <ModalContent maxWidth={340} className="rounded-3xl">
          {/* 헤더 */}
          <View className="flex-row items-center justify-between px-5 pt-5 pb-1">
            <Text className="text-lg font-bold text-black">날짜 선택</Text>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
              <AntDesign name="close" size={20} color="#333A44" />
            </Pressable>
          </View>

          {/* 연도 스텝퍼 */}
          <View className="flex-row items-center justify-center py-3">
            <Pressable onPress={() => setPickerYear((y) => y - 1)} className="px-5 py-1">
              <AntDesign name="left" size={18} color="#6178FD" />
            </Pressable>
            <Text className="text-lg font-bold text-black text-center" style={{ width: 96 }}>
              {pickerYear}년
            </Text>
            <Pressable onPress={() => setPickerYear((y) => y + 1)} className="px-5 py-1">
              <AntDesign name="right" size={18} color="#6178FD" />
            </Pressable>
          </View>

          {/* 월 그리드 (4열) */}
          <View className="flex-row flex-wrap px-3 pb-5">
            {[...Array(12)].map((_, i) => {
              const m = i + 1;
              const selected = pickerYear === year && m === month;
              return (
                <View key={m} style={{ width: "25%", padding: 4 }}>
                  <Pressable
                    onPress={() => handleDateSelect(pickerYear, m)}
                    className={`h-11 rounded-2xl items-center justify-center ${
                      selected ? "bg-[#6178FD]" : "bg-[#F3F4F6]"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selected ? "text-white" : "text-[#333A44]"
                      }`}
                    >
                      {m}월
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ModalContent>
      </Modal>

      {/* 캘린더 커스텀 헤더 */}
      <Calendar
        key={formatDate(currentDate)}
        current={formatDate(currentDate)}
        firstDay={0}
        hideExtraDays={true}
        onDayPress={handleDayPress}
        hideArrows={true}
        style={{
          height: "100%",
          width: "100%",
          paddingVertical: 10,
        }}
        dayComponent={(props) => (
          <DayComponent
            {...props}
            feedsByDate={feedsByDate}
            onDayPress={handleDayPress}
            onDayFeedPress={onDayFeedPress}
          />
        )}
        renderHeader={() => (
          <HStack className="justify-center items-center w-full mb-4 ">
            <Pressable onPress={() => handleMonthChange(-1)} className="mr-4">
              <AntDesign name="left" size={20} color="black" />
            </Pressable>
            <Pressable onPress={openPicker}>
              <Text className="text-md font-bold" selectable={false}>
                {year}년 {month}월
              </Text>
            </Pressable>
            <Pressable onPress={() => handleMonthChange(1)} className="ml-4">
              <AntDesign name="right" size={20} color="black" />
            </Pressable>
          </HStack>
        )}
        theme={{
          selectedDayBackgroundColor: "#7C3AED",
          todayTextColor: "#DC2626",
          textDayFontWeight: "500",
          textMonthFontWeight: "bold",
        }}
      />
    </VStack>
  );
};

export default CalendarWithFeeds;
