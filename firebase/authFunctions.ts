import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail as sendPasswordReset,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export interface AuthResult {
  user: FirebaseUser | null;
  error: string | null;
}

interface ResetPasswordResult {
  success: boolean;
  error: string | null;
}

export const loginWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const registerWithEmail = async (email: string, password: string, name: string): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update user profile with display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: name,
      });
      
      // Refresh user to get updated profile
      await auth.currentUser?.reload();
      const currentUser = auth.currentUser;
      return { user: currentUser, error: null };
    }
    
    return { user: null, error: 'User creation failed' };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const sendPasswordResetEmail = async (email: string): Promise<ResetPasswordResult> => {
  try {
    await sendPasswordReset(auth, email);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signOut = async (): Promise<{ success: boolean; error: string | null }> => {
  try {
    await firebaseSignOut(auth);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Alias for backward compatibility
export const resetPassword = sendPasswordResetEmail;
