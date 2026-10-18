import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Post {
  id: string;
  user: { name: string; avatar: string };
  content: string;
  imageUrl: string | null;
  likes: number;
  comments: string[];
}

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    user: { name: "Jane Smith", avatar: "https://i.pravatar.cc/150?img=5" },
    content: "Stay safe everyone!",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    likes: 2,
    comments: ["Thank you!", "You too!"],
  },
  {
    id: "2",
    user: { name: "John Doe", avatar: "https://i.pravatar.cc/150?img=2" },
    content: "Earthquake felt in Kathmandu.",
    imageUrl: null,
    likes: 1,
    comments: [],
  },
];

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [commentText, setCommentText] = useState("");
  const [activePost, setActivePost] = useState<string | null>(null);

  const likePost = (id: string) => {
    setPosts((posts) =>
      posts.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const addComment = (id: string) => {
    if (!commentText.trim()) return;
    setPosts((posts) =>
      posts.map((p) =>
        p.id === id ? { ...p, comments: [...p.comments, commentText] } : p
      )
    );
    setCommentText("");
    setActivePost(null);
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.header}>
            <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
            <Text style={styles.userName}>{item.user.name}</Text>
          </View>
          <Text style={styles.content}>{item.content}</Text>
          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
          )}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => likePost(item.id)}
            >
              <Feather name="heart" size={18} color="#FF4B4B" />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setActivePost(item.id)}
            >
              <Feather name="message-circle" size={18} color="#3B82F6" />
              <Text style={styles.actionText}>{item.comments.length}</Text>
            </TouchableOpacity>
          </View>
          {/* Comments */}
          {item.comments.length > 0 && (
            <View style={styles.commentsSection}>
              {item.comments.map((c, idx) => (
                <Text key={idx} style={styles.commentText}>
                  • {c}
                </Text>
              ))}
            </View>
          )}
          {/* Add Comment */}
          {activePost === item.id && (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={() => addComment(item.id)}>
                <Feather name="send" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  userName: { fontWeight: "bold", fontSize: 15 },
  content: { fontSize: 15, marginBottom: 8 },
  postImage: { width: "100%", height: 180, borderRadius: 10, marginBottom: 8 },
  actions: { flexDirection: "row", marginTop: 6 },
  actionBtn: { flexDirection: "row", alignItems: "center", marginRight: 18 },
  actionText: { marginLeft: 4, color: "#888" },
  commentsSection: {
    marginTop: 8,
    backgroundColor: "#F7F7F7",
    borderRadius: 8,
    padding: 8,
  },
  commentText: { fontSize: 13, color: "#444", marginBottom: 2 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#F2F4F7",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  commentInput: { flex: 1, fontSize: 14, paddingVertical: 6 },
});
