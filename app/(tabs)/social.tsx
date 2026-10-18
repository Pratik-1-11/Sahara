// =========================
// Imports
// =========================
import ProtectedRoute from "@/components/ProtectedRoute";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal, Platform, Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from "react-native";
// Firestore imports
import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import React from "react";
import { db } from "../../firebase/firebaseConfig";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

const AnimatedFlatList = forwardRef<
  FlatList<DisplayPost>,
  React.ComponentProps<typeof FlatList<DisplayPost>>
>((props, ref) => <Animated.FlatList {...props} ref={ref as any} />);

// =========================
// Type Definitions
// =========================
interface Post {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  role: string;
  content: string;
  createdAt: any;
  commentsCount: number;
  likesCount: number;
  isHidden: boolean;
  isPinned: boolean;
  image?: string;
}

interface DisplayPost {
  id: string;
  userId: string;
  user: {
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  timestamp: string;
  comments: number;
  likes: number;
  image?: string;
}

// Add a hook to fetch and listen to the current user's profile from Firestore
type UserProfile = {
  name: string;
  avatar: string;
  role: string;
};

function useCurrentUserProfile(user: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          name: data.name || user.displayName || "Anonymous",
          avatar:
            data.avatar ||
            user.photoURL ||
            "https://ui-avatars.com/api/?name=" +
              encodeURIComponent(data.name || user.displayName || "A"),
          role: data.role || "Member",
        });
      } else {
        setProfile({
          name: user.displayName || "Anonymous",
          avatar:
            user.photoURL ||
            "https://ui-avatars.com/api/?name=" +
              encodeURIComponent(user.displayName || "A"),
          role: "Member",
        });
      }
    });
    return () => unsubscribe();
  }, [user]);
  return profile;
}

