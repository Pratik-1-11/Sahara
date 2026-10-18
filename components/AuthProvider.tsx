import { loginWithEmail, registerWithEmail, signOut as firebaseSignOut } from "@/firebase/authFunctions";
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase, ref, set } from 'firebase/database';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Define a simplified user interface for our app
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL?: string | null;
  phoneNumber?: string | null;
  providerId?: string;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  login: (data: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: { name: string; email: string; password: string; rememberMe?: boolean }) => Promise<void>;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user in AsyncStorage on mount
    const checkUser = async () => {
      setLoading(true);
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log(
        "\ud83d\udd25 Firebase Auth State Changed:",
        firebaseUser ? "User logged in" : "User logged out"
      );
      
      if (firebaseUser) {
        console.log("\ud83d\udc64 User details:", {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        
        // Create a plain object with only the properties we need
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified || false,
          photoURL: firebaseUser.photoURL || null,
          phoneNumber: firebaseUser.phoneNumber || null,
          providerId: firebaseUser.providerData[0]?.providerId || '',
          metadata: {
            lastSignInTime: firebaseUser.metadata.lastSignInTime,
            creationTime: firebaseUser.metadata.creationTime,
          },
        };
        
        setUser(userData);
        // Update AsyncStorage with fresh user data
        AsyncStorage.setItem("user", JSON.stringify(userData)).catch(console.error);
      } else {
        console.log("\ud83d\udeaa User logged out");
        setUser(null);
        AsyncStorage.removeItem("user").catch(console.error);
      }
      setLoading(false);
    });

    checkUser();

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    try {
      setLoading(true);
      const result = await loginWithEmail(data.email, data.password);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (!result.user) {
        throw new Error('No user returned from login');
      }
      
      // The auth state listener will handle updating the user state
      // Just handle the rememberMe preference here
      if (data.rememberMe && result.user) {
        const userData: User = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || null,
          emailVerified: result.user.emailVerified || false,
          photoURL: result.user.photoURL || null,
          phoneNumber: result.user.phoneNumber || null,
          providerId: result.user.providerId || '',
          metadata: {
            creationTime: result.user.metadata?.creationTime,
            lastSignInTime: result.user.metadata?.lastSignInTime
          }
        };
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      }
      
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const result = await firebaseSignOut();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to sign out');
      }
      
      setUser(null);
      await AsyncStorage.removeItem("user");
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async ({
    name,
    email,
    password,
    rememberMe,
  }: {
    name: string;
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<void> => {
    try {
      setLoading(true);
      const result = await registerWithEmail(email, password, name);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (!result.user) {
        throw new Error('No user returned from registration');
      }
      
      const userData: User = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: name,
        emailVerified: result.user.emailVerified || false,
        photoURL: null,
        phoneNumber: null,
        providerId: result.user.providerId || '',
        metadata: {
          creationTime: result.user.metadata?.creationTime,
          lastSignInTime: result.user.metadata?.lastSignInTime
        }
      };
      
      setUser(userData);
      
      if (rememberMe) {
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      }
      
      // Save user data to Firestore instead of Realtime Database
      // This is a placeholder - you'll need to implement Firestore saving separately
      // if needed, as we're using Firestore in this project
      console.log('User registered:', { name, email });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, logout, signup }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
