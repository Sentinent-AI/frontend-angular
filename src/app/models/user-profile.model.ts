export interface UserProfile {
  fullName: string;
  email: string;
  jobTitle: string;
  organization: string;
  timezone: string;
  bio: string;
  roleLabel: string;
}

export type UserProfileUpdate = Omit<UserProfile, 'email'>;
