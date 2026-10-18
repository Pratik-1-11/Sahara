import { app } from "@/firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const db = getFirestore(app);

export default function QuizScreen() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors = colorScheme === "dark" ? darkTheme : lightTheme;

  useEffect(() => {
    // Listen for real-time updates to disaster awareness questions
    const q = query(
      collection(db, "disaster_awareness_questions"),
      orderBy("id")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedQuestions = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setQuestions(fetchedQuestions);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);

    if (index === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
      } else {
        setQuizCompleted(true);
      }
    }, 800);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setScore(0);
    setQuizCompleted(false);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.accent} />
      </View>
    );
  }

  if (!questions.length) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: themeColors.text }}>
          No quiz questions found.
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={themeColors.backgroundGradient}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: themeColors.text }]}>
            Emergency Preparedness Quiz
          </Text>
        </View>

        {!quizCompleted ? (
          <View style={styles.quizContainer}>
            <View style={styles.progressContainer}>
              <Text
                style={[
                  styles.progressText,
                  { color: themeColors.textSecondary },
                ]}
              >
                Question {currentQuestion + 1}/{questions.length}
              </Text>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: themeColors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        ((currentQuestion + 1) / questions.length) * 100
                      }%`,
                      backgroundColor: themeColors.accent,
                    },
                  ]}
                />
              </View>
            </View>

            <Text style={[styles.questionText, { color: themeColors.text }]}>
              {questions[currentQuestion].question}
            </Text>

            <View style={styles.optionsContainer}>
              {questions[currentQuestion].options.map(
                (option: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor:
                          selectedOption === index
                            ? index === questions[currentQuestion].correctAnswer
                              ? themeColors.success + "20"
                              : themeColors.error + "20"
                            : themeColors.cardBackground,
                        borderColor: themeColors.border,
                      },
                    ]}
                    onPress={() => handleOptionSelect(index)}
                    disabled={selectedOption !== null}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionIndicator,
                          {
                            backgroundColor:
                              selectedOption === index
                                ? index ===
                                  questions[currentQuestion].correctAnswer
                                  ? themeColors.success
                                  : themeColors.error
                                : "transparent",
                            borderColor: themeColors.border,
                          },
                        ]}
                      >
                        {selectedOption === index && (
                          <Ionicons
                            name={
                              index === questions[currentQuestion].correctAnswer
                                ? "checkmark"
                                : "close"
                            }
                            size={16}
                            color="#FFF"
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              selectedOption === index
                                ? index ===
                                  questions[currentQuestion].correctAnswer
                                  ? themeColors.success
                                  : themeColors.error
                                : themeColors.text,
                          },
                        ]}
                      >
                        {option}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <LinearGradient
              colors={themeColors.accentGradient}
              style={styles.resultCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.resultTitle}>Quiz Completed!</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  {score}/{questions.length}
                </Text>
                <Text style={styles.scoreLabel}>Correct Answers</Text>
              </View>

              <View style={styles.resultMessage}>
                {score === questions.length ? (
                  <Text style={styles.perfectText}>
                    Perfect! You&apos;re fully prepared!
                  </Text>
                ) : score >= questions.length / 2 ? (
                  <Text style={styles.goodText}>Good job! Keep learning!</Text>
                ) : (
                  <Text style={styles.improveText}>
                    Review safety tips to improve!
                  </Text>
                )}
              </View>
            </LinearGradient>

            <TouchableOpacity
              style={[
                styles.restartButton,
                { backgroundColor: themeColors.cardBackground },
              ]}
              onPress={restartQuiz}
            >
              <Text style={[styles.restartText, { color: themeColors.accent }]}>
                Retake Quiz
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const lightTheme = {
  backgroundGradient: ["#F8FAFC", "#E2E8F0"] as const,
  cardBackground: "#FFFFFF",
  text: "#1E293B",
  textSecondary: "#64748B",
  accent: "#2563EB",
  accentText: "#FFFFFF",
  border: "#E2E8F0",
  accentGradient: ["#2563EB", "#1D4ED8"] as const,
  success: "#10B981",
  error: "#EF4444",
};

const darkTheme = {
  backgroundGradient: ["#0F172A", "#1E293B"] as const,
  cardBackground: "#1E293B",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  accent: "#3B82F6",
  accentText: "#FFFFFF",
  border: "#334155",
  accentGradient: ["#1D4ED8", "#1E40AF"] as const,
  success: "#10B981",
  error: "#EF4444",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    minHeight: "100%",
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    maxWidth: "80%",
  },
  quizContainer: {
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  questionText: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 32,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  optionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  optionText: {
    fontSize: 17,
    fontWeight: "500",
    flex: 1,
  },
  resultContainer: {
    alignItems: "center",
  },
  resultCard: {
    width: "100%",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 64,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 72,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
  },
  resultMessage: {
    marginTop: 16,
  },
  perfectText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  goodText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  improveText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  restartButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  restartText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