// Add a hook to fetch and listen to all user profiles referenced in posts
function useUserProfiles(userIds: string[]) {
  const [profiles, setProfiles] = useState<{ [userId: string]: UserProfile }>(
    {}
  );
  useEffect(() => {
    if (!userIds.length) return;
    const unsubscribes = userIds.map((uid) =>
      onSnapshot(doc(db, "users", uid), (snap) => {
        setProfiles((prev) => ({
          ...prev,
          [uid]: snap.exists()
            ? {
                name: snap.data().name || "Anonymous",
                avatar:
                  snap.data().avatar ||
                  "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(snap.data().name || "A"),
                role: snap.data().role || "Member",
              }
            : prev[uid] || {
                name: "Anonymous",
                avatar: "https://ui-avatars.com/api/?name=A",
                role: "Member",
              },
        }));
      })
    );
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [JSON.stringify(userIds)]);
  return profiles;
}

// Utility: Ensure user profile exists in Firestore
async function ensureUserProfile(user: any) {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const snap = await getDocs(collection(db, "users"));
  // Only create if not exists
  const exists = snap.docs.some((d) => d.id === user.uid);
  if (!exists) {
    await setDoc(userRef, {
      name: user.displayName || user.email || "Anonymous",
      avatar:
        user.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.displayName || user.email || "A"
        )}`,
      role: "Member",
    });
  }
}

// =========================
// Styles
// =========================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginTop: 4,
  },
  feed: {
    flex: 1,
    paddingTop: 8,
  },
  feedContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  postCard: {
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#48BB78",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    fontWeight: "500",
  },
  timestampContainer: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
  },
  postContent: {
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
  },
  commentContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
    paddingTop: 16,
  },
  commentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentText: {
    fontWeight: "500",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  postBtn: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  postBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 12,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mediaButton: {
    padding: 8,
  },
  postImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
  },
});

// =========================
// Main SocialScreen Component
// =========================
export default function SocialScreen() {
  // =========================
  // State Variables
  // =========================
  const colorScheme = useColorScheme();
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPost, setNewPost] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<{ [postId: string]: boolean }>(
    {}
  );
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const flatListRef = useRef<any>(null);
  const textInputRef = useRef<TextInput>(null);

  // Get current user and profile
  const auth = getAuth();
  const user = auth.currentUser;
  const userProfile = useCurrentUserProfile(user);

  // Format timestamp for display
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Just now";

    const now = new Date();
    const postTime = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - postTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Fetch posts from Firebase
  useEffect(() => {
    setLoading(true);
    setError(null);

    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const fetchedPosts: DisplayPost[] = snapshot.docs.map((doc) => {
          const data = doc.data() as Post;
          return {
            id: doc.id,
            userId: data.userId,
            user: {
              name: data.name,
              avatar: data.avatar,
              role: data.role,
            },
            content: data.content,
            timestamp: formatTimestamp(data.createdAt),
            comments: 0,
            likes: 0,
            image: data.image,
          };
        });
        setPosts(fetchedPosts);
        setLoading(false);

        // Listen for comment and like count changes
        fetchedPosts.forEach((post) => {
          // Comments
          const commentsRef = collection(db, "posts", post.id, "comments");
          onSnapshot(commentsRef, (snapshot) => {
            setPosts((prevPosts) => {
              const updated = [...prevPosts];
              const postIndex = updated.findIndex((p) => p.id === post.id);
              if (postIndex !== -1) {
                updated[postIndex] = {
                  ...updated[postIndex],
                  comments: snapshot.size,
                };
              }
              return updated;
            });
          });
          // Likes
          const likesRef = collection(db, "posts", post.id, "likes");
          onSnapshot(likesRef, (snapshot) => {
            setPosts((prevPosts) => {
              const updated = [...prevPosts];
              const postIndex = updated.findIndex((p) => p.id === post.id);
              if (postIndex !== -1) {
                updated[postIndex] = {
                  ...updated[postIndex],
                  likes: snapshot.size,
                };
              }
              return updated;
            });
            // Track if current user liked this post
            setLikedPosts((prev) => ({
              ...prev,
              [post.id]: user
                ? !!snapshot.docs.find((doc) => doc.id === user.uid)
                : false,
            }));
          });
        });
      },
      (err) => {
        console.error("Error fetching posts:", err);
        setError("Failed to fetch posts");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // After posts are loaded, get all unique userIds
  const userIds = Array.from(new Set(posts.map((p) => p.userId)));
  const userProfiles = useUserProfiles(userIds);

  // Handle creating a new post
  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage) {
      setError("Post must contain text or an image");
      return;
    }
    if (!user || !userProfile?.name) {
      setError("User not authenticated. Please log in.");
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      if (!db) {
        throw new Error("Database connection not established");
      }
      await ensureUserProfile(user);
      let imageUrl = "";
      if (selectedImage) {
        setIsImageUploading(true);
        imageUrl = await uploadToCloudinary(selectedImage, "Social_Page");
        setIsImageUploading(false);
      }
      const postData = {
        userId: user.uid,
        name: userProfile.name,
        avatar: userProfile.avatar,
        role: userProfile.role,
        content: newPost.trim(),
        createdAt: serverTimestamp(),
        commentsCount: 0,
        likesCount: 0,
        isHidden: false,
        isPinned: false,
        ...(imageUrl && { image: imageUrl }),
      };
      await addDoc(collection(db, "posts"), postData);
      setNewPost("");
      setSelectedImage(null);
    } catch (err: any) {
      if (err.message === "Request timed out") {
        setError(
          "Network timeout. Please check your connection and try again."
        );
      } else if (err.code === "permission-denied") {
        setError(
          "You don't have permission to create posts. Please log in again."
        );
      } else if (err.code === "unavailable") {
        setError("Service is currently unavailable. Please try again later.");
      } else {
        setError(
          `Failed to create post: ${err.message || "Unknown error occurred"}`
        );
      }
    } finally {
      setIsUploading(false);
      setIsImageUploading(false);
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Delete all comments
      const commentsRef = collection(db, "posts", postId, "comments");
      const commentsSnap = await getDocs(commentsRef);
      const deleteCommentPromises = commentsSnap.docs.map((docSnap) =>
        deleteDoc(doc(db, "posts", postId, "comments", docSnap.id))
      );
      await Promise.all(deleteCommentPromises);
      // Delete all likes
      const likesRef = collection(db, "posts", postId, "likes");
      const likesSnap = await getDocs(likesRef);
      const deleteLikePromises = likesSnap.docs.map((docSnap) =>
        deleteDoc(doc(db, "posts", postId, "likes", docSnap.id))
      );
      await Promise.all(deleteLikePromises);
      // Delete the post itself
      await deleteDoc(doc(db, "posts", postId));
    } catch (err) {
      setError("Failed to delete post and its data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments for a post
  const openComments = (postId: string) => {
    setSelectedPostId(postId);
    setCommentModalVisible(true);
    setCommentLoading(true);
    const commentsRef = collection(db, "posts", postId, "comments");
    const commentsQuery = query(commentsRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        setComments(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setCommentLoading(false);
      },
      (err) => {
        setError("Failed to fetch comments");
        setCommentLoading(false);
      }
    );
    // Clean up on modal close
    return unsubscribe;
  };

  // Add a comment
  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedPostId) return;
    if (!user || !userProfile?.name) {
      setError("User not authenticated. Please log in.");
      return;
    }
    setCommentLoading(true);
    try {
      await addDoc(collection(db, "posts", selectedPostId, "comments"), {
        userId: user.uid,
        name: userProfile.name,
        avatar: userProfile.avatar,
        content: commentInput.trim(),
        createdAt: serverTimestamp(),
      });
      setCommentInput("");
    } catch (err) {
      setError("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  // Like/unlike post
  const handleLikePost = async (postId: string) => {
    if (!user || !userProfile?.name) {
      setError("User not authenticated. Please log in.");
      return;
    }
    try {
      const likeRef = doc(db, "posts", postId, "likes", user.uid);
      if (likedPosts[postId]) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, {
          userId: user.uid,
          name: userProfile.name,
          avatar: userProfile.avatar,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setError("Failed to update like");
    }
  };

  // Delete comment handler
  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPostId) return;
    setCommentLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "posts", selectedPostId, "comments", commentId));
    } catch (err) {
      setError("Failed to delete comment. Please try again.");
    } finally {
      setCommentLoading(false);
    }
  };

  // Image picker function
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      setError("Permission to access photos is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Image removal function
  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleInputFocus = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // =========================
  // Theme Colors
  // =========================
  const themeColors = {
    background: colorScheme === "dark" ? "#0F172A" : "#F8FAFC",
    cardBackground: colorScheme === "dark" ? "#1E293B" : "#FFFFFF",
    text: colorScheme === "dark" ? "#F1F5F9" : "#1E293B",
    textSecondary: colorScheme === "dark" ? "#94A3B8" : "#64748B",
    accent: colorScheme === "dark" ? "#3B82F6" : "#2563EB",
    border: colorScheme === "dark" ? "#334155" : "#E2E8F0",
    headerGradient:
      colorScheme === "dark"
        ? (["#1D4ED8", "#1E40AF"] as const)
        : (["#2563EB", "#1D4ED8"] as const),
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    imageBackground: colorScheme === "dark" ? "#2D3748" : "#EDF2F7",
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  // =========================
  // Render (JSX)
  // =========================
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={{ flex: 1 }}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={themeColors.headerGradient[0]}
        />

        {/* Header */}
        <Animated.View style={{ opacity: headerOpacity }}>
          <LinearGradient
            colors={themeColors.headerGradient}
            style={styles.headerContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Community Feed</Text>
                <Text style={styles.headerSubtitle}>
                  Stay connected & informed
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Feed */}
        <AnimatedFlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.postCard,
                {
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.border,
                },
              ]}
            >
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: item.user.avatar }}
                    style={styles.avatar}
                  />
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.userInfo}>
                  <Text
                    style={[styles.userName, { color: themeColors.text }]}
                  >
                    {item.user.name}
                  </Text>
                  <Text
                    style={[styles.userRole, { color: themeColors.textSecondary }]}
                  >
                    {item.user.role}
                  </Text>
                </View>
                <View style={styles.timestampContainer}>
                  <Text
                    style={[styles.timestamp, { color: themeColors.textSecondary }]}
                  >
                    {item.timestamp}
                  </Text>
                </View>
              </View>

              {/* Post Content */}
              <Text
                style={[styles.postContent, { color: themeColors.text }]}
              >
                {item.content}
              </Text>

              {/* Post Image */}
              {item.image && (
                <Image
                  source={{ uri: item.image }}
                  style={styles.postImage}
                />
              )}

              {/* Comment Section */}
              <View style={styles.commentContainer}>
                <TouchableOpacity
                  style={styles.commentButton}
                  onPress={() => openComments(item.id)}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    color={themeColors.textSecondary}
                  />
                  <Text
                    style={[styles.commentText, { color: themeColors.textSecondary }]}
                  >
                    {item.comments} comments
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.feedContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator size="large" style={{ marginTop: 40 }} />
            ) : error ? (
              <Text style={{ textAlign: "center", color: themeColors.danger }}>
                {error}
              </Text>
            ) : (
              <Text style={{ textAlign: "center", color: themeColors.text }}>
                No posts yet. Be the first to share!
              </Text>
            )
          }
        />

        {/* Input Container - FIXED KEYBOARD ISSUE HERE */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <View style={styles.inputRow}>
            <TouchableOpacity
              onPress={pickImage}
              style={styles.mediaButton}
              disabled={isImageUploading}
            >
              <Ionicons
                name="image-outline"
                size={24}
                color={themeColors.accent}
              />
            </TouchableOpacity>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  borderColor: themeColors.border,
                },
              ]}
              placeholder="Share your thoughts..."
              placeholderTextColor={themeColors.textSecondary}
              value={newPost}
              onChangeText={setNewPost}
              multiline
              onFocus={handleInputFocus}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.postBtn,
              {
                backgroundColor: themeColors.accent,
                opacity: (newPost.trim() || selectedImage) ? 1 : 0.5,
              },
            ]}
            onPress={handleCreatePost}
            disabled={!newPost.trim() && !selectedImage || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Image Preview */}
        {selectedImage && (
          <View
            style={[
              styles.imagePreviewContainer,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreview}
            />
            <TouchableOpacity
              onPress={removeImage}
              style={styles.removeImageButton}
            >
              <Ionicons name="close" size={24} color={themeColors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Comment Modal */}
      <Modal
        animationType="slide"
        visible={commentModalVisible}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: themeColors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderColor: themeColors.border,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "600", color: themeColors.text }}
            >
              Comments
            </Text>
            <Pressable
              onPress={() => {
                setCommentModalVisible(false);
                setSelectedPostId(null);
                setComments([]);
              }}
            >
              <Ionicons name="close" size={24} color={themeColors.text} />
            </Pressable>
          </View>
          {commentLoading ? (
            <ActivityIndicator style={{ margin: 16 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }: { item: any }) => {
                const isOwner = user && item.userId === user.uid;
                return (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      backgroundColor: themeColors.cardBackground,
                      marginVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Image
                      source={{ uri: item.avatar }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        marginRight: 10,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", color: themeColors.text }}>
                        {item.name}
                      </Text>
                      <Text style={{ color: themeColors.text }}>
                        {item.content}
                      </Text>
                    </View>
                    {isOwner && (
                      <TouchableOpacity
                        onPress={() => handleDeleteComment(item.id)}
                        style={{ marginLeft: 8 }}
                      >
                        <Ionicons name="trash" size={18} color={themeColors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text
                  style={{
                    textAlign: "center",
                    color: themeColors.textSecondary,
                    margin: 16,
                  }}
                >
                  No comments yet.
                </Text>
              }
              style={{ padding: 8 }}
            />
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              borderTopWidth: 1,
              borderColor: themeColors.border,
              backgroundColor: themeColors.cardBackground,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: themeColors.border,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginRight: 8,
                color: themeColors.text,
                backgroundColor: themeColors.background,
              }}
              placeholder="Add a comment..."
              placeholderTextColor={themeColors.textSecondary}
              value={commentInput}
              onChangeText={setCommentInput}
              editable={!commentLoading}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!commentInput.trim() || commentLoading}
              style={{ opacity: commentInput.trim() ? 1 : 0.5 }}
            >
              <Ionicons name="send" size={22} color={themeColors.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =========================
// Protected Route Wrapper
// =========================
export function ProtectedSocialScreen() {
  return (
    <ProtectedRoute>
      <SocialScreen />
    </ProtectedRoute>
  );
}