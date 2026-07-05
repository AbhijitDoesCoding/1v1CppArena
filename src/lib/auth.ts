import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import type { UserProfile } from "../types";

const STARTING_ELO = 1000;

// Create a Firestore profile on first login; return it either way.
export async function ensureProfile(uid: string, name: string): Promise<UserProfile> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserProfile;
  const profile: UserProfile = { uid, displayName: name, elo: STARTING_ELO };
  await setDoc(ref, profile);
  return profile;
}

export const emailSignUp = (email: string, pw: string) =>
  createUserWithEmailAndPassword(auth, email, pw);
export const emailSignIn = (email: string, pw: string) =>
  signInWithEmailAndPassword(auth, email, pw);
export const googleSignIn = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
