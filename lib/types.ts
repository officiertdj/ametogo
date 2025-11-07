import { type Timestamp } from "firebase/firestore";

export type ProfileType = 'Amoureuse' | 'Amicale' | 'Professionnelle';

export type UserProfile = {
  id: string; // Firebase Auth UID or seeded ID
  name: string;
  dob: Timestamp | Date;
  age: number;
  city: string;
  gender: 'Homme' | 'Femme' | '';
  passions: string[];
  // This field will store the user's desired type of encounter
  profileTypes: ProfileType[]; 
  bio?: string;
  // This will now store data URIs or real URLs from a storage service
  profilePictureUrls: string[]; 
  accountStatus?: 'active' | 'incomplete' | 'banned';
  matchStatus?: 'matched' | 'pending-them' | 'pending-you' | 'none';
  // photoIds might become deprecated if we only use URLs, but keeping it for now
  // to avoid breaking other parts of the app immediately.
  photoIds: string[]; 
  // Keep track of user's swipes to not show them again
  swipes?: { [key: string]: 'like' | 'pass' };
};

// Represents a potential or confirmed match
export type Match = {
    id: string; // doc id
    userIds: string[]; // array of 2 user UIDs
    // We can see who initiated by comparing userIds[0] to who created the doc
    status: 'pending' | 'matched' | 'rejected';
    createdAt: Timestamp;
};

export type Message = {
  id: string;
  matchId: string;
  senderId: string; // UID of the sender
  recipientId?: string; // UID of the receiver
  text: string;
  timestamp: string | Timestamp;
};

export type Conversation = {
  id: string; // Corresponds to the Match ID
  otherUser: UserProfile; // The other user in the conversation
  lastMessage: Message | null;
  unreadCount: number;
};
